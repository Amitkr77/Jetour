const packageService = require("./package.service");
const ServicePackage = require("./package.model");
const { calculatePackagePrice } = require("./package.service");

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