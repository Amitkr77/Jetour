const CustomerVehicle = require("./customerVehicle.model");

const {
  createCustomerVehicleSchema
} = require("./customerVehicle.validation");

const mongoose = require("mongoose");
const Customer = require("../customer.model");
const Vehicle = require("../../vehicle/vehicle.model");

exports.createCustomerVehicle = async (req, res, next) => {
  try {

    //////////////////////////////////////////////////////
    // ✅ Joi validation
    //////////////////////////////////////////////////////
    const { error } = createCustomerVehicleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      model_id,
      registration_number,
      mileage,
      category,
      model_year,
      variant,
      color,
      user_id
    } = req.body;

    //////////////////////////////////////////////////////
    // 🚀 Fetch Customer & Vehicle Model in Parallel
    //////////////////////////////////////////////////////
    const [customer, vehicleModel] = await Promise.all([
      Customer.findOne({ id: user_id }),
      Vehicle.findOne({ id: model_id })
    ]);

    //////////////////////////////////////////////////////
    // ✅ Validate Customer
    //////////////////////////////////////////////////////
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Validate Vehicle Model
    //////////////////////////////////////////////////////
    if (!vehicleModel) {
      return res.status(404).json({
        success: false,
        message: "Vehicle model not found"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 Duplicate Check
    //////////////////////////////////////////////////////
    const existing = await CustomerVehicle.findOne({
      customer: customer._id,
      registration_number
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This registration number already exists for this customer"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 Prepare Data (Only Required + Provided Fields)
    //////////////////////////////////////////////////////
    const vehicleCount = await CustomerVehicle.countDocuments({
      customer: customer._id
    });

    const vehicleData = {
      customer: customer._id,
      vehicle_model: vehicleModel._id,
      id: vehicleModel.id,
      registration_number,
      mileage,
      is_selected: vehicleCount === 0,
      ...(vehicleModel.vehicle_image && { image: vehicleModel.vehicle_image })
    };

    // Optional fields
    if (category) vehicleData.category = category;
    if (model_year) vehicleData.model_year = model_year;
    if (variant) vehicleData.variant = variant;
    if (color) vehicleData.color = color;

    //////////////////////////////////////////////////////
    // 🔥 Create vehicle
    //////////////////////////////////////////////////////
    const vehicle = await CustomerVehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: "Customer vehicle created successfully",
      data: vehicle
    });

  } catch (error) {
    next(error);
  }
};

exports.updateCustomerVehicle = async (req, res, next) => {
  try {

    const id = req.params.id;

    // 🔥 If registration_number updating → check duplicate
    if (req.body.registration_number) {
      const existing = await CustomerVehicle.findOne({
        customer: req.body.user_id,
        registration_number: req.body.registration_number,
        vehicle_id: { $ne: id }   // custom id field
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "This registration number already exists for this customer"
        });
      }
    }

    let query = {};

    // ✅ Check if Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { vehicle_model: id };
    } else {
      query = { id: id };
    }

    const updated = await CustomerVehicle.findOneAndUpdate(
      query,
      req.body,
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Customer vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer vehicle updated successfully",
      data: updated
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteCustomerVehicle = async (req, res, next) => {
  try {

    const { user_id, vehicle_id } = req.query;

    if (!user_id || !vehicle_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and vehicle_id are required"
      });
    }

    ////////////////////////////////////////////////////////
    // 🔎 Find Customer by _id OR custom id
    ////////////////////////////////////////////////////////
    let customer;

    if (mongoose.Types.ObjectId.isValid(user_id)) {
      customer = await Customer.findOne({
        $or: [{ _id: user_id }, { id: user_id }]
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

    ////////////////////////////////////////////////////////
    // 🔎 Find Vehicle by _id OR custom id
    ////////////////////////////////////////////////////////
    let vehicle;

    if (mongoose.Types.ObjectId.isValid(vehicle_id)) {
      vehicle = await CustomerVehicle.findOne({
        $or: [{ vehicle_model: vehicle_id }, { id: vehicle_id }],
        customer: customer._id
      });
    } else {
      vehicle = await CustomerVehicle.findOne({
        id: vehicle_id,
        customer: customer._id
      });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found for this customer"
      });
    }

    if (vehicle.is_selected) {
      return res.status(400).json({
        success: false,
        message: "Selected vehicle cannot be deleted. Please select another vehicle first."
      });
    }

    ////////////////////////////////////////////////////////
    // 🗑 Delete vehicle
    ////////////////////////////////////////////////////////
    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: "Customer vehicle deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

exports.getCustomerVehicles = async (req, res, next) => {
  try {

    const { user_id } = req.query;

    //////////////////////////////////////////////////////
    // ✅ Validate
    //////////////////////////////////////////////////////
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Find customer (_id OR custom id)
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
    // ✅ Fetch vehicles
    //////////////////////////////////////////////////////
    const vehicles = await CustomerVehicle.find({
      customer: customer._id
    })
      .populate("vehicle_model")
      .sort({ created_at: -1 });

    //////////////////////////////////////////////////////
    // 🔥 Format response
    //////////////////////////////////////////////////////
    const formattedVehicles = vehicles.map(v => ({
      model_id: v.id,
      model_name: v.vehicle_model?.vehicle_model || null,
      registration_number: v.registration_number,
      mileage: v.mileage,
      category: v.category,
      model_year: v.model_year,
      variant: v.variant,
      color: v.color,
      image: v.image,
      is_selected: v.is_selected
    }));

    res.status(200).json({
      success: true,
      total: formattedVehicles.length,
      data: formattedVehicles
    });

  } catch (error) {
    next(error);
  }
};


exports.selectCustomerVehicle = async (req, res, next) => {
  try {
    const { user_id, vehicle_id } = req.body;

    if (!user_id || !vehicle_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and vehicle_id are required"
      });
    }

    ////////////////////////////////////////////////////////
    // Find customer by _id OR custom id
    ////////////////////////////////////////////////////////
    let customer;
    if (mongoose.Types.ObjectId.isValid(user_id)) {
      customer = await Customer.findOne({ $or: [{ _id: user_id }, { id: user_id }] });
    } else {
      customer = await Customer.findOne({ id: user_id });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    ////////////////////////////////////////////////////////
    // Find vehicle by _id OR custom id
    ////////////////////////////////////////////////////////
    let vehicle;
    if (mongoose.Types.ObjectId.isValid(vehicle_id)) {
      vehicle = await CustomerVehicle.findOne({
        $or: [{ _id: vehicle_id }, { id: vehicle_id }],
        customer: customer._id
      });
    } else {
      vehicle = await CustomerVehicle.findOne({ id: vehicle_id, customer: customer._id });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found for this customer"
      });
    }

    ////////////////////////////////////////////////////////
    // Unselect all other vehicles
    ////////////////////////////////////////////////////////
    await CustomerVehicle.updateMany(
      { customer: customer._id, _id: { $ne: vehicle._id } },
      { $set: { is_selected: false } }
    );

    ////////////////////////////////////////////////////////
    // Select the chosen vehicle
    ////////////////////////////////////////////////////////
    vehicle.is_selected = true;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle selected successfully",
      data: vehicle
    });

  } catch (error) {
    next(error);
  }
};