// const DriverShift = require("../models/driverShift.model");
const Booking = require("../../booking/booking.model")
const Driver = require("../../driver/driver.model")

function formatTime(time) {
    if (!time) return null;

    const [hour, minute] = time.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
}

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
            return res.status(400).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        const bookings = await Booking.find({
            "assignment.driver": driver._id
        })
            .populate("assignment.technician", "name technician_id contact")
            .populate("assignment.driver", "name driver_id")
            .sort({ "schedule.date": 1 });

        const filteredData = bookings.map(b => ({
            booking_id: b._id,

            package_name: b.package?.name,

            schedule_time: formatTime(b.schedule?.start_time),

            customer_location: {
                lat: b.address?.lat || null,
                lng: b.address?.lng || null
            },

            technician: {
                name: b.assignment?.technician?.name,
                technician_id: b.assignment?.technician?.technician_id,
                contact: b.assignment?.technician?.contact
            },

            driver: {
                name: b.assignment?.driver?.name,
                id: b.assignment?.driver?.driver_id
            },
            status: b.status === "driver_on_the_way"
                ? "active"
                : b.status === "driver_reached"
                    ? "completed"
                    : b.status === "confirmed"
                        ? "schedule"
                        : b.status
        }));

        return res.status(200).json({
            success: true,
            message: "Assignments fetched successfully",
            total: filteredData.length,
            data: filteredData
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
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
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // ✅ Authorization check
        if (booking.assignment.driver.toString() !== driver._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 🚫 Restrict invalid transition
        // if (booking.status !== "confirmed") {
        //     return res.status(400).json({
        //         message: `Trip cannot be started. Current status is '${booking.status}'. It must be 'confirmed'.`
        //     });
        // }

        // ✅ Start trip
        const now = new Date();

        booking.status = "driver_on_the_way";
        booking.trip_details.status = "driver_on_the_way";
        booking.trip_details.van_started_at = now;

        await booking.save();

        // ✅ FILTERED RESPONSE
        const responseData = {
            booking_id: booking._id,
            status: booking.status,

            customer: {
                name: booking.customer?.name,
                phone: booking.customer?.phone
            },

            location: {
                lat: booking.address?.lat,
                lng: booking.address?.lng,
                area: booking.address?.area,
                street: booking.address?.street
            },

            trip: {
                status: booking.trip_details?.status,
                started_at: booking.trip_details?.van_started_at
            }
        };

        return res.json({
            success: true,
            message: "Trip started successfully",
            data: responseData
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.completeTrip = async (req, res) => {
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
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // ✅ Authorization
        if (booking.assignment.driver.toString() !== driver._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // ===============================
        // 🚫 STATUS VALIDATION (IMPORTANT)
        // ===============================
        if (
            booking.status !== "driver_on_the_way" ||
            booking.trip_details?.status !== "driver_on_the_way"
        ) {
            return res.status(400).json({
                message: `Trip cannot be completed. Current status is booking='${booking.status}', trip='${booking.trip_details?.status}'. Both must be 'driver_on_the_way'.`
            });
        }

        // ===============================
        // ✅ VALID TRANSITION
        // ===============================
        const now = new Date();

        booking.status = "driver_reached";
        booking.trip_details = {
            ...booking.trip_details,
            status: "driver_reached",
            distance: req.body?.distance || booking.trip_details.distance,
            duration: req.body?.duration || booking.trip_details.duration,
            arrival_confirmed: true,
            arrived_at: now,
            vehicle_parked: true,
            notes: req.body?.notes || booking.trip_details.notes
        };

        // ✅ Final completion if service done
        if (booking.service_progress?.status === "completed") {
            booking.status = "completed";
        }

        await booking.save();

        // ===============================
        // ✅ CLEAN DRIVER RESPONSE
        // ===============================
        const responseData = {
            booking_id: booking._id,
            status: booking.status,

            customer: {
                name: booking.customer?.name,
                phone: booking.customer?.phone
            },

            location: {
                lat: booking.address?.lat,
                lng: booking.address?.lng,
                area: booking.address?.area,
                street: booking.address?.street
            },

            trip: {
                distance: booking.trip_details?.distance,
                duration: booking.trip_details?.duration,
                status: booking.trip_details?.status,
                arrived_at: booking.trip_details?.arrived_at
            }
        };

        return res.json({
            success: true,
            message: "Driver reached location successfully",
            data: responseData
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const driverId = req.user?.id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: "Driver ID is required" });
        }

        const driver = await Driver.findOne({ driver_id: driverId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const history = await Booking.find({
            "assignment.driver": driver._id,
            "trip_details.trip_status": "driver_reached"
        }).sort({ updatedAt: -1 });

        res.json(history);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};