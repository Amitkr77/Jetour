const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    unit_price: {
      type: Number,
      required: true,
      min: 0
    },

    part_status: {
      type: String,
      enum: ['usable', 'damaged', 'out_of_stock'],
      default: 'usable'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);