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



const getAllCustomerSales = async (filters = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const query = {};

    if (filters.name) query['customer.name'] = { $regex: filters.name, $options: 'i' };
    if (filters.contact_number) query['customer.contact_number'] = filters.contact_number;
    if (filters.vin) query['vehicle.vin'] = filters.vin;

    if (filters.fromDate || filters.toDate) {
        query['vehicle.sold_date'] = {};
        if (filters.fromDate) query['vehicle.sold_date'].$gte = new Date(filters.fromDate);
        if (filters.toDate) query['vehicle.sold_date'].$lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
        CustomerSale.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        CustomerSale.countDocuments(query)
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