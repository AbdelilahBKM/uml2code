import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;
export default async function verifyToken(authHeader: string) {
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    const decoded = await jwt.verify(token, JWT_SECRET!);
    return decoded;
}