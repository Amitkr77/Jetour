const ScheduleService = require("./schedule.service");
const { validateScheduleConfig } = require("./schedule.validation");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

// ➕ Add Holiday
exports.addHoliday = async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format (YYYY-MM-DD required)"
      });
    }

    const updated = await ScheduleService.addHoliday({ date, reason });

    res.json({
      success: true,
      data: updated.public_holidays
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ➖ Remove Holiday
exports.removeHoliday = async (req, res) => {
  try {
    const { date } = req.params;

    const updated = await ScheduleService.removeHoliday(date);

    res.json({
      success: true,
      data: updated.public_holidays
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// 🔄 Toggle Operating Day
exports.toggleOperatingDay = async (req, res) => {
  try {
    const { day } = req.params;

    // 🔒 Validate day before DB call
    const allowedDays = [
      "monday", "tuesday", "wednesday",
      "thursday", "friday", "saturday", "sunday"
    ];

    if (!allowedDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day"
      });
    }

    const updated = await ScheduleService.toggleOperatingDay(day);

    res.json({
      success: true,
      data: updated.operating_days
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const errors = validateScheduleConfig(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const schedule = await ScheduleService.createScheduleConfig(req.body);

    res.status(201).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveSchedule = async (req, res) => {
  try {
    const schedule = await ScheduleService.getActiveSchedule();

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const errors = validateScheduleConfig(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    const updated = await ScheduleService.updateScheduleConfig(
      id,
      req.body
    );

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🎯 Special API: Update only buffer_between_bookings_minutes
exports.updateBufferBetweenBookings = async (req, res) => {
  try {
    const { buffer_between_bookings_minutes } = req.body;

    if (
      typeof buffer_between_bookings_minutes !== "number" ||
      buffer_between_bookings_minutes < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid buffer value"
      });
    }

    const updated = await ScheduleService.updateBufferMinutes(
      buffer_between_bookings_minutes
    );

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};