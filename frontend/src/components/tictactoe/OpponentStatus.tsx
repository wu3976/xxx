import React from "react";

type OpponentStatusProps = {
    isOnline: boolean;
    name: string;
};

export const OpponentStatus: React.FC<OpponentStatusProps> = ({
    isOnline,
    name,
}) => {
    return (
        <div className="ttt-connection">
            <div className="ttt-connection-header">Opponent Status</div>
            <div className="ttt-connection-body">
                <span
                    className={
                        "status-pill " +
                        (isOnline ? "status-pill--online" : "status-pill--offline")
                    }
                >
                    <span className="dot dot--in-pill" />
                    {isOnline ? `${name} is online` : `${name} is offline`}
                </span>
                <p className="ttt-connection-text">
                    {isOnline
                        ? "If your opponent disconnects, the game may pause or end."
                        : "Waiting for opponent to reconnect..."}
                </p>
            </div>
        </div>
    );
};
