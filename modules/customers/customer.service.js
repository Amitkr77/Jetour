const Customer = require('./customer.model');

exports.createCustomer = async (data) => {
  return Customer.create(data);
};

exports.getAllCustomers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  return Customer.find()
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

exports.getCustomerById = async (id) => {
  return Customer.findById(id);
};

exports.updateCustomer = async (id, data) => {
  return Customer.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteCustomer = async (id) => {
  return Customer.findByIdAndDelete(id);
};

exports.findByCivilId = async (civilId) => {
  return Customer.findOne({ civil_id: civilId });
};

exports.findByContactNumber = async (number) => {
  return Customer.findOne({ contact_number: number });
};