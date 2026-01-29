import { Home, Package } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6">
      <h1 className="text-2xl font-bold text-purple-600 mb-8">
        LilyBeauty
      </h1>

      <nav className="space-y-4">
        <a className="flex items-center gap-3 text-purple-600 font-medium">
          <Home size={18} /> Dashboard
        </a>
        <a className="flex items-center gap-3 text-gray-600 hover:text-purple-600">
          <Package size={18} /> Products
        </a>
      </nav>
    </aside>
  );
}
