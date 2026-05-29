package com.cscs.digitalpricetag.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RolePermissionTreeDto {
    private String roleName;
    private List<RoleMenuItemDto> list;
    private List<Integer> menuIdList;

    public RolePermissionTreeDto() {}

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public List<RoleMenuItemDto> getList() { return list; }
    public void setList(List<RoleMenuItemDto> list) { this.list = list; }

    public List<Integer> getMenuIdList() { return menuIdList; }
    public void setMenuIdList(List<Integer> menuIdList) { this.menuIdList = menuIdList; }
}
