const Joi = require('joi');

const createCustomerSale = Joi.object({
    customer: Joi.object({
        name: Joi.string().required(),
        country_code: Joi.string().required(),
        contact_number: Joi.string().required()
    }).required(),

    vehicle: Joi.object({
        model_id: Joi.string().required(),
        registration_number: Joi.string().required(),
        vin: Joi.string().required(),
        sold_date: Joi.date().required(),
        model_year: Joi.number().integer().required(),
        variant: Joi.string().required(),
        color: Joi.string().required(),
        last_service_date: Joi.date().optional(),
        last_recorded_mileage: Joi.number().integer().min(0).optional(),
        transmission: Joi.string().valid('manual', 'automatic').required(),
        fuel_type: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid').required(),
        sales_label: Joi.string().optional()
    }).required()
});

module.exports = {
    createCustomerSale
};