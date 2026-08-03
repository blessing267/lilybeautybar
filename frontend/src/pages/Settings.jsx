import { useEffect, useState } from "react";
import { Save, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAdminProfile, updateAdminProfile } from "../api/profileApi";

const emptyProfile = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
};

export default function Settings({ onLogout }) {
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminProfile()
      .then(({ data }) => setForm({ ...emptyProfile, ...data }))
      .catch(() => toast.error("Unable to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateAdminProfile(form);
      setForm({ ...emptyProfile, ...data });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to update profile");
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
        <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <UserRound size={21} />
            </span>
            <div>
              <h2 className="font-bold text-gray-950">Admin profile</h2>
              <p className="text-sm text-gray-500">These details identify the store administrator.</p>
            </div>
          </div>

          {loading ? (
            <p className="py-16 text-center text-sm text-gray-500">Loading profile…</p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["first_name", "First name"],
                ["last_name", "Last name"],
                ["username", "Username"],
                ["email", "Email address", "email"],
                ["phone", "Phone number", "tel"],
              ].map(([name, label, type = "text"]) => (
                <label key={name} className={name === "phone" ? "sm:col-span-2" : ""}>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <input
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={change}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
                  />
                </label>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
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
          <h2 className="mt-4 font-bold text-gray-950">Security</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Click on the button below to change your Password changes.
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
