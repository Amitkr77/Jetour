const express = require("express");
const router = express.Router();
const scheduleController = require("./schedule.controller");

// Create new schedule config
router.post("/", scheduleController.createSchedule);

// Get active schedule
router.get("/active", scheduleController.getActiveSchedule);

// Update full schedule config
router.put("/:id", scheduleController.updateSchedule);

// 🎯 Update only buffer_between_bookings_minutes
router.patch(
    "/update-buffer",
    scheduleController.updateBufferBetweenBookings
);

// ➕ Add holiday
router.post("/holiday", scheduleController.addHoliday);

// ➖ Remove holiday
router.delete("/holiday/:date", scheduleController.removeHoliday);

// 🔄 Toggle operating day
router.patch("/operating-day/:day/toggle", scheduleController.toggleOperatingDay);

module.exports = router;