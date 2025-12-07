import React from "react";

type TicTacToeBoardProps = {
    board: string;
    isDisabled?: boolean;
    onCellClick?: (cellIndex: number) => void;
};

const calaculateCellClass = (cell: string) => {
    if (cell === "0") {
        return "";
    } else if (cell === "1") {
        return "mark-x";
    }
    return "mark-o";
}

const calculateCellMark = (cell: string) => {
    if (cell === "0") {
        return "";
    } else if (cell === "1") {
        return "X";
    }
    return "O";
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ board, isDisabled = false, onCellClick }) => {
    const handleCellClick = (cellIndex: number) => {
        console.log('[BOARD] Cell clicked:', cellIndex, 'isDisabled:', isDisabled, 'cell value:', board[cellIndex]);
        
        // Don't allow click if board is disabled or cell is already occupied
        if (isDisabled || board[cellIndex] !== "0") {
            console.log('[BOARD] Click rejected - isDisabled:', isDisabled, 'occupied:', board[cellIndex] !== "0");
            return;
        }
        
        console.log('[BOARD] Calling onCellClick callback');
        if (onCellClick) {
            onCellClick(cellIndex);
        }
    };

    return (
        <div className="ttt-board" style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
            {board.split("").map((cell, idx) => (
                <button 
                    key={idx} 
                    className={`ttt-cell ${board[idx] !== "0" ? "occupied" : ""}`}
                    onClick={() => handleCellClick(idx)}
                    disabled={isDisabled || board[idx] !== "0"}
                    style={{
                        cursor: isDisabled || board[idx] !== "0" ? 'not-allowed' : 'pointer',
                        opacity: board[idx] !== "0" ? 1 : 0.8
                    }}
                >
                    {cell && (
                        <span className={calaculateCellClass(cell)}>{calculateCellMark(cell)}</span>
                    )}
                </button>
            ))}
        </div>
    );
};
