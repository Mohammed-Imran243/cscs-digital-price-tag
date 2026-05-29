package com.cscs.digitalpricetag.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateRoleRequestDto {
    private String roleName;
    private List<Integer> menuIdList;
    private String id; // Optional, used for update

    public CreateRoleRequestDto() {}

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public List<Integer> getMenuIdList() { return menuIdList; }
    public void setMenuIdList(List<Integer> menuIdList) { this.menuIdList = menuIdList; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
}
