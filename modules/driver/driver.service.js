const Driver = require('./driver.model');

exports.createDriver = async (data) => {
  return Driver.create(data);
};

exports.getAllDrivers = async () => {
  return Driver.find()
    .populate('assigned_vehicle')
    .sort({ created_at: -1 });
};

exports.getDriverById = async (id) => {
  return Driver.findById(id).populate('assigned_vehicle');
};

exports.updateDriver = async (id, data) => {
  return Driver.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteDriver = async (id) => {
  return Driver.findByIdAndDelete(id);
};
