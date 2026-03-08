const mongoose = require("mongoose");

const driverShiftSchema = new mongoose.Schema(
    {
        driver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true
        },

        van_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceVan",
            required: true
        },

        shift_date: {
            type: Date,
            required: true
        },

        checklist: {
            exterior_damage: {
                type: Boolean,
                default: false
            },
            tire_pressure: {
                type: Boolean,
                default: false
            },
            lights: {
                type: Boolean,
                default: false
            },
            fluids: {
                type: Boolean,
                default: false
            },
            safety_equipment: {
                type: Boolean,
                default: false
            },
            tools: {
                type: Boolean,
                default: false
            },
            documentation: {
                type: Boolean,
                default: false
            },
            remarks: String
        },

        notes: {
            type: String
        },

        shift_status: {
            type: String,
            enum: ["open", "closed"],
            default: "open"
        },
        shift_start_time: Date,
        shift_end_time: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model("DriverShift", driverShiftSchema);