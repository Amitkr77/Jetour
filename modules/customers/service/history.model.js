const mongoose = require("mongoose");

const customerServiceHistorySchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerVehicle",
      required: true
    },

    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },

    package: {
      package_id: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
      name: String,
    },

    last_service_date: {
      type: Date,
      required: true
    },

    mileage_at_service: {
      type: Number
    },

    next_service_recommendation: {
      type: String
    },

    summary: {
      type: String
    },

    technician_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      default: null
    },

    photos: {
      before: {
        interior: [String],
        exterior: [String]
      },
      after: {
        interior: [String],
        exterior: [String]
      }
    }
  },
  { timestamps: true }
);

// Compound index — one record per vehicle per booking
customerServiceHistorySchema.index({ customer_id: 1, vehicle_id: 1 });

module.exports = mongoose.model("CustomerServiceHistory", customerServiceHistorySchema);