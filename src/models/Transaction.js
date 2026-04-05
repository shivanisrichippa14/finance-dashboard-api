const mongoose = require("mongoose");
const { TRANSACTION_TYPES_LIST, TRANSACTION_CATEGORIES_LIST } = require("../config/constants");

// Types and categories live in src/config/constants.js — imported to keep one source of truth
const TRANSACTION_TYPES = TRANSACTION_TYPES_LIST;
const TRANSACTION_CATEGORIES = TRANSACTION_CATEGORIES_LIST;

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: [true, "Transaction type is required"],
    },

    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: [true, "Category is required"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },

    // Who created this record — useful for audit trails.
    // In a real fintech system you'd want to know "who added this transaction?"
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete flag — we never truly delete financial records.
    // Real reason: if someone accidentally deletes a transaction, we can recover it.
    // Also important for accounting — you need historical data even for "deleted" entries.
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // When it was soft-deleted — useful for compliance and recovery
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index on date and type so dashboard queries run fast.
// Without this, MongoDB scans every document to build the monthly summary.
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ isDeleted: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = { Transaction, TRANSACTION_TYPES, TRANSACTION_CATEGORIES };
