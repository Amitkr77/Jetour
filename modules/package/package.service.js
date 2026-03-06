const Package = require("./package.model");
const VehicleModel = require("../vehicle/vehicle.model");
const mongoose = require("mongoose");


exports.createPackage = async (payload) => {

  const vehicles = await VehicleModel.find({ status: "active" }).sort({ createdAt: 1 });

  if (!vehicles.length) {
    throw new Error("No vehicles available");
  }

  const mileageSet = new Set();
  const formattedPricing = [];

  // CASE 1: Pricing provided by admin
  if (payload.pricing && payload.pricing.length) {

    for (const row of payload.pricing) {

      if (mileageSet.has(row.mileage)) {
        throw new Error(`Duplicate mileage entry: ${row.mileage}`);
      }
      mileageSet.add(row.mileage);

      if (!row.prices || row.prices.length !== vehicles.length) {
        throw new Error(
          `Prices count must match number of vehicles (${vehicles.length})`
        );
      }

      const vehiclesPricing = vehicles.map((vehicle, index) => ({
        vehicle_Id: vehicle._id,
        vehicle_model: vehicle.vehicle_model,
        price: row.prices[index]
      }));

      formattedPricing.push({
        mileage: row.mileage,
        vehicles: vehiclesPricing
      });
    }

  } 
  // CASE 2: No pricing provided → create default
  else {

    const vehiclesPricing = vehicles.map(vehicle => ({
      vehicle_Id: vehicle._id,
      vehicle_model: vehicle.vehicle_model,
      price: 0
    }));

    formattedPricing.push({
      mileage: 1000,
      vehicles: vehiclesPricing
    });

  }

  payload.pricing = formattedPricing;

  return await Package.create(payload);
};

exports.getAllPackages = async (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  return await Package.find(filter).sort({ createdAt: -1 });
};

exports.getPackageByIdOrCode = async (idOrCode) => {

  let pkg;

  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    // Try fetching by Mongo _id
    pkg = await Package.findById(idOrCode);
  }

  if (!pkg) {
    // Fallback: fetch by custom package_id
    pkg = await Package.findOne({ package_id: idOrCode });
  }

  if (!pkg) throw new Error("Package not found");

  // Transform pricing vehicles to {id, name, price}
  const pricing = await Promise.all(pkg.pricing.map(async (tier) => {
    const vehicles = await Promise.all(tier.vehicles.map(async (v) => {
      const vehicleDoc = await VehicleModel.findById(v.vehicle_Id);

      return {
        id: vehicleDoc?.id || v.vehicle_Id.toString(),     // custom vehicle ID
        name: vehicleDoc?.vehicle_model || v.vehicle_model, // model name
        price: v.price
      };
    }));

    return {
      mileage: tier.mileage,
      vehicles
    };
  }));

  return {
    ...pkg.toObject(),
    pricing
  };
};

exports.updatePackage = async (idOrCode, payload) => {

  if (payload.pricing && payload.pricing.length) {

    // Fetch all active vehicles
    const vehicles = await VehicleModel.find({ status: "active" }).sort({ createdAt: 1 });

    if (!vehicles.length) {
      throw new Error("No vehicles available");
    }

    const mileageSet = new Set();
    const formattedPricing = [];

    for (const row of payload.pricing) {

      // Prevent duplicate mileage tiers
      if (mileageSet.has(row.mileage)) {
        throw new Error(`Duplicate mileage entry: ${row.mileage}`);
      }
      mileageSet.add(row.mileage);

      // Validate price count
      if (!row.prices || row.prices.length !== vehicles.length) {
        throw new Error(
          `Prices count must match number of vehicles (${vehicles.length})`
        );
      }

      const vehiclesPricing = vehicles.map((vehicle, index) => ({
        vehicle_Id: vehicle._id,
        vehicle_model: vehicle.vehicle_model,
        price: row.prices[index]
      }));

      formattedPricing.push({
        mileage: row.mileage,
        vehicles: vehiclesPricing
      });
    }

    payload.pricing = formattedPricing;
  }

  let updatedPackage;

  // Update by Mongo _id
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    updatedPackage = await Package.findByIdAndUpdate(
      idOrCode,
      payload,
      { new: true }
    );
  }

  // Update by custom package_id
  if (!updatedPackage) {
    updatedPackage = await Package.findOneAndUpdate(
      { package_id: idOrCode },
      payload,
      { new: true }
    );
  }

  if (!updatedPackage) {
    throw new Error("Package not found");
  }

  return updatedPackage;
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
