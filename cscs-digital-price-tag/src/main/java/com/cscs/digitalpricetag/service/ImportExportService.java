package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.dto.ImportError;
import com.cscs.digitalpricetag.dto.ImportResponse;
import com.cscs.digitalpricetag.dto.api.PagedResponse;
import com.cscs.digitalpricetag.dto.api.ProductResponse;
import com.cscs.digitalpricetag.dto.dragon.DragonBatchImportRequest;
import com.cscs.digitalpricetag.util.ExcelExportUtil;
import com.cscs.digitalpricetag.util.ExcelImportUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

import com.cscs.digitalpricetag.dto.api.StoreResponse;
import com.cscs.digitalpricetag.dto.api.StoreCreateRequest;
import com.cscs.digitalpricetag.dto.dragon.DragonBatchBindRequest;
import com.cscs.digitalpricetag.dto.api.EslResponse;

@Service
public class ImportExportService {

    private static final Logger log = LoggerFactory.getLogger(ImportExportService.class);

    private final DragonEslApiClient dragonEslApiClient;
    private final ProductService productService;
    private final StoreService storeService;
    private final DeviceService deviceService;

    public ImportExportService(DragonEslApiClient dragonEslApiClient, ProductService productService, StoreService storeService, DeviceService deviceService) {
        this.dragonEslApiClient = dragonEslApiClient;
        this.productService = productService;
        this.storeService = storeService;
        this.deviceService = deviceService;
    }

    // ==========================================
    // PRODUCT IMPORT / EXPORT
    // ==========================================

    public ImportResponse importProducts(MultipartFile file, String storeId) {
        log.info("Starting Product Import. File: {}, StoreId: {}", file.getOriginalFilename(), storeId);
        
        String[] expectedHeaders = {
            "barcode", "itemTitle", "price", "originalPrice", "unit", "productArea", "spec"
        };
        
        List<DragonBatchImportRequest.Item> validItems = new ArrayList<>();
        
        ImportResponse response = ExcelImportUtil.parseExcel(file, expectedHeaders, row -> {
            String barcode = row.get("barcode");
            if (barcode == null || barcode.trim().isEmpty()) {
                throw new IllegalArgumentException("Barcode cannot be empty");
            }
            
            String price = row.get("price");
            if (price == null || price.trim().isEmpty()) {
                throw new IllegalArgumentException("Price cannot be empty");
            }
            
            try {
                Double.parseDouble(price);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Price must be a valid number");
            }
            
            return DragonBatchImportRequest.Item.builder()
                .barCode(barcode.trim())
                .itemTitle(row.getOrDefault("itemTitle", ""))
                .price(price.trim())
                .originalPrice(row.getOrDefault("originalPrice", null))
                .unit(row.getOrDefault("unit", null))
                .productArea(row.getOrDefault("productArea", null))
                .spec(row.getOrDefault("spec", null))
                .build();
        }, validItems);
        
        if (!validItems.isEmpty()) {
            try {
                // Batch limit is 20000 according to Zkong Docs.
                // We'll process them in batches of 10,000 to be safe.
                int batchSize = 10000;
                for (int i = 0; i < validItems.size(); i += batchSize) {
                    List<DragonBatchImportRequest.Item> batch = validItems.subList(i, Math.min(i + batchSize, validItems.size()));
                    
                    DragonBatchImportRequest req = DragonBatchImportRequest.builder()
                        .storeId(storeId != null && !storeId.isEmpty() ? Long.parseLong(storeId) : null)
                        .itemList(batch)
                        .build();
                    
                    dragonEslApiClient.post("/zk/item/batchImportItem", req, Map.class);
                }
            } catch (Exception e) {
                log.error("Failed to send batch import to Dragon ESL", e);
                response.setSuccess(false);
                response.setMessage("Failed to push valid records to ESL system: " + e.getMessage());
            }
        }
        
        log.info("Product Import Completed. Total: {}, Success: {}, Failed: {}", 
                 response.getTotalRecords(), response.getSuccessCount(), response.getFailedCount());
        
        return response;
    }

