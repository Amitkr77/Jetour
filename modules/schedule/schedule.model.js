const mongoose = require("mongoose");

const operatingDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ],
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String, // format: YYYY-MM-DD
      required: true
    },
    reason: {
      type: String
    }
  },
  { _id: false }
);

const timeRangeSchema = new mongoose.Schema(
  {
    start_time: {
      type: String, // format: HH:mm
      required: true
    },
    end_time: {
      type: String, // format: HH:mm
      required: true
    }
  },
  { _id: false }
);

const scheduleConfigSchema = new mongoose.Schema(
  {
    operating_days: {
      type: [operatingDaySchema],
      required: true
    },

    public_holidays: {
      type: [holidaySchema],
      default: []
    },

    available_booking_time_ranges: {
      type: [timeRangeSchema],
      required: true
    },

    slot_interval_minutes: {
      type: Number,
      default: 30
    },

    buffer_between_bookings_minutes: {
      type: Number,
      default: 30
    },

    max_advance_booking_days: {
      type: Number,
      default: 30
    },

    is_active: {
      type: Boolean,
      default: true
    },

    version: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

// Ensure only one active config
scheduleConfigSchema.index({ is_active: 1 });

module.exports = mongoose.model("ScheduleConfig", scheduleConfigSchema);