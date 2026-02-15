const Joi = require('joi');

exports.updateTechnicianSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().min(8).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  nationality: Joi.string().required(),
  status: Joi.string().valid('Active', 'Inactive').required(),
  photo: Joi.string().optional()
});
