import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productsApi";
import ProductModal from "../components/ProductModal";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductSkeleton from "../components/ProductSkeleton";
import toast from "react-hot-toast";

export default function Dashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest"); // latest, price_asc, price_desc
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: null,
    image_url: "",
  });
  const [saving, setSaving] = useState(false); // button disable state

  // Fetch products
  useEffect(() => {
    let mounted = true;

    getProducts()
      .then((res) => {
        if (mounted) setProducts(res.data);
      })
      .catch(() => {
        if (mounted) setError("Failed to load products");
       })
      .finally(() => {
        if (mounted) setLoading(false);
       });

    return () => (mounted = false);  
  }, []);

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted successfully!");
    } catch {
      toast.error("Failed to delete product!");
    }
  };

  // Open edit modal
  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: null,
      image_url: product.image_url,
    });
    setShowModal(true);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form (Add / Edit)
const handleFormSubmit = async (formData) => {
  setSaving(true);
  try {
    if (editingProduct) {
      const res = await updateProduct(editingProduct.id, formData);
      setProducts(
        products.map((p) => (p.id === editingProduct.id ? res.data : p))
      );
      toast.success("Product updated successfully!");
    } else {
      const res = await createProduct(formData);
      setProducts([res.data, ...products]);
      toast.success("Product created successfully!");
    }
    setShowModal(false);
  } catch {
    toast.error("Failed to save product!");
  } finally {
    setSaving(false);
  }
};


  // Filter + Sort
  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "latest") return new Date(b.created_at) - new Date(a.created_at);
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Loading Skeleton
  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl font-medium text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={onLogout}>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* Search + Sort + Add */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // reset page when searching
          }}
          className="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="latest">Latest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>

        <button
          onClick={() => {
            setEditingProduct(null);
            setForm({ name: "", description: "", price: "", image_url: "" });
            setShowModal(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-4 flex flex-col"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="h-48 w-full object-cover rounded mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
              <p className="text-gray-600 mt-1 mb-3">{product.description}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="font-bold text-purple-600">₦{product.price}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 rounded border hover:bg-gray-200"
        >
          Previous
        </button>
        <span className="px-3 py-1 rounded border bg-white">{currentPage}</span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 rounded border hover:bg-gray-200"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={handleFormChange}
        isEditing={!!editingProduct}
      />
    </DashboardLayout>
  );
}
