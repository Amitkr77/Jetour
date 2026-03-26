const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-otp', controller.verifyOtp);
router.post('/reset-password', controller.resetPassword);
// Protected route
router.get('/profile', protect, controller.getProfile);

module.exports = router;
