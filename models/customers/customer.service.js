const CustomerModel = require('./customer.model');

exports.createCustomer = async (payload) => {
  return CustomerModel.createCustomer(payload);
};

exports.getAllCustomers = async () => {
  return CustomerModel.getAllCustomers();
};

exports.getCustomerById = async (id) => {
  return CustomerModel.getCustomerById(id);
};

exports.updateCustomer = async (id, payload) => {
  return CustomerModel.updateCustomer(id, payload);
};

exports.deleteCustomer = async (id) => {
  return CustomerModel.deleteCustomer(id);
};
