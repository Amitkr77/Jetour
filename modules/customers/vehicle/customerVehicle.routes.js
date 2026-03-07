const express = require("express");
const router = express.Router();
const controller = require("./customerVehicle.controller");

router.post("/", controller.createCustomerVehicle);
router.put("/select", controller.selectCustomerVehicle);
router.put("/:id", controller.updateCustomerVehicle);
router.delete("/", controller.deleteCustomerVehicle);
router.get("/", controller.getCustomerVehicles);

module.exports = router;