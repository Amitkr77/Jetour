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
app.use("/api/v1/admin/settings", settingsRoutes);
app.use('/api/v1/inventory_item', inventoryRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/notifications", notificationRoutes);


app.get('/', (req, res) => {
  res.send('Jetour Backend Running 🚀');
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
