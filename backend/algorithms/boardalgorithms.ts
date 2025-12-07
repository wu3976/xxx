export function boardWinCondition(board: string): "player1" | "player2" | "nowin" | "full" {
    const lines = [
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    for (const line of lines) {
        const [i0, i1, i2] = line;
        if (board[i0] === board[i1] && board[i1] === board[i2] && board[i0]) {
            if (board[i0] === "1") {
                return "player1";
            } else if (board[i0] === "2") {
                return "player2";
            }
        }
    }
    let full = true;
    for (const ele of board) {
        if (ele === "0") {
            full = false;
            break;
        }
    }
    if (full) {
        return "full";
    }
    return "nowin";
}