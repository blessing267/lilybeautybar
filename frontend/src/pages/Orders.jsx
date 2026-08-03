import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ReceiptText, Clock3, CircleCheck, CircleX, Search, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAdminOrders, updateAdminOrder } from "../api/ordersApi";

const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
const statusClass = { pending: "bg-orange-50 text-orange-600", paid: "bg-emerald-50 text-emerald-600", cancelled: "bg-red-50 text-red-600" };
function Stat({ icon: Icon, label, value, tone }) { return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></div></div>; }

export default function Orders({ onLogout }) {
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(params.get("status") || "");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    getAdminOrders()
      .then((response) => {
        const loadedOrders = response.data || [];
        setOrders(loadedOrders);

        const requestedOrderId = Number(params.get("order"));
        if (requestedOrderId) {
          const requestedOrder = loadedOrders.find(
            (order) => Number(order.id) === requestedOrderId,
          );
          if (requestedOrder) setSelected(requestedOrder);
        }
      })
      .catch(() => toast.error("Unable to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    const next = new URLSearchParams(params);
    if (filter) next.set("status", filter); else next.delete("status");
    setParams(next, { replace: true });
  }, [filter, search]);

  const filtered = useMemo(() => orders.filter((order) =>
    (!filter || order.status === filter) &&
    `${order.id} ${order.full_name} ${order.email}`.toLowerCase().includes(search.toLowerCase()),
  ), [orders, filter, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const change = async (order, status) => {
    try {
      const response = await updateAdminOrder(order.id, { status });
      setOrders((items) => items.map((item) => item.id === order.id ? response.data : item));
      setSelected(response.data);
      toast.success("Order updated");
    } catch { toast.error("Unable to update order"); }
  };

  return <DashboardLayout onLogout={onLogout} title="Orders" subtitle="Manage customer orders and payment status.">
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ReceiptText} label="Total Orders" value={orders.length} tone="bg-violet-50 text-violet-600" />
        <Stat icon={Clock3} label="Pending" value={orders.filter((o) => o.status === "pending").length} tone="bg-orange-50 text-orange-600" />
        <Stat icon={CircleCheck} label="Paid" value={orders.filter((o) => o.status === "paid").length} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={CircleX} label="Cancelled" value={orders.filter((o) => o.status === "cancelled").length} tone="bg-red-50 text-red-600" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row">
          <label className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-300" /></label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border px-4 text-sm"><option value="">All Orders</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select>
        </div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Order", "Customer", "Items", "Total", "Payment", "Date", "Actions"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan="7" className="py-16 text-center">Loading orders…</td></tr> : visible.length === 0 ? <tr><td colSpan="7" className="py-16 text-center text-gray-500">No orders found.</td></tr> : visible.map((order) => <tr key={order.id}><td className="px-5 py-4 font-semibold text-pink-500">#LBB{order.id}</td><td className="px-5 py-4"><p className="font-semibold">{order.full_name || "Customer"}</p><p className="text-xs text-gray-400">{order.email}</p></td><td className="px-5 py-4">{order.item_count}</td><td className="px-5 py-4 font-semibold">{money(order.amount)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[order.status]}`}>{order.status}</span></td><td className="px-5 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><button onClick={() => setSelected(order)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"><Eye size={14} /> View</button></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-gray-500">
          <span>Showing {visible.length} of {filtered.length} matching orders</span>
          {pageCount > 1 && <div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16} /></button></div>}
        </div>
      </section>
    </div>

    {selected && <div className="fixed inset-0 z-[80] flex justify-end bg-black/40"><div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"><div className="flex justify-between"><div><p className="text-sm text-pink-500">Order #LBB{selected.id}</p><h2 className="text-2xl font-bold">{selected.full_name || "Customer"}</h2></div><button onClick={() => setSelected(null)}><X /></button></div><div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 text-sm"><div><p className="text-gray-400">Email</p><p>{selected.email}</p></div><div><p className="text-gray-400">Phone</p><p>{selected.phone || "—"}</p></div><div><p className="text-gray-400">Total</p><p className="font-bold">{money(selected.amount)}</p></div><div><p className="text-gray-400">Created</p><p>{new Date(selected.created_at).toLocaleString()}</p></div></div><h3 className="mt-6 font-bold">Items</h3><div className="mt-3 space-y-3">{selected.items?.map((item) => <div key={item.id} className="flex justify-between rounded-xl border p-4"><div><p className="font-semibold">{item.product_name}</p><p className="text-xs text-gray-400">Qty {item.quantity}</p></div><p>{money(item.unit_price * item.quantity)}</p></div>)}</div><label className="mt-6 block text-sm font-medium">Order status<select value={selected.status} onChange={(e) => change(selected, e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3"><option value="pending">Pending</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></label></div></div>}
  </DashboardLayout>;
}
