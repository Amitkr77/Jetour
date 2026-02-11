const EmployeeService = require('./employee.service');
const { updateTechnicianSchema } = require('./employee.validation');

/* GET ALL */
exports.getAllTechnicians = async (req, res, next) => {
  try {
    const technicians = await EmployeeService.getAllTechnicians();
    res.json({ data: technicians });
  } catch (err) {
    next(err);
  }
};

/* GET BY ID */
exports.getTechnicianById = async (req, res, next) => {
  try {
    const technician = await EmployeeService.getTechnicianById(req.params.id);

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.json({ data: technician });
  } catch (err) {
    next(err);
  }
};

/* UPDATE */
exports.updateTechnician = async (req, res, next) => {
  try {
    const { error, value } = updateTechnicianSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await EmployeeService.updateTechnician(
      req.params.id,
      value
    );

    if (!updated) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.json({ message: 'Technician updated successfully' });
  } catch (err) {
    next(err);
  }
};

/* DELETE (Soft) */
exports.deleteTechnician = async (req, res, next) => {
  try {
    const deleted = await EmployeeService.deleteTechnician(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.json({ message: 'Technician deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
