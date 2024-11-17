import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing email or password' }),
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (!user) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      { status: 401 }
    )
  }
  const isPasswordValid = await compare(password, user.password)

  if (!isPasswordValid) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      { status: 401 }
    )
  }

  // Generate JWT token after successful login
  const token = jwt.sign(
    { id: user.id, email: user.email }, // Payload
    JWT_SECRET,  // Secret key
    // { expiresIn: '1h' } // Expiration time
  )

  // Send response with the JWT token
  return new NextResponse(
    JSON.stringify({ message: 'Login successful', token }),
    { status: 200 }
  )
}
