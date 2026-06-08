package com.cscs.digitalpricetag.dto.api;

import jakarta.validation.constraints.NotBlank;

public class StoreCreateRequest {

    @NotBlank(message = "Store name is required")
    private String storeName;
    
    private String externalStoreId = "";
    private String contacts = "";
    private String phone = "";
    private String mailbox = "";
    private String address = "";
    private String comment = "";
    private int dataCombination = 0;
    private Integer rowNumber;

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getExternalStoreId() { return externalStoreId; }
    public void setExternalStoreId(String externalStoreId) { this.externalStoreId = externalStoreId; }

    public String getContacts() { return contacts; }
    public void setContacts(String contacts) { this.contacts = contacts; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getMailbox() { return mailbox; }
    public void setMailbox(String mailbox) { this.mailbox = mailbox; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public int getDataCombination() { return dataCombination; }
    public void setDataCombination(int dataCombination) { this.dataCombination = dataCombination; }

    public Integer getRowNumber() { return rowNumber; }
    public void setRowNumber(Integer rowNumber) { this.rowNumber = rowNumber; }
}
