import { Injectable } from '@nestjs/common'

import type { Post as PrismaPost, User as PrismaUser } from '../../../../../prisma/generated/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { UserRepository } from '../../domain/interfaces/user.repository'

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  create(data: { name: string; email: string; password: string }): Promise<PrismaUser> {
    return this.prisma.user.create({ data })
  }

  postsByAuthor(authorId: string, first: number): Promise<PrismaPost[]> {
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: first,
    })
  }
}
