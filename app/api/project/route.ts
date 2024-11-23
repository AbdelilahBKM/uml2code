import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import verifyToken from "@/Controllers/VerifyToken";
import { CreateProject, DeletepProject } from "@/Controllers/ProjectControllers";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        const decode = await verifyToken(authHeader!);
        console.log('Decoded token:', decode); 
        const response = await CreateProject(request, decode.id);
        return new NextResponse(JSON.stringify(response.body), {status: response.status})

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }

        console.error('Internal server error:', error);
        console.error(error.stack);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}

// DELETE function to handle project deletion
export async function DELETE(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        const decode = await verifyToken(authHeader!);
        console.log('Decoded token:', decode);

        const response = await DeletepProject(request, decode.id);
        return new NextResponse(JSON.stringify(response.body), {status: response.status});

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }

        console.error('Internal server error:', error);
        console.error(error.stack);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}
