const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  contact_number: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  resend_count: {
    type: Number,
    default: 0
  },
  last_sent_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);