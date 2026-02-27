const mongoose = require('mongoose');
const serviceVanService = require('./serviceVan.service');
const validation = require('./serviceVan.validation');
const ServiceVan = require("./serviceVan.model");
const Driver = require("../driver/driver.model");
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('serviceVan');
const multer = require('multer');
const Technician = require("../technician/technician.model");

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

      const { driver_id, technician_id } = req.body;

      // 🔍 Find driver
      const driver = await Driver.findOne({ driver_id });
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
          data: null
        });
      }

      if (driver.assigned_van) {
        return res.status(400).json({
          success: false,
          message: "Driver already assigned to another van"
        });
      }

      // 🔍 Find technician
      const technician = await Technician.findOne({ technician_id });
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Technician not found",
          data: null
        });
      }

      if (technician.assigned_van) {
        return res.status(400).json({
          success: false,
          message: "Technician already assigned to another van"
        });
      }

      const image = req.file ? req.file.path : req.body.image;

      // ✅ Create van
      const van = await serviceVanService.createServiceVan({
        ...req.body,
        driver: driver._id,
        technician: technician._id,
        image
      });

      // ✅ Update driver & technician after van created
      driver.assigned_van = van._id;
      technician.assigned_van = van._id;

      await driver.save();
      await technician.save();

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
  }
];

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

    if (!mongoose.Types.ObjectId.isValid(vanId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid van ID"
      });
    }

    const van = await ServiceVan.findById(vanId);
    if (!van) {
      return res.status(404).json({
        success: false,
        message: "Service van not found"
      });
    }

    const driver = await Driver.findOne({ driver_id });
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

    if (van.driver && van.driver.equals(driver._id)) {
      return res.status(400).json({
        success: false,
        message: "Driver already assigned to this van"
      });
    }

    // Remove driver from previous van
    if (driver.assigned_van) {
      await ServiceVan.findByIdAndUpdate(
        driver.assigned_van,
        { driver: null }
      );
    }

    // Remove old driver from this van
    if (van.driver) {
      await Driver.findByIdAndUpdate(
        van.driver,
        { assigned_van: null, availability: "available" }
      );
    }

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

exports.assignTechnician = async (req, res) => {
  try {
    const { vanId } = req.params;
    const { technician_id } = req.body;

    // ✅ Validate vanId
    if (!mongoose.Types.ObjectId.isValid(vanId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid van ID"
      });
    }

    const van = await ServiceVan.findById(vanId);
    if (!van) {
      return res.status(404).json({
        success: false,
        message: "Service van not found"
      });
    }

    // ✅ Find technician using custom technician_id
    const technician = await Technician.findOne({ technician_id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found"
      });
    }

    // ✅ Check technician status
    if (technician.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Technician is not active"
      });
    }

    // ✅ Prevent reassigning same technician
    if (van.technician && van.technician.equals(technician._id)) {
      return res.status(400).json({
        success: false,
        message: "Technician already assigned to this van"
      });
    }

    // 🔥 Remove technician from previous van
    if (technician.assigned_van) {
      await ServiceVan.findByIdAndUpdate(
        technician.assigned_van,
        { technician: null }
      );
    }

    // 🔥 Remove old technician from this van
    if (van.technician) {
      await Technician.findByIdAndUpdate(
        van.technician,
        {
          assigned_van: null,
          availability: "available"
        }
      );
    }

    // ✅ Assign new technician
    van.technician = technician._id;
    await van.save();

    technician.assigned_van = van._id;
    technician.availability = "available";
    await technician.save();

    return res.json({
      success: true,
      message: "Technician assigned successfully",
      data: van
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
