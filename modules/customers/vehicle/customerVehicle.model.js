const mongoose = require("mongoose");

const customerVehicleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    vehicle_model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },

    registration_number: {
      type: String,
      required: true,
      trim: true
    },

    mileage: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      // required: true,
      trim: true
    },

    model_year: {
      type: Number,
      // required: true
    },

    variant: {
      type: String,
      trim: true
    },

    color: {
      type: String,
      trim: true
    },
    image: { type: String, trim: true },
    id: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    is_selected: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

//////////////////////////////////////////////////////
// 🔥 UNIQUE REGISTRATION PER CUSTOMER
//////////////////////////////////////////////////////

customerVehicleSchema.index(
  { customer: 1, registration_number: 1 },
  { unique: true }
);

//////////////////////////////////////////////////////
// 🔥 SEARCH INDEXES
//////////////////////////////////////////////////////

customerVehicleSchema.index({ registration_number: 1 });
customerVehicleSchema.index({ model_year: 1 });
customerVehicleSchema.index({ category: 1 });

module.exports = mongoose.model("CustomerVehicle", customerVehicleSchema);