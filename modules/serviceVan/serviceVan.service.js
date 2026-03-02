const ServiceVan = require('./serviceVan.model');

exports.createServiceVan = async (data) => {
  const existingVan = await ServiceVan.findOne({ registration_number: data.registration_number });
  if (existingVan) {
    throw new Error("Registration number already exists");
  }

  return ServiceVan.create(data);
};

exports.getAllServiceVans = async () => {
  return ServiceVan.find().sort({ created_at: -1 });
};

exports.getServiceVanById = async (id) => {
  const van = await ServiceVan.findById(id)
    .populate({
      path: "driver",
      select: "name driver_id"
    })
    .populate({
      path: "technician",
      select: "name technician_id"
    })
    .lean(); // converts mongoose doc → plain JS object

  if (!van) return null;

  // Rename fields
  van.driver_details = van.driver;
  van.technician_details = van.technician;

  delete van.driver;
  delete van.technician;
  delete van.driver_id;
  delete van.technician_id;

  return van;
};

exports.updateServiceVan = async (id, data) => {
  return ServiceVan.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteServiceVan = async (id) => {
  return ServiceVan.findByIdAndDelete(id);
};
