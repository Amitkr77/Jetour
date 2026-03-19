const mongoose = require('mongoose');
const driverService = require('./driver.service');
const validation = require('./driver.validation');
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('driver');
const Driver = require('./driver.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PasswordChangeRequest = require('../../model/passwordRequest.model')
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
        ...(req.file && { image: req.file.path })
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

// Driver availability
exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    driver.availability = availability;
    await driver.save();

    res.json({
      success: true,
      message: "Availability updated",
      data: driver
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyDriver = async (req, res, next) => {
  try {
    const { driver_id, password } = req.query;

    // If not verifying, move to next route
    if (!driver_id || !password) {
      return next();
    }

    const driver = await Driver
      .findOne({ driver_id })
      .select('+password');

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Invalid driver ID',
        data: null
      });
    }

    const isMatch = password === driver.password

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        data: null
      });
    }

    // 🔥 Generate JWT Token
    const token = jwt.sign(
      {
        id: driver._id,
        role: 'Driver'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Driver verified successfully',
      token,
      data: {
        // _id: driver._id,
        driver_id: driver.driver_id,
        name: driver.name,
        // contact: driver.contact,
        // status: driver.status
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.requestPasswordChange = async (req, res) => {
  try {
    const { driver_id, reason } = req.body;

    if (!driver_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID and reason are required'
      });
    }

    // Fetch driver from DB
    const driver = await Driver.findOne({ driver_id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    await PasswordChangeRequest.create({
      user: driver._id,
      user_model: 'Driver',
      user_identifier: driver.driver_id,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Password change request sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
