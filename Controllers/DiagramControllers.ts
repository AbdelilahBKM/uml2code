import { prisma } from "@/lib/prisma";
import { Diagram, UMLClass, UMLAssociation } from "@/types/UMLClass.Type";
import { Target } from "lucide-react";

interface ExtensionClass extends UMLClass {
    associated_id?: number;
}

interface ExtensionAssociations extends UMLAssociation {
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
                select: {
                    id: true,
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
                    uml_association: {
                        select: {
                            id: true,
                            shape: true,
                            sourceId: true,
                            targetId: true,
                        }
                    },

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
    const diagram = project.diagram;
    console.log(diagram);
    return { status: 200, body: diagram };
}

// =========================> Update <=================================
export async function updateDiagram(request: Request, userId: string) {
    console.log("\n", "============> Udating AT: " + new Date() + "<===========================");
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
        return { status: 400, body: { message: "Project ID is required" } };
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userid: true, diagram: true },
    });
    if (!project) {
        return { status: 404, body: { message: "Project not found" } };
    }

    if (project.userid !== userId) {
        return { status: 403, body: { message: "Unauthorized to access project" } };
    }
    const DiagramId = project?.diagram?.id;
    const diagram: Diagram = await request.json();
    if (!diagram) {
        return { status: 400, body: { message: "Diagram is required" } };
    }
    console.log("Diagram ===>", diagram);
    // =====> UML CLASSES:
    const uml_classes: ExtensionClass[] = diagram.uml_classes;
    const uml_association: ExtensionAssociations[] = diagram.uml_association;

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
                data: { name: cls.name, shape: cls.shape, diagramId: DiagramId! },
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
        uml_association.map(async (ass) => {
            const exists = await prisma.uMLAssociation.findUnique({
                where: { id: ass.id },
            });

            if (exists) {
                console.log("association already exist", exists);
                ass.associated_id = exists.id;
                return;
            }
            const sourceClassID = uml_classes.find((cls) => cls.id === ass.sourceId)?.associated_id;
            const targetClassID = uml_classes.find((cls) => cls.id === ass.targetId)?.associated_id;
            const sourceClass = await prisma.uMLClass.findUnique({
                where: { id: sourceClassID }
            })
            const targetClass = await prisma.uMLClass.findUnique({
                where: { id: targetClassID }
            });

            if (!sourceClass || !targetClass) {
                console.error('Invalid source or target Id', ass);
                return { body: { message: 'Invalid Association', association: ass }, status: 500 };
            }

            const newAss = await prisma.uMLAssociation.create({
                data: {
                    shape: ass.shape,
                    sourceId: sourceClass.id,
                    targetId: targetClass.id,
                    label: ass.label || null,
                    diagramId: DiagramId!
                },
            });
            ass.associated_id = newAss.id;
        })
    );

    const AllClasses = await prisma.uMLClass.findMany({
        where: {
            diagramId: DiagramId!,
        },
    });

    const AllAssociations = await prisma.uMLAssociation.findMany({
        where: {
            diagramId: DiagramId!
        }
    });

    const classesToDelete = AllClasses.filter(
        (cls) => !uml_classes.some((ittClass) => ittClass.associated_id === cls.id)
    );
    
    const associationsToDelete = AllAssociations.filter(
        (ass) => !uml_association.some((ittAssoc) => ittAssoc.associated_id === ass.id)
    );

    await Promise.all(
        classesToDelete.map((cls) =>
            prisma.uMLClass.delete({
                where: { id: cls.id },
            })
        )
    );

    await Promise.all(
        associationsToDelete.map((ass) =>
            prisma.uMLAssociation.delete({
                where: { id: ass.id },
            })
        )
    )
    
    await prisma.project.update({
        where: { id: projectId },
        data: { updated_at: new Date() }
    });
    
    const updatedDiagram = await prisma.diagram.findUnique({
        where: { id: DiagramId! },
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


    return { status: 201, body: { message: "Diagram updated successfully", update: updatedDiagram } };
}


