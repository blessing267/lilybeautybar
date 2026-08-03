import { useEffect, useMemo, useState } from "react";
import {
  Package, PackageCheck, PackageX, Search, Pencil,
  Trash2, ChevronLeft, ChevronRight, Boxes, WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductModal from "../components/ProductModal";
import {
  getProducts, getCategories, createProduct, updateProduct, deleteProduct,
} from "../api/productsApi";

const blankForm = () => ({
  name: "", description: "", price: "", sale_price: "",
  sale_starts_at: "", sale_ends_at: "", stock: "",
  category: "", subcategory: "", image: null, image_url: "",
  variants: [{ colour: "", product_type: "", price: "", stock: "", image: null }],
});

const money = (value) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(Number(value || 0));

function Stat({ icon: Icon, label, value, tone = "rose" }) {
  const tones = {
    rose: "bg-rose-50 text-rose-600", green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600", violet: "bg-violet-50 text-violet-600",
  };
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={20}/></span>
      <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p></div>
    </div>
  </div>;
}

export default function Products({ onLogout }) {
  const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); const [search, setSearch] = useState("");
  const [category, setCategory] = useState(""); const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1); const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); const [form, setForm] = useState(blankForm());
  const perPage = 7;

  const load = async () => {
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      const data = p.data?.products || p.data?.results || p.data || [];
      setProducts(Array.isArray(data) ? data : []); setCategories(c.data || []);
    } catch { toast.error("Unable to load products"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, category, stockFilter]);

  const categoryName = (id) => categories.find(c => String(c.id) === String(id))?.name || "Uncategorised";
  const filtered = useMemo(() => products.filter(p => {
    const text = `${p.name || ""} ${p.description || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = !category || String(p.category) === category;
    const stock = Number(p.stock || 0);
    const matchesStock = !stockFilter || (stockFilter === "in" && stock > 10) || (stockFilter === "low" && stock > 0 && stock <= 10) || (stockFilter === "out" && stock === 0);
    return matchesSearch && matchesCategory && matchesStock;
  }), [products, search, category, stockFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const low = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
  const out = products.filter(p => Number(p.stock) === 0).length;
  const value = products.reduce((sum, p) => sum + Number(p.current_price || p.price || 0) * Number(p.stock || 0), 0);

  const openCreate = () => { setEditing(null); setForm(blankForm()); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p); setForm({
      ...blankForm(), ...p, price: String(p.price || ""), sale_price: p.sale_price ? String(p.sale_price) : "",
      stock: String(p.stock ?? ""), image: null, image_url: p.image_url || "",
      sale_starts_at: p.sale_starts_at?.slice(0,16) || "", sale_ends_at: p.sale_ends_at?.slice(0,16) || "",
      variants: p.variants?.length ? p.variants.map(v => ({ ...v, image: null, image_url: v.image_url || "" })) : blankForm().variants,
    }); setModalOpen(true);
  };
  const save = async (data) => {
    try {
      const response = editing ? await updateProduct(editing.id, data) : await createProduct(data);
      setProducts(prev => editing ? prev.map(p => p.id === editing.id ? response.data : p) : [response.data, ...prev]);
      setModalOpen(false); toast.success(editing ? "Product updated" : "Product added");
    } catch (e) { toast.error(e.response?.data ? JSON.stringify(e.response.data) : "Unable to save product"); throw e; }
  };
  const remove = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try { await deleteProduct(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)); toast.success("Product deleted"); }
    catch { toast.error("Unable to delete product"); }
  };

  return <DashboardLayout
    onLogout={onLogout}
    title="Products"
    subtitle="Manage and organise your store products."
    actionLabel="Add Product"
    onAction={openCreate}
  >
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Boxes} label="Total Products" value={products.length} tone="green"/><Stat icon={PackageCheck} label="Low Stock" value={low} tone="orange"/>
        <Stat icon={PackageX} label="Out of Stock" value={out} tone="rose"/><Stat icon={WalletCards} label="Inventory Value" value={money(value)} tone="violet"/>
      </div>
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_190px_170px]">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or description..." className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-rose-300"/></label>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border border-gray-200 px-3 text-sm outline-none"><option value="">All Categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={stockFilter} onChange={e=>setStockFilter(e.target.value)} className="rounded-xl border border-gray-200 px-3 text-sm outline-none"><option value="">All Stock</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select>
        </div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Product","Category","Price","Stock","Status","Actions"].map(x=><th key={x} className="px-5 py-3 font-semibold">{x}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan="6" className="px-5 py-16 text-center text-gray-500">Loading products…</td></tr> : visible.length === 0 ? <tr><td colSpan="6" className="px-5 py-16 text-center text-gray-500">No products found.</td></tr> : visible.map(p=>{
            const stock=Number(p.stock||0); const status=stock===0?["Out of Stock","bg-red-50 text-red-600"]:stock<=10?["Low Stock","bg-orange-50 text-orange-600"]:["In Stock","bg-emerald-50 text-emerald-600"];
            return <tr key={p.id} className="hover:bg-rose-50/30"><td className="px-5 py-3"><div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-lg bg-gray-100">{p.image_url?<img src={p.image_url} alt="" className="h-full w-full object-cover"/>:<Package className="m-3 text-gray-400" size={20}/>}</div><div><p className="font-semibold text-gray-900">{p.name}</p><p className="max-w-[220px] truncate text-xs text-gray-400">{p.description || `Product #${p.id}`}</p></div></div></td>
              <td className="px-5 py-3 text-gray-600">{categoryName(p.category)}</td><td className="px-5 py-3 font-semibold">{money(p.current_price || p.price)}</td><td className="px-5 py-3">{stock}</td><td className="px-5 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${status[1]}`}>{status[0]}</span></td>
              <td className="px-5 py-3"><div className="flex gap-2"><button onClick={()=>openEdit(p)} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50" aria-label="Edit"><Pencil size={15}/></button><button onClick={()=>remove(p)} className="rounded-lg border border-rose-100 p-2 text-rose-500 hover:bg-rose-50" aria-label="Delete"><Trash2 size={15}/></button></div></td></tr>})}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-gray-500"><span>Showing {visible.length} of {filtered.length} products</span><div className="flex items-center gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronLeft size={16}/></button><span className="rounded-lg bg-rose-500 px-3 py-1.5 text-white">{page}</span><span>of {pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border p-2 disabled:opacity-30"><ChevronRight size={16}/></button></div></div>
      </section>
    </div>
    <ProductModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} onSubmit={save} form={form} setForm={setForm} isEditing={Boolean(editing)} categories={categories}/>
  </DashboardLayout>;
}
