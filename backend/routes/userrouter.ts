import express from "express";
import { createTTTUser, getUserInfo, getUserInfoByUsername } from "../midlayer/userActions.ts";
import { constructRouterJsonResp } from "../utils.ts";

export const userrouter = express.Router();

userrouter.get("/user/:id", async (req, resp) => {
    const { id } = req.params;
    const userInfo = await getUserInfo(id);
    if (userInfo.errorType) {
        resp.status(400).json(constructRouterJsonResp("error", userInfo?.info));
        return;
    }
    resp.json(constructRouterJsonResp("data", userInfo));
})

userrouter.get("/user/byusername/:username", async (req, resp) => {
    const { username } = req.params;
    const userInfo = await getUserInfoByUsername(username);
    if (userInfo.errorType) {
        resp.status(400).json(constructRouterJsonResp("error", userInfo?.info));
        return;
    }
    resp.json(constructRouterJsonResp("data", userInfo));
})

userrouter.post("/user", async (req, resp) => {
    const { username, password, email, phone } = req.body;
    if (!username) {
        resp.status(400).json(constructRouterJsonResp("error", "username must be provided"));
        return;
    }
    if (!password) {
        resp.status(400).json(constructRouterJsonResp("error", "password must be provided"));
        return;
    }
    const userInfo = await createTTTUser(username, password, email, phone);
    if (userInfo.errorType) {
        resp.status(400).json(constructRouterJsonResp("error", userInfo?.info));
        return;
    }
    resp.json(constructRouterJsonResp("data", userInfo));
})