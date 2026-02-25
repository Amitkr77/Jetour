const mongoose = require('mongoose');
const serviceVanService = require('./serviceVan.service');
const validation = require('./serviceVan.validation');
const ServiceVan = require("./serviceVan.model");
const Driver = require("../driver/driver.model");
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('serviceVan');
const multer = require('multer');

exports.createServiceVan = [
  parser.single('image'),
  async (req, res, next) => {
    try {
      const { error } = validation.createServiceVanSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      const image = req.file ? req.file.path : req.body.image;

      const van = await serviceVanService.createServiceVan({
        ...req.body,
        image
      });

      return res.status(201).json({
        success: true,
        message: 'Service van created successfully',
        data: van
      });
    } catch (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
  }]

exports.getAllServiceVans = async (req, res, next) => {
  try {
    const vans = await serviceVanService.getAllServiceVans();

    return res.status(200).json({
      success: true,
      message: 'Service vans fetched successfully',
      data: vans
    });
  } catch (err) {
    next(err);
  }
};

exports.getServiceVanDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const van = await serviceVanService.getServiceVanById(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van fetched successfully',
      data: van
    });
  } catch (err) {
    next(err);
  }
};

exports.updateServiceVan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const { error } = validation.updateServiceVanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const updateData = {
      ...req.body,
      ...(req.file && { image: req.file.path })
    };

    const van = await serviceVanService.updateServiceVan(
      req.params.id,
      updateData
    );

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van updated successfully',
      data: van
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteServiceVan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const van = await serviceVanService.deleteServiceVan(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { vanId } = req.params;
    const { driver_id } = req.body;

    const van = await ServiceVan.findById(vanId);
    if (!van) {
      return res.status(404).json({
        success: false,
        message: "Service van not found"
      });
    }

    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    if (driver.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Driver is not active"
      });
    }

    // 🔥 Remove driver from previous van
    if (driver.assigned_van) {
      await ServiceVan.findByIdAndUpdate(
        driver.assigned_van,
        { driver: null }
      );
    }

    // 🔥 Remove old driver from this van
    if (van.driver) {
      await Driver.findByIdAndUpdate(
        van.driver,
        { assigned_van: null }
      );
    }

    // ✅ Assign new driver
    van.driver = driver._id;
    await van.save();

    driver.assigned_van = van._id;
    driver.availability = "available";
    await driver.save();

    res.json({
      success: true,
      message: "Driver assigned successfully",
      data: van
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
