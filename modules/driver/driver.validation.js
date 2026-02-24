const Joi = require('joi');

exports.createDriverSchema = Joi.object({
  name: Joi.string().required(),

  contact: Joi.string().required(),

  email: Joi.string().email().allow('', null),

  civil_id: Joi.string().allow('', null),

  nationality: Joi.string().allow('', null),

  gender: Joi.string().valid('male', 'female').allow('', null),

  image: Joi.any(),

  rating: Joi.number().min(0).max(5).optional(),
  password: Joi.string().min(6).required(),
  country_code: Joi.string().pattern(/^\+\d{1,3}$/).optional(),

  status: Joi.string().valid('active', 'inactive', 'blocked').optional()
}).unknown(false);

exports.updateDriverSchema = Joi.object({
  name: Joi.string(),

  contact: Joi.string(),

  email: Joi.string().email().allow('', null),

  civil_id: Joi.string().allow('', null),

  nationality: Joi.string().allow('', null),

  gender: Joi.string().valid('male', 'female'),

  image: Joi.any(),

  rating: Joi.number().min(0).max(5),
  password: Joi.string().min(6).optional(),
  country_code: Joi.string().pattern(/^\+\d{1,3}$/),

  status: Joi.string().valid('active', 'inactive', 'blocked')
}).unknown(false);
