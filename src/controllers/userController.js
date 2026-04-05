const {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getUserById,
} = require("../services/userService");
const { sendSuccess, sendError } = require("../utils/response");

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return sendSuccess(res, { users, count: users.length }, "Users fetched.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return sendSuccess(res, { user }, "User fetched.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

// Only admins reach this — roleGuard handles that before we get here
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await updateUserRole(
      req.params.id,
      role,
      req.user._id // pass the requesting user's ID to prevent self-demotion
    );
    return sendSuccess(res, { user: updatedUser }, "User role updated.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

// Toggle active/inactive — soft account management
const changeUserStatus = async (req, res) => {
  try {
    const updatedUser = await toggleUserStatus(req.params.id, req.user._id);
    const statusMessage = updatedUser.isActive ? "activated" : "deactivated";
    return sendSuccess(
      res,
      { user: updatedUser },
      `User account ${statusMessage}.`
    );
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = { getUsers, getUser, changeUserRole, changeUserStatus };
