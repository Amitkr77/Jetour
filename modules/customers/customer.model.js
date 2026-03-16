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
    // required: true,
    trim: true
  },

  contact_number: {
    type: String,
    required: true,
    unique: true,

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

  },

  civil_id: {
    type: String,
    trim: true,
    // index: true,
    unique: true,
    sparse: true
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  passport_number: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
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
    enum: ['arabic', 'english'],
    default: 'english'
  },

  date_of_birth: {
    type: Date
  },
  password: {
    type: String,
    // required: true,
    select: false
  },


  full_address: addressSchema,

  profile_completed: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

customerSchema.virtual("vehicles", {
  ref: "CustomerVehicle",
  localField: "_id",
  foreignField: "customer"
});

customerSchema.set("toObject", { virtuals: true });
customerSchema.set("toJSON", { virtuals: true });

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

