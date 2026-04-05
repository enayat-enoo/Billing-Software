import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Customers = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/customers", form);
      setCustomers([res.data, ...customers]);
      setShowModal(false);
      setForm({ name: "", phone: "", email: "", address: "" });
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to add customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setForm({ name: "", phone: "", email: "", address: "" });
    setFormError("");
    setShowModal(true);
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
          <button onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer">
            Dashboard
          </button>
          <button onClick={() => navigate("/invoices")}
            className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer">
            Invoices
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Customers</h1>
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} total customers</p>
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700
                       text-white rounded-xl transition cursor-pointer"
          >
            + Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent placeholder-gray-400 bg-white"
          />
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-2xl border border-gray-200">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? "No customers match your search." : "No customers yet. Add your first one!"}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/customers/${c._id}`)}
                  className="flex items-center justify-between px-6 py-4
                             hover:bg-gray-50 cursor-pointer transition"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600
                                    flex items-center justify-center font-semibold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Total Billed</p>
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{c.totalBilled.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Invoices</p>
                      <p className="text-sm font-semibold text-gray-800">{c.invoiceCount}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">Add New Customer</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Ramesh Kumar"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="9876543210"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="ramesh@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="123 MG Road, Bhopal"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
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
                  onClick={() => setShowModal(false)}
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
                  {submitting ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;