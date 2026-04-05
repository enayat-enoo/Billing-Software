import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todaySales: 0,
    monthRevenue: 0,
    totalCustomers: 0,
    unpaidCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch in parallel
        const [invoicesRes, customersRes] = await Promise.all([
          api.get("/invoices"),
          api.get("/customers"),
        ]);

        const invoices = invoicesRes.data;
        const customers = customersRes.data;

        // Today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = invoices
          .filter((inv) => new Date(inv.createdAt) >= today)
          .reduce((sum, inv) => sum + inv.grandTotal, 0);

        // This month's revenue
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthRevenue = invoices
          .filter((inv) => new Date(inv.createdAt) >= startOfMonth)
          .reduce((sum, inv) => sum + inv.grandTotal, 0);

        // Unpaid count
        const unpaidCount = invoices.filter(
          (inv) => inv.paymentStatus === "unpaid" || inv.paymentStatus === "partial"
        ).length;

        setStats({
          todaySales,
          monthRevenue,
          totalCustomers: customers.length,
          unpaidCount,
        });

        // Last 5 invoices
        setRecentInvoices(invoices.slice(0, 5));
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const statusBadge = (status) => {
    const map = {
      paid: "bg-green-100 text-green-700",
      unpaid: "bg-red-100 text-red-700",
      partial: "bg-yellow-100 text-yellow-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">Billing Software</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/customers")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            Customers
          </button>
          <button
            onClick={() => navigate("/invoices")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
          >
            Invoices
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Page Title + Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long", year: "numeric",
                month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/customers")}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl
                         text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              + Add Customer
            </button>
            <button
              onClick={() => navigate("/invoices/new")}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700
                         text-white rounded-xl transition cursor-pointer"
            >
              + New Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Sales", value: `₹${stats.todaySales.toLocaleString("en-IN")}`, color: "text-blue-600" },
            { label: "Month Revenue", value: `₹${stats.monthRevenue.toLocaleString("en-IN")}`, color: "text-green-600" },
            { label: "Total Customers", value: stats.totalCustomers, color: "text-purple-600" },
            { label: "Unpaid Invoices", value: stats.unpaidCount, color: "text-red-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Invoices</h2>
            <button
              onClick={() => navigate("/invoices")}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No invoices yet. Create your first one!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <div
                  key={inv._id}
                  onClick={() => navigate(`/invoices?id=${inv._id}`)}
                  className="flex items-center justify-between px-6 py-4
                             hover:bg-gray-50 cursor-pointer transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {inv.customer?.name || "—"} · {inv.customer?.phone || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-gray-800">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(inv.paymentStatus)}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;