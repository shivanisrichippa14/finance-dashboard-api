const { sendError } = require("../utils/response");

// This is the core of our RBAC (Role-Based Access Control) system.
//
// How it works:
// requireRole("admin") returns a middleware function.
// That middleware checks if the logged-in user has one of the allowed roles.
// If not, the request is rejected with a 403 before the controller even runs.
//
// Usage example:
//   router.delete("/users/:id", requireAuth, requireRole("admin"), deleteUser)
//   router.get("/transactions", requireAuth, requireRole("analyst", "admin"), getTransactions)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // requireAuth must run before this — it sets req.user
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const userRole = req.user.role;
    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
      // Don't reveal what roles exist — just say they're not allowed
      return sendError(
        res,
        `Access denied. Your role (${userRole}) does not have permission for this action.`,
        403
      );
    }

    next();
  };
};

module.exports = { requireRole };
