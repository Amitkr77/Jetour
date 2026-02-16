const express = require('express');
const router = express.Router();
const controller = require('./vehicle.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/',  controller.createVehicle);
router.get('/',  controller.getAllVehicles);
router.get('/:id',  controller.getVehicleDetail);
router.put('/:id',  controller.updateVehicle);
router.delete('/:id',  controller.deleteVehicle);

module.exports = router;
