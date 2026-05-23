import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";

export default function Sidebar({
  onClose,
}) {
  const navStyle = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl transition font-medium ${
      isActive
        ? "bg-rose-100 text-rose-700"
        : "text-gray-600 hover:bg-rose-50"
    }`;

  return (
    <aside className="w-72 h-full bg-white border-r border-rose-100 p-6 shadow-sm">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-rose-700">
          Lily Beauty
        </h2>

        <p className="text-sm text-gray-500">
          Admin Panel
        </p>
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={navStyle}
          onClick={onClose}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/products"
          className={navStyle}
          onClick={onClose}
        >
          <ShoppingBag size={20} />
          Products
        </NavLink>
      </nav>
    </aside>
  );
}