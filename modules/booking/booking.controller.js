// controllers/booking.controller.js

const mongoose = require("mongoose");
const Booking = require("../booking/booking.model");
const ServicePackage = require("../package/package.model");
const VanSlot = require("../vanSlot/vanSlot.model");
const ServiceVan = require("../serviceVan/serviceVan.model");
const ScheduleConfig = require("../schedule/schedule.model");
const Notification = require("../../model/notification.model");

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

    // 1. Validate package
    const servicePackage = await ServicePackage.findById(package_id);
    if (!servicePackage) {
      return res.status(400).json({ message: "Invalid package" });
    }

    // 2. Calculate amount (use your existing logic)
    const amount = servicePackage.price;

    // 3. Create booking as PENDING
    const booking = await Booking.create({
      customer,
      address,
      vehicle,
      package: package_id,
      schedule: {
        date: booking_date,
        start_time: booking_time,
        slot_ids: []
      },
      payment: {
        method: payment_method,
        status: "pending",
        amount
      },
      status: "pending",
      additional_notes
    });

    res.status(201).json({
      message: "Booking created. Awaiting payment confirmation.",
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.confirmBookingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { booking_id } = req.body;

    const booking = await Booking.findById(booking_id)
      .populate("package")
      .session(session);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.payment.status === "paid") {
      throw new Error("Booking already confirmed");
    }

    const config = await ScheduleConfig.findOne({}).session(session);

    const slotInterval = config.slot_interval; // 30 mins
    const buffer = config.buffer_minutes;

    const worktime = booking.package.worktime;

    const totalBlock = worktime + buffer;
    const requiredSlots = Math.ceil(totalBlock / slotInterval);

    // 1. Find all available slots for that date & start time
    const allSlots = await VanSlot.find({
      date: booking.schedule.date,
      is_booked: false
    }).sort({ van: 1, start_time: 1 }).session(session);

    // 2. Group by van
    const grouped = {};
    allSlots.forEach(slot => {
      if (!grouped[slot.van]) grouped[slot.van] = [];
      grouped[slot.van].push(slot);
    });

    let selectedVan = null;
    let selectedSlots = [];

    // 3. Find consecutive slots
    for (let vanId in grouped) {
      const slots = grouped[vanId];

      for (let i = 0; i < slots.length; i++) {
        if (slots[i].start_time !== booking.schedule.start_time) continue;

        const consecutive = [slots[i]];

        for (let j = 1; j < requiredSlots; j++) {
          if (!slots[i + j]) break;
          consecutive.push(slots[i + j]);
        }

        if (consecutive.length === requiredSlots) {
          selectedVan = vanId;
          selectedSlots = consecutive;
          break;
        }
      }

      if (selectedVan) break;
    }

    if (!selectedVan) {
      booking.status = "pending_manual_assignment";
      booking.payment.status = "paid";
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Payment received but no slots available. Admin intervention required."
      });
    }

    // 4. Lock slots
    const slotIds = selectedSlots.map(s => s._id);

    await VanSlot.updateMany(
      { _id: { $in: slotIds }, is_booked: false },
      { is_booked: true, booking: booking._id },
      { session }
    );

    const van = await ServiceVan.findById(selectedVan).session(session);

    const needsAttention = !van.driver || !van.technician;

    // 5. Update booking
    booking.schedule.slot_ids = slotIds;
    booking.schedule.end_time =
      selectedSlots[selectedSlots.length - 1].end_time;

    booking.assignment = {
      service_van: van._id,
      driver: van.driver || null,
      technician: van.technician || null,
      needs_attention: needsAttention
    };

    booking.payment.status = "paid";
    booking.status = "confirmed";

    await booking.save({ session });

    // 6. Notify admin if needed
    if (needsAttention) {
      await Notification.create([{
        title: "Booking needs driver/technician assignment",
        booking: booking._id,
        role: "admin"
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Booking confirmed successfully",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { booking_id } = req.body;

    const booking = await Booking.findById(booking_id).session(session);

    if (!booking) throw new Error("Booking not found");

    if (booking.schedule.slot_ids.length > 0) {
      await VanSlot.updateMany(
        { _id: { $in: booking.schedule.slot_ids } },
        { is_booked: false, booking: null },
        { session }
      );
    }

    booking.status = "cancelled";
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Booking cancelled and slots released" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};