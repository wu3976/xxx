import React, { useEffect, useState } from "react";
import "../../styles/tictactoe.css";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { PlayerCard } from "./PlayerCard";
import { OpponentStatus } from "./OpponentStatus";
import { ChatPanel } from "./ChatPanel";
import { useLocation, useParams } from "react-router-dom";
import { SERVER_URL } from "../../config";
import { GETROOM_API_ROUTE, GETUSER_API_ROUTE } from "../../apiRouteConfig";
import type { TttData } from "../../types/ticTacToeTypes";
import { constructDefaultTTTData } from "../../utils/tttUtils";
import Cookies from "js-cookie";

const constructNewTttState = (prev: any, creator: any, player1: any, player2: any) => ({
    ...prev,
    creator: (creator ? {
        id: creator._id,
        username: creator.username,
        email: creator.email,
        phone: creator.phone,
        wincount: creator.wincount,
        losscount: creator.losscount,
        drawcount: creator.drawcount
    }: null),
    player1: (player1 ? {
        id: player1._id,
        username: player1.username,
        email: player1.email,
        phone: player1.phone,
        wincount: player1.wincount,
        losscount: player1.losscount,
        drawcount: player1.drawcount
    } : null),
    player2: (player2 ? {
        id: player2._id,
        username: player2.username,
        email: player2.email,
        phone: player2.phone,
        wincount: player2.wincount,
        losscount: player2.losscount,
        drawcount: player2.drawcount
    }: null)
});

const calculateCurrentTurnStr = (tttstate: TttData) => {
    return tttstate.turn === 1 ?
        tttstate.player1?.username :
        tttstate.player2?.username;
}

export const TicTacToe: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    
    const [tttstate, setTttstate] = useState<TttData>(constructDefaultTTTData());

    useEffect(() => {
        console.log(tttstate);

        const userId = Cookies.get("userid");
        fetch(`${SERVER_URL}${GETROOM_API_ROUTE}/${roomId}?userId=${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        })
        .then(resp => resp.json())
        .then(data => {
            if (data.type === "error") {
                alert(`error: ${JSON.stringify(data.data)}`)
            } else if (data.type === "data") {
                const { _id, name, creater, player1, player2, 
                    board, turn, win, createdAt } = data.data;
                setTttstate({
                    id: _id,
                    name,
                    creator: null,
                    player1: null,
                    player2: null,
                    board,
                    turn,
                    win,
                    createdAt
                });
                return Promise.all([
                    fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${creater}`),
                    player1 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player1}`) : null,
                    player2 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player2}`) : null
                ])
            } else {
                alert("Unexpected Error");
            }
        })
        .then(resp => {
            if (!resp) { return; }

            return Promise.all([
                resp[0].json(), 
                resp[1] ? resp[1].json(): null, 
                resp[2] ? resp[2].json(): null
            ]);
        })
        .then(data => {
            if (!data) { return; }
            const [creator, player1, player2] = data;
            setTttstate(prev => {
                if (!prev) {
                    return null;
                }
                return constructNewTttState(prev, creator?.data, player1?.data, player2?.data);
            });
        });
    }, []);
    const board: (string | null)[] = [
        "X", "O", "X",
        null, "O", null,
        null, "X", null,
    ];

    const currentUser = {
        name: "You",
        mark: "X",
        avatar: "Y",
        isOnline: true,
        isCurrentTurn: true,
    };

    const opponent = {
        name: "Alice",
        mark: "O",
        avatar: "A",
        isOnline: true,
        isCurrentTurn: false,
    };

    const messages = [
        { id: 1, from: "You", text: "Hey! Ready to play?", time: "21:03" },
        { id: 2, from: "Alice", text: "Yep, good luck :)", time: "21:03" },
        { id: 3, from: "You", text: "X goes first, right?", time: "21:04" },
        { id: 4, from: "Alice", text: "Yeah, your move!", time: "21:04" },
    ];

    return (
        <div className="ttt-page">
            <div className="ttt-card">
                {/* LEFT: players + board */}
                <div className="ttt-left">
                    <div className="ttt-players">
                        <PlayerCard player={tttstate.player1 ? {
                            name: tttstate.player1?.username as string,
                            mark: "X",
                            avatar: (tttstate.player1?.username as string)[0],
                            isOnline: true,
                            isCurrentTurn: tttstate.turn === 1
                        } : null} highlight />
                        <PlayerCard player={tttstate.player2 ? {
                            name: tttstate.player2?.username as string,
                            mark: "O",
                            avatar: (tttstate.player2?.username as string)[0],
                            isOnline: true,
                            isCurrentTurn: tttstate.turn === 2
                        } : null} />
                    </div>

                    <div className="ttt-status">
                        <div className="ttt-status-item">
                            { tttstate.player1 && tttstate.player2 ? 
                                <><span className="label">Current turn:</span>
                                <span className="value">{
                                    calculateCurrentTurnStr(tttstate)
                                }</span></> : 
                                "Game not started yet"
                            }
                        </div>
                        <div className="ttt-status-item">
                            <span className="label">Room:</span>
                            <span className="value">{tttstate.name}</span>
                        </div>
                    </div>

                    <TicTacToeBoard board={tttstate.board} />

                    <div className="ttt-footer">
                        <span className="hint">Tip: X always starts. First to 3 in a row wins.</span>
                    </div>
                </div>

                {/* RIGHT: status + chat */}
                <div className="ttt-right">
                    <OpponentStatus isOnline={opponent.isOnline} name={opponent.name} />

                    <ChatPanel messages={messages} />
                </div>
            </div>
        </div>
    );
    // return <div>{JSON.stringify(tttstate)}</div>
};
