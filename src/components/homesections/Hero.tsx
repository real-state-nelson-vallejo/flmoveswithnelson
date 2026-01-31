"use client";

import { motion } from "framer-motion";
import styles from "./Hero.module.css";
import { ArrowUpRight } from "lucide-react";

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
                        src="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2Fhero.mp4?alt=media&token=96589729-5799-488a-8a9c-bd69ff5ea410"
                        type="video/mp4"
                    />
                </video>

                {/* Dark Gradient Overlay */}
                <div className={styles.overlay} />

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

                        <button className={styles.actionButton}>
                            Explore Properties <ArrowUpRight size={20} />
                        </button>
                    </motion.div>

                    {/* Stats Row - Now part of the flow */}
                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>100+</span>
                            <span className={styles.statLabel}>Families Guided</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>100+</span>
                            <span className={styles.statLabel}>Happy Clients</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>$10M+</span>
                            <span className={styles.statLabel}>In Sales</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
