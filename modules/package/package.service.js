const Package = require("./package.model");

exports.createPackage = async (payload) => {

  const mileageSet = new Set();

  payload.pricing.forEach(row => {

    // 🔥 Prevent duplicate mileage rows
    if (mileageSet.has(row.mileage)) {
      throw new Error("Duplicate mileage entry");
    }
    mileageSet.add(row.mileage);

    // 🔥 Prevent duplicate vehicle_model inside same mileage
    const vehicleSet = new Set();

    row.vehicles.forEach(v => {
      if (vehicleSet.has(v.vehicle_model)) {
        throw new Error("Duplicate vehicle_model in same mileage row");
      }
      vehicleSet.add(v.vehicle_model);
    });

  });

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

  if (payload.pricing) {

    const seen = new Set();

    payload.pricing.forEach(p => {
      const key = `${p.vehicle_model}_${p.mileage}`;
      if (seen.has(key)) {
        throw new Error("Duplicate vehicle_model and mileage combination");
      }
      seen.add(key);
    });
  }

  const updated = await Package.findByIdAndUpdate(
    id,
    payload,
    { new: true }
  );

  if (!updated) {
    throw new Error("Package not found");
  }

  return updated;
};

exports.changeStatus = async (id, status) => {
  return await Package.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};
