const Joi = require("joi");

exports.createPackage = Joi.object({
  name: Joi.string().trim().required(),
  status: Joi.string().valid("active", "inactive"),
  details: Joi.array().items(Joi.string().trim()).min(1).required()
});

exports.updatePackage = Joi.object({
  name: Joi.string().trim(),
  status: Joi.string().valid("active", "inactive"),
  details: Joi.array().items(Joi.string().trim()).min(1)
});

exports.changeStatus = Joi.object({
  status: Joi.string().valid("active", "inactive").required()
});
