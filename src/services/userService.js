const { User, ROLES } = require("../models/User");

// Returns all users — only admins can call this.
// We never return passwords (schema handles that with select: false).
const getAllUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return users;
};

// Updates a user's role.
// Edge case: prevent an admin from demoting themselves.
// If the only admin removes their own admin role, nobody can manage the system.
const updateUserRole = async (targetUserId, newRole, requestingUserId) => {
  if (!ROLES.includes(newRole)) {
    const error = new Error(`Invalid role. Must be one of: ${ROLES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  // Prevent self-demotion
  if (targetUserId.toString() === requestingUserId.toString()) {
    const error = new Error("You cannot change your own role.");
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { role: newRole },
    { new: true, runValidators: true } // return updated doc, run schema validators
  );

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// Deactivates a user — doesn't delete them or their data.
// Real-world use: an employee leaves the company. You deactivate their account
// but keep their transaction history for audit purposes.
const toggleUserStatus = async (targetUserId, requestingUserId) => {
  if (targetUserId.toString() === requestingUserId.toString()) {
    const error = new Error("You cannot deactivate your own account.");
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

// Returns a single user's profile by ID
const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, getUserById };
