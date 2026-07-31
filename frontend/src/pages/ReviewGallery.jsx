import { useEffect, useState } from "react";
import { api } from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";

const initialForm = {
  image: null,
  is_active: true,
  display_order: 0,
};

export default function ReviewGallery({ onLogout }) {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("review-gallery/");
      setReviews(response.data);
    } catch (error) {
      console.error(error);
      setError("Unable to load the review images.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      image: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setPreview("");
    setError("");
  };

  const handleEdit = (review) => {
    setEditingId(review.id);

    setForm({
      image: null,
      is_active: review.is_active,
      display_order: review.display_order ?? 0,
    });

    setPreview(review.image_url || review.image || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingId && !form.image) {
      setError("Please select a review image.");
      return;
    }

    const formData = new FormData();

    formData.append(
      "is_active",
      String(form.is_active)
    );

    formData.append(
      "display_order",
      String(form.display_order || 0)
    );

    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await api.patch(
          `review-gallery/${editingId}/`,
          formData
        );
      } else {
        await api.post(
          "review-gallery/",
          formData
        );
      }

      resetForm();
      await fetchReviews();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.image?.[0] ||
        error.response?.data?.detail ||
        "Unable to save the review image."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (review) => {
    try {
      const formData = new FormData();

      formData.append(
        "is_active",
        String(!review.is_active)
      );

      await api.patch(
        `review-gallery/${review.id}/`,
        formData
      );

      setReviews((previous) =>
        previous.map((item) =>
          item.id === review.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setError("Unable to change image visibility.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review image?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`review-gallery/${id}/`);

      setReviews((previous) =>
        previous.filter((review) => review.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setError("Unable to delete the review image.");
    }
  };

  return (
    <DashboardLayout onLogout={onLogout}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Review Gallery
          </h1>

          <p className="mt-2 text-gray-600">
            Upload and manage customer feedback screenshots.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {editingId
              ? "Edit review image"
              : "Upload review image"}
          </h2>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Review image
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />

              {editingId && (
                <p className="mt-2 text-sm text-gray-500">
                  Select a new image only when you want to replace
                  the existing one.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Display order
              </label>

              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    display_order: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((previous) => ({
                  ...previous,
                  is_active: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-pink-500"
            />

            <span className="text-gray-700">
              Show this image on the homepage
            </span>
          </label>
        </div>

        {preview && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Image preview
            </p>

            <img
              src={preview}
              alt="Review preview"
              className="max-h-80 max-w-full rounded-xl border bg-gray-50 object-contain"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-pink-500 px-6 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update image"
                : "Upload image"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          Uploaded review images
        </h2>

        {loading ? (
          <p className="text-gray-500">
            Loading review images...
          </p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No review images have been uploaded.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <img
                  src={review.image_url || review.image}
                  alt="Customer review screenshot"
                  className="h-80 w-full bg-gray-50 object-contain p-2"
                />

                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        review.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {review.is_active
                        ? "Visible"
                        : "Hidden"}
                    </span>

                    <span className="text-sm text-gray-500">
                      Order: {review.display_order}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(review)}
                      className="rounded-lg bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-600"
                    >
                      {review.is_active
                        ? "Hide"
                        : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(review)}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Edit image
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
    </DashboardLayout>
  );
}