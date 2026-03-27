const express = require('express');
const router = express.Router();
const controller = require('./technician.controller');
const inventoryController = require('./technicianInventory/technicianInventory.controller')
const { authenticateTechnician } = require('../../middlewares/technicianAuth.middleware');



router.post('/', controller.createTechnician);
router.get('/', controller.verifyTechnician, controller.getAllTechnicians);

router.get('/inventory/:technicianId', inventoryController.getTechnicianInventoryByTechnicianId);
router.patch('/inventory/:technicianId', inventoryController.updateTechnicianInventory);

router.get('/:id', authenticateTechnician, controller.getTechnicianDetail);
router.put('/:id', controller.updateTechnician);
router.delete('/:id', controller.deleteTechnician);
router.post('/password-change-request', controller.requestPasswordChange);

module.exports = router;
