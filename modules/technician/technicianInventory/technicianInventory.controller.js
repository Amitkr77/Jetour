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

// Update technician inventory
const updateTechnicianInventory = async (req, res) => {
    try {
        const { technicianId } = req.params;
        const { inventory } = req.body;
        // inventory = [{ item: ObjectId, quantity: Number }]

        // Validate input
        if (!Array.isArray(inventory)) {
            return res.status(400).json({
                success: false,
                message: "Inventory must be an array"
            });
        }

        // Find existing inventory
        let technicianInventory = await TechnicianInventory.findOne({ technician: technicianId });

        if (!technicianInventory) {
            return res.status(404).json({
                success: false,
                message: 'Technician inventory not found'
            });

        } else {
            // Update existing inventory
            technicianInventory.inventory = inventory;
        }

        await technicianInventory.save();

        // Populate for response
        const populatedData = await TechnicianInventory.findById(technicianInventory._id)
            .populate('inventory.item', 'name')
            .lean();

        // Format response
        const formattedData = {
            inventory: populatedData.inventory.map(item => ({
                _id: item.item?._id,
                name: item.item?.name,
                quantity: item.quantity
            })),
            created_at: populatedData.created_at,
            updated_at: populatedData.updated_at,
            __v: populatedData.__v
        };

        res.status(200).json({
            success: true,
            message: "Technician inventory updated successfully",
            data: formattedData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

module.exports = {
    getAllTechnicianInventories,
    getTechnicianInventoryByTechnicianId,
    updateTechnicianInventory
};