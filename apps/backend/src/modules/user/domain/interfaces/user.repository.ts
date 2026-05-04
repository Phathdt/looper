import type { Post } from '@modules/post'

import type { User, UserCredentials } from '../entities/user.entity'

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByIds(ids: string[]): Promise<User[]>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findCredentialsByEmail(email: string): Promise<UserCredentials | null>
  abstract create(data: { name: string; email: string; password: string }): Promise<User>
  abstract postsByAuthor(authorId: string, first: number): Promise<Post[]>
  abstract postsByAuthors(authorIds: readonly string[], first: number): Promise<Map<string, Post[]>>
}
