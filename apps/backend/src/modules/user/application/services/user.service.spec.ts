import type { Post } from '@modules/post'

import { describe, expect, it, vi } from 'vitest'

import type { User } from '../../domain/entities/user.entity'
import { UserNotFoundError } from '../../domain/errors'
import type { IUserRepository } from '../../domain/interfaces/user.repository'
import { UserService } from './user.service'

function makeRepo(user: User | null = null, posts: Post[] = []) {
  return {
    findById: vi.fn(async () => user),
    postsByAuthor: vi.fn(async () => posts),
  } as unknown as IUserRepository
}

describe('UserService', () => {
  it('findById: returns user when found', async () => {
    const testUser: User = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    }
    const repo = makeRepo(testUser)
    const svc = new UserService(repo)

    const result = await svc.findById('u1')

    expect(result).toEqual(testUser)
    expect(repo.findById).toHaveBeenCalledWith('u1')
  })

  it('findById: throws UserNotFoundError when user is null', async () => {
    const repo = makeRepo(null)
    const svc = new UserService(repo)

    await expect(svc.findById('missing')).rejects.toBeInstanceOf(UserNotFoundError)
    expect(repo.findById).toHaveBeenCalledWith('missing')
  })

  it('postsByAuthor: delegates to repo with default first=20', async () => {
    const posts: Post[] = [
      {
        id: 'p1',
        content: 'Post 1',
        createdAt: new Date(),
        authorId: 'u1',
      },
    ]
    const repo = makeRepo(undefined, posts)
    const svc = new UserService(repo)

    const result = await svc.postsByAuthor('u1')

    expect(result).toEqual(posts)
    expect(repo.postsByAuthor).toHaveBeenCalledWith('u1', 20)
  })

  it('postsByAuthor: respects provided first parameter', async () => {
    const posts: Post[] = []
    const repo = makeRepo(undefined, posts)
    const svc = new UserService(repo)

    await svc.postsByAuthor('u1', 50)

    expect(repo.postsByAuthor).toHaveBeenCalledWith('u1', 50)
  })
})
