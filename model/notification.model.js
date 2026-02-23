const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    role: {
      type: String,
      enum: ["driver", "technician"],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    booking_id: {
      type: String
    },

    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.index({ user_id: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);