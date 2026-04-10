const Otp = require('../../model/otp.model');
const Customer = require('./customer.model')
const jwt = require('jsonwebtoken');
const twilioClient = require('../../utils/twilloClinet');

// const TEST_PHONE = "7688871771";
const TEST_PHONE = "7903500042";
const TEST_COUNTRY_CODE = "+91";
const TEST_OTP = "123456";

const isTestUser = (contact_number, country_code) => {
  return (
    contact_number === TEST_PHONE &&
    country_code === TEST_COUNTRY_CODE
  );
};

exports.verifyOtp = async (req, res) => {
  try {
    const { contact_number, country_code, otp } = req.body;

    if (!contact_number || !country_code || !otp) {
      return res.status(400).json({
        success: false,
        message: "contact_number, country_code, and otp are required"
      });
    }

    // ✅ TEST BYPASS
    if (isTestUser(contact_number, country_code)) {
      if (otp !== TEST_OTP) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP (TEST MODE)"
        });
      }

      let customer = await Customer.findOne({ contact_number, country_code });

      if (!customer) {
        customer = await Customer.create({ contact_number, country_code });
      }

      const token = jwt.sign(
        { id: customer.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Login successful (TEST MODE)",
        token,
        data: {
          user_id: customer.id,
        }
      });
    }

    //////////////////////////////////////////////////////
    // 🔎 Find OTP record using contact_number + country_code
    //////////////////////////////////////////////////////
    const record = await Otp.findOne({ contact_number, country_code });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found"
      });
    }

    if (record.expires_at < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    //////////////////////////////////////////////////////
    // 🔎 Find Customer using contact_number + country_code
    //////////////////////////////////////////////////////
    const customer = await Customer.findOne({ contact_number, country_code });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    //////////////////////////////////////////////////////
    // ⚡ Generate JWT
    //////////////////////////////////////////////////////
    const token = jwt.sign(
      { id: customer.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    //////////////////////////////////////////////////////
    // 🗑 Delete used OTP
    //////////////////////////////////////////////////////
    await Otp.deleteOne({ contact_number, country_code });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user_id: customer.id,
      }
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { contact_number, country_code } = req.body;

    if (!contact_number || !country_code) {
      return res.status(400).json({
        success: false,
        message: "contact_number and country_code are required"
      });
    }

     // ✅ TEST MODE OTP
    if (isTestUser(contact_number, country_code)) {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully (TEST MODE)",
        otp: TEST_OTP
      });
    }


    // Find existing customer
    let customer = await Customer.findOne({ contact_number, country_code });

    // auto register if not exists
    if (!customer) {
      customer = await Customer.create({ contact_number, country_code });
    }

   
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP in DB
    await Otp.findOneAndUpdate(
      { contact_number, country_code },
      { otp, expires_at: expiry },
      { upsert: true, returnDocument: "after" }
    );

    // Format phone with country code
    let phone = contact_number.replace(/\D/g, ''); // remove any non-digit chars
    let formattedPhone = country_code.startsWith('+')
      ? country_code + phone
      : '+' + country_code + phone;

    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your OTP for login is ${otp}. It will expire in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${formattedPhone} (OTP: ${otp} for testing)`
    });

  } catch (error) {
    console.error("OTP send error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { contact_number, country_code } = req.body;

    if (!contact_number || !country_code) {
      return res.status(400).json({
        success: false,
        message: "contact_number and country_code are required"
      });
    }

    // Find customer
    const customer = await Customer.findOne({ contact_number, country_code });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    if (isTestUser(contact_number, country_code)) {
      return res.status(200).json({
        success: true,
        message: "OTP resent successfully (TEST MODE)",
        otp: TEST_OTP
      });
    }

    const existingOtp = await Otp.findOne({ contact_number, country_code });

    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        message: "Please request OTP first"
      });
    }

    // ⏳ Cooldown: 60 seconds
    const cooldown = 60 * 1000;

    const lastSent = existingOtp.last_sent_at || 0;
    const timeSinceLastOtp = Date.now() - new Date(lastSent).getTime();

    if (timeSinceLastOtp < cooldown) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting OTP again"
      });
    }

    // 🚫 Max resend limit
    if (existingOtp.resend_count >= 3) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP resend attempts reached"
      });
    }

    // 🔢 Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    existingOtp.otp = newOtp;
    existingOtp.expires_at = new Date(Date.now() + 5 * 60 * 1000);
    existingOtp.resend_count = (existingOtp.resend_count || 0) + 1;
    existingOtp.last_sent_at = new Date();

    await existingOtp.save();

    // 📱 Format phone number
    let phone = contact_number.replace(/\D/g, '');
    let formattedPhone = country_code.startsWith('+')
      ? country_code + phone
      : '+' + country_code + phone;

    // 📩 Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your OTP for login is ${newOtp}. It will expire in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    res.status(200).json({
      success: true,
      message: `OTP resent successfully to ${formattedPhone} (OTP: ${newOtp} for testing)`
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP"
    });
  }
};