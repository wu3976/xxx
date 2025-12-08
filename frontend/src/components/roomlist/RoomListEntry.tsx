import { useNavigate } from "react-router-dom";
import type { RoomData } from "../../types/roomListTypes";
import Cookies from "js-cookie";
import { ROOM_ROUTE, SIGNUP_ROUTE } from "../../routeConfig";
import { SERVER_URL } from "../../config";
import { DELETEROOM_API_ROUTE } from "../../apiRouteConfig";

export default function RoomListEntry({ room }: { room: RoomData }) {
    const navigate = useNavigate();
    const currentUserId = Cookies.get("userid");
    const isCreator = room.creatorId === currentUserId;

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

    const handleDeleteRoom = async () => {
        if (!confirm("Are you sure you want to delete this room?")) {
            return;
        }

        try {
            const response = await fetch(`${SERVER_URL}${DELETEROOM_API_ROUTE}/${room.id}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (data?.type === "error") {
                alert(`Failed to delete room: ${data.data}`);
                return;
            }

            // Room deleted successfully
            alert("Room deleted successfully");
            // Trigger a refresh by reloading the page or emitting an event
            window.location.reload();
        } catch (error) {
            console.error("Error deleting room:", error);
            alert("Error deleting room");
        }
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
            <div className="action-buttons">
                {isCreator && (
                    <button
                        className="btn-delete"
                        onClick={handleDeleteRoom}
                        title="Delete room"
                    >
                        Delete
                    </button>
                )}
                <button
                    className="btn-join"
                    onClick={handleJoinRoom}
                >
                    Join
                </button>
            </div>
        </div>
    </div>
}