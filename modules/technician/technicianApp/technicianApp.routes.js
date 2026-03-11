const express = require("express");
const router = express.Router();
const technicianController = require("./technicianApp.controller");
const createUploader = require('../../../utils/uploadImage');
const parser = createUploader('booking/serivice');
// const authMiddleware = require("../middlewares/auth");
// const roleMiddleware = require("../middlewares/role");

// All technician routes require auth + technician role
// router.use(authMiddleware);
// router.use(roleMiddleware("technician"));

router.get("/dashboard/:technicianId", technicianController.getDashboard);
router.get("/active-job/:technicianId", technicianController.getActiveJob);
router.get("/my-job/:technicianId", technicianController.getMyJob);
router.get("/upcoming-jobs/:technicianId", technicianController.getUpcomingJobs);
router.get("/history", technicianController.getHistory);

router.get("/job/:bookingId/technicians/:technicianId", technicianController.getJobDetail);

router.patch("/start/:bookingId", technicianController.startJob);
router.patch("/checklist/:bookingId", technicianController.updateChecklist);
router.post("/upload-photos/:bookingId", technicianController.uploadPhotos);
router.patch("/complete/:bookingId/:technicianId", technicianController.completeJob);

module.exports = router;