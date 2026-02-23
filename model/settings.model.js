const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    service_fee: {
      type: Number,
      default: 2,
      min: 0
    },

    booking_buffer_minutes: {
      type: Number,
      default: 30,
      min: 0
    },

    currency: {
      type: String,
      default: "KWD"
    }
  },
  { timestamps: true }
);

// 🔒 Ensure only ONE settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);