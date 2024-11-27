"use client"
import EditDiagram from "@/components/editDiagram";
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const Admin = () => {
    const params = useParams();
    const diagramId = params.diagramId?.toString();
    const { isAuth } = useAuth();
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    if (!isAuth) {
        return null;
    }

    return isClient && diagramId ? <EditDiagram diagramId={diagramId} /> : null;
};

export default Admin;