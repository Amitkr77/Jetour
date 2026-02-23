const Booking = require("../booking/booking.model");
const Package = require("../package/package.model");
const Settings = require("../../model/settings.model");
const Counter = require("../../model/counter.model");
const Notification = require("../../model/notification.model");

// Helper to generate booking ID
async function generateBookingId() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "booking" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `BOOK-${counter.seq.toString().padStart(3, "0")}`;
}

exports.createCustomerBooking = async (req, res) => {
  try {
    const {
      customer,
      address,
      vehicle,
      package_id,
      booking_date,
      booking_time,
      payment_method,
      additional_notes
    } = req.body;

    // 1️⃣ Fetch Package
    const pkg = await Package.findById(package_id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    // 2️⃣ Strict Pricing Match
    const mileageRow = pkg.pricing.find(
      p => p.mileage === vehicle.mileage
    );

    if (!mileageRow) {
      return res.status(400).json({
        success: false,
        message: "No pricing for this mileage"
      });
    }

    const vehiclePrice = mileageRow.vehicles.find(
      v => v.vehicle_model.toString() === vehicle.vehicle_model
    );

    if (!vehiclePrice) {
      return res.status(400).json({
        success: false,
        message: "No pricing for this vehicle model at selected mileage"
      });
    }

    const basePrice = vehiclePrice.price;

    // 3️⃣ Fetch Settings
    const settings = await Settings.getSettings();
    const serviceFee = settings.service_fee;

    const totalAmount = basePrice + serviceFee;

    // 4️⃣ Create Start & End Time
    const startDateTime = new Date(`${booking_date}T${booking_time}`);
    const endDateTime = new Date(
      startDateTime.getTime() + pkg.worktime * 60 * 1000
    );

    // 5️⃣ Generate Booking ID
    const bookingId = await generateBookingId();

    // 6️⃣ Create Booking
    const booking = await Booking.create({
      booking_id: bookingId,
      created_by: "customer",

      customer,
      address,

      vehicle: {
        ...vehicle
      },

      package: {
        package_id: pkg._id,
        name: pkg.name,
        worktime: pkg.worktime,
        base_price: basePrice,
        service_fee: serviceFee,
        total_amount: totalAmount
      },

      start_time: startDateTime,
      end_time: endDateTime,

      payment: {
        method: payment_method,
        status: "paid",
        transaction_id: "SIMULATED_TXN_ID"
      },

      status: "paid",
      additional_notes
    });

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { driver_id, technician_id, service_van_id } = req.body;

    // 1️⃣ Fetch booking
    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid bookings can be assigned"
      });
    }

    // 2️⃣ Fetch settings
    const settings = await Settings.getSettings();
    const bufferMinutes = settings.booking_buffer_minutes;
    const bufferMs = bufferMinutes * 60 * 1000;

    // 3️⃣ Calculate buffered window
    const bufferedStart = new Date(booking.start_time.getTime() - bufferMs);
    const bufferedEnd = new Date(booking.end_time.getTime() + bufferMs);

    // 4️⃣ Check conflict
    const driverConflict = await Booking.findOne({
      "assignment.driver": driver_id,
      status: { $in: ["confirmed", "in-progress"] },
      start_time: { $lt: bufferedEnd },
      end_time: { $gt: bufferedStart }
    });

    if (driverConflict) {
      return res.status(400).json({
        success: false,
        message: "Driver not available within buffer time window"
      });
    }

    // 5️⃣ Technician conflict (if provided)
    if (technician_id) {
      const technicianConflict = await Booking.findOne({
        "assignment.technician": technician_id,
        status: { $in: ["confirmed", "in-progress"] },
        start_time: { $lt: bufferedEnd },
        end_time: { $gt: bufferedStart }
      });

      if (technicianConflict) {
        return res.status(400).json({
          success: false,
          message: "Technician not available within buffer time window"
        });
      }
    }

    // 6️⃣ Service Van conflict (if provided)
    if (service_van_id) {
      const vanConflict = await Booking.findOne({
        "assignment.service_van": service_van_id,
        status: { $in: ["confirmed", "in-progress"] },
        start_time: { $lt: bufferedEnd },
        end_time: { $gt: bufferedStart }
      });

      if (vanConflict) {
        return res.status(400).json({
          success: false,
          message: "Service van not available within buffer time window"
        });
      }
    }

    // 5️⃣ Assign
    booking.assignment.driver = driver_id;
    booking.assignment.technician = technician_id || null;
    booking.assignment.service_van = service_van_id || null;
    booking.assignment.assigned_at = new Date();

    booking.status = "confirmed";

    await booking.save();

    await Notification.create({
      user_id: driver_id,
      role: "driver",
      title: "New Booking Assigned",
      message: `Booking ${booking.booking_id} scheduled at ${booking.start_time}`,
      booking_id: booking.booking_id
    });

    if (technician_id) {
      await Notification.create({
        user_id: technician_id,
        role: "technician",
        title: "New Booking Assigned",
        message: `Booking ${booking.booking_id} scheduled at ${booking.start_time}`,
        booking_id: booking.booking_id
      });
    }

    res.json({
      success: true,
      message: "Driver assigned successfully",
      data: booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAvailableDrivers = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const booking = await Booking.findOne({ booking_id });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const settings = await Settings.getSettings();
    const bufferMs = settings.booking_buffer_minutes * 60 * 1000;

    const bufferedStart = new Date(booking.start_time.getTime() - bufferMs);
    const bufferedEnd = new Date(booking.end_time.getTime() + bufferMs);

    const conflictingBookings = await Booking.find({
      status: { $in: ["confirmed", "in-progress"] },
      start_time: { $lt: bufferedEnd },
      end_time: { $gt: bufferedStart }
    }).select("assignment.driver");

    const busyDriverIds = conflictingBookings
      .map(b => b.assignment.driver)
      .filter(Boolean);

    const Driver = require("../models/driver.model");

    const availableDrivers = await Driver.find({
      _id: { $nin: busyDriverIds }
    });

    res.json({ success: true, data: availableDrivers });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { status, date } = req.query;

    let filter = {};

    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.start_time = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(filter)
      .populate("assignment.driver")
      .populate("assignment.technician")
      .populate("assignment.service_van")
      .sort({ start_time: 1 });

    res.json({ success: true, data: bookings });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be cancelled"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
