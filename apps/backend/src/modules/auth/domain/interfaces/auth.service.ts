import type { User } from '@modules/user'

import type { LoginInput } from '../dto/login.input'
import type { RegisterInput } from '../dto/register.input'

export interface AuthSession {
  token: string
  user: User & { followersCount: number; isFollowing: boolean }
}

export abstract class IAuthService {
  abstract register(input: RegisterInput): Promise<AuthSession>
  abstract login(input: LoginInput): Promise<AuthSession>
}
