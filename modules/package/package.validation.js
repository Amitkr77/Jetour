const Joi = require("joi");

const Joi = require("joi");

exports.createPackage = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid("active", "inactive"),
  worktime: Joi.number().required(),
  details: Joi.array().items(Joi.string()),

  pricing: Joi.array().items(
    Joi.object({
      mileage: Joi.number().required(),
      vehicles: Joi.array().items(
        Joi.object({
          vehicle_model: Joi.string().required(),
          price: Joi.number().required()
        })
      ).min(1).required()
    })
  ).min(1).required()
});

exports.updatePackage = Joi.object({
  name: Joi.string(),
  status: Joi.string().valid("active", "inactive"),
  worktime: Joi.number(),
  details: Joi.array().items(Joi.string()),

  pricing: Joi.array().items(
    Joi.object({
      vehicle_model: Joi.string().required(),
      mileage: Joi.number().required(),
      price: Joi.number().required()
    })
  )
});

exports.changeStatus = Joi.object({
  status: Joi.string().valid("active", "inactive").required()
});
