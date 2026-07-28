import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkSession, logoutUser } from "./api/authApi";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import ReviewGallery from "./pages/ReviewGallery";
import { Toaster } from "react-hot-toast";
import { isLoggedIn, logout } from "./auth/auth";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await checkSession();
        setLoggedIn(data.authenticated);
      } catch {
        setLoggedIn(false);
      } finally {
        setCheckingSession(false);
      }
    };

    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setLoggedIn(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }
}