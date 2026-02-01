"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpAction } from "@/actions/auth/authActions";
import { motion } from "framer-motion";

const schema = z.object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .regex(/^\+?[1-9]\d{9,14}$/, "Phone must be in E.164 format (e.g., +1234567890)"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export function SignUpForm() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        const res = await signUpAction({
            email: data.email,
            password: data.password,
            displayName: data.displayName,
            phoneNumber: data.phone
        });

        if (res.success) {
            setSuccess(true);
        } else {
            setServerError(res.error || "An unexpected error occurred");
        }
    };

    if (success) {
        return (
            <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-100">
                <h3 className="text-2xl font-bold text-green-800 mb-2">Account Created!</h3>
                <p className="text-green-700">Welcome to Nelson AI. You can now log in.</p>
                {/* Link to login would go here */}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Create Account</h2>

            {serverError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-3"
                >
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="font-semibold">Error creating account</p>
                        <p className="text-xs mt-1">{serverError}</p>
                    </div>
                </motion.div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                    {...register("displayName")}
                    className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${errors.displayName
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                    placeholder="John Doe"
                />
                {errors.displayName && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-red-600 flex items-center gap-1"
                    >
                        <span>⚠️</span> {errors.displayName.message}
                    </motion.p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                    type="email"
                    {...register("email")}
                    className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${errors.email
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                    placeholder="john@example.com"
                />
                {errors.email && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-red-600 flex items-center gap-1"
                    >
                        <span>⚠️</span> {errors.email.message}
                    </motion.p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                    type="tel"
                    {...register("phone")}
                    className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${errors.phone
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                    placeholder="+1234567890"
                />
                {errors.phone && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-red-600 flex items-center gap-1"
                    >
                        <span>⚠️</span> {errors.phone.message}
                    </motion.p>
                )}
                <p className="text-xs text-slate-500">Include country code (e.g., +1 for USA)</p>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                    type="password"
                    {...register("password")}
                    className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${errors.password
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                    placeholder="••••••••"
                />
                {errors.password && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-red-600 flex items-center gap-1"
                    >
                        <span>⚠️</span> {errors.password.message}
                    </motion.p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                    type="password"
                    {...register("confirmPassword")}
                    className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all ${errors.confirmPassword
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                    placeholder="••••••••"
                />
                {errors.confirmPassword && (
                    <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-red-600 flex items-center gap-1"
                    >
                        <span>⚠️</span> {errors.confirmPassword.message}
                    </motion.p>
                )}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black transition-all disabled:opacity-50"
            >
                {isSubmitting ? "Creating Account..." : "Sign Up"}
            </motion.button>
        </form>
    );
}
