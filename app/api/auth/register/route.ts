import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: Request) {
  const body = await request.json()
  const { username, email, password, comfirPassword } = body

  if (!username || !email || !password) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing required fields' }),
      { status: 400 }
    )
  }
  if(password === comfirPassword){
    return new NextResponse(
      JSON.stringify({ message: 'Passwords does not match' }),
      { status: 400 }
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (existingUser) {
    return new NextResponse(
      JSON.stringify({ message: 'User already exists' }),
      { status: 409 }
    )
  }

  const hashedPassword = await hash(password, 12)

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword
    }
  })

  // Generate JWT token after successful registration
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email }, // Payload
    JWT_SECRET,  // Secret key
    { expiresIn: '1h' } // Expiration time
  )

  // Send response with the JWT token
  return new NextResponse(
    JSON.stringify({ message: 'User created successfully', token }),
    { status: 201 }
  )
}
