const VehicleService = require('./vehicle.service');
const {
  createVehicleSchema,
  updateVehicleSchema
} = require('./vehicle.validation');

/* CREATE */
exports.createVehicle = async (req, res, next) => {
  try {
    const { error, value } = createVehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const vehicleId = await VehicleService.createVehicle(
      req.params.customerId,
      value
    );

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle_id: vehicleId
    });
  } catch (err) {
    next(err);
  }
};

/* GET BY CUSTOMER */
exports.getVehiclesByCustomer = async (req, res, next) => {
  try {
    const vehicles = await VehicleService.getVehiclesByCustomer(
      req.params.customerId
    );
    res.json({ data: vehicles });
  } catch (err) {
    next(err);
  }
};

/* GET BY ID */
exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await VehicleService.getVehicleById(req.params.vehicleId);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
};

/* UPDATE */
exports.updateVehicle = async (req, res, next) => {
  try {
    const { error, value } = updateVehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await VehicleService.updateVehicle(
      req.params.vehicleId,
      value
    );

    if (!updated) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    next(err);
  }
};

/* DELETE */
exports.deleteVehicle = async (req, res, next) => {
  try {
    const deleted = await VehicleService.deleteVehicle(req.params.vehicleId);

    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};
