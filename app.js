const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorMiddleware = require('./middlewares/error.middleware');
const adminRoutes = require('./modules/admin/admin.routes');
const customerRoutes =require('./modules/customers/customer.routes')
const technicianRoutes =require('./modules/technician/technician.routes')



const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/technicians',technicianRoutes);
app.use('/api/v1/drivers', require('./modules/driver/driver.routes'));
app.use('/api/v1/vehicles', require('./modules/vehicle/vehicle.routes'));
app.use('/api/v1/service-vans', require('./modules/serviceVan/serviceVan.routes'));

// app.use('/api/v1/customers', customerRoutes)

app.get('/', (req, res) => {
  res.send('Jetour Backend Running 🚀');
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
