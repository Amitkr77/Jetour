const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    phone_country_code: {
      type: String
    },

    phone_number: {
      type: String,
      required: true
    },

    email: {
      type: String
    },

    civil_id_number: {
      type: String
    },

    nationality: {
      type: String
    },

    license_number: {
      type: String
    },

    license_expiry: {
      type: Date
    },

    joining_date: {
      type: Date,
      default: Date.now
    },

    assigned_vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = mongoose.model('Driver', driverSchema);
