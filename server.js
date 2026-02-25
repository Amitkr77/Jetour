require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/mongodb');
const { startSlotCron } = require("./jobs/slotCron.job");

startSlotCron();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
