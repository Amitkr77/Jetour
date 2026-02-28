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
    // ✅ Validate ObjectId format
    //////////////////////////////////////////////////////
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(model_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle model ID format"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Check Customer Exists
    //////////////////////////////////////////////////////
    const customerExists = await Customer.findById(user_id);
    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ Check Vehicle Model Exists
    //////////////////////////////////////////////////////
    const vehicleExists = await Vehicle.findById(model_id);
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: "Vehicle model not found"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 Duplicate Check
    //////////////////////////////////////////////////////
    const existing = await CustomerVehicle.findOne({
      customer: user_id,
      registration_number
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This registration number already exists for this customer"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 Create
    //////////////////////////////////////////////////////
    const vehicle = await CustomerVehicle.create({
      customer: user_id,
      vehicle_model: model_id,
      registration_number,
      mileage,
      category,
      model_year,
      variant,
      color
    });

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
                _id: { $ne: id }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "This registration number already exists for this customer"
                });
            }
        }

        const updated = await CustomerVehicle.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
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

        //////////////////////////////////////////////////////
        // 🔥 Delete only if vehicle belongs to that customer
        //////////////////////////////////////////////////////
        const deleted = await CustomerVehicle.findOneAndDelete({
            vehicle_model: vehicle_id,
            customer: user_id
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found for this user"
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer vehicle deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};