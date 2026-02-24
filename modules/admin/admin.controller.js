const AdminService = require('./admin.service');
const PasswordChangeRequest =  require('../../model/passwordRequest.model')
const mongoose = require('mongoose');
//
// Register
//
exports.register = async (req, res, next) => {
  try {
    const adminId = await AdminService.registerAdmin(req.body);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: adminId
    });
  } catch (error) {
    next(error);
  }
};

//
// Login
//
exports.login = async (req, res, next) => {
  try {
    const data = await AdminService.loginAdmin(req.body);
    console.log(data);
    

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    error.status = 401;
    next(error);
  }
};

// 
// Profile
// 
exports.profile = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin
  });
};

exports.getProfile = async (req, res) => {
  try {
    const data = await AdminService.getProfile(req.user.id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const data = await AdminService.updateProfile(
      req.user.id,
      req.body
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    await AdminService.changePassword(
      req.user.id,
      req.body.current_password,
      req.body.new_password
    );

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.adminApprovePasswordChange = async (req, res) => {
  try {
    const { request_id, new_password } = req.body;

    // 1️⃣ Validate input
    if (!request_id || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 2️⃣ Find request
    const request = await PasswordChangeRequest.findById(request_id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password change request not found'
      });
    }

    // 3️⃣ Prevent double approval
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // 4️⃣ Get dynamic model safely
    const Model = mongoose.model(request.user_model);

    const user = await Model.findById(request.user).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 5️⃣ Hash password (VERY IMPORTANT 🔥)
    // const bcrypt = require('bcrypt');
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(new_password, salt);

    user.password = new_password;
    await user.save();

    // 6️⃣ Update request
    request.status = 'approved';
    request.action_by = req.admin._id; 
    request.action_at = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPasswordChangeRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Optional status filter
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const requests = await PasswordChangeRequest
      .find(filter)
      .populate('user', 'name technician_id email contact')
      .populate('action_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PasswordChangeRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      current_page: Number(page),
      total_pages: Math.ceil(total / limit),
      data: requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};