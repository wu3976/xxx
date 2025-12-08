import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../config";
import { CREATEROOM_API_ROUTE } from "../../apiRouteConfig";
import { ROOMLIST_ROUTE } from "../../routeConfig";
import Cookies from "js-cookie";
import "../../styles/create-room.css";

const CreateRoom: React.FC = () => {
    const [roomName, setRoomName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!roomName.trim()) {
            setError("Room name cannot be empty");
            return;
        }

        if (roomName.length > 100) {
            setError("Room name cannot exceed 100 characters");
            return;
        }

        setIsLoading(true);

        try {
            const userId = Cookies.get("userid");
            if (!userId) {
                setError("You are not logged in");
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${SERVER_URL}${CREATEROOM_API_ROUTE}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: roomName }),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok && data.type === "data") {
                // Success! Redirect to room list
                setRoomName("");
                navigate(ROOMLIST_ROUTE);
            } else {
                // Error response - data.data contains the error message string
                const errorMsg = typeof data.data === "string" ? data.data : "Failed to create room";
                setError(errorMsg);
            }
        } catch (err) {
            console.error("Error creating room:", err);
            setError("An error occurred while creating the room");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="create-room-container">
            <div className="create-room-card">
                <h1 className="create-room-title">Create a New Game Room</h1>
                <form onSubmit={handleCreateRoom} className="create-room-form">
                    <div className="form-group">
                        <label htmlFor="roomName" className="form-label">
                            Room Name
                        </label>
                        <input
                            type="text"
                            id="roomName"
                            className="form-input"
                            placeholder="Enter room name..."
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            disabled={isLoading}
                            maxLength={100}
                        />
                        <div className="char-count">
                            {roomName.length}/100
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading || !roomName.trim()}
                    >
                        {isLoading ? "Creating..." : "Create Room"}
                    </button>
                </form>

                <div className="form-footer">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(ROOMLIST_ROUTE)}
                        disabled={isLoading}
                    >
                        Back to Room List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;
