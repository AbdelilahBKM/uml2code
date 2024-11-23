import { NextResponse } from "next/server";
import { fetchDiagram, updateDiagram } from "@/Controllers/DiagramControllers";
import verifyToken from "@/Controllers/VerifyToken";

// GET /api/project/diagram?projectId={id}
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        const decoded = await verifyToken(authHeader!);

        const response = await fetchDiagram(request, decoded.id);
        return new NextResponse(JSON.stringify(response.body), { status: response.status });
    } catch (error: any) {
        console.error("Error:", error.message);
        return new NextResponse(
            JSON.stringify({ message: error.message || "Internal server error" }),
            { status: error.status || 500 }
        );
    }
}

// PUT /api/project/diagram?projectId={id}
export async function PUT(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        const decoded = await verifyToken(authHeader!);

        const response = await updateDiagram(request, decoded.id);
        return new NextResponse(JSON.stringify(response.body), { status: response.status });
    } catch (error: any) {
        console.error("Error:", error.message);
        return new NextResponse(
            JSON.stringify({ message: error.message || "Internal server error" }),
            { status: error.status || 500 }
        );
    }
}
