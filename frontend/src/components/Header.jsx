import { Menu } from "lucide-react";

export default function Header({
  onLogout,
  onMenuClick,
}) {
  return (
    <header className="bg-white border-b border-rose-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-rose-100"
        >
          <Menu size={24} />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-rose-700">
            ✨ Lily Beauty Bar
          </h1>

          <p className="text-sm text-gray-500">
            Beauty Business Dashboard
          </p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="bg-rose-600 hover:bg-rose-700 transition text-white px-5 py-2 rounded-2xl shadow-sm"
      >
        Logout
      </button>
    </header>
  );
}