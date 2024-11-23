import { prisma } from "@/lib/prisma";

export async function CreateProject(request: Request, userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, projects: true }
    });

    if (!user) {
        return { body: { 'message': 'user not found' }, status: 404 };
    }

    const body = await request.json();
    console.log('Request Body:', body);
    const { projectname } = body;

    // Check if projectname is valid
    if (!projectname) {
        return { body: { message: 'Project name is required' }, status: 400 };
    }

    if (!user.id) {
        return { body: { message: 'Invalid user ID' }, status: 400 };
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
    return { body: { message: 'Project added successfully', project: newProject }, status: 201 };

}

export async function DeletepProject(request: Request, userId: string){
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, projects: true }
    });

    if (!user) {
        return {body: { 'message': 'user not found' }, status: 404 };
    }

    const body = await request.json();
    console.log('Request Body:', body);
    const { projectId } = body;

    // Check if projectId is provided
    if (!projectId) {
        return {body: { message: 'Project ID is required' }, status: 400 };
    }

    // Check if the project belongs to the user
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        return {body: { message: 'Project not found' }, status: 404 };
    }

    if (project.userid !== user.id) {
        return {body: { message: 'Unauthorized to delete this project' }, status: 403 };
    }

    // Delete the project
    await prisma.project.delete({
        where: { id: projectId },
    });

    return {body: { message: 'Project deleted successfully' }, status: 200 };
}