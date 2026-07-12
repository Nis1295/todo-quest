import { createBrowserRouter } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MainTodo from "./pages/MainTodo";
import QuestCreate from "./pages/QuestCreate";
import QuestComplete from "./pages/QuestComplete";
import RpgStatus from "./pages/RpgStatus";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import Logs from "./pages/Logs";
import AdShop from "./pages/AdShop";
import PointShop from "./pages/PointShop";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/main",
    element: <MainTodo />
  },
  {
    path: "/quest/create",
    element: <QuestCreate />
  },
  {
    path: "/quest/complete/:questId",
    element: <QuestComplete />
  },
  {
    path: "/rpg",
    element: <RpgStatus />
  },
  {
    path: "/ranking",
    element: <Ranking />
  },
  {
    path: "/profile",
    element: <Profile />
  },
  {
    path: "/logs",
    element: <Logs />
  },
  {
    path: "/AdShop",
    element: <AdShop />
  },
  {
    path: "/PointShop",
    element: <PointShop />
  }
]);
