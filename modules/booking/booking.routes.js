const express = require("express");
const router = express.Router();
const bookingController = require("../booking/booking.controller");

// Customer booking
router.post("/customer", bookingController.createCustomerBooking);
router.put(
    "/admin/assign/:booking_id",
    bookingController.assignDriver
);
router.get(
    "/admin/available-drivers/:booking_id",
    bookingController.getAvailableDrivers
);

router.put(
  "/admin/cancel/:booking_id",
  bookingController.cancelBooking
);

module.exports = router;