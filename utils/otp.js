const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a 6-digit OTP and its expiry timestamp
 */

const generateOTP = () => ({
  otp: crypto.randomInt(100000, 999999).toString(),
  expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
});

/**
 * Returns true if the stored OTP matches and hasn't expired
 */
const verifyOTP = (stored, input) => {
  if (!stored?.otp || !stored?.expiresAt) return false;
  if (new Date() > new Date(stored.expiresAt)) return false;
  return stored.otp === input;
};

module.exports = { generateOTP, verifyOTP };