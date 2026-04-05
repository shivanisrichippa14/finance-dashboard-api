const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  changeUserRole,
  changeUserStatus,
} = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleGuard");
const { validateMongoId } = require("../middleware/validate");
const { body } = require("express-validator");
const { ROLES } = require("../models/User");

// All user management is admin-only
// requireAuth runs first (checks token), then requireRole (checks permission)

// GET /api/users — list all users
router.get("/", requireAuth, requireRole("admin"), getUsers);

// GET /api/users/:id — get one user by ID
router.get("/:id", requireAuth, requireRole("admin"), validateMongoId, getUser);

// PATCH /api/users/:id/role — promote or demote a user
router.patch(
  "/:id/role",
  requireAuth,
  requireRole("admin"),
  validateMongoId,
  [
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(ROLES)
      .withMessage(`Role must be one of: ${ROLES.join(", ")}`),
  ],
  changeUserRole
);

// PATCH /api/users/:id/status — activate or deactivate a user
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  validateMongoId,
  changeUserStatus
);

module.exports = router;
