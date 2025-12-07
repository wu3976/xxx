// PlayerCard.tsx
import React from "react";

export type Player = {
    name: string;
    mark: "X" | "O" | string;
    avatar: string;
    isOnline: boolean;
    isCurrentTurn?: boolean;
} | null;

type PlayerCardProps = {
    player: Player;
    highlight?: boolean;
    clickHandler: () => void;
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, highlight, clickHandler }) => {
    if (!player) {
        return (
            <div
                className={
                    "ttt-player" + (highlight ? " ttt-player--current" : "")
                }
                onClick={clickHandler}
            >
                <div className="ttt-player-info">
                    click to join
                </div>
            </div>
        )
    }
    return (
        <div
            className={
                "ttt-player" + (highlight ? " ttt-player--current" : "")
            }
            onClick={clickHandler}
        >
            <div className={"ttt-avatar" + (!highlight ? " ttt-avatar--secondary" : "")}>
                {player.avatar}
            </div>
            <div className="ttt-player-info">
                <div className="ttt-player-name">
                    {player.name}
                    <span className="ttt-player-mark"> · {player.mark}</span>
                </div>
                <div className="ttt-player-sub">
                    <span
                        className={
                            "dot " + (player.isOnline ? "dot--online" : "dot--offline")
                        }
                    />
                    {player.isOnline ? "Online" : "Offline"}
                </div>
            </div>
        </div>
    );
};
