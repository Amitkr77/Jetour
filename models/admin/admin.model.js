const db = require('../../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM admins WHERE email = ?',
    [email]
  );
  return rows[0];
};

exports.createAdmin = async (data) => {
  const [result] = await db.execute(
    'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
    [data.name, data.email, data.password]
  );
  return result.insertId;
};
