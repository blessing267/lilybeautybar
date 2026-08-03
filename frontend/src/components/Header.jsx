import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Menu, Plus, Search, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOrderNotifications } from "../api/orderNotificationsApi";

const BRAND_PINK = "#FB1F81";
const SEEN_KEY = "lbb_seen_order_notifications";
const READY_KEY = "lbb_order_notifications_ready";

function readSeenIds() {
  try {
    const value = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(value) ? value.map(Number) : [];
  } catch {
    return [];
  }
}

export default function Header({
  title,
  subtitle,
  actionLabel,
  onAction,
  onMenuClick,
}) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [seenIds, setSeenIds] = useState(readSeenIds);
  const [open, setOpen] = useState(false);

  const saveSeenIds = (ids) => {
    const unique = [...new Set(ids.map(Number))].slice(-200);
    setSeenIds(unique);
    localStorage.setItem(SEEN_KEY, JSON.stringify(unique));
  };

  const loadNotifications = async () => {
    try {
      const response = await getOrderNotifications();
      const latest = response.data?.orders || [];
      setOrders(latest);

      // On the first installation, existing historical orders become the baseline.
      if (!localStorage.getItem(READY_KEY)) {
        saveSeenIds(latest.map((order) => order.id));
        localStorage.setItem(READY_KEY, "true");
      }
    } catch {
      // Keep the header usable if notifications temporarily fail.
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = useMemo(
    () => orders.filter((order) => !seenIds.includes(Number(order.id))),
    [orders, seenIds],
  );

  const openOrder = (order) => {
    saveSeenIds([...seenIds, order.id]);
    setOpen(false);
    navigate(`/orders?order=${order.id}`);
  };

  const markAllRead = () => {
    saveSeenIds([...seenIds, ...orders.map((order) => order.id)]);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-50 text-gray-700 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-950 md:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 hidden truncate text-sm text-gray-500 sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <label className="hidden w-56 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm xl:flex">
            <Search size={17} className="text-gray-400" />
            <input type="search" placeholder="Search anything..." className="w-full bg-transparent text-sm outline-none" />
          </label>

          <div ref={wrapperRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-gray-600 transition hover:bg-gray-50"
              aria-label={`${unread.length} new order notifications`}
            >
              <Bell size={20} />
              {unread.length > 0 && (
                <span
                  className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ backgroundColor: BRAND_PINK }}
                >
                  {unread.length > 99 ? "99+" : unread.length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:w-96">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">New orders</p>
                  </div>
                  {unread.length > 0 && (
                    <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: BRAND_PINK }}>
                      <CheckCheck size={15} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {unread.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-gray-500">No new order notifications.</div>
                  ) : (
                    unread.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => openOrder(order)}
                        className="flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-pink-50/50"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-50" style={{ color: BRAND_PINK }}>
                          <ShoppingBag size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-gray-900">Order #LBB{order.id} · {order.customer}</span>
                          <span className="mt-0.5 block text-xs capitalize text-gray-500">{order.status} · {order.created_at_display}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 sm:px-4"
              style={{ backgroundColor: BRAND_PINK }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{actionLabel}</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
