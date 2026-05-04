import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { hash } from 'bcryptjs'

import { PrismaClient } from './generated/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()

  const password = await hash('password123', 10)

  const users = await Promise.all(
    ['alice', 'bob', 'carol', 'dave', 'eve'].map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `${name}@looper.dev`,
          password,
          createdAt: new Date(Date.now() - i * 86400_000),
        },
      }),
    ),
  )

  const posts: Array<{ id: string; authorId: string; content: string; createdAt: Date }> = []
  for (let i = 0; i < 20; i++) {
    const author = users[i % users.length]
    posts.push(
      await prisma.post.create({
        data: {
          content: `Post #${i + 1} by ${author.name} — ${Math.random().toString(36).slice(2)}`,
          authorId: author.id,
          createdAt: new Date(Date.now() - i * 3_600_000),
        },
      }),
    )
  }

  for (let i = 0; i < 40; i++) {
    const post = posts[i % posts.length]
    const author = users[(i + 1) % users.length]
    await prisma.comment.create({
      data: {
        content: `Comment #${i + 1} from ${author.name}`,
        postId: post.id,
        authorId: author.id,
      },
    })
  }

  // Deterministic follow graph: each user follows the next two (cyclic).
  // alice does NOT follow bob — keeps e2e follow scenario reproducible.
  const follows = [
    ['alice', 'carol'],
    ['alice', 'dave'],
    ['bob', 'alice'],
    ['bob', 'carol'],
    ['carol', 'dave'],
    ['carol', 'eve'],
    ['dave', 'eve'],
    ['dave', 'alice'],
    ['eve', 'alice'],
    ['eve', 'bob'],
  ]
  const byName = new Map(users.map((u) => [u.name, u]))
  for (const [followerName, followingName] of follows) {
    const follower = byName.get(followerName)!
    const following = byName.get(followingName)!
    await prisma.follow.create({
      data: { followerId: follower.id, followingId: following.id },
    })
  }

  // Deterministic likes: each user likes posts NOT authored by themselves.
  // Pattern: user[i] likes posts[j] where (i + j) % 3 !== 0 → ~13 likes per user, ~67 total.
  let likeCount = 0
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < posts.length; j++) {
      if (posts[j].authorId === users[i].id) continue
      if ((i + j) % 3 === 0) continue
      await prisma.like.create({ data: { userId: users[i].id, postId: posts[j].id } })
      likeCount++
    }
  }

  console.log(`Seeded: ${users.length} users, ${posts.length} posts, ${likeCount} likes`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
