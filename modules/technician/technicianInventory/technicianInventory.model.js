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
        technician_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Technician",
            default: null
        }
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

module.exports = mongoose.model('technicianInventory', technicianInventorySchema);