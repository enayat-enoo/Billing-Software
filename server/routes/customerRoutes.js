const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  searchOrGetAll,
  createCustomer,
  updateCustomer,
  getCustomerById,
} = require("../controllers/customerController");

// All customer routes are protected
router.get("/", auth, searchOrGetAll);
router.post("/", auth, createCustomer);
router.get("/:id", auth, getCustomerById);
router.put("/:id", auth, updateCustomer);

module.exports = router;