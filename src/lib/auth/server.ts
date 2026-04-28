import { adminAuth } from "@/lib/firebase/admin";

export type AdminRole = "superadmin" | "agency_admin" | "agent";

export interface AdminIdentity {
    uid: string;
    email: string | null;
    role: AdminRole;
}

const ADMIN_ROLES: AdminRole[] = ["superadmin", "agency_admin", "agent"];

/**
 * Verifies an incoming Authorization: Bearer <ID token> and ensures the user
 * has an admin role via custom claims. Throws on failure (caller converts to 401/403).
 */
export async function requireAdmin(request: Request): Promise<AdminIdentity> {
    const header = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
        throw Object.assign(new Error("Missing Authorization header"), { status: 401 });
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
        throw Object.assign(new Error("Empty bearer token"), { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token).catch((err) => {
        throw Object.assign(new Error("Invalid ID token: " + (err?.message || "unknown")), { status: 401 });
    });

    const role = decoded.role as AdminRole | undefined;
    if (!role || !ADMIN_ROLES.includes(role)) {
        throw Object.assign(new Error("Insufficient role"), { status: 403 });
    }

    return {
        uid: decoded.uid,
        email: decoded.email ?? null,
        role,
    };
}
