const dayjs = require("dayjs");
const VanSlot = require("../vanSlot/vanSlot.model");
const ScheduleConfig = require("../schedule/schedule.model");
const Package = require("../package/package.model");

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
    const today = dayjs();

    // 1️⃣ Check advance booking limit
    if (
      selectedDate.diff(today, "day") >
      config.max_advance_booking_days
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking date exceeds allowed range"
      });
    }

    const dayName = selectedDate.format("dddd").toLowerCase();

    // 2️⃣ Check operating day
    const isOperating = config.operating_days.find(
      (d) => d.day === dayName && d.enabled
    );

    if (!isOperating) {
      return res.json({ success: true, data: [] });
    }

    // 3️⃣ Check holiday
    const isHoliday = config.public_holidays.find(
      (h) => h.date === date
    );

    if (isHoliday) {
      return res.json({ success: true, data: [] });
    }

    const packageData = await Package.findById(package_id);

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

    // 4️⃣ Get all available slots for date
    const slots = await VanSlot.find({
      date,
      status: "available",
      is_active: true
    }).sort({ start_time: 1 });

    if (!slots.length) {
      return res.json({ success: true, data: [] });
    }

    // Group slots by time
    const resultMap = {};

    for (const slot of slots) {
      if (!resultMap[slot.start_time]) {
        resultMap[slot.start_time] = [];
      }
      resultMap[slot.start_time].push(slot);
    }

    const availableTimes = [];

    for (const time in resultMap) {
      const candidateSlots = resultMap[time];

      let validVanCount = 0;

      for (const slot of candidateSlots) {
        const vanSlots = await VanSlot.find({
          van_id: slot.van_id,
          date,
          status: "available",
          is_active: true
        }).sort({ start_time: 1 });

        const startIndex = vanSlots.findIndex(
          (s) => s.start_time === time
        );

        if (startIndex === -1) continue;

        const requiredSlots = vanSlots.slice(
          startIndex,
          startIndex + slotsRequired
        );

        if (requiredSlots.length !== slotsRequired) continue;

        let consecutive = true;

        for (let i = 0; i < requiredSlots.length - 1; i++) {
          const currentEnd = dayjs(
            `${date} ${requiredSlots[i].end_time}`
          );
          const nextStart = dayjs(
            `${date} ${requiredSlots[i + 1].start_time}`
          );

          if (!currentEnd.isSame(nextStart)) {
            consecutive = false;
            break;
          }
        }

        if (consecutive) validVanCount++;
      }

      if (validVanCount > 0) {
        availableTimes.push({
          time,
          available_vans: validVanCount
        });
      }
    }

    return res.json({
      success: true,
      data: availableTimes
    });

  } catch (error) {
    console.error("Available slots error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};