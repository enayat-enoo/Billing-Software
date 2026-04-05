const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");

// helper — generates next invoice number e.g. INV-0001
const generateInvoiceNumber = async () => {
  const last = await Invoice.findOne().sort({ createdAt: -1 }).select("invoiceNumber");
  if (!last) return "INV-0001";
  const num = parseInt(last.invoiceNumber.split("-")[1]) + 1;
  return `INV-${String(num).padStart(4, "0")}`;
};

// POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const {
      customerId,
      items,
      discount,
      cgst,
      sgst,
      paymentMethod,
      paymentStatus,
      amountPaid,
    } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Calculate totals on backend — never trust frontend values
    const calculatedItems = items.map((item) => ({
      ...item,
      total: item.qty * item.price,
    }));

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmt = discount || 0;
    const cgstAmt = cgst || 0;
    const sgstAmt = sgst || 0;
    const grandTotal = subtotal - discountAmt + cgstAmt + sgstAmt;
    const balanceDue = grandTotal - (amountPaid || 0);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId,
      items: calculatedItems,
      subtotal,
      discount: discountAmt,
      cgst: cgstAmt,
      sgst: sgstAmt,
      grandTotal,
      paymentMethod,
      paymentStatus,
      amountPaid: amountPaid || 0,
      balanceDue,
    });

    // Update customer stats
    await Customer.findByIdAndUpdate(customerId, {
      $inc: {
        totalBilled: grandTotal,
        invoiceCount: 1,
      },
    });

    // Return invoice with customer details populated
    const populated = await Invoice.findById(invoice._id).populate(
      "customer",
      "name phone address"
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/invoices
const getAllInvoices = async (req, res) => {
  try {
    const { status, from, to, customerId } = req.query;

    const filter = {};

    if (status) filter.paymentStatus = status;
    if (customerId) filter.customer = customerId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "customer",
      "name phone address"
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/invoices/:id/status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, amountPaid } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const updatedAmountPaid = amountPaid ?? invoice.amountPaid;
    const balanceDue = invoice.grandTotal - updatedAmountPaid;

    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, amountPaid: updatedAmountPaid, balanceDue },
      { new: true }
    ).populate("customer", "name phone");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/invoices/customer/:customerId
const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.customerId })
      .sort({ createdAt: -1 })
      .select("invoiceNumber grandTotal paymentStatus createdAt");

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updatePaymentStatus,
  getCustomerInvoices,
};