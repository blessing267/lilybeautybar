import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkSession, logoutUser } from "./api/authApi";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import ReviewGallery from "./pages/ReviewGallery";
import Settings from "./pages/Settings";
import { Toaster } from "react-hot-toast";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkSession()
      .then((data) => setLoggedIn(data.authenticated === true))
      .catch(() => setLoggedIn(false))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setLoggedIn(false);
    }
  };

  const protect = (component) =>
    loggedIn ? component : <Navigate to="/login" replace />;

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={protect(<Dashboard onLogout={handleLogout} />)} />
        <Route path="/products" element={protect(<Products onLogout={handleLogout} />)} />
        <Route path="/categories" element={protect(<Categories onLogout={handleLogout} />)} />
        <Route path="/customers"element={protect(<Customers onLogout={handleLogout} />)}/>
        <Route path="/orders" element={protect(<Orders onLogout={handleLogout} />)} />
        <Route path="/review-gallery" element={protect(<ReviewGallery onLogout={handleLogout} />)} />
        <Route path="/settings" element={protect(<Settings onLogout={handleLogout} />)} />
        <Route
          path="/login"
          element={loggedIn ? <Navigate to="/" replace /> : <Login onLogin={() => setLoggedIn(true)} />}
        />
        <Route path="*" element={<Navigate to={loggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}
