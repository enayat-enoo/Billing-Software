const mongoose = required("mongoose");

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

// Search index on phone for fast lookup
customerSchema.index({ phone: 1 });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
