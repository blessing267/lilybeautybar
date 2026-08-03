import { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../api/productsApi";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  FolderPlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  category: "",
};

export default function CategoryManager({
  categories,
  setCategories,
  openCategorySignal = 0,
}) {
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Opens the category modal when the header button is clicked.
  useEffect(() => {
    if (openCategorySignal > 0) {
      openAddCategory();
    }
  }, [openCategorySignal]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) => Number(b.id) - Number(a.id)
    );
  }, [categories]);

  const closeModal = () => {
    if (submitting) return;

    setModalType(null);
    setSelectedItem(null);
    setForm(EMPTY_FORM);
  };

  const openAddCategory = () => {
    setSelectedItem(null);
    setForm(EMPTY_FORM);
    setModalType("add-category");
  };

  const openEditCategory = (category) => {
    setSelectedItem(category);
    setForm({
      name: category.name || "",
      category: "",
    });
    setModalType("edit-category");
  };

  const openAddSubcategory = (category = null) => {
    setSelectedItem(null);
    setForm({
      name: "",
      category: category ? String(category.id) : "",
    });
    setModalType("add-subcategory");
  };

  const openEditSubcategory = (subcategory, parentCategory) => {
    setSelectedItem(subcategory);
    setForm({
      name: subcategory.name || "",
      category: String(
        subcategory.category || parentCategory.id
      ),
    });
    setModalType("edit-subcategory");
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      toast.error("Please enter a name");
      return;
    }

    if (
      modalType?.includes("subcategory") &&
      !form.category
    ) {
      toast.error("Please choose a parent category");
      return;
    }

    setSubmitting(true);

    try {
      if (modalType === "add-category") {
        const response = await createCategory({ name });

        const newCategory = {
          ...response.data,
          subcategories: response.data.subcategories || [],
        };

        setCategories((current) => [
          newCategory,
          ...current,
        ]);

        toast.success("Category added");
      }

      if (modalType === "edit-category") {
        const response = await updateCategory(
          selectedItem.id,
          { name }
        );

        setCategories((current) =>
          current.map((category) =>
            category.id === selectedItem.id
              ? {
                  ...category,
                  name: response.data.name,
                }
              : category
          )
        );

        toast.success("Category updated");
      }

      if (modalType === "add-subcategory") {
        const response = await createSubCategory({
          name,
          category: form.category,
        });

        setCategories((current) =>
          current.map((category) =>
            String(category.id) === String(form.category)
              ? {
                  ...category,
                  subcategories: [
                    response.data,
                    ...(category.subcategories || []),
                  ],
                }
              : category
          )
        );

        setExpandedCategories((current) => ({
          ...current,
          [form.category]: true,
        }));

        toast.success("Subcategory added");
      }

      if (modalType === "edit-subcategory") {
        const response = await updateSubCategory(
          selectedItem.id,
          {
            name,
            category: form.category,
          }
        );

        setCategories((current) =>
          current.map((category) => ({
            ...category,
            subcategories: (
              category.subcategories || []
            ).filter(
              (subcategory) =>
                subcategory.id !== selectedItem.id
            ),
          }))
        );

        setCategories((current) =>
          current.map((category) =>
            String(category.id) === String(form.category)
              ? {
                  ...category,
                  subcategories: [
                    response.data,
                    ...(category.subcategories || []),
                  ],
                }
              : category
          )
        );

        setExpandedCategories((current) => ({
          ...current,
          [form.category]: true,
        }));

        toast.success("Subcategory updated");
      }

      setModalType(null);
      setSelectedItem(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.name?.[0] ||
        "Something went wrong";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Products will not be deleted, but they may lose this category.`
    );

    if (!confirmed) return;

    try {
      await deleteCategory(category.id);

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id
        )
      );

      toast.success("Category deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Failed to delete category"
      );
    }
  };

  const handleDeleteSubcategory = async (
    subcategory
  ) => {
    const confirmed = window.confirm(
      `Delete "${subcategory.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteSubCategory(subcategory.id);

      setCategories((current) =>
        current.map((category) => ({
          ...category,
          subcategories: (
            category.subcategories || []
          ).filter(
            (item) => item.id !== subcategory.id
          ),
        }))
      );

      toast.success("Subcategory deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Failed to delete subcategory"
      );
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Category list
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Organise products using categories and
              subcategories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAddSubcategory()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            <FolderPlus size={17} />
            Add Subcategory
          </button>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-rose-600">
              <Plus size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No categories yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Use the Add Category button in the header.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedCategories.map((category) => {
              const subcategories = [
                ...(category.subcategories || []),
              ].sort(
                (a, b) =>
                  Number(b.id) - Number(a.id)
              );

              const isExpanded =
                expandedCategories[category.id];

              return (
                <article key={category.id}>
                  <div className="overflow-x-auto">
                    <div className="flex min-w-max items-center justify-between gap-6 px-4 py-4 sm:px-6">
                      <button
                        type="button"
                        onClick={() =>
                          toggleCategory(category.id)
                        }
                        className="flex shrink-0 items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                          {isExpanded ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </span>

                        <span className="shrink-0">
                          <span className="block whitespace-nowrap font-semibold text-gray-900">
                            {category.name}
                          </span>

                          <span className="whitespace-nowrap text-sm text-gray-500">
                            {subcategories.length}{" "}
                            {subcategories.length === 1
                              ? "subcategory"
                              : "subcategories"}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
                        <ActionButton
                          onClick={() =>
                            openEditCategory(category)
                          }
                        >
                          <Edit3 size={15} />
                          Edit
                        </ActionButton>

                        <ActionButton
                          danger
                          onClick={() =>
                            handleDeleteCategory(category)
                          }
                        >
                          <Trash2 size={15} />
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
                      {subcategories.length === 0 ? (
                        <p className="rounded-2xl bg-white px-4 py-4 text-sm text-gray-500">
                          No subcategories under this category.
                        </p>
                      ) : (
                        subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="overflow-x-auto rounded-2xl bg-white"
                          >
                            <div className="flex min-w-max items-center justify-between gap-6 px-4 py-3">
                              <span className="shrink-0 whitespace-nowrap text-sm font-medium text-gray-700">
                                {subcategory.name}
                              </span>

                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditSubcategory(
                                      subcategory,
                                      category
                                    )
                                  }
                                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-pink-600 transition hover:bg-pink-50"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSubcategory(
                                      subcategory
                                    )
                                  }
                                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalType && (
        <CategoryModal
          modalType={modalType}
          form={form}
          setForm={setForm}
          categories={sortedCategories}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </>
  );
}

function ActionButton({
  children,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        danger
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-pink-50 text-pink-700 hover:bg-pink-100"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryModal({
  modalType,
  form,
  setForm,
  categories,
  submitting,
  onSubmit,
  onClose,
}) {
  const isSubcategory =
    modalType.includes("subcategory");

  const isEditing = modalType.startsWith("edit");

  const title = isSubcategory
    ? isEditing
      ? "Edit Subcategory"
      : "Add Subcategory"
    : isEditing
      ? "Edit Category"
      : "Add Category";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isSubcategory
                ? "Create or update a product subcategory."
                : "Create or update a product category."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4"
        >
          {isSubcategory && (
            <div>
              <label
                htmlFor="parent-category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Parent category
              </label>

              <select
                id="parent-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-rose-100"
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              {isSubcategory
                ? "Subcategory name"
                : "Category name"}
            </label>

            <input
              id="category-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={
                isSubcategory
                  ? "e.g. Lip Gloss"
                  : "e.g. Makeup"
              }
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-4 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}