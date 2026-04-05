// Every async route handler needs a try/catch, or an unhandled promise rejection
// crashes the whole process in older Node versions and silently hangs in newer ones.
//
// Without this wrapper, every controller looks like:
//   const getUsers = async (req, res) => {
//     try { ... } catch (err) { return sendError(res, err.message) }
//   }
//
// With this wrapper, controllers can be written cleanly and errors
// are caught automatically and forwarded to Express's global error handler.
//
// Usage:
//   router.get("/users", requireAuth, catchAsync(getUsers))

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
