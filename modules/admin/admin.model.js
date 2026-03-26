const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [100, 'Username cannot exceed 100 characters']
    },
    country_code: {
      type: String,
      trim: true,
      match: [/^\+\d{1,4}$/, 'Invalid country code (e.g. +91)']
    },
    contact: {
      type: String,
      trim: true,
      unique: true,
      match: [/^\d{7,15}$/, 'Contact must be 7–15 digits']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: { values: ['SUPER_ADMIN', 'ADMIN'], message: '{VALUE} is not a valid role' },
      default: 'ADMIN'
    },
    lastLoginAt: { type: Date, default: null },

    // OTP fields — only populated during forgot-password flow
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false, select: false }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiresAt;
        delete ret.otpVerified;
        return ret;
      }
    }
  }
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ─── Methods ──────────────────────────────────────────────────────────────────

adminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

adminSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpiresAt = undefined;
  this.otpVerified = false;
  return this.save();
};

// ─── Statics ──────────────────────────────────────────────────────────────────

adminSchema.statics.findByContact = function (contact) {
  return this.findOne({ contact });
};

module.exports = mongoose.model('Admin', adminSchema);