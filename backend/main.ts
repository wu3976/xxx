import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { createClient as createRedisClient } from "redis";
import { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT, SERVER_PORT, MONGODB_CONNECTION_STRING } from "./constants/environment.ts";
import { checkEnvVars } from "./utils.ts";
import mongoose from "mongoose";
import { createRoom, createUser, deleteUserById, getRoomById } from "./mongodb/operations.ts";
import { createTTTGameRoom, deleteTTTGameRoom, getTTTGameRoomsListInfo, joinTTTGameRoom, TTTGameDoStep } from "./midlayer/gameActions.ts";
import { roomRouter } from "./routes/roomrouter.ts";
import { authorizationMiddleware } from "./middlewares/auth.ts";
import { loggerMiddleware } from "./middlewares/utils.ts";
import { userrouter } from "./routes/userrouter.ts";

// check if env variables are correctly set
checkEnvVars();

// connect redis storage
// const redis = createRedisClient({
//     username: REDIS_USERNAME,
//     password: REDIS_PASSWORD,
//     socket: {
//         host: REDIS_HOST,
//         port: Number(REDIS_PORT)
//     }
// });
// redis.on('error', err => console.log('Redis Client Error', err));
// await redis.connect();

// connection mongodb
await mongoose.connect(MONGODB_CONNECTION_STRING as string);

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(loggerMiddleware);
app.use(authorizationMiddleware);

// add room router
app.use(roomRouter);
app.use(userrouter);

// HTTP server wrapping the Express app
const server = http.createServer(app);

// Socket.IO attached to the HTTP server
const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('chat:message', (msg) => {
        console.log('Received:', msg);
        io.emit('chat:message', msg);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

server.listen(SERVER_PORT, async () => {
    console.log(`Server running at http://localhost:${SERVER_PORT}`);
    // let user = await createUser("user1", "aaaa");
    // let user2 = await createUser("user2", "aaaa");
    // let user3 = await createUser("user3", "aaaa");
    // let room = await createTTTGameRoom("room1", user.id);
    // let room2 = await createTTTGameRoom("room2", user2.id);
    // let room3 = await createTTTGameRoom("room3", user3.id);
});