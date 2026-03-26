const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String },
    country_code: { type: String },
    contact_number: { type: String }
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
    name: { type: String },
    model_id: { type: String },
    registration_number: { type: String },
    vin: { type: String },
    sold_date: { type: Date },
    model_year: { type: Number },
    variant: { type: String },
    color: { type: String },
    last_service_date: { type: Date },
    last_recorded_mileage: { type: Number, min: 0 },
    transmission: {
        type: String,
        enum: ['manual', 'automatic']
    },
    fuel_type: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid']
    },
    sales_label: { type: String }
}, { _id: false });

const customerVehicleSchema = new mongoose.Schema({
    customer: { type: customerSchema },
    vehicle: { type: vehicleSchema }
}, { timestamps: true });

/* ✅ Proper unique indexes */
// customerVehicleSchema.index({ "vehicle.registration_number": 1 }, { unique: true });
// customerVehicleSchema.index({ "vehicle.vin": 1 }, { unique: true });
// customerVehicleSchema.index({ "customer.contact_number": 1 });

module.exports = mongoose.model('CustomerSale', customerVehicleSchema);