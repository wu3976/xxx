/**
 * Game logic utilities for Tic Tac Toe
 */

/**
 * Check if there's a winner on the board
 * Board is a string of 9 characters where:
 * - "0" = empty
 * - "1" = X (player 1)
 * - "2" = O (player 2)
 * 
 * Returns: 0 (no winner), 1 (X wins), 2 (O wins), 3 (draw)
 */
export function checkGameStatus(board: string): number {
    // Convert board string to array for easier access
    const cells = board.split("");

    // All possible winning combinations
    const winningCombos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    // Check for winner
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (cells[a] !== "0" && cells[a] === cells[b] && cells[b] === cells[c]) {
            return cells[a] === "1" ? 1 : 2; // Return 1 for X, 2 for O
        }
    }

    // Check if board is full (draw)
    if (cells.every((cell) => cell !== "0")) {
        return 3; // Draw
    }

    return 0; // No winner yet
}

/**
 * Check if a specific cell is occupied
 */
export function isCellOccupied(board: string, cellIndex: number): boolean {
    return board[cellIndex] !== "0";
}

/**
 * Check if the game is over (winner or draw)
 */
export function isGameOver(board: string): boolean {
    const status = checkGameStatus(board);
    return status !== 0; // 0 means game is still ongoing
}

/**
 * Get the game status message for display
 * - "player1_wins": Player 1 wins
 * - "player2_wins": Player 2 wins
 * - "draw": Draw
 * - "ongoing": Game is still ongoing
 */
export function getGameStatusMessage(
    board: string,
    player1Name?: string,
    player2Name?: string
): string {
    const status = checkGameStatus(board);

    switch (status) {
        case 1:
            return player1Name ? `${player1Name} wins` : "X wins";
        case 2:
            return player2Name ? `${player2Name} wins` : "O wins";
        case 3:
            return "draw";
        default:
            return "ongoing";
    }
}

/**
 * Check if the board should be disabled for a player
 */
export function shouldBoardBeDisabled(
    board: string,
    currentPlayerSlot: "player1" | "player2" | null,
    currentTurn: number
): boolean {
    // If no player is joined, disable board
    if (!currentPlayerSlot) {
        return true;
    }

    // If game is over, disable board
    if (isGameOver(board)) {
        return true;
    }

    // If it's not the current player's turn, disable board
    const playerTurnNumber = currentPlayerSlot === "player1" ? 1 : 2;
    if (currentTurn !== playerTurnNumber) {
        return true;
    }

    return false;
}
