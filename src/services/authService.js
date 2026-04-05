const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

// Generates a signed JWT for a user.
// We store only userId and role in the token — nothing sensitive.
// The role is there so we don't have to hit the DB for basic role checks,
// but requireAuth still fetches the user from DB to catch deactivated accounts.
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Registers a new user.
// By default everyone gets "viewer" role — an admin must manually promote them.
// This prevents someone from signing up and claiming admin access.
const registerUser = async (name, email, password) => {
  // Check if email already exists before trying to save
  // This gives a cleaner error than a MongoDB duplicate key error
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409; // Conflict
    throw error;
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id, user.role);

  return { user, token };
};

// Handles login.
// We use a single generic error message for wrong email/password —
// don't tell the attacker which one is wrong.
const loginUser = async (email, password) => {
  // Need to explicitly select password since we set "select: false" on the schema
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error(
      "Your account has been deactivated. Contact an admin."
    );
    error.statusCode = 403;
    throw error;
  }

  const passwordMatches = await user.isPasswordCorrect(password);
  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id, user.role);

  // Remove password from the response object before returning
  user.password = undefined;

  return { user, token };
};

module.exports = { registerUser, loginUser };
