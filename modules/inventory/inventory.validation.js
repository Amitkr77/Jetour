const Joi = require('joi');

exports.createInventorySchema = Joi.object({
  name: Joi.string().trim().required(),

  quantity: Joi.number().min(0).required(),

  unit_price: Joi.number().min(0).required(),

  part_status: Joi.string()
    .valid('usable', 'damaged', 'out_of_stock')
    .optional()
});

exports.updateInventorySchema = Joi.object({
  name: Joi.string().trim().optional(),

  quantity: Joi.number().min(0).optional(),

  unit_price: Joi.number().min(0).optional(),

  part_status: Joi.string()
    .valid('usable', 'damaged', 'out_of_stock')
    .optional()
});