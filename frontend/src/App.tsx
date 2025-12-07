import { BrowserRouter, Route, Routes } from "react-router-dom";
import RoomList from "./components/roomlist/RoomList";
import { TicTacToe } from "./components/tictactoe/TicTacToe";
import UsernameForm from "./components/signup/UsernameForm";
import { ROOM_ROUTE, ROOMLIST_ROUTE, SIGNUP_ROUTE } from "./routeConfig";
import HeaderBar from "./components/header/HeaderBar";

export default function App() {
  return <div>
    <BrowserRouter>
      <HeaderBar />
      <Routes>
        <Route path={ROOMLIST_ROUTE} element={<RoomList />}/>
        <Route path={`${ROOM_ROUTE}/:roomId`} element={<TicTacToe />} />
        <Route path={SIGNUP_ROUTE} element={<UsernameForm />} />
      </Routes>
    </BrowserRouter>
  </div>
}