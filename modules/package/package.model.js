const mongoose = require("mongoose");
const Counter = require("../../model/counter.model");

// 🔥 New vehicle price schema
const vehiclePriceSchema = new mongoose.Schema({
  vehicle_Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleModel",
    required: true
  },
  vehicle_model:{
    type: String,
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

// 🔥 New pricing schema (mileage → multiple vehicles)
const pricingSchema = new mongoose.Schema({
  mileage: {
    type: Number,
    required: true
  },
  vehicles: {
    type: [vehiclePriceSchema],
    default: []
  }
}, { _id: false });

const packageSchema = new mongoose.Schema(
  {
    package_code: {
      type: String,
      unique: true,
      immutable: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    worktime: {
      type: Number, // in minutes
      required: true
    },

    details: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "Details must contain at least one item"
      }
    },

    // 🔥 Updated pricing structure
    pricing: {
      type: [pricingSchema],
      default: []
    }
  },
  { timestamps: true }
);


// 🔥 Updated compound index
packageSchema.index({
  "pricing.mileage": 1,
  "pricing.vehicles.vehicle_Id": 1
});


// 🔥 Auto-generate package_code (unchanged)
packageSchema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "package" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    this.package_code = `PKG-${String(counter.seq).padStart(4, "0")}`;
  } catch (error) {
    console.error(error);
  }
});

module.exports = mongoose.model("Package", packageSchema);