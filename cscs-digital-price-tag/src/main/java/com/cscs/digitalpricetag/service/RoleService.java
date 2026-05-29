package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.config.DragonEslProperties;
import com.cscs.digitalpricetag.dto.CreateRoleRequestDto;
import com.cscs.digitalpricetag.dto.RoleMenuItemDto;
import com.cscs.digitalpricetag.dto.RolePermissionTreeDto;
import com.cscs.digitalpricetag.dto.dragon.DragonTemplateGenericResponse;
import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);
    private final DragonEslApiClient dragonEslApiClient;
    private final DragonEslProperties properties;

    // Cache entry for in-memory caching
    private static class CacheEntry<T> {
        private final T value;
        private final long expiryTime;

        public CacheEntry(T value, long ttlMs) {
            this.value = value;
            this.expiryTime = System.currentTimeMillis() + ttlMs;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }

        public T getValue() {
            return value;
        }
    }

    private final ConcurrentHashMap<String, CacheEntry<RolePermissionTreeDto>> permissionCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

    // Optimistic pending-role cache: name → timestamp created.
    // ZKong queryRoleList can take 60+ seconds to reflect newly created roles.
    // We hold newly created role names here until ZKong's list confirms them.
    private final ConcurrentHashMap<String, Long> pendingRoles = new ConcurrentHashMap<>();
    private static final long PENDING_TTL_MS = 5 * 60 * 1000; // 5 minutes max hold

    public RoleService(DragonEslApiClient dragonEslApiClient, DragonEslProperties properties) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.properties = properties;
    }

    public RolePermissionTreeDto getPermissions(String roleId) {
        String id = (roleId != null && !roleId.isBlank()) ? roleId : "3";
        String cacheKey = "permissions_" + id;

        CacheEntry<RolePermissionTreeDto> cached = permissionCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            log.info("Returning cached permissions for roleId: {}", id);
            return cached.getValue();
        }

        try {
            Object rawResponse = performGet("/zk/role/queryOneRole?roleId=" + id);
            RolePermissionTreeDto treeDto = mapToPermissionTreeDto(rawResponse);
            permissionCache.put(cacheKey, new CacheEntry<>(treeDto, CACHE_TTL_MS));
            return treeDto;
        } catch (Exception e) {
            log.error("Failed to fetch permissions for roleId: {}, attempting to use expired cache fallback: {}", id, e.getMessage());
            if (cached != null) {
                log.warn("Returning expired cache entry for roleId: {} as fallback", id);
                return cached.getValue();
            }
            throw e;
        }
    }

    public Object listRoles(int pageNum, int pageSize) {
        // ZKong queryRoleList only needs merchantId — no pagination params.
        // Sending pageNum/pageSize causes ZKong to paginate and newly-created roles
        // may not appear in the first page due to server-side caching.
        Map<String, Object> body = new HashMap<>();
        if (properties.getMerchantId() != null) {
            body.put("merchantId", properties.getMerchantId());
        }
        Object rawResponse = performPost("/zk/role/queryRoleList", body);
        return mergeWithPendingRoles(normalizeResponse(rawResponse));
    }

    /**
     * Merges ZKong's role list with our optimistic pending-role cache.
     * Roles that ZKong now returns are promoted (removed from pending).
     * Roles still pending but not yet in ZKong's list are injected with id=-1.
     * Expired pending entries (> PENDING_TTL_MS) are also evicted.
     */
    @SuppressWarnings("unchecked")
    private Object mergeWithPendingRoles(Object response) {
        if (pendingRoles.isEmpty()) return response;

        // Evict expired pending entries
        long now = System.currentTimeMillis();
        pendingRoles.entrySet().removeIf(e -> (now - e.getValue()) > PENDING_TTL_MS);
        if (pendingRoles.isEmpty()) return response;

        // Work with the list — it may be a List directly or wrapped in a Map
        List<Map<String, Object>> roles = null;
        boolean isWrapped = false;
        Map<String, Object> wrapper = null;

        if (response instanceof List) {
            roles = (List<Map<String, Object>>) response;
        } else if (response instanceof Map) {
            wrapper = (Map<String, Object>) response;
            isWrapped = true;
            Object listObj = wrapper.get("list");
            if (listObj instanceof List) {
                roles = (List<Map<String, Object>>) listObj;
            }
        }

        if (roles == null) return response;

        // Promote pending roles that now appear in ZKong's list
        Set<String> zkNames = new HashSet<>();
        for (Map<String, Object> role : roles) {
            Object nameObj = role.get("name");
            if (nameObj != null) zkNames.add(nameObj.toString());
        }
        pendingRoles.keySet().removeIf(zkNames::contains);

        // Inject remaining pending roles with temporary id=-1
        List<Map<String, Object>> merged = new ArrayList<>(roles);
        for (String pendingName : pendingRoles.keySet()) {
            if (!zkNames.contains(pendingName)) {
                Map<String, Object> synthetic = new LinkedHashMap<>();
                synthetic.put("id", -1);
                synthetic.put("name", pendingName);
                synthetic.put("status", 1);
                synthetic.put("isAble", 1);
                synthetic.put("_pending", true); // flag for client awareness
                merged.add(synthetic);
                log.info("Injecting pending role '{}' into list response (ZKong not yet propagated)", pendingName);
            }
        }

        if (isWrapped && wrapper != null) {
            wrapper.put("list", merged);
            return wrapper;
        }
        return merged;
    }

    public Object addRole(CreateRoleRequestDto request) {
        log.info("Incoming addRole request - Name: {}, Permissions: {}", request.getRoleName(), request.getMenuIdList());
        // 1. Validation
        validateRoleRequest(request);

        // 2. Least-privilege ancestor enrichment
        enrichMenuIdList(request);

        // 3. Log comparison details
        logComparisonDetails(request);

        // 4. Construct browser-matched payload for ZKong
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("roleName", request.getRoleName());
        payload.put("menuListIds", request.getMenuIdList());
        payload.put("merchantId", properties.getMerchantId() != null ? properties.getMerchantId() : 1775639851383L);
        payload.put("isZong", 0);
        payload.put("isBack", 1);
        payload.put("isDefault", 0);
        payload.put("isAble", 1);
        payload.put("status", 1);

        // 5. Perform Post
        Object result = performPost("/zk/role/addRole", payload);

        // 6. Register in optimistic pending cache so listRoles returns it immediately
        // ZKong can take 60+ seconds to propagate a new role to queryRoleList
        pendingRoles.put(request.getRoleName(), System.currentTimeMillis());
        log.info("Role '{}' added to optimistic pending cache (ZKong propagation pending)", request.getRoleName());

        // 7. Audit Logging
        auditLog("CREATE_ROLE", request.getRoleName(), request.getMenuIdList());

        return result;
    }

    public Object updateRole(String id, CreateRoleRequestDto request) {
        request.setId(id);
        log.info("Incoming updateRole request - ID: {}, Name: {}, Permissions: {}", id, request.getRoleName(), request.getMenuIdList());
        // 1. Validation
        validateRoleRequest(request);

        // 2. Least-privilege ancestor enrichment
        enrichMenuIdList(request);

        // 3. Log comparison details
        logComparisonDetails(request);

        // 4. Construct browser-matched payload for ZKong
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("roleId", Long.parseLong(id));
        payload.put("roleName", request.getRoleName());
        payload.put("menuListIds", request.getMenuIdList());
        payload.put("merchantId", properties.getMerchantId() != null ? properties.getMerchantId() : 1775639851383L);
        payload.put("isZong", 0);
        payload.put("isBack", 1);
        payload.put("isDefault", 0);
        payload.put("isAble", 1);
        payload.put("status", 1);

        // 5. Perform Post
        Object result = performPost("/zk/role/updateRole", payload);

        // 6. Audit Logging
        auditLog("UPDATE_ROLE", request.getRoleName(), request.getMenuIdList());

        return result;
    }

    public Object deleteRole(String id) {
        Object result = performPost("/zk/role/delRole?roleId=" + id, new HashMap<>());

        // Also clear any pending entry matching this ID (in case it was synthetic id=-1)
        // We match by iterating pending names — no name-by-id lookup needed since
        // the UI will only delete confirmed ZKong roles (id != -1)
        log.info("Role ID {} deleted; pending cache has {} entries", id, pendingRoles.size());

        // Audit Logging
        auditLog("DELETE_ROLE", "ID: " + id, null);

        return result;
    }

    /**
     * Pre-flight validation logic to avoid passing invalid payloads to Dragon ESL.
     */
    private void validateRoleRequest(CreateRoleRequestDto request) {
        if (request.getRoleName() == null || request.getRoleName().trim().isEmpty()) {
            throw new DragonEslException("Role name cannot be empty", HttpStatus.BAD_REQUEST);
        }
        if (request.getMenuIdList() == null || request.getMenuIdList().isEmpty()) {
            throw new DragonEslException("Menu permissions list cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // Check duplicate IDs
        Set<Integer> uniqueIds = new HashSet<>(request.getMenuIdList());
        if (uniqueIds.size() < request.getMenuIdList().size()) {
            throw new DragonEslException("Duplicate menu IDs are not allowed", HttpStatus.BAD_REQUEST);
        }

        // Fetch valid permission tree from role 3 (Super Admin/Manager)
        RolePermissionTreeDto validTree = getPermissions("3");
        Set<Integer> validIds = new HashSet<>();
        for (RoleMenuItemDto item : validTree.getList()) {
            validIds.add(item.getId());
        }

        // Check if all selected IDs exist in the tree
        for (Integer id : request.getMenuIdList()) {
            if (!validIds.contains(id)) {
                throw new DragonEslException("Invalid menu ID: " + id, HttpStatus.BAD_REQUEST);
            }
        }
    }

    /**
     * Auto-adds ONLY the required parent hierarchy for selected items.
     * Preserves least-privilege behavior; does not auto-select child permissions.
     */
    private void enrichMenuIdList(CreateRoleRequestDto request) {
        log.info("Enriching menuIdList for role request: {}", request.getRoleName());
        RolePermissionTreeDto validTree = getPermissions("3");

        Map<Integer, Integer> parentMap = new HashMap<>();
        for (RoleMenuItemDto item : validTree.getList()) {
            if (item.getId() != null) {
                parentMap.put(item.getId(), item.getParentId() != null ? item.getParentId() : 0);
            }
        }

        Set<Integer> enrichedMenuIds = new HashSet<>(request.getMenuIdList());

        // Add ancestor chain
        for (Integer id : request.getMenuIdList()) {
            int currentParent = parentMap.getOrDefault(id, 0);
            while (currentParent > 0) {
                enrichedMenuIds.add(currentParent);
                currentParent = parentMap.getOrDefault(currentParent, 0);
            }
        }

        log.info("Enriched menuIdList from {} to {}", request.getMenuIdList(), enrichedMenuIds);
        request.setMenuIdList(new ArrayList<>(enrichedMenuIds));
    }

    /**
     * Map generic JSON data into RolePermissionTreeDto.
     */
    @SuppressWarnings("unchecked")
    private RolePermissionTreeDto mapToPermissionTreeDto(Object data) {
        if (!(data instanceof Map)) {
            throw new DragonEslException("Invalid response data format from Dragon ESL", HttpStatus.BAD_GATEWAY);
        }

        Map<String, Object> map = (Map<String, Object>) data;
        RolePermissionTreeDto dto = new RolePermissionTreeDto();
        dto.setRoleName((String) map.get("roleName"));
        dto.setMenuIdList((List<Integer>) map.get("menuIdList"));

        List<RoleMenuItemDto> menuItems = new ArrayList<>();
        Object listObj = map.get("list");
        if (listObj instanceof List) {
            List<Map<String, Object>> list = (List<Map<String, Object>>) listObj;
            for (Map<String, Object> itemMap : list) {
                RoleMenuItemDto item = new RoleMenuItemDto();
                item.setId((Integer) itemMap.get("id"));
                item.setParentId((Integer) itemMap.get("pid")); // Map 'pid' to parentId
                item.setMenuName((String) itemMap.get("menuName"));
                item.setLevel((Integer) itemMap.get("level"));
                item.setZkUrl((String) itemMap.get("zkUrl"));
                menuItems.add(item);
            }
        }
        dto.setList(menuItems);
        return dto;
    }

    /**
     * Normalizes inconsistent Dragon ESL API responses (such as rows/total formats).
     */
    @SuppressWarnings("unchecked")
    private Object normalizeResponse(Object response) {
        if (response instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) response;
            // If response has rows but not list, rename rows to list
            if (map.containsKey("rows") && !map.containsKey("list")) {
                map.put("list", map.get("rows"));
            }
            // If response has total but not totalElements, rename total to totalElements
            if (map.containsKey("total") && !map.containsKey("totalElements")) {
                map.put("totalElements", map.get("total"));
            }
        }
        return response;
    }

    /**
     * Audit Log Event details. Prints structured log that log aggregators capture as storage.
     */
    private void auditLog(String action, String roleName, Object details) {
        String actor = "system";
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                actor = auth.getName();
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve actor from security context: {}", e.getMessage());
        }
        log.info("AUDIT LOG — Timestamp: {}, Actor: {}, Action: {}, Role: {}, Details: {}",
                Instant.now(), actor, action, roleName, details);
    }

    private Object performGet(String url) {
        try {
            log.info("Performing GET request to: {}", url);
            DragonTemplateGenericResponse response = dragonEslApiClient.get(
                    url,
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("GET failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on GET {}: {}", url, e.getMessage());
            throw new DragonEslException("GET request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Object performPost(String url, Object requestBody) {
        try {
            log.info("Performing POST request to: {}", url);
            DragonTemplateGenericResponse response = dragonEslApiClient.post(
                    url,
                    requestBody != null ? requestBody : new HashMap<>(),
                    DragonTemplateGenericResponse.class
            );
            if (response == null || !response.isSuccess()) {
                String msg = response != null ? response.getMessage() : "No response";
                throw new DragonEslException("POST failed: " + msg, HttpStatus.BAD_GATEWAY);
            }
            return response.getData() != null ? response.getData() : response;
        } catch (DragonEslException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error on POST {}: {}", url, e.getMessage());
            throw new DragonEslException("POST request failed: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Map<String, Object> getDebugTree(String roleId) {
        RolePermissionTreeDto masterTree = getPermissions("3");
        RolePermissionTreeDto targetRole = getPermissions(roleId);

        Set<Integer> activeIds = new HashSet<>();
        if (targetRole.getList() != null) {
            for (RoleMenuItemDto item : targetRole.getList()) {
                if (item.getId() != null) {
                    activeIds.add(item.getId());
                }
            }
        }

        // Build list of all debug tree nodes
        Map<Integer, DebugTreeNode> nodeMap = new LinkedHashMap<>();
        for (RoleMenuItemDto item : masterTree.getList()) {
            if (item.getId() != null) {
                DebugTreeNode node = new DebugTreeNode(
                    item.getId(),
                    item.getParentId() != null ? item.getParentId() : 0,
                    item.getMenuName(),
                    item.getLevel(),
                    item.getZkUrl(),
                    activeIds.contains(item.getId())
                );
                nodeMap.put(item.getId(), node);
            }
        }

        // Wire children relationships
        List<DebugTreeNode> rootNodes = new ArrayList<>();
        for (DebugTreeNode node : nodeMap.values()) {
            if (node.getParentId() == 0 || !nodeMap.containsKey(node.getParentId())) {
                rootNodes.add(node);
            } else {
                DebugTreeNode parent = nodeMap.get(node.getParentId());
                parent.getChildren().add(node);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("roleName", targetRole.getRoleName());
        result.put("roleId", roleId);
        result.put("flattenedMenuIdList", new ArrayList<>(activeIds));
        result.put("hierarchicalTree", rootNodes);
        return result;
    }

    private void logComparisonDetails(CreateRoleRequestDto request) {
        try {
            log.info("--- ROLE CREATION ANALYSIS FOR: {} ---", request.getRoleName());
            log.info("Generated Menu IDs: {}", request.getMenuIdList());
            
            // Get working role 147 details to compare
            RolePermissionTreeDto role147 = getPermissions("147");
            Set<Integer> workingIds = new HashSet<>();
            if (role147.getList() != null) {
                for (RoleMenuItemDto item : role147.getList()) {
                    if (item.getId() != null) workingIds.add(item.getId());
                }
            }

            Set<Integer> generatedIds = new HashSet<>(request.getMenuIdList());

            List<Integer> matches = new ArrayList<>();
            List<Integer> extraInGenerated = new ArrayList<>();
            List<Integer> missingFromWorking = new ArrayList<>();

            for (Integer id : generatedIds) {
                if (workingIds.contains(id)) {
                    matches.add(id);
                } else {
                    extraInGenerated.add(id);
                }
            }

            for (Integer id : workingIds) {
                if (!generatedIds.contains(id)) {
                    missingFromWorking.add(id);
                }
            }

            log.info("Comparison against working Role 147 (Test Store Manager):");
            log.info("  Matching permissions: {}", matches);
            log.info("  Extra permissions in generated: {}", extraInGenerated);
            log.info("  Missing permissions present in Role 147: {}", missingFromWorking);
            
            // Analyze tree hierarchy structure
            RolePermissionTreeDto masterTree = getPermissions("3");
            Map<Integer, RoleMenuItemDto> masterMap = new HashMap<>();
            for (RoleMenuItemDto item : masterTree.getList()) {
                if (item.getId() != null) masterMap.put(item.getId(), item);
            }

            log.info("Hierarchy analysis of generated role:");
            for (Integer id : generatedIds) {
                RoleMenuItemDto item = masterMap.get(id);
                if (item != null) {
                    log.info("  Node ID: {}, Name: {}, Level: {}, Parent ID: {}, URL: {}",
                            item.getId(), item.getMenuName(), item.getLevel(), item.getParentId(), item.getZkUrl());
                }
            }
            log.info("-------------------------------------------------");
        } catch (Exception e) {
            log.warn("Failed to log role comparison details: {}", e.getMessage());
        }
    }

    public static class DebugTreeNode {
        private Integer id;
        private Integer parentId;
        private String menuName;
        private Integer level;
        private String zkUrl;
        private boolean active;
        private List<DebugTreeNode> children = new ArrayList<>();

        public DebugTreeNode(Integer id, Integer parentId, String menuName, Integer level, String zkUrl, boolean active) {
            this.id = id;
            this.parentId = parentId;
            this.menuName = menuName;
            this.level = level;
            this.zkUrl = zkUrl;
            this.active = active;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public Integer getParentId() { return parentId; }
        public void setParentId(Integer parentId) { this.parentId = parentId; }

        public String getMenuName() { return menuName; }
        public void setMenuName(String menuName) { this.menuName = menuName; }

        public Integer getLevel() { return level; }
        public void setLevel(Integer level) { this.level = level; }

        public String getZkUrl() { return zkUrl; }
        public void setZkUrl(String zkUrl) { this.zkUrl = zkUrl; }

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }

        public List<DebugTreeNode> getChildren() { return children; }
        public void setChildren(List<DebugTreeNode> children) { this.children = children; }
    }
}
