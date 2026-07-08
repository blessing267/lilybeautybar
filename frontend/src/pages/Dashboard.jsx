import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../api/productsApi";
import ProductModal from "../components/ProductModal";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductSkeleton from "../components/ProductSkeleton";
import CategoryManager from "../components/CategoryManager";
import toast from "react-hot-toast";

export default function Dashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);

  const perPage = 8;

  // Modal state
  const [showModal, setShowModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    image: null,
    image_url: "",
    variants: [
      {
        colour: "",
        product_type: "",
        price: "",
        stock: "",
      },
    ],
  });

  const [saving, setSaving] =
    useState(false);

  // Reset form when opening modal
  useEffect(() => {
    if (
      showModal &&
      !editingProduct
    ) {
      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        subcategory: "",
        image: null,
        image_url: "",
        variants: [
          {
            colour: "",
            product_type: "",
            price: "",
            stock: "",
          },
        ],
      });
    }
  }, [showModal, editingProduct]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sort]);

  // Fetch products
  useEffect(() => {
    let mounted = true;

    getProducts()
      .then((res) => {
        if (mounted) {
          const data = res.data;

          if (Array.isArray(data)) {
            setProducts(data);
          } else if (
            Array.isArray(
              data.products
            )
          ) {
            setProducts(
              data.products
            );
          } else if (
            Array.isArray(
              data.results
            )
          ) {
            setProducts(
              data.results
            );
          } else {
            console.error(
              "Unexpected API response:",
              data
            );
            setProducts([]);
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setError(
            "Failed to load products"
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Delete product
  const handleDelete = async (
    id
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    )
      return;

    try {
      await deleteProduct(id);

      setProducts((prev) =>
        prev.filter(
          (p) => p.id !== id
        )
      );

      toast.success(
        "Product deleted successfully!"
      );
    } catch {
      toast.error(
        "Failed to delete product!"
      );
    }
  };

  // Edit
  const handleEdit = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category || "",
      subcategory: product.subcategory || "",
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
              },
            ],
    });

    setShowModal(true);
  };

  // Submit form
  const handleFormSubmit =
    async (formData) => {
      setSaving(true);

      try {
        let res;

        if (
          editingProduct
        ) {
          res =
            await updateProduct(
              editingProduct.id,
              formData
            );

          setProducts(
            (prev) =>
              prev.map((p) =>
                p.id ===
                editingProduct.id
                  ? res.data
                  : p
              )
          );

          toast.success(
            "Product updated successfully!"
          );
        } else {
          res =
            await createProduct(
              formData
            );

          setProducts(
            (prev) => [
              res.data,
              ...prev,
            ]
          );

          toast.success(
            "Product created successfully!"
          );
        }

        setShowModal(false);
      } catch (error) {
        console.error(
          "Form submission error:",
          error
        );

        if (
          error.response
        ) {
          toast.error(
            `Failed to save product: ${JSON.stringify(
              error.response
                .data
            )}`
          );
        } else {
          toast.error(
            error.message
          );
        }
      } finally {
        setSaving(false);
      }
    };

  // Filter + Sort
  const safeProducts =
    Array.isArray(products)
      ? products
      : [];

  const filteredProducts =
    safeProducts
      .filter(
        (p) =>
          (p.name || "")
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          (
            p.description ||
            ""
          )
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      )
      .sort((a, b) => {
        if (
          sort === "latest"
        ) {
          return (
            new Date(
              b.created_at
            ) -
            new Date(
              a.created_at
            )
          );
        }

        if (
          sort ===
          "price_asc"
        ) {
          return (
            Number(a.price) -
            Number(b.price)
          );
        }

        if (
          sort ===
          "price_desc"
        ) {
          return (
            Number(b.price) -
            Number(a.price)
          );
        }

        return 0;
      });

  const totalPages =
    Math.ceil(
      filteredProducts.length /
        perPage
    );

  const paginatedProducts =
    filteredProducts.slice(
      (currentPage - 1) *
        perPage,
      currentPage *
        perPage
    );

  // Stats
  const totalProducts =
    products.length;

  const productsWithVariants =
    products.filter(
      (p) =>
        p.variants?.length >
        0
    ).length;

  const singleProducts =
    products.filter(
      (p) =>
        !p.variants?.length
    ).length;

  const averagePrice =
    products.length
      ? Math.round(
          products.reduce(
            (
              acc,
              item
            ) =>
              acc +
              Number(
                item.price ||
                  0
              ),
            0
          ) /
            products.length
        )
      : 0;

  // Loading
  if (loading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({
            length: 8,
          }).map(
            (_, i) => (
              <ProductSkeleton
                key={i}
              />
            )
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Error
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-red-600">
            {error}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
  <DashboardLayout onLogout={onLogout}>
    <div className="space-y-8">
      {/* Premium Hero */}
      <div className="bg-gradient-to-r from-rose-100 via-pink-50 to-rose-50 rounded-[32px] p-8 border border-rose-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <span className="inline-flex bg-rose-200 text-rose-700 px-4 py-2 rounded-full text-sm font-medium">
              ✨ Lily Beauty Bar Admin
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-5">
              Beauty Business Dashboard
            </h1>

            <p className="text-gray-600 mt-3 max-w-2xl">
              Manage products, inventory,
              pricing and beauty items in
              one premium dashboard.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-7 py-4 rounded-3xl shadow-lg transition duration-300"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm">
          <p className="text-gray-500 text-sm">
            Total Products
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {totalProducts}
          </h2>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm">
          <p className="text-gray-500 text-sm">
            With Variants
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {productsWithVariants}
          </h2>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm">
          <p className="text-gray-500 text-sm">
            Single Products
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {singleProducts}
          </h2>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm">
          <p className="text-gray-500 text-sm">
            Average Price
          </p>

          <h2 className="text-3xl font-bold mt-2">
            ₦{averagePrice}
          </h2>
        </div>
      </div>

      <CategoryManager
        categories={categories}
        setCategories={setCategories}
      />

      {/* Search + Sort */}
      <div className="bg-white rounded-[28px] border border-rose-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 border border-rose-100 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-rose-300"
          />

          <select
            value={sort}
            onChange={(e) =>
              setSort(
                e.target.value
              )
            }
            className="border border-rose-100 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="latest">
              Latest Products
            </option>

            <option value="price_asc">
              Price: Low → High
            </option>

            <option value="price_desc">
              Price: High → Low
            </option>
          </select>
        </div>
      </div>

      {/* EMPTY STATE */}
      {paginatedProducts.length ===
      0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center shadow-sm border border-rose-100">
          <h2 className="text-2xl font-semibold text-gray-700">
            No Products Found
          </h2>

          <p className="text-gray-500 mt-2">
            Add products or try a
            different search.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden lg:block bg-white rounded-[32px] border border-rose-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-rose-50">
                  <tr className="text-left">
                    <th className="p-5">
                      Image
                    </th>

                    <th className="p-5">
                      Product
                    </th>

                    <th className="p-5">
                      Price
                    </th>

                    <th className="p-5">
                      Type
                    </th>

                    <th className="p-5">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map(
                    (
                      product
                    ) => (
                      <tr
                        key={
                          product.id
                        }
                        className="border-t hover:bg-rose-50 transition"
                      >
                        <td className="p-5">
                          <img
                            src={
                              product.image_url
                            }
                            alt={
                              product.name
                            }
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        </td>

                        <td className="p-5">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {
                                product.name
                              }
                            </h3>

                            <p className="text-sm text-gray-500 line-clamp-1">
                              {
                                product.description
                              }
                            </p>
                          </div>
                        </td>

                        <td className="p-5 font-bold text-rose-700">
                          ₦
                          {
                            product.price
                          }
                        </td>

                        <td className="p-5">
                          {product
                            .variants
                            ?.length ? (
                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                              {
                                product
                                  .variants
                                  .length
                              }{" "}
                              Variants
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
                              Single Product
                            </span>
                          )}
                        </td>

                        <td className="p-5">
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleEdit(
                                  product
                                )
                              }
                              className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl transition"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(
                                  product.id
                                )
                              }
                              className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-xl transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:hidden">
            {paginatedProducts.map(
              (
                product
              ) => (
                <div
                  key={
                    product.id
                  }
                  className="bg-white rounded-[30px] border border-rose-100 overflow-hidden shadow-sm"
                >
                  <img
                    src={
                      product.image_url
                    }
                    alt={
                      product.name
                    }
                    className="w-full h-64 object-cover"
                  />

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="font-bold text-lg text-gray-800">
                          {
                            product.name
                          }
                        </h2>

                        <p className="text-gray-500 text-sm mt-1">
                          {
                            product.description
                          }
                        </p>
                      </div>

                      {product
                        .variants
                        ?.length ? (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full whitespace-nowrap">
                          {
                            product
                              .variants
                              .length
                          }{" "}
                          Variants
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full whitespace-nowrap">
                          Single
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-rose-700">
                        ₦
                        {
                          product.price
                        }
                      </h3>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() =>
                          handleEdit(
                            product
                          )
                        }
                        className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-3 rounded-2xl transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            product.id
                          )
                        }
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-3 rounded-2xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 flex-wrap">
          {Array.from({
            length: totalPages,
          }).map(
            (_, i) => (
              <button
                key={i}
                onClick={() =>
                  setCurrentPage(
                    i + 1
                  )
                }
                className={`w-12 h-12 rounded-full transition font-medium ${
                  currentPage ===
                  i + 1
                    ? "bg-rose-600 text-white shadow-lg"
                    : "bg-white border border-rose-200 hover:bg-rose-100"
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
        categories={categories}
      />
    </div>
  </DashboardLayout>
);
}