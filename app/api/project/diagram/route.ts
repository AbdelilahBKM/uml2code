import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UMLClass, UMLAssociation, Diagram, Project } from "@/types/UMLClass.Type";
import jwt from "jsonwebtoken";
import { json } from "stream/consumers";

const JWT_SECRET = process.env.JWT_SECRET;

//GET /api/project/diagram?projectId={id}
export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return new NextResponse(JSON.stringify({ 'message': 'unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decode = await jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decode);

        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: { id: true, email: true, username: true, projects: true }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ 'message': 'user not found' }), { status: 404 });
        }
        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');
        if (!projectId) {
            return new NextResponse(JSON.stringify({ message: 'Project id is required' }), { status: 400 });
        }

        if (!user.id) {
            return new NextResponse(JSON.stringify({ message: 'Invalid user ID' }), { status: 400 });
        }
        const project = await prisma.project.findUnique({
            where: {
                id: projectId
            },
            select: {
                userid: true, diagram: {
                    include: {
                        uml_classes: true, uml_association: true
                    }
                }
            }
        });

        if (!project) {
            return new NextResponse(JSON.stringify({ message: 'Project not found' }), { status: 404 });
        }
        if (project.userid !== user.id) {
            return new NextResponse(JSON.stringify({ message: 'unauthorized to access project' }), { status: 403 });
        }

        return new NextResponse(JSON.stringify(project.diagram), { status: 200 });

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }

        console.error('Internal server error:', error);
        console.error(error.stack);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}

//PUT /api/project/diagram?projectId={id}
export async function PUT(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return new NextResponse(JSON.stringify({ 'message': 'unauthorized' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decode = await jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decode);

        const user = await prisma.user.findUnique({
            where: { id: decode.id },
            select: { id: true, email: true, username: true, projects: true }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ 'message': 'user not found' }), { status: 404 });
        }
        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');
        if (!projectId) {
            return new NextResponse(JSON.stringify({ message: 'Project id is required' }), { status: 400 });
        }

        if (!user.id) {
            return new NextResponse(JSON.stringify({ message: 'Invalid user ID' }), { status: 400 });
        }
        const project = await prisma.project.findUnique({
            where: {
                id: projectId
            },
            select: { userid: true }
        });

        if (!project) {
            return new NextResponse(JSON.stringify({ message: 'Project not found' }), { status: 404 });
        }
        if (project.userid !== user.id) {
            return new NextResponse(JSON.stringify({ message: 'unauthorized to access project' }), { status: 403 });
        }

        const diagram: Diagram = await request.json();
        if (!diagram) {
            return new Response(JSON.stringify({ message: 'Diagram is required!' }), { status: 400 });
        }

        for (const cls of diagram.uml_classes) {
            const uml_cls = await prisma.uMLClass.create({
                data: { name: cls.name, shape: cls.shape, diagramId: diagram.id },
            });

            await prisma.position.create({
                data: { x: cls.position.x, y: cls.position.y, uml_classId: uml_cls.id },
            });

            await Promise.all(cls.attributes.map(attr =>
                prisma.attribute.create({
                    data: {
                        name: attr.name,
                        type: attr.type,
                        visibility: attr.visibility,
                        uml_classId: uml_cls.id,
                    },
                })
            ));

            await Promise.all(cls.methods.map(method =>
                prisma.method.create({
                    data: {
                        name: method.name,
                        visibility: method.visibility,
                        returnType: method.returnType,
                        uml_classId: uml_cls.id,
                    },
                })
            ));
        }


        await Promise.all(diagram.uml_association.map((ass) => {
            prisma.uMLAssociation.create({
                data: {
                    shape: ass.shape,
                    source: ass.source,
                    target: ass.target,
                    diagramId: diagram.id
                }
            })
        }));

        const newDiagram = await prisma.diagram.findUnique({
            where: { id: diagram.id },
            select: {
                id: true,
                projectId: true,
                uml_association: true,
                uml_classes: true
            }
        });
        if (!newDiagram) {
            return new Response(JSON.stringify({ message: 'Diagram not found' }), { status: 404 });
        }
        return new Response(JSON.stringify({ diagram: newDiagram }), { status: 201 });


    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
        }

        console.error('Internal server error:', error);
        console.error(error.stack);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}