import { BrowserRouter, Route, Routes } from "react-router-dom";
import RoomList from "./components/roomlist/RoomList";
import { TicTacToe } from "./components/tictactoe/TicTacToe";
import UsernameForm from "./components/signup/UsernameForm";
import CreateRoom from "./components/createroom/CreateRoom";
import Dashboard from "./components/dashboard/Dashboard";
import { ROOM_ROUTE, ROOMLIST_ROUTE, SIGNUP_ROUTE, CREATEROOM_ROUTE, DASHBOARD_ROUTE } from "./routeConfig";
import HeaderBar from "./components/header/HeaderBar";

export default function App() {
  return <div>
    <BrowserRouter>
      <HeaderBar />
      <Routes>
        <Route path={ROOMLIST_ROUTE} element={<RoomList />}/>
        <Route path={`${ROOM_ROUTE}/:roomId`} element={<TicTacToe />} />
        <Route path={CREATEROOM_ROUTE} element={<CreateRoom />} />
        <Route path={DASHBOARD_ROUTE} element={<Dashboard />} />
        <Route path={SIGNUP_ROUTE} element={<UsernameForm />} />
      </Routes>
    </BrowserRouter>
  </div>
}