const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');
const request = require('./request/inventory-request.controller')

router.post('/', controller.createInventory);
router.get('/', controller.getAllInventory);
router.get('/:id', controller.getInventoryDetail);
// Update using param
router.put('/:id', controller.updateInventory);

// Update using query
router.put('/', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);

// requests
router.use('/request', request.createInventoryRequest);
// Admin
router.put("/admin/request/approve/:request_id", request.approveInventoryRequest);
router.put("/admin/request/reject/:request_id", request.rejectInventoryRequest);

module.exports = router;