const express = require('express');
const router = express.Router();
const controller = require('./driver.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', controller.createDriver);
router.get('/', controller.verifyDriver, controller.getAllDrivers);
router.get('/:id', controller.getDriverDetail);
router.put('/:id', controller.updateDriver);
router.delete('/:id', controller.deleteDriver);
router.post('/password-change-request', controller.requestPasswordChange);

module.exports = router;
