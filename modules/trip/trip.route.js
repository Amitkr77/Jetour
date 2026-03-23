// routes/trip.routes.js
const express = require("express");
const router = express.Router();
const { redisClient } = require("../../redis");
const { getIO } = require("../../socket");

// START TRIP
router.post("/start", async (req, res) => {
    const { tripId, driverId, customerLat, customerLng } = req.body;

    if (!customerLat || !customerLng) {
        return res.status(400).json({ error: "Customer location required" });
    }

    await redisClient.set(
        `trip:${tripId}`,
        JSON.stringify({
            driverId,
            customerLocation: { lat: customerLat, lng: customerLng },
            status: "active"
        })
    );

    res.json({ message: "Trip started", tripId });
});

// STOP TRIP
router.post("/stop", async (req, res) => {
    const { tripId, driverId } = req.body;

    await redisClient.del(`driver:${driverId}:location`);
    getIO().to(`trip:${tripId}`).emit("trip_stopped");

    res.json({ message: "Trip stopped" });
});

module.exports = router;