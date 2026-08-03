import { useEffect, useState } from "react";
import {
  Camera,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../layouts/DashboardLayout";
import {
  getAdminProfile,
  updateAdminProfile,
} from "../api/profileApi";

const emptyProfile = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  profile_image: null,
};

export default function Settings({ onLogout }) {
  const [form, setForm] = useState(emptyProfile);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminProfile()
      .then(({ data }) => {
        setForm({
          ...emptyProfile,
          ...data,
        });

        setImagePreview(data.profile_image || "");
      })
      .catch(() => {
        toast.error("Unable to load profile");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const change = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const changeImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPEG, PNG or WebP image");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be smaller than 5MB");
      event.target.value = "";
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData();

    formData.append("first_name", form.first_name || "");
    formData.append("last_name", form.last_name || "");
    formData.append("username", form.username || "");
    formData.append("email", form.email || "");
    formData.append("phone", form.phone || "");

    if (profileImage) {
      formData.append("image", profileImage);
    }

    try {
      const { data } = await updateAdminProfile(formData);

      setForm({
        ...emptyProfile,
        ...data,
      });

      setProfileImage(null);
      setImagePreview(data.profile_image || "");
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      onLogout={onLogout}
      title="Settings"
      subtitle="Manage the administrator account and dashboard preferences."
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-50 text-pink-500">
              <UserRound size={21} />
            </span>

            <div>
              <h2 className="font-bold text-gray-950">
                Admin profile
              </h2>

              <p className="text-sm text-gray-500">
                These details identify the store administrator.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Loading profile…
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Profile-picture input */}
              <div className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile picture
                </span>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-gray-200 bg-pink-50 text-pink-500">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Admin profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={34} />
                    )}
                  </div>

                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 px-4 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50">
                      <Camera size={17} />
                      Choose picture

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={changeImage}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-2 text-xs text-gray-500">
                      JPG, PNG or WebP. Maximum size: 5MB.
                    </p>

                    {profileImage && (
                      <p className="mt-1 max-w-xs truncate text-xs font-medium text-gray-600">
                        {profileImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {[
                ["first_name", "First name"],
                ["last_name", "Last name"],
                ["username", "Username"],
                ["email", "Email address", "email"],
                ["phone", "Phone number", "tel"],
              ].map(([name, label, type = "text"]) => (
                <label
                  key={name}
                  className={
                    name === "phone"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>

                  <input
                    name={name}
                    type={type}
                    value={form[name] || ""}
                    onChange={change}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-300"
                  />
                </label>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
              >
                <Save size={17} />
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          )}
        </form>

        <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <ShieldCheck size={21} />
          </span>

          <h2 className="mt-4 font-bold text-gray-950">
            Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Click the button below to change your password.
          </p>

          <a
            href="/users/password-change/"
            className="mt-5 inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Change password
          </a>
        </aside>
      </div>
    </DashboardLayout>
  );
}