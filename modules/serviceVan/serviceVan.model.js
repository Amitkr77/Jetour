const mongoose = require('mongoose');

const serviceVanSchema = new mongoose.Schema(
  {
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
      required: true
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'under_maintenance'],
      default: 'active'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = mongoose.model('ServiceVan', serviceVanSchema);
