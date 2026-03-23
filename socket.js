// socket.js
const { Server } = require("socket.io");
const { redisClient } = require("./redis");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Join trip room and send initial data
        socket.on("join_trip", async ({ tripId, driverId }) => {
            socket.join(`trip:${tripId}`);

            const tripData = await redisClient.get(`trip:${tripId}`);
            if (tripData) {
                const trip = JSON.parse(tripData);
                socket.emit("trip_data", {
                    customerLocation: trip.customerLocation
                });
            }

            const location = await redisClient.get(`driver:${driverId}:location`);
            if (location) {
                socket.emit("receive_location", JSON.parse(location));
            }

            console.log(`Joined trip:${tripId}`);
        });

        // Driver location update
        socket.on("location_update", async ({ tripId, driverId, lat, lng }) => {
            const tripData = await redisClient.get(`trip:${tripId}`);
            if (!tripData) return;

            const trip = JSON.parse(tripData);
            if (trip.driverId !== driverId) return;

            console.log("Location received:", lat, lng);

            await redisClient.set(
                `driver:${driverId}:location`,
                JSON.stringify({ lat, lng, timestamp: Date.now() }),
                { EX: 3600 }
            );

            io.to(`trip:${tripId}`).emit("receive_location", { lat, lng });
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};

// Getter so trip routes can emit events (e.g. trip_stopped)
const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};

module.exports = { initSocket, getIO };