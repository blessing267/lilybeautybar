export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing,
  categories,
}) {
  if (!isOpen) return null;

  const selectedCategory = categories?.find(
    (category) => String(category.id) === String(form.category)
  );

  const subcategories = selectedCategory?.subcategories || [];

  const handleChange = (e) => {
    if (!e || !e.target) return;

    const { name, value, files } = e.target;

    console.log("Typing:", name, value);

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleImageChange = (e) => {
    if (!e || !e.target) return;

    const file = e.target.files?.[0];

      setForm((prev) => ({
        ...prev,
        image: file || null,
      }));
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    
    if (form.category) {
      formData.append("category", form.category);
    }

    if (form.subcategory) {
      formData.append("subcategory", form.subcategory);
    }

  // Only append form if........
    if (form.image) {
      formData.append("image", form.image);
    } else if (!isEditing) {
      alert("Please select an image");
      return;
    }

    // variants
    form.variants.forEach((variant, index) => {
      if (variant.id) {
        formData.append(
          `variants[${index}][id]`,
          variant.id
        );
      }

      formData.append(
        `variants[${index}][colour]`,
        variant.colour
      );

      formData.append(
        `variants[${index}][product_type]`,
        variant.product_type
      );

      formData.append(
       `variants[${index}][price]`,
       variant.price
      );

      formData.append(
       `variants[${index}][stock]`,
        variant.stock
      );

      if (variant.image) {
        formData.append(
          `variants[${index}][image]`,
          variant.image
        );
      }
    });

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("Modal submit error:", err);
    } // Pass FormData to dashboard
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">

      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Product Name */}
          <input
            name="name"
            type="text"
            placeholder="Product Name"
            value={form.name || ""}
            onChange={handleChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
            required
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description"
            value={form.description || ""}
            onChange={handleChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
            rows={3}
            required
          />

          {/* Price */}
          <input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price || ""}
            onChange={handleChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
            required
          />

          {/* Category */}
          <select
            name="category"
            value={form.category || ""}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                category: e.target.value,
                subcategory: "",
              }));
            }}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Category</option>

            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Subcategory */}
          <select
            name="subcategory"
            value={form.subcategory || ""}
            onChange={handleChange}
            disabled={!form.category}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          >
            <option value="">Select Subcategory</option>

            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>

          <h3 className="font-semibold mt-3">
            Product Options
          </h3>

    {form.variants?.map((variant, index) => (
      <div
        key={index}
        className="border rounded p-3 flex flex-col gap-2"
      >
    <input
      type="text"
      placeholder="Colour"
      value={variant.colour}
      onChange={(e) => {
        const updated = [...form.variants];
        updated[index].colour = e.target.value;

        setForm((prev) => ({
          ...prev,
          variants: updated,
        }));
      }}
      className="border px-3 py-2 rounded"
    />

    <input
      type="text"
      placeholder="Product Type"
      value={variant.product_type}
      onChange={(e) => {
        const updated = [...form.variants];
        updated[index].product_type =
          e.target.value;

        setForm((prev) => ({
          ...prev,
          variants: updated,
        }));
      }}
      className="border px-3 py-2 rounded"
    />

    <input
      type="number"
      placeholder="Variant Price"
      value={variant.price}
      onChange={(e) => {
        const updated = [...form.variants];
        updated[index].price = e.target.value;

        setForm((prev) => ({
          ...prev,
          variants: updated,
        }));
      }}
      className="border px-3 py-2 rounded"
    />

    <input
      type="number"
      placeholder="Stock"
      value={variant.stock}
      onChange={(e) => {
        const updated = [...form.variants];
        updated[index].stock = e.target.value;

        setForm((prev) => ({
          ...prev,
          variants: updated,
        }));
      }}
      className="border px-3 py-2 rounded"
    />

    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const updated = [...form.variants];

        updated[index].image =
          e.target.files?.[0] || null;

        setForm((prev) => ({
          ...prev,
          variants: updated,
        }));
      }}
      className="border px-3 py-2 rounded"
    />
  </div>
))}

<button
  type="button"
  onClick={() => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          colour: "",
          product_type: "",
          price: "",
          stock: "",
        }
      ]
    }));
  }}
  className="bg-green-500 text-white px-3 py-2 rounded"
>
  + Add Option
</button>

          {/* Image Upload */}
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
          />

          {/* Preview (Edit mode) */}
          {isEditing && form.image_url && !form.image && (
            <img
              src={form.image_url}
              alt="Current"
              className="h-32 object-cover rounded"
            />
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {isEditing ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
