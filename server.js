require('dotenv').config();

const http = require("http");                          // ADD
const app = require('./app');
const connectDB = require('./config/mongodb');
const { startSlotCron } = require("./jobs/slotCron.job");
const { generateSlots } = require("./modules/vanSlot/slotGenerator.service");
// const { connectRedis } = require("./redis");           
const { initSocket } = require("./socket");            

// generateSlots();
startSlotCron();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  // await connectRedis();                                

  const server = http.createServer(app);              
  initSocket(server);                                  

  server.listen(PORT, () => {                         
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();