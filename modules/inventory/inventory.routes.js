const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');

router.post('/', controller.createInventory);
router.get('/', controller.getAllInventory);
router.get('/:id', controller.getInventoryDetail);
router.get('/', controller.getInventoryDetail);
// Update using param
router.put('/:id', controller.updateInventory);

// Update using query
router.put('/', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);

module.exports = router;