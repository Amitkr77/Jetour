const Booking = require("../../booking/booking.model");
const TechnicianReview = require("../technicianReview/technicianReview.model");
const mongoose = require("mongoose");
const Technician = require("../technician.model");


// ===============================
// 1️⃣ DASHBOARD
// ===============================
exports.getDashboard = async (req, res) => {
  try {
    // 🔹 For testing (replace with req.user.id in production)
    const technicianId =
      req.user?.id || req.params.technicianId || req.body.technicianId;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: "Invalid technician ID" });
    }

    // ===============================
    // 1️⃣ Get Technician Name
    // ===============================
    const technician = await Technician.findById(technicianId)
      .select("name rating")
      .lean();

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    // ===============================
    // 2️⃣ Get Today's Date (since schedule.date is STRING)
    // ===============================
    const today = new Date().toISOString().split("T")[0];
    // Make sure your schedule.date format matches this (YYYY-MM-DD)

    // ===============================
    // 3️⃣ Get Today's Jobs
    // ===============================
    const bookings = await Booking.find({
      "assignment.technician": technicianId,
      "schedule.date": today
    });


    // ===============================
    // 5️⃣ Format Today Jobs
    // ===============================
    const todayJobs = bookings.map((booking) => ({
      package_name: booking.package?.name || null,
      customer_name: booking.customer?.name || null,
      vehicle_name: booking.vehicle?.vehicle_model || null,
      status:
        booking.status === "in-progress"
          ? "active"
          : booking.status === "confirmed"
            ? "scheduled"
            : booking.status,
      booking_time: booking.schedule?.start_time || null
    }));

    // ===============================
    // 6️⃣ Final Response
    // ===============================
    res.json({
      success: true,
      message: "Dashboard fetched successfully",
      rating: technician.rating || 0,
      name: technician.name,
      today_jobs: todayJobs
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
    const technicianId = req.user?.id || req.body.technicianId;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate("package.package_id")
      .lean();


    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (!booking.assignment?.technician ||
      booking.assignment.technician.toString() !== technicianId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // ===============================
    // Format Address
    // ===============================
    const addressParts = [
      booking.address?.block && `Block ${booking.address.block}`,
      booking.address?.street && `Street ${booking.address.street}`,
      booking.address?.building_no && `House ${booking.address.building_no}`
    ].filter(Boolean);

    const fullAddress = addressParts.join(", ");

    // ===============================
    // Final Response
    // ===============================
    return res.status(200).json({
      success: true,
      message: "Job details fetched successfully",
      status_code: 200,
      data: {
        job_info: {
          booking_id: booking.booking_id || booking._id,
          booking_time: booking.schedule?.start_time || null,
          package_info: {
            work_time: booking.package?.worktime
              ? `${booking.package.worktime} hours`
              : null,
            name: booking.package?.name || null,
            package_details:
              booking.package?.package_id.details || ["No details available"],
          }
        },
        vehicle_info: {
          model: booking.vehicle?.vehicle_model || null,
          VIN: booking.vehicle?.registration_number || null, // replace if VIN stored separately
          registration_number: booking.vehicle?.registration_number || null,
          mileage: booking.vehicle?.mileage
            ? `${booking.vehicle.mileage} km`
            : null
        },
        customer_info: {
          name: booking.customer?.name || null,
          country_code: "+965", // change if dynamic
          contact: booking.customer?.phone || null,
          address: fullAddress || null
        }
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.getMyJob = async (req, res) => {
  try {
    // 🔹 For testing (replace with req.user.id in production)
    const technicianId =
      req.user?.id || req.params.technicianId || req.body.technicianId;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid technician ID"
      });
    }

    // ===============================
    // 1️⃣ Fetch Jobs (assigned to technician)
    // ===============================
    const bookings = await Booking.find({
      "assignment.technician": technicianId,
      status: { $in: ["confirmed", "in-progress"] }
    })
      .sort({ "schedule.date": 1, "schedule.start_time": 1 })
      .lean();

    // ===============================
    // 2️⃣ Format Response Data
    // ===============================
    const formattedJobs = bookings.map((booking) => ({
      package_name: booking.package?.name || null,
      vehicle_name: booking.vehicle?.vehicle_model || null,
      status:
        booking.status === "in-progress"
          ? "active"
          : booking.status === "confirmed"
            ? "scheduled"
            : booking.status,
      booking_time: booking.schedule?.start_time || null,
      booking_id: booking.booking_id || booking._id,
      customer_details: {
        name: booking.customer?.name || null,
        country_code: "+965", // Static (change if stored dynamically)
        contact: booking.customer?.phone || null
      }
    }));

    // ===============================
    // 3️⃣ Final Response
    // ===============================
    return res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      status_code: 200,
      data: formattedJobs
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
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