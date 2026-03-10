const Joi = require('joi');

exports.createServiceVanSchema = Joi.object({
  driver_id: Joi.string().optional(),
  technician_id: Joi.string().optional(),
  registration_number: Joi.string().required(),
  vehicle_model: Joi.string().required(),
  mileage: Joi.number().required(),
  last_service_date: Joi.date(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').optional(),
  image: Joi.any()
});

exports.updateServiceVanSchema = Joi.object({
  driver_id: Joi.string().optional(),
  technician_id: Joi.string().optional(),
  registration_number: Joi.string().optional(),
  vehicle_model: Joi.string().optional(),
  mileage: Joi.number().optional(),
  last_service_date: Joi.date().optional(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').optional(),
  image: Joi.any()
});