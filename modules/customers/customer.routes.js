const express = require('express');
const router = express.Router();
const controller = require('./customer.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/', protect, controller.createCustomer);
router.get('/', protect, controller.getAllCustomers);
router.get('/:id', protect, controller.getCustomerDetail);
router.put('/:id', protect, controller.updateCustomer);
router.delete('/:id', protect, controller.deleteCustomer);

module.exports = router;
