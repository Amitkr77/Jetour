const Joi = require("joi");

exports.createCustomerVehicleSchema = Joi.object({
  model_id: Joi.string().required(),

  registration_number: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required(),

  mileage: Joi.number()
    .min(0)
    .required(),

  category: Joi.string()
    .trim()
    ,

  model_year: Joi.number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
    

  variant: Joi.string()
    .trim()
    .allow("", null),

  color: Joi.string()
    .trim()
    .allow("", null),

  user_id: Joi.string().required()
});