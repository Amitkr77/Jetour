const express = require("express");
const router = express.Router();
const bookingController = require("../booking/booking.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Customer booking
router.get("/dashboard", bookingController.getBookingDashboard);
router.get("/", bookingController.getAllBookings)
router.get("/:booking_id/images", bookingController.getBookingImages);
router.post("/customer", bookingController.createCustomerBooking);
router.post("/admin", bookingController.createAdminBooking);
router.patch("/admin/:id", bookingController.updateAdminBooking);
router.get("/customer", bookingController.getCustomerBookings);
router.get("/customer/:customer_id/confirmed", bookingController.getConfirmedBookingsByCustomer);
router.get("/filter", bookingController.getBookingByFilter);
router.get("/:booking_id", bookingController.getBookingById);
router.post("/customer/confirm", bookingController.confirmBookingPayment);
// router.get("/customer/history/:customer_id", bookingController.getCustomerBookingHistory);

router.put(
    "/admin/cancel", protect,
    bookingController.cancelBooking
);

router.patch(
    "/update-assignment/:booking_id", protect,
    bookingController.updateBookingAssignment
);

router.get("/track-booking/:booking_id", protect, bookingController.trackBooking);

module.exports = router;