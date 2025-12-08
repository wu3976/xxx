import { Socket, Server as SocketIOServer } from "socket.io";
import { joinTTTGameRoom, deleteTTTGameRoom, getTTTGameRoom, TTTGameDoStep } from "../midlayer/gameActions.ts";
import { getRoomById, modifyRoomById } from "../mongodb/operations.ts";
import { constructMidLayerError } from "../utils.ts";

/**
 * Handles Socket.IO events for room-related operations
 * @param socket The Socket.IO socket instance
 * @param io The Socket.IO server instance
 */
export function setupRoomHandlers(socket: Socket, io: SocketIOServer) {
    /**
     * Event: User joins a room
     * Payload: { roomId: string, userId: string, playerSlot: "player1" | "player2" }
     * Response: "room:join:success" or "room:join:error"
     */
    socket.on("room:join", async (data, callback) => {
        try {
            const { roomId, userId, playerSlot } = data;

            // Validate input
            if (!roomId || !userId || !playerSlot) {
                const error = constructMidLayerError(
                    "invalid_input",
                    "roomId, userId, and playerSlot are required"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            if (playerSlot !== "player1" && playerSlot !== "player2") {
                const error = constructMidLayerError(
                    "invalid_slot",
                    "playerSlot must be 'player1' or 'player2'"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            // Attempt to join the room
            const updatedRoom = await joinTTTGameRoom(roomId, userId, playerSlot);

            // Check if join was successful
            if (updatedRoom.error) {
                if (callback) callback({ success: false, error: updatedRoom });
                return;
            }

            // Join socket to a room namespace for broadcasting
            socket.join(`room:${roomId}`);
            socket.data.roomId = roomId;
            socket.data.userId = userId;
            socket.data.playerSlot = playerSlot;

            // Notify all clients in this room about the join
            io.to(`room:${roomId}`).emit("room:player:joined", {
                success: true,
                data: {
                    roomId,
                    userId,
                    playerSlot,
                    room: updatedRoom,
                },
            });

            if (callback) {
                callback({
                    success: true,
                    data: {
                        roomId,
                        userId,
                        playerSlot,
                        room: updatedRoom,
                    },
                });
            }
        } catch (err) {
            console.error("[ERROR] room:join handler error:", err);
            if (callback) {
                callback({
                    success: false,
                    error: constructMidLayerError(
                        "server_error",
                        `Failed to join room: ${err}`
                    ),
                });
            }
        }
    });

    /**
     * Event: User leaves a room
     * Payload: { roomId: string, userId: string }
     * Response: "room:leave:success" or "room:leave:error"
     */
    socket.on("room:leave", async (data, callback) => {
        try {
            const { roomId, userId } = data;

            if (!roomId || !userId) {
                const error = constructMidLayerError(
                    "invalid_input",
                    "roomId and userId are required"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            // Get current room state
            const room = await getRoomById(roomId);
            if (!room) {
                const error = constructMidLayerError(
                    "room_not_exist",
                    `Room ${roomId} does not exist`
                );
                if (callback) callback({ success: false, error });
                return;
            }

            // Determine which slot the user occupied
            let playerSlot = null;
            if (String(room.player1) === userId) {
                playerSlot = "player1";
            } else if (String(room.player2) === userId) {
                playerSlot = "player2";
            }

            if (!playerSlot) {
                const error = constructMidLayerError(
                    "not_in_room",
                    `User ${userId} is not in room ${roomId}`
                );
                if (callback) callback({ success: false, error });
                return;
            }

            // Remove player from the room
            const updateQuery =
                playerSlot === "player1"
                    ? { player1: null }
                    : { player2: null };

            const updatedRoom = await modifyRoomById(roomId, updateQuery);

            // Notify all clients in this room (BEFORE leaving socket room)
            io.to(`room:${roomId}`).emit("room:player:left", {
                success: true,
                data: {
                    roomId,
                    userId,
                    playerSlot,
                    room: updatedRoom,
                },
            });

            // Leave socket room AFTER broadcasting so the departing client receives the message
            socket.leave(`room:${roomId}`);
            socket.data.roomId = null;
            socket.data.userId = null;
            socket.data.playerSlot = null;

            if (callback) {
                callback({
                    success: true,
                    data: {
                        roomId,
                        userId,
                        playerSlot,
                        room: updatedRoom,
                    },
                });
            }
        } catch (err) {
            console.error("[ERROR] room:leave handler error:", err);
            if (callback) {
                callback({
                    success: false,
                    error: constructMidLayerError(
                        "server_error",
                        `Failed to leave room: ${err}`
                    ),
                });
            }
        }
    });

    /**
     * Event: Get current room state
     * Payload: { roomId: string }
     * Response: room data or error
     */
    socket.on("room:state", async (data, callback) => {
        try {
            const { roomId } = data;

            if (!roomId) {
                const error = constructMidLayerError(
                    "invalid_input",
                    "roomId is required"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            const room = await getRoomById(roomId);
            if (!room) {
                const error = constructMidLayerError(
                    "room_not_exist",
                    `Room ${roomId} does not exist`
                );
                if (callback) callback({ success: false, error });
                return;
            }

            if (callback) {
                callback({
                    success: true,
                    data: room,
                });
            }
        } catch (err) {
            console.error("[ERROR] room:state handler error:", err);
            if (callback) {
                callback({
                    success: false,
                    error: constructMidLayerError(
                        "server_error",
                        `Failed to fetch room state: ${err}`
                    ),
                });
            }
        }
    });

    /**
     * Event: Listen for room updates (subscription)
     * Payload: { roomId: string }
     */
    socket.on("room:subscribe", (data) => {
        try {
            const { roomId } = data;

            if (!roomId) {
                socket.emit("room:subscribe:error", {
                    error: constructMidLayerError(
                        "invalid_input",
                        "roomId is required"
                    ),
                });
                return;
            }

            // Already joined to room:${roomId} when joining, but this ensures subscription
            socket.join(`room:${roomId}`);
            socket.emit("room:subscribe:success", {
                roomId,
                message: `Subscribed to room ${roomId}`,
            });
        } catch (err) {
            console.error("[ERROR] room:subscribe handler error:", err);
            socket.emit("room:subscribe:error", {
                error: constructMidLayerError(
                    "server_error",
                    `Failed to subscribe to room: ${err}`
                ),
            });
        }
    });

    /**
     * Event: Unsubscribe from room updates
     * Payload: { roomId: string }
     */
    socket.on("room:unsubscribe", (data) => {
        try {
            const { roomId } = data;

            if (!roomId) {
                socket.emit("room:unsubscribe:error", {
                    error: constructMidLayerError(
                        "invalid_input",
                        "roomId is required"
                    ),
                });
                return;
            }

            socket.leave(`room:${roomId}`);
            socket.emit("room:unsubscribe:success", {
                roomId,
                message: `Unsubscribed from room ${roomId}`,
            });
        } catch (err) {
            console.error("[ERROR] room:unsubscribe handler error:", err);
            socket.emit("room:unsubscribe:error", {
                error: constructMidLayerError(
                    "server_error",
                    `Failed to unsubscribe from room: ${err}`
                ),
            });
        }
    });

    /**
     * Event: Player makes a move
     * Payload: { roomId: string, userId: string, cellIndex: number }
     * Response: success or error with updated room state
     */
    socket.on("room:move", async (data, callback) => {
        try {
            const { roomId, userId, cellIndex } = data;

            // Validate input
            if (!roomId || !userId || cellIndex === undefined || cellIndex === null) {
                const error = constructMidLayerError(
                    "invalid_input",
                    "roomId, userId, and cellIndex are required"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
                const error = constructMidLayerError(
                    "invalid_cell",
                    "cellIndex must be an integer between 0 and 8"
                );
                if (callback) callback({ success: false, error });
                return;
            }

            // Execute the move
            const updatedRoom = await TTTGameDoStep(roomId, userId, cellIndex);

            // Check if move was successful
            if (updatedRoom.error) {
                if (callback) callback({ success: false, error: updatedRoom });
                return;
            }

            // Notify all clients in this room about the move
            io.to(`room:${roomId}`).emit("room:move:updated", {
                success: true,
                data: {
                    roomId,
                    userId,
                    cellIndex,
                    room: updatedRoom,
                },
            });

            if (callback) {
                callback({
                    success: true,
                    data: {
                        roomId,
                        userId,
                        cellIndex,
                        room: updatedRoom,
                    },
                });
            }
        } catch (err) {
            console.error("[ERROR] room:move handler error:", err);
            if (callback) {
                callback({
                    success: false,
                    error: constructMidLayerError(
                        "server_error",
                        `Failed to make move: ${err}`
                    ),
                });
            }
        }
    });

    /**
     * Event: Send a chat message to the room
     * Payload: { roomId: string, userId: string, username: string, text: string }
     */
    socket.on("room:chat:send", async (data) => {
        try {
            const { roomId, userId, username, text } = data;

            // Validate input
            if (!roomId || !userId || !username || !text) {
                console.warn("[WARN] room:chat:send - missing required fields");
                return;
            }

            if (text.trim().length === 0) {
                console.warn("[WARN] room:chat:send - empty message");
                return;
            }

            // Generate timestamp
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const time = `${hours}:${minutes}`;

            // Broadcast message to all clients in the room
            io.to(`room:${roomId}`).emit("room:chat:message", {
                success: true,
                data: {
                    userId,
                    username,
                    text,
                    time,
                    timestamp: now.getTime(),
                },
            });

            console.log(`[INFO] Chat message in room ${roomId} from ${username}: ${text}`);
        } catch (err) {
            console.error("[ERROR] room:chat:send handler error:", err);
        }
    });

    /**
     * Event: Handle disconnection cleanup
     */
    socket.on("disconnect", async () => {
        try {
            const { roomId, userId, playerSlot } = socket.data;

            // If user was in a room, remove them on disconnect
            if (roomId && userId && playerSlot) {
                const room = await getRoomById(roomId);
                if (room) {
                    const updateQuery =
                        playerSlot === "player1"
                            ? { player1: null }
                            : { player2: null };

                    const updatedRoom = await modifyRoomById(
                        roomId,
                        updateQuery
                    );

                    // Notify remaining clients
                    io.to(`room:${roomId}`).emit("room:player:disconnected", {
                        userId,
                        playerSlot,
                        room: updatedRoom,
                    });
                }
            }

            console.log(
                `[INFO] Client ${socket.id} disconnected from room ${roomId}`
            );
        } catch (err) {
            console.error("[ERROR] disconnect handler error:", err);
        }
    });
}
