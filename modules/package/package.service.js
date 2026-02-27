const Package = require("./package.model");
const VehicleModel = require("../vehicle/vehicle.model");

exports.createPackage = async (payload) => {

  const mileageSet = new Set();

  for (const row of payload.pricing) {

    if (mileageSet.has(row.mileage)) {
      throw new Error("Duplicate mileage entry");
    }
    mileageSet.add(row.mileage);

    const vehicleSet = new Set();

    for (const v of row.vehicles) {

      // 🔥 prevent duplicate vehicle in same mileage
      if (vehicleSet.has(v.vehicle_Id.toString())) {
        throw new Error("Duplicate vehicle in same mileage row");
      }
      vehicleSet.add(v.vehicle_Id.toString());

      // 🔥 fetch vehicle model name
      const vehicleDoc = await VehicleModel.findById(v.vehicle_Id);

      if (!vehicleDoc) {
        throw new Error("Vehicle not found");
      }

      // 🔥 attach vehicle_model automatically
      v.vehicle_model = vehicleDoc.vehicle_model;
    }
  }

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

    for (const row of payload.pricing) {

      const vehicleSet = new Set();

      for (const v of row.vehicles) {

        if (vehicleSet.has(v.vehicle_Id.toString())) {
          throw new Error("Duplicate vehicle in same mileage row");
        }

        vehicleSet.add(v.vehicle_Id.toString());

        const vehicleDoc = await VehicleModel.findById(v.vehicle_Id);

        if (!vehicleDoc) {
          throw new Error("Vehicle not found");
        }

        v.vehicle_model = vehicleDoc.name;
      }
    }
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


exports.calculatePackagePrice = (servicePackage, vehicle) => {
  const { mileage, vehicle_id } = vehicle;



  const sortedPricing = servicePackage.pricing.sort(
    (a, b) => a.mileage - b.mileage
  );

  const mileageTier = sortedPricing.find(
    tier => mileage <= tier.mileage
  );


  if (!mileageTier) {
    throw new Error("No pricing tier available for this mileage");
  }

  const vehiclePricing = mileageTier.vehicles.find(
    v => v.vehicle_Id.toString() === vehicle_id.toString()
  );

  if (!vehiclePricing) {
    throw new Error("Vehicle not supported in this mileage tier");
  }

  return vehiclePricing.price;
};
