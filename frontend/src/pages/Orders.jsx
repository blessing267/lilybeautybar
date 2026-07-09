import DashboardLayout from "../layouts/DashboardLayout";

export default function Orders({ onLogout }) {
  return (
    <DashboardLayout onLogout={onLogout}>
      <div className="bg-white rounded-[32px] border border-rose-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Orders
        </h1>

        <p className="text-gray-500 mt-3">
          Order management will be added here next.
        </p>
      </div>
    </DashboardLayout>
  );
}