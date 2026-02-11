const db = require('../../config/db');

/* Get all technicians */
exports.getAllTechnicians = async () => {
  const [rows] = await db.execute(
    `SELECT employee_id, name, phone, gender, nationality, photo, status, created_at
     FROM employees
     WHERE role = 'Technician'`
  );
  return rows;
};

/* Get technician by ID */
exports.getTechnicianById = async (id) => {
  const [rows] = await db.execute(
    `SELECT employee_id, name, phone, gender, nationality, photo, status
     FROM employees
     WHERE employee_id = ? AND role = 'Technician'`,
    [id]
  );
  return rows[0];
};

/* Update technician */
exports.updateTechnician = async (id, data) => {
  const sql = `
    UPDATE employees SET
      name = ?,
      phone = ?,
      gender = ?,
      nationality = ?,
      photo = ?,
      status = ?
    WHERE employee_id = ? AND role = 'Technician'
  `;

  const values = [
    data.name,
    data.phone,
    data.gender,
    data.nationality,
    data.photo || null,
    data.status,
    id
  ];

  const [result] = await db.execute(sql, values);
  return result.affectedRows;
};

/* Soft delete technician */
exports.deleteTechnician = async (id) => {
  const [result] = await db.execute(
    `UPDATE employees SET status = 'Inactive'
     WHERE employee_id = ? AND role = 'Technician'`,
    [id]
  );
  return result.affectedRows;
};
