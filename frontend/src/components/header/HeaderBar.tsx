import { useEffect, useState } from "react";
import "../../styles/header-bar.css";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { SIGNUP_ROUTE, DASHBOARD_ROUTE } from "../../routeConfig";

export default function HeaderBar() {
    const [userid, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    const navigate = useNavigate();

    const navigateToSignup = (changeUser: boolean) => {
        navigate(`${SIGNUP_ROUTE}?changeUser=${changeUser}`);
    }

    useEffect(() => {
        const cookieUname = Cookies.get("username");
        const cookieUid = Cookies.get("userid");
        if (cookieUname) {
            setUsername(cookieUname);
        }
        if (cookieUid) {
            setUserId(cookieUid);
        }
        if (!cookieUname || !cookieUid) {
            Cookies.remove("username");
            Cookies.remove("userid");
        }
    });

    return (
        <header className="header-bar">
            <div className="header-left">
                <h1 className="app-title">My App</h1>
            </div>
            <div className="header-right">
                {
                    userid && username ? 

                    <><span className="username">Signed up as: <strong>{username}</strong></span>
                    <button className="header-btn" 
                    onClick={() => navigate(DASHBOARD_ROUTE)}>📊 Dashboard</button>
                    <button className="change-user-btn" 
                    onClick={() => navigateToSignup(true)}>Change User</button></>:

                    <button className="change-user-btn" 
                    onClick={() => navigateToSignup(false)}>Sign Up</button>
                }       
            </div>

        </header>
    );
}
