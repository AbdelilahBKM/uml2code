"use client"
import EditDiagram from "@/components/editDiagram";
import Dashboard from "@/components/MyDiagrams";
import useAuth from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const Admin = () => {
    const { isAuth } = useAuth();
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    if (!isAuth) {
        return null;
    }

    return isClient ? <EditDiagram /> : null;
};

export default Admin;