import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import { isLoggedIn, logout } from "./auth/auth";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
  setLoggedIn(isLoggedIn());
  setAuthLoading(false);
}, []);


  const handleLogout = () => {
    logout();              // remove token
    setLoggedIn(false);    // update UI
  };

  // ⛔ BLOCK rendering until auth is resolved
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />  {/* This shows all toast notifications */}
      {loggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </>
  );
}

export default App;
