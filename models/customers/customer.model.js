const db = require('../../config/db');

/* Create customer */
exports.createCustomer = async (data) => {
  const sql = `
    INSERT INTO customers
    (name, phone_country_code, phone_number, email, gender, nationality, dob, preferred_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.name,
    data.phone_country_code || null,
    data.phone_number,
    data.email || null,
    data.gender || null,
    data.nationality || null,
    data.dob || null,
    data.preferred_language || 'English'
  ];

  const [result] = await db.execute(sql, values);
  return result.insertId;
};

/* Get all customers */
exports.getAllCustomers = async () => {
  const [rows] = await db.execute(
    `SELECT customer_id, name, phone_number, email, gender, nationality, status, created_at
     FROM customers`
  );
  return rows;
};

/* Get customer by ID */
exports.getCustomerById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM customers WHERE customer_id = ?`,
    [id]
  );
  return rows[0];
};

/* Update customer */
exports.updateCustomer = async (id, data) => {
  const sql = `
    UPDATE customers SET
      name = ?,
      phone_country_code = ?,
      phone_number = ?,
      email = ?,
      gender = ?,
      nationality = ?,
      dob = ?,
      preferred_language = ?,
      status = ?
    WHERE customer_id = ?
  `;

  const values = [
    data.name,
    data.phone_country_code,
    data.phone_number,
    data.email,
    data.gender,
    data.nationality,
    data.dob,
    data.preferred_language,
    data.status,
    id
  ];

  const [result] = await db.execute(sql, values);
  return result.affectedRows;
};

/* Soft delete customer */
exports.deleteCustomer = async (id) => {
  const [result] = await db.execute(
    `UPDATE customers SET status = 'Inactive' WHERE customer_id = ?`,
    [id]
  );
  return result.affectedRows;
};
