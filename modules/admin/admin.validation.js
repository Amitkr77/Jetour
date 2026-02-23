const Joi = require('joi');

exports.registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const Joi = require("joi");

exports.updateProfile = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email()
});

exports.changePassword = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).required()
});

