const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country_code: { type: String, required: true },
    contact_number: { type: String, required: true }
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
    model_id: { type: String, required: true },
    registration_number: { type: String, required: true },
    vin: { type: String, required: true },
    sold_date: { type: Date, required: true },
    model_year: { type: Number, required: true },
    variant: { type: String, required: true },
    color: { type: String, required: true },
    last_service_date: { type: Date },
    last_recorded_mileage: { type: Number, min: 0 },
    transmission: {
        type: String,
        enum: ['manual', 'automatic'],
        required: true
    },
    fuel_type: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'],
        required: true
    },
    sales_label: { type: String }
}, { _id: false });

const customerVehicleSchema = new mongoose.Schema({
    customer: { type: customerSchema, required: true },
    vehicle: { type: vehicleSchema, required: true }
}, { timestamps: true });

/* ✅ Proper unique indexes */
customerVehicleSchema.index({ "vehicle.registration_number": 1 }, { unique: true });
customerVehicleSchema.index({ "vehicle.vin": 1 }, { unique: true });
customerVehicleSchema.index({ "customer.contact_number": 1 });

module.exports = mongoose.model('CustomerSale', customerVehicleSchema);