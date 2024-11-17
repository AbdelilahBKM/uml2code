import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return new NextResponse(JSON.stringify({ 'message': 'unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decode = await jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decode); // Log the decoded token for debugging

        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: { id: true, email: true, username: true, projects: true }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ 'message': 'user not found' }), { status: 404 });
        }

        const body = await request.json();
        console.log('Request Body:', body);
        const { projectname } = body;

        // Check if projectname is valid
        if (!projectname) {
            return new NextResponse(JSON.stringify({ message: 'Project name is required' }), { status: 400 });
        }

        if (!user.id) {
            return new NextResponse(JSON.stringify({ message: 'Invalid user ID' }), { status: 400 });
        }

        const newProject = await prisma.project.create({
            data: {
                project_name: projectname,
                project_snippet: '',
                userid: user.id, 
            }
        });
        await prisma.diagram.create({
            data: {
                projectId: newProject.id,
            }
        })

        return new NextResponse(JSON.stringify({ message: 'Project added successfully', project: newProject }), { status: 201 });

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
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return new NextResponse(JSON.stringify({ 'message': 'unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decode = await jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decode); // Log the decoded token for debugging

        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: { id: true, email: true, username: true, projects: true }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ 'message': 'user not found' }), { status: 404 });
        }

        const body = await request.json();
        console.log('Request Body:', body);
        const { projectId } = body;

        // Check if projectId is provided
        if (!projectId) {
            return new NextResponse(JSON.stringify({ message: 'Project ID is required' }), { status: 400 });
        }

        // Check if the project belongs to the user
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return new NextResponse(JSON.stringify({ message: 'Project not found' }), { status: 404 });
        }

        if (project.userid !== user.id) {
            return new NextResponse(JSON.stringify({ message: 'Unauthorized to delete this project' }), { status: 403 });
        }

        // Delete the project
        await prisma.project.delete({
            where: { id: projectId },
        });

        return new NextResponse(JSON.stringify({ message: 'Project deleted successfully' }), { status: 200 });

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }

        console.error('Internal server error:', error);
        console.error(error.stack);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}
