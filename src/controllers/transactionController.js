const {
  getTransactions,
  createTransaction,
  updateTransaction,
  softDeleteTransaction,
  getTransactionById,
} = require("../services/transactionService");
const { sendSuccess, sendError } = require("../utils/response");

const listTransactions = async (req, res) => {
  try {
    // All filter params come from the query string: ?type=expense&category=marketing
    const result = await getTransactions(req.query);
    return sendSuccess(res, result, "Transactions fetched.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    return sendSuccess(res, { transaction }, "Transaction fetched.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

const addTransaction = async (req, res) => {
  try {
    // We attach req.user._id so the transaction knows who created it
    const transaction = await createTransaction(req.body, req.user._id);
    return sendSuccess(res, { transaction }, "Transaction created.", 201);
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

const editTransaction = async (req, res) => {
  try {
    const transaction = await updateTransaction(req.params.id, req.body);
    return sendSuccess(res, { transaction }, "Transaction updated.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

// This is a soft delete — sets isDeleted:true, keeps the record in DB
const removeTransaction = async (req, res) => {
  try {
    await softDeleteTransaction(req.params.id);
    return sendSuccess(res, null, "Transaction deleted.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listTransactions,
  getTransaction,
  addTransaction,
  editTransaction,
  removeTransaction,
};
