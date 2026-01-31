"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ContactSection.module.css";

export function ContactSection() {
    const [step, setStep] = useState(1);
    const [intent, setIntent] = useState<string | null>(null);

    const handleIntentSelect = (selection: string) => {
        setIntent(selection);
        setTimeout(() => setStep(2), 200); // Slight delay for visual feedback
    };

    return (
        <section className={styles.section}>
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
                                        {['Buying', 'Selling', 'Renting', 'Investing'].map((option) => (
                                            <button
                                                key={option}
                                                className={`${styles.choiceBtn} ${intent === option ? styles.active : ''}`}
                                                onClick={() => handleIntentSelect(option)}
                                            >
                                                {option}
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
                                    <form className={styles.formGrid}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Name</label>
                                            <input type="text" className={styles.input} placeholder="John Doe" />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Phone</label>
                                            <input type="tel" className={styles.input} placeholder="(555) 000-0000" />
                                        </div>
                                        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>Email</label>
                                            <input type="email" className={styles.input} placeholder="john@example.com" />
                                        </div>

                                        <button type="submit" className={styles.submitBtn}>
                                            Get in Touch &rarr;
                                        </button>
                                    </form>
                                    <button onClick={() => setStep(1)} className={styles.backBtn}>
                                        Back to start
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
