const AdminService = require('./admin.service');
const {
  registerSchema,
  loginSchema
} = require('./admin.validation');

/* REGISTER */
exports.register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const adminId = await AdminService.register(value);

    res.status(201).json({
      message: 'Admin registered successfully',
      admin_id: adminId
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* LOGIN */
exports.login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const data = await AdminService.login(value);
    res.json(data);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
