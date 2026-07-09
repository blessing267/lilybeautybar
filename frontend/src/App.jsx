import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import { isLoggedIn, logout } from "./auth/auth";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  const protect = (component) =>
    loggedIn ? component : <Navigate to="/login" replace />;

  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route
          path="/"
          element={protect(<Dashboard onLogout={handleLogout} />)}
        />

        <Route
          path="/products"
          element={protect(<Products onLogout={handleLogout} />)}
        />

        <Route
          path="/categories"
          element={protect(<Categories onLogout={handleLogout} />)}
        />

        <Route
          path="/orders"
          element={protect(<Orders onLogout={handleLogout} />)}
        />

        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={() => setLoggedIn(true)} />
            )
          }
        />

        <Route
          path="*"
          element={<Navigate to={loggedIn ? "/" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}