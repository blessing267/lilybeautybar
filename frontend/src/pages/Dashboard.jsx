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

  console.log("Products state:", products);
  console.log("Is array:", Array.isArray(products));
  
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Admin Dashboard
      </h1>

      {/* ✅ ADD BUTTON */}
      <button
        onClick={() => {
          setEditingProduct(null);
          setShowModal(true);
        }}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        + Add Product
      </button>

      {/* ✅ PRODUCT LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded shadow">

            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-40 object-cover rounded"
            />

            <h2 className="text-lg font-bold mt-2">{product.name}</h2>
            <p className="text-gray-600">{product.description}</p>
            <p className="font-semibold mt-1">£{product.price}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(product)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(product.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ ADD PAGINATION HERE */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-black text-white"
                : "bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* ✅ MODAL */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        form={form}
        setForm={setForm}
        isEditing={!!editingProduct}
      />
    </DashboardLayout>
  );
}