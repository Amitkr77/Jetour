const express = require("express");
const router = express.Router();

const controller = require("./package.controller");

router.post("/",controller.create)

router.get("/", controller.getAll);

router.get("/:id", controller.getOne);

router.put(
    "/:id", controller.update);

router.patch(
    "/:id/status",
    controller.changeStatus
);

router.post("/calculate-price", controller.calculatePrice);

module.exports = router;
