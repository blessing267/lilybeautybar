import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  ShoppingBag,
  Banknote,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../layouts/DashboardLayout";
import { getCustomers } from "../api/customersApi";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Customers({ onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then((response) => {
        setCustomers(
          Array.isArray(response.data) ? response.data : []
        );
      })
      .catch(() => toast.error("Unable to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.full_name,
        customer.username,
        customer.email,
        customer.phone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  const totalOrders = customers.reduce(
    (total, customer) =>
      total + Number(customer.order_count || 0),
    0
  );

  const totalRevenue = customers.reduce(
    (total, customer) =>
      total + Number(customer.total_spent || 0),
    0
  );

  return (
    <DashboardLayout
      onLogout={onLogout}
      title="Customers"
      subtitle="View registered customers and their order activity."
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total Customers"
            value={customers.length}
          />

          <StatCard
            icon={ShoppingBag}
            label="Customer Orders"
            value={totalOrders}
          />

          <StatCard
            icon={Banknote}
            label="Customer Revenue"
            value={money(totalRevenue)}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <label className="relative block max-w-xl">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customers..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-400"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Total Spent</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-16 text-center text-gray-500"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-16 text-center text-gray-500"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-pink-50/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-pink-50 text-pink-500">
                            {customer.profile_image ? (
                              <img
                                src={customer.profile_image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={19} />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {customer.full_name ||
                                customer.username}
                            </p>

                            <p className="text-xs text-gray-500">
                              {customer.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-5 py-3">
                        {customer.order_count}
                      </td>

                      <td className="px-5 py-3 font-semibold">
                        {money(customer.total_spent)}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {new Date(
                          customer.date_joined
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            customer.is_active
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {customer.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-50 text-pink-500">
          <Icon size={20} />
        </span>

        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}