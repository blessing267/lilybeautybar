import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  ReceiptText,
  Images,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/review-gallery", label: "Review Gallery", icon: Images },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onClose, onLogout, username = "Admin" }) {
  const navStyle = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-pink-500 text-white shadow-sm"
        : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="flex h-full w-72 flex-col bg-black p-5 text-white">
      <a href="/" className="mb-6 block" aria-label="Lily Beauty Bar home">
        <img
          src="/static/img/lbblogo.jpeg"
          alt="Lily Beauty Bar"
          className="h-20 w-full rounded-xl object-contain"
        />
      </a>

      <div className="mb-6 rounded-2xl bg-white/5 px-4 py-3">
        <p className="text-xs text-slate-400">Welcome,</p>
        <p className="mt-1 truncate font-semibold">{username}</p>
      </div>

      <nav className="space-y-1.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navStyle} onClick={onClose}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <a
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-pink-400 px-4 py-2.5 text-sm font-medium text-pink-300 transition hover:bg-pink-500 hover:text-white"
        >
          <ExternalLink size={17} />
          View Store
        </a>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}


/*import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  ReceiptText,
  Images,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";

const BRAND_PINK = "#FB1F81";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/review-gallery", label: "Review Gallery", icon: Images },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onClose, onLogout, username = "Admin" }) {
  return (
    <aside className="flex min-h-screen w-72 flex-col bg-black p-5 text-white">
      <a href="/" className="mb-6 block" aria-label="Lily Beauty Bar home">
        <img
          src="/static/img/lbblogo.jpeg"
          alt="Lily Beauty Bar"
          className="h-20 w-full rounded-xl object-contain"
        />
      </a>

      <div className="mb-6 rounded-2xl bg-white/5 px-4 py-3">
        <p className="text-xs text-white/50">Welcome,</p>
        <p className="mt-1 truncate font-semibold">{username || "Admin"}</p>
      </div>

      <nav className="space-y-1.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: BRAND_PINK } : undefined
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Kept directly below Settings instead of forcing it to the bottom. */ /*}
      <div className="mt-6 space-y-2">
        <a
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition"
          style={{
            borderColor: BRAND_PINK,
            color: BRAND_PINK,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = BRAND_PINK;
            event.currentTarget.style.color = "white";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "transparent";
            event.currentTarget.style.color = BRAND_PINK;
          }}
        >
          <ExternalLink size={17} />
          View Store
        </a>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
} */
