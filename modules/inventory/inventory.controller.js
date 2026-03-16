const mongoose = require('mongoose');
const inventoryService = require('./inventory.service');
const validation = require('./inventory.validation');

// CREATE
exports.createInventory = async (req, res, next) => {
    try {
        const { error } = validation.createInventorySchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }

        const inventory = await inventoryService.createInventory(req.body);

        return res.status(201).json({
            success: true,
            message: 'Item added successfully',
            data: inventory
        });

    } catch (err) {
        next(err);
    }
};

// GET ALL
exports.getAllInventory = async (req, res, next) => {
    try {
        const result = await inventoryService.getAllInventory(); // no query needed

        res.status(200).json({
            success: true,
            message: 'Inventory fetched successfully',
            data: result.data,
        });

    } catch (err) {
        next(err);
    }
};

// GET SINGLE
exports.getInventoryDetail = async (req, res, next) => {
    try {
        const id = req.params.id || req.query.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID',
                data: null
            });
        }

        const inventory = await inventoryService.getInventoryById(id);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inventory fetched successfully',
            data: inventory
        });

    } catch (err) {
        next(err);
    }
};

// UPDATE
exports.updateInventory = async (req, res, next) => {
    try {
        const id = req.params.id || req.query.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID',
                data: null
            });
        }

        const { error } = validation.updateInventorySchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: null
            });
        }

        const inventory = await inventoryService.updateInventory(
            id,
            req.body
        );

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inventory updated successfully',
            data: inventory
        });

    } catch (err) {
        next(err);
    }
};

// DELETE
exports.deleteInventory = async (req, res, next) => {
    try {
        const id = req.params.id || req.query.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID',
                data: null
            });
        }

        const inventory = await inventoryService.deleteInventory(id);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Inventory deleted successfully',
            data: null
        });

    } catch (err) {
        next(err);
    }
};