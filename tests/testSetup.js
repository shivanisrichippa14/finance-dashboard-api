// We use a real MongoDB instance for tests — not mocks.
// This means tests run against actual Mongoose queries which catches real bugs
// like bad aggregation pipelines, schema validation issues, and index problems.
//
// To run tests you need MongoDB running locally:
//   - Local: make sure mongod is running on port 27017
//   - Atlas: set MONGO_URI_TEST in your .env file

const mongoose = require("mongoose");

const TEST_DB_URI =
  process.env.MONGO_URI_TEST ||
  "mongodb://localhost:27017/finance_dashboard_test";

const connectTestDB = async () => {
  // 10 second timeout — enough for Atlas cold starts
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 10000 });
};

const clearTestDB = async () => {
  // Wipe all collections between tests so each test starts with clean state.
  // This is why we use a separate _test database — never wipe production data.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };
