"use client"
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

    return isClient ? <Dashboard /> : null;
};

export default Admin;