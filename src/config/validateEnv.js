// This runs once when the server starts.
// If a required environment variable is missing, we crash immediately with a clear message
// instead of getting a mysterious error 10 minutes later when that variable is first used.
//
// Real scenario: someone deploys without setting JWT_SECRET.
// Without this check, the server starts fine — but every login attempt silently fails.
// With this check, the server refuses to start and tells you exactly what's wrong.

const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\nCopy .env.example to .env and fill in the values.");
    process.exit(1);
  }
};

module.exports = validateEnv;
