const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { sendNotificationToUser } = require("../controllers/notification.controller");

router.get(
    "/user/save-fcm-token",
    notificationController.saveFcmToken
);

router.get("/send-notification", notificationController.sendNotificationToUser);

router.get("/send-test-notification", async (req, res) => {
    try {
        await sendNotificationToUser(
            req.user?.id,
            "🚗 Booking Update",
            "Your service has been assigned!",
            { booking_id: "12345" }
        );

        res.json({ message: "Notification sent" });

    } catch (error) {
        res.status(500).json({ message: "Error sending notification", error: error.message });
    }
}
);

module.exports = router;