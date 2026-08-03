import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import DashboardLayout from "../layouts/DashboardLayout";
import CategoryManager from "../components/CategoryManager";
import { getCategories } from "../api/productsApi";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Incrementing this value tells CategoryManager
  // to open its Add Category modal.
  const [openCategorySignal, setOpenCategorySignal] =
    useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const response = await getCategories();

      const results = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setCategories(
        results.sort(
          (a, b) => Number(b.id) - Number(a.id)
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Categories"
      subtitle="Manage product categories and subcategories."
      actionLabel="Add Category"
      onAction={() =>
        setOpenCategorySignal((current) => current + 1)
      }
    >
      {loading ? (
        <div className="rounded-3xl border bg-white p-12 text-center text-gray-500 shadow-sm">
          Loading categories...
        </div>
      ) : (
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          openCategorySignal={openCategorySignal}
        />
      )}
    </DashboardLayout>
  );
}