const express = require('express');
const router = express.Router();
const controller = require('./driver.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', protect, controller.createDriver);
router.get('/', protect, controller.getAllDrivers);
router.get('/:id', protect, controller.getDriverDetail);
router.put('/:id', protect, controller.updateDriver);
router.delete('/:id', protect, controller.deleteDriver);

module.exports = router;
