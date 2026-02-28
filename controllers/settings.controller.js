const Settings = require("../model/settings.model");

// ✅ Get Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Service Fee
exports.updateServiceFee = async (req, res) => {
  try {
    const { service_fee } = req.body;

    if (service_fee < 0)
      return res.status(400).json({
        success: false,
        message: "Service fee cannot be negative"
      });

    const settings = await Settings.getSettings();
    settings.service_fee = service_fee;
    await settings.save();

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get Service Fee Only
exports.getServiceFee = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    res.json({
      success: true,
      data: {
        service_fee: settings.service_fee,
        currency: settings.currency
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};