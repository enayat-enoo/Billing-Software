import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

const UNITS = ["pcs", "kg", "g", "litre", "ml", "dozen", "box"];
const PAYMENT_METHODS = ["cash", "upi", "card", "credit"];

const emptyItem = () => ({ name: "", qty: 1, unit: "pcs", price: "" });

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Customer state
  const [phoneInput, setPhoneInput] = useState("");
  const [customer, setCustomer] = useState(location.state?.customer || null);
  const [phoneError, setPhoneError] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", address: "" });
  const [searchLoading, setSearchLoading] = useState(false);

  // Items state
  const [items, setItems] = useState([emptyItem()]);

  // Bill state
  const [discount, setDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [amountPaid, setAmountPaid] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Calculations ────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0);

  const discountAmt = parseFloat(discount) || 0;
  const taxableAmount = subtotal - discountAmt;
  const cgst = gstRate > 0 ? (taxableAmount * gstRate) / 200 : 0;
  const sgst = gstRate > 0 ? (taxableAmount * gstRate) / 200 : 0;
  const grandTotal = taxableAmount + cgst + sgst;
  const balanceDue = grandTotal - (parseFloat(amountPaid) || 0);

  // Auto set amountPaid when status is paid
  useEffect(() => {
    if (paymentStatus === "paid") {
      setAmountPaid(grandTotal.toFixed(2));
    }
    if (paymentStatus === "unpaid") {
      setAmountPaid("0");
    }
  }, [paymentStatus, grandTotal]);

  // ── Customer Search ─────────────────────────────────────────
  const handlePhoneSearch = async () => {
    if (phoneInput.trim().length < 10) {
      setPhoneError("Enter a valid 10-digit phone number.");
      return;
    }
    setSearchLoading(true);
    setPhoneError("");
    setShowRegisterForm(false);
    setCustomer(null);
    try {
      const res = await api.get(`/customers?phone=${phoneInput.trim()}`);
      setCustomer(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setShowRegisterForm(true);
        setNewCustomer({ name: "", email: "", address: "" });
      } else {
        setPhoneError("Something went wrong. Try again.");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRegisterCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setPhoneError("Customer name is required.");
      return;
    }
    try {
      const res = await api.post("/customers", {
        name: newCustomer.name,
        phone: phoneInput.trim(),
        email: newCustomer.email,
        address: newCustomer.address,
      });
      setCustomer(res.data);
      setShowRegisterForm(false);
      setPhoneError("");
    } catch (err) {
      setPhoneError(err.response?.data?.message || "Failed to register customer.");
    }
  };

  const clearCustomer = () => {
    setCustomer(null);
    setPhoneInput("");
    setShowRegisterForm(false);
    setPhoneError("");
  };

  // ── Items ───────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (!customer) {
      setError("Please select or register a customer first.");
      return;
    }

    const validItems = items.filter(
      (item) => item.name.trim() && parseFloat(item.price) > 0
    );
    if (validItems.length === 0) {
      setError("Add at least one item with a name and price.");
      return;
    }

    if (paymentStatus === "partial") {
      const paid = parseFloat(amountPaid) || 0;
      if (paid <= 0 || paid >= grandTotal) {
        setError("For partial payment, amount paid must be between 0 and grand total.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post("/invoices", {
        customerId: customer._id,
        items: validItems.map((item) => ({
          name: item.name.trim(),
          qty: parseFloat(item.qty),
          unit: item.unit,
          price: parseFloat(item.price),
        })),
        discount: discountAmt,
        cgst,
        sgst,
        paymentMethod,
        paymentStatus,
        amountPaid: parseFloat(amountPaid) || 0,
      });

      navigate("/invoices", { state: { newInvoice: res.data } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">New Invoice</h1>

        {/* ── Step 1: Customer ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="text-blue-600 mr-2">1</span> Customer
          </h2>

          {/* Customer selected */}
          {customer ? (
            <div className="flex items-center justify-between bg-blue-50
                            border border-blue-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-700
                                flex items-center justify-center font-semibold text-sm">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.phone}</p>
                </div>
              </div>
              <button
                onClick={clearCustomer}
                className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              {/* Phone search */}
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                  placeholder="Enter customer phone number"
                  maxLength={10}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />
                <button
                  onClick={handlePhoneSearch}
                  disabled={searchLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                             text-white text-sm rounded-xl transition cursor-pointer
                             disabled:cursor-not-allowed"
                >
                  {searchLoading ? "..." : "Search"}
                </button>
              </div>

              {phoneError && (
                <p className="text-red-500 text-xs mt-2">{phoneError}</p>
              )}

              {/* New customer registration form */}
              {showRegisterForm && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm font-medium text-yellow-800 mb-3">
                    No customer found — register a new one
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                                 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:border-transparent placeholder-gray-400 bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                                 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:border-transparent placeholder-gray-400 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Address (optional)"
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, address: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl
                                 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:border-transparent placeholder-gray-400 bg-white"
                    />
                    <button
                      onClick={handleRegisterCustomer}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white
                                 text-sm rounded-xl transition cursor-pointer"
                    >
                      Register & Continue
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Step 2: Items ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="text-blue-600 mr-2">2</span> Items
          </h2>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">

                {/* Item Name */}
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent placeholder-gray-400"
                />

                {/* Qty */}
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty}
                  min={1}
                  onChange={(e) => updateItem(index, "qty", e.target.value)}
                  className="w-16 px-3 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent text-center"
                />

                {/* Unit */}
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                  className="w-20 px-2 py-2.5 border border-gray-300 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>

                {/* Price */}
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    min={0}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl
                               text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                               focus:border-transparent"
                  />
                </div>

                {/* Total */}
                <div className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200
                                rounded-xl text-sm text-gray-600 text-right">
                  ₹{((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0))
                    .toLocaleString("en-IN")}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="p-2.5 text-gray-400 hover:text-red-500 disabled:opacity-30
                             transition cursor-pointer disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800
                       transition cursor-pointer"
          >
            + Add Item
          </button>
        </div>

        {/* ── Step 3: Bill Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="text-blue-600 mr-2">3</span> Bill Summary
          </h2>

          <div className="space-y-3">

            {/* Discount */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Discount (₹)</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent text-right"
              />
            </div>

            {/* GST */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value))}
                className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent bg-white"
              >
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>{r === 0 ? "No GST" : `${r}%`}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- ₹{discountAmt.toLocaleString("en-IN")}</span>
                </div>
              )}
              {gstRate > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>CGST ({gstRate / 2}%)</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>SGST ({gstRate / 2}%)</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-bold text-gray-800
                              border-t border-gray-100 pt-2">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 4: Payment ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="text-blue-600 mr-2">4</span> Payment
          </h2>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-2">Payment Method</label>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize
                              transition cursor-pointer border
                              ${paymentMethod === method
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-2">Payment Status</label>
            <div className="flex gap-2">
              {["paid", "partial", "unpaid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setPaymentStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize
                              transition cursor-pointer border
                              ${paymentStatus === s
                      ? s === "paid"
                        ? "bg-green-600 text-white border-green-600"
                        : s === "partial"
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid — only show for partial */}
          {paymentStatus === "partial" && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Amount Paid (₹)</label>
              <input
                type="number"
                min={0}
                max={grandTotal}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-transparent text-right"
              />
            </div>
          )}

          {/* Balance Due */}
          {paymentStatus !== "paid" && (
            <div className="flex justify-between text-sm font-medium text-red-500 mt-3">
              <span>Balance Due</span>
              <span>₹{balanceDue > 0 ? balanceDue.toLocaleString("en-IN") : 0}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                          rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                     text-white font-semibold rounded-xl transition cursor-pointer
                     disabled:cursor-not-allowed text-sm"
        >
          {submitting ? "Generating Invoice..." : `Generate Invoice — ₹${grandTotal.toLocaleString("en-IN")}`}
        </button>

      </div>
    </div>
  );
};

export default NewInvoice;