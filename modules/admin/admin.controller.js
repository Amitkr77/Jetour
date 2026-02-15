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
      adminId
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
