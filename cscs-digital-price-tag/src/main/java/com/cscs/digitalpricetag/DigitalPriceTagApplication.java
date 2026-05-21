package com.cscs.digitalpricetag;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Autowired;
import com.cscs.digitalpricetag.service.StoreService;

/**
 * CSCS Digital Price Tag
 *
 * Spring Boot middleware that:
 *   - Authenticates users via JWT
 *   - Proxies requests to the Dragon ESL API
 *   - Serves as the backend for the React frontend
 *
 * No database. No JPA. No Flyway.
 */
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
})
@EnableScheduling
public class DigitalPriceTagApplication implements CommandLineRunner {

    @Autowired
    private StoreService storeService;

    public static void main(String[] args) {
        SpringApplication.run(DigitalPriceTagApplication.class, args);
    }

    @Autowired
    private com.cscs.digitalpricetag.service.TemplateService templateService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== ZKONG SYSTEM STORES START ===");
        try {
            storeService.getAllStores().forEach(s -> {
                System.out.println("STORE_ID: " + s.getStoreId() + " | NAME: " + s.getStoreName() + " | EXTID: " + s.getExternalStoreId() + " | STATUS: " + s.getStatus());
            });
        } catch (Exception e) {
            System.err.println("Failed to fetch startup Zkong stores: " + e.getMessage());
        }
        System.out.println("=== ZKONG SYSTEM STORES END ===");

        System.out.println("=== ZKONG SYSTEM TEMPLATES START ===");
        // Query templates for Al Naseem Branch
        try {
            java.util.HashMap<String, Object> params = new java.util.HashMap<>();
            params.put("storeId", 1776682671415L); // Use Long number
            System.out.println("Querying templates for Al Naseem Branch (1776682671415) as Long...");
            Object res = templateService.getTemplates(0, 10, params);
            System.out.println("Al Naseem templates result: " + res);
            if (res instanceof com.cscs.digitalpricetag.dto.DragonTemplateListResponse) {
                com.cscs.digitalpricetag.dto.DragonTemplateListResponse listRes = (com.cscs.digitalpricetag.dto.DragonTemplateListResponse) res;
                System.out.println("Al Naseem templates count: " + (listRes.getData() != null ? listRes.getData().getTotalElements() : 0));
                if (listRes.getData() != null && listRes.getData().getContent() != null) {
                    listRes.getData().getContent().forEach(t -> {
                        System.out.println("TEMPLATE_RECORD: " + t.getTemplateName() + " | ID: " + t.getId() + " | SIZE: " + t.getSize());
                    });
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch templates for Al Naseem: " + e.getMessage());
            e.printStackTrace();
        }

        // Query templates for Al-badiaa Branch
        try {
            java.util.HashMap<String, Object> params = new java.util.HashMap<>();
            params.put("storeId", 1776840494702L);
            System.out.println("Querying templates for Al-badiaa Branch (1776840494702) as Long...");
            Object res = templateService.getTemplates(0, 10, params);
            System.out.println("Al-badiaa templates result: " + res);
            if (res instanceof com.cscs.digitalpricetag.dto.DragonTemplateListResponse) {
                com.cscs.digitalpricetag.dto.DragonTemplateListResponse listRes = (com.cscs.digitalpricetag.dto.DragonTemplateListResponse) res;
                System.out.println("Al-badiaa templates count: " + (listRes.getData() != null ? listRes.getData().getTotalElements() : 0));
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch templates for Al-badiaa: " + e.getMessage());
        }

        // Query merchant-level templates (storeId = 0L)
        try {
            java.util.HashMap<String, Object> params = new java.util.HashMap<>();
            params.put("storeId", 0L);
            System.out.println("Querying templates with storeId = 0L...");
            Object res = templateService.getTemplates(0, 10, params);
            System.out.println("RAW_STOREID_0_TEMPLATES_JSON_START");
            System.out.println(new com.fasterxml.jackson.databind.ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(res));
            System.out.println("RAW_STOREID_0_TEMPLATES_JSON_END");
        } catch (Exception e) {
            System.err.println("Failed to fetch templates with storeId = 0L: " + e.getMessage());
        }
        System.out.println("=== ZKONG SYSTEM TEMPLATES END ===");
    }
}