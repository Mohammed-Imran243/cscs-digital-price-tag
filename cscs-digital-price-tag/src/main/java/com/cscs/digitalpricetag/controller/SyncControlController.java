package com.cscs.digitalpricetag.controller;

import com.cscs.digitalpricetag.service.SyncControlService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * SyncControlController (CSCS Backend)
 *
 * Exposes sync control endpoints to the React frontend (cscs-esl-connect-app-ui).
 * This controller acts as a proxy — it receives requests from the frontend
 * and forwards them to TL's sync service via SyncControlService.
 *
 * Why proxy through backend instead of calling TL's service directly from React?
 * → The X-Internal-Secret stays server-side, never exposed in browser network tab.
 * → Consistent with existing frontend→backend API pattern in this project.
 *
 * Endpoints (called by React frontend):
 *   POST  /api/sync/start   → tells TL's service to start polling
 *   POST  /api/sync/stop    → tells TL's service to stop polling
 *   GET   /api/sync/status  → returns { running: true/false }
 *
 * Auth: JWT token (same as all other CSCS endpoints — handled by SecurityConfig)
 */
@RestController
@RequestMapping("/api/sync")
public class SyncControlController {

    private static final Logger logger = LoggerFactory.getLogger(SyncControlController.class);

    private final SyncControlService syncControlService;

    public SyncControlController(SyncControlService syncControlService) {
        this.syncControlService = syncControlService;
    }

    /**
     * POST /api/sync/start
     * Frontend calls this when user clicks "Start Sync" button.
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startSync() {
        logger.info("Frontend requested SYNC START.");
        Map<String, Object> result = syncControlService.startSync();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/sync/stop
     * Frontend calls this when user clicks "Stop Sync" button.
     */
    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stopSync() {
        logger.info("Frontend requested SYNC STOP.");
        Map<String, Object> result = syncControlService.stopSync();
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/sync/status
     * Frontend calls this on page load to show correct button state.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        logger.debug("Frontend requested SYNC STATUS.");
        Map<String, Object> result = syncControlService.getSyncStatus();
        return ResponseEntity.ok(result);
    }
}