const express = require('express');
const router = express.Router();
const controller = require('./customer.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', controller.createCustomer);
router.get('/', controller.getAllCustomers);
router.get('/:id', controller.getCustomerDetail);
router.put('/:id', controller.updateCustomer);
router.delete('/:id',  controller.deleteCustomer);

module.exports = router;
