"use client";

import { motion, useScroll, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./FloatingHeader.module.css";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function FloatingHeader() {
    const { scrollY } = useScroll();
    const [isVisible, setIsVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Show after scrolling 100px (Restored)
    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setIsVisible(latest > 50); // Lower threshold for better UX
        });
    }, [scrollY]);

    // Update visibility logic: Visible on scroll OR if mobile menu is closed (wait, user said "when mobile menu is open, header disappears").
    // So if isMobileMenuOpen is true, the pill should NOT be visible.

    return (
        <>
            <AnimatePresence>
                {/* Only show header if user scrolled AND mobile menu is CLOSED */}
                {(isVisible && !isMobileMenuOpen) && (
                    <motion.div
                        className={styles.headerWrapper}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                    >
                        <nav className={styles.navPill}>
                            <div className={styles.logo}>
                                <Link href="/" className="text-white no-underline">NELSON VALLEJO</Link>
                            </div>

                            <div className={styles.navLinks}>
                                <Link href="/" className={styles.link}>Home</Link>
                                <Link href="/properties" className={styles.link}>Properties</Link>
                                <Link href="/services" className={styles.link}>Services</Link>
                                <Link href="/about" className={styles.link}>About</Link>
                            </div>

                            <div className={styles.actions}>
                                <Link href="/contact" className={styles.contactBtn}>
                                    Contact Me
                                </Link>
                                {/* Burger Icon for Mobile */}
                                <button
                                    className={styles.burgerBtn}
                                    onClick={() => setIsMobileMenuOpen(true)}
                                >
                                    <Menu size={24} color="#fff" />
                                </button>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={styles.mobileMenuOverlay}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <button
                            className={styles.closeBtn}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className={styles.mobileLinks}>
                            <Link href="/" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                            <Link href="/properties" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>Properties</Link>
                            <Link href="/services" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
                            <Link href="/about" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                            <Link href="/contact" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
