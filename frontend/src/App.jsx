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

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await checkSession();
        setLoggedIn(data.authenticated === true);
      } catch (error) {
        console.error("Session check failed:", error);
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
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggedIn(false);
    }
  };

  const protect = (component) => {
    return loggedIn ? component : <Navigate to="/login" replace />;
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route
          path="/"
          element={protect(
            <Dashboard onLogout={handleLogout} />
          )}
        />

        <Route
          path="/products"
          element={protect(
            <Products onLogout={handleLogout} />
          )}
        />

        <Route
          path="/categories"
          element={protect(
            <Categories onLogout={handleLogout} />
          )}
        />

        <Route
          path="/orders"
          element={protect(
            <Orders onLogout={handleLogout} />
          )}
        />

        <Route
          path="/review-gallery"
          element={protect(
            <ReviewGallery onLogout={handleLogout} />
          )}
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
          element={
            <Navigate
              to={loggedIn ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}