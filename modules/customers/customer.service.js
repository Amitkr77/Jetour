const Customer = require('./customer.model');

exports.createCustomer = async (data) => {
  return Customer.create(data);
};

exports.getAllCustomers = async () => {
  return Customer.find().sort({ created_at: -1 });
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
