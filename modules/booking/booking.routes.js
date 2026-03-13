const express = require("express");
const router = express.Router();
const bookingController = require("../booking/booking.controller");

// Customer booking
router.get("/dashboard", bookingController.getBookingDashboard);
router.get("/", bookingController.getAllBookings)
router.post("/customer", bookingController.createCustomerBooking);
router.post("/admin", bookingController.createAdminBooking);
router.get("/customer", bookingController.getCustomerBookings);
router.get("/filter", bookingController.getBookingByFilter);
router.get("/:booking_id", bookingController.getBookingById);
router.post("/customer/confirm", bookingController.confirmBookingPayment);
// router.get("/customer/history/:customer_id", bookingController.getCustomerBookingHistory);

router.put(
    "/admin/cancel/:booking_id",
    bookingController.cancelBooking
);
router.patch(
    "/update-assignment/:booking_id",
    bookingController.updateBookingAssignment
);

router.get("/track-booking/:booking_id", bookingController.trackBooking);

module.exports = router;