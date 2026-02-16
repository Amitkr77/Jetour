const ServiceVan = require('./serviceVan.model');

exports.createServiceVan = async (data) => {
  return ServiceVan.create(data);
};

exports.getAllServiceVans = async () => {
  return ServiceVan.find().sort({ created_at: -1 });
};

exports.getServiceVanById = async (id) => {
  return ServiceVan.findById(id);
};

exports.updateServiceVan = async (id, data) => {
  return ServiceVan.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteServiceVan = async (id) => {
  return ServiceVan.findByIdAndDelete(id);
};
