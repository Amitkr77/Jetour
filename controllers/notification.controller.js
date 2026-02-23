const Notification = require("../model/notification.model");

exports.getDriverNotifications = async (req, res) => {
  try {
    const driverId = req.user._id; // from auth middleware

    const notifications = await Notification.find({
      user_id: driverId,
      role: "driver"
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, {
      read: true
    });

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};