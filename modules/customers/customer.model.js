const mongoose = require('mongoose');

const Counter = require('../../model/counter.model');



const addressSchema = new mongoose.Schema({
  governorate: { type: String, trim: true },
  area: { type: String, trim: true },
  block: { type: String, trim: true },
  street: { type: String, trim: true },
  building_number: { type: String, trim: true },
  floor_number: { type: String, trim: true },
  flat_number: { type: String, trim: true },
  paci_details: { type: String, trim: true }

}, { _id: false });


const customerSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  contact_number: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use E.164 format']
  },
  country_code: {
    type: String,
    trim: true,
    match: [/^\+\d{1,3}$/, 'Invalid country code format. Use + followed by 1 to 3 digits']
  },
  lat: { type: Number },
  lng: { type: Number },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
    sparse: true
  },

  civil_id: {
    type: String,
    trim: true,
    index: true
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  passport_number: {
    type: String,
    trim: true
  },

  nationality: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active'
  },

  preferred_language: {
    type: String,
    enum: ['Arabic', 'English'],
    default: 'English'
  },

  date_of_birth: {
    type: Date
  },
  password: {
    type: String,
    // required: true,
    select: false   
  },

  full_address: addressSchema

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

customerSchema.pre('save', async function () {
  if (!this.isNew) return;

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'id' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paddedNumber = String(counter.seq).padStart(5, '0');
    this.id = `CUST-${paddedNumber}`;

  } catch (error) {
    console.log(error);
  }
});

module.exports = mongoose.model('Customer', customerSchema);

