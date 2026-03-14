const express = require("express");
const router = express.Router();

const controller = require("./inventory.controller");
const request = require("./request/inventory-request.controller");

/* ================= INVENTORY ================= */

// Create inventory
router.post("/", controller.createInventory);

// Get all inventory
router.get("/", controller.getAllInventory);

// Inventory requests
router.get("/all-request", request.getAllRequests);

// Technician create request
router.post("/request", request.createInventoryRequest);

// Admin actions
router.put("/admin/request/approve/:request_id", request.approveInventoryRequest);
router.put("/admin/request/reject/:request_id", request.rejectInventoryRequest);

// Inventory detail
router.get("/:id", controller.getInventoryDetail);

// Update inventory
router.put("/:id", controller.updateInventory);
router.put("/", controller.updateInventory);

// Delete inventory
router.delete("/:id", controller.deleteInventory);

module.exports = router;