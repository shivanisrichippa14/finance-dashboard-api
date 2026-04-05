const express = require("express");
const router = express.Router();

const {
  summary,
  categoryBreakdown,
  monthlyTrends,
  recentActivity,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");

// Dashboard is the one place viewers are allowed.
// This is the key design decision — viewers see aggregated numbers,
// never raw transaction records.

// GET /api/dashboard/summary — income, expenses, net balance
router.get(
  "/summary",
  requireAuth,
  requireRole("viewer", "analyst", "admin"),
  summary
);

// GET /api/dashboard/categories — spending by category
router.get(
  "/categories",
  requireAuth,
  requireRole("viewer", "analyst", "admin"),
  categoryBreakdown
);

// GET /api/dashboard/trends?months=6 — monthly income vs expense
router.get(
  "/trends",
  requireAuth,
  requireRole("viewer", "analyst", "admin"),
  monthlyTrends
);

// GET /api/dashboard/recent — last 10 transactions (activity feed)
// Viewers can see this too — it's summary-level, no sensitive details
router.get(
  "/recent",
  requireAuth,
  requireRole("viewer", "analyst", "admin"),
  recentActivity
);

module.exports = router;
