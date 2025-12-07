import type { UserInfo } from "./userTypes";

export type TttData = {
    id: string,
    name: string,
    creator: UserInfo | null, // store creator info
    player1: UserInfo | null, // store player1 info
    player2: UserInfo | null, // store player2 info
    board: string,
    turn: number,
    win: number,
    createdAt: number,
};