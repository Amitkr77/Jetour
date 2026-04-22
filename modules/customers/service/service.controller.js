exports.getCustomerLastService = async (req, res) => {
  try {
    const { customer_id } = req.params; // MongoDB _id or your custom CUST-xxx

    const history = await CustomerServiceHistory.find({ customer_id })
      .populate("vehicle_id", "registration_number vehicle_model")
      .populate("technician_id", "name phone")
      .sort({ last_service_date: -1 })
      .lean();

    if (!history.length) {
      return res.status(404).json({
        success: false,
        message: "No service history found for this customer"
      });
    }

    return res.status(200).json({
      success: true,
      total_vehicles_serviced: history.length,
      history
    });

  } catch (error) {
    console.error("Get last service error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};