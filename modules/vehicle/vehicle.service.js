const Vehicle = require('./vehicle.model');

exports.createVehicle = async (data) => Vehicle.create(data);

exports.getAllVehicles = async () => Vehicle.find().sort({ created_at: -1 });

exports.getVehicleById = async (id) => Vehicle.findById(id); // removed populate

exports.updateVehicle = async (id, data) =>
  Vehicle.findByIdAndUpdate(id, data, { returnDocument: 'after' }); // updated for deprecation warning

exports.deleteVehicle = async (id) => Vehicle.findByIdAndDelete(id);
