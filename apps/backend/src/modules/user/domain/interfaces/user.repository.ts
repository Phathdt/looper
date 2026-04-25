import type {
  Post as PrismaPost,
  User as PrismaUser,
} from "../../../../../prisma/generated/client";

export abstract class UserRepository {
  abstract findById(id: string): Promise<PrismaUser | null>;
  abstract findByEmail(email: string): Promise<PrismaUser | null>;
  abstract create(data: { name: string; email: string; password: string }): Promise<PrismaUser>;
  abstract postsByAuthor(authorId: string, first: number): Promise<PrismaPost[]>;
}
