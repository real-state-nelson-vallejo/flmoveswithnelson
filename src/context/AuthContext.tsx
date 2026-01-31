"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, IdTokenResult } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type UserRole = "superadmin" | "agency_admin" | "agent" | "user" | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const tokenResult: IdTokenResult = await currentUser.getIdTokenResult();
                    // Claims: { role: 'superadmin' }
                    setRole((tokenResult.claims.role as UserRole) || "user");
                } catch (error) {
                    console.error("Error fetching claims:", error);
                    setRole("user");
                }
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        role,
        loading,
        isAdmin: role === "superadmin" || role === "agency_admin"
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
