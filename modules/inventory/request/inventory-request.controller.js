const InventoryRequestService = require("./inventory-request.service");

// Technician creates request
exports.createInventoryRequest = async (req, res) => {
  try {

    // 🔥 Take from middleware if exists, otherwise from body
    const technicianId = req.user?._id || req.body.technicianId;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: "Technician ID is required"
      });
    }

    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Items are required"
      });
    }

    const request = await InventoryRequestService.createRequest(
      technicianId,
      items
    );

    res.status(201).json({
      success: true,
      data: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin approve
exports.approveInventoryRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const adminId = req.user._id;

    const request = await InventoryRequestService.approveRequest(
      request_id,
      adminId
    );

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Admin reject
exports.rejectInventoryRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { reason } = req.body;

    const request = await InventoryRequestService.rejectRequest(
      request_id,
      reason
    );

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};