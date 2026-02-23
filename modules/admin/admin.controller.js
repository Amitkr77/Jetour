const AdminService = require('./admin.service');

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
