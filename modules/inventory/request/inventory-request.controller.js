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

    const request = await InventoryRequestService.approveRequest(
      request_id
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

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await InventoryRequestService.getAllRequests();

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
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
      message: 'Technician requests fetched successfully',
      data: requests
    });

  } catch (error) {
    console.error(error);
    next(error); 
  }
};