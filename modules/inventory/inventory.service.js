const Inventory = require('./inventory.model');

// ✅ CREATE
exports.createInventory = async (data) => {
  return await Inventory.create(data);
};

exports.getAllInventory = async () => {
  const data = await Inventory.find().sort({ created_at: -1 });
  return {
    data
  };
};
exports.getInventoryById = async (id) => {
  return await Inventory.findById(id);
};

exports.updateInventory = async (id, data) => {
  return await Inventory.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );
};

exports.deleteInventory = async (id) => {
  return await Inventory.findByIdAndDelete(id);
};