// controllers/booking.controller.js

const mongoose = require("mongoose");
const Booking = require("../booking/booking.model");
const CustomerModel = require("../customers/customer.model");
const ServicePackage = require("../package/package.model");
const VanSlot = require("../vanSlot/vanSlot.model");
const ServiceVan = require("../serviceVan/serviceVan.model");
const ScheduleConfig = require("../schedule/schedule.model");
const Settings = require("../../model/settings.model");
const vehicleModel = require("../vehicle/vehicle.model")
const Driver = require("../driver/driver.model");
const Technician = require("../technician/technician.model");
const CustomerVehicle = require("../customers/vehicle/customerVehicle.model")
const { calculatePackagePrice } = require("../package/package.service");
const { sendNotificationToUser } = require("../../controllers/notification.controller.js")
const { releaseSlots } = require("../vanSlot/slotRelase.service.js")

exports.createAdminBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, vehicle, package: pkg, schedule, additional_notes, payment_method } = req.body;

    // 1️⃣ Validate input (same as before)
    if (!customer?.name || !customer?.phone || !customer?.country_code) throw new Error("Customer info required");
    if (!vehicle?.vehicle_model || !vehicle?.registration_number || vehicle?.mileage == null) throw new Error("Vehicle info required");
    if (!pkg?.package_id) throw new Error("Package ID required");
    if (!schedule?.date || !schedule?.start_time) throw new Error("Booking date and start time required");



    // 2️⃣ Find or create customer
    let dbCustomer = await CustomerModel.findOne({ contact_number: customer.phone, country_code: customer.country_code }).session(session);
    if (!dbCustomer) {
      // dbCustomer = (await CustomerModel.create([{ ...customer }], { session }))[0];
      dbCustomer = (await CustomerModel.create([{
        name: customer.name,
        contact_number: customer.phone,
        country_code: customer.country_code,
        email: customer.email,
        gender: customer.gender,
        lat: customer.address.lat,
        lng: customer.address.lng,
        full_address: {
          governorate: customer.address.governorate,
          area: customer.address.area,
          block: customer.address.block,
          street: customer.address.street,
          building_number: customer.address.building_no,
          floor_number: customer.address.floor_no,
          flat_number: customer.address.flat_no,
          paci_details: customer.address.paci_details,
        }
      }], { session }))[0];
    }

    // 3️⃣ Find vehicle model
    const vehicleDoc = await vehicleModel.findOne({ vehicle_model: vehicle.vehicle_model }).session(session);
    if (!vehicleDoc) throw new Error("Vehicle model not found");

    // 4️⃣ Find or create customer vehicle
    let customerVehicle = await CustomerVehicle.findOne({ customer: dbCustomer._id, registration_number: vehicle.registration_number }).session(session);
    if (!customerVehicle) {
      customerVehicle = (await CustomerVehicle.create([{
        customer: dbCustomer._id,
        vehicle_model: vehicleDoc._id,
        registration_number: vehicle.registration_number,
        mileage: vehicle.mileage,
        category: vehicleDoc.vehicle_category,
        id: vehicleDoc.id
      }], { session }))[0];
    }

    // 5️⃣ Fetch package & calculate price
    const servicePackage = await ServicePackage.findById(pkg.package_id).session(session);
    if (!servicePackage) throw new Error("Package not found");
    const base_price = calculatePackagePrice(servicePackage, { vehicle_id: vehicleDoc._id, mileage: vehicle.mileage });
    const settings = await Settings.findOne({}).session(session);
    const service_fee = settings?.service_fee || 0;
    const total_amount = base_price + service_fee;

    const bookingAddress = {
      governorate: dbCustomer.full_address.governorate,
      area: dbCustomer.full_address.area,
      block: dbCustomer.full_address.block,
      street: dbCustomer.full_address.street,
      building_no: dbCustomer.full_address.building_number,
      floor_no: dbCustomer.full_address.floor_number,
      flat_no: dbCustomer.full_address.flat_number,
      paci_details: dbCustomer.full_address.paci_details,
      lat: dbCustomer.lat,
      lng: dbCustomer.lng
    };

    const paymentMethod = (payment_method || "COD").toUpperCase();
    const paymentStatus = paymentMethod === "COD" ? "pending" : "paid";

    // 6️⃣ Create booking (status pending)
    let booking = (await Booking.create([{
      created_by: "admin",
      customer: {
        customer_id: dbCustomer._id,
        name: dbCustomer.name,
        email: dbCustomer.email || "",
        phone: dbCustomer.contact_number,
        country_code: dbCustomer.country_code,
        gender: dbCustomer?.gender || "Other",
      },
      address: bookingAddress,
      vehicle: {
        vehicle_id: vehicleDoc._id,
        vehicle_model: vehicleDoc.vehicle_model,
        registration_number: customerVehicle.registration_number,
        mileage: customerVehicle.mileage
      },
      package: {
        package_id: servicePackage._id,
        name: servicePackage.name,
        worktime: servicePackage.worktime,
        base_price,
        service_fee,
        total_amount
      },
      schedule: {
        date: schedule.date,
        start_time: schedule.start_time,
        slot_ids: []
      },
      payment: {
        method: paymentMethod,
        status: paymentStatus
      },
      status: "pending",
      additional_notes
    }], { session }))[0];

    // 7️⃣ Attempt to assign slots and confirm booking
    const config = await ScheduleConfig.findOne({}).session(session);
    const slotInterval = config.slot_interval_minutes;
    const buffer = config.buffer_between_bookings_minutes;
    const totalBlock = servicePackage.worktime + buffer;
    const requiredSlots = Math.ceil(totalBlock / slotInterval);

    const allSlots = await VanSlot.find({ date: booking.schedule.date, status: "available" }).sort({ van: 1, start_time: 1 }).session(session);

    // Group slots by van
    const grouped = {};
    allSlots.forEach(slot => {
      const vanKey = slot.van_id.toString();
      grouped[vanKey] = grouped[vanKey] || [];
      grouped[vanKey].push(slot);
    });

    let selectedVan = null, selectedSlots = [];
    for (const vanId in grouped) {
      const slots = grouped[vanId];
      const slotMap = Object.fromEntries(slots.map(s => [s.start_time, s]));
      let currentTime = booking.schedule.start_time;
      const consecutive = [];
      for (let k = 0; k < requiredSlots; k++) {
        if (!slotMap[currentTime]) break;
        consecutive.push(slotMap[currentTime]);
        const [hour, minute] = currentTime.split(":").map(Number);
        const next = new Date(0, 0, 0, hour, minute + slotInterval);
        currentTime = next.getHours().toString().padStart(2, "0") + ":" + next.getMinutes().toString().padStart(2, "0");
      }
      if (consecutive.length === requiredSlots) {
        selectedVan = vanId;
        selectedSlots = consecutive;
        break;
      }
    }

    if (!selectedVan) {
      booking.status = "pending_manual_assignment";
      // booking.payment.status = "paid";
      await booking.save({ session });
    } else {
      // Lock slots
      const slotIds = selectedSlots.map(s => s._id);
      await VanSlot.updateMany({ _id: { $in: slotIds }, status: "available" }, { status: "booked", booking_id: booking._id }, { session });

      const van = await ServiceVan.findById(selectedVan).session(session);
      const needsAttention = !van.driver || !van.technician;

      booking.schedule.slot_ids = slotIds;
      booking.schedule.end_time = selectedSlots[selectedSlots.length - 1].end_time;
      booking.assignment = {
        service_van: van._id,
        driver: van.driver || null,
        technician: van.technician || null,
        needs_attention: needsAttention
      };
      booking.service_progress = {
        status: "not_started",
        pre_inspection: false,
        checklist_completed: false,
        before_photos: {                  // before service photos
          interior: [],                   // interior photos
          exterior: []                    // exterior photos
        },
        after_photos: {                   // after service photos
          interior: [],                   // interior photos
          exterior: []                    // exterior photos
        },
        inventory_updated: false,
        summary: "",
        next_service_recommendation: "",
        started_at: null,
        completed_at: null
      };
      booking.status = "confirmed";

      // if (needsAttention) {
      //   await Notification.create([{ title: "Booking needs driver/technician assignment", booking: booking._id, role: "admin" }], { session });
      // }

      await booking.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ success: true, message: "Admin booking created successfully", booking });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdminBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingId = req.params.id;
    const { schedule, booking_status } = req.body;

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new Error("Booking not found");

    let scheduleChanged = false;

    // ---------------- STATUS UPDATE ----------------
    if (booking_status) {
      if (booking_status === "cancelled") {
        // 🔹 Use releaseSlots service to release booked slots and update status
        await releaseSlots({ bookingId: booking._id, releaseType: "cancelled" });
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          message: "Booking cancelled and slots released",
        });
      } else {
        booking.status = booking_status;
      }
    }

    // ---------------- SCHEDULE UPDATE ----------------
    if (schedule) {
      if (schedule.date && schedule.date !== booking.schedule.date) {
        booking.schedule.date = schedule.date;
        scheduleChanged = true;
      }

      if (schedule.start_time && schedule.start_time !== booking.schedule.start_time) {
        booking.schedule.start_time = schedule.start_time;
        scheduleChanged = true;
      }
    }

    // ---------------- CUSTOMER INFO UPDATE ----------------
    if (req.body.customer) {
      const cust = req.body.customer;

      if (cust.phone) booking.customer.phone = cust.phone;
      if (cust.country_code) booking.customer.country_code = cust.country_code;

      if (cust.address) {
        booking.address = {
          ...booking.address,
          ...cust.address
        };
      }
    }

    // ---------------- RESCHEDULING LOGIC ----------------
    if (scheduleChanged) {
      const oldSlotIds = booking.schedule.slot_ids || [];

      if (oldSlotIds.length) {
        await VanSlot.updateMany(
          { _id: { $in: oldSlotIds }, status: "booked" },
          { $set: { status: "available", booking_id: null } },
          { session }
        );
      }

      booking.schedule.slot_ids = [];
      booking.schedule.end_time = null;
      booking.assignment = { service_van: null, driver: null, technician: null, needs_attention: true };

      const servicePackage = await ServicePackage.findById(booking.package.package_id).session(session);
      const config = await ScheduleConfig.findOne({}).session(session);
      const slotInterval = config.slot_interval_minutes;
      const buffer = config.buffer_between_bookings_minutes;
      const totalBlock = servicePackage.worktime + buffer;
      const requiredSlots = Math.ceil(totalBlock / slotInterval);

      const allSlots = await VanSlot.find({ date: booking.schedule.date, status: "available" })
        .sort({ van_id: 1, start_time: 1 })
        .session(session);

      const grouped = {};
      allSlots.forEach(s => {
        const key = s.van_id.toString();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });

      let selectedVan = null;
      let selectedSlots = [];

      for (const vanId in grouped) {
        const slots = grouped[vanId];
        const slotMap = Object.fromEntries(slots.map(s => [s.start_time, s]));
        let currentTime = booking.schedule.start_time;
        const consecutive = [];

        for (let i = 0; i < requiredSlots; i++) {
          if (!slotMap[currentTime]) break;
          consecutive.push(slotMap[currentTime]);
          const [h, m] = currentTime.split(":").map(Number);
          const next = new Date(0, 0, 0, h, m + slotInterval);
          currentTime = next.getHours().toString().padStart(2, "0") + ":" + next.getMinutes().toString().padStart(2, "0");
        }

        if (consecutive.length === requiredSlots) {
          selectedVan = vanId;
          selectedSlots = consecutive;
          break;
        }
      }

      if (!selectedVan) {
        booking.status = "pending_manual_assignment";
      } else {
        const slotIds = selectedSlots.map(s => s._id);

        const updateResult = await VanSlot.updateMany(
          { _id: { $in: slotIds }, status: "available" },
          { $set: { status: "booked", booking_id: booking._id } },
          { session }
        );

        if (updateResult.modifiedCount !== slotIds.length) throw new Error("Slot booking conflict, please retry");

        const van = await ServiceVan.findById(selectedVan).session(session);
        const needsAttention = !van.driver || !van.technician;

        booking.schedule.slot_ids = slotIds;
        booking.schedule.end_time = selectedSlots[selectedSlots.length - 1].end_time;
        booking.assignment = { service_van: van._id, driver: van.driver || null, technician: van.technician || null, needs_attention: needsAttention };
        booking.status = "confirmed";
      }
    }

    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Update booking error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomerBooking = async (req, res) => {
  try {
    const { customer_id, full_address, vehicle_id, packageId, booking_date, booking_time, additional_notes } = req.body;

    if (!full_address?.lat || !full_address?.lng) {
      return res.status(400).json({ message: "Lat & lng required for the booking" });
    }

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

    const vehicleName = await vehicleModel.findById(vehicle.vehicle_model)

    // 7️⃣ Create booking
    const booking = await Booking.create({
      customer: {
        customer_id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.contact_number,
        country_code: customer.country_code,
        gender: customer.gender,
        // address: full_address,
      },
      address: {
        governorate: full_address.governorate,
        area: full_address.area,
        block: full_address.block,
        street: full_address.street,
        building_no: full_address.building_number,
        floor_no: full_address.floor,
        flat_no: full_address.flat,
        paci_details: full_address.paci_details,
        lat: Number(full_address.lat),
        lng: Number(full_address.lng),
      },
      vehicle: {
        vehicle_id: vehicle._id,
        vehicle_model: vehicleName.vehicle_model || null,
        registration_number: vehicle.registration_number || "",
        // model_year: vehicle.model_year || null,
        mileage: vehicle.mileage || 0
      },
      package: {
        package_id: servicePackage._id,
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
      before_photos: {                  // before service photos
        interior: [],                   // interior photos
        exterior: []                    // exterior photos
      },
      after_photos: {                   // after service photos
        interior: [],                   // interior photos
        exterior: []                    // exterior photos
      },
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

    // await sendNotificationToUser(booking.assignment.driver, "🚗 Booking Update", "Your service has been assigned!", { booking_id: booking._id })

    //  await sendNotificationToUser(booking.assignment.technician, "🚗 Booking Update", "Your service has been assigned!", { booking_id: booking._id })

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Booking confirmed successfully",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "booking_id is required"
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findById(booking_id)
      .populate("assignment.technician", "name phone")
      .populate("assignment.driver", "name phone")
      .populate("assignment.service_van", "van_number");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error("Get booking by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate("assignment.technician", "name phone")
      .populate("assignment.driver", "name phone")
      .populate("assignment.service_van", " registration_number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(filter);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      bookings
    });

  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getBookingByFilter = async (req, res) => {
  try {
    const { name, contact, from_date, to_date, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Customer name filter (case-insensitive)
    if (name) {
      filter["customer.name"] = { $regex: name, $options: "i" };
    }

    // Customer contact filter (case-insensitive)
    if (contact) {
      filter["customer.phone"] = { $regex: contact, $options: "i" };
    }

    // Date range filter
    if (from_date || to_date) {
      filter.createdAt = {};

      if (from_date) {
        const [day, month, year] = from_date.split("/");
        filter.createdAt.$gte = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      }

      if (to_date) {
        const [day, month, year] = to_date.split("/");
        filter.createdAt.$lte = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
      }
    }

    // Run both queries in parallel for performance
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("assignment.technician", "name phone")
        .populate("assignment.driver", "name phone")
        .populate("assignment.service_van", "registration_number")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter)
    ]);


    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      bookings
    });

  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getCustomerBookings = async (req, res) => {
  try {
    const { contact_number } = req.query;
    let country_code = req.query.country_code || '';
    country_code = country_code.replace(/\s/g, '');

    if (!contact_number || !country_code) {
      return res.status(400).json({
        success: false,
        message: "contact_number and country_code are required",
      });
    }

    const bookings = await Booking.find({
      "customer.phone": contact_number,
      "customer.country_code": country_code,
    }).sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this customer",
      });
    }

    const formattedData = bookings.map((data) => ({
      package_name: data.package?.name || null,
      price: data?.package.total_amount || null,
      booking_id: data?._id || null,
      status: data?.status || null
    }));

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getConfirmedBookingsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params; // this is CUST-xxxxx

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    // ✅ Step 1: Find customer using custom ID
    const customer = await CustomerModel.findOne({ id: customer_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // ✅ Step 2: Use _id in booking query
    const bookings = await Booking.find({
      "customer.customer_id": customer._id,
      "trip_details.status": "driver_on_the_way"
    })
      .populate("assignment.technician", "name contact technician_id")
      .populate("assignment.driver", "name contact driver_id")
      .populate("assignment.service_van", "registration_number")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings
    });

  } catch (error) {
    console.error("Error fetching confirmed bookings:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "booking_id is required"
      });
    }

    // Use your centralized release logic
    await releaseSlots({
      bookingId: booking_id,
      releaseType: "cancelled"
    });

    return res.status(200).json({
      success: true,
      message: "Booking cancelled and slots released successfully"
    });

  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
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
      "service_progress.status": "in_progress"
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

