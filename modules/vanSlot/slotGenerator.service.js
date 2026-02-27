const dayjs = require("dayjs");
const ScheduleConfig = require("../schedule/schedule.model");
const Van = require("../serviceVan/serviceVan.model");
const VanSlot = require("./vanSlot.model");

exports.generateSlots = async () => {
  try {
    const config = await ScheduleConfig.findOne({ is_active: true });

    if (!config) {
      throw new Error("No active ScheduleConfig found");
    }

    const vans = await Van.find({ is_active: true });

    if (!vans.length) {
      console.log("No active vans found");
      return;
    }

    const today = dayjs();
    const maxDays = config.max_advance_booking_days;

    for (let i = 0; i < maxDays; i++) {
      const currentDate = today.add(i, "day");
      const formattedDate = currentDate.format("YYYY-MM-DD");
      const dayName = currentDate.format("dddd").toLowerCase();

      // 1️⃣ Check operating day
      const isOperating = config.operating_days.find(
        (d) => d.day === dayName && d.enabled
      );

      if (!isOperating) continue;

      // 2️⃣ Check holiday
      const isHoliday = config.public_holidays.find(
        (h) => h.date === formattedDate
      );

      if (isHoliday) continue;

      // 3️⃣ Generate slots for each van
      for (const van of vans) {
        for (const range of config.available_booking_time_ranges) {
          let startTime = dayjs(
            `${formattedDate} ${range.start_time}`
          );
          const endRangeTime = dayjs(
            `${formattedDate} ${range.end_time}`
          );

          while (startTime.isBefore(endRangeTime)) {
            const slotEndTime = startTime.add(
              config.slot_interval_minutes,
              "minute"
            );

            if (slotEndTime.isAfter(endRangeTime)) break;

            try {
              await VanSlot.updateOne(
                {
                  van_id: van._id,
                  date: formattedDate,
                  start_time: startTime.format("HH:mm")
                },
                {
                  $setOnInsert: {
                    van_id: van._id,
                    date: formattedDate,
                    start_time: startTime.format("HH:mm"),
                    end_time: slotEndTime.format("HH:mm"),
                    status: "available",
                    schedule_version: config.version
                  }
                },
                { upsert: true }
              );
            } catch (err) {
              // Ignore duplicate key errors
              if (err.code !== 11000) {
                console.error("Slot creation error:", err.message);
              }
            }

            startTime = slotEndTime;
          }
        }
      }
    }

    console.log("Slots generated successfully");
  } catch (error) {
    console.error("Slot generation failed:", error.message);
  }
};