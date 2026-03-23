require('dotenv').config();

const http = require("http");                          // ADD
const app = require('./app');
const connectDB = require('./config/mongodb');
const { startSlotCron } = require("./jobs/slotCron.job");
const { generateSlots } = require("./modules/vanSlot/slotGenerator.service");
const { connectRedis } = require("./redis");           // ADD
const { initSocket } = require("./socket");            // ADD

// generateSlots();
startSlotCron();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await connectRedis();                                // ADD

  const server = http.createServer(app);              // ADD — wrap app in http server
  initSocket(server);                                  // ADD — attach socket.io

  server.listen(PORT, () => {                         // CHANGE — server.listen not app.listen
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();