import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({
  children,
  onLogout,
  username,
  title = "Dashboard",
  subtitle,
  actionLabel,
  onAction,
  notificationCount = 0,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 top-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          username={username}
          onLogout={onLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Header
          title={title}
          subtitle={subtitle}
          actionLabel={actionLabel}
          onAction={onAction}
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={notificationCount}
        />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
