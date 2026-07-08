import { useState } from "react";
import {
  createCategory,
  createSubCategory,
} from "../api/productsApi";
import toast from "react-hot-toast";

export default function CategoryManager({
  categories,
  setCategories,
}) {
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    const res = await createCategory({
      name: categoryName,
    });

    setCategories((prev) => [
      ...prev,
      {
        ...res.data,
        subcategories: [],
      },
    ]);

    setCategoryName("");
    toast.success("Category added");
  };

  const handleAddSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedCategory) return;

    const res = await createSubCategory({
      name: subcategoryName,
      category: selectedCategory,
    });

    setCategories((prev) =>
      prev.map((cat) =>
        String(cat.id) === String(selectedCategory)
          ? {
              ...cat,
              subcategories: [
                ...(cat.subcategories || []),
                res.data,
              ],
            }
          : cat
      )
    );

    setSubcategoryName("");
    toast.success("Subcategory added");
  };

  return (
    <div className="bg-white rounded-[28px] border border-rose-100 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-5">
        Categories
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">
            Add Category
          </h3>

          <div className="flex gap-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g Makeup"
              className="flex-1 border rounded-xl px-4 py-3"
            />

            <button
              onClick={handleAddCategory}
              className="bg-rose-600 text-white px-5 rounded-xl"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">
            Add Subcategory
          </h3>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-2"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              placeholder="e.g Lip Gloss"
              className="flex-1 border rounded-xl px-4 py-3"
            />

            <button
              onClick={handleAddSubcategory}
              className="bg-rose-600 text-white px-5 rounded-xl"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="border rounded-2xl p-4">
            <h3 className="font-bold text-rose-700">
              {cat.name}
            </h3>

            <div className="ml-4 mt-2 text-sm text-gray-600">
              {cat.subcategories?.length ? (
                cat.subcategories.map((sub) => (
                  <p key={sub.id}>• {sub.name}</p>
                ))
              ) : (
                <p>No subcategories yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}