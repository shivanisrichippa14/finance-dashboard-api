require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const { User } = require("../src/models/User");
const { connectTestDB, clearTestDB, closeTestDB } = require("./testSetup");

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

// Helper: register a user, force a role in DB, return their token
const loginAs = async (role) => {
  const email = `${role}_user_test@example.com`;

  const registerRes = await request(app).post("/api/auth/register").send({
    name: `Test ${role}`,
    email,
    password: "password123",
  });

  const userId = registerRes.body.data.user.id;

  if (role !== "viewer") {
    await User.findByIdAndUpdate(userId, { role });
  }

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "password123" });

  return { token: loginRes.body.data.token, userId };
};

describe("GET /api/users — admin only", () => {
  it("admin should fetch all users", async () => {
    const { token } = await loginAs("admin");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });

  it("analyst should be blocked from listing users", async () => {
    const { token } = await loginAs("analyst");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("viewer should be blocked from listing users", async () => {
    const { token } = await loginAs("viewer");

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("unauthenticated request should be rejected", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toBe(401);
  });
});

describe("PATCH /api/users/:id/role — role promotion", () => {
  it("admin should promote a viewer to analyst", async () => {
    const { token: adminToken } = await loginAs("admin");
    const { userId: viewerUserId } = await loginAs("viewer");

    // Promote the viewer
    const res = await request(app)
      .patch(`/api/users/${viewerUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "analyst" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.role).toBe("analyst");
  });

  it("admin should NOT be able to change their own role", async () => {
    const { token, userId } = await loginAs("admin");

    const res = await request(app)
      .patch(`/api/users/${userId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "viewer" });

    // This is the self-demotion guard — very important edge case
    expect(res.statusCode).toBe(403);
  });

  it("should reject invalid role values", async () => {
    const { token: adminToken } = await loginAs("admin");
    const { userId: targetId } = await loginAs("viewer");

    const res = await request(app)
      .patch(`/api/users/${targetId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superadmin" }); // this role doesn't exist

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 for non-existent user ID", async () => {
    const { token } = await loginAs("admin");
    const fakeId = "507f1f77bcf86cd799439011";

    const res = await request(app)
      .patch(`/api/users/${fakeId}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "analyst" });

    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /api/users/:id/status — activate / deactivate", () => {
  it("admin should deactivate a user", async () => {
    const { token: adminToken } = await loginAs("admin");
    const { userId: targetId } = await loginAs("viewer");

    const res = await request(app)
      .patch(`/api/users/${targetId}/status`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.isActive).toBe(false);
  });

  it("deactivated user should not be able to login", async () => {
    const email = "deactivated@example.com";

    // Create a user
    await request(app).post("/api/auth/register").send({
      name: "Soon Deactivated",
      email,
      password: "password123",
    });

    const { token: adminToken } = await loginAs("admin");

    // Find the user we just created and deactivate them
    const targetUser = await User.findOne({ email });
    await request(app)
      .patch(`/api/users/${targetUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Now try to login — should be blocked
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "password123" });

    expect(loginRes.statusCode).toBe(403);
  });

  it("admin should not be able to deactivate themselves", async () => {
    const { token, userId } = await loginAs("admin");

    const res = await request(app)
      .patch(`/api/users/${userId}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it("toggling status twice should restore active state", async () => {
    const { token: adminToken } = await loginAs("admin");
    const { userId: targetId } = await loginAs("viewer");

    // Deactivate
    await request(app)
      .patch(`/api/users/${targetId}/status`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Reactivate
    const reactivateRes = await request(app)
      .patch(`/api/users/${targetId}/status`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(reactivateRes.body.data.user.isActive).toBe(true);
  });
});

describe("Edge cases — invalid IDs", () => {
  it("should return 400 for malformed MongoDB ID", async () => {
    const { token } = await loginAs("admin");

    const res = await request(app)
      .get("/api/users/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`);

    // validateMongoId middleware catches this before it hits the DB
    expect(res.statusCode).toBe(400);
  });
});
