import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Auto open invoice if coming from NewInvoice
  useEffect(() => {
    if (location.state?.newInvoice && invoices.length > 0) {
      const found = invoices.find(
        (inv) => inv._id === location.state.newInvoice._id
      );
      if (found) setSelectedInvoice(found);
    }
  }, [invoices, location.state]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchStatus =
      statusFilter === "all" || inv.paymentStatus === statusFilter;
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.phone?.includes(search);
    return matchStatus && matchSearch;
  });

  const handleMarkPaid = async (invoice) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/invoices/${invoice._id}/status`, {
        paymentStatus: "paid",
        amountPaid: invoice.grandTotal,
      });
      setInvoices((prev) =>
        prev.map((inv) => (inv._id === res.data._id ? res.data : inv))
      );
      setSelectedInvoice(res.data);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingStatus(false);
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

  const handlePrint = () => {
    window.print();
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

      {/* Navbar — hidden on print */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4
                      flex items-center justify-between print:hidden">
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
          <button
            onClick={() => navigate("/invoices/new")}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700
                       text-white rounded-xl transition cursor-pointer">
            + New Invoice
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 print:hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Invoice History</h1>
            <p className="text-sm text-gray-500 mt-0.5">{invoices.length} total invoices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice no, customer name or phone..."
            className="flex-1 min-w-56 px-4 py-2.5 border border-gray-300 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-transparent placeholder-gray-400 bg-white"
          />
          <div className="flex gap-2">
            {["all", "paid", "partial", "unpaid"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize
                            transition cursor-pointer border
                            ${statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Two column layout — list + detail */}
        <div className="flex gap-5">

          {/* Invoice List */}
          <div className={`${selectedInvoice ? "w-2/5" : "w-full"} transition-all`}>
            <div className="bg-white rounded-2xl border border-gray-200">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                  {search || statusFilter !== "all"
                    ? "No invoices match your filters."
                    : "No invoices yet."}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map((inv) => (
                    <div
                      key={inv._id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`flex items-center justify-between px-5 py-4
                                  cursor-pointer transition
                                  ${selectedInvoice?._id === inv._id
                          ? "bg-blue-50 border-l-2 border-blue-600"
                          : "hover:bg-gray-50"
                        }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {inv.customer?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          ₹{inv.grandTotal.toLocaleString("en-IN")}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                                         font-medium ${statusBadge(inv.paymentStatus)}`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Detail Panel */}
          {selectedInvoice && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">

                {/* Detail Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-800">
                    {selectedInvoice.invoiceNumber}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg
                                 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      🖨 Print
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs text-gray-400 mb-1">Customer</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedInvoice.customer?.name}
                  </p>
                  <p className="text-xs text-gray-500">{selectedInvoice.customer?.phone}</p>
                  {selectedInvoice.customer?.address && (
                    <p className="text-xs text-gray-500">{selectedInvoice.customer.address}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Items Table */}
                <div className="mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-800">{item.name}</td>
                          <td className="py-2 text-center text-gray-500">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-2 text-right text-gray-500">
                            ₹{item.price.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-800">
                            ₹{item.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>- ₹{selectedInvoice.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {selectedInvoice.cgst > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>CGST</span>
                      <span>₹{selectedInvoice.cgst.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.sgst > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>SGST</span>
                      <span>₹{selectedInvoice.sgst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-800
                                  border-t border-gray-100 pt-2">
                    <span>Grand Total</span>
                    <span>₹{selectedInvoice.grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="capitalize font-medium text-gray-800">
                      {selectedInvoice.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                                     ${statusBadge(selectedInvoice.paymentStatus)}`}>
                      {selectedInvoice.paymentStatus}
                    </span>
                  </div>
                  {selectedInvoice.balanceDue > 0 && (
                    <div className="flex justify-between text-sm text-red-500 font-medium">
                      <span>Balance Due</span>
                      <span>₹{selectedInvoice.balanceDue.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* Mark as Paid button */}
                {selectedInvoice.paymentStatus !== "paid" && (
                  <button
                    onClick={() => handleMarkPaid(selectedInvoice)}
                    disabled={updatingStatus}
                    className="mt-5 w-full py-2.5 bg-green-600 hover:bg-green-700
                               disabled:bg-green-400 text-white text-sm font-medium
                               rounded-xl transition cursor-pointer
                               disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? "Updating..." : "Mark as Paid"}
                  </button>
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Print View ── */}
      {selectedInvoice && (
        <div className="hidden print:block p-10 text-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Tax Invoice</h1>
            <p className="text-gray-500 mt-1">
              {selectedInvoice.invoiceNumber} ·{" "}
              {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>

          <div className="flex justify-between mb-6">
            <div>
              <p className="font-semibold">Bill To:</p>
              <p>{selectedInvoice.customer?.name}</p>
              <p className="text-gray-500">{selectedInvoice.customer?.phone}</p>
              {selectedInvoice.customer?.address && (
                <p className="text-gray-500">{selectedInvoice.customer.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">Payment</p>
              <p className="capitalize">{selectedInvoice.paymentMethod}</p>
              <p className="capitalize">{selectedInvoice.paymentStatus}</p>
            </div>
          </div>

          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-center">{item.qty} {item.unit}</td>
                  <td className="py-2 text-right">₹{item.price.toLocaleString("en-IN")}</td>
                  <td className="py-2 text-right">₹{item.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto w-64 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{selectedInvoice.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {selectedInvoice.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- ₹{selectedInvoice.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {selectedInvoice.cgst > 0 && (
              <div className="flex justify-between">
                <span>CGST</span><span>₹{selectedInvoice.cgst.toFixed(2)}</span>
              </div>
            )}
            {selectedInvoice.sgst > 0 && (
              <div className="flex justify-between">
                <span>SGST</span><span>₹{selectedInvoice.sgst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-800 pt-1">
              <span>Grand Total</span>
              <span>₹{selectedInvoice.grandTotal.toLocaleString("en-IN")}</span>
            </div>
            {selectedInvoice.balanceDue > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Balance Due</span>
                <span>₹{selectedInvoice.balanceDue.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>

          <p className="text-center text-gray-400 mt-10">Thank you for your business!</p>
        </div>
      )}

    </div>
  );
};

export default InvoiceHistory;