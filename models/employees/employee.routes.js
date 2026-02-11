const express = require('express');
const router = express.Router();
const controller = require('./employee.controller');
const {adminAuth} = require('../admin/admin.middleware')

router.get('/technicians', adminAuth, controller.getAllTechnicians);
router.get('/technicians/:id', controller.getTechnicianById);
router.put('/technicians/:id', controller.updateTechnician);
router.delete('/technicians/:id', controller.deleteTechnician);

module.exports = router;
