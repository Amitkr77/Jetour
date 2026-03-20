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
    const { requestId, itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required"
      });
    }

    const request = await InventoryRequestService.approveRequest(
      requestId,
      itemId
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
    const { requestId, itemId } = req.params;
    const { reason } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required"
      });
    }

    const request = await InventoryRequestService.rejectRequest(
      requestId,
      itemId,
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


exports.getAllRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, technician } = req.query;

    const result = await InventoryRequestService.getAllRequests({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      technician
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTechnicianRequests = async (req, res, next) => {
  try {
    const { technicianId } = req.params;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    const requests = await InventoryRequestService.getTechnicianRequests(technicianId);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.removeItemFromRequest = async (req, res) => {
  try {
    const { requestId, itemId } = req.params;
    const { technicianId } = req.user?._id || req.body

    const result = await InventoryRequestService.removeItemFromRequest(
      requestId,
      itemId,
      technicianId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteInventoryRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { technicianId } = req.user?._id || req.body

    const result = await InventoryRequestService.deleteRequest(
      requestId,
      technicianId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};