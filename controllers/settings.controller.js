const Settings = require("../model/settings.model");
const ScheduleConfig = require("../modules/schedule/schedule.model");


// ✅ Get Settings
exports.getSettings = async (req, res) => {
  try {
    // Get settings
    const settings = await Settings.getSettings();

    // Get the active schedule config
    const scheduleConfig = await ScheduleConfig.findOne({ is_active: true }).sort({ version: -1 });

    res.json({
      success: true,
      data: {
        service_fee: settings.service_fee,
        currency: settings.currency,
        buffer_between_bookings_minutes: scheduleConfig?.buffer_between_bookings_minutes || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Settings (service fee + buffer time)
exports.updateSettings = async (req, res) => {
  try {
    const { service_fee, buffer_between_bookings_minutes } = req.body;

    // Validation
    if (service_fee !== undefined && service_fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Service fee cannot be negative",
      });
    }

    if (
      buffer_between_bookings_minutes !== undefined &&
      buffer_between_bookings_minutes < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Buffer time cannot be negative",
      });
    }

    // Update Settings
    const settings = await Settings.getSettings();
    if (service_fee !== undefined) settings.service_fee = service_fee;
    await settings.save();

    // Update active ScheduleConfig
    if (buffer_between_bookings_minutes !== undefined) {
      const scheduleConfig = await ScheduleConfig.findOne({ is_active: true }).sort({ version: -1 });
      if (scheduleConfig) {
        scheduleConfig.buffer_between_bookings_minutes = buffer_between_bookings_minutes;
        await scheduleConfig.save();
      }
    }

    res.json({
      success: true,
      data: {
        service_fee: settings.service_fee,
        currency: settings.currency,
        buffer_between_bookings_minutes: buffer_between_bookings_minutes ?? undefined,
      },
    });
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