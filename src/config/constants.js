// Single place for all the constant values used across the app.
//
// Why this matters:
// Without this, "admin" is typed as a string in 6 different files.
// One typo — "amdin" — and the role check silently fails.
// With this file, you import the constant and a typo is caught immediately.

const ROLES = {
  VIEWER: "viewer",   // read-only dashboard access (e.g. investors)
  ANALYST: "analyst", // read transactions + insights (e.g. finance team)
  ADMIN: "admin",     // full access — records + user management (e.g. CFO)
};

const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
};

// These map to real spending buckets in a startup.
// Keeping them here means the frontend dropdown and backend validation
// always stay in sync — there's no separate list to maintain.
const TRANSACTION_CATEGORIES = {
  SALARY: "salary",
  MARKETING: "marketing",
  INFRASTRUCTURE: "infrastructure",
  OPERATIONS: "operations",
  REVENUE: "revenue",
  INVESTMENT: "investment",
  REFUND: "refund",
  TAX: "tax",
  OTHER: "other",
};

// Array versions — used in Mongoose enum validators and express-validator rules
const ROLES_LIST = Object.values(ROLES);
const TRANSACTION_TYPES_LIST = Object.values(TRANSACTION_TYPES);
const TRANSACTION_CATEGORIES_LIST = Object.values(TRANSACTION_CATEGORIES);

module.exports = {
  ROLES,
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  ROLES_LIST,
  TRANSACTION_TYPES_LIST,
  TRANSACTION_CATEGORIES_LIST,
};
