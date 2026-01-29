import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({ children, onLogout }) {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header onLogout={onLogout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
