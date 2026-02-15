const Technician = require('./technician.model');

exports.createTechnician = async (data) => {
  return Technician.create(data);
};

exports.getAllTechnicians = async () => {
  return Technician.find().sort({ created_at: -1 });
};

exports.getTechnicianById = async (id) => {
  return Technician.findById(id);
};

exports.updateTechnician = async (id, data) => {
  return Technician.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteTechnician = async (id) => {
  return Technician.findByIdAndDelete(id);
};
