import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    username?: string
    randomKey?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      username?: string
      randomKey?: string
    }
  }
}
