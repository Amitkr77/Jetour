const InventoryRequest = require("./inventory-request.model");

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
  if (request.status !== "pending")
    throw new Error("Only pending requests can be approved");

  request.status = "approved";
  request.approved_by = adminId;
  request.approved_at = new Date();

  await request.save();
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