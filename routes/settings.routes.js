const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");

// Admin protected routes (add auth middleware if needed)

router.get("/", settingsController.getSettings);

router.put("/service-fee", settingsController.updateServiceFee);

router.get("/service-fee", settingsController.getServiceFee);

router.put("/booking-buffer", settingsController.updateBookingBuffer);

module.exports = router;