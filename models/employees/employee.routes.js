const express = require('express');
const router = express.Router();
const controller = require('./employee.controller');

router.get('/technicians', controller.getAllTechnicians);
router.get('/technicians/:id', controller.getTechnicianById);
router.put('/technicians/:id', controller.updateTechnician);
router.delete('/technicians/:id', controller.deleteTechnician);

module.exports = router;
