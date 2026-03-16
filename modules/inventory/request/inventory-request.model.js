const mongoose = require("mongoose");

const requestItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const inventoryRequestSchema = new mongoose.Schema(
  {
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: true
    },

    items: {
      type: [requestItemSchema],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "issued"],
      default: "pending"
    },

    requested_at: {
      type: Date,
      default: Date.now
    },

    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    approved_at: Date,

    rejection_reason: String
  },
  { timestamps: true }
);

inventoryRequestSchema.index({ technician: 1 });
inventoryRequestSchema.index({ status: 1 });

module.exports = mongoose.model("InventoryRequest", inventoryRequestSchema);