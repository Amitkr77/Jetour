const jwt = require('jsonwebtoken');
const Admin = require('./admin.model');

//
// Register Admin
//
exports.registerAdmin = async (payload) => {
  const existing = await Admin.findOne({ email: payload.email });
  if (existing) {
    throw new Error('Admin already exists');
  }

  const admin = await Admin.create(payload);

  return admin._id;
};

//
// Login Admin
//
exports.loginAdmin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    {
      id: admin._id,
      role: admin.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  };
};

exports.updateProfile = async (adminId, payload) => {
  return await Admin.findByIdAndUpdate(
    adminId,
    payload,
    { new: true }
  ).select("-password");
};

exports.changePassword = async (adminId, currentPassword, newPassword) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  admin.password = hashedPassword;

  await admin.save();

  return true;
};

exports.getProfile = async (adminId) => {
  return await Admin.findById(adminId).select("-password");
};
