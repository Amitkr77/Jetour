const mongoose = require('mongoose');
const vehicleService = require('./vehicle.service');
const validation = require('./vehicle.validation');
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('vehicle');
// Create vehicle with optional image upload
exports.createVehicle = [
  parser.single('vehicle_image'), 
  async (req, res, next) => {
    try {
      const { error } = validation.createVehicleSchema.validate(req.body);
      if (error)
        return res.status(400).json({ success: false, message: error.message, data: null });

      const vehicleData = {
        vehicle_category: req.body.vehicle_category,
        vehicle_model: req.body.vehicle_model,
        vehicle_image: req.file ? req.file.path : req.body.vehicle_image // file or URL
      };

      const vehicle = await vehicleService.createVehicle(vehicleData);

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle
      });
    } catch (err) {
      next(err);
    }
  }
];

exports.getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();

    res.status(200).json({
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles
    });
  } catch (err) {
    next(err);
  }
};

exports.getVehicleDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID', data: null });
    }

    const vehicle = await vehicleService.getVehicleById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found', data: null });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle fetched successfully',
      data: vehicle
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = [
  parser.single('vehicle_image'),
  async (req, res, next) => {
    try {
      const vehicleId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({ success: false, message: 'Invalid vehicle ID', data: null });
      }

      const { error } = validation.updateVehicleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.message, data: null });
      }

      // Include new image URL if file uploaded
      const updateData = {
        ...req.body,
        ...(req.file && { vehicle_image: req.file.path }) // only add if file exists
      };

      const vehicle = await vehicleService.updateVehicle(vehicleId, updateData);

      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found', data: null });
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle
      });
    } catch (err) {
      next(err);
    }
  }
];

exports.deleteVehicle = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle ID', data: null });
    }

    const vehicle = await vehicleService.deleteVehicle(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found', data: null });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
