const express = require('express');
const router = express.Router();
const controller = require('./vehicle.controller');

router.post('/customers/:customerId/vehicles', controller.createVehicle);
router.get('/customers/:customerId/vehicles', controller.getVehiclesByCustomer);

router.get('/vehicles/:vehicleId', controller.getVehicleById);
router.put('/vehicles/:vehicleId', controller.updateVehicle);
router.delete('/vehicles/:vehicleId', controller.deleteVehicle);

module.exports = router;
