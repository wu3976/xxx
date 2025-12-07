import { type UserId } from "./usertypes";

export type RoomId = string;

export type RoomData = {
    creater: UserId,
    player1: UserId | null,
    player2: UserId | null,
    board: string, // length of 9, empty board is "000000000", '1' or '2' means which player step the cell
    win: 0 | 1 | 2 // if no win yet, 0, if 1 win, 1, if 2 win, 2
}