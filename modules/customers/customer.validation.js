const Joi = require('joi');

exports.createCustomerSchema = Joi.object({
  name: Joi.string().trim().required(),

  contact_number: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Contact number must be in E.164 format'
    }),

  email: Joi.string().email().allow('', null),

  civil_id: Joi.string().allow('', null),

  gender: Joi.string().valid('Male', 'Female', 'Other'),

  passport_number: Joi.string().allow('', null),

  nationality: Joi.string().allow('', null),

  preferred_language: Joi.string().valid('Arabic', 'English'),

  date_of_birth: Joi.date(),

  address: Joi.object({
    full_address: Joi.object({
      governorate: Joi.string().allow('', null),
      area: Joi.string().allow('', null),
      block: Joi.string().allow('', null),
      street: Joi.string().allow('', null),
      building_number: Joi.string().allow('', null),
      floor_number: Joi.string().allow('', null),
      flat_number: Joi.string().allow('', null),
      paci_details: Joi.string().allow('', null)
    }),

    google_location: Joi.string().allow('', null)

  }).optional()
});

exports.updateCustomerSchema = Joi.object({
  name: Joi.string().trim(),

  contact_number: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Contact number must be in E.164 format'
    }),

  email: Joi.string().email().allow('', null),

  civil_id: Joi.string().allow('', null),

  gender: Joi.string().valid('Male', 'Female', 'Other'),

  passport_number: Joi.string().allow('', null),

  nationality: Joi.string().allow('', null),

  status: Joi.string().valid('Active', 'Inactive', 'Blocked'),

  preferred_language: Joi.string().valid('Arabic', 'English'),

  date_of_birth: Joi.date(),

  address: Joi.object({
    full_address: Joi.object({
      governorate: Joi.string().allow('', null),
      area: Joi.string().allow('', null),
      block: Joi.string().allow('', null),
      street: Joi.string().allow('', null),
      building_number: Joi.string().allow('', null),
      floor_number: Joi.string().allow('', null),
      flat_number: Joi.string().allow('', null),
      paci_details: Joi.string().allow('', null)
    }),

    google_location: Joi.string().allow('', null)

  })
});

