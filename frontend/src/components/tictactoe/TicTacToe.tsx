import React, { useEffect, useState } from "react";
import "../../styles/tictactoe.css";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { PlayerCard } from "./PlayerCard";
import { OpponentStatus } from "./OpponentStatus";
import { ChatPanel } from "./ChatPanel";
import { useParams } from "react-router-dom";
import { SERVER_URL } from "../../config";
import { GETROOM_API_ROUTE, GETUSER_API_ROUTE } from "../../apiRouteConfig";
import type { TttData } from "../../types/ticTacToeTypes";
import { constructDefaultTTTData } from "../../utils/tttUtils";
import { shouldBoardBeDisabled, checkGameStatus } from "../../utils/gameLogic";
import Cookies from "js-cookie";
import useRoomSocket from "../../hooks/useRoomSocket";

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
    // Check if both players are present
    if (!tttstate.player1 || !tttstate.player2) {
        return "Waiting for players...";
    }

    // Check game status
    const gameStatus = checkGameStatus(tttstate.board);
    if (gameStatus === 1) {
        return `${tttstate.player1.username} wins`;
    } else if (gameStatus === 2) {
        return `${tttstate.player2.username} wins`;
    } else if (gameStatus === 3) {
        return "draw";
    }

    // Game is ongoing
    return tttstate.turn === 1
        ? tttstate.player1?.username
        : tttstate.player2?.username;
}

