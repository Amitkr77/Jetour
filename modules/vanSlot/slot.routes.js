const express = require("express");
const router = express.Router();
const slotController = require("./slot.controller");

router.get("/available", slotController.getAvailableSlots);

module.exports = router;