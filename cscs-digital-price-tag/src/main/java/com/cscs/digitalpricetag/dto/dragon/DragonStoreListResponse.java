package com.cscs.digitalpricetag.dto.dragon;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Maps the raw Dragon ESL response from:
 * POST /zk/store/list  (store listing endpoint)
 *
 * Dragon ESL envelope:
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": {
 *     "total": 5,
 *     "list": [ { ... }, { ... } ]
 *   }
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DragonStoreListResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("data")
    private DragonStoreData data;

    // ── Getters & Setters ───────────────────────────────────────────────────

    public Integer getCode() { return code; }
    public void setCode(Integer code) { this.code = code; }

    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }

    public DragonStoreData getData() { return data; }
    public void setData(DragonStoreData data) { this.data = data; }

    public boolean isSuccess() {
        return code != null && (code == 10000 || code == 200);
    }

    // ── Nested: data wrapper ────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonStoreData {

        @JsonProperty("total")
        private Long total;

        @JsonProperty("list")
        private List<DragonStoreItem> list;

        public Long getTotal() { return total != null ? total : 0L; }
        public void setTotal(Long total) { this.total = total; }

        public List<DragonStoreItem> getList() { return list; }
        public void setList(List<DragonStoreItem> list) { this.list = list; }
    }

    // ── Nested: individual store item ───────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DragonStoreItem {

        @JsonProperty("id")
        private String id;

        @JsonProperty("storeId")
        private Long storeId;

        @JsonProperty("storeName")
        private String storeName;

        @JsonProperty("externalStoreId")
        private String externalStoreId;

        @JsonProperty("address")
        private String address;

        @JsonProperty("status")
        private Integer status;

        @JsonProperty("agencyId")
        private Long agencyId;

        @JsonProperty("merchantId")
        private Long merchantId;

        @JsonProperty("merchantName")
        private String merchantName;

        @JsonProperty("phone")
        private String phone;

        @JsonProperty("contacts")
        private String contacts;

        @JsonProperty("mailbox")
        private String mailbox;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public Long getStoreId() { return storeId; }
        public void setStoreId(Long storeId) { this.storeId = storeId; }

        public String getStoreName() { return storeName; }
        public void setStoreName(String storeName) { this.storeName = storeName; }

        public String getExternalStoreId() { return externalStoreId; }
        public void setExternalStoreId(String externalStoreId) { this.externalStoreId = externalStoreId; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }

        public Long getAgencyId() { return agencyId; }
        public void setAgencyId(Long agencyId) { this.agencyId = agencyId; }

        public Long getMerchantId() { return merchantId; }
        public void setMerchantId(Long merchantId) { this.merchantId = merchantId; }

        public String getMerchantName() { return merchantName; }
        public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getContacts() { return contacts; }
        public void setContacts(String contacts) { this.contacts = contacts; }

        public String getMailbox() { return mailbox; }
        public void setMailbox(String mailbox) { this.mailbox = mailbox; }
    }
}
