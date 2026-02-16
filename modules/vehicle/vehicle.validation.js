const Joi = require('joi');

exports.createVehicleSchema = Joi.object({
  vehicle_category: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),

  vehicle_model: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  vehicle_image: Joi.any()
}).options({ abortEarly: false, allowUnknown: false });


exports.updateVehicleSchema = Joi.object({
  vehicle_category: Joi.string()
    .trim()
    .min(2)
    .max(50),

  vehicle_model: Joi.string()
    .trim()
    .min(2)
    .max(100),

  vehicle_image: Joi.any()
}).min(1) // at least one field must be provided
  .options({ abortEarly: false, allowUnknown: false });
