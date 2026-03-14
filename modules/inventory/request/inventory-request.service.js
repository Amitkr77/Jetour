const InventoryRequest = require("./inventory-request.model");
const TechnicianInventory = require("../../technician/technicianInventory/technicianInventory.model")

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

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Request already processed");
  }

  // 🔹 Update request status
  request.status = "approved";
  request.approved_by = adminId;
  request.approved_at = new Date();

  await request.save();

  // 🔹 Update technician inventory
  for (const item of request.items) {

    const existing = await TechnicianInventory.findOne({
      technician: request.technician,
      item: item.item
    });

    if (existing) {
      existing.quantity += item.quantity;
      await existing.save();
    } else {
      await TechnicianInventory.create({
        technician: request.technician,
        item: item.item,
        quantity: item.quantity
      });
    }
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
  return InventoryRequest.find()
    .populate("technician", "technician_id name")
    .populate("approved_by", "name email")
    // .populate("items.inventory_id", "name quantity")
    .sort({ created_at: -1 });
};

// Get technician requests
exports.getTechnicianRequests = async (technicianId) => {
  return InventoryRequest.find({ technician: technicianId })
    .populate("items.inventory_id", "name quantity")
    .sort({ created_at: -1 });
};