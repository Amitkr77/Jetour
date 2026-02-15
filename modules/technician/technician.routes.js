const express = require('express');
const router = express.Router();
const controller = require('./technician.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All routes protected
router.post('/', protect, controller.createTechnician);
router.get('/', protect, controller.getAllTechnicians);
router.get('/:id', protect, controller.getTechnicianDetail);
router.put('/:id', protect, controller.updateTechnician);
router.delete('/:id', protect, controller.deleteTechnician);

module.exports = router;
