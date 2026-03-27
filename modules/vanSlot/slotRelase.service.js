const mongoose = require("mongoose");
const VanSlot = require("../vanSlot/vanSlot.model");
const Booking = require("../booking/booking.model");

exports.releaseSlots = async ({
  bookingId,
  releaseType = "cancelled"
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) {
      throw new Error("Booking not found");
    }

    // 1️⃣ Find all slots linked to booking
    const slots = await VanSlot.find({
      booking_id: bookingId,
      status: "booked"
    }).session(session);

    if (!slots.length) {
      await session.commitTransaction();
      session.endSession();
      return;
    }

    // 2️⃣ Release slots
    await VanSlot.updateMany(
      {
        booking_id: bookingId
      },
      {
        $set: {
          status: "available",
          booking_id: null
        }
      },
      { session }
    );

    // 3️⃣ Update booking status
    if (releaseType === "cancelled") {
      booking.status = "cancelled";
    }

    if (releaseType === "force_release") {
      booking.status = "pending_reassignment";
    }

    // Clear booking schedule
    booking.schedule.slot_ids = [];
    booking.schedule.end_time = null;

    // Clear assignment
    booking.assignment = {
      service_van: null,
      driver: null,
      technician: null,
      needs_attention: true
    };

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return true;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};