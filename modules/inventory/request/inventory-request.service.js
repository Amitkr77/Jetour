const InventoryRequest = require("./inventory-request.model");
const TechnicianInventory = require("../../technician/technicianInventory/technicianInventory.model");

// Technician creates request
exports.createRequest = async (technicianId, items) => {
  return await InventoryRequest.create({
    technician: technicianId,
    items
  });
};

// Admin approve request
exports.approveRequest = async (requestId, adminId) => {
  const request = await InventoryRequest.findById(requestId);

  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already processed");

  // 🔹 Update request status
  request.status = "approved";
  request.approved_by = adminId;
  request.approved_at = new Date();
  await request.save();

  // 🔹 Update technician inventory
  const techInventory = await TechnicianInventory.findOne({ technician: request.technician });

  if (techInventory) {
    // Update existing items or add new ones
    for (const item of request.items) {
      const existingItem = techInventory.inventory.find(i => i.item.toString() === item.item.toString());
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        techInventory.inventory.push({ item: item.item, quantity: item.quantity });
      }
    }
    await techInventory.save();
  } else {
    // Create new technician inventory document
    await TechnicianInventory.create({
      technician: request.technician,
      inventory: request.items.map(i => ({ item: i.item, quantity: i.quantity }))
    });
  }

  return request;
};

// Admin reject request
exports.rejectRequest = async (requestId, reason) => {
  const request = await InventoryRequest.findById(requestId);

  if (!request) throw new Error("Request not found");
  if (request.status !== "pending")
    throw new Error("Only pending requests can be rejected");

  request.status = "rejected";
  request.rejection_reason = reason;

  await request.save();
  return request;
};

// Get all requests (admin)

exports.getAllRequests = async () => {
  const requests = await InventoryRequest.find()
    .populate("technician", "technician_id name")
    .populate("items.item", "name quantity")
    .sort({ createdAt: -1 });

  const formatted = [];

  for (const req of requests) {
    for (const item of req.items) {
      formatted.push({
        request_id: req._id,
        technician: {
          name: req.technician?.name,
          id: req.technician?.technician_id
        },

        part: item.item?.name || "Unknown",

        requested_qty: item.quantity,

        company_qty: item.item?.quantity || 0,

        request_date: req.requested_at,

        approve_reject_date:
          req.status !== "pending" ? req.updatedAt : "pending",

        status: req.status,
      });
    }
  }

  return formatted;
};
// Get technician requests
exports.getTechnicianRequests = async (technicianId) => {
  return InventoryRequest.find({ technician: technicianId })
    .populate("items.item", "name quantity")
    .sort({ created_at: -1 });
};