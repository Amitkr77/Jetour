const mongoose = require("mongoose");
const customerService = require('./customer.service');
const validation = require('./customer.validation');
const Customer = require("./customer.model");
const CustomerVehicle = require("./vehicle/customerVehicle.model");
const Booking = require("../booking/booking.model");


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
      total: result.total,
      page: result.page,
      limit: result.per_page,
      total_pages: Math.ceil(result.total / result.per_page),
      data: result.data,
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

    const id = req.params.id;

    //////////////////////////////////////////////////////
    // 🔎 Build query for _id OR custom id
    //////////////////////////////////////////////////////
    let query;

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { id }] };
    } else {
      query = { id };
    }

    //////////////////////////////////////////////////////
    // ⚡ Use findOneAndUpdate (not findByIdAndUpdate)
    //////////////////////////////////////////////////////
    const customer = await Customer.findOneAndUpdate(
      query,
      req.body,
      { returnDocument: "after" }  // return the updated document
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

exports.getCustomerDashboard = async (req, res, next) => {
  try {

    const { user_id } = req.query;

    //////////////////////////////////////////////////////
    // ✅ Validate input
    //////////////////////////////////////////////////////
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Find customer using _id OR custom id
    //////////////////////////////////////////////////////
    let customer;

    if (mongoose.Types.ObjectId.isValid(user_id)) {
      customer = await Customer.findOne({
        $or: [
          { _id: user_id },
          { id: user_id }
        ]
      });
    } else {
      customer = await Customer.findOne({ id: user_id });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Fetch Vehicle
    //////////////////////////////////////////////////////
    const vehicles = await CustomerVehicle.find({
      customer: customer._id
    })
      .sort({ created_at: -1 })
      .populate("vehicle_model");

    //////////////////////////////////////////////////////
    // ✅ Fetch Last Booking
    //////////////////////////////////////////////////////
    const lastBooking = await Booking.findOne({
      "customer.customer_id": customer._id
    }).sort({ created_at: -1 });

    console.log(vehicles)

    const formattedVehicles = vehicles.map(v => ({
      name: v.vehicle_model?.vehicle_model || null,
      mileage: v.mileage,
      image: v.image || null,
      is_selected: v.is_selected,
      id: v.id
    }));

    //////////////////////////////////////////////////////
    // 🔥 Response
    //////////////////////////////////////////////////////
    const response = {
      user: {
        id: customer.id,
        name: customer.name || null,
        lat: customer.lat,
        lng: customer.lng,
        contact_number: customer.contact_number,
        country_code: customer.country_code,
        date_of_birth: customer.date_of_birth || null,
        email: customer.email || null,
        civil_id: customer.civil_id || null,
        gender: customer.gender || null,
        passport_number: customer.passport_number || null,
        nationality: customer.nationality || null,
        preferred_language: customer.preferred_language,
        full_address: customer.full_address || null
      },


      vehicle: formattedVehicles.find(v => v.is_selected) || null,

      preferred_language: customer.preferred_language,

      last_booking: lastBooking
        ? {
          booking_id: lastBooking._id,
          package_name: lastBooking.package?.name || null,
          price: lastBooking.package?.total_amount || null
        }
        : null
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error);
  }
};