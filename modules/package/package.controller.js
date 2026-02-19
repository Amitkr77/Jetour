const packageService = require("./package.service");

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
        const data = await packageService.getPackageById(req.params.id);

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
        const data = await packageService.updatePackage(
            req.params.id,
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
