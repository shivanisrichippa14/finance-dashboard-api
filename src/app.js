require("dotenv").config();
const validateEnv = require("./config/validateEnv");
// Crash early with a clear message if any required env var is missing
validateEnv();

const express = require("express");
const connectDB = require("./config/database");
const { apiLimiter } = require("./middleware/rateLimiter");

// Route files
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// --- Basic middleware ---
app.use(express.json()); // parse incoming JSON request bodies
app.use(express.urlencoded({ extended: false }));

// Apply general rate limiting to all API routes
app.use("/api", apiLimiter);

// --- Swagger docs (only in dev) ---
// Docs live at http://localhost:5000/api-docs
if (process.env.NODE_ENV !== "production") {
  const swaggerUi = require("swagger-ui-express");
  const YAML = require("yamljs");
  const path = require("path");
  const swaggerDoc = YAML.load(path.join(__dirname, "../swagger.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Health check ---
// Useful for deployment platforms to check if the server is alive
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// --- 404 handler ---
// If no route matched, send a clean 404 instead of Express's default HTML error
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// --- Global error handler ---
// This catches any error that was passed to next(error) in route handlers.
// We centralize error formatting here so we never accidentally leak stack traces.
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  const statusCode = error.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong."
      : error.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

// Only start the server if this file is run directly (not imported by tests)
if (require.main === module) {
  startServer();
}

module.exports = app;
