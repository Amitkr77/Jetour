const express = require('express');
const router = express.Router();
const controller = require('./customer.controller');
const { protect } = require('../../middlewares/auth.middleware');
const auth = require('./customer.auth.controller')

router.post('/', controller.createCustomer);
router.get('/', controller.getAllCustomers);
router.get('/:id', controller.getCustomerDetail);
router.put('/:id', controller.updateCustomer);
router.delete('/:id', controller.deleteCustomer);
router.post('/auth/send-otp', auth.sendOtp);
router.post('/auth/verify-otp', auth.verifyOtp);
router.post('/auth/resend-otp', auth.resendOtp);

module.exports = router;
