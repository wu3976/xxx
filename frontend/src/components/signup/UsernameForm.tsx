import { useEffect, useState } from "react";
import "../../styles/username-form.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { SERVER_URL } from "../../config";
import { CREATEUSER_API_ROUTE, GETUSERBYUSERNAME_API_ROUTE } from "../../apiRouteConfig";
import { ROOMLIST_ROUTE } from "../../routeConfig";

export default function UsernameForm() {
    const [username, setUsername] = useState("");
    const [errormsg, setErrormsg] = useState("");

    const navigate = useNavigate();
    const { search } = useLocation();
    const query = new URLSearchParams(search);
    const changeUser = query.get("changeUser");

    useEffect(() => {        
        if (Cookies.get("username") && !changeUser) {
            navigate(ROOMLIST_ROUTE);
        }
    }, []);

    const handleSubmit = async () => {
        if (username === "") {
            setErrormsg("Username must not be empty");
            return;
        }
        const resp = await fetch(`${SERVER_URL}${GETUSERBYUSERNAME_API_ROUTE}/${username}`)
        const data = await resp.json();
        if (!data?.type || (data?.type !== "error" && data?.type !== "data")) {
            alert("unexpected error");
            return;
        }
        if (data?.type === "error") {
            console.log(`user ${username} does not exist, creating a new user`);
            const newUserResp = await fetch(`${SERVER_URL}${CREATEUSER_API_ROUTE}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password: "88888888"
                })
            });
            const newUserData = await newUserResp.json();
            Cookies.set("username", username);
            Cookies.set("userid", newUserData.data._id);
        } else {
            Cookies.set("username", username);
            Cookies.set("userid", data.data._id);
        }
        navigate(ROOMLIST_ROUTE);
    };

    return (
        <div className="page-container">
            <div className="form-container">
                <h2>Enter Your Username</h2>

                <input
                    type="text"
                    placeholder="Username"
                    className="form-input"
                    value={username}
                    onChange={(e) => {
                        setErrormsg("");
                        setUsername(e.target.value)
                    }}
                />
                <div className="error-area">
                    { errormsg }
                </div>

                <button className="form-button" onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
}
