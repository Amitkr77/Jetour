const Driver = require('./driver.model');

exports.createDriver = async (data) => Driver.create(data);

exports.getAllDrivers = async () => Driver.find().sort({ created_at: -1 });

exports.getDriverById = async (id) => Driver.findById(id)

exports.updateDriver = async (id, data) => Driver.findByIdAndUpdate(id, data, { returnDocument: 'after' });

exports.deleteDriver = async (id) => Driver.findByIdAndDelete(id);
