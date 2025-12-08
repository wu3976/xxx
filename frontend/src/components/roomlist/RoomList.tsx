import React, { useEffect, useState, useCallback } from "react";
import "../../styles/room-list.css";
import type { RoomData } from "../../types/roomListTypes";
import RoomListEntry from "./RoomListEntry";
import { SERVER_URL } from "../../config";
import { LISTROOMS_API_ROUTE } from "../../apiRouteConfig";
import { CREATEROOM_ROUTE } from "../../routeConfig";
import { useNavigate } from "react-router-dom";
import useRoomSocket from "../../hooks/useRoomSocket";

const mockRooms: RoomData[] = [
    {
        id: "1",
        name: "Casual TicTacToe #1",
        creator: "Sophia",
        player1: "Sophia",
        player2: null,
    },
    {
        id: "2",
        name: "Ranked Match Only",
        creator: "Eric",
        player1: "Eric",
        player2: "Alice",
    },
    {
        id: "3",
        name: "Newbies Welcome",
        creator: "Bob",
        player1: null,
        player2: null,
    },
    {
        id: "4",
        name: "Night Owls Room",
        creator: "Mia",
        player1: "Mia",
        player2: null,
    },
];

const useRoomDatas = (): [RoomData[], React.Dispatch<React.SetStateAction<RoomData[]>>] => {
    let [roomListDatas, setRoomListDatas] = useState<RoomData[]>([]);
    const { socket, state: socketState, onRoomUpdate } = useRoomSocket();

    const fetchRooms = useCallback(() => {
        fetch(`${SERVER_URL}${LISTROOMS_API_ROUTE}?skip=0&limit=-1&oldestFirst=true`)
            .then(resp => resp.json())
            .then(data => {
                if (data?.type === "error") {
                    console.error(`error: ${data.data}`)
                } else if (data?.type === "data") {
                    setRoomListDatas(data.data.map((ele: any) => ({
                        ...ele,
                        creator: ele.creater,
                        creatorId: ele.createrId,
                        creater: undefined,
                        createrId: undefined
                    })));
                } else {
                    console.error("Unexpected Error");
                }
            })
            .catch(err => console.error("Failed to fetch rooms:", err));
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchRooms();
        const interval = setInterval(() => {
            fetchRooms();
        }, 8000);
        return () => {
            clearInterval(interval);
        }
    }, [fetchRooms]);

    // Listen for room updates via WebSocket
    useEffect(() => {
        if (!socket) return;

        const unsubscribe = onRoomUpdate((data: any) => {
            console.log('Room list update received:', data);
            // Refresh room list when any room is updated
            fetchRooms();
        });

        return unsubscribe;
    }, [socket, onRoomUpdate, fetchRooms]);

    return [roomListDatas, setRoomListDatas];
}

const RoomList: React.FC = () => {
    const [roomListDatas, setRoomListDatas] = useRoomDatas();
    const { state: socketState } = useRoomSocket();
    const navigate = useNavigate();

    return (
        <div className="page">
            {socketState.error && (
                <div style={{ padding: '10px', backgroundColor: '#ffe6e6', color: '#d32f2f', borderRadius: '4px', marginBottom: '10px' }}>
                    Error: {socketState.error}
                </div>
            )}
            <div className="room-list">
                <div className="room-list__header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                        <div>
                            <h2>Available Rooms</h2>
                            <p>Pick a room to join a game.</p>
                            {!socketState.isConnected && <p style={{ color: '#999' }}>Connecting to server...</p>}
                        </div>
                        <button
                            onClick={() => navigate(CREATEROOM_ROUTE)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#45a049';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#4CAF50';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            + Create Room
                        </button>
                    </div>
                </div>

                <div className="room-list__table">
                    <div className="room-list__row room-list__row--head">
                        <div className="cell cell--name">Room Name</div>
                        <div className="cell">Creator</div>
                        <div className="cell">Player 1</div>
                        <div className="cell">Player 2</div>
                        <div className="cell cell--action">Join</div>
                    </div>
                    {roomListDatas.map((room) => (
                        <RoomListEntry room={room} key={room.id} />
                    ))}
                </div>

                <div className="room-list__footer">
                    <span>{roomListDatas.length} rooms found</span>
                </div>
            </div>
        </div>
    );
};

export default RoomList;
