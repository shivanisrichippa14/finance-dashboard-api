const express = require("express");
const router = express.Router();

const {
  listTransactions,
  getTransaction,
  addTransaction,
  editTransaction,
  removeTransaction,
} = require("../controllers/transactionController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateMongoId,
  validateTransactionFilters,
} = require("../middleware/validate");

// GET /api/transactions
// Analysts and admins can read. Viewers cannot.
// ?type=expense&category=marketing&startDate=2024-01-01&page=1&limit=10
router.get(
  "/",
  requireAuth,
  requireRole("analyst", "admin"),
  validateTransactionFilters,
  listTransactions
);

// GET /api/transactions/:id
router.get(
  "/:id",
  requireAuth,
  requireRole("analyst", "admin"),
  validateMongoId,
  getTransaction
);

// POST /api/transactions — only admins can create
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateCreateTransaction,
  addTransaction
);

// PATCH /api/transactions/:id — only admins can edit
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateMongoId,
  validateUpdateTransaction,
  editTransaction
);

// DELETE /api/transactions/:id — soft delete, admin only
// Real reason we use DELETE and not PATCH here: semantically correct HTTP,
// even though internally it's just setting isDeleted: true
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateMongoId,
  removeTransaction
);

module.exports = router;
