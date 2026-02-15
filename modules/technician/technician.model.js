const mongoose = require('mongoose');
const Counter = require('../../model/counter.model');


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

    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);


technicianSchema.pre('save', async function () {
  if (!this.isNew) return ;

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

module.exports = mongoose.model('Technician', technicianSchema);
