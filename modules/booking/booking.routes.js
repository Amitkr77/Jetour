const express = require("express");
const router = express.Router();
const bookingController = require("../booking/booking.controller");

// Customer booking
router.post("/customer", bookingController.createCustomerBooking);
router.get("/customer", bookingController.getCustomerBookings);
router.get("/:booking_id", bookingController.getBookingById);
router.post("/customer/confirm", bookingController.confirmBookingPayment);
// router.get("/customer/history/:customer_id", bookingController.getCustomerBookingHistory);
router.get("/dashboard", bookingController.getBookingDashboard);

router.put(
    "/admin/cancel/:booking_id",
    bookingController.cancelBooking
);

router.get("/track-booking/:booking_id", bookingController.trackBooking);

module.exports = router;