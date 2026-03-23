// routes/trip.routes.js
const express = require("express");
const router = express.Router();
const { redisClient } = require("../../redis");
const { getIO } = require("../../socket");
const { authenticateDriver } = require("../../middlewares/driverAuth.middleware");

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

    // Update trip status instead of just deleting
    const tripData = await redisClient.get(`trip:${tripId}`);
    if (tripData) {
        const trip = JSON.parse(tripData);
        await redisClient.set(
            `trip:${tripId}`,
            JSON.stringify({ ...trip, status: "completed", endedAt: Date.now() }),
            { EX: 86400 } // Keep for 24hrs for reference, then auto-expire
        );
    }

    await redisClient.del(`driver:${driverId}:location`);
    await redisClient.expire(`trip:${tripId}:history`, 86400);

    getIO().to(`trip:${tripId}`).emit("trip_stopped");

    res.json({ message: "Trip stopped" });
});

// GET STATUS
router.get("/:tripId/status", async (req, res) => {
    const { tripId } = req.params;

    const tripData = await redisClient.get(`trip:${tripId}`);
    if (!tripData) return res.status(404).json({ error: "Trip not found" });

    const trip = JSON.parse(tripData);
    const location = await redisClient.get(`driver:${trip.driverId}:location`);

    res.json({
        trip,
        driverLocation: location ? JSON.parse(location) : null
    });
});

// Add a GET route to fetch history
router.get("/:tripId/history", async (req, res) => {
    const { tripId } = req.params;
    const history = await redisClient.lRange(`trip:${tripId}:history`, 0, -1);
    res.json({ history: history.map(h => JSON.parse(h)) });
});

module.exports = router;