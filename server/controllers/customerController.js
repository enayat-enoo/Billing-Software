const Customer = require("../models/Customer");

// GET /api/customers?phone=9876543210
const searchOrGetAll = async (req, res) => {
  try {
    const { phone } = req.query;

    if (phone) {
      const customer = await Customer.findOne({ phone: phone.trim() });
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      return res.status(200).json(customer);
    }

    // No phone query — return all customers (for listing page)
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .select("name phone address totalBilled invoiceCount createdAt");

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    // Check duplicate phone
    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Customer with this phone already exists" });
    }

    const customer = await Customer.create({ name, phone, email, address });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { name, email, address } = req.body;
    // Note: phone is not updatable — it's the unique identifier

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, address },
      { new: true, runValidators: true },
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  searchOrGetAll,
  createCustomer,
  updateCustomer,
  getCustomerById,
};
