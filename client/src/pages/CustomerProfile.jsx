import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [customerRes, invoicesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/invoices/customer/${id}`),
      ]);
      setCustomer(customerRes.data);
      setInvoices(invoicesRes.data);
      setForm({
        name: customerRes.data.name,
        email: customerRes.data.email || "",
        address: customerRes.data.address || "",
      });
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/customers/${id}`, form);
      setCustomer(res.data);
      setShowEditModal(false);
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to update customer.");
    } finally {
      setSubmitting(false);
    }
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

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-500">Customer not found.</p>
        <button
          onClick={() => navigate("/customers")}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          Back to Customers
        </button>
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
          <button onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer">
            Dashboard
          </button>
          <button onClick={() => navigate("/customers")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer">
            Customers
          </button>
          <button onClick={() => navigate("/invoices")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer">
            Invoices
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate("/customers")}
          className="flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-gray-800 mb-6 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600
                              flex items-center justify-center font-bold text-xl">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{customer.name}</h1>
                <p className="text-sm text-gray-500">{customer.phone}</p>
                {customer.email && (
                  <p className="text-sm text-gray-500">{customer.email}</p>
                )}
                {customer.address && (
                  <p className="text-sm text-gray-500">{customer.address}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl
                         text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Edit
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Billed</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{customer.totalBilled.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Invoices</p>
              <p className="text-xl font-bold text-gray-800">{customer.invoiceCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Customer Since</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  month: "short", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate("/invoices/new", { state: { customer } })}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700
                       text-white rounded-xl transition cursor-pointer"
          >
            + New Invoice for {customer.name.split(" ")[0]}
          </button>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Invoice History</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No invoices yet for this customer.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between px-6 py-4
                             hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-gray-800">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                     ${statusBadge(inv.paymentStatus)}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">Edit Customer</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Phone shown but not editable */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={customer.phone}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                           text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="optional"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="optional"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600
                                text-sm rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl
                             text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
                             disabled:bg-blue-400 text-white rounded-xl text-sm
                             transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerProfile;