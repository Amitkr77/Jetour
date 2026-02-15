const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected route
router.get('/profile', protect, controller.profile);

module.exports = router;
