import React from "react";

type TicTacToeBoardProps = {
    board: string;
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

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ board }) => {
    return (
        <div className="ttt-board">
            {board.split("").map((cell, idx) => (
                <button key={idx} className="ttt-cell">
                    {cell && (
                        <span className={calaculateCellClass(cell)}>{calculateCellMark(cell)}</span>
                    )}
                </button>
            ))}
        </div>
    );
};
