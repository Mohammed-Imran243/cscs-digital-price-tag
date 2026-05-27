package com.cscs.digitalpricetag.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RoleMenuItemDto {
    private Integer id;
    
    @JsonProperty("pid")
    private Integer parentId;
    
    private String menuName;
    private Integer level;
    private String zkUrl;

    public RoleMenuItemDto() {}

    public RoleMenuItemDto(Integer id, Integer parentId, String menuName, Integer level, String zkUrl) {
        this.id = id;
        this.parentId = parentId;
        this.menuName = menuName;
        this.level = level;
        this.zkUrl = zkUrl;
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
}
