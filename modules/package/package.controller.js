const packageService = require("./package.service");
const ServicePackage = require("./package.model");
const { calculatePackagePrice } = require("./package.service");
const VehicleModel = require("../vehicle/vehicle.model");
const mongoose = require("mongoose");
const Package = require("./package.model");

exports.create = async (req, res) => {
    try {
        const data = await packageService.createPackage(req.body);


        res.status(201).json({
            success: true,
            message: "Package created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const data = await packageService.getAllPackages(req.query);

        res.status(200).json({
            success: true,
            message: "Packages retrieved successfully",
            count: data.length,
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getOne = async (req, res) => {
    try {

        const { id } = req.params;
        const data = await packageService.getPackageByIdOrCode(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Package not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Package retrieved successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        // Pass the package identifier, can be _id or custom package_id
        const data = await packageService.updatePackage(
            req.params.id,  // you could rename param to "idOrCode" in route for clarity
            req.body
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Package not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Package updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const data = await packageService.changeStatus(
            req.params.id,
            req.body.status
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Package not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Package status updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.calculatePrice = async (req, res) => {
    try {
        const { package_id, vehicle } = req.body;

        // 1️⃣ Fetch package from DB
        const servicePackage = await ServicePackage.findById(package_id);
        if (!servicePackage) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        // 2️⃣ Calculate price
        const price = calculatePackagePrice(servicePackage, vehicle);

        res.status(200).json({
            success: true,
            message: "Package price calculated successfully",
            price
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllPackagesWithPrice = async (req, res) => {
    try {
        const { vehicleId, mileage } = req.query;

        // Validate params
        if (!vehicleId || !mileage) {
            return res.status(400).json({
                success: false,
                message: "vehicleId and mileage are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicleId"
            });
        }

        const mileageNumber = Number(mileage);
        if (isNaN(mileageNumber)) {
            return res.status(400).json({
                success: false,
                message: "mileage must be a valid number"
            });
        }

        // Fetch packages
        const packages = await Package.find({}).lean();

        const result = packages
            .map(pkg => {

                const sortedPricing = pkg.pricing.sort((a, b) => a.mileage - b.mileage);

                const mileageTier = sortedPricing.find(
                    tier => mileageNumber <= tier.mileage
                );

                if (!mileageTier) return null;

                const vehiclePricing = mileageTier.vehicles.find(
                    v => v.vehicle_Id?.toString() === vehicleId
                );

                if (!vehiclePricing) return null;

                return {
                    ...pkg,
                    service_price: vehiclePricing.price
                };
            })
            .filter(Boolean);

        if (!result.length) {
            return res.status(404).json({
                success: false,
                message: "No packages found for this vehicle and mileage"
            });
        }

        res.status(200).json({
            success: true,
            message: "Packages retrieved successfully",
            count: result.length,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};