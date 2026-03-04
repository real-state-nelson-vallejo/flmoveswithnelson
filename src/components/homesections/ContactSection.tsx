"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ContactSection.module.css";
import { Home, Banknote, Key, TrendingUp, CheckCircle2 } from "lucide-react";
import { submitContactFormAction } from "@/actions/crm/verificationActions";

export function ContactSection() {
    const [step, setStep] = useState(1);
    const [intent, setIntent] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

    const handleIntentSelect = (selection: string) => {
        setIntent(selection);
        setTimeout(() => setStep(2), 200); // Slight delay for visual feedback
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");

        try {
            const res = await submitContactFormAction({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                intent: intent || undefined
            });

            if (res.success) {
                setStep(3);
            } else {
                setErrorMsg(res.error || "Failed to submit. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.card}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className={styles.title}>
                        Let&apos;s Start a <span className={styles.highlight}>Conversation</span>
                    </h2>

                    <div className={styles.stepContainer}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={styles.stepContent}
                                >
                                    <p className={styles.question}>I am interested in...</p>
                                    <div className={styles.choiceGrid}>
                                        {[
                                            { id: 'Buy', icon: <Home size={20} /> },
                                            { id: 'Sell', icon: <Banknote size={20} /> },
                                            { id: 'Rent', icon: <Key size={20} /> },
                                            { id: 'Invest', icon: <TrendingUp size={20} /> }
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                className={`${styles.choiceBtn} ${intent === option.id ? styles.active : ''} flex flex-col items-center gap-2`}
                                                onClick={() => handleIntentSelect(option.id)}
                                            >
                                                {option.icon}
                                                <span>{option.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={styles.stepContent}
                                >
                                    <p className={styles.question}>Great! Tell me a bit about yourself.</p>
                                    <form className={styles.formGrid} onSubmit={handleFormSubmit}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Name</label>
                                            <input required type="text" className={styles.input} placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Phone</label>
                                            <input type="tel" className={styles.input} placeholder="(555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>Email</label>
                                            <input required type="email" className={styles.input} placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>

                                        {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

                                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                            {isSubmitting ? "Sending..." : "Get in Touch \u2192"}
                                        </button>
                                    </form>
                                    <button onClick={() => setStep(1)} type="button" className={styles.backBtn} disabled={isSubmitting}>
                                        Back to start
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-4"
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className="bg-green-100 p-4 rounded-full text-green-600">
                                            <CheckCircle2 size={48} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">Request Received!</h3>
                                    <p className="text-slate-600 max-w-sm mx-auto">
                                        Thank you, {formData.name}. We&apos;ve successfully received your information.
                                        We will be in touch with you shortly via email.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setFormData({ name: '', email: '', phone: '' });
                                            setIntent(null);
                                            setStep(1);
                                        }}
                                        className="mt-6 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Start a new request
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
