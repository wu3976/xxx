import React, { useEffect, useState } from "react";
import "../../styles/room-list.css";
import type { RoomData } from "../../types/roomListTypes";
import RoomListEntry from "./RoomListEntry";
import { SERVER_URL } from "../../config";
import { LISTROOMS_API_ROUTE } from "../../apiRouteConfig";

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

    useEffect(() => {
        fetch(`${SERVER_URL}${LISTROOMS_API_ROUTE}?skip=0&limit=-1&oldestFirst=true`)
        .then(resp => resp.json())
        .then(data => {
            if (data?.type === "error") {
                alert(`error: ${data.data}`)
            } else if (data?.type === "data") {
                setRoomListDatas(data.data.map((ele: any) => ({
                    ...ele,
                    creator: ele.creater,
                    creater: undefined
                })));
            } else {
                alert("Unexpected Error");
            }
        })
    }, []);

    return [roomListDatas, setRoomListDatas];
}

const RoomList: React.FC = () => {
    const [roomListDatas, setRoomListDatas] = useRoomDatas();

    return (
        <div className="page">
            <div className="room-list">
                <div className="room-list__header">
                    <h2>Available Rooms</h2>
                    <p>Pick a room to join a game.</p>
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
