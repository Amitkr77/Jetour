const cron = require("node-cron");
const { generateSlots } = require("../modules/vanSlot/slotGenerator.service");

exports.startSlotCron = () => {
  cron.schedule("5 0 * * *", async () => {
    console.log("Running daily slot generation...");
    await generateSlots();
  });
};