import { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../api/productsApi";
import toast from "react-hot-toast";

export default function CategoryManager({ categories, setCategories }) {
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      const res = await createCategory({ name: categoryName });

      setCategories((prev) => [
        ...prev,
        { ...res.data, subcategories: [] },
      ]);

      setCategoryName("");
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleEditCategory = async (category) => {
    const newName = prompt("Edit category name:", category.name);

    if (!newName || !newName.trim()) return;

    try {
      const res = await updateCategory(category.id, { name: newName });

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id
            ? { ...cat, name: res.data.name }
            : cat
        )
      );

      toast.success("Category updated");
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Products will not be deleted, but they may lose this category.`
      )
    ) {
      return;
    }

    try {
      await deleteCategory(category.id);

      setCategories((prev) =>
        prev.filter((cat) => cat.id !== category.id)
      );

      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleAddSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedCategory) return;

    try {
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
    } catch {
      toast.error("Failed to add subcategory");
    }
  };

  const handleEditSubcategory = async (subcategory) => {
    const newName = prompt("Edit subcategory name:", subcategory.name);

    if (!newName || !newName.trim()) return;

    try {
      const res = await updateSubCategory(subcategory.id, {
        name: newName,
        category: subcategory.category,
      });

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          subcategories: cat.subcategories.map((sub) =>
            sub.id === subcategory.id
              ? { ...sub, name: res.data.name }
              : sub
          ),
        }))
      );

      toast.success("Subcategory updated");
    } catch {
      toast.error("Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = async (subcategory) => {
    if (!window.confirm(`Delete "${subcategory.name}"?`)) return;

    try {
      await deleteSubCategory(subcategory.id);

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          subcategories: cat.subcategories.filter(
            (sub) => sub.id !== subcategory.id
          ),
        }))
      );

      toast.success("Subcategory deleted");
    } catch {
      toast.error("Failed to delete subcategory");
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-rose-100 p-6 shadow-sm">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Category Management
        </h2>

        <p className="text-gray-500 mt-2">
          Create and organise Lily Beauty Bar product categories.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-rose-50 rounded-3xl p-5">
          <h3 className="font-semibold mb-3">Add Category</h3>

          <div className="flex gap-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g Makeup"
              className="flex-1 border border-rose-100 rounded-2xl px-4 py-3 outline-none"
            />

            <button
              onClick={handleAddCategory}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 rounded-2xl"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-rose-50 rounded-3xl p-5">
          <h3 className="font-semibold mb-3">Add Subcategory</h3>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-rose-100 rounded-2xl px-4 py-3 mb-3 outline-none"
          >
            <option value="">Choose Category</option>

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
              className="flex-1 border border-rose-100 rounded-2xl px-4 py-3 outline-none"
            />

            <button
              onClick={handleAddSubcategory}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 rounded-2xl"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-rose-50 rounded-3xl">
            <p className="text-gray-500">
              No categories yet. Add your first category above.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="border border-rose-100 rounded-3xl p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-rose-700">
                  {cat.name}
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCategory(cat)}
                    className="px-4 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {cat.subcategories?.length ? (
                  cat.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
                    >
                      <span className="text-gray-700">
                        {sub.name}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSubcategory(sub)}
                          className="text-sm px-3 py-1 rounded-lg bg-white border hover:bg-rose-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteSubcategory(sub)}
                          className="text-sm px-3 py-1 rounded-lg bg-white border text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">
                    No subcategories yet.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}