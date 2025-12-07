import { EMPTY_BOARD } from "../constants/playconstants.ts";
import { Room, User } from "./model.ts";

export async function createUser(username: String, password: String, email?: String, phone?: String, 
    wincount: number=0, losscount: number=0, drawcount: number=0) : Promise<any> {
    let user = new User({
        username,
        password,
        email,
        phone,
        wincount,
        losscount,
        drawcount
    });
    return await user.save();
}

export async function getUserByUsername(username: String): Promise<any> {
    return await User.findOne({ username });
}

export async function getUserById(id: String): Promise<any> {
    return await User.findById(id);
}

export async function getAllUsers() {
    return await User.find({});
}

export async function modifyUserByUsername(username: String, updateQuery: any) {
    return await User.findOneAndUpdate({ username }, updateQuery);
}

export async function modifyUserById(id: String, updateQuery: any) {
    return await User.findByIdAndUpdate(id, updateQuery);
}

export async function deleteUserById(id: String) {
    return await User.findByIdAndDelete(id);
}

export async function deleteUserByUsername(username: String) {
    return await User.findOneAndDelete({ username });    
}

export async function createRoom(
    name: String, createrId: String
) {
    let room = new Room({
        name,
        creater: createrId,
        player1: null,
        player2: null,
        board: EMPTY_BOARD,
        turn: 1,
        win: 0,
        createdAt: Date.now()
    });
    return await room.save();
}

export async function getRoomById(id: String) {
    return await Room.findById(id);
}

export async function getRoomByCreater(createrId: String) {
    return await Room.findOne({ creater: createrId });
}

export async function getRoomByPlayer1(player1Id: String) {
    return await Room.findOne({ player1: player1Id });
}

export async function getRoomByPlayer2(player2Id: String) {
    return await Room.findOne({ player2: player2Id });
}

export async function getRoomsRangedChrono(skip: number, limit: number, oldestFirst: boolean) {
    return await Room.find({})
    .sort({ createdAt: oldestFirst ? 1 : -1 })
    .skip(skip)
    .limit(limit);
}

export async function getRoomsRangedChronoPopulated(skip: number, limit: number, oldestFirst: boolean) {
    return await Room.find({})
    .sort({ createdAt: oldestFirst ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .populate("creater")
    .populate("player1")
    .populate("player2");
}

export async function modifyRoomById(id: String, updateQuery: any) {
    return await Room.findByIdAndUpdate(id, updateQuery);
}

export async function deleteRoomById(id: String) {
    return await Room.findByIdAndDelete(id);
}

