const express = require('express');
const router = express.Router();
const controller = require('./admin.controller');

router.post('/admin/register', controller.register);
router.post('/admin/login', controller.login);

module.exports = router;
