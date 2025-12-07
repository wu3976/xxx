import type { TttData } from "../types/ticTacToeTypes";

export function constructDefaultTTTData() : TttData {
    return {
        id: "",
        name: "",
        creator: null,
        player1: null,
        player2: null,
        board: "000000000",
        turn: 1,
        win: 0,
        createdAt: 0
    }
}