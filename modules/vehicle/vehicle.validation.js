const Joi = require('joi');

exports.createVehicleSchema = Joi.object({
  plate_number: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number(),
  color: Joi.string(),
  vin_number: Joi.string(),
  registration_expiry: Joi.date()
});

exports.updateVehicleSchema = Joi.object({
  plate_number: Joi.string(),
  make: Joi.string(),
  model: Joi.string(),
  year: Joi.number(),
  color: Joi.string(),
  vin_number: Joi.string(),
  registration_expiry: Joi.date(),
  status: Joi.string().valid('Available', 'Assigned', 'Under Maintenance')
});
