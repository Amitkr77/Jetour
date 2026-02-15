const mongoose = require('mongoose');
const vehicleService = require('./vehicle.service');
const validation = require('./vehicle.validation');
const Driver = require('../driver/driver.model');
const Vehicle = require('./vehicle.model');

exports.assignDriver = async (req, res, next) => {
  try {
    const { driver_id, vehicle_id } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(driver_id) ||
      !mongoose.Types.ObjectId.isValid(vehicle_id)
    ) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }

    const driver = await Driver.findById(driver_id);
    const vehicle = await Vehicle.findById(vehicle_id);

    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Check if vehicle already assigned
    if (vehicle.assigned_driver) {
      return res.status(400).json({
        message: 'Vehicle already assigned to another driver'
      });
    }

    // Check if driver already assigned
    if (driver.assigned_vehicle) {
      return res.status(400).json({
        message: 'Driver already assigned to another vehicle'
      });
    }

    vehicle.assigned_driver = driver._id;
    vehicle.status = 'Assigned';

    driver.assigned_vehicle = vehicle._id;

    await vehicle.save();
    await driver.save();

    res.json({
      success: true,
      message: 'Driver assigned successfully'
    });
  } catch (err) {
    next(err);
  }
};


exports.createVehicle = async (req, res, next) => {
  try {
    const { error } = validation.createVehicleSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const vehicle = await vehicleService.createVehicle(req.body);

    res.status(201).json({
      success: true,
      vehicle
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();

    res.json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (err) {
    next(err);
  }
};

exports.getVehicleDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID' });
    }

    const vehicle = await vehicleService.getVehicleById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      success: true,
      vehicle
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { error } = validation.updateVehicleSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const vehicle = await vehicleService.updateVehicle(
      req.params.id,
      req.body
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      success: true,
      vehicle
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.deleteVehicle(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
