const mongoose = require('mongoose');
const technicianService = require('./technician.service');
const validation = require('./technician.validation');
const createUploader = require('../../utils/uploadImage');
const parser = createUploader('technician');
const Technician = require('./technician.model')
const bcrypt = require('bcryptjs')
const PasswordChangeRequest = require('../../model/passwordRequest.model');
const jwt = require('jsonwebtoken');

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

exports.verifyTechnician = async (req, res, next) => {
  try {
    const { technician_id, password } = req.query;

    // If query params not present → skip this controller
    if (!technician_id || !password) {
      return next(); // allow normal /technician routes to work
    }

    const technician = await Technician
      .findOne({ technician_id })
      .select('+password');

    if (!technician) {
      return res.status(401).json({
        success: false,
        message: 'Invalid technician ID',
        data: null
      });
    }

    const isMatch = await bcrypt.compare(password, technician.password);

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
        id: technician._id,
        role: 'Technician'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );


    return res.status(200).json({
      success: true,
      message: 'Technician logged in successfully',
      token,
      data: {
        technician_id: technician.technician_id,
        name: technician.name,
        // _id: technician._id,
        // contact: technician.contact,
        // email: technician.email,
        // status: technician.status
      }
    });

  } catch (err) {
    next(err);
  }
};

exports.requestPasswordChange = async (req, res) => {
  try {
    const { technician_id, reason } = req.body;

    if (!technician_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID and reason are required'
      });
    }

    // Fetch technician from DB
    const technician = await Technician.findOne({ technician_id });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    await PasswordChangeRequest.create({
      user: technician._id,
      user_model: 'Technician',
      user_identifier: technician.technician_id,
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

exports.authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // 🔥 THIS IS IMPORTANT

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
