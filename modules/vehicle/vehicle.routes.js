const express = require('express');
const router = express.Router();
const controller = require('./vehicle.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', protect, controller.createVehicle);
router.get('/', protect, controller.getAllVehicles);
router.get('/:id', protect, controller.getVehicleDetail);
router.put('/:id', protect, controller.updateVehicle);
router.delete('/:id', protect, controller.deleteVehicle);

module.exports = router;
