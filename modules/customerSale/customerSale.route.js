const express = require('express');
const router = express.Router();
const controller = require('./customerSale.controller');

router.post('/', controller.createCustomerSale);
router.put('/:id', controller.updateCustomerSale);
router.get('/', controller.getAllCustomerSale);
router.get('/:id', controller.getCustomerSaleById);
router.get('/contact/:contact', controller.getByCustomerContact);

module.exports = router;