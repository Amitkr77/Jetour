const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(customParseFormat);

exports.validateScheduleConfig = (data) => {
  const errors = [];

  // 1️⃣ Check duplicate operating days
  const days = data.operating_days.map(d => d.day);
  const uniqueDays = new Set(days);

  if (days.length !== uniqueDays.size) {
    errors.push("Duplicate operating days are not allowed");
  }

  // 2️⃣ Validate time ranges
  data.available_booking_time_ranges.forEach((range, index) => {
    if (!dayjs(range.start_time, "HH:mm", true).isValid()) {
      errors.push(`Invalid start_time format at index ${index}`);
    }

    if (!dayjs(range.end_time, "HH:mm", true).isValid()) {
      errors.push(`Invalid end_time format at index ${index}`);
    }

    if (range.start_time >= range.end_time) {
      errors.push(`start_time must be before end_time at index ${index}`);
    }
  });

  // 3️⃣ Check overlapping time ranges
  const sorted = [...data.available_booking_time_ranges].sort(
    (a, b) => a.start_time.localeCompare(b.start_time)
  );

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_time < sorted[i - 1].end_time) {
      errors.push("Time ranges cannot overlap");
      break;
    }
  }

  // 4️⃣ Validate holiday date format
  if (data.public_holidays) {
    data.public_holidays.forEach((h, index) => {
      if (!dayjs(h.date, "YYYY-MM-DD", true).isValid()) {
        errors.push(`Invalid holiday date format at index ${index}`);
      }
    });
  }

  return errors;
};