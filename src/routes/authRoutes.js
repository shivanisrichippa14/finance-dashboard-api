const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiter");
const { validateRegister, validateLogin } = require("../middleware/validate");

// POST /api/auth/register
// Anyone can register. New users get "viewer" role by default.
router.post("/register", validateRegister, register);

// POST /api/auth/login
// Rate limited to 10 attempts per 15 min to block brute-force attacks
router.post("/login", loginLimiter, validateLogin, login);

// GET /api/auth/me
// Returns the currently logged-in user's profile
router.get("/me", requireAuth, getMe);

module.exports = router;
