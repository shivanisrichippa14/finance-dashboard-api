require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const { User } = require("../src/models/User");
const { connectTestDB, clearTestDB, closeTestDB } = require("./testSetup");

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

// Helper: register and login, return token
const loginAs = async (role, email = null) => {
  const userEmail = email || `${role}@test.com`;

  const registerRes = await request(app).post("/api/auth/register").send({
    name: `Test ${role}`,
    email: userEmail,
    password: "password123",
  });

  // Force the role in DB — register always gives "viewer"
  if (role !== "viewer") {
    await User.findByIdAndUpdate(registerRes.body.data.user.id, { role });
  }

  const loginRes = await request(app).post("/api/auth/login").send({
    email: userEmail,
    password: "password123",
  });

  return loginRes.body.data.token;
};

// Helper: create a transaction as admin
const createTransaction = async (adminToken, overrides = {}) => {
  const payload = {
    amount: 1500,
    type: "expense",
    category: "marketing",
    description: "Google Ads campaign",
    date: "2024-06-15",
    ...overrides,
  };

  return request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(payload);
};

// -----------------------------------------------
describe("RBAC — transaction access by role", () => {
  it("viewer should NOT be able to read raw transactions", async () => {
    const token = await loginAs("viewer");
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("analyst should be able to read transactions", async () => {
    const token = await loginAs("analyst");
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it("analyst should NOT be able to create a transaction", async () => {
    const token = await loginAs("analyst");
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 500,
        type: "expense",
        category: "operations",
      });

    expect(res.statusCode).toBe(403);
  });

  it("viewer should be able to access the dashboard summary", async () => {
    const token = await loginAs("viewer");
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    // This is the key behaviour — viewers get aggregated data but not raw records
    expect(res.statusCode).toBe(200);
  });
});

// -----------------------------------------------
describe("POST /api/transactions", () => {
  it("admin should create a transaction successfully", async () => {
    const token = await loginAs("admin");
    const res = await createTransaction(token);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.transaction.amount).toBe(1500);
    expect(res.body.data.transaction.category).toBe("marketing");
  });

  it("should reject transaction with invalid category", async () => {
    const token = await loginAs("admin");
    const res = await createTransaction(token, { category: "made_up_category" });

    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject transaction with negative amount", async () => {
    const token = await loginAs("admin");
    const res = await createTransaction(token, { amount: -100 });

    expect(res.statusCode).toBe(422);
  });

  it("should reject transaction with amount of 0", async () => {
    const token = await loginAs("admin");
    const res = await createTransaction(token, { amount: 0 });

    expect(res.statusCode).toBe(422);
  });
});

// -----------------------------------------------
describe("DELETE /api/transactions/:id — soft delete", () => {
  it("should soft delete and not return the transaction in future queries", async () => {
    const token = await loginAs("admin");

    // Create a transaction
    const createRes = await createTransaction(token);
    const txId = createRes.body.data.transaction._id;

    // Delete it
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);

    // It should NOT appear in the list anymore
    const listRes = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    const ids = listRes.body.data.transactions.map((t) => t._id);
    expect(ids).not.toContain(txId);
  });

  it("should return 404 when deleting an already-deleted transaction", async () => {
    const token = await loginAs("admin");

    const createRes = await createTransaction(token);
    const txId = createRes.body.data.transaction._id;

    // Delete once
    await request(app)
      .delete(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`);

    // Try to delete again — should fail cleanly
    const res = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// -----------------------------------------------
describe("GET /api/transactions — filtering", () => {
  it("should filter transactions by type", async () => {
    const token = await loginAs("admin");

    await createTransaction(token, { type: "expense" });
    await createTransaction(token, { type: "income", category: "revenue" });

    const res = await request(app)
      .get("/api/transactions?type=expense")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const allExpense = res.body.data.transactions.every(
      (t) => t.type === "expense"
    );
    expect(allExpense).toBe(true);
  });

  it("should paginate results correctly", async () => {
    const token = await loginAs("admin");

    // Create 3 transactions
    await createTransaction(token, { amount: 100 });
    await createTransaction(token, { amount: 200 });
    await createTransaction(token, { amount: 300 });

    const res = await request(app)
      .get("/api/transactions?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.transactions.length).toBe(2);
    expect(res.body.data.pagination.totalRecords).toBe(3);
    expect(res.body.data.pagination.hasNextPage).toBe(true);
  });
});
