const customerService = require('./customer.service');
const validation = require('./customer.validation');





exports.createCustomer = async (req, res, next) => {
  try {
    const { error } = validation.createCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const customer = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Duplicate field value entered");
    }
    throw error;
  }
};

exports.getAllCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getAllCustomers(req.query);

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        per_page: result.per_page,
        total_pages: Math.ceil(result.total / result.per_page)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerDetail = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { error } = validation.updateCustomerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const customer = await customerService.updateCustomer(
      req.params.id,
      req.body
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.deleteCustomer(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customer
    });
  } catch (err) {
    next(err);
  }
};
