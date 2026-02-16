const mongoose = require('mongoose');
const Counter = require('../../model/counter.model');

const vehicleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true
    },

    vehicle_category: {
      type: String,
      required: true,
      trim: true
    },

    vehicle_model: {
      type: String,
      required: true,
      trim: true
    },

    vehicle_image: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);


// 🔥 PRE-SAVE HOOK FOR AUTO ID
vehicleSchema.pre('save', async function () {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'vehicle_id' },  // unique counter name
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const paddedSeq = String(counter.seq).padStart(3, '0');
      this.id = `VEH-${paddedSeq}`;


    } catch (error) {
      console.error(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
