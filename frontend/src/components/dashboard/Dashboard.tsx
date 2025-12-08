import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../config";
import { GETUSERS_API_ROUTE } from "../../apiRouteConfig";
import { ROOMLIST_ROUTE } from "../../routeConfig";
import "../../styles/dashboard.css";

interface UserStats {
    _id: string;
    username: string;
    email?: string;
    phone?: string;
    wincount: number;
    losscount: number;
    drawcount: number;
}

const Dashboard: React.FC = () => {
    const [users, setUsers] = useState<UserStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${SERVER_URL}${GETUSERS_API_ROUTE}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (data.type === "data") {
                // Sort by win count descending
                const sortedUsers = [...data.data].sort((a, b) => b.wincount - a.wincount);
                setUsers(sortedUsers);
            } else {
                setError("Failed to load user stats");
            }
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("An error occurred while loading user stats");
        } finally {
            setIsLoading(false);
        }
    };

    const getTotalGames = (user: UserStats) => {
        return user.wincount + user.losscount + user.drawcount;
    };

    const getWinRate = (user: UserStats) => {
        const total = getTotalGames(user);
        if (total === 0) return "0.0%";
        return ((user.wincount / total) * 100).toFixed(1) + "%";
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Player Statistics</h1>
                    <p>Leaderboard showing all players' performance</p>
                </div>
                <button
                    onClick={() => navigate(ROOMLIST_ROUTE)}
                    className="back-button"
                >
                    ← Back to Rooms
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="loading">
                    Loading player statistics...
                </div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <p>No players yet</p>
                </div>
            ) : (
                <div className="leaderboard">
                    <div className="leaderboard-header">
                        <div className="rank">#</div>
                        <div className="username">Player</div>
                        <div className="stat">Wins</div>
                        <div className="stat">Losses</div>
                        <div className="stat">Draws</div>
                        <div className="stat">Total</div>
                        <div className="stat">Win Rate</div>
                    </div>

                    {users.map((user, index) => (
                        <div key={user._id} className="leaderboard-row">
                            <div className="rank">
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
                                {index > 2 && `${index + 1}`}
                            </div>
                            <div className="username">{user.username}</div>
                            <div className="stat wins">{user.wincount}</div>
                            <div className="stat losses">{user.losscount}</div>
                            <div className="stat draws">{user.drawcount}</div>
                            <div className="stat total">{getTotalGames(user)}</div>
                            <div className="stat winrate">{getWinRate(user)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
