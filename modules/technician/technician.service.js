const Technician = require('./technician.model');

exports.createTechnician = async (data) => Technician.create(data);

exports.getAllTechnicians = async () => Technician.find().sort({ created_at: -1 });

exports.getTechnicianById = async (id) => Technician.findById(id);

exports.updateTechnician = async (id, data) =>
  Technician.findByIdAndUpdate(id, data, { returnDocument: 'after' }); // fix deprecation warning

exports.deleteTechnician = async (id) => Technician.findByIdAndDelete(id);


