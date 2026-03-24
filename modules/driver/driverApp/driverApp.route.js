const express = require("express");
const router = express.Router();
const driverController = require("./driverApp.controller");
// const authMiddleware = require("../middlewares/auth");
// const roleMiddleware = require("../middlewares/role");

// router.use(authMiddleware);
// router.use(roleMiddleware("driver"));

router.get("/dashboard/:driverId", driverController.getDashboard);
router.get("/active-trip/:driverId", driverController.getActiveTrip);
router.get("/assignments/:driverId", driverController.getAssignments);
router.get("/history", driverController.getHistory);

router.post("/pre-shift", driverController.createShift);

router.patch("/start-trip/:bookingId/:driverId", driverController.startTrip);
router.patch("/complete-trip/:bookingId/:driverId", driverController.completeTrip);

module.exports = router;