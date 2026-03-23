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
            try {
                socket.join(`trip:${tripId}`);

                const tripData = await redisClient.get(`trip:${tripId}`);
                if (tripData) {
                    const trip = JSON.parse(tripData);
                    socket.emit("trip_data", {
                        customerLocation: trip.customerLocation
                    });
                } else {
                    socket.emit("error", { message: "Trip not found" });
                }

                const location = await redisClient.get(`driver:${driverId}:location`);
                if (location) {
                    socket.emit("receive_location", JSON.parse(location));
                }

                console.log(`Joined trip:${tripId}`);

            } catch (err) {
                console.error("join_trip error:", err);
                socket.emit("error", { message: "Failed to join trip" });
            }
        });

        // Driver location update
        socket.on("location_update", async ({ tripId, driverId, lat, lng }) => {
            try {
                const tripData = await redisClient.get(`trip:${tripId}`);
                if (!tripData) return;

                const trip = JSON.parse(tripData);
                if (trip.driverId !== driverId) return;

                console.log("Location received:", lat, lng);

                const locationEntry = { lat, lng, timestamp: Date.now() };

                // Store latest location
                await redisClient.set(
                    `driver:${driverId}:location`,
                    JSON.stringify(locationEntry),
                    { EX: 3600 }
                );

                // Append to history list (keep last 500 points)
                await redisClient.lPush(
                    `trip:${tripId}:history`,
                    JSON.stringify(locationEntry)
                );
                await redisClient.lTrim(`trip:${tripId}:history`, 0, 499);

                io.to(`trip:${tripId}`).emit("receive_location", { lat, lng });
            } catch (err) {
                console.error("update location error:", err);
                socket.emit("error", { message: "Failed to update driver's location" });
            }
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