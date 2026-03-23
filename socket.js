// socket.js
const { Server } = require("socket.io");
// const { redisClient } = require("./redis");
const Trip = require('./modules/trip/trip.model')

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

                const trip = await Trip.findOne({ tripId });

                if (!trip) {
                    return socket.emit("error", { message: "Trip not found" });
                }

                // Send trip data to client
                socket.emit("trip_data", {
                    customerLocation: trip.customerLocation
                });

                // Send last known driver location if exists
                if (trip.driverLocation) {
                    socket.emit("receive_location", trip.driverLocation);
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
                // Rate limit — only allow update every 2 seconds per driver
                // const now = Date.now();
                // const last = lastUpdateTime.get(driverId) || 0;
                // if (now - last < 2000) return;
                // lastUpdateTime.set(driverId, now);

                const trip = await Trip.findOne({ tripId });

                if (!trip) return;
                if (trip.driverId !== driverId) return;
                if (trip.status === "completed") return;

                // Update latest location + push to history (keep last 500)
                await Trip.findOneAndUpdate(
                    { tripId },
                    {
                        driverLocation: { lat, lng, updatedAt: new Date() },
                        $push: {
                            locationHistory: {
                                $each: [{ lat, lng, timestamp: new Date() }],
                                $slice: -500
                            }
                        }
                    }
                );

                io.to(`trip:${tripId}`).emit("receive_location", { lat, lng });

            } catch (err) {
                console.error("location_update error:", err);
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