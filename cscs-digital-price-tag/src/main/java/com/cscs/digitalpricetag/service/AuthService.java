package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.LoginRequest;
import com.cscs.digitalpricetag.dto.LoginResponse;
import com.cscs.digitalpricetag.dto.UserInfoResponse;
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

        // Step 2: Establish a temporary security context with the new token to fetch roles
        UsernamePasswordAuthenticationToken tempAuth = new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                dragonToken,
                java.util.Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(tempAuth);

        try {
            // Step 3: Fetch the user's role and menu list from Zkong
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
                                    Object permData = roleService.getPermissions(roleIdStr);
                                    if (permData instanceof java.util.Map) {
                                        java.util.Map<?, ?> permMap = (java.util.Map<?, ?>) permData;
                                        Object permListObj = permMap.get("list");
                                        if (permListObj instanceof java.util.List) {
                                            java.util.List<?> permList = (java.util.List<?>) permListObj;
                                            for (Object pItem : permList) {
                                                if (pItem instanceof java.util.Map) {
                                                    java.util.Map<?, ?> pMap = (java.util.Map<?, ?>) pItem;
                                                    String menuName = (String) pMap.get("menuName");
                                                    if (menuName != null && !menuName.isBlank()) {
                                                        permissions.add(menuName);
                                                        String lower = menuName.toLowerCase();
                                                        if (lower.contains("store") || lower.contains("门店")) {
                                                            permissions.add("store");
                                                        }
                                                        if (lower.contains("product") || lower.contains("商品") || lower.contains("item")) {
                                                            permissions.add("product");
                                                        }
                                                        if (lower.contains("template") || lower.contains("模板")) {
                                                            permissions.add("template");
                                                        }
                                                        if (lower.contains("device") || lower.contains("equipment") || lower.contains("ap") || lower.contains("标签") || lower.contains("基站")) {
                                                            permissions.add("equipment");
                                                        }
                                                        if (lower.contains("log") || lower.contains("日志")) {
                                                            permissions.add("log");
                                                        }
                                                        if (lower.contains("user") || lower.contains("staff") || lower.contains("role") || lower.contains("员工") || lower.contains("用户") || lower.contains("角色")) {
                                                            permissions.add("staffManager");
                                                        }
                                                    }
                                                }
                                            }
                                        }
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
        String jwt = jwtUtil.generateToken(
                request.getUsername(),
                dragonToken,
                permissions,
                roleName
        );
        jwtUtil.registerSession(request.getUsername(), jwt);

        return new LoginResponse(jwt, request.getUsername(), roleName, jwtUtil.getExpirationMs(), permissions);
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