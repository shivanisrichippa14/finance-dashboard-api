require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const { User } = require("../src/models/User");
const { connectTestDB, clearTestDB, closeTestDB } = require("./testSetup");

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

const loginAs = async (role) => {
  const email = `${role}dash@test.com`;
  const registerRes = await request(app).post("/api/auth/register").send({
    name: `Dash ${role}`,
    email,
    password: "password123",
  });

  if (role !== "viewer") {
    await User.findByIdAndUpdate(registerRes.body.data.user.id, { role });
  }

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  return loginRes.body.data.token;
};

const seedTransactions = async (adminToken) => {
  const transactions = [
    { amount: 5000, type: "income", category: "revenue", date: "2024-06-01" },
    { amount: 1200, type: "expense", category: "marketing", date: "2024-06-05" },
    { amount: 800, type: "expense", category: "infrastructure", date: "2024-06-10" },
    { amount: 3000, type: "income", category: "investment", date: "2024-05-15" },
  ];

  for (const tx of transactions) {
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(tx);
  }
};

describe("GET /api/dashboard/summary", () => {
  it("should return correct income, expense, and net balance", async () => {
    const token = await loginAs("admin");
    await seedTransactions(token);

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    // 5000 + 3000 = 8000 income, 1200 + 800 = 2000 expenses
    expect(res.body.data.totalIncome).toBe(8000);
    expect(res.body.data.totalExpenses).toBe(2000);
    expect(res.body.data.netBalance).toBe(6000);
  });

  it("should return zero values when no transactions exist", async () => {
    const token = await loginAs("viewer");

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.totalExpenses).toBe(0);
    expect(res.body.data.netBalance).toBe(0);
  });

  it("summary should NOT include soft-deleted transactions", async () => {
    const token = await loginAs("admin");

    // Create then delete a transaction
    const txRes = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 9999, type: "income", category: "revenue" });

    await request(app)
      .delete(`/api/transactions/${txRes.body.data.transaction._id}`)
      .set("Authorization", `Bearer ${token}`);

    const summaryRes = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    // The deleted 9999 should not be counted
    expect(summaryRes.body.data.totalIncome).toBe(0);
  });
});

describe("GET /api/dashboard/trends", () => {
  it("should reject invalid months param", async () => {
    const token = await loginAs("viewer");

    const res = await request(app)
      .get("/api/dashboard/trends?months=99")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it("should return trend data with valid months param", async () => {
    const token = await loginAs("viewer");

    const res = await request(app)
      .get("/api/dashboard/trends?months=3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.trends)).toBe(true);
  });
});
