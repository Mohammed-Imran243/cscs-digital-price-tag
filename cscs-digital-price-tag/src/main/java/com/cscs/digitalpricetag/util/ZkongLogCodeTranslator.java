package com.cscs.digitalpricetag.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility to translate Zkong log codes (operations and statuses) to user-friendly English strings.
 */
public class ZkongLogCodeTranslator {

    private static final Map<Integer, String> OPERATION_MAP = new HashMap<>();
    private static final Map<Integer, String> STATUS_MAP = new HashMap<>();

    static {
        // Operation type (operation)
        OPERATION_MAP.put(1, "Bind Tag");
        OPERATION_MAP.put(2, "Unbind Tag");
        OPERATION_MAP.put(3, "Force Refresh");
        OPERATION_MAP.put(4, "Product Change");
        OPERATION_MAP.put(5, "Template Change");
        OPERATION_MAP.put(13, "Force LED Flash");
        OPERATION_MAP.put(14, "Smart Reissue");

        // Swipe results (status)
        STATUS_MAP.put(2, "Success");
        STATUS_MAP.put(3, "Failed (Timeout)");
        STATUS_MAP.put(4, "Failed (Retry Timeout)");
        STATUS_MAP.put(5, "Failed (Terminated)");
        STATUS_MAP.put(7, "Manual Retry");
        STATUS_MAP.put(8, "Failed (No Template)");
        STATUS_MAP.put(9, "Failed (Tag Offline)");
        STATUS_MAP.put(10, "Failed (No AP)");
        STATUS_MAP.put(12, "Failed (Processing Error)");
        STATUS_MAP.put(13, "Failed (Not Reported)");
        STATUS_MAP.put(14, "Success (Unchanged)");
        STATUS_MAP.put(15, "Failed (No Image)");
        STATUS_MAP.put(16, "Failed (Data Exception)");
        STATUS_MAP.put(17, "Failed (Send Exception)");
    }

    public static String translateOperation(Integer op) {
        if (op == null) return "Unknown";
        return OPERATION_MAP.getOrDefault(op, "Unknown (" + op + ")");
    }

    public static String translateStatus(Integer status) {
        if (status == null) return "Pending";
        return STATUS_MAP.getOrDefault(status, "Unknown (" + status + ")");
    }
}
