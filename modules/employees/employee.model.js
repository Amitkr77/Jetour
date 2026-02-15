const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  nationality: { type: String },
  photo: { type: String },
  role: {
    type: String,
    enum: ['Technician', 'Driver', 'Admin']
  },
  password: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

module.exports = mongoose.model('Employee', employeeSchema);
