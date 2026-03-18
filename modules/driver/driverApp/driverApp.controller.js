// const DriverShift = require("../models/driverShift.model");
const Booking = require("../../booking/booking.model")
const Driver = require("../../driver/driver.model")

exports.getDashboard = async (req, res) => {
    try {
        const driverId = req.user?.id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const todayStr = new Date().toISOString().split("T")[0];

        console.log(todayStr);


        const bookings = await Booking.find({
            "assignment.driver": driver._id,
            "schedule.date": todayStr
        }).populate("assignment.service_van", " _id vehicle_model last_service_date");

        const completedTrips = bookings.filter(
            b => b.trip_details?.trip_status === "completed"
        ).length;

        const totalTrips = bookings.length;

        res.json({
            success: true,
            message: "Driver dashboard data",
            data: {
                van: bookings[0]?.assignment?.service_van || null,
                total_trips: totalTrips,
                completed: completedTrips,
                pending: totalTrips - completedTrips
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getActiveTrip = async (req, res) => {
    try {
        const driverId = req.user?.id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        console.log(driverId);


        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const booking = await Booking.findOne({
            "assignment.driver": driver._id,
            status: { $in: ["confirmed", "driver_on_the_way", "arrived", "in-progress"] }
        })
            .populate("assignment.technician", "name techinician_id");

        res.json(booking);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const driverId = req.user?.id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const bookings = await Booking.find({
            "assignment.driver": driver._id
        })
            .populate("assignment.technician", "name technician_id contact")
            .populate("assignment.driver", "name driver_id ")
            .sort({ "schedule.date": 1 });

        res.json(bookings);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createShift = async (req, res) => {
    try {
        const driverId = req.user.id;

        const shift = await DriverShift.create({
            driver_id: driverId,
            van_id: req.body.van_id,
            shift_date: new Date(),
            checklist: req.body.checklist,
            notes: req.body.notes,
            shift_status: "open"
        });

        res.json({ message: "Shift started", shift });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.startTrip = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const driverId = req.user?.id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        const booking = await Booking.findById(bookingId);

        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        if (booking.assignment.driver.toString() !== driver._id.toString())
            return res.status(403).json({ message: "Unauthorized" });

        booking.status = "driver_on_the_way";
        booking.trip_details.status = "on_the_way"

        await booking.save();

        res.json({ message: "Trip started", booking });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.completeTrip = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const driverId = req.user.id;

        const booking = await Booking.findById(bookingId);

        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        if (booking.assignment.driver.toString() !== driverId)
            return res.status(403).json({ message: "Unauthorized" });

        booking.trip_details = {
            ...booking.trip_details,
            status: "completed",
            distance: req.body.distance,
            duration: req.body.duration,
            arrival_confirmed: true,
            vehicle_parked: true,
            notes: req.body.notes
        };

        // Final completion if technician already finished
        if (booking.service_progress?.status === "completed") {
            booking.status = "completed";
        }

        await booking.save();

        res.json({ message: "Trip completed", booking });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const driverId = req.user.id;

        const history = await Booking.find({
            "assignment.driver": driverId,
            "trip_details.trip_status": "completed"
        }).sort({ updatedAt: -1 });

        res.json(history);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};