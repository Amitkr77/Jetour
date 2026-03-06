// controllers/booking.controller.js

const mongoose = require("mongoose");
const Booking = require("../booking/booking.model");
const CustomerModel = require("../customers/customer.model");
const ServicePackage = require("../package/package.model");
const VanSlot = require("../vanSlot/vanSlot.model");
const ServiceVan = require("../serviceVan/serviceVan.model");
const ScheduleConfig = require("../schedule/schedule.model");
const Notification = require("../../model/notification.model");
const Settings = require("../../model/settings.model");
const { calculatePackagePrice } = require("../package/package.service");


exports.createCustomerBooking = async (req, res) => {
  try {
    const { customer_id, vehicle_id, packageId, booking_date, booking_time, additional_notes } = req.body;

    // 1️⃣ Fetch customer by custom ID AND populate vehicles
    const customer = await CustomerModel.findOne({ id: customer_id })
      .populate("vehicles");
    if (!customer) return res.status(400).json({ message: "Customer not found" });


    // 2️⃣ Find the requested vehicle from the customer's vehicles
    const vehicle = customer.vehicles.find(v => v.id === vehicle_id);
    if (!vehicle) return res.status(400).json({ message: "Vehicle not found for this customer" });

    // 3️⃣ Fetch service package by custom package ID
    const servicePackage = await ServicePackage.findOne({ package_id: packageId });
    if (!servicePackage) return res.status(400).json({ message: "Package not found" });

    // 4️⃣ Prepare vehicle payload for price calculation
    const vehiclePayload = {
      vehicle_id: vehicle.vehicle_model,
      mileage: vehicle.mileage || 0
    };

    // 5️⃣ Calculate base price
    const base_price = calculatePackagePrice(servicePackage, vehiclePayload);

    // 6️⃣ Fetch global settings (service fee)
    const settings = await Settings.findOne({});
    const service_fee = settings?.service_fee || 0;
    const total_amount = base_price + service_fee;

    // 7️⃣ Create booking
    const booking = await Booking.create({
      customer: {
        customer_id: customer._id, // Mongo _id reference
        name: customer.name,
        email: customer.email,
        phone: customer.contact_number,
        gender: customer.gender,
        address: customer.full_address
      },
      vehicle: {
        vehicle_id: vehicle._id, // Mongo _id reference
        vehicle_model: vehicle.vehicle_model,
        registration_number: vehicle.registration_number || "",
        // model_year: vehicle.model_year || null,
        mileage: vehicle.mileage || 0
      },
      package: {
        package_id: servicePackage._id, // Mongo _id reference
        name: servicePackage.name,
        worktime: servicePackage.worktime,
        base_price,
        service_fee,
        total_amount
      },
      schedule: {
        date: booking_date,
        start_time: booking_time,
        slot_ids: []
      },
      // payment: {
      //   method: payment_method || "Card",
      //   status: "pending"
      // },
      status: "pending",
      additional_notes
    });

    return res.status(201).json({
      success: true,
      message: "Booking created. Awaiting payment confirmation.",
      booking
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// exports.createCustomerBooking = async (req, res) => {
//   try {
//     const {
//       customer,
//       address,
//       vehicle,
//       packageId,
//       booking_date,
//       booking_time,
//       payment_method,
//       additional_notes
//     } = req.body;


//     if (!mongoose.Types.ObjectId.isValid(packageId)) {
//       return res.status(400).json({ message: `Invalid package ID format: ${packageId}` });
//     }

//     const servicePackage = await ServicePackage.findById(packageId);

//     if (!servicePackage) {
//       return res.status(400).json({ message: "Invalid package" });
//     }

//     // 2. Calculate amount (use your existing logic)
//     // const amount = servicePackage.price;
//     if (!mongoose.Types.ObjectId.isValid(vehicle.vehicle_id)) {
//       return res.status(400).json({ message: "Invalid vehicle ID" });
//     }
//     const vehiclPlayload = {
//       vehicle_id: vehicle.vehicle_id,
//       mileage: vehicle.mileage
//     }

//     const base_price = calculatePackagePrice(servicePackage, vehiclPlayload);

//     // Get global settings
//     const settings = await Settings.findOne({});

//     if (!settings) {
//       return res.status(500).json({ message: "Settings not configured" });
//     }

//     const service_fee = settings.service_fee || 0;

//     const total_amount = base_price + service_fee;

//     // 3. Create booking as PENDING
//     const booking = await Booking.create({

//       created_by: "customer",

//       customer,
//       address,
//       vehicle,
//       package: {
//         package_id: servicePackage._id,
//         name: servicePackage.name,
//         worktime: servicePackage.worktime,
//         base_price,
//         service_fee,
//         total_amount
//       }, schedule: {
//         date: booking_date,
//         start_time: booking_time,
//         slot_ids: []
//       },
//       payment: {
//         method: payment_method,
//         status: "pending",
//       },
//       status: "pending",
//       additional_notes
//     });

//     res.status(201).json({
//       message: "Booking created. Awaiting payment confirmation.",
//       booking
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.confirmBookingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { booking_id, payment_method } = req.body;

    const booking = await Booking.findById(booking_id)
      .populate("package")
      .session(session);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.payment.status === "paid") {
      throw new Error("Booking already confirmed");
    }

    const config = await ScheduleConfig.findOne({}).session(session);


    const slotInterval = config.slot_interval_minutes;
    const buffer = config.buffer_between_bookings_minutes;

    const worktime = booking.package.worktime;

    const totalBlock = worktime + buffer;
    const requiredSlots = Math.ceil(totalBlock / slotInterval);

    // 1. Find all available slots for that date & start time
    const allSlots = await VanSlot.find({
      date: booking.schedule.date,
      status: "available",

    }).sort({ van: 1, start_time: 1 }).session(session);


    // 2. Group by van
    const grouped = {};

    allSlots.forEach(slot => {
      const vanKey = slot.van_id.toString();

      if (!grouped[vanKey]) {
        grouped[vanKey] = [];
      }

      grouped[vanKey].push(slot);
    });

    let selectedVan = null;
    let selectedSlots = [];

    // 3. Find consecutive slots
    for (let vanId in grouped) {
      const slots = grouped[vanId];

      // Create a map for quick lookup
      const slotMap = {};
      slots.forEach(slot => {
        slotMap[slot.start_time] = slot;
      });

      // Generate required time sequence
      let currentTime = booking.schedule.start_time;
      const consecutive = [];

      for (let k = 0; k < requiredSlots; k++) {
        if (!slotMap[currentTime]) {
          break;
        }

        consecutive.push(slotMap[currentTime]);

        // Move to next interval
        const [hour, minute] = currentTime.split(":").map(Number);
        const next = new Date(0, 0, 0, hour, minute + slotInterval);
        currentTime =
          next.getHours().toString().padStart(2, "0") +
          ":" +
          next.getMinutes().toString().padStart(2, "0");
      }


      if (consecutive.length === requiredSlots) {
        selectedVan = vanId;
        selectedSlots = consecutive;
        break;
      }
    }

    if (!selectedVan) {
      booking.status = "pending_manual_assignment";
      booking.payment.status = "paid";
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Payment received but no slots available. Admin intervention required."
      });
    }

    // 4. Lock slots
    const slotIds = selectedSlots.map(s => s._id);

    await VanSlot.updateMany(
      { _id: { $in: slotIds }, status: "available" },
      {
        status: "booked",
        booking_id: booking._id
      },
      { session }
    );


    const van = await ServiceVan.findById(selectedVan).session(session);


    if (!van) {
      throw new Error("Assigned service van not found");
    }

    const needsAttention = !van.driver || !van.technician;

    // 5. Update booking
    booking.schedule.slot_ids = slotIds;
    booking.schedule.end_time =
      selectedSlots[selectedSlots.length - 1].end_time;

    booking.assignment = {
      service_van: van._id,
      driver: van.driver || null,
      technician: van.technician || null,
      needs_attention: needsAttention
    };

    // Initialize service progress
    booking.service_progress = {
      status: "not_started",
      pre_inspection: false,
      checklist_completed: false,
      before_photos: [],
      after_photos: [],
      inventory_updated: false,
      summary: "",
      next_service_recommendation: "",
      started_at: null,
      completed_at: null
    };

    if (payment_method) {
      if (!["card", "COD"].includes(payment_method)) {
        throw new Error("Invalid payment method");
      }
      booking.payment.method = payment_method;
    }
    booking.payment.status = "paid";
    booking.status = "confirmed";

    await booking.save({ session });

    // 6. Notify admin if needed
    if (needsAttention) {
      await Notification.create([{
        title: "Booking needs driver/technician assignment",
        booking: booking._id,
        role: "admin"
      }], { session });
    }
    // await Notification.create([{
    //   title: "Your booking is confirmed",
    //   booking: booking._id,
    //   user: booking.customer,
    //   role: "customer"
    // }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Booking confirmed successfully",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingsByCustomerId = async (req, res) => {
  try {
    const { customer_id } = req.params;

    // 🔎 Validate customer_id
    if (!mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid customer_id"
      });
    }

    // 🔥 Fetch bookings
    const bookings = await Booking.find({
      "customer.customer_id": customer_id
    })
      .sort({ createdAt: -1 }); // Latest first

    return res.status(200).json({
      status: true,
      message: "Bookings fetched successfully",
      total: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error("Fetch Booking Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong"
    });
  }
};

exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { booking_id } = req.body;

    const booking = await Booking.findById(booking_id).session(session);

    if (!booking) throw new Error("Booking not found");

    if (booking.schedule.slot_ids.length > 0) {
      await VanSlot.updateMany(
        { _id: { $in: booking.schedule.slot_ids } },
        { is_booked: false, booking: null },
        { session }
      );
    }

    booking.status = "cancelled";
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Booking cancelled and slots released" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingDashboard = async (req, res) => {
  try {
    // ===============================
    // TIMEZONE SAFE DATE (CHANGE IF NEEDED)
    // ===============================
    const timezone = "Asia/Kolkata"; // change if business timezone different
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: timezone })
    );

    // ===============================
    // TODAY RANGE
    // ===============================
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayFilter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    // ===============================
    // TODAY BOOKINGS
    // ===============================
    const total_count = await Booking.countDocuments(todayFilter);

    const completed = await Booking.countDocuments({
      ...todayFilter,
      status: "completed"
    });

    const in_progress = await Booking.countDocuments({
      ...todayFilter,
      status: "in-progress"
    });

    // ===============================
    // REVENUE (ONLY PAID)
    // ===============================
    const revenueAgg = await Booking.aggregate([
      {
        $match: { "payment.status": "paid" }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$package.total_amount" }
        }
      }
    ]);

    const revenue = revenueAgg.length ? revenueAgg[0].total : 0;

    // ===============================
    // WEEKLY BOOKING TREND
    // ===============================
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const trendAgg = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: firstDayOfWeek,
            $lte: lastDayOfWeek
          }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);

    const booking_trend = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0
    };

    const dayMap = {
      1: "sunday",
      2: "monday",
      3: "tuesday",
      4: "wednesday",
      5: "thursday",
      6: "friday",
      7: "saturday"
    };

    trendAgg.forEach(item => {
      booking_trend[dayMap[item._id]] = item.count;
    });

    // ===============================
    // SERVICE DISTRIBUTION
    // ===============================
    const serviceAgg = await Booking.aggregate([
      {
        $group: {
          _id: "$package.name",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalServices = serviceAgg.reduce(
      (acc, item) => acc + item.count,
      0
    );

    const service_distribution = serviceAgg.map(item => ({
      package_name: item._id,
      percentage: totalServices
        ? Math.round((item.count / totalServices) * 100)
        : 0
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.status(200).json({
      status: true,
      message: "Dashboard details retrieved successfully",
      data: {
        today_bookings: {
          total_count,
          completed,
          in_progress
        },
        revenue,
        booking_trend,
        service_distribution
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      status: false,
      message: "Something went wrong"
    });
  }
};