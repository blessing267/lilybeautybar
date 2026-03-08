import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import { isLoggedIn, logout } from "./auth/auth";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/dashboard"
          element={
            loggedIn ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={() => setLoggedIn(true)} />
            )
          }
        />
        <Route path="*" element={<Navigate to={loggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}
