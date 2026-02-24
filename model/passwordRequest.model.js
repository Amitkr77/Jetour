const mongoose = require('mongoose');

const passwordChangeRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'user_model'
  },

  user_model: {
    type: String,
    required: true,
    enum: ['Technician', 'Driver', 'Customer'] 
  },

  user_identifier: {
    type: String 
  },

  reason: {
    type: String
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  requested_at: {
    type: Date,
    default: Date.now
  },

  action_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  action_at: Date

}, { timestamps: true });

module.exports = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema);