const mongoose = require('mongoose');

const TechnicianReviewSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    technician_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Optional: Prevent duplicate review per booking
TechnicianReviewSchema.index({ booking_id: 1, technician_id: 1 }, { unique: true });

module.exports = mongoose.model('TechnicianReview', TechnicianReviewSchema);