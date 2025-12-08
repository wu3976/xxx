import { createUser, getAllUsers, getUserById, getUserByUsername } from "../mongodb/operations.ts";
import { constructMidLayerError } from "../utils.ts";

export async function getUserInfo(userId: string) {
    const user = await getUserById(userId);
    if (!user) {
        return constructMidLayerError("user_not_exist", `the user ${userId} does not exist`);
    }
    return {
        ...(user.toJSON()),
        password: undefined
    };
}

export async function getUserInfoByUsername(username: string) {
    const user = await getUserByUsername(username);
    if (!user) {
        return constructMidLayerError("user_not_exist", 
            `the user with username ${username} does not exist`);
    }
    return {
        ...(user.toJSON()),
        password: undefined
    };
}

export async function createTTTUser(username: String, password: String, email?: String, phone?: String) {
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
        return constructMidLayerError("user_already_exist",
            `the user with username ${username} already exist`);
    }
    const user = await createUser(username, password, email, phone, 0, 0, 0);
    return {
        ...(user.toJSON()),
        password: undefined
    };
}

export async function getAllTTTUsers() {
    const users = await getAllUsers();
    return users.map(user => ({
        ...(user.toJSON()),
        password: undefined
    }));
}