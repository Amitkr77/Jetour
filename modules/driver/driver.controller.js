const mongoose = require('mongoose');
const driverService = require('./driver.service');
const validation = require('./driver.validation');

exports.createDriver = async (req, res, next) => {
  try {
    const { error } = validation.createDriverSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const driver = await driverService.createDriver(req.body);

    res.status(201).json({
      success: true,
      driver
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await driverService.getAllDrivers();

    res.json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (err) {
    next(err);
  }
};

exports.getDriverDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid driver ID' });
    }

    const driver = await driverService.getDriverById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      driver
    });
  } catch (err) {
    next(err);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const { error } = validation.updateDriverSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const driver = await driverService.updateDriver(
      req.params.id,
      req.body
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      driver
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await driverService.deleteDriver(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
