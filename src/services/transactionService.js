const { Transaction } = require("../models/Transaction");

// Builds the filter object for listing transactions.
// We always add isDeleted: false so soft-deleted records never appear in normal queries.
const buildTransactionFilter = (queryParams) => {
  const filter = { isDeleted: false };

  if (queryParams.type) {
    filter.type = queryParams.type;
  }

  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  // Date range filter — if only startDate given, get everything from that date onward
  if (queryParams.startDate || queryParams.endDate) {
    filter.date = {};

    if (queryParams.startDate) {
      filter.date.$gte = new Date(queryParams.startDate);
    }

    if (queryParams.endDate) {
      // Set endDate to end of that day so "2024-12-31" includes the whole day
      const endOfDay = new Date(queryParams.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date.$lte = endOfDay;
    }
  }

  return filter;
};

// Returns a paginated list of transactions with optional filters.
// Default: page 1, 10 per page, sorted newest first.
const getTransactions = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = buildTransactionFilter(queryParams);

  // Run count and fetch in parallel — saves time vs doing them sequentially
  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filter)
      .populate("createdBy", "name email") // show who created it, not just their ID
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalRecords: totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1,
    },
  };
};

// Creates a new financial record.
// We attach createdBy so there's always an audit trail of who added what.
const createTransaction = async (transactionData, userId) => {
  const transaction = await Transaction.create({
    ...transactionData,
    createdBy: userId,
  });

  // Populate so the response includes creator's name instead of just ID
  await transaction.populate("createdBy", "name email");

  return transaction;
};

// Updates a transaction — only the fields that were passed in the request body.
// We use runValidators to make sure the new values still pass schema rules.
const updateTransaction = async (transactionId, updateData) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    isDeleted: false,
  });

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  Object.assign(transaction, updateData);
  await transaction.save();
  await transaction.populate("createdBy", "name email");

  return transaction;
};

// Soft delete — sets isDeleted to true and records the timestamp.
// We never permanently delete financial records. Here's why:
// 1. Accounting compliance — you need history even for cancelled transactions
// 2. Accidental deletions can be recovered
// 3. Audit logs stay intact
const softDeleteTransaction = async (transactionId) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    isDeleted: false,
  });

  if (!transaction) {
    const error = new Error("Transaction not found or already deleted.");
    error.statusCode = 404;
    throw error;
  }

  transaction.isDeleted = true;
  transaction.deletedAt = new Date();
  await transaction.save();

  return transaction;
};

// Get a single transaction by ID (only non-deleted ones)
const getTransactionById = async (transactionId) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    isDeleted: false,
  }).populate("createdBy", "name email");

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  return transaction;
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
  getTransactionById,
};
