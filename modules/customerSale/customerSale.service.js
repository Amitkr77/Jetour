const CustomerSale = require('./customerSale.model');

const createCustomerSale = async (data) => {
    return CustomerSale.create(data);
};

const updateCustomerSale = async (id, data) => {
    return CustomerSale.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    );
};

const patchCustomerSale = async (id, updateData) => {
    const updateObject = {};

    for (const key in updateData) {
        if (
            typeof updateData[key] === 'object' &&
            updateData[key] !== null &&
            !Array.isArray(updateData[key])
        ) {
            for (const subKey in updateData[key]) {
                updateObject[`${key}.${subKey}`] = updateData[key][subKey];
            }
        } else {
            updateObject[key] = updateData[key];
        }
    }

    return CustomerSale.findByIdAndUpdate(
        id,
        { $set: updateObject },
        { new: true, runValidators: true }
    );
};

const getByCustomerContact = async (contactNumber) => {
    return CustomerSale.findOne({
        "customer.contact_number": contactNumber
    });
};

const getAllCustomerSales = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    /* ✅ Optimized with Promise.all */
    const [data, total] = await Promise.all([
        CustomerSale.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        CustomerSale.countDocuments()
    ]);

    return {
        total,
        page,
        pages: Math.ceil(total / limit),
        data
    };
};

const getCustomerSaleById = async (id) => {
    return CustomerSale.findById(id);
};

module.exports = {
    createCustomerSale,
    updateCustomerSale,
    patchCustomerSale,
    getByCustomerContact,
    getAllCustomerSales,
    getCustomerSaleById
};