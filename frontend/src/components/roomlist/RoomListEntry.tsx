import { useNavigate } from "react-router-dom";
import type { RoomData } from "../../types/roomListTypes";
import Cookies from "js-cookie";
import { ROOM_ROUTE, SIGNUP_ROUTE } from "../../routeConfig";

export default function RoomListEntry({ room }: { room: RoomData }) {
    const navigate = useNavigate();

    const handleJoinRoom = async () => {
        const username = Cookies.get("username");
        const userid = Cookies.get("userid");
        if (!username || !userid) {
            alert("please sign up before joining a room");
            navigate(SIGNUP_ROUTE);
            return;
        }

        // Just navigate to the room - player will join from the game room UI
        navigate(`${ROOM_ROUTE}/${room.id}`);
    };

    return <div key={room.id} className="room-list__row">
        <div className="cell cell--name" title={room.name}>
            {room.name}
        </div>
        <div className="cell">{room.creator}</div>
        <div className="cell">
            {room.player1 ? (
                room.player1
            ) : (
                <span className="pill pill--empty">Empty</span>
            )}
        </div>
        <div className="cell">
            {room.player2 ? (
                room.player2
            ) : (
                <span className="pill pill--empty">Empty</span>
            )}
        </div>
        <div className="cell cell--action">
            <button
                className="btn-join"
                onClick={handleJoinRoom}
            >
                Join
            </button>
        </div>
    </div>
}