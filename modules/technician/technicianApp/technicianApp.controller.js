const Booking = require("../models/booking.model");
const TechnicianReview = require("../technicianReview/technicianReview.model");
const mongoose = require("mongoose");


// ===============================
// 1️⃣ DASHBOARD
// ===============================
exports.getDashboard = async (req, res) => {
  try {
    const technicianId = req.user.id;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));
    const endOfDay = new Date(today.setHours(23,59,59,999));

    const todayJobs = await Booking.find({
      "assignment.technician": technicianId,
      "schedule.date": { $gte: startOfDay, $lte: endOfDay }
    });

    const weeklyJobsCount = await Booking.countDocuments({
      "assignment.technician": technicianId,
      "schedule.date": {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7))
      }
    });

    const ratingAgg = await TechnicianReview.aggregate([
      { $match: { technician_id: new mongoose.Types.ObjectId(technicianId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    const activeJob = await Booking.findOne({
      "assignment.technician": technicianId,
      status: "in_progress"
    }).populate("package customer");

    res.json({
      today: {
        total: todayJobs.length,
        completed: todayJobs.filter(j => j.status === "completed").length,
        pending: todayJobs.filter(j => j.status !== "completed").length
      },
      weekly_jobs: weeklyJobsCount,
      average_rating: ratingAgg[0]?.avgRating || 0,
      active_job: activeJob
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 2️⃣ ACTIVE JOB
// ===============================
exports.getActiveJob = async (req, res) => {
  try {
    const technicianId = req.user.id;

    const job = await Booking.findOne({
      "assignment.technician": technicianId,
      status: "in_progress"
    }).populate("package customer assignment.service_van");

    res.json(job);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 3️⃣ UPCOMING JOBS
// ===============================
exports.getUpcomingJobs = async (req, res) => {
  try {
    const technicianId = req.user.id;

    const jobs = await Booking.find({
      "assignment.technician": technicianId,
      status: "confirmed",
      "schedule.date": { $gte: new Date() }
    }).sort({ "schedule.date": 1, "schedule.start_time": 1 });

    res.json(jobs);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 4️⃣ JOB DETAIL
// ===============================
exports.getJobDetail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("package customer assignment.service_van");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    res.json(booking);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 5️⃣ START JOB
// ===============================
exports.startJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    booking.status = "in_progress";
    booking.service_progress.status = "in_progress";
    booking.service_progress.started_at = new Date();

    await booking.save();

    res.json({ message: "Job started", booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 6️⃣ UPDATE CHECKLIST
// ===============================
exports.updateChecklist = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(booking.service_progress, req.body);

    await booking.save();

    res.json({ message: "Checklist updated", booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 7️⃣ UPLOAD PHOTOS
// ===============================
exports.uploadPhotos = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { type, images } = req.body;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    if (type === "before")
      booking.service_progress.before_photos.push(...images);
    else if (type === "after")
      booking.service_progress.after_photos.push(...images);

    await booking.save();

    res.json({ message: "Photos uploaded" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 8️⃣ SAVE SUMMARY
// ===============================
exports.saveSummary = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    booking.service_progress.summary = req.body.summary;
    booking.service_progress.next_service_recommendation =
      req.body.next_service_recommendation;

    await booking.save();

    res.json({ message: "Summary saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 9️⃣ COMPLETE JOB
// ===============================
exports.completeJob = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.assignment.technician.toString() !== technicianId)
      return res.status(403).json({ message: "Unauthorized" });

    const sp = booking.service_progress;

    if (
      !sp.pre_inspection ||
      !sp.checklist_completed ||
      !sp.inventory_updated ||
      sp.before_photos.length === 0 ||
      sp.after_photos.length === 0
    ) {
      return res.status(400).json({
        message: "All checklist steps must be completed before finishing job"
      });
    }

    sp.status = "completed";
    sp.completed_at = new Date();
    booking.status = "awaiting_driver_confirmation";

    await booking.save();

    res.json({ message: "Job completed successfully", booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 🔟 HISTORY
// ===============================
exports.getHistory = async (req, res) => {
  try {
    const technicianId = req.user.id;

    const history = await Booking.find({
      "assignment.technician": technicianId,
      status: "completed"
    }).sort({ updatedAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};