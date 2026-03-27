const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["driver", "technician", "admin", "customer"],
      required: true
    },

    token: {
      type: String,
      required: true,
      unique: true
    },

    device_type: {
      type: String,
      enum: ["android", "ios"],
      required: true
    },

    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Optional compound index (if you want multiple devices per user)
notificationSchema.index({ user_id: 1, device_type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);