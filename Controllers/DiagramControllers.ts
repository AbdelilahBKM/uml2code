import { prisma } from "@/lib/prisma";
import { Diagram, UMLClass } from "@/types/UMLClass.Type";
import { Target } from "lucide-react";

interface ExtensionClass extends UMLClass {
    associated_id?: number;
}

export async function fetchDiagram(request: Request, userId: string) {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
        return { status: 400, body: { message: "Project ID is required" } };
    }
    
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            userid: true,
            diagram: {
                include: {
                    uml_classes: {
                        select: {
                            id: true,
                            name: true,
                            shape: true,
                            attributes: true,
                            methods: true,
                            position: true
                        }
                    },
                    uml_association: true,
                    
                },
            },
        },
    });

    if (!project) {
        return { status: 404, body: { message: "Project not found" } };
    }

    if (project.userid !== userId) {
        return { status: 403, body: { message: "Unauthorized to access project" } };
    }

    return { status: 200, body: project.diagram };
}

// =========================> Update <=================================
export async function updateDiagram(request: Request, userId: string) {
    console.log("==> Udating AT: " + new Date());
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
        return { status: 400, body: { message: "Project ID is required" } };
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userid: true },
    });

    if (!project) {
        return { status: 404, body: { message: "Project not found" } };
    }

    if (project.userid !== userId) {
        return { status: 403, body: { message: "Unauthorized to access project" } };
    }

    const diagram: Diagram = await request.json();
    if (!diagram) {
        return { status: 400, body: { message: "Diagram is required" } };
    }

    // =====> UML CLASSES:
    const uml_classes: ExtensionClass[] = diagram.uml_classes;
    console.log(uml_classes);
    
    const existingClasses = await prisma.uMLClass.findMany({
        where: { id: { in: uml_classes.map(cls => cls.id) } },
        include: { attributes: true, methods: true },
    });

    for (const cls of uml_classes) {
        const existingClass = existingClasses.find((existing) => existing.id === cls.id);

        if (existingClass) {
            cls.associated_id = cls.id;

            // Handle updates for attributes
            const existingAttributes = existingClass.attributes;
            const incomingAttributes = cls.attributes;

            // Determine attributes to delete and add
            const attributesToDelete = existingAttributes.filter(
                (attr) => !incomingAttributes.some((newAttr) => newAttr.id === attr.id)
            );
            const attributesToAdd = incomingAttributes.filter(
                (newAttr) => !existingAttributes.some((attr) => attr.id === newAttr.id)
            );

            // Delete removed attributes
            await Promise.all(
                attributesToDelete.map((attr) =>
                    prisma.attribute.delete({ where: { id: attr.id } })
                )
            );

            // Add new attributes
            await Promise.all(
                attributesToAdd.map((attr) =>
                    prisma.attribute.create({
                        data: {
                            name: attr.name,
                            type: attr.type,
                            visibility: attr.visibility,
                            uml_classId: cls.id,
                        },
                    })
                )
            );

            // Handle updates for methods
            const existingMethods = existingClass.methods;
            const incomingMethods = cls.methods;

            const methodsToDelete = existingMethods.filter(
                (method) => !incomingMethods.some((newMethod) => newMethod.id === method.id)
            );
            const methodsToAdd = incomingMethods.filter(
                (newMethod) => !existingMethods.some((method) => method.id === newMethod.id)
            );

            // Delete removed methods
            await Promise.all(
                methodsToDelete.map((method) =>
                    prisma.method.delete({ where: { id: method.id } })
                )
            );

            // Add new methods
            await Promise.all(
                methodsToAdd.map((method) =>
                    prisma.method.create({
                        data: {
                            name: method.name,
                            visibility: method.visibility,
                            returnType: method.returnType,
                            uml_classId: cls.id,
                        },
                    })
                )
            );
        } else {
            const uml_cls = await prisma.uMLClass.create({
                data: { name: cls.name, shape: cls.shape, diagramId: diagram.id },
            });
            cls.associated_id = uml_cls.id;

            await prisma.position.create({
                data: { x: cls.position.x, y: cls.position.y, uml_classId: uml_cls.id },
            });

            await Promise.all(
                cls.attributes.map((attr) =>
                    prisma.attribute.create({
                        data: {
                            name: attr.name,
                            type: attr.type,
                            visibility: attr.visibility,
                            uml_classId: uml_cls.id,
                        },
                    })
                )
            );

            await Promise.all(
                cls.methods.map((method) =>
                    prisma.method.create({
                        data: {
                            name: method.name,
                            visibility: method.visibility,
                            returnType: method.returnType,
                            uml_classId: uml_cls.id,
                        },
                    })
                )
            );
        }
    }

    // =====> UML ASSOCIATIONS:
    await Promise.all(
        diagram.uml_association.map(async (ass) => {
            const exists = await prisma.uMLAssociation.findUnique({
                where: { id: ass.id },
            });

            if (exists) {
                return;
            }
            const sourceClassID = uml_classes.find((cls) => cls.id === ass.source)?.associated_id;
            const targetClassID = uml_classes.find((cls) => cls.id === ass.target)?.associated_id;
            const sourceClass = await prisma.uMLClass.findUnique({
                where: {id: sourceClassID}
            })
            const targetClass = await prisma.uMLClass.findUnique({
                where: {id: targetClassID}
            });

            if (!sourceClass || !targetClass) {
                console.error('Invalid source or target Id', ass);
                return { body: { message: 'Invalid Association', association: ass }, status: 500 };
            }

            await prisma.uMLAssociation.create({
                data: {
                    shape: ass.shape,
                    sourceId: sourceClass.id,
                    targetId: targetClass.id,
                    diagramId: diagram.id
                },
            });
        })
    );

    const AllClasses = await prisma.uMLClass.findMany({
        where: {
            diagramId: diagram.id,
        },
    });
    
    const classesToDelete = AllClasses.filter(
        (cls) => !uml_classes.some((newClass) => newClass.associated_id === cls.id)
    );
    
    await Promise.all(
        classesToDelete.map((cls) =>
            prisma.uMLClass.delete({
                where: { id: cls.id },
            })
        )
    );
    
    const updatedDiagram = await prisma.diagram.findUnique({
        where: {id: diagram.id},
        select: {
            uml_classes: {
                select: {
                    id: true,
                    name: true,
                    shape: true,
                    attributes: true,
                    methods: true,
                    position: true
                }
            },
            uml_association: true

        }
    });

    
    return { status: 201, body: { message: "Diagram updated successfully", update: updatedDiagram} };
}


