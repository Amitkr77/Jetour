const mongoose = require('mongoose');
const Counter = require('../../model/counter.model')
const bcrypt = require('bcrypt');


const driverSchema = new mongoose.Schema(
  {
    driver_id: {
      type: String,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    contact: {
      type: String,
      required: true
    },

    email: {
      type: String
    },

    civil_id: {
      type: String
    },

    nationality: {
      type: String
    },

    gender: {
      type: String,
      enum: ['male', 'female']
    },

    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5
    },

    image: {
      type: String
    },
    password: {
      type: String,
      required: true,
      select: false
    },

    country_code: {
      type: String
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    }
    , availability: {
      type: String,
      enum: ["available", "busy", "on_leave"],
      default: "available"
    },
    assigned_van: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceVan",
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

driverSchema.pre('save', async function () {
  if (!this.isNew) return;

  try {
    const counter = await Counter.findByIdAndUpdate(
      'driver',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paddedNumber = String(counter.seq).padStart(3, '0');
    this.driver_id = `DVR-${paddedNumber}`;

    ;
  } catch (error) {
    console.error(error);

  }
});

driverSchema.pre('save', async function () {

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

});

module.exports = mongoose.model('Driver', driverSchema);
