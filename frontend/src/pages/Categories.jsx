import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import CategoryManager from "../components/CategoryManager";
import { getCategories } from "../api/productsApi";
import toast from "react-hot-toast";

export default function Categories({ onLogout }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  return (
    <DashboardLayout onLogout={onLogout}>
      <CategoryManager
        categories={categories}
        setCategories={setCategories}
      />
    </DashboardLayout>
  );
}