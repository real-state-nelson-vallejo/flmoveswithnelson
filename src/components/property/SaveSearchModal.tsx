"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendVerificationCodeAction, verifyOtpAction } from "@/actions/crm/verificationActions";
import { saveSearchAction } from "@/actions/crm/saveSearchAction";
import { useSearchParams } from "next/navigation";

export function SaveSearchModal() {
    const defaultSearchParams = useSearchParams();
    
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 'processing' | 3>(1); // 1: Lead Details, 2: OTP, processing: Seeding, 3: Success
    const [activeParams, setActiveParams] = useState<URLSearchParams | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [preferences, setPreferences] = useState("");
    const [otp, setOtp] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const handleOpen = (e: any) => {
            if (e.detail?.searchParams) {
                setActiveParams(new URLSearchParams(e.detail.searchParams));
            } else {
                setActiveParams(new URLSearchParams(defaultSearchParams.toString()));
            }
            setIsOpen(true);
            setStep(1);
            setError(null);
            setOtp("");
        };

        window.addEventListener('open-save-search-modal', handleOpen);
        return () => window.removeEventListener('open-save-search-modal', handleOpen);
    }, [defaultSearchParams]);

    if (!mounted) return null;

    const handleSendCode = async () => {
        if (!name || !email) {
            setError("Name and Email are required.");
            return;
        }
        setLoading(true);
        setError(null);
        
        try {
            // Mocking captcha for now, assuming production handles it
            const res = await sendVerificationCodeAction({
                name, 
                email, 
                phone, 
                intent: preferences ? `Save Search Alert. Preferences: ${preferences}` : "Save Search Alert"
            }, "mock-captcha");

            if (res.success) {
                setStep(2);
            } else {
                setError(res.error || "Failed to send code.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSave = async () => {
        if (otp.length < 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            // 1. Verify OTP and Get Lead ID
            const verifyRes = await verifyOtpAction(email, otp);
            
            if (!verifyRes.success || !verifyRes.leadId) {
                setError(verifyRes.error || "Verification failed.");
                setLoading(false);
                return;
            }

            // 2. Parse active filters
            const searchCriteria: any = {};
            if (activeParams) {
                if (activeParams.get('q')) searchCriteria.query = activeParams.get('q');
                if (activeParams.get('zone')) searchCriteria.zone = activeParams.get('zone');
                if (activeParams.get('minPrice')) searchCriteria.minPrice = Number(activeParams.get('minPrice'));
                if (activeParams.get('maxPrice')) searchCriteria.maxPrice = Number(activeParams.get('maxPrice'));
                if (activeParams.get('minBeds')) searchCriteria.minBeds = Number(activeParams.get('minBeds'));
                if (activeParams.get('type')) searchCriteria.type = activeParams.get('type');
            }

            // 3. Save the Search
            const saveRes = await saveSearchAction({
                leadId: verifyRes.leadId,
                searchCriteria,
                frequency: 'real-time'
            });

            if (saveRes.success) {
                setStep('processing');
                
                // --- PHASE 13: ORGANIC LAZY SEEDING (Awaited for UX) ---
                try {
                    await fetch('/api/sync/lazy-seed', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchCriteria }),
                        keepalive: true
                    });
                } catch (err) {
                    console.error("Lazy seed failed silently:", err);
                }

                // Show successmark briefly
                setStep(3);
                
                // Automatically reload the grid so the newly seeded properties natively appear
                setTimeout(() => {
                    setIsOpen(false);
                    window.location.reload(); 
                }, 1500);
            } else {
                setError(saveRes.error || "Failed to save your search criteria.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
                    >
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8">
                        {step === 1 && (
                            <>
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Star className="text-blue-600 fill-blue-600" size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Save this Search</h2>
                                <p className="text-slate-500 mb-6 text-sm">
                                    We'll email you immediately when a new property matches your exact filters. No spam, ever.
                                </p>

                                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={name} onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input 
                                            type="email" 
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                                        <input 
                                            type="tel" 
                                            value={phone} onChange={e => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Preferences & Comments (Optional)</label>
                                        <textarea 
                                            value={preferences} onChange={e => setPreferences(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all min-h-[80px]"
                                            placeholder="E.g., Must have a pool, looking to move in 3 months..."
                                        />
                                    </div>

                                    <Button fullWidth size="lg" onClick={handleSendCode} disabled={loading} className="mt-2 text-base font-bold rounded-xl py-6">
                                        {loading ? <Loader2 className="animate-spin" /> : "Continue"}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
                                <p className="text-slate-500 mb-6 text-sm">
                                    We sent a 6-digit code to <span className="font-bold text-slate-700">{email}</span>. Enter it below to activate your alerts.
                                </p>

                                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        maxLength={6}
                                        value={otp} onChange={e => setOtp(e.target.value)}
                                        className="w-full px-4 py-4 text-center text-3xl tracking-[1em] font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all h-20"
                                        placeholder="------"
                                    />

                                    <Button fullWidth size="lg" onClick={handleVerifyAndSave} disabled={loading || otp.length < 6} className="mt-2 text-base font-bold rounded-xl py-6">
                                        {loading ? <Loader2 className="animate-spin" /> : "Verify & Save Search"}
                                    </Button>
                                    
                                    <button onClick={() => setStep(1)} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900 mt-4">
                                        Wrong email address? Go back
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 'processing' && (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative bg-white w-24 h-24 rounded-full border-4 border-blue-50 flex items-center justify-center shadow-lg">
                                        <Loader2 className="animate-spin text-blue-600" size={40} />
                                    </div>
                                    <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white animate-bounce shadow-sm" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Syncing MLS...</h2>
                                <p className="text-slate-500 text-sm max-w-[280px] mx-auto animate-pulse">
                                    Verifying authorization and downloading high-resolution properties securely...
                                </p>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle className="text-emerald-500" size={40} />
                                </motion.div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
                                <p className="text-slate-500 text-sm max-w-[250px] mx-auto">
                                    Your search has been saved. We'll alert you the second a matching property hits the market.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
