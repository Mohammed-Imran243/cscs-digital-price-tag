package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.LoginRequest;
import com.cscs.digitalpricetag.dto.LoginResponse;
import com.cscs.digitalpricetag.dto.UserInfoResponse;
import com.cscs.digitalpricetag.dto.RolePermissionTreeDto;
import com.cscs.digitalpricetag.dto.RoleMenuItemDto;
import com.cscs.digitalpricetag.util.JwtUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final DragonTokenManager dragonTokenManager;
    private final JwtUtil jwtUtil;
    private final DragonAuthService dragonAuthService;
    private final UserService userService;
    private final RoleService roleService;

    public AuthService(DragonTokenManager dragonTokenManager,
                      JwtUtil jwtUtil,
                      DragonAuthService dragonAuthService,
                      UserService userService,
                      RoleService roleService) {
        this.dragonTokenManager = dragonTokenManager;
        this.jwtUtil = jwtUtil;
        this.dragonAuthService = dragonAuthService;
        this.userService = userService;
        this.roleService = roleService;
    }

    /**
     * Login flow:
     * 1. Authenticate credentials against Zkong Cloud via DragonAuthService.
     * 2. Perform a temporary authorization in SecurityContextHolder to query user role & permissions.
     * 3. Fetch user details and role permissions from Zkong, mapping allowed menus.
     * 4. Enforce a single active session per user by registering the JWT in the active sessions registry.
     * 5. Return local JWT along with role, permissions, and expiration.
     */
    public LoginResponse login(LoginRequest request) {
        // Step 1: Authenticate strictly against Zkong Cloud using valid ESL credentials
        String dragonToken = dragonAuthService.login(request.getUsername(), request.getPassword());

        // Update system token cache if this is the system user to keep them in sync
        if (request.getUsername().equalsIgnoreCase(dragonTokenManager.getUsername())) {
            dragonTokenManager.setToken(dragonToken);
        }

        String roleName = "Merchant Super Admin";
        java.util.List<String> permissions = new java.util.ArrayList<>();

        try {
            // Step 3: Fetch the user's role and menu list from Zkong using the shared system admin credentials
            // (this avoids 'permission denied' errors for staff users who cannot list users directly)
            Object userListData = userService.listUsers(1, 100);
            if (userListData instanceof java.util.Map) {
                java.util.Map<?, ?> map = (java.util.Map<?, ?>) userListData;
                Object listObj = map.get("list");
                if (listObj == null) listObj = map.get("userRoleStoreList");
                if (listObj == null) listObj = map.get("userVos");
                if (listObj instanceof java.util.List) {
                    java.util.List<?> list = (java.util.List<?>) listObj;
                    for (Object item : list) {
                        if (item instanceof java.util.Map) {
                            java.util.Map<?, ?> outerMap = (java.util.Map<?, ?>) item;
                            java.util.Map<?, ?> userMap = outerMap.containsKey("user") ? (java.util.Map<?, ?>) outerMap.get("user") : outerMap;
                            String account = (String) userMap.get("account");
                            if (account != null && account.equalsIgnoreCase(request.getUsername())) {
                                Object roleIdObj = userMap.get("roleId");
                                String rName = outerMap.containsKey("roleName") ? (String) outerMap.get("roleName") : (String) userMap.get("roleName");
                                if (rName != null && !rName.isBlank()) {
                                    roleName = rName;
                                }

                                if (roleIdObj != null) {
                                    String roleIdStr = roleIdObj.toString();
                                    // Query menu permissions for this role
                                    // getPermissions() returns RolePermissionTreeDto — use typed API directly
                                    RolePermissionTreeDto permTree = roleService.getPermissions(roleIdStr);
                                    org.slf4j.Logger authLog = org.slf4j.LoggerFactory.getLogger(AuthService.class);
                                    authLog.info("LOGIN DEBUG — user: {}, roleId: {}, roleName: {}", request.getUsername(), roleIdStr, roleName);
                                    if (permTree != null && permTree.getList() != null) {
                                        authLog.info("LOGIN DEBUG — permission tree has {} items", permTree.getList().size());
                                        for (com.cscs.digitalpricetag.dto.RoleMenuItemDto dbgItem : permTree.getList()) {
                                            authLog.info("LOGIN DEBUG — menuItem: id={}, name={}, url={}, level={}", 
                                                dbgItem.getId(), dbgItem.getMenuName(), dbgItem.getZkUrl(), dbgItem.getLevel());
                                        }
                                        for (RoleMenuItemDto menuItem : permTree.getList()) {
                                            String menuName = menuItem.getMenuName();
                                            String zkUrl    = menuItem.getZkUrl() != null ? menuItem.getZkUrl() : "";
                                            Integer menuId  = menuItem.getId();

                                            if (menuName != null && !menuName.isBlank()) {
                                                permissions.add(menuName);
                                                String lowerName = menuName.toLowerCase();
                                                String lowerUrl  = zkUrl.toLowerCase();

                                                // ── store ──────────────────────────────────────
                                                if (lowerName.contains("store")
                                                        || lowerName.contains("merchant store")
                                                        || lowerUrl.contains("/store")
                                                        || lowerUrl.contains("storepro")
                                                        || lowerUrl.contains("/shop")) {
                                                    permissions.add("store");
                                                }

                                                // ── product ────────────────────────────────────
                                                if (lowerName.contains("product")
                                                        || lowerName.contains("commodity")
                                                        || lowerName.contains("merchandise")
                                                        || lowerName.contains("item")
                                                        || lowerUrl.contains("/product")
                                                        || lowerUrl.contains("merchantpro")
                                                        || lowerUrl.contains("storepro")) {
                                                    permissions.add("product");
                                                }

                                                // ── template ───────────────────────────────────
                                                if (lowerName.contains("template")
                                                        || lowerName.contains("label")
                                                        || lowerName.contains("display")
                                                        || lowerUrl.contains("/template")
                                                        || lowerUrl.contains("templatepro")
                                                        || lowerUrl.contains("/label")) {
                                                    permissions.add("template");
                                                }

                                                // ── equipment / devices ────────────────────────
                                                // NOTE: Use exact segment checks to avoid partial matches
                                                // e.g. "/template/merchantTemplate" contains "ap" → must use "/ap/" or "/ap" at segment boundary
                                                if (lowerName.equals("equipment")
                                                        || lowerName.contains("device")
                                                        || lowerName.equals("esl")
                                                        || lowerName.contains("eslequipment")
                                                        || lowerName.contains("apequipment")
                                                        || lowerName.contains("access point")
                                                        || lowerName.contains("price tag")
                                                        || lowerUrl.equals("/equipment/eslequipment")
                                                        || lowerUrl.equals("/equipment/apequipment")
                                                        || lowerUrl.equals("/equipment/lcdequipment")
                                                        || lowerUrl.startsWith("/equipment/")) {
                                                    permissions.add("equipment");
                                                }

                                                // ── log / audit ────────────────────────────────
                                                if (lowerName.contains("log")
                                                        || lowerName.contains("audit")
                                                        || lowerName.contains("history")
                                                        || lowerUrl.contains("/log")
                                                        || lowerUrl.contains("/audit")) {
                                                    permissions.add("log");
                                                }

                                                // ── staffManager / user management ─────────────
                                                if (lowerName.contains("staff")
                                                        || lowerName.contains("user")
                                                        || lowerName.contains("operator")
                                                        || lowerName.contains("employee")
                                                        || lowerName.contains("personnel")
                                                        || lowerUrl.contains("/staff")
                                                        || lowerUrl.contains("/user")
                                                        || lowerUrl.contains("staffmanager")) {
                                                    permissions.add("staffManager");
                                                }
                                            }

                                            // ── Map by menu ID for reliability ─────────────────
                                            if (menuId != null) {
                                                switch (menuId) {
                                                    // ── Core module IDs ──
                                                    case 133 -> permissions.add("equipment");
                                                    case 134 -> permissions.add("log");
                                                    case 135 -> permissions.add("product");
                                                    case 136 -> permissions.add("template");
                                                    case 138 -> permissions.add("store");
                                                    case 139 -> permissions.add("staffManager");
                                                    // ── Sub-item IDs ──
                                                    case 137 -> permissions.add("product");
                                                    case 140 -> permissions.add("store");
                                                    case 144 -> permissions.add("template");
                                                    case 145 -> permissions.add("equipment");
                                                    // ── Extended IDs seen in DragonESL ──
                                                    case 141 -> permissions.add("staffManager");
                                                    case 142 -> permissions.add("staffManager");
                                                    case 143 -> permissions.add("log");
                                                    case 146 -> permissions.add("equipment");
                                                    case 147 -> permissions.add("equipment");
                                                    case 148 -> permissions.add("equipment");
                                                    case 149 -> permissions.add("store");
                                                    case 150 -> permissions.add("product");
                                                    case 309 -> permissions.add("equipment");
                                                    case 311 -> permissions.add("equipment");
                                                    // ── Parent/root menu IDs ──
                                                    case 1   -> { permissions.add("product"); permissions.add("store"); }
                                                    case 2   -> { permissions.add("equipment"); }
                                                    case 3   -> { permissions.add("template"); }
                                                    case 4   -> { permissions.add("log"); }
                                                    default  -> { /* no mapping needed */ }
                                                }
                                            }
                                        }
                                    } else {
                                        authLog.warn("LOGIN DEBUG — permTree is null or empty for user: {}", request.getUsername());
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuthService.class)
                    .warn("Failed to fetch user role/permissions from Zkong (defaulting to full access): {}", e.getMessage());
        } finally {
            SecurityContextHolder.clearContext();
        }

        // Default to all permissions if no menu mapping was retrieved AND user is the main super admin
        if (permissions.isEmpty() && request.getUsername().equalsIgnoreCase("DG0358")) {
            permissions = java.util.List.of("product", "store", "equipment", "system", "log", "staffManager", "template", "alarm", "statistics", "material");
        }

        // Step 4: Generate local JWT and register the session for single-session invalidation
        // Deduplicate permissions to keep JWT compact
        java.util.List<String> dedupedPermissions = new java.util.ArrayList<>(new java.util.LinkedHashSet<>(permissions));
        org.slf4j.LoggerFactory.getLogger(AuthService.class)
            .info("LOGIN DEBUG — final permissions for {}: {}", request.getUsername(), dedupedPermissions);
        String jwt = jwtUtil.generateToken(request.getUsername(), dragonToken, dedupedPermissions, roleName);
        jwtUtil.registerSession(request.getUsername(), jwt);

        return new LoginResponse(jwt, request.getUsername(), roleName, jwtUtil.getExpirationMs(), dedupedPermissions);
    }

    /**
     * Extract user info from JWT.
     * Used by GET /api/auth/me.
     */
    public UserInfoResponse getMe(String bearerToken) {
        String token = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7)
                : bearerToken;
        String username = jwtUtil.extractUsername(token);
        return new UserInfoResponse(username, true);
    }
}