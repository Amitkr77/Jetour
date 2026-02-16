const Joi = require('joi');

exports.createServiceVanSchema = Joi.object({
  vehicle_model: Joi.string().required(),
  mileage: Joi.number().required(),
  last_service_date: Joi.date().required(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance')
});

exports.updateServiceVanSchema = Joi.object({
  vehicle_model: Joi.string(),
  mileage: Joi.number(),
  last_service_date: Joi.date(),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance')
});
