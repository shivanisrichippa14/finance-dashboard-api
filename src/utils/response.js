// Consistent response format across all endpoints.
// Every response looks the same whether it's a success or error —
// this makes the frontend's job way easier and keeps us consistent.

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
  };

  // Include validation errors if passed (e.g. from express-validator)
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
