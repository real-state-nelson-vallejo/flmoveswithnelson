"use client";

import { motion } from "framer-motion";
import styles from "./Hero.module.css";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
    return (
        <section className={styles.hero}>
            <motion.div
                className={styles.floatingCard}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                {/* Video Background */}
                <video
                    className={styles.videoBackground}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/hero-poster.jpg"
                >
                    <source
                        src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fvideos%2Fhero.mp4?alt=media&token=c01a7a12-0814-4261-a454-462ad88214df"
                        type="video/mp4"
                    />
                </video>

                {/* Dark Gradient Overlay */}
                <div className={styles.overlay} />

                {/* Top Right Logo (Desktop only) */}
                <div className={styles.topRightLogo}>
                    <Image
                        src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fvesti.png?alt=media&token=8a715137-32d4-4935-b2b0-8c1bf9597708"
                        alt="Vesti Partner"
                        width={140}
                        height={45}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>

                {/* Content Overlay */}
                <div className={styles.contentContainer}>
                    <motion.div
                        className={styles.mainContent}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <h1 className={styles.title}>
                            INVEST <span className={styles.textHighlight}>IN YOUR</span> <br />
                            FUTURE. START <br />
                            <span className={styles.textHighlight}>TODAY.</span>
                        </h1>

                        <p className={styles.subtitle}>
                            Your guide to new construction homes. Honest advice for a stress-free purchase in today&apos;s market.
                        </p>

                        <Link href="/properties" className={styles.actionButton}>
                            Explore Properties <ArrowUpRight size={20} />
                        </Link>
                    </motion.div>

                    {/* Stats Row & Partners - Bottom aligned */}
                    <div className={styles.bottomRow}>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>50+</span>
                                <span className={styles.statLabel}>Families Guided</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>50+</span>
                                <span className={styles.statLabel}>Happy Clients</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>$10M+</span>
                                <span className={styles.statLabel}>In Sales</span>
                            </div>
                        </div>

                        {/* Partners Wrapper (Mobile only) */}
                        <div className={styles.partnersRow}>
                            <div className={styles.partnerLogo}>
                                <Image
                                    src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fvesti.png?alt=media&token=8a715137-32d4-4935-b2b0-8c1bf9597708"
                                    alt="Vesti Partner"
                                    width={100}
                                    height={35}
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
