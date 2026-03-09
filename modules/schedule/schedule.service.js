const ScheduleConfig = require("./schedule.model");

exports.createScheduleConfig = async (data) => {
  // Deactivate existing configs
  await ScheduleConfig.updateMany(
    { is_active: true },
    { is_active: false }
  );

  return await ScheduleConfig.create(data);
};

exports.getActiveSchedule = async () => {
  return await ScheduleConfig.findOne({ is_active: true });
};

exports.updateScheduleConfig = async (id, data) => {
  return await ScheduleConfig.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );
};

exports.updateBufferMinutes = async (bufferMinutes) => {
  return await ScheduleConfig.findOneAndUpdate(
    { is_active: true },
    { buffer_between_bookings_minutes: bufferMinutes },
    { returnDocument: "after" }
  );
};

exports.addHoliday = async (holiday) => {
  const schedule = await ScheduleConfig.findOne({ is_active: true });

  if (!schedule) throw new Error("Active schedule not found");

  const exists = schedule.public_holidays.some(
    h => h.date === holiday.date
  );

  if (exists) {
    throw new Error("Holiday already exists");
  }

  schedule.public_holidays.push(holiday);
  await schedule.save();

  return schedule;
};

exports.removeHoliday = async (date) => {
  const schedule = await ScheduleConfig.findOne({ is_active: true });

  if (!schedule) throw new Error("Active schedule not found");

  schedule.public_holidays = schedule.public_holidays.filter(
    h => h.date !== date
  );

  await schedule.save();
  return schedule;
};

exports.toggleOperatingDay = async (day) => {
  const schedule = await ScheduleConfig.findOne({ is_active: true });

  if (!schedule) throw new Error("Active schedule not found");

  const operatingDay = schedule.operating_days.find(
    d => d.day === day
  );

  if (!operatingDay) {
    throw new Error("Invalid operating day");
  }

  operatingDay.enabled = !operatingDay.enabled;

  await schedule.save();
  return schedule;
};