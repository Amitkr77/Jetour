const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

router.get(
  "/driver",
  notificationController.getDriverNotifications
);

router.put(
  "/:id/read",
  notificationController.markAsRead
);

module.exports = router;