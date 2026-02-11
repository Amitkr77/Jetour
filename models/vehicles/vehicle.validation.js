const Joi = require('joi');

exports.createVehicleSchema = Joi.object({
  vehicle_image: Joi.string().optional(),
  vehicle_category: Joi.string().valid('Hatchback', 'Sedan', 'SUV').required(),
  registration_number: Joi.string().optional(),
  vin: Joi.string().optional(),
  model_name: Joi.string().required(),
  model_year: Joi.number().integer().required(),
  variant_name: Joi.string().optional(),
  color: Joi.string().optional(),
  last_service_date: Joi.date().optional(),
  last_recorded_mileage: Joi.number().integer().optional(),
  transmission: Joi.string().valid('Automatic', 'Manual').required(),
  fuel_type: Joi.string().valid('Petrol', 'Diesel').required()
});

exports.updateVehicleSchema = exports.createVehicleSchema;
