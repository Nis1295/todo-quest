import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import MainTodo from "./pages/main/MainTodo";
import QuestCreate from "./pages/main/QuestCreate";
import AdShop from "./pages/shop/AdShop";
import PointShop from "./pages/shop/PointShop";

const PrivateRoute = ({ children }) => {
  const userId = localStorage.getItem("userId");
  return userId ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <MainTodo />
            </PrivateRoute>
          }
        />
        <Route
          path="/quest/create"
          element={
            <PrivateRoute>
              <QuestCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/shop/ad"
          element={
            <PrivateRoute>
              <AdShop />
            </PrivateRoute>
          }
        />
        <Route
          path="/shop/point"
          element={
            <PrivateRoute>
              <PointShop />
            </PrivateRoute>
          }
        />
        {/* 이후 RPG, 랭킹, 활동기록 추가 예정 */}
      </Routes>
    </Router>
  );
};

export default App;
