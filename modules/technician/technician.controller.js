const mongoose = require('mongoose');
const technicianService = require('./technician.service');
const validation = require('./technician.validation');
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('technician');

// Create Technician with optional image upload
exports.createTechnician = [
  parser.single('image'),
  async (req, res, next) => {
    try {
      const { error } = validation.createTechnicianSchema.validate(req.body);
      if (error)
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });

      const image = req.file ? req.file.path : req.body.image;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Technician image is required',
          data: null
        });
      }

      const technicianData = {
        ...req.body,
        image
      };

      const technician = await technicianService.createTechnician(technicianData);

      return res.status(201).json({
        success: true,
        message: 'Technician created successfully',
        data: technician
      });
    } catch (err) {
      next(err);
    }
  }
];

// Get all technicians
exports.getAllTechnicians = async (req, res, next) => {
  try {
    const technicians = await technicianService.getAllTechnicians();
    res.status(200).json({
      success: true,
      message: 'Technicians fetched successfully',
      data: technicians
    });
  } catch (err) {
    next(err);
  }
};

// Get single technician
exports.getTechnicianDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID', data: null });
    }

    const technician = await technicianService.getTechnicianById(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Technician fetched successfully',
      data: technician
    });
  } catch (err) {
    next(err);
  }
};

// Update Technician with optional new image
exports.updateTechnician = [
  parser.single('image'),
  async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID', data: null });
      }

      const { error } = validation.updateTechnicianSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }

      const updateData = {
        ...req.body,
        ...(req.file && { image: req.file.path }) // add image if uploaded
      };

      const technician = await technicianService.updateTechnician(req.params.id, updateData);

      if (!technician) {
        return res.status(404).json({
          success: false,
          message: 'Technician not found',
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: 'Technician updated successfully',
        data: technician
      });
    } catch (err) {
      next(err);
    }
  }
];

// Delete Technician
exports.deleteTechnician = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID', data: null });
    }

    const technician = await technicianService.deleteTechnician(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Technician deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
