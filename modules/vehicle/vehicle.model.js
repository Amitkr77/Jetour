const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plate_number: {
      type: String,
      required: true,
      unique: true
    },

    make: {
      type: String,
      required: true
    },

    model: {
      type: String,
      required: true
    },

    year: {
      type: Number
    },

    color: {
      type: String
    },

    vin_number: {
      type: String
    },

    registration_expiry: {
      type: Date
    },

    assigned_driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null
    },

    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Under Maintenance'],
      default: 'Available'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
