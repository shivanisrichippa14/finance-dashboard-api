require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const { connectTestDB, clearTestDB, closeTestDB } = require("./testSetup");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/auth/register", () => {
  const validUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    // New users should always get viewer role — not admin
    expect(res.body.data.user.role).toBe("viewer");
  });

  it("should not return the password in the response", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should reject duplicate email registrations", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should reject registration with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "incomplete@test.com" }); // missing name and password

    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it("should reject invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "not-an-email", password: "password123" });

    expect(res.statusCode).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // Register a user to log in with
    await request(app).post("/api/auth/register").send({
      name: "Login Test",
      email: "login@example.com",
      password: "password123",
    });
  });

  it("should login successfully with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("should reject wrong password with generic error message", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    // Should NOT say "wrong password" specifically — that helps attackers
    expect(res.body.message).toBe("Invalid email or password.");
  });

  it("should reject non-existent email with same generic error", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid email or password.");
  });
});

describe("GET /api/auth/me", () => {
  it("should return user profile when authenticated", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Me Test",
      email: "me@example.com",
      password: "password123",
    });

    const token = registerRes.body.data.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe("me@example.com");
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("should reject request with a fake token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.fake");

    expect(res.statusCode).toBe(401);
  });
});
