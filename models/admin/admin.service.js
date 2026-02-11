const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminModel = require('./admin.model');

exports.register = async (payload) => {
  const existing = await AdminModel.findByEmail(payload.email);
  if (existing) throw new Error('Admin already exists');

  const hashed = await bcrypt.hash(payload.password, 10);

  return AdminModel.createAdmin({
    ...payload,
    password: hashed
  });
};

exports.login = async (payload) => {
  const admin = await AdminModel.findByEmail(payload.email);
  if (!admin) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(payload.password, admin.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    {
      admin_id: admin.admin_id,
      role: admin.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    admin: {
      admin_id: admin.admin_id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  };
};
