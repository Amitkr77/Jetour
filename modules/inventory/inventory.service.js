const Inventory = require('./inventory.model');

exports.getAllInventory = async (query) => {
  const page = parseInt(query.page) || 1;
  const page_size = parseInt(query.page_size) || 10;

  const skip = (page - 1) * page_size;

  const filter = {};

  // 🔍 Search by name (case insensitive)
  if (query.name) {
    filter.name = { $regex: query.name, $options: 'i' };
  }

  const total = await Inventory.countDocuments(filter);

  const data = await Inventory.find(filter)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(page_size);

  return {
    total,
    page,
    page_size,
    total_pages: Math.ceil(total / page_size),
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