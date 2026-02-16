const express = require('express');
const router = express.Router();
const controller = require('./serviceVan.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', controller.createServiceVan);
router.get('/', controller.getAllServiceVans);
router.get('/:id', controller.getServiceVanDetail);
router.put('/:id', controller.updateServiceVan);
router.delete('/:id', controller.deleteServiceVan);

module.exports = router;
