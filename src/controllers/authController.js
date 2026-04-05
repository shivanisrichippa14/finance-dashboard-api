const { registerUser, loginUser } = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/response");

// Controllers are intentionally thin.
// They receive the request, call the right service function, and send the response.
// All the actual logic lives in the service layer.

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await registerUser(name, email, password);

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Account created successfully.",
      201
    );
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);

    return sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, "Login successful.");
  } catch (error) {
    return sendError(res, error.message, error.statusCode || 500);
  }
};

// Returns the currently logged-in user's profile.
// Useful for the frontend to know who's logged in without hitting the user endpoint.
const getMe = async (req, res) => {
  return sendSuccess(res, {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    isActive: req.user.isActive,
    createdAt: req.user.createdAt,
  }, "Profile fetched.");
};

module.exports = { register, login, getMe };
