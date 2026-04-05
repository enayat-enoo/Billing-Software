const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updatePaymentStatus,
  getCustomerInvoices,
} = require("../controllers/invoiceController");

router.post("/", auth, createInvoice);
router.get("/", auth, getAllInvoices);
router.get("/customer/:customerId", auth, getCustomerInvoices);
router.get("/:id", auth, getInvoiceById);
router.patch("/:id/status", auth, updatePaymentStatus);

module.exports = router;