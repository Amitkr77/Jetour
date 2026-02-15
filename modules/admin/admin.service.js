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
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  };
};
