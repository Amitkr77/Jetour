const mongoose = require('mongoose');
const driverService = require('./driver.service');
const validation = require('./driver.validation');
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('driver');
// Create driver with optional image upload
exports.createDriver = [
  parser.single('image'),
  async (req, res, next) => {
    try {
      const { error } = validation.createDriverSchema.validate(req.body);
      if (error) return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });

      const image = req.file ? req.file.path : req.body.image;

      // Optionally require image
      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Driver image is required',
          data: null
        });
      }

      const driverData = {
        ...req.body,
        image
      };

      const driver = await driverService.createDriver(driverData);

      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: driver
      });
    } catch (err) {
      next(err);
    }
  }
];

// Get all drivers
exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.status(200).json({
      success: true,
      message: 'Drivers fetched successfully',
      data: drivers
    });
  } catch (err) {
    next(err);
  }
};

// Get single driver
exports.getDriverDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid driver ID', data: null });
    }

    const driver = await driverService.getDriverById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver fetched successfully',
      data: driver
    });
  } catch (err) {
    next(err);
  }
};

// Update driver with optional image upload
exports.updateDriver = [
  parser.single('image'),
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid driver ID', data: null });
      }

      const { error } = validation.updateDriverSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message, data: null });

      const updateData = {
        ...req.body,
        ...(req.file && { image: req.file.path }) // add image if uploaded
      };

      const driver = await driverService.updateDriver(req.params.id, updateData);

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: 'Driver updated successfully',
        data: driver
      });
    } catch (err) {
      next(err);
    }
  }
];

// Delete driver
exports.deleteDriver = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid driver ID', data: null });
    }

    const driver = await driverService.deleteDriver(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
