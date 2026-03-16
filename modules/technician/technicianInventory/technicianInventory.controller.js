const TechnicianInventory = require('./technicianInventory.model');

// Get all technician inventories
const getAllTechnicianInventories = async (req, res) => {
    try {
        const inventories = await TechnicianInventory.find()
            .populate('technician', 'name technician_id')
            .populate('inventory.item', 'name');

        res.status(200).json({
            success: true,
            count: inventories.length,
            data: inventories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Get single technician inventory by ID
const getTechnicianInventoryByTechnicianId = async (req, res) => {
    try {
        const { technicianId } = req.params;

        // Find the inventory document for the given technician
        const inventory = await TechnicianInventory.findOne({ technician: technicianId })
            .populate('technician', 'name technician_id')
            .populate('inventory.item', 'name');



        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Technician inventory not found'
            });
        }

        res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getAllTechnicianInventories,
    getTechnicianInventoryByTechnicianId
};