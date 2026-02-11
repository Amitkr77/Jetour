const VehicleModel = require('./vehicle.model');

exports.createVehicle = async (customerId, payload) => {
  return VehicleModel.createVehicle({
    ...payload,
    customer_id: customerId
  });
};

exports.getVehiclesByCustomer = async (customerId) => {
  return VehicleModel.getVehiclesByCustomer(customerId);
};

exports.getVehicleById = async (vehicleId) => {
  return VehicleModel.getVehicleById(vehicleId);
};

exports.updateVehicle = async (vehicleId, payload) => {
  return VehicleModel.updateVehicle(vehicleId, payload);
};

exports.deleteVehicle = async (vehicleId) => {
  return VehicleModel.deleteVehicle(vehicleId);
};
