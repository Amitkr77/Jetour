const dayjs = require("dayjs");
const VanSlot = require("./vanSlot.model");
const ScheduleConfig = require("../schedule/schedule.model");
const Package = require("../package/package.model");
const mongoose = require("mongoose");


exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, package_id } = req.query;

    if (!date || !package_id) {
      return res.status(400).json({
        success: false,
        message: "date and package_id are required"
      });
    }



    const config = await ScheduleConfig.findOne({ is_active: true });
    if (!config) {
      return res.status(500).json({
        success: false,
        message: "Schedule configuration not found"
      });
    }

    const selectedDate = dayjs(date);
    const today = dayjs().startOf("day");

    // ❗ Prevent past booking
    if (selectedDate.isBefore(today)) {
      return res.status(400).json({
        success: false,
        message: "Cannot book past dates"
      });
    }

    // ❗ Advance booking limit
    if (
      selectedDate.diff(today, "day") >=
      config.max_advance_booking_days
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking date exceeds allowed range"
      });
    }

    const dayName = selectedDate.format("dddd").toLowerCase();

    // Operating day check
    const isOperating = config.operating_days.find(
      (d) => d.day === dayName && d.enabled
    );

    if (!isOperating) {
      return res.json({ success: true, data: [] });
    }

    // Holiday check
    const isHoliday = config.public_holidays.find(
      (h) => h.date === date
    );

    if (isHoliday) {
      return res.json({ success: true, data: [] });
    }

    const packageData = await Package.findOne({ package_id: package_id });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    const totalMinutes =
      packageData.worktime +
      config.buffer_between_bookings_minutes;

    const slotsRequired = Math.ceil(
      totalMinutes / config.slot_interval_minutes
    );

    // const slotsRequired = 1;

    // 🚀 SINGLE QUERY — Fetch all available slots for that date
    const allSlots = await VanSlot.find({
      date,
      status: "available",
      is_active: true
    }).sort({ van_id: 1, start_time: 1 });


    if (!allSlots.length) {
      return res.json({ success: true, data: [] });
    }

    // 🔥 Group slots by van
    const vanSlotMap = {};

    for (const slot of allSlots) {
      const vanId = slot.van_id.toString();

      if (!vanSlotMap[vanId]) {
        vanSlotMap[vanId] = [];
      }

      vanSlotMap[vanId].push(slot);
    }

    const availableTimesMap = {};

    // 🚀 Process in memory (NO MORE DB CALLS)
    for (const vanId in vanSlotMap) {
      const vanSlots = vanSlotMap[vanId];

      for (let i = 0; i < vanSlots.length; i++) {
        const startSlot = vanSlots[i];

        const requiredSlots = vanSlots.slice(i, i + slotsRequired);

        if (requiredSlots.length !== slotsRequired) continue;

        let consecutive = true;

        for (let j = 0; j < requiredSlots.length - 1; j++) {
          const currentEnd = dayjs(
            `${date} ${requiredSlots[j].end_time}`
          );
          const nextStart = dayjs(
            `${date} ${requiredSlots[j + 1].start_time}`
          );

          if (!currentEnd.isSame(nextStart)) {
            consecutive = false;
            break;
          }
        }

        if (consecutive) {
          const time = startSlot.start_time;

          if (!availableTimesMap[time]) {
            availableTimesMap[time] = 0;
          }

          availableTimesMap[time]++;
        }
      }
    }
    // Convert map to array
    const availableTimes = Object.keys(availableTimesMap)
      .sort()
      .map((time) => ({
        time,
        available_vans: availableTimesMap[time]
      }));

    return res.json({
      success: true,
      data: availableTimes,
    });

  } catch (error) {
    console.error("Available slots error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
