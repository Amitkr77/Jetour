const CustomerService = require('./customer.service');
const {
  createCustomerSchema,
  updateCustomerSchema
} = require('./customer.validation');

/* CREATE */
exports.createCustomer = async (req, res, next) => {
  try {
    const { error, value } = createCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const customerId = await CustomerService.createCustomer(value);

    res.status(201).json({
      message: 'Customer created successfully',
      customer_id: customerId
    });
  } catch (err) {
    next(err);
  }
};

/* GET ALL */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const customers = await CustomerService.getAllCustomers();
    res.json({ data: customers });
  } catch (err) {
    next(err);
  }
};

/* GET BY ID */
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
};

/* UPDATE */
exports.updateCustomer = async (req, res, next) => {
  try {
    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await CustomerService.updateCustomer(
      req.params.id,
      value
    );

    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    next(err);
  }
};

/* DELETE */
exports.deleteCustomer = async (req, res, next) => {
  try {
    const deleted = await CustomerService.deleteCustomer(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
