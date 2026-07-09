import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getProducts, getCategories } from "../api/productsApi";
import {
  ShoppingBag,
  FolderTree,
  Layers,
  PackageCheck,
} from "lucide-react";

export default function Dashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getProducts()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setProducts(res.data);
        } else if (Array.isArray(res.data.results)) {
          setProducts(res.data.results);
        } else if (Array.isArray(res.data.products)) {
          setProducts(res.data.products);
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]));

    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const totalProducts = products.length;
  const totalCategories = categories.length;

  const totalSubcategories = categories.reduce(
    (total, category) =>
      total + (category.subcategories?.length || 0),
    0
  );

  const productsWithVariants = products.filter(
    (product) => product.variants?.length > 0
  ).length;

  const cards = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: ShoppingBag,
    },
    {
      title: "Categories",
      value: totalCategories,
      icon: FolderTree,
    },
    {
      title: "Subcategories",
      value: totalSubcategories,
      icon: Layers,
    },
    {
      title: "Products With Variants",
      value: productsWithVariants,
      icon: PackageCheck,
    },
  ];

  return (
    <DashboardLayout onLogout={onLogout}>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-rose-100 via-pink-50 to-rose-50 rounded-[32px] p-8 border border-rose-100 shadow-sm">
          <span className="inline-flex bg-rose-200 text-rose-700 px-4 py-2 rounded-full text-sm font-medium">
            ✨ Lily Beauty Bar Admin
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-5">
            Dashboard Overview
          </h1>

          <p className="text-gray-600 mt-3 max-w-2xl">
            Welcome back. Manage Lily Beauty Bar products, categories,
            stock and orders from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">
                      {card.title}
                    </p>

                    <h2 className="text-4xl font-bold mt-2 text-gray-900">
                      {card.value}
                    </h2>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                    <Icon size={28} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[32px] border border-rose-100 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Next Actions
          </h2>

          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <div className="bg-rose-50 rounded-3xl p-5">
              <h3 className="font-semibold text-rose-700">
                Add Products
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Upload new beauty products and assign them to categories.
              </p>
            </div>

            <div className="bg-rose-50 rounded-3xl p-5">
              <h3 className="font-semibold text-rose-700">
                Organise Categories
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Create Makeup, Lashes, Skincare and their subcategories.
              </p>
            </div>

            <div className="bg-rose-50 rounded-3xl p-5">
              <h3 className="font-semibold text-rose-700">
                Review Orders
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Track paid orders and customer purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}