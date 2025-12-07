import { randomUUID } from "crypto";
import type { RoomId, RoomData } from "../types/roomtypes";
import type { UserId } from "../types/usertypes"
import { EMPTY_BOARD } from "../constants/playconstants.ts";
import { boardWinCondition } from "../algorithms/boardalgorithms.ts";

/**
 * 
 * @param redis redis client
 * @param creater user id of the creator of this room
 * @returns room id of newly created room, or null if creation fails
 */
export async function createRoom(redis: any, creater: UserId): Promise<RoomId | null> {
    let roomId: RoomId = randomUUID();    
    // regenerate room id if collides    
    
    while (await redis.get(roomId)) {
        roomId = randomUUID();
    }    
    const room: RoomData = {
        creater,
        player1: null,
        player2: null,
        board: EMPTY_BOARD,
        win: 0
    };
    try {
        const result = await redis.set(`room:${roomId}`, JSON.stringify(room));
        console.log(`[INFO] room ${roomId} successfully created.`);
        return roomId;
    } catch(err) {
        console.error(`[ERROR] room creation failed: ${err}`);
        return null;
    }
}

/**
 * 
 * @param redis redis client
 * @param joiner id of the player joining the room
 * @param roomId room id of the room being joined
 * @param playerProp "player1" or "player2", stating whether join player1 or player2
 * @returns whether operation successful or not. 
 */
export async function joinRoom(redis: any, joiner: UserId, roomId: RoomId, playerProp: "player1" | "player2"): Promise<boolean> {
    try {
        if (playerProp !== "player1" && playerProp !== "player2"){
            console.log(`[ERROR] joinRoom(): playerProp ${playerProp} is not valid`);
            return false;
        }

        const room: RoomData | null = await getRoom(redis, roomId);
        if (room === null) {
            console.log(`[ERROR] joinRoom(): room ${roomId} does not exist`);
            return false;
        }
        // check if the slot is already filled
        if (room[playerProp]) {
            console.log(`[ERROR] joinRoom(): ${playerProp} has already been occupied by ${room[playerProp]}`);
            return false;
        }        
        room[playerProp] = joiner;
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        return true
    } catch(err) {
        console.log(`[ERROR] joinRoom(): fail to join room ${roomId}, ${err}`);
        return false;
    }
}

/**
 * 
 * @param redis redis client
 * @param roomId the room id to be get
 * @returns room data, or null if not exist / get error
 */
export async function getRoom(redis: any, roomId: RoomId): Promise<RoomData | null> {
    try {
        let roomstr: string | null = await redis.get(`room:${roomId}`);
        if (!roomstr) {
            console.log(`[INFO] getRoom(): room ${roomId} does not exist`);
        }
        return JSON.parse(roomstr as string);
    } catch(err) {
        console.log(`[ERROR] getRoom(): fail to get room ${roomId}: ${err}`);
        return null;
    }
    
}

/**
 * 
 * @param redis redis client 
 * @param roomId the room id of the room to be deleted
 * @returns whether delete actually happens or not
 */
export async function deleteRoom(redis: any, roomId: RoomId): Promise<boolean>{
    try {
        let result = await redis.del(`room:${roomId}`);
        if (!result) {
            console.log(`[INFO] deleteRoom(): room ${roomId} does not exist`);
            return false;
        }
        return true;
    } catch(err) {
        console.log(`[ERROR] deleteRoom(): fail to delete room ${roomId}: ${err}`);
        return false;
    }   
}

/**
 * take a step for one side.
 * @param redis redis client
 * @param roomId room id
 * @param playerProp "player1" or "player2", stating whether step for player1 or player2
 * @param i cell index to step
 * @returns whether operation is successful or not. 
 */
export async function step(redis: any, roomId: RoomId, playerProp: "player1" | "player2", i: number): Promise<boolean> {
    try {
        const room: RoomData | null = await getRoom(redis, roomId);
        if (!room) {
            console.log(`[ERROR] step(): room ${roomId} does not exist`);
            return false;
        }
        if (i < 0 || i >= room.board.length) {
            console.log(`[ERROR] step(): index ${i} out of range`);
            return false;
        }
        if (room.board[i] !== '0') {
            console.log(`[ERROR] step(): room ${roomId} is already stepped at index ${i}`);
            return false;
        }

        const boardarr = room.board.split("");
        boardarr[i] = playerProp === "player1" ? "1" : "2";
        room.board = boardarr.join("");
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        return true;
    } catch (err) {
        console.log(`[ERROR] step(): fail to take step for room ${roomId}: ${err}`);
        return false;
    }
}

/**
 * 
 * @param redis redis client
 * @param roomId room id to evaluate win
 * @returns "player1": player1 wins
 *          "player2": player2 wins
 *          "nowin": no one wins yet, and the board is not full
 *          "full": the board is full but no one wins
 *          null: fail to do evaluation
 */
export async function evalWin(redis: any, roomId: RoomId) : Promise<"player1" | "player2" | "nowin" | "full" | null> {
    try {
        const room: RoomData | null = await getRoom(redis, roomId);
        if (!room) {
            console.log(`[ERROR] evalWin(): room ${roomId} does not exist`);
            return null;
        }
        return boardWinCondition(room.board);
    } catch(err) {
        return null;
    }
}