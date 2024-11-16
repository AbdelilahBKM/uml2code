"use client";
// src/hooks/useAuth.ts
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/redux";
import { useEffect, useState } from "react";
import { loadAuthState } from "@/store/authReducer";

const useAuth = () => {
    const dispatch = useDispatch();
    const isAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(loadAuthState());
    }, [dispatch]);

    useEffect(() => {
        if (isAuth !== undefined) {
            setLoading(false);
            if (!isAuth) {
                router.replace("/signin");
            }
        }
    }, [isAuth, router]);

    return { isAuth, loading };
};

export default useAuth;