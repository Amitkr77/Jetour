const EmployeeModel = require('./employee.model');

/* Get all */
exports.getAllTechnicians = async () => {
  return EmployeeModel.getAllTechnicians();
};

/* Get by ID */
exports.getTechnicianById = async (id) => {
  return EmployeeModel.getTechnicianById(id);
};

/* Update */
exports.updateTechnician = async (id, payload) => {
  return EmployeeModel.updateTechnician(id, payload);
};

/* Delete */
exports.deleteTechnician = async (id) => {
  return EmployeeModel.deleteTechnician(id);
};
