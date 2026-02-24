const express = require('express');
const router = express.Router();
const controller = require('./technician.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All routes protected
router.post('/', controller.createTechnician);
router.get('/', controller.verifyTechnician, controller.getAllTechnicians);
router.get('/:id', controller.getTechnicianDetail);
router.put('/:id',  controller.updateTechnician);
router.delete('/:id', controller.deleteTechnician);
router.post('/password-change-request', controller.requestPasswordChange);

module.exports = router;
