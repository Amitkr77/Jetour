const mongoose = require('mongoose');

const technicianInventorySchema = new mongoose.Schema(
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

    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

module.exports = mongoose.model('Inventory', technicianInventorySchema);