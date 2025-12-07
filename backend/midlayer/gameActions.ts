import mongoose from "mongoose";
import { createRoom, deleteRoomById, getRoomByCreater, getRoomById, getRoomByPlayer1, getRoomByPlayer2, getRoomsRangedChrono, getRoomsRangedChronoPopulated, getUserById } from "../mongodb/operations.ts";
import { boardWinCondition } from "../algorithms/boardalgorithms.ts";
import { WIN_STR_TO_NUM } from "../constants/playconstants.ts";
import { constructMidLayerError } from "../utils.ts";

export async function createTTTGameRoom(name: string, createrId: string): Promise<any> {
    const existingRoom = await getRoomByCreater(createrId);
    if (existingRoom) {
        return constructMidLayerError("has_active_room", `the user ${createrId} has an active room`);
    }
    const room = await createRoom(name, createrId);
    return room;
}

export async function getTTTGameRoomsListInfo(skip: number, limit: number, oldestFirst: boolean) {
    if (limit === -1) {
        limit = Number.MAX_SAFE_INTEGER;
    }
    const rooms = await getRoomsRangedChronoPopulated(skip, limit, oldestFirst);
    return rooms.map(ele => {
        return {
            id: ele.id,
            name: ele.name,
            // @ts-ignore
            creater: ele.creater.username,
            // @ts-ignore
            player1: ele.player1?.username ?? null,
            // @ts-ignore
            player2: ele.player2?.username ?? null,
        }
    })
}

export async function getTTTGameRoom(roomId: string, userId: string): Promise<any> {
    const room = await getRoomById(roomId);
    if (!room) {
        return constructMidLayerError("room_not_exist", `the room ${roomId} does not exist`);
    }
    return room;
}

export async function deleteTTTGameRoom(roomId: string): Promise<any> {
    const deletedRoom = await deleteRoomById(roomId);
    if (!deletedRoom) {
        return constructMidLayerError("room_not_exist", `the room ${roomId} does not exist`);
    }
    return deletedRoom;
}

export async function joinTTTGameRoom(roomId: string, userId: string, slot: "player1" | "player2"): Promise<any>  {
    // utilize async io to increase concurrency
    const [room, inRoomP1, inRoomP2] = await Promise.all(
        [getRoomById(roomId), getRoomByPlayer1(userId), getRoomByPlayer2(userId)]
    );

    if (!room) {
        return constructMidLayerError("room_not_exist", `the room ${roomId} does not exist`);
    }
    if (inRoomP1 || inRoomP2) {
        return constructMidLayerError("in_a_room", `user ${userId} is already in a room`);
    }
    if (room[slot]) {
        return constructMidLayerError("slot_occupied", `slot ${slot} of room ${roomId} had been occupied`);
    }

    room[slot] = new mongoose.Types.ObjectId(userId);
    return await room.save();
}


export async function TTTGameDoStep(roomId: string, userId: string, i: number) : Promise<any>{
    const [room, user] = await Promise.all([getRoomById(roomId), getUserById(userId)]);
    if (!room) {
        return constructMidLayerError("room_not_exist", `the room ${roomId} does not exist`);
    }
    if (!user) {
        return constructMidLayerError("user_not_exist", `the user ${userId} does not exist`);
    }
    if (room.win !== 0) {
        return constructMidLayerError("already_has_result", 
            `the room ${roomId} win cond is already determined`);
    }
    let stepChar = "";
    if (String(room.player1) === userId) {
        if (room.turn !== 1) {
            return constructMidLayerError("wrong_turn", `turn is 2 but player ${userId} is in slot 1`);
        }
        stepChar = '1';
    } else if (String(room.player2) === userId) {
        if (room.turn !== 2) {
            return constructMidLayerError("wrong_turn", `turn is 1 but player ${userId} is in slot 2`);
        }
        stepChar = '2';
    } else {
        return constructMidLayerError("not_in_room", `the user ${userId} is not in room ${roomId}`);
    }
    if (room.board[i] !== '0') {
        return constructMidLayerError("already_stepped", `the index ${i} is already being stepped`);
    }
    const boardArr = room.board.split("");
    boardArr[i] = stepChar;
    room.board = boardArr.join("");
    const winCond = boardWinCondition(room.board);
    room.win = WIN_STR_TO_NUM[winCond];
    room.turn = room.turn === 1 ? 2 : 1;
    return await room.save();
}