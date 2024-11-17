import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return new NextResponse(JSON.stringify({ 'message': 'unauthorized' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    try {
        const decode = await jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: { id: true, email: true, username: true, projects: true }
        });
        if (!user) {
            return new NextResponse(JSON.stringify({ 'message': 'user not found' }), { status: 404 });
        }
        return new NextResponse(JSON.stringify(user), { status: 200 });
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }
        console.error('Internal server error:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}