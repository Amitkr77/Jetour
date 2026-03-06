const Package = require("./package.model");
const VehicleModel = require("../vehicle/vehicle.model");
const mongoose = require("mongoose");

exports.createPackage = async (payload) => {
  if (payload.pricing) {
    const mileageSet = new Set();

    for (const row of payload.pricing) {
      if (mileageSet.has(row.mileage)) {
        throw new Error("Duplicate mileage entry");
      }
      mileageSet.add(row.mileage);

      const vehicleSet = new Set();

      for (const v of row.vehicles) {

        // Resolve custom vehicle ID to _id
        if (v.vehicle_Id && typeof v.vehicle_Id === "string" && !mongoose.Types.ObjectId.isValid(v.vehicle_Id)) {
          const vehicleDoc = await VehicleModel.findOne({ id: v.vehicle_Id });
          if (!vehicleDoc) throw new Error(`Vehicle with custom id ${v.vehicle_Id} not found`);

          v.vehicle_Id = vehicleDoc._id;
          v.vehicle_model = vehicleDoc.vehicle_model; // copy name
        } else if (v.vehicle_Id) {
          // If already ObjectId
          const vehicleDoc = await VehicleModel.findById(v.vehicle_Id);
          if (!vehicleDoc) throw new Error("Vehicle not found");
          v.vehicle_model = vehicleDoc.vehicle_model;
        } else if (v.vehicle_model) {
          // fallback if only model name is sent
          v.vehicle_model = vehicleDoc.vehicle_model;
        }

        // Duplicate check within same row
        const key = v.vehicle_Id?.toString() || v.vehicle_model;
        if (vehicleSet.has(key)) {
          throw new Error("Duplicate vehicle in same mileage row");
        }
        vehicleSet.add(key);
      }
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

  if (payload.pricing) {
    for (const row of payload.pricing) {
      const vehicleSet = new Set();

      for (const v of row.vehicles) {
        // Resolve custom vehicle ID to _id
        let vehicleDoc;
        if (v.vehicle_Id && typeof v.vehicle_Id === "string" && !mongoose.Types.ObjectId.isValid(v.vehicle_Id)) {
          vehicleDoc = await VehicleModel.findOne({ id: v.vehicle_Id });
          if (!vehicleDoc) throw new Error(`Vehicle with custom id ${v.vehicle_Id} not found`);
          v.vehicle_Id = vehicleDoc._id;
        } else if (v.vehicle_Id) {
          vehicleDoc = await VehicleModel.findById(v.vehicle_Id);
          if (!vehicleDoc) throw new Error("Vehicle not found");
        }

        // Always set vehicle_model from the vehicle document
        if (vehicleDoc) v.vehicle_model = vehicleDoc.vehicle_model;

        // Duplicate check in same row
        const key = v.vehicle_Id?.toString() || v.vehicle_model;
        if (vehicleSet.has(key)) {
          throw new Error("Duplicate vehicle in same mileage row");
        }
        vehicleSet.add(key);
      }
    }
  }

  // 🔹 Fetch package by _id or package_id
  let updated;
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    updated = await Package.findByIdAndUpdate(idOrCode, payload, { new: true });
  }

  if (!updated) {
    updated = await Package.findOneAndUpdate({ package_id: idOrCode }, payload, { new: true });
  }

  if (!updated) throw new Error("Package not found");

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

  const mileageTier = sortedPricing.filter(tier => tier.mileage <= mileage).pop() || sortedPricing[0];


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

exports.getAllPackagesWithPrice = async (vehicleIdentifier, mileage) => {
  try {
    // Resolve vehicle by _id or custom id
    let vehicle;
    if (mongoose.Types.ObjectId.isValid(vehicleIdentifier)) {
      vehicle = await VehicleModel.findById(vehicleIdentifier);
    }
    if (!vehicle) {
      vehicle = await VehicleModel.findOne({ id: vehicleIdentifier });
    }
    if (!vehicle) throw new Error("Vehicle not found");

    const vehicleId = vehicle._id;

    // Fetch all packages
    const packages = await Package.find({}).lean();
    if (!packages.length) return [];

    const result = packages.map(pkg => {
      const sortedPricing = pkg.pricing.sort((a, b) => a.mileage - b.mileage);

      // Find tier where mileage <= tier mileage
      const mileageTier = sortedPricing.find(tier => mileage <= tier.mileage);

      let price = null;
      if (mileageTier) {
        const vehiclePricing = mileageTier.vehicles.find(v =>
          v.vehicle_Id?.toString() === vehicleId.toString() ||
          v.vehicle_Id?.toString() === vehicle.id.toString()
        );

        if (vehiclePricing) price = vehiclePricing.price;
      }

      return {
        ...pkg,
        price
      };
    });

    // Only return packages where price is not null
    const filtered = result.filter(pkg => pkg.price !== null);

    return filtered;
  } catch (error) {
    throw new Error(`Error occurred while fetching packages with prices: ${error.message}`);
  }
};