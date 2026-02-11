const db = require('../../config/db');

/* Create vehicle */
exports.createVehicle = async (data) => {
  const sql = `
    INSERT INTO customer_vehicles
    (customer_id, vehicle_image, vehicle_category, registration_number, vin,
     model_name, model_year, variant_name, color, last_service_date,
     last_recorded_mileage, transmission, fuel_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.customer_id,
    data.vehicle_image || null,
    data.vehicle_category,
    data.registration_number || null,
    data.vin || null,
    data.model_name,
    data.model_year,
    data.variant_name || null,
    data.color || null,
    data.last_service_date || null,
    data.last_recorded_mileage || null,
    data.transmission,
    data.fuel_type
  ];

  const [result] = await db.execute(sql, values);
  return result.insertId;
};

/* Get vehicles by customer */
exports.getVehiclesByCustomer = async (customerId) => {
  const [rows] = await db.execute(
    `SELECT * FROM customer_vehicles WHERE customer_id = ?`,
    [customerId]
  );
  return rows;
};

/* Get vehicle by ID */
exports.getVehicleById = async (vehicleId) => {
  const [rows] = await db.execute(
    `SELECT * FROM customer_vehicles WHERE vehicle_id = ?`,
    [vehicleId]
  );
  return rows[0];
};

/* Update vehicle */
exports.updateVehicle = async (vehicleId, data) => {
  const sql = `
    UPDATE customer_vehicles SET
      vehicle_image = ?,
      vehicle_category = ?,
      registration_number = ?,
      vin = ?,
      model_name = ?,
      model_year = ?,
      variant_name = ?,
      color = ?,
      last_service_date = ?,
      last_recorded_mileage = ?,
      transmission = ?,
      fuel_type = ?
    WHERE vehicle_id = ?
  `;

  const values = [
    data.vehicle_image,
    data.vehicle_category,
    data.registration_number,
    data.vin,
    data.model_name,
    data.model_year,
    data.variant_name,
    data.color,
    data.last_service_date,
    data.last_recorded_mileage,
    data.transmission,
    data.fuel_type,
    vehicleId
  ];

  const [result] = await db.execute(sql, values);
  return result.affectedRows;
};

/* Delete vehicle */
exports.deleteVehicle = async (vehicleId) => {
  const [result] = await db.execute(
    `DELETE FROM customer_vehicles WHERE vehicle_id = ?`,
    [vehicleId]
  );
  return result.affectedRows;
};
