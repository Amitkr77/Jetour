const Joi = require('joi');

exports.createCustomerSchema = Joi.object({
  name: Joi.string().trim(),

  contact_number: Joi.string().required(),

  country_code: Joi.string().pattern(/^\+\d{1,3}$/).optional(),

  email: Joi.string().email().lowercase().trim().optional(), civil_id: Joi.string().trim(),

  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null),

  passport_number: Joi.string().trim().allow('', null),

  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),

  nationality: Joi.string().trim().allow('', null),

  preferred_language: Joi.string().valid('arabic', 'english').default('english'),

  date_of_birth: Joi.date().allow(null),

  full_address: Joi.object({
    governorate: Joi.string().trim().allow(''),
    area: Joi.string().trim().allow(''),
    block: Joi.string().trim().allow(''),
    street: Joi.string().trim().allow(''),
    building_number: Joi.string().trim().allow(''),
    floor_number: Joi.string().trim().allow(''),
    flat_number: Joi.string().trim().allow(''),
    paci_details: Joi.string().trim().allow('')
  }).optional()
});

exports.updateCustomerSchema = Joi.object({
  name: Joi.string().trim(),
  contact_number: Joi.string(),
  country_code: Joi.string().pattern(/^\+\d{1,3}$/),
  email: Joi.string().email().lowercase().trim().allow('', null),
  civil_id: Joi.string().trim(),
  gender: Joi.string().valid('Male', 'Female', 'Other'),
  passport_number: Joi.string().trim().allow(''),
  nationality: Joi.string().trim().allow(''),
  status: Joi.string().valid('Active', 'Inactive', 'Blocked'),
  preferred_language: Joi.string().valid('arabic', 'english'),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  date_of_birth: Joi.date().allow(null),
  full_address: Joi.object({
    governorate: Joi.string().trim().allow(''),
    area: Joi.string().trim().allow(''),
    block: Joi.string().trim().allow(''),
    street: Joi.string().trim().allow(''),
    building_number: Joi.string().trim().allow(''),
    floor_number: Joi.string().trim().allow(''),
    flat_number: Joi.string().trim().allow(''),
    paci_details: Joi.string().trim().allow('')
  }).optional()
}).min(1);
