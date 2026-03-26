const jwt = require('jsonwebtoken');
const Admin = require('./admin.model');
const { generateOTP, verifyOTP } = require('../../utils/otp');
const twilioClient = require('../../utils/twilloClinet');

// const { sendOTP } = require('../utils/sms');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ────────────────── ───────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  const { username, country_code, contact, password } = req.body;

  const existing = await Admin.findOne({ contact });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Contact already registered' });
  }

  const admin = await Admin.create({ username, country_code, contact, password });

  res.status(201).json({ success: true, data: admin });
};

// ─────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username: username }).select('+password');
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials, user not found!' });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  await admin.updateLastLogin();

  const token = signToken(admin._id);
  res.status(200).json({ success: true, token, data: admin });
};

// ─────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { contact, country_code } = req.body;

  const admin = await Admin.findOne({ contact }).select('+otp +otpExpiresAt');
  if (!admin) {
    // Deliberately vague — don't reveal whether contact exists
    return res.status(200).json({ success: true, message: 'If this number is registered, an OTP has been sent' });
  }

  const { otp, expiresAt } = generateOTP();

  admin.otp = otp;
  admin.otpExpiresAt = expiresAt;
  admin.otpVerified = false;
  await admin.save({ validateBeforeSave: false });


  // Format phone with country code
  let phone = contact.replace(/\D/g, '');
  let formattedPhone = country_code.startsWith('+')
    ? country_code + phone
    : '+' + country_code + phone;

  // Send SMS via Twilio
  await twilioClient.messages.create({
    body: `Your OTP for login is ${otp}. It will expire in 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedPhone
  });

  // await sendOTP(country_code || admin.country_code, contact, otp);

  res.status(200).json({ success: true, message: 'OTP sent to your registered number' });
};

// ─────────────────────────────────────────────
// POST /auth/verify-otp
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  const { contact, otp } = req.body;

  const admin = await Admin.findOne({ contact }).select('+otp +otpExpiresAt +otpVerified');
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin not found' });
  }

  const valid = verifyOTP({ otp: admin.otp, expiresAt: admin.otpExpiresAt }, otp);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  // Mark OTP as verified — only then allow reset-password
  admin.otpVerified = true;
  await admin.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'OTP verified. Proceed to reset password.' });
};

// ─────────────────────────────────────────────
// POST /auth/reset-password
// Body: { contact, newPassword }
// ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { contact, newPassword } = req.body;

  const admin = await Admin.findOne({ contact }).select('+otp +otpExpiresAt +otpVerified +password');
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin not found' });
  }

  if (!admin.otpVerified) {
    return res.status(403).json({ success: false, message: 'OTP not verified. Please verify OTP first.' });
  }

  admin.password = newPassword;   // pre-save hook will hash it
  await admin.clearOTP();         // saves + wipes all OTP fields atomically

  res.status(200).json({ success: true, message: 'Password reset successful' });
};

// ─────────────────────────────────────────────
// GET /admin/profile
// Protected route — requires valid JWT
// ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const admin = await Admin.findById(req?.admin?._id);
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin not found' });
  }

  res.status(200).json({ success: true, data: admin });
};

// ─────────────────────────────────────────────
// PATCH /admin/profile
// Protected route — requires valid JWT
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const ALLOWED_FIELDS = ['name', 'country_code', 'contact'];

  // Strip out any fields not in the allowed list
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
  }

  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Profile updated', data: admin });
};

// ─────────────────────────────────────────────
// PATCH /admin/change-password
// Protected route — requires valid JWT
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password' });
  }

  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin not found' });
  }

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  admin.password = newPassword; // pre-save hook will hash it
  await admin.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
};