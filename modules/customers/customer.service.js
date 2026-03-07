const Customer = require('./customer.model');
const mongoose = require("mongoose");

exports.createCustomer = async (data) => {
  return Customer.create(data);
};

exports.getAllCustomers = async (queryParams) => {
  const {
    page = 1,
    per_page = 10,
    name,
    email,
    contact_number,
    show_all = false
  } = queryParams;

  const filter = {};

  // 🔍 Dynamic Filters
  if (name) {
    filter.name = { $regex: name, $options: 'i' }; // case insensitive
  }

  if (email) {
    filter.email = { $regex: email, $options: 'i' };
  }

  if (contact_number) {
    filter.contact_number = { $regex: contact_number, $options: 'i' };
  }

  const sort = { created_at: -1 };

  // 🚀 If show_all=true → skip pagination
  if (show_all === 'true') {
    const customers = await Customer.find(filter).sort(sort);

    return {
      data: customers,
      total: customers.length,
      page: 1,
      per_page: customers.length
    };
  }

  const skip = (Number(page) - 1) * Number(per_page);

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(per_page)),
    Customer.countDocuments(filter)
  ]);

  return {
    data: customers,
    total,
    page: Number(page),
    per_page: Number(per_page)
  };
};

exports.getCustomerById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { id: id }] }
    : { id: id };

  return Customer.findOne(query).populate("vehicles");
};

// .populate({
//     path: "vehicles",
//     populate: { path: "vehicle_model" }
//   });

exports.updateCustomer = async (id, data) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { id: id }] }
    : { id: id };

  return Customer.findOneAndUpdate(query, data, { new: true });
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