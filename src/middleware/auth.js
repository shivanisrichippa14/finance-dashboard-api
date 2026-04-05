const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { sendError } = require("../utils/response");

// This middleware runs before any protected route handler.
// It checks if the request has a valid JWT token and attaches the user to req.
// If anything is wrong, the request stops here — the controller never runs.
const requireAuth = async (req, res, next) => {
  // Tokens come in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Access denied. No token provided.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from DB — don't trust token payload alone.
    // Edge case: admin deactivates a user, but their token is still valid.
    // Without this DB check, that deactivated user could still make requests.
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, "User no longer exists.", 401);
    }

    if (!user.isActive) {
      return sendError(
        res,
        "Your account has been deactivated. Contact an admin.",
        403
      );
    }

    // Attach user to request so downstream middlewares and controllers can use it
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws specific errors we can handle differently
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Session expired. Please login again.", 401);
    }

    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token.", 401);
    }

    // Something unexpected happened
    return sendError(res, "Authentication failed.", 401);
  }
};

module.exports = { requireAuth };
