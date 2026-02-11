require("dotenv").config();
const express = require("express");
const app = express();
const employee_route = require('./models/employees/employee.routes')
const customer_route = require('./models/customers/customer.routes')
const vehicle_route = require('./models/vehicles/vehicle.routes');
const admin_route = require('./models/admin/admin.routes');

app.use(express.json());

app.use('/api/v1', employee_route);
app.use('/api/v1', customer_route);
app.use('/api/v1', vehicle_route);
app.use('/api/v1', admin_route);


app.get("/", (req, res) => {
    res.send("Jetour backend running 🚗🔥");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
