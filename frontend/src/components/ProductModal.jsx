export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  isEditing,
}) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", form.name);
  formData.append("description", form.description);
  formData.append("price", form.price);

  // Only append file if user selected a new one
  if (form.image) {
    formData.append("image", form.image);
  }

  await onSubmit(formData); // Pass FormData to dashboard
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Product Name */}
          <input
            name="name"
            type="text"
            placeholder="Product Name"
            value={form.name}
            onChange={handleChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
            required
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
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
            value={form.price}
            onChange={handleChange}
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
            required
          />

          {/* Image Upload */}
          <input
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
