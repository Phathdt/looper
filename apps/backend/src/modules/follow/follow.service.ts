import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException("Cannot follow yourself");
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    return true;
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow
      .delete({
        where: { followerId_followingId: { followerId, followingId } },
      })
      .catch(() => null);
    return true;
  }
}
