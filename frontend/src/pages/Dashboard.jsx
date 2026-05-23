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
  const [sort, setSort] = useState("latest");
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

    variants: [
    {
      colour: "",
      product_type: "",
      price: "",
      stock: "",
    }
  ]
  });
  const [saving, setSaving] = useState(false);

  // Reset form when opening modal
  useEffect(() => {
    if (showModal && !editingProduct) {
      setForm({
        name: "",
        description: "",
        price: "",
        image: null,
        image_url: "",
        variants: [
          {
            colour: "",
            product_type: "",
            price: "",
            stock: "",
          }
        ]
      });
    }
  }, [showModal, editingProduct]);

  // ✅ Reset pagination when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sort]);

  // ✅ Fetch products (FIXED)
  useEffect(() => {
    let mounted = true;

  //  const token = localStorage.getItem("access_token");

  //  if (!token) {
  //    setLoading(false);
  //    return;
  //  }

    getProducts()
      .then((res) => {
        if (mounted) {
          const data = res.data;

          // ✅ Always ensure array
          if (Array.isArray(data)) {
            setProducts(data);
          } else if (Array.isArray(data.products)) {
            setProducts(data.products);
          } else if (Array.isArray(data.results)) {
            setProducts(data.results);
          } else {
            console.error("Unexpected API response:", data);
            setProducts([]);
          }
        }
      })
      .catch(() => {
        if (mounted) setError("Failed to load products");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // ✅ CLEANUP (VERY IMPORTANT)
    return () => {
      mounted = false;
    };

  }, []);

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
      price: String(product.price),
      image: null,
      image_url: product.image_url,

      variants:
        product.variants?.length
          ? product.variants
          : [
              {
                colour: "",
                product_type: "",
                price: "",
                stock: "",
              }
            ]
    });

    setShowModal(true);
};

  // Submit form
  const handleFormSubmit = async (formData) => {
    setSaving(true);

    try {
      let res;

      if (editingProduct) {
        res = await updateProduct(editingProduct.id, formData);

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? res.data : p
          )
        );

        toast.success("Product updated successfully!");

      } else {

        res = await createProduct(formData);

        setProducts((prev) => [res.data, ...prev]);

        toast.success("Product created successfully!");
      }

      setShowModal(false);

    } catch (error) {

      console.error("Form submission error:", error);

      if (error.response) {
        console.error("Server response:", error.response.data);

        toast.error(
          `Failed to save product: ${JSON.stringify(error.response.data)}`
        );

      } else if (error.request) {

        console.error("No response received:", error.request);

        toast.error(
          "No response from server. Check your network or backend."
        );

      } else {

        toast.error(`Error: ${error.message}`);
      }

    } finally {
      setSaving(false);
    }
  };

  // ✅ SAFE Filter + Sort
  const safeProducts = Array.isArray(products)
  ? products
  : [];
  
const filteredProducts = safeProducts
  .filter(
    (p) =>
      (p.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (p.description || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (sort === "latest")
      return new Date(b.created_at) - new Date(a.created_at);

    if (sort === "price_asc")
      return a.price - b.price;

    if (sort === "price_desc")
      return b.price - a.price;

    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / perPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Loading
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

  // Error
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl font-medium text-red-600">
            {error}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
  <DashboardLayout onLogout={onLogout}>
    <div className="min-h-screen bg-pink-50/30 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your beauty products and inventory
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="bg-black hover:scale-105 transition duration-300 text-white px-6 py-3 rounded-2xl shadow-lg"
        >
          + Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-gray-500 text-sm">Total Products</h3>
          <p className="text-3xl font-bold mt-2">
            {products.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-gray-500 text-sm">
            Visible Products
          </h3>
          <p className="text-3xl font-bold mt-2">
            {filteredProducts.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-gray-500 text-sm">
            Average Price
          </h3>
          <p className="text-3xl font-bold mt-2">
            ₦
            {products.length
              ? Math.round(
                  products.reduce(
                    (acc, item) =>
                      acc + Number(item.price || 0),
                    0
                  ) / products.length
                )
              : 0}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-gray-500 text-sm">
            Current Page
          </h3>
          <p className="text-3xl font-bold mt-2">
            {currentPage}
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-8 border border-pink-100">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-pink-300"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="latest">
              Latest Products
            </option>
            <option value="price_asc">
              Price: Low to High
            </option>
            <option value="price_desc">
              Price: High to Low
            </option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700">
            No Products Found
          </h2>
          <p className="text-gray-500 mt-2">
            Add products or try another search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[30px] overflow-hidden shadow-sm hover:shadow-xl transition duration-300 border border-pink-100 hover:-translate-y-1"
            >
              <div className="relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />

                <span className="absolute top-4 right-4 bg-pink-500 text-white text-xs px-3 py-1 rounded-full">
                  Beauty
                </span>
              </div>

              <div className="p-5">
                <h2 className="font-bold text-lg text-gray-800 line-clamp-1">
                  {product.name}
                </h2>

                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {product.description}
                </p>

                <div className="mt-4 flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-pink-600">
                    ₦{product.price}
                  </h3>

                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                    Available
                  </span>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-black text-white py-2 rounded-xl hover:opacity-90 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(product.id)
                    }
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition"
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
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-10 flex-wrap">
          {Array.from({ length: totalPages }).map(
            (_, i) => (
              <button
                key={i}
                onClick={() =>
                  setCurrentPage(i + 1)
                }
                className={`w-12 h-12 rounded-full font-medium transition ${
                  currentPage === i + 1
                    ? "bg-black text-white shadow-lg"
                    : "bg-white border border-gray-300 hover:bg-pink-100"
                }`}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
      )}

      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        isEditing={!!editingProduct}
      />
    </div>
  </DashboardLayout>
);
}