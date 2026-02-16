const mongoose = require('mongoose');
const serviceVanService = require('./serviceVan.service');
const validation = require('./serviceVan.validation');

exports.createServiceVan = async (req, res, next) => {
  try {
    const { error } = validation.createServiceVanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const van = await serviceVanService.createServiceVan(req.body);

    return res.status(201).json({
      success: true,
      message: 'Service van created successfully',
      data: van
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllServiceVans = async (req, res, next) => {
  try {
    const vans = await serviceVanService.getAllServiceVans();

    return res.status(200).json({
      success: true,
      message: 'Service vans fetched successfully',
      data: vans
    });
  } catch (err) {
    next(err);
  }
};

exports.getServiceVanDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const van = await serviceVanService.getServiceVanById(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van fetched successfully',
      data: van
    });
  } catch (err) {
    next(err);
  }
};

exports.updateServiceVan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const { error } = validation.updateServiceVanSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const van = await serviceVanService.updateServiceVan(
      req.params.id,
      req.body
    );

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van updated successfully',
      data: van
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteServiceVan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service van ID',
        data: null
      });
    }

    const van = await serviceVanService.deleteServiceVan(req.params.id);

    if (!van) {
      return res.status(404).json({
        success: false,
        message: 'Service van not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service van deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
