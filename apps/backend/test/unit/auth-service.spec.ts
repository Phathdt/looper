import { describe, expect, it, beforeEach, vi } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { AuthService } from "../../src/modules/auth/auth.service";
import type { PrismaService } from "../../src/modules/prisma/prisma.service";

function makeService() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  } as unknown as PrismaService;
  const jwt = { sign: vi.fn(() => "tok-abc") } as unknown as JwtService;
  return { service: new AuthService(prisma, jwt), prisma, jwt };
}

describe("AuthService (unit)", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("register", () => {
    it("throws ConflictException when email already taken", async () => {
      const { service, prisma } = makeService();
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" });
      await expect(
        service.register({ name: "a", email: "a@b.c", password: "secret123" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("hashes password + creates user + returns signed token", async () => {
      const { service, prisma, jwt } = makeService();
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const created = {
        id: "u1",
        name: "alice",
        email: "a@b.c",
        password: "hashed",
        createdAt: new Date(),
      };
      (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);

      const result = await service.register({
        name: "alice",
        email: "a@b.c",
        password: "secret123",
      });

      const createCall = (prisma.user.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(createCall.data.email).toBe("a@b.c");
      expect(createCall.data.password).not.toBe("secret123");
      expect(await bcrypt.compare("secret123", createCall.data.password)).toBe(true);
      expect(jwt.sign).toHaveBeenCalledWith({ sub: "u1", email: "a@b.c" });
      expect(result.token).toBe("tok-abc");
      expect(result.user.id).toBe("u1");
    });
  });

  describe("login", () => {
    it("rejects missing user", async () => {
      const { service, prisma } = makeService();
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.login({ email: "nope@x.x", password: "any" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects wrong password", async () => {
      const { service, prisma } = makeService();
      const hash = await bcrypt.hash("correct", 10);
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "u1",
        name: "a",
        email: "a@b.c",
        password: hash,
        createdAt: new Date(),
      });
      await expect(service.login({ email: "a@b.c", password: "wrong" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("returns token on valid credentials", async () => {
      const { service, prisma, jwt } = makeService();
      const hash = await bcrypt.hash("correct", 10);
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "u1",
        name: "a",
        email: "a@b.c",
        password: hash,
        createdAt: new Date(),
      });
      const result = await service.login({ email: "a@b.c", password: "correct" });
      expect(jwt.sign).toHaveBeenCalled();
      expect(result.token).toBe("tok-abc");
      expect(result.user.email).toBe("a@b.c");
    });
  });
});
