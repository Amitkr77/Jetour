// models/trip.model.js
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  tripId: { type: String, required: true, unique: true },
  driverId: { type: String, required: true },
  customerLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  driverLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  locationHistory: [
    {
      lat: Number,
      lng: Number,
      timestamp: Date
    }
  ],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
}, { timestamps: true });

// Auto-expire completed trips after 24hrs
tripSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Trip", tripSchema);