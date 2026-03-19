const { string } = require("joi");
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    booking_id: {
      type: String,
      unique: true,
      default: () => "BK" + Date.now()
    },

    created_by: {
      type: String,
      enum: ["customer", "admin"],
    },

    // ---------------- CUSTOMER DETAILS ----------------
    customer: {
      customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
      },
      name: { type: String, },
      email: { type: String },
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      phone: { type: String, required: true },
      country_code: { type: String, required: true }
    },

    // ---------------- ADDRESS ----------------
    address: {
      governorate: String,
      area: String,
      block: String,
      street: String,
      building_no: String,
      floor_no: String,
      flat_no: String,
      paci_details: String,
      lat: Number,
      lng: Number,
    },

    // ---------------- VEHICLE SNAPSHOT ----------------
    vehicle: {
      vehicle_model: {
        type: String,
        required: true
      },
      vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
      },
      registration_number: { type: String, required: true },
      mileage: { type: Number, required: true }
    },

    service_progress: {
      status: {
        type: String,
        enum: ["not_started", "in_progress", "completed"],
        default: "not_started"
      },
      pre_inspection: { type: Boolean, default: false },
      checklist_completed: { type: Boolean, default: false },
      before_photos: {
        interior: [String],
        exterior: [String]
      },

      after_photos: {
        interior: [String],
        exterior: [String]
      },
      inventory_updated: { type: Boolean, default: false },
      summary: String,
      next_service_recommendation: String,
      started_at: Date,
      completed_at: Date
    },

    // ---------------- TRIP DETAILS ----------------
    trip_details: {
      distance: {
        type: Number,
        default: 0
      },
      duration: {
        type: Number,
        default: 0
      },
      van_started_at: {
        type: Date
      },

      arrived_at: {
        type: Date
      },
      arrival_confirmed: {
        type: Boolean,
        default: false
      },
      vehicle_parked: {
        type: Boolean,
        default: false
      },

      notes: {
        type: String
      },
      status: {
        type: String,
        enum: ["pending", "driver_on_the_way", "driver_reached"],
        default: "pending"
      }
    },

    // ---------------- PACKAGE SNAPSHOT ----------------
    package: {
      package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
        // required: true
      },
      name: String,
      worktime: Number,
      base_price: Number,
      service_fee: Number,
      total_amount: Number
    },

    // ---------------- SCHEDULE ----------------
    schedule: {
      date: String,
      start_time: String,
      end_time: String,
      slot_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "VanSlot"
      }]
    },

    start_time: {
      type: Date,
      // required: true
    },

    end_time: {
      type: Date,
      // required: true
    },

    // ---------------- ASSIGNMENT ----------------
    assignment: {
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        default: null
      },
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Technician",
        default: null
      },
      service_van: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceVan",
        default: null
      },
      assigned_at: {
        type: Date
      },
      needs_attention: {
        type: Boolean,
        default: false
      }
    },

    // ---------------- PAYMENT ----------------
    payment: {
      method: {
        type: String,
        enum: ["Card", "COD"],
        default: "Card"
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
      },
      transaction_id: String
    },

    // ---------------- STATUS ----------------
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "confirmed",
        "driver_on_the_way",
        "driver_reached",
        "in-progress",
        "completed",
        "cancelled",
        "pending_manual_assignment"
      ],
      default: "pending"
    },

    additional_notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);