export const TicTacToe: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { 
        socket,
        joinRoom, 
        leaveRoom, 
        subscribeToRoom, 
        unsubscribeFromRoom,
        onRoomUpdate,
        state: socketState 
    } = useRoomSocket();
    
    const [tttstate, setTttstate] = useState<TttData>(constructDefaultTTTData());
    const [isPlayerJoined, setIsPlayerJoined] = useState(false);
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<'player1' | 'player2' | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    // Initial room data fetch via HTTP
    useEffect(() => {
        if (!roomId) return;

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
    }, [roomId]);

    // Subscribe to room updates (but NOT auto-join)
    useEffect(() => {
        if (!roomId || !socketState.isConnected) return;

        // Just subscribe to room updates, don't join yet
        subscribeToRoom(roomId);

        return () => {
            unsubscribeFromRoom(roomId);
        };
    }, [roomId, socketState.isConnected]);

    // Manual join room handler
    const handleJoinSlot = async (playerSlot: 'player1' | 'player2') => {
        if (!roomId || !socketState.isConnected) {
            alert('Not connected to server');
            return;
        }

        const userId = Cookies.get("userid");
        if (!userId) {
            alert('User not logged in');
            return;
        }

        setIsJoining(true);
        try {
            // Check if slot is already taken
            if (playerSlot === 'player1' && tttstate.player1) {
                alert('Slot 1 is already taken');
                setIsJoining(false);
                return;
            }
            if (playerSlot === 'player2' && tttstate.player2) {
                alert('Slot 2 is already taken');
                setIsJoining(false);
                return;
            }

            // Join room via WebSocket
            const success = await joinRoom({
                roomId,
                userId,
                playerSlot,
            });

            if (success) {
                console.log('Successfully joined room via WebSocket as', playerSlot);
                setCurrentPlayerSlot(playerSlot);
                setIsPlayerJoined(true);
            } else {
                alert(`Failed to join: ${socketState.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Error joining room');
        } finally {
            setIsJoining(false);
        }
    };

    // Manual leave slot handler (leave without leaving room)
    const handleLeaveSlot = async () => {
        if (!roomId || !socketState.isConnected) {
            alert('Not connected to server');
            return;
        }

        const userId = Cookies.get("userid");
        if (!userId) {
            alert('User not logged in');
            return;
        }

        setIsJoining(true);
        let leaveSuccess = false;
        
        try {
            // Leave room via WebSocket
            leaveSuccess = await leaveRoom(roomId, userId);

            if (!leaveSuccess) {
                // Only show error if leave actually failed
                alert('Failed to leave slot');
                setIsJoining(false);
                return;
            }
            
            // Success - clear local state immediately
            console.log('Successfully left slot');
            setCurrentPlayerSlot(null);
            setIsPlayerJoined(false);
            
            // Force refresh room state from server after a brief delay
            // This ensures the room update propagates across all clients
            setTimeout(async () => {
                try {
                    const response = await fetch(`${SERVER_URL}${GETROOM_API_ROUTE}/${roomId}?userId=${userId}`);
                    const data = await response.json();
                    
                    if (data.type === "data") {
                        const { creater, player1, player2 } = data.data;
                        
                        // Fetch updated user info
                        const [creatorResp, player1Resp, player2Resp] = await Promise.all([
                            fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${creater}`),
                            player1 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player1}`) : null,
                            player2 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player2}`) : null
                        ]);
                        
                        const [creatorData, player1Data, player2Data] = await Promise.all([
                            creatorResp.json(),
                            player1Resp ? player1Resp.json() : null,
                            player2Resp ? player2Resp.json() : null
                        ]);
                        
                        setTttstate(prev => constructNewTttState(prev, creatorData?.data, player1Data?.data, player2Data?.data));
                        console.log('Room state refreshed after leaving slot');
                    }
                } catch (err) {
                    console.error('Error refreshing room state:', err);
                }
            }, 300);
        } catch (error) {
            console.error('Error leaving slot:', error);
            alert('Error leaving slot');
        } finally {
            setIsJoining(false);
        }
    };


    // Listen for room updates (active immediately after entering room, not just after joining)
    useEffect(() => {
        if (!roomId) return;

        const unsubscribe = onRoomUpdate((data: any) => {
            console.log('Room update received:', data);
            
            // Fetch updated room state to refresh player info
            const userId = Cookies.get("userid");
            fetch(`${SERVER_URL}${GETROOM_API_ROUTE}/${roomId}?userId=${userId}`)
                .then(resp => resp.json())
                .then(data => {
                    if (data.type === "data") {
                        const { creater, player1, player2 } = data.data;
                        setTttstate(prev => ({
                            ...prev,
                            board: data.data.board,
                            turn: data.data.turn,
                            win: data.data.win,
                        }));
                        
                        // Fetch updated user info if players changed
                        return Promise.all([
                            fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${creater}`),
                            player1 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player1}`) : null,
                            player2 ? fetch(`${SERVER_URL}${GETUSER_API_ROUTE}/${player2}`) : null
                        ]);
                    }
                })
                .then(resp => {
                    if (!resp) return;
                    return Promise.all([
                        resp[0].json(),
                        resp[1] ? resp[1].json() : null,
                        resp[2] ? resp[2].json() : null
                    ]);
                })
                .then(data => {
                    if (!data) return;
                    const [creator, player1, player2] = data;
                    setTttstate(prev => constructNewTttState(prev, creator?.data, player1?.data, player2?.data));
                });
        });

        return unsubscribe;
    }, [roomId, onRoomUpdate]);

    // Handle board cell click and send move to server
    const handleCellClick = (cellIndex: number) => {
        console.log('[CELL_CLICK] Cell clicked:', cellIndex);
        
        if (!roomId || !socketState.isConnected) {
            console.log('[CELL_CLICK] Not connected. roomId:', roomId, 'connected:', socketState.isConnected);
            alert('Not connected to server');
            return;
        }

        if (!currentPlayerSlot) {
            console.log('[CELL_CLICK] No player slot');
            alert('You must join a slot first');
            return;
        }

        // Check if it's the current player's turn
        const playerTurnNumber = currentPlayerSlot === 'player1' ? 1 : 2;
        if (tttstate.turn !== playerTurnNumber) {
            console.log('[CELL_CLICK] Not your turn. Your turn:', playerTurnNumber, 'Current turn:', tttstate.turn);
            alert('Not your turn!');
            return;
        }

        // Check if cell is already occupied
        if (tttstate.board[cellIndex] !== '0') {
            console.log('[CELL_CLICK] Cell already occupied');
            alert('Cell is already occupied');
            return;
        }

        // Check if game is already over
        const gameStatus = checkGameStatus(tttstate.board);
        if (gameStatus !== 0) {
            console.log('[CELL_CLICK] Game is already over. Status:', gameStatus);
            alert('Game is already over');
            return;
        }

        const userId = Cookies.get("userid");
        if (!userId) {
            console.log('[CELL_CLICK] No user ID');
            alert('User not logged in');
            return;
        }

        console.log('[CELL_CLICK] Sending move to server. roomId:', roomId, 'userId:', userId, 'cellIndex:', cellIndex);
        console.log('[CELL_CLICK] Socket object:', socket);

        try {
            // Test: Emit a simple test event first
            if (!socket) {
                console.error('[CELL_CLICK] Socket is null!');
                alert('Socket connection not available');
                return;
            }

            if (!socket.connected) {
                console.error('[CELL_CLICK] Socket is not connected!');
                alert('Socket is not connected');
                return;
            }

            console.log('[CELL_CLICK] Socket is connected, emitting room:move');
            
            // Emit move event to backend
            socket.emit('room:move', { roomId, userId, cellIndex }, (response: any) => {
                console.log('[CELL_CLICK] Response from server:', response);
                if (!response?.success) {
                    const errorMsg = response?.error?.message || 'Unknown error';
                    console.error('[CELL_CLICK] Move failed:', errorMsg);
                    alert('Move failed: ' + errorMsg);
                }
            });
        } catch (error) {
            console.error('[CELL_CLICK] Error making move:', error);
            alert('Error making move: ' + error);
        }
    };

    // Cleanup: leave room on unmount
    useEffect(() => {
        return () => {
            if (roomId && isPlayerJoined) {
                const userId = Cookies.get("userid");
                if (userId) {
                    leaveRoom(roomId, userId);
                    unsubscribeFromRoom(roomId);
                }
            }
        };
    }, [roomId, isPlayerJoined]);

    // Debug logging
    useEffect(() => {
        console.log('[DEBUG] Board state:', {
            board: tttstate.board,
            currentPlayerSlot,
            turn: tttstate.turn,
            isConnected: socketState.isConnected,
            socketExists: !!socket,
            disabled: shouldBoardBeDisabled(tttstate.board, currentPlayerSlot, tttstate.turn),
            player1: !!tttstate.player1,
            player2: !!tttstate.player2
        });
    }, [tttstate.board, currentPlayerSlot, tttstate.turn, socketState.isConnected]);

    // Dummy opponent data for the UI (will be populated from actual game state later)
    const opponent = {
        name: "Opponent",
        isOnline: tttstate.player2 ? true : false,
    };
    
    const messages = [
        { id: 1, from: "You", text: "Hey! Ready to play?", time: "21:03" },
        { id: 2, from: "Alice", text: "Yep, good luck :)", time: "21:03" },
        { id: 3, from: "You", text: "X goes first, right?", time: "21:04" },
        { id: 4, from: "Alice", text: "Yeah, your move!", time: "21:04" },
    ];

    return (
        <div className="ttt-page">
            {!socketState.isConnected && (
                <div style={{ padding: '10px', backgroundColor: '#ffe6e6', color: '#d32f2f', borderRadius: '4px', marginBottom: '10px' }}>
                    Connecting to server...
                </div>
            )}
            {socketState.error && (
                <div style={{ padding: '10px', backgroundColor: '#ffe6e6', color: '#d32f2f', borderRadius: '4px', marginBottom: '10px' }}>
                    Error: {socketState.error}
                </div>
            )}
            <div className="ttt-card">
                {/* LEFT: players + board */}
                <div className="ttt-left">
                    <div className="ttt-players">
                        {/* Player 1 Slot */}
                        {tttstate.player1 ? (
                            currentPlayerSlot === 'player1' ? (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px',
                                    border: '2px solid #ccc',
                                    borderRadius: '8px',
                                    margin: '10px',
                                    minHeight: '150px',
                                    backgroundColor: '#f9f9f9',
                                }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Slot 1 (X)</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#999' }}>You have joined this slot</span>
                                        <button
                                            onClick={handleLeaveSlot}
                                            disabled={isJoining || !socketState.isConnected}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                                opacity: isJoining || !socketState.isConnected ? 0.6 : 1,
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isJoining ? 'Leaving...' : 'Leave Slot'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <PlayerCard player={{
                                    name: tttstate.player1?.username as string,
                                    mark: "X",
                                    avatar: (tttstate.player1?.username as string)[0],
                                    isOnline: true,
                                    isCurrentTurn: tttstate.turn === 1
                                }} 
                                highlight 
                                clickHandler={() => { alert("clicked"); }}
                                />
                            )
                        ) : (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px',
                                border: '2px solid #ccc',
                                borderRadius: '8px',
                                margin: '10px',
                                minHeight: '150px',
                                backgroundColor: '#f9f9f9',
                                cursor: currentPlayerSlot === 'player1' ? 'default' : 'pointer',
                                opacity: currentPlayerSlot === 'player1' ? 0.7 : 1
                            }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Slot 1 (X)</span>
                                {currentPlayerSlot === 'player1' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#999' }}>You have joined this slot</span>
                                        <button
                                            onClick={handleLeaveSlot}
                                            disabled={isJoining || !socketState.isConnected}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                                opacity: isJoining || !socketState.isConnected ? 0.6 : 1,
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isJoining ? 'Leaving...' : 'Leave Slot'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleJoinSlot('player1')}
                                        disabled={isJoining || !socketState.isConnected}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                            opacity: isJoining || !socketState.isConnected ? 0.6 : 1
                                        }}
                                    >
                                        {isJoining ? 'Joining...' : 'Click to Join'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Player 2 Slot */}
                        {tttstate.player2 ? (
                            currentPlayerSlot === 'player2' ? (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px',
                                    border: '2px solid #ccc',
                                    borderRadius: '8px',
                                    margin: '10px',
                                    minHeight: '150px',
                                    backgroundColor: '#f9f9f9',
                                }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Slot 2 (O)</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#999' }}>You have joined this slot</span>
                                        <button
                                            onClick={handleLeaveSlot}
                                            disabled={isJoining || !socketState.isConnected}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                                opacity: isJoining || !socketState.isConnected ? 0.6 : 1,
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isJoining ? 'Leaving...' : 'Leave Slot'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <PlayerCard player={{
                                    name: tttstate.player2?.username as string,
                                    mark: "O",
                                    avatar: (tttstate.player2?.username as string)[0],
                                    isOnline: true,
                                    isCurrentTurn: tttstate.turn === 2
                                }} 
                                clickHandler={() => { alert("clicked"); }}
                                />
                            )
                        ) : (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px',
                                border: '2px solid #ccc',
                                borderRadius: '8px',
                                margin: '10px',
                                minHeight: '150px',
                                backgroundColor: '#f9f9f9',
                                cursor: currentPlayerSlot === 'player2' ? 'default' : 'pointer',
                                opacity: currentPlayerSlot === 'player2' ? 0.7 : 1
                            }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Slot 2 (O)</span>
                                {currentPlayerSlot === 'player2' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#999' }}>You have joined this slot</span>
                                        <button
                                            onClick={handleLeaveSlot}
                                            disabled={isJoining || !socketState.isConnected}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                                opacity: isJoining || !socketState.isConnected ? 0.6 : 1,
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isJoining ? 'Leaving...' : 'Leave Slot'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleJoinSlot('player2')}
                                        disabled={isJoining || !socketState.isConnected}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isJoining || !socketState.isConnected ? 'not-allowed' : 'pointer',
                                            opacity: isJoining || !socketState.isConnected ? 0.6 : 1
                                        }}
                                    >
                                        {isJoining ? 'Joining...' : 'Click to Join'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ttt-status">
                        <div className="ttt-status-item">
                            <span className="label">Current turn:</span>
                            <span className="value">{
                                calculateCurrentTurnStr(tttstate)
                            }</span>
                        </div>
                        <div className="ttt-status-item">
                            <span className="label">Room:</span>
                            <span className="value">{tttstate.name}</span>
                        </div>
                    </div>

                    <TicTacToeBoard 
                        board={tttstate.board}
                        isDisabled={shouldBoardBeDisabled(tttstate.board, currentPlayerSlot, tttstate.turn)}
                        onCellClick={handleCellClick}
                    />

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
