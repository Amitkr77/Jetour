const service = require('./customerSale.service');
const { createCustomerSale: validationSchema } = require('./customerSale.validation');

exports.createCustomerSale = async (req, res) => {
    try {
        const { error, value } = validationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            });
        }

        const result = await service.createCustomerSale(value);

        res.status(201).json({
            message: "Customer and Vehicle created successfully",
            data: result
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Duplicate registration number or VIN"
            });
        }

        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
};

exports.updateCustomerSale = async (req, res) => {
    try {
        const updated = await service.updateCustomerSale(req.params.id, req.body);

        if (!updated) {
            return res.status(404).json({ message: "Record not found" });
        }

        res.json({
            message: "Updated successfully",
            data: updated
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getByCustomerContact = async (req, res) => {
    try {
        const data = await service.getByCustomerContact(req.params.contact);

        if (!data) {
            return res.status(404).json({ message: "No record found" });
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllCustomerSale = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const data = await service.getAllCustomerSales(page, limit);

        res.json(data);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCustomerSaleById = async (req, res) => {
    try {
        const data = await service.getCustomerSaleById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        res.json(data);

    } catch (err) {
        res.status(400).json({
            message: "Invalid ID format"
        });
    }
};