const Vehicle = require('./vehicle.model');

exports.createVehicle = async (data) => {
  return Vehicle.create(data);
};

exports.getAllVehicles = async () => {
  return Vehicle.find().populate('assigned_driver').sort({ created_at: -1 });
};

exports.getVehicleById = async (id) => {
  return Vehicle.findById(id).populate('assigned_driver');
};

exports.updateVehicle = async (id, data) => {
  return Vehicle.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteVehicle = async (id) => {
  return Vehicle.findByIdAndDelete(id);
};
