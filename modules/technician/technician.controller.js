const technicianService = require('./technician.service');
const validation = require('./technician.validation');

exports.createTechnician = async (req, res, next) => {
  try {
    const { error } = validation.createTechnicianSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const technician = await technicianService.createTechnician(req.body);

    res.status(201).json({
      success: true,
      message: "Technician created successfully",
      data: technician
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllTechnicians = async (req, res, next) => {
  try {
    const technicians = await technicianService.getAllTechnicians();

    res.status(200).json({
      success: true,
      message: "Technicians fetched successfully",
      data: technicians
    });
  } catch (err) {
    next(err);
  }
};

exports.getTechnicianDetail = async (req, res, next) => {
  try {
    const technician = await technicianService.getTechnicianById(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Technician fetched successfully",
      data: technician
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTechnician = async (req, res, next) => {
  try {
    const { error } = validation.updateTechnicianSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    const technician = await technicianService.updateTechnician(
      req.params.id,
      req.body
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Technician updated successfully",
      data: technician
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTechnician = async (req, res, next) => {
  try {
    const technician = await technicianService.deleteTechnician(req.params.id);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Technician deleted successfully",
      data: technician
    });
  } catch (err) {
    next(err);
  }
};
