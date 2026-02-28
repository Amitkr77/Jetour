const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorMiddleware = require('./middlewares/error.middleware');
const adminRoutes = require('./modules/admin/admin.routes');
const customerRoutes = require('./modules/customers/customer.routes')
const technicianRoutes = require('./modules/technician/technician.routes')
const settingsRoutes = require('./routes/settings.routes')
const bookingRoutes = require("./modules/booking/booking.routes");
const notificationRoutes = require("./routes/notification.routes");
const driverRoutes = require('./modules/driver/driver.routes')
const vehicleRoutes = require('./modules/vehicle/vehicle.routes')
const serviceVanRoutes = require('./modules/serviceVan/serviceVan.routes')
const packagesRoutes = require("./modules/package/package.routes")
const inventoryRoutes = require('./modules/inventory/inventory.routes')
const slotRoutes = require("./modules/vanSlot/slot.routes");
const scheduleRoutes = require('./modules/schedule/schedule.routes')
const userVehicleRoutes = require('./modules/customers/vehicle/customerVehicle.routes')

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/technicians', technicianRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/service-vans', serviceVanRoutes);
app.use("/api/v1/packages", packagesRoutes);
app.use("/api/v1/admin/settings", settingsRoutes); // this needs to check before deploying
app.use('/api/v1/inventory_item', inventoryRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/slots", slotRoutes);
app.use("/api/v1/user/vehicle", userVehicleRoutes);


app.get('/', (req, res) => {
  res.send('Jetour Backend Running 🚀');
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
