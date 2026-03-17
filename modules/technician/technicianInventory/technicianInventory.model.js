const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    _id: false,
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        default: null
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
});

const technicianInventorySchema = new mongoose.Schema(
    {
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Technician",
            default: null
        },
        inventory: [inventoryItemSchema]
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

module.exports = mongoose.model('technicianInventory', technicianInventorySchema);