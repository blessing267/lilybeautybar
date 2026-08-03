import { useEffect, useState } from "react";
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
  Users,
  UserRound,
} from "lucide-react";

import { getAdminProfile } from "../api/profileApi";

const links = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    to: "/products",
    label: "Products",
    icon: ShoppingBag,
  },
  {
    to: "/categories",
    label: "Categories",
    icon: FolderTree,
  },
  {
    to: "/orders",
    label: "Orders",
    icon: ReceiptText,
  },
  {
    to: "/review-gallery",
    label: "Review Gallery",
    icon: Images,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function Sidebar({
  onClose,
  onLogout,
  username = "Admin",
}) {
  const [adminProfile, setAdminProfile] = useState({
    username,
    first_name: "",
    profile_image: null,
  });

  useEffect(() => {
    getAdminProfile()
      .then(({ data }) => {
        setAdminProfile({
          username: data.username || username || "Admin",
          first_name: data.first_name || "",
          profile_image: data.profile_image || null,
        });
      })
      .catch(() => {
        setAdminProfile((current) => ({
          ...current,
          username: username || "Admin",
        }));
      });
  }, [username]);

  /*
   * This event lets the Settings page update the sidebar
   * immediately after changing or removing the picture.
   */
  useEffect(() => {
    const updateSidebarProfile = (event) => {
      setAdminProfile((current) => ({
        ...current,
        ...event.detail,
      }));
    };

    window.addEventListener(
      "admin-profile-updated",
      updateSidebarProfile
    );

    return () => {
      window.removeEventListener(
        "admin-profile-updated",
        updateSidebarProfile
      );
    };
  }, []);

  const navStyle = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-pink-500 text-white shadow-sm"
        : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  const displayName =
    adminProfile.first_name ||
    adminProfile.username ||
    "Admin";

  return (
    <aside className="flex h-full w-72 flex-col bg-black p-5 text-white">
      <a
        href="/"
        className="mb-6 block"
        aria-label="Lily Beauty Bar home"
      >
        <img
          src="/static/img/lbblogo.jpeg"
          alt="Lily Beauty Bar"
          className="h-20 w-full rounded-xl object-contain"
        />
      </a>

      {/* Admin profile row */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-pink-500/15 text-pink-300">
          {adminProfile.profile_image ? (
            <img
              src={adminProfile.profile_image}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound size={22} />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            Welcome,
          </p>

          <p className="truncate font-semibold">
            {displayName}
          </p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {links.map(
          ({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={navStyle}
              onClick={onClose}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          )
        )}
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