    public byte[] exportProducts(String storeId) throws IOException {
        log.info("Starting Product Export for storeId: {}", storeId);
        
        // Fetch products using ProductService
        PagedResponse<ProductResponse> pagedResponse = productService.getProducts(0, 100000, storeId, null, null);
        
        List<String> headers = Arrays.asList("ID", "Barcode", "Item Name", "Price", "Original Price", "Category", "Status");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        for (ProductResponse p : pagedResponse.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ID", p.getId());
            row.put("Barcode", p.getBarcode());
            row.put("Item Name", p.getItemName());
            row.put("Price", p.getPrice());
            row.put("Original Price", p.getOriginalPrice());
            row.put("Category", p.getCategory());
            row.put("Status", p.getStatus());
            rows.add(row);
        }
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    public byte[] getProductImportTemplate() throws IOException {
        List<String> headers = Arrays.asList("barcode", "itemTitle", "price", "originalPrice", "unit", "productArea", "spec");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        // Sample row
        Map<String, Object> sample = new LinkedHashMap<>();
        sample.put("barcode", "123456789012");
        sample.put("itemTitle", "Sample Product");
        sample.put("price", "9.99");
        sample.put("originalPrice", "12.99");
        sample.put("unit", "pcs");
        sample.put("productArea", "Aisle 1");
        sample.put("spec", "100g");
        rows.add(sample);
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    // ==========================================
    // STORE IMPORT / EXPORT
    // ==========================================

    public ImportResponse importStores(MultipartFile file) {
        log.info("Starting Store Import. File: {}", file.getOriginalFilename());
        
        String[] expectedHeaders = {
            "storeName", "externalStoreId", "contacts", "phone", "mailbox", "address"
        };
        
        List<StoreCreateRequest> validItems = new ArrayList<>();
        
        ImportResponse response = ExcelImportUtil.parseExcel(file, expectedHeaders, row -> {
            String storeName = row.get("storeName");
            if (storeName == null || storeName.trim().isEmpty()) {
                throw new IllegalArgumentException("storeName cannot be empty");
            }
            
            StoreCreateRequest req = new StoreCreateRequest();
            req.setStoreName(storeName.trim());
            req.setExternalStoreId(row.getOrDefault("externalStoreId", null));
            req.setContacts(row.getOrDefault("contacts", null));
            req.setPhone(row.getOrDefault("phone", null));
            req.setMailbox(row.getOrDefault("mailbox", null));
            req.setAddress(row.getOrDefault("address", null));
            req.setComment("Imported via bulk upload");
            return req;
        }, validItems);
        
        if (!validItems.isEmpty()) {
            for (int i = 0; i < validItems.size(); i++) {
                try {
                    storeService.addStore(validItems.get(i));
                    // The validItems array is synced with the success count from parser.
                    // If addStore fails, we should technically catch it and update failed count.
                } catch (Exception e) {
                    log.error("Failed to add store via import", e);
                    response.addError(new ImportError(i + 2, "API", "Dragon ESL rejected store: " + e.getMessage()));
                    response.setSuccessCount(response.getSuccessCount() - 1);
                }
            }
        }
        
        response.setSuccess(response.getFailedCount() == 0);
        log.info("Store Import Completed. Total: {}, Success: {}, Failed: {}", 
                 response.getTotalRecords(), response.getSuccessCount(), response.getFailedCount());
        
        return response;
    }

    public byte[] exportStores() throws IOException {
        log.info("Starting Store Export");
        List<StoreResponse> stores = storeService.getAllStores();
        
        List<String> headers = Arrays.asList("ID", "Store Name", "External ID", "Status", "Contacts", "Phone", "Address");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        for (StoreResponse s : stores) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ID", s.getId());
            row.put("Store Name", s.getStoreName());
            row.put("External ID", s.getExternalStoreId());
            row.put("Status", s.getStatus());
            row.put("Contacts", s.getContacts());
            row.put("Phone", s.getPhone());
            row.put("Address", s.getAddress());
            rows.add(row);
        }
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    public byte[] getStoreImportTemplate() throws IOException {
        List<String> headers = Arrays.asList("storeName", "externalStoreId", "contacts", "phone", "mailbox", "address");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        Map<String, Object> sample = new LinkedHashMap<>();
        sample.put("storeName", "New York Store");
        sample.put("externalStoreId", "NY-001");
        sample.put("contacts", "John Doe");
        sample.put("phone", "555-1234");
        sample.put("mailbox", "ny@example.com");
        sample.put("address", "123 Broadway, NY");
        rows.add(sample);
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    // ==========================================
    // ESL TAG IMPORT / EXPORT
    // ==========================================

    public ImportResponse importEslTags(MultipartFile file, String storeId) {
        log.info("Starting ESL Tag Import. File: {}, StoreId: {}", file.getOriginalFilename(), storeId);
        
        String[] expectedHeaders = {
            "eslBarcode", "itemBarcode"
        };
        
        List<DragonBatchBindRequest.TagItemBind> validItems = new ArrayList<>();
        
        ImportResponse response = ExcelImportUtil.parseExcel(file, expectedHeaders, row -> {
            String eslBarcode = row.get("eslBarcode");
            String itemBarcode = row.get("itemBarcode");
            
            if (eslBarcode == null || eslBarcode.trim().isEmpty()) {
                throw new IllegalArgumentException("ESL Barcode cannot be empty");
            }
            if (itemBarcode == null || itemBarcode.trim().isEmpty()) {
                throw new IllegalArgumentException("Item Barcode cannot be empty");
            }
            
            return DragonBatchBindRequest.TagItemBind.builder()
                .eslBarcode(eslBarcode.trim())
                .itemBarcode(itemBarcode.trim())
                .build();
        }, validItems);
        
        if (!validItems.isEmpty()) {
            try {
                int batchSize = 1000;
                for (int i = 0; i < validItems.size(); i += batchSize) {
                    List<DragonBatchBindRequest.TagItemBind> batch = validItems.subList(i, Math.min(i + batchSize, validItems.size()));
                    
                    DragonBatchBindRequest req = DragonBatchBindRequest.builder()
                        .storeId(storeId != null && !storeId.isEmpty() ? Long.parseLong(storeId) : null)
                        .tagItemBinds(batch)
                        .build();
                    
                    dragonEslApiClient.post("/zk/bind/batchBind", req, Map.class);
                }
            } catch (Exception e) {
                log.error("Failed to batch bind ESL tags", e);
                response.setSuccess(false);
                response.setMessage("Failed to bind ESL tags: " + e.getMessage());
            }
        }
        
        log.info("ESL Tag Import Completed. Total: {}, Success: {}, Failed: {}", 
                 response.getTotalRecords(), response.getSuccessCount(), response.getFailedCount());
        
        return response;
    }

    public byte[] exportEslTags(String storeId) throws IOException {
        log.info("Starting ESL Tag Export for storeId: {}", storeId);
        
        PagedResponse<EslResponse> pagedResponse = deviceService.getEslDevices(0, 100000, storeId, null);
        
        List<String> headers = Arrays.asList("ESL Barcode", "Product Barcode", "Status", "Battery", "Bind State", "Last Sync");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        for (EslResponse t : pagedResponse.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ESL Barcode", t.getPriceTagCode());
            row.put("Product Barcode", t.getItemBarCode());
            row.put("Status", t.getState());
            row.put("Battery", t.getBattery());
            row.put("Bind State", t.getBindState());
            row.put("Last Sync", t.getLastCommuTime());
            rows.add(row);
        }
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    public byte[] getEslTagImportTemplate() throws IOException {
        List<String> headers = Arrays.asList("eslBarcode", "itemBarcode");
        List<Map<String, Object>> rows = new ArrayList<>();
        
        Map<String, Object> sample = new LinkedHashMap<>();
        sample.put("eslBarcode", "A0A3B8204C96");
        sample.put("itemBarcode", "123456789012");
        rows.add(sample);
        
        return ExcelExportUtil.generateExcel(headers, rows);
    }

    // ==========================================
    // TEMPLATE IMPORT / EXPORT (ZIP)
    // ==========================================

    public Map<?, ?> importTemplateZip(MultipartFile file, String sceneNumber) {
        log.info("Starting Template Import ZIP. File: {}, Scene: {}", file.getOriginalFilename(), sceneNumber);
        return dragonEslApiClient.postMultipart("/zk/template/importTemplateRefactorFile/" + sceneNumber, "multipartFile", file, Map.class);
    }

    public byte[] exportTemplateZip(String sceneNumber, List<Long> templateBaseIds) {
        log.info("Starting Template Export ZIP. Scene: {}, Ids: {}", sceneNumber, templateBaseIds);
        List<Long> idsToExport = templateBaseIds != null ? new ArrayList<>(templateBaseIds) : new ArrayList<>();
        if (idsToExport.isEmpty()) {
            log.info("Template IDs list is empty. Fetching all templates first to export...");
            try {
                com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse listRes = dragonEslApiClient.post(
                    "/zk/template/list/0/1000",
                    new HashMap<>(),
                    com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse.class
                );
                if (listRes != null && listRes.getData() != null && listRes.getData().getContent() != null) {
                    for (com.cscs.digitalpricetag.dto.dragon.DragonTemplateListResponse.DragonTemplateItem item : listRes.getData().getContent()) {
                        if (item.getId() != null) {
                            idsToExport.add(item.getId());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to retrieve template IDs for fallback bulk export", e);
            }
        }

        if (idsToExport.isEmpty()) {
            throw new com.cscs.digitalpricetag.exception.DragonEslException("No templates found to export", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        return dragonEslApiClient.post("/zk/template/exportTemplateRefactorFile/" + sceneNumber, idsToExport, byte[].class);
    }
}
