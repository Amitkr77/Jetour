const Package = require("./package.model");

exports.createPackage = async (payload) => {
  return await Package.create(payload);
};

exports.getAllPackages = async (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  return await Package.find(filter).sort({ createdAt: -1 });
};

exports.getPackageById = async (id) => {
  return await Package.findById(id);
};

exports.updatePackage = async (id, payload) => {
  return await Package.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });
};

exports.changeStatus = async (id, status) => {
  return await Package.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};
