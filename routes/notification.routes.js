const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

router.get(
    "/user/save-fcm-token",
    notificationController.saveFcmToken
);


module.exports = router;