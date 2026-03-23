// routes/trip.routes.js
const express = require("express");
const router = express.Router();
const { getIO } = require("../../socket");
const { authenticateDriver } = require("../../middlewares/driverAuth.middleware");
const Trip = require('./trip.model')

// START TRIP
router.post("/start", async (req, res) => {
    try {
        const { tripId, driverId, customerLat, customerLng } = req.body;

        if (!tripId || !driverId) {
            return res.status(400).json({ error: "tripId and driverId are required" });
        }

        if (!customerLat || !customerLng) {
            return res.status(400).json({ error: "Customer location required" });
        }

        // Upsert — update if exists, create if not
        const trip = await Trip.findOneAndUpdate(
            { tripId },
            {
                tripId,
                driverId,
                customerLocation: { lat: customerLat, lng: customerLng },
                status: "active",
                startedAt: new Date(),
                locationHistory: [] // reset history on new trip
            },
            { upsert: true, new: true }
        );

        res.json({ message: "Trip started", tripId: trip.tripId });

    } catch (err) {
        console.error("Start trip error:", err);
        res.status(500).json({ error: "Failed to start trip" });
    }
});

// STOP TRIP
router.post("/stop", async (req, res) => {
    try {
        const { tripId, driverId } = req.body;

        if (!tripId || !driverId) {
            return res.status(400).json({ error: "tripId and driverId are required" });
        }

        const trip = await Trip.findOne({ tripId });

        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        // Verify driver owns this trip
        if (trip.driverId !== driverId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Mark trip as completed
        await Trip.findOneAndUpdate(
            { tripId },
            {
                status: "completed",
                endedAt: new Date(),
                driverLocation: null // clear last location
            }
        );

        getIO().to(`trip:${tripId}`).emit("trip_stopped");

        res.json({ message: "Trip stopped" });

    } catch (err) {
        console.error("Stop trip error:", err);
        res.status(500).json({ error: "Failed to stop trip" });
    }
});

// GET TRIP STATUS
router.get("/:tripId/status", async (req, res) => {
    try {
        const { tripId } = req.params;

        const trip = await Trip.findOne({ tripId }).select("-locationHistory"); // exclude history for performance

        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json({
            trip,
            driverLocation: trip.driverLocation || null
        });

    } catch (err) {
        console.error("Get trip status error:", err);
        res.status(500).json({ error: "Failed to get trip status" });
    }
});

// GET TRIP LOCATION HISTORY
router.get("/:tripId/history", async (req, res) => {
    try {
        const { tripId } = req.params;

        const trip = await Trip.findOne({ tripId }).select("locationHistory tripId");

        if (!trip) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json({
            tripId,
            totalPoints: trip.locationHistory.length,
            history: trip.locationHistory
        });

    } catch (err) {
        console.error("Get trip history error:", err);
        res.status(500).json({ error: "Failed to get trip history" });
    }
});
module.exports = router;