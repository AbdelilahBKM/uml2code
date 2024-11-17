import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'hello@example.com'
        },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Return user data including the 'id'
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          randomKey: 'Hey cool'
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Add 'id' from the token into the session object
      if (session.user) {
        session.user.id = token.id as string // Adding 'id' to the session user
        session.user.email = token.email as string // Optional: Ensure email is added
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id // Store 'id' in the JWT token
        token.email = user.email // Store email in the JWT token
      }
      return token
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