exports.trackBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const booking = await Booking.findById({ _id: booking_id })
      .populate("assignment.technician", "name phone")
      .populate("assignment.driver", "name phone")
      .populate("assignment.service_van", "van_number");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const timeline = [];

    // 1️⃣ Booking Confirmed
    timeline.push({
      step: "Booking Confirmed",
      completed: booking.status !== "pending",
      date: booking.createdAt
    });

    // 2️⃣ Technician Assigned
    timeline.push({
      step: "Technician Assigned",
      completed: !!booking.assignment.technician,
      date: booking.assignment.assigned_at || null,
      technician: booking.assignment.technician
    });

    // 3️⃣ Van On The Way
    timeline.push({
      step: "Van On The Way",
      completed: booking.trip_details.trip_status === "pending",
      date: booking.trip_details.started_at || null
    });

    // 4️⃣ Service In Progress
    timeline.push({
      step: "Service In Progress",
      completed: booking.service_progress.status === "in_progress" ||
        booking.service_progress.status === "completed",
      date: booking.service_progress.started_at || null
    });

    // 5️⃣ Service Completed
    timeline.push({
      step: "Service Completed",
      completed: booking.service_progress.status === "completed",
      date: booking.service_progress.completed_at || null
    });

    res.json({
      success: true,
      booking_id: booking.booking_id,
      status: booking.status,
      technician: booking.assignment.technician,
      driver: booking.assignment.driver,
      service_van: booking.assignment.service_van,
      timeline
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.updateBookingAssignment = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { driver_id, technician_id } = req.body;

    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // 🔹 Find driver using custom ID
    if (driver_id) {
      const driver = await Driver.findOne({ driver_id: driver_id });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found"
        });
      }

      booking.assignment.driver = driver._id;
    }

    // 🔹 Find technician using custom ID
    if (technician_id) {
      const technician = await Technician.findOne({ technician_id: technician_id });

      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Technician not found"
        });
      }

      booking.assignment.technician = technician._id;
    }

    booking.assignment.assigned_at = new Date();
    booking.assignment.needs_attention = false;

    await booking.save();

    res.json({
      success: true,
      message: "Assignment updated successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};