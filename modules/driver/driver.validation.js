const Joi = require('joi');

exports.createDriverSchema = Joi.object({
  name: Joi.string().required(),
  phone_country_code: Joi.string().allow('', null),
  phone_number: Joi.string().required(),
  email: Joi.string().email().allow('', null),
  civil_id_number: Joi.string().allow('', null),
  nationality: Joi.string().allow('', null),
  license_number: Joi.string().allow('', null),
  license_expiry: Joi.date().allow(null),
  assigned_vehicle: Joi.string().allow(null)
});

exports.updateDriverSchema = Joi.object({
  name: Joi.string(),
  phone_country_code: Joi.string().allow('', null),
  phone_number: Joi.string(),
  email: Joi.string().email().allow('', null),
  civil_id_number: Joi.string().allow('', null),
  nationality: Joi.string().allow('', null),
  license_number: Joi.string(),
  license_expiry: Joi.date().allow(null),
  assigned_vehicle: Joi.string().allow(null),
  status: Joi.string().valid('Active', 'Inactive', 'Blocked')
});
