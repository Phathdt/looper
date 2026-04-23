import { Test, type TestingModule } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuthModule } from "../../src/modules/auth/auth.module";
import { PrismaModule } from "../../src/modules/prisma/prisma.module";
import { AuthService } from "../../src/modules/auth/auth.service";
import { startPostgres, stopPostgres } from "../setup-postgres";

describe("AuthService (integration)", () => {
  let moduleRef: TestingModule;
  let auth: AuthService;

  beforeAll(async () => {
    await startPostgres();
    process.env.JWT_SECRET = "test-secret";
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();
    auth = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await moduleRef?.close();
    await stopPostgres();
  });

  it("registers a new user and returns JWT", async () => {
    const email = `new-${Date.now()}@looper.test`;
    const result = await auth.register({ name: "New", email, password: "password123" });
    expect(result.token).toMatch(/^eyJ/);
    expect(result.user.email).toBe(email);
    expect(result.user.name).toBe("New");
  });

  it("rejects duplicate email", async () => {
    const email = `dup-${Date.now()}@looper.test`;
    await auth.register({ name: "A", email, password: "password123" });
    await expect(auth.register({ name: "B", email, password: "password123" })).rejects.toThrow(
      /already/i,
    );
  });

  it("logs in with correct password", async () => {
    const email = `login-${Date.now()}@looper.test`;
    await auth.register({ name: "L", email, password: "password123" });
    const result = await auth.login({ email, password: "password123" });
    expect(result.token).toMatch(/^eyJ/);
  });

  it("rejects login with wrong password", async () => {
    const email = `wrong-${Date.now()}@looper.test`;
    await auth.register({ name: "W", email, password: "password123" });
    await expect(auth.login({ email, password: "wrongpass" })).rejects.toThrow(/invalid/i);
  });
});
