package com.cscs.digitalpricetag.dto.api;

public class StoreResponse {

    private String id;
    private String storeId;
    private String storeName;
    private String address;
    private String status;
    private String externalStoreId;
    private String contacts;
    private String phone;
    private String mailbox;
    private String merchantName;

    // ── Constructors ────────────────────────────────────────────────────────

    public StoreResponse() {}

    public StoreResponse(String storeId, String storeName, String address, String status) {
        this.storeId = storeId;
        this.storeName = storeName;
        this.address = address;
        this.status = status;
    }

    public StoreResponse(String id, String storeId, String storeName, String address, String status) {
        this.id = id;
        this.storeId = storeId;
        this.storeName = storeName;
        this.address = address;
        this.status = status;
    }

    // ── Getters & Setters ───────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getExternalStoreId() { return externalStoreId; }
    public void setExternalStoreId(String externalStoreId) { this.externalStoreId = externalStoreId; }

    public String getContacts() { return contacts; }
    public void setContacts(String contacts) { this.contacts = contacts; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMailbox() { return mailbox; }
    public void setMailbox(String mailbox) { this.mailbox = mailbox; }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
}
