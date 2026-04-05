const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    totalBilled: {
      type: Number,
      default: 0,
    },
    invoiceCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
