const notificationModel = require("../model/notification.model");
const admin = require("../config/firebase")

exports.saveFcmToken = async (req, res) => {
  try {
    const { token, device_type } = req.body;

    if (!token || !device_type) {
      return res.status(400).json({
        message: "Token and device_type are required"
      });
    }

    const update = {
      user_id: req.user.id,
      role: req.user.role,
      token,
      device_type,
      is_active: true
    };

    await notificationModel.findOneAndUpdate(
      { token }, // unique token-based update
      update,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({ message: "Token saved successfully" });

  } catch (error) {
    console.error("Save FCM Token Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendNotificationToUser = async (user_id, title, body, data = {}) => {
  try {
    // 1. Get active tokens
    const tokens = await notificationModel.find({
      user_id,
      is_active: true
    }).distinct("token");

    if (!tokens.length) {
      console.log("No active tokens found");
      return;
    }

    // 2. Create message payload
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data
      },
      tokens
    };

    // 3. Send notification
    const response = await admin.messaging().sendMulticast(message);

    console.log("Success:", response.successCount);
    console.log("Failed:", response.failureCount);

    // 4. Remove invalid tokens (IMPORTANT)
    if (response.failureCount > 0) {
      const failedTokens = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      await notificationModel.deleteMany({ token: { $in: failedTokens } });
    }

  } catch (error) {
    console.error("Notification Error:", error);
  }
};


exports.sendTestNotification = async (req, res) => {
  try {
    await sendNotificationToUser(
      req.user.id,
      "🚗 Booking Update",
      "Your service has been assigned!",
      { booking_id: "12345" }
    );

    res.json({ message: "Notification sent" });

  } catch (error) {
    res.status(500).json({ message: "Error sending notification", error: error.message });
  }
};



// data: {
//   screen: "booking",
//   booking_id: "123"
// }


// notification: {
//   title: "Title",
//   body: "Message"
// }