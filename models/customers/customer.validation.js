const Joi = require('joi');

exports.createCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone_country_code: Joi.string().max(5).optional(),
  phone_number: Joi.string().min(8).required(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  nationality: Joi.string().optional(),
  dob: Joi.date().optional(),
  preferred_language: Joi.string().valid('Arabic', 'English').optional()
});

exports.updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone_country_code: Joi.string().max(5).required(),
  phone_number: Joi.string().min(8).required(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  nationality: Joi.string().optional(),
  dob: Joi.date().optional(),
  preferred_language: Joi.string().valid('Arabic', 'English').required(),
  status: Joi.string().valid('Active', 'Inactive', 'Blocked').required()
});
