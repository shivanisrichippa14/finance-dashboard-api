const { body, query, param, validationResult } = require("express-validator");
const { sendError } = require("../utils/response");
const { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } = require("../models/Transaction");

// This runs after the validation rules and collects any errors.
// If there are errors, we send them all at once so the client can fix everything in one go.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return sendError(res, "Validation failed", 422, errorMessages);
  }

  next();
};

// --- Auth validation rules ---

const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// --- Transaction validation rules ---

const validateCreateTransaction = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),

  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(TRANSACTION_TYPES)
    .withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(", ")}`),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(TRANSACTION_CATEGORIES)
    .withMessage(`Category must be one of: ${TRANSACTION_CATEGORIES.join(", ")}`),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),

  handleValidationErrors,
];

const validateUpdateTransaction = [
  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),

  body("type")
    .optional()
    .isIn(TRANSACTION_TYPES)
    .withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(", ")}`),

  body("category")
    .optional()
    .isIn(TRANSACTION_CATEGORIES)
    .withMessage(`Category must be one of: ${TRANSACTION_CATEGORIES.join(", ")}`),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  handleValidationErrors,
];

// Validates MongoDB ObjectId format in URL params
// Prevents ugly cast errors if someone passes "abc" as an ID
const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Validates query params for filtering transactions
const validateTransactionFilters = [
  query("type")
    .optional()
    .isIn(TRANSACTION_TYPES)
    .withMessage(`Type filter must be: ${TRANSACTION_TYPES.join(" or ")}`),

  query("category")
    .optional()
    .isIn(TRANSACTION_CATEGORIES)
    .withMessage("Invalid category filter"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid date"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTransaction,
  validateUpdateTransaction,
  validateMongoId,
  validateTransactionFilters,
};
