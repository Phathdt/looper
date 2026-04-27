export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface UserCredentials extends User {
  password: string
}
