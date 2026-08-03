import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Box,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import SalesChart from "../components/SalesChart";
import { getCategories, getProducts } from "../api/productsApi";
import { getDashboardStats } from "../api/dashboardStatsApi";

const BRAND_PINK = "#FB1F81";
const PERIODS = [
  { value: "daily", label: "Daily", salesLabel: "Sales for today" },
  { value: "weekly", label: "Weekly", salesLabel: "Sales for this week" },
  { value: "monthly", label: "Monthly", salesLabel: "Sales for this month" },
  { value: "yearly", label: "Yearly", salesLabel: "Sales for this year" },
];
const PRODUCT_SORTS = [
  { value: "most-bought", label: "Frequently bought" },
  { value: "least-bought", label: "Least bought" },
  { value: "stock-high", label: "Current stock: high to low" },
  { value: "stock-low", label: "Current stock: low to high" },
  { value: "revenue", label: "Highest sales revenue" },
];
const categoryColours = ["bg-pink-500", "bg-violet-500", "bg-orange-400", "bg-blue-400", "bg-amber-400"];
const statusClasses = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-orange-50 text-orange-700",
  cancelled: "bg-red-50 text-red-700",
};
const money = (value) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(Number(value || 0));
const normaliseList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

function StatCard({ title, value, change, comparisonLabel, icon: Icon, iconClass }) {
  const positive = Number(change || 0) >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${iconClass}`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <p className={`mt-1 flex items-center gap-1 text-xs ${positive ? "text-emerald-600" : "text-red-500"}`}>
              <TrendIcon size={13} /> {Math.abs(Number(change || 0))}%
              <span className="text-slate-400">{comparisonLabel}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Dashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [productSort, setProductSort] = useState("most-bought");
  const [productPage, setProductPage] = useState(1);
  const [stats, setStats] = useState({
    summary: {},
    sales_chart: [],
    recent_orders: [],
    product_performance: [],
  });

  useEffect(() => {
    Promise.allSettled([getProducts(), getCategories()]).then(([productsResult, categoriesResult]) => {
      if (productsResult.status === "fulfilled") {
        setProducts(normaliseList(productsResult.value.data, "products"));
      }
      if (categoriesResult.status === "fulfilled") {
        setCategories(normaliseList(categoriesResult.value.data, "categories"));
      }
    });
  }, []);

  useEffect(() => {
    getDashboardStats(period)
      .then((response) => setStats(response.data))
      .catch(() => toast.error("Sales statistics could not be loaded"));
  }, [period]);

  useEffect(() => setProductPage(1), [productSort]);

  const inventoryValue = useMemo(() => products.reduce(
    (total, product) => total + Number(product.current_price || product.price || 0) * Number(product.stock || 0),
    0,
  ), [products]);
  const lowStock = useMemo(() => products.filter((product) => Number(product.stock || 0) <= 5).length, [products]);
  const rankedProducts = useMemo(() => {
    const items = [...(stats.product_performance || [])];
    const sorters = {
      "most-bought": (a, b) => b.sold_quantity - a.sold_quantity,
      "least-bought": (a, b) => a.sold_quantity - b.sold_quantity,
      "stock-high": (a, b) => b.stock - a.stock,
      "stock-low": (a, b) => a.stock - b.stock,
      revenue: (a, b) => b.sales_revenue - a.sales_revenue,
    };
    return items.sort(sorters[productSort]);
  }, [stats.product_performance, productSort]);
  const productsPerPage = 5;
  const productPageCount = Math.max(1, Math.ceil(rankedProducts.length / productsPerPage));
  const visibleProducts = rankedProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage,
  );
  const categoryData = useMemo(() => {
    const total = Math.max(products.length, 1);
    return categories.slice(0, 5).map((category, index) => {
      const count = products.filter((product) => Number(product.category) === Number(category.id)).length;
      return { ...category, count, percent: Math.round((count / total) * 100), colour: categoryColours[index] };
    });
  }, [categories, products]);

  const periodDetails = PERIODS.find((item) => item.value === period);
  const summary = stats.summary || {};
  const cards = [
    {
      title: periodDetails.salesLabel,
      value: money(summary.period_sales),
      change: summary.period_sales_change,
      comparisonLabel: "from previous period",
      icon: Banknote,
      iconClass: "bg-pink-50 text-pink-600",
    },
    {
      title: "Total Orders",
      value: summary.total_orders || 0,
      change: summary.period_orders_change,
      comparisonLabel: "from previous period",
      icon: ShoppingBag,
      iconClass: "bg-violet-50 text-violet-600",
    },
    { title: "Inventory Value", value: money(inventoryValue), icon: Box, iconClass: "bg-orange-50 text-orange-500" },
    { title: "Low Stock", value: lowStock, icon: PackageCheck, iconClass: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <DashboardLayout
      onLogout={onLogout}
      title="Dashboard"
      subtitle="Overview of your store performance"
      notificationCount={summary.pending_orders || 0}
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {cards.map((card) => <StatCard key={card.title} {...card} />)}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.9fr]">
          <article className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Sales Overview</h2>
                <p className="text-xs text-slate-400">{periodDetails.salesLabel} from paid orders</p>
              </div>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2"
                style={{ "--tw-ring-color": BRAND_PINK }}
              >
                {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto pb-2"><SalesChart data={stats.sales_chart || []} /></div>
          </article>

          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="font-bold text-slate-900">Recent Orders</h2><p className="text-xs text-slate-400">Latest customer orders</p></div>
              <Link to="/orders" className="text-sm font-medium" style={{ color: BRAND_PINK }}>View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(stats.recent_orders || []).length ? stats.recent_orders.map((order) => (
                <div key={order.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-pink-50" style={{ color: BRAND_PINK }}><ShoppingBag size={19} /></div>
                    <div><p className="text-sm font-semibold text-slate-800">#LBB{order.id}</p><p className="text-xs text-slate-400">{order.date}</p></div>
                  </div>
                  <div className="text-right"><p className="text-sm font-semibold text-slate-800">{money(order.amount)}</p><span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasses[order.status]}`}>{order.status}</span></div>
                </div>
              )) : <div className="py-12 text-center text-sm text-slate-400">No orders yet.</div>}
            </div>
          </article>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.25fr_0.9fr]">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Product Performance</h2>
                <p className="text-xs text-slate-400">Based on quantities, revenue, or stock</p>
              </div>
              <select
                value={productSort}
                onChange={(event) => setProductSort(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
              >
                {PRODUCT_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-pink-50" style={{ color: BRAND_PINK }}><ShoppingBag size={18} /></div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.sold_quantity} bought · {money(product.sales_revenue)} revenue</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-sm font-semibold">{product.stock}</p><p className="text-xs text-slate-400">in stock</p></div>
                </div>
              ))}
              {!visibleProducts.length && <div className="py-12 text-center text-sm text-slate-400">No products yet.</div>}
            </div>

            {productPageCount > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-400">Page {productPage} of {productPageCount}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={productPage === 1} onClick={() => setProductPage((page) => page - 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
                  <button type="button" disabled={productPage === productPageCount} onClick={() => setProductPage((page) => page + 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5"><h2 className="font-bold text-slate-900">Products by Category</h2><p className="text-xs text-slate-400">Live catalogue distribution</p></div>
            <div className="space-y-5">{categoryData.map((category) => <div key={category.id}><div className="mb-2 flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${category.colour}`} /><span className="font-medium text-slate-700">{category.name}</span></div><span className="text-slate-500">{category.count} ({category.percent}%)</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${category.colour}`} style={{ width: `${Math.max(category.percent, category.count ? 4 : 0)}%` }} /></div></div>)}</div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
