const mongoose = require('mongoose');
const Counter = require('../../model/counter.model');
const bcrypt = require('bcrypt')

const technicianSchema = new mongoose.Schema(
  {
    technician_id: {
      type: String,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    contact: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String
    },

    civil_id: {
      type: String,
      unique: true,
      sparse: true
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

    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    },
    country_code: {
      type: String,
      match: [/^\+\d{1,3}$/, 'Invalid country code format']
    },

    password: {
      type: String,
      required: true,
      select: false
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);


technicianSchema.pre('save', async function () {
  if (!this.isNew) return;

  try {
    const counter = await Counter.findByIdAndUpdate(
      'technician',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paddedNumber = String(counter.seq).padStart(3, '0');
    this.technician_id = `T-${paddedNumber}`;

    ;
  } catch (error) {
    console.error(error);
  }
});

technicianSchema.pre('save', async function () {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'technician',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const paddedNumber = String(counter.seq).padStart(3, '0');
      this.technician_id = `T-${paddedNumber}`;
    } catch (error) {
      console.error(error);
    }
  }

  // 🔐 Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model('Technician', technicianSchema);
