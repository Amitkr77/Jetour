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

        const inventory = await TechnicianInventory.findOne({ technician: technicianId })
            .populate('inventory.item', 'name')
            .lean();

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Technician inventory not found'
            });
        }

        // ✅ Transform data to required format
        const formattedData = {
            inventory: inventory.inventory.map(item => ({
                _id: item.item?._id,     // item id
                name: item.item?.name,  // item name
                quantity: item.quantity
            })),
            created_at: inventory.created_at,
            updated_at: inventory.updated_at,
            __v: inventory.__v
        };

        res.status(200).json({
            success: true,
            data: formattedData
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