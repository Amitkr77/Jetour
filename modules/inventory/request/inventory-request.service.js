const InventoryRequest = require("./inventory-request.model");
const TechnicianInventory = require("../../technician/technicianInventory/technicianInventory.model");
const Inventory = require("../inventory.model")
// Technician creates request
exports.createRequest = async (technicianId, items) => {
  return await InventoryRequest.create({
    technician: technicianId,
    items
  });
};

// Admin approve request

exports.approveRequest = async (requestId, itemId) => {
  const request = await InventoryRequest.findById(requestId);

  if (!request) throw new Error("Request not found");

  const item = request.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.status !== "pending") {
    throw new Error("Item already processed");
  }

  // 🔥 STEP 1: GET COMPANY INVENTORY ITEM
  const inventoryItem = await Inventory.findById(item.item);

  if (!inventoryItem) {
    throw new Error("Inventory item not found");
  }

  // 🔥 STEP 2: STOCK VALIDATION
  if (inventoryItem.quantity < item.quantity) {
    throw new Error(
      `Insufficient stock. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`
    );
  }

  // 🔥 STEP 3: DEDUCT COMPANY STOCK
  inventoryItem.quantity -= item.quantity;
  await inventoryItem.save();

  // 🔥 STEP 4: ADD TO TECHNICIAN INVENTORY
  let techInventory = await TechnicianInventory.findOne({
    technician: request.technician
  });

  if (techInventory) {
    const existingItem = techInventory.inventory.find(
      i => i.item.toString() === item.item.toString()
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      techInventory.inventory.push({
        item: item.item,
        quantity: item.quantity
      });
    }

    await techInventory.save();
  } else {
    await TechnicianInventory.create({
      technician: request.technician,
      inventory: [{ item: item.item, quantity: item.quantity }]
    });
  }

  // 🔥 STEP 5: MARK ITEM APPROVED
  item.status = "approved";
  item.approved_at = new Date();

  // 🔥 STEP 6: UPDATE REQUEST STATUS
  const allApproved = request.items.every(i => i.status === "approved");
  const allRejected = request.items.every(i => i.status === "rejected");

  if (allApproved) request.status = "approved";
  else if (allRejected) request.status = "rejected";
  else request.status = "pending";

  await request.save();

  return request;
};

// Admin reject request
exports.rejectRequest = async (requestId, itemId, reason) => {
  const request = await InventoryRequest.findById(requestId);

  if (!request) throw new Error("Request not found");

  const item = request.items.id(itemId);
  if (!item) throw new Error("Item not found");

  if (item.status !== "pending") {
    throw new Error("Item already processed");
  }

  // Reject item
  item.status = "rejected";
  item.rejection_reason = reason;
  item.approved_at = new Date();

  // 🔥 Update request status
  const allRejected = request.items.every(i => i.status === "rejected");
  const allApproved = request.items.every(i => i.status === "approved");

  if (allRejected) request.status = "rejected";
  else if (allApproved) request.status = "approved";
  else request.status = "pending";

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
        item_id: item._id,

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

exports.removeItemFromRequest = async (requestId, itemId, technicianId) => {
  const request = await InventoryRequest.findById(requestId);


  if (!request) throw new Error("Request not found");

  // सुरक्षा: only owner can modify
  if (request.technician.toString() !== technicianId.toString()) {
    throw new Error("Unauthorized");
  }

  const item = request.items.id(itemId);
  if (!item) throw new Error("Item not found");

  // ❗ Only pending items can be removed
  if (item.status !== "pending") {
    throw new Error("Cannot remove processed item");
  }

  request.items.pull({ _id: itemId });

  // If no items left → delete entire request
  if (request.items.length === 0) {
    await request.deleteOne();
    return { message: "Request deleted (no items left)" };
  }

  await request.save();

  return request;
};

exports.deleteRequest = async (requestId, technicianId) => {
  const request = await InventoryRequest.findById(requestId);

  if (!request) throw new Error("Request not found");

  if (request.technician.toString() !== technicianId.toString()) {
    throw new Error("Unauthorized");
  }

  // ❗ Only if all items are still pending
  const hasProcessedItems = request.items.some(i => i.status !== "pending");

  if (hasProcessedItems) {
    throw new Error("Cannot delete request with processed items");
  }

  await request.deleteOne();

  return { message: "Request deleted successfully" };
};