const dayjs = require("dayjs");
const VanSlot = require("../vanSlot/vanSlot.model");
const Booking = require("../booking/booking.model");
const ScheduleConfig = require("../schedule/schedule.model");

exports.lockSlotsAndCreateBooking = async ({
  date,
  start_time,
  packageData,
  bookingPayload
}) => {
  const session = await VanSlot.startSession();
  session.startTransaction();

  try {
    const config = await ScheduleConfig.findOne({ is_active: true });

    if (!config) {
      throw new Error("Schedule configuration not found");
    }

    const totalMinutes =
      packageData.worktime +
      config.buffer_between_bookings_minutes;

    const slotsRequired = Math.ceil(
      totalMinutes / config.slot_interval_minutes
    );

    // 1️⃣ Get all available slots for that date & time
    const candidateSlots = await VanSlot.find({
      date,
      start_time,
      status: "available",
      is_active: true
    }).session(session);

    if (!candidateSlots.length) {
      throw new Error("No vans available at selected time");
    }

    // 2️⃣ Try each van to find consecutive slots
    for (const slot of candidateSlots) {
      const vanId = slot.van_id;

      const slots = await VanSlot.find({
        van_id: vanId,
        date,
        status: "available",
        is_active: true
      })
        .sort({ start_time: 1 })
        .session(session);

      // Find consecutive slots starting from selected time
      const startIndex = slots.findIndex(
        (s) => s.start_time === start_time
      );

      if (startIndex === -1) continue;

      const requiredSlots = slots.slice(
        startIndex,
        startIndex + slotsRequired
      );

      if (requiredSlots.length !== slotsRequired) continue;

      // Ensure consecutive timing
      let valid = true;

      for (let i = 0; i < requiredSlots.length - 1; i++) {
        const currentEnd = dayjs(
          `${date} ${requiredSlots[i].end_time}`
        );
        const nextStart = dayjs(
          `${date} ${requiredSlots[i + 1].start_time}`
        );

        if (!currentEnd.isSame(nextStart)) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;

      // 3️⃣ Lock slots
      const slotIds = requiredSlots.map((s) => s._id);

      const updateResult = await VanSlot.updateMany(
        {
          _id: { $in: slotIds },
          status: "available"
        },
        {
          $set: {
            status: "booked"
          }
        },
        { session }
      );

      if (updateResult.modifiedCount !== slotsRequired) {
        continue; // Try next van
      }

      // 4️⃣ Create Booking
      const booking = await Booking.create(
        [
          {
            ...bookingPayload,
            van_id: vanId,
            booking_date: date,
            booking_time: start_time
          }
        ],
        { session }
      );

      // 5️⃣ Attach booking_id to slots
      await VanSlot.updateMany(
        { _id: { $in: slotIds } },
        { $set: { booking_id: booking[0]._id } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return booking[0];
    }

    throw new Error("No van has required consecutive slots");

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};