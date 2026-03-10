const mongoose = require('mongoose');

const serviceVanSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null },

    // 🔹 Driver ID 
    driver_id: {
      type: String
    },

    // 🔹 Technician ID 
    technician_id: {
      type: String
    },

    // 🔹 Vehicle registration number
    registration_number: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    vehicle_model: {
      type: String,
      required: true
    },

    mileage: {
      type: Number,
      required: true
    },

    last_service_date: {
      type: Date,
    },

    // 🔹 Image
    image: {
      type: String
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'under_maintenance'],
      default: 'active'
    },
   
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = mongoose.model('ServiceVan', serviceVanSchema);