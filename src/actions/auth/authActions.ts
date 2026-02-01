'use server';

import { userDependencies } from "@/backend/user/dependencies";
import { User, UserRole } from "@/backend/user/domain/User";
import { adminAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const SignUpSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    phoneNumber: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .regex(/^\+?[1-9]\d{9,14}$/, "Phone must be in E.164 format (e.g., +1234567890)")
});

export async function signUpAction(formData: z.infer<typeof SignUpSchema>) {
    try {
        const validated = SignUpSchema.parse(formData);

        // 1. Create Auth User
        const authUser = await adminAuth.createUser({
            email: validated.email,
            password: validated.password,
            displayName: validated.displayName,
            phoneNumber: validated.phoneNumber, // Now required and validated
            emailVerified: false,
            disabled: false
        });

        // 2. Create Domain User (Default role: 'user')
        const user = User.create({
            id: authUser.uid,
            email: validated.email,
            displayName: validated.displayName,
            role: 'user', // Default role
            phoneNumber: validated.phoneNumber, // Required field
            photoURL: authUser.photoURL,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 3. Save to Firestore
        await userDependencies.userRepository.save(user);

        // 4. Set Initial Claims
        await adminAuth.setCustomUserClaims(authUser.uid, { role: 'user' });

        return { success: true, uid: authUser.uid };
    } catch (error) {
        console.error("SignUp Error:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData = error as any;

        let msg = "Failed to create account";

        if (errorData.code === 'auth/email-already-exists') {
            msg = "Email already in use";
        } else if (errorData.code === 'auth/invalid-phone-number') {
            msg = "Invalid phone number format. Please use E.164 format (e.g., +1234567890)";
        } else if (errorData.message) {
            msg = errorData.message;
        }

        return { success: false, error: msg };
    }
}

// Admin only action - secured by checking caller's claims (if we had session context) or via secret key for now?
// Ideally we check `currentUser` from a cookie validation here. 
// For this MVP, we will rely on Firebase Admin being server-side, but this function is public!
// SECURITY CRITICAL: This must be protected. 
// Since we don't have session management in Server Actions w/ Admin SDK easily without passing tokens,
// We will leave this for separate admin-tool scripts OR require an 'adminSecret' arg.
export async function setUserRoleAction(targetUid: string, role: UserRole, adminSecret: string) {
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await userDependencies.userRepository.updateRole(targetUid, role);
        return { success: true };
    } catch (error) {
        console.error("SetRole Error:", error);
        return { success: false, error: "Failed to set role" };
    }
}
