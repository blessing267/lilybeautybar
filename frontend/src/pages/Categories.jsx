import { useEffect, useMemo, useState } from "react";
import {
  FolderCheck,
  FolderPlus,
  FolderTree,
  Pencil,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  createCategory,
  createSubCategory,
  deleteCategory,
  deleteSubCategory,
  getCategories,
  getProducts,
  updateCategory,
  updateSubCategory,
} from "../api/productsApi";

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Categories({ onLogout }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [categoryResponse, productResponse] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);
      setCategories([...(categoryResponse.data || [])].sort((a, b) => Number(b.id) - Number(a.id)));
      const data =
        productResponse.data?.products ||
        productResponse.data?.results ||
        productResponse.data ||
        [];
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Unable to load categories");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const result = {};
    products.forEach((product) => {
      result[product.category] = (result[product.category] || 0) + 1;
    });
    return result;
  }, [products]);

  const filtered = useMemo(
    () =>
      categories.filter((category) =>
        `${category.name} ${(category.subcategories || [])
          .map((item) => item.name)
          .join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  const openCategory = (category = null) => {
    setName(category?.name || "");
    setCategoryId("");
    setModal({ type: "category", item: category });
  };

  const openSubcategory = (parent, subcategory = null) => {
    setName(subcategory?.name || "");
    setCategoryId(String(parent?.id || subcategory?.category || ""));
    setModal({ type: "subcategory", item: subcategory });
  };

  const closeModal = () => {
    setModal(null);
    setName("");
    setCategoryId("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Enter a name");
    if (modal.type === "subcategory" && !categoryId) {
      return toast.error("Choose a parent category");
    }

    setSaving(true);
    try {
      if (modal.type === "category") {
        if (modal.item) {
          await updateCategory(modal.item.id, { name: name.trim() });
          toast.success("Category updated");
        } else {
          await createCategory({ name: name.trim() });
          toast.success("Category added");
        }
      } else if (modal.item) {
        await updateSubCategory(modal.item.id, {
          name: name.trim(),
          category: categoryId,
        });
        toast.success("Subcategory updated");
      } else {
        await createSubCategory({ name: name.trim(), category: categoryId });
        toast.success("Subcategory added");
      }
      closeModal();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!confirm(`Delete ${category.name} and its subcategories?`)) return;
    try {
      await deleteCategory(category.id);
      setCategories((items) => items.filter((item) => item.id !== category.id));
      toast.success("Category deleted");
    } catch {
      toast.error("Unable to delete category");
    }
  };

  const removeSubcategory = async (subcategory) => {
    if (!confirm(`Delete ${subcategory.name}?`)) return;
    try {
      await deleteSubCategory(subcategory.id);
      await load();
      toast.success("Subcategory deleted");
    } catch {
      toast.error("Unable to delete subcategory");
    }
  };

  const totalSubcategories = categories.reduce(
    (total, category) => total + (category.subcategories?.length || 0),
    0,
  );

  return (
    <DashboardLayout
      onLogout={onLogout}
      title="Categories"
      subtitle="Organise products into categories and subcategories."
      actionLabel="Add Category"
      onAction={() => openCategory()}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={Tags} label="Total Categories" value={categories.length} tone="bg-rose-50 text-rose-600" />
          <Stat icon={FolderTree} label="Subcategories" value={totalSubcategories} tone="bg-violet-50 text-violet-600" />
          <Stat icon={FolderCheck} label="With Products" value={categories.filter((item) => counts[item.id]).length} tone="bg-emerald-50 text-emerald-600" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full max-w-md">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories or subcategories..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-rose-300"
              />
            </label>
            <button
              type="button"
              onClick={() => openSubcategory(categories[0])}
              disabled={!categories.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 disabled:opacity-40"
            >
              <FolderPlus size={17} />
              Add Subcategory
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((category) => (
              <article key={category.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500">
                      <Tags size={17} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-950">{category.name}</h3>
                      <p className="text-xs text-gray-500">{counts[category.id] || 0} products</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openSubcategory(category)} className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600">
                      + Subcategory
                    </button>
                    <button type="button" onClick={() => openCategory(category)} className="rounded-lg border border-gray-200 p-2" aria-label="Edit category">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => removeCategory(category)} className="rounded-lg border border-rose-100 p-2 text-rose-500" aria-label="Delete category">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {category.subcategories?.length ? (
                    category.subcategories.map((subcategory) => (
                      <span key={subcategory.id} className="inline-flex items-center gap-2 rounded-full bg-gray-50 py-1.5 pl-3 pr-1.5 text-xs text-gray-700">
                        {subcategory.name}
                        <button type="button" onClick={() => openSubcategory(category, subcategory)} className="rounded-full p-1 hover:bg-white" aria-label={`Edit ${subcategory.name}`}>
                          <Pencil size={12} />
                        </button>
                        <button type="button" onClick={() => removeSubcategory(subcategory)} className="rounded-full p-1 text-rose-500 hover:bg-white" aria-label={`Delete ${subcategory.name}`}>
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No subcategories yet.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4">
          <form onSubmit={save} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  {modal.item ? "Edit" : "Add"} {modal.type === "category" ? "Category" : "Subcategory"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modal.type === "subcategory" ? "Choose the category it belongs to." : "Create a main product category."}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 hover:bg-gray-50">
                <X size={20} />
              </button>
            </div>

            {modal.type === "subcategory" && (
              <label className="mt-6 block text-sm font-medium text-gray-700">
                Parent category
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-rose-300"
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={modal.type === "category" ? "e.g. Skin Care" : "e.g. Face Serums"}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-rose-300"
              />
            </label>

            <button disabled={saving} className="mt-6 w-full rounded-xl bg-rose-500 py-3 font-semibold text-white disabled:opacity-60">
              {saving ? "Saving…" : `Save ${modal.type === "category" ? "Category" : "Subcategory"}`}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
