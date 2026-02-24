const Otp = require('../../model/otp.model');
const Customer = require('./customer.model')
const jwt = require('jsonwebtoken');

exports.verifyOtp = async (req, res) => {
    const { contact_number, otp } = req.body;

    const record = await Otp.findOne({ contact_number });

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

    const customer = await Customer.findOne({ contact_number });

    const token = jwt.sign(
        { id: customer.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    await Otp.deleteOne({ contact_number });

    res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: customer
    });
};


exports.sendOtp = async (req, res) => {
    const { contact_number } = req.body;

    const customer = await Customer.findOne({ contact_number });

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found"
        });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
        { contact_number },
        { otp, expires_at: expiry },
        { upsert: true, new: true }
    );

    // TODO: Integrate SMS provider here

    res.status(200).json({
        success: true,
        message: `OTP sent to ${contact_number} is ${otp} for testing purposes`
    });
};

exports.resendOtp = async (req, res) => {
    try {
        const { contact_number } = req.body;

        const customer = await Customer.findOne({ contact_number });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const existingOtp = await Otp.findOne({ contact_number });

        if (!existingOtp) {
            return res.status(400).json({
                success: false,
                message: "Please request OTP first"
            });
        }

        // ⏳ Cooldown: 60 seconds
        const cooldown = 60 * 1000;
        const timeSinceLastOtp = Date.now() - existingOtp.last_sent_at;

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
        existingOtp.resend_count += 1;
        existingOtp.last_sent_at = new Date();

        await existingOtp.save();

        // TODO: Send SMS here

        res.status(200).json({
            success: true,
            message: `OTP resent to ${contact_number} is ${newOtp} for testing purposes`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};