"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./AboutSection.module.css";
import { Eye, Target } from "lucide-react";

export function AboutSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>

                    {/* LEFT COLUMN: Text & Stats */}
                    <div className={styles.contentColumn}>
                        <motion.span
                            className={styles.pill}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            About Me
                        </motion.span>

                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            MORE THAN AN AGENT, <br />
                            YOUR <span className={styles.highlight}>TRUSTED ADVISOR</span>
                        </motion.h2>

                        <motion.p
                            className={styles.description}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            My job is to be your trusted guide through the buying process.
                            I simplify every step to make it a clear and positive experience.
                            Seeing your joy when you get the keys is my greatest reward.
                        </motion.p>

                        <motion.div
                            className={styles.statsRow}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>50+</span>
                                <span className={styles.statLabel}>Families Guided</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>70+</span>
                                <span className={styles.statLabel}>Happy Clients</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>$10M+</span>
                                <span className={styles.statLabel}>In Sales</span>
                            </div>
                        </motion.div>

                        <motion.div
                            className={styles.ctaWrapper}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <button className={styles.ctaButton}>
                                Book a Free Consultation
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Image & Cards */}
                    <div className={styles.imageColumn}>

                        {/* Cutout Image (Placeholder) */}
                        <motion.div
                            className={styles.agentImageWrapper}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Image
                                src="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2Fnelson_vallejo_profile.webp?alt=media&token=855aa562-e57b-4775-99a8-c3b1a40ca395"
                                alt="Nelson Vallejo - Real Estate Agent"
                                className={styles.agentImage}
                                width={700}
                                height={700}
                                unoptimized
                            />
                        </motion.div>

                        {/* Mission & Vision Cards */}
                        <div className={styles.cardsWrapper}>

                            {/* Mission Card */}
                            <motion.div
                                className={styles.card}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className={styles.cardIcon}>
                                    <Target size={24} />
                                </div>
                                <h3 className={styles.cardTitle}>My Mission</h3>
                                <p className={styles.cardText}>
                                    To guide you with honesty and transparency at every step,
                                    ensuring you make informed and confident decisions.
                                </p>
                            </motion.div>

                            {/* Vision Card */}
                            <motion.div
                                className={styles.card}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className={styles.cardIcon}>
                                    <Eye size={24} />
                                </div>
                                <h3 className={styles.cardTitle}>My Vision</h3>
                                <p className={styles.cardText}>
                                    To be the #1 trusted advisor for new home purchases,
                                    building relationships through valuable content and real results.
                                </p>
                            </motion.div>

                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
