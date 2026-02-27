const mongoose = require("mongoose");

const vanSlotSchema = new mongoose.Schema(
  {
    van_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Van",
      required: true,
      index: true
    },

    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
      index: true
    },

    start_time: {
      type: String, // format: HH:mm
      required: true
    },

    end_time: {
      type: String, // format: HH:mm
      required: true
    },

    status: {
      type: String,
      enum: ["available", "booked", "blocked"],
      default: "available",
      index: true
    },

    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },

    slot_type: {
      type: String,
      enum: ["regular", "manual_block"],
      default: "regular"
    },

    schedule_version: {
      type: Number,
      default: 1
    },

    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VanSlot", vanSlotSchema);