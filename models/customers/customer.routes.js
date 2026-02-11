const express = require('express');
const router = express.Router();
const controller = require('./customer.controller');

router.post('/customers', controller.createCustomer);
router.get('/customers', controller.getAllCustomers);
router.get('/customers/:id', controller.getCustomerById);
router.put('/customers/:id', controller.updateCustomer);
router.delete('/customers/:id', controller.deleteCustomer);

module.exports = router;
