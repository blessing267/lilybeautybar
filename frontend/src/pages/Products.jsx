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
  const [stockFilter, setStockFilter] = useState("");
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
  useEffect(() => { setPage(1); }, [search, stockFilter]);

  const filtered = useMemo(() => products.filter((p) => {
    const text = `${p.name || ""} ${p.description || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());

    const stock = Number(p.stock || 0);
    const variantCount = Array.isArray(p.variants)
      ? p.variants.length
      : 0;

    const matchesStock =
      !stockFilter ||
      (stockFilter === "in" && stock > 10) ||
      (stockFilter === "low" && stock > 0 && stock <= 10) ||
      (stockFilter === "out" && stock === 0) ||
      (stockFilter === "with-variants" && variantCount > 0) ||
      (stockFilter === "without-variants" && variantCount === 0);

    return matchesSearch && matchesStock;
  }), [products, search, stockFilter]);
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
        <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_200px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-300"
            />
          </label>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-pink-300"
          >
            <option value="">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="with-variants">With Variant</option>
            <option value="without-variants">Without Variant</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Variants</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                visible.map((product) => {
                  const stock = Number(product.stock || 0);
                  const variantCount = Array.isArray(product.variants)
                    ? product.variants.length
                    : 0;

                  const image =
                    product.image_url ||
                    product.image ||
                    product.variants?.find(
                      (variant) => variant.image_url || variant.image
                    )?.image_url ||
                    product.variants?.find(
                      (variant) => variant.image_url || variant.image
                    )?.image;

                  const status =
                    stock === 0
                      ? "Out of stock"
                      : stock <= 10
                        ? "Low stock"
                        : "In stock";

                  const statusClass =
                    stock === 0
                      ? "bg-red-50 text-red-600"
                      : stock <= 10
                        ? "bg-orange-50 text-orange-600"
                        : "bg-emerald-50 text-emerald-600";

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-pink-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[240px] truncate font-semibold text-gray-900">
                              {product.name}
                            </p>

                            <p className="max-w-[240px] truncate text-xs text-gray-500">
                              {product.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
                          {variantCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {money(
                          product.current_price ||
                          product.sale_price ||
                          product.price
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {stock}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-lg border border-pink-100 p-2 text-pink-500 transition hover:bg-pink-50"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => remove(product)}
                            className="rounded-lg border border-pink-100 p-2 text-pink-500 transition hover:bg-pink-50"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, filtered.length)} of{" "}
              {filtered.length} products
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-20 text-center text-sm text-gray-600">
                Page {page} of {pages}
              </span>

              <button
                type="button"
                disabled={page === pages}
                onClick={() =>
                  setPage((current) => Math.min(pages, current + 1))
                }
                className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
    <ProductModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} onSubmit={save} form={form} setForm={setForm} isEditing={Boolean(editing)} categories={categories}/>
  </DashboardLayout>;
}
