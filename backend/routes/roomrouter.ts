import express from "express";
import { constructRouterJsonResp } from "../utils.ts";
import { getTTTGameRoom, getTTTGameRoomsListInfo, joinTTTGameRoom, createTTTGameRoom, deleteTTTGameRoom, resetTTTGameRoom } from "../midlayer/gameActions.ts";

export const roomRouter = express.Router();

roomRouter.get("/rooms", async (req, resp) => {
    const { skip, limit, oldestFirst } = req.query;
    if (!skip) {
        resp.status(400).json(constructRouterJsonResp("error", "query parameter \"skip\" is required."));
        return;
    }
    if (!limit) {
        resp.status(400).json(constructRouterJsonResp("error", "query parameter \"limit\" is required."));
        return;
    }
    const skipnum = Number(skip), limitnum = Number(limit);
    if (Number.isNaN(skipnum)) {
        resp.status(400).json(constructRouterJsonResp("error", "bad query parameter \"skip\"."));
        return;
    }
    if (Number.isNaN(limitnum)) {
        resp.status(400).json(constructRouterJsonResp("error", "bad query parameter \"limit\"."));
        return;
    }
    if (skipnum < 0) {
        resp.status(400).json(constructRouterJsonResp("error", "query parameter \"skip\" must be >=0"));
        return;
    }
    if (limitnum < -1) {
        resp.status(400).json(constructRouterJsonResp(
            "error", "query parameter \"limit\" must be >=0 or be -1"));
        return;
    }
    const oldestFirstBool = Boolean(oldestFirst);
    const result = await getTTTGameRoomsListInfo(skipnum, limitnum, oldestFirstBool);
    resp.json(constructRouterJsonResp("data", result));
});

roomRouter.get("/room/:id", async (req, resp) => {
    const roomId = req.params.id;
    // @ts-ignore
    const userId = req?.userId;
    if (!userId) {
        resp.status(403).json(constructRouterJsonResp("error", "unauthorized"));
        return;
    }
    const result = await getTTTGameRoom(roomId, userId);
    if (result?.errorType) {
        resp.status(400).json(constructRouterJsonResp("error", result));
        return;
    }
    resp.json(constructRouterJsonResp("data", result));
})

roomRouter.post("/joinroom/:id", async (req, resp) => {
    const roomId = req.params.id;
    const { slot } = req.body;
    // @ts-ignore
    const userId = req?.userId;
    if (!userId) {
        resp.status(403).json(constructRouterJsonResp("error", "unauthorized"));
        return;
    }
    if (!slot) {
        resp.status(400).json(constructRouterJsonResp("error", "slot must be provided"));
        return;
    }
    if (slot !== "player1" && slot !== "player2") {
        resp.status(400).json(constructRouterJsonResp("error", "slot is invalid"));
        return;
    }
    const result = await joinTTTGameRoom(roomId, userId, slot);
    if (result?.errorType) {
        resp.status(400).json(constructRouterJsonResp("error", result));
        return;
    }
    resp.json(result);
});

roomRouter.post("/createroom", async (req, resp) => {
    const { name } = req.body;
    // @ts-ignore
    const userId = req?.userId;
    if (!userId) {
        resp.status(403).json(constructRouterJsonResp("error", "unauthorized"));
        return;
    }
    if (!name) {
        resp.status(400).json(constructRouterJsonResp("error", "room name must be provided"));
        return;
    }
    if (typeof name !== "string" || name.trim().length === 0) {
        resp.status(400).json(constructRouterJsonResp("error", "room name must be a non-empty string"));
        return;
    }
    const result = await createTTTGameRoom(name.trim(), userId);
    if (result?.errorType) {
        const errorMessages: { [key: string]: string } = {
            "has_active_room": "You already have an active room. Please delete it before creating a new one.",
            "default": result.info || "Failed to create room"
        };
        const message = errorMessages[result.errorType] || errorMessages["default"];
        resp.status(400).json(constructRouterJsonResp("error", message));
        return;
    }
    resp.json(constructRouterJsonResp("data", result));
});

roomRouter.post("/deleteroom/:id", async (req, resp) => {
    const roomId = req.params.id;
    // @ts-ignore
    const userId = req?.userId;
    if (!userId) {
        resp.status(403).json(constructRouterJsonResp("error", "unauthorized"));
        return;
    }
    const result = await deleteTTTGameRoom(roomId, userId);
    if (result?.errorType) {
        const errorMessages: { [key: string]: string } = {
            "room_not_exist": "Room does not exist",
            "not_creator": "Only the room creator can delete the room",
            "default": result.info || "Failed to delete room"
        };
        const message = errorMessages[result.errorType] || errorMessages["default"];
        resp.status(400).json(constructRouterJsonResp("error", message));
        return;
    }
    resp.json(constructRouterJsonResp("data", result));
});

roomRouter.post("/replayroom/:id", async (req, resp) => {
    const roomId = req.params.id;
    // @ts-ignore
    const userId = req?.userId;
    if (!userId) {
        resp.status(403).json(constructRouterJsonResp("error", "unauthorized"));
        return;
    }
    const result = await resetTTTGameRoom(roomId, userId);
    if (result?.errorType) {
        const errorMessages: { [key: string]: string } = {
            "room_not_exist": "Room does not exist",
            "not_creator": "Only the room creator can reset the game",
            "default": result.info || "Failed to reset game"
        };
        const message = errorMessages[result.errorType] || errorMessages["default"];
        resp.status(400).json(constructRouterJsonResp("error", message));
        return;
    }
    resp.json(constructRouterJsonResp("data", result));
});
