"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from "framer-motion";
import Image from "next/image";
import styles from "./GuidanceSection.module.css";
import { cn } from "@/lib/cn";
import { Home, TrendingUp, Hammer } from "lucide-react";

const STEPS = [
    {
        id: 1,
        title: "First-Time Buyer Guidance",
        description: "Buying your first home is a big step. I'll guide you through the process, ensuring you feel confident and excited, not overwhelmed.",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        icon: Home
    },
    {
        id: 2,
        title: "Strategic Investing",
        description: "I help you identify high-growth investment opportunities in the real estate market, specializing in newly built properties.",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        icon: TrendingUp
    },
    {
        id: 3,
        title: "New Construction Specialist",
        description: "Buying directly from a builder is a unique process. I give you expert access to the best projects and navigate the details on your behalf.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        icon: Hammer
    }
];

export function GuidanceSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [mobileActiveStep, setMobileActiveStep] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (latest < 0.33) {
                setActiveStep(0);
            } else if (latest < 0.66) {
                setActiveStep(1);
            } else {
                setActiveStep(2);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const CurrentIcon = STEPS[activeStep].icon;

    const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        // Calculate the center of the viewport relative to the scroll container
        // We use offsetWidth * 0.85 because cards are min-width: 85vw
        // A simple index calculation: round(scrollLeft / cardWidth)
        const cardWidth = container.offsetWidth * 0.85;
        // Adding a small buffer or just dividing by approx card width
        // Actually, since it snaps, we can just check which one is closest.
        const index = Math.round(scrollLeft / cardWidth);

        if (index !== mobileActiveStep && index >= 0 && index < STEPS.length) {
            setMobileActiveStep(index);
        }
    };

    return (
        <section ref={containerRef} className={styles.scrollContainer}>
            <div className={styles.stickyWrapper}>
                <div className={styles.container}>

                    <div className={styles.header}>
                        <h2 className={styles.title}>Guidance Designed For You</h2>
                        <p className={styles.subtitle}>
                            Simplifying your path to ownership.<br />
                            Expert advice for first-time buyers and savvy investors.
                        </p>
                    </div>

                    {/* DESKTOP VIEW: Sticky Scrollytelling */}
                    <div className={styles.desktopView}>
                        <div className={styles.grid}>
                            {/* 1. Content Area (Left) */}
                            <div className={styles.contentArea}>
                                <AnimatePresence mode="popLayout">
                                    <motion.div
                                        key={activeStep}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                                            <CurrentIcon size={28} />
                                        </div>
                                        <h3 className={styles.contentTitle}>
                                            {STEPS[activeStep].title}
                                        </h3>
                                        <p className={styles.contentDesc}>
                                            {STEPS[activeStep].description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* 2. Image Area (Center) */}
                            <div className={styles.imageArea}>
                                <AnimatePresence mode="popLayout">
                                    <motion.img
                                        key={activeStep}
                                        src={STEPS[activeStep].image}
                                        alt={STEPS[activeStep].title}
                                        className={styles.image}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </AnimatePresence>
                            </div>

                            {/* 3. Navigation (Right) */}
                            <div className={styles.navArea}>
                                <div className={styles.navLine} />
                                <motion.div
                                    className={styles.navIndicator}
                                    animate={{ top: `${activeStep * 33 + 10}%` }}
                                />
                                {STEPS.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={cn(styles.navItem, index === activeStep && styles.active)}
                                        onClick={() => setActiveStep(index)}
                                    >
                                        <span className={styles.navNumber}>0{step.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* MOBILE VIEW: Horizontal Snap Carousel with Dots */}
                    <div
                        className={cn(styles.mobileView, styles.mobileCarousel)}
                        onScroll={handleMobileScroll}
                    >
                        {STEPS.map((step) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.id}
                                    className={styles.mobileCard}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className={styles.mobileImageContainer}>
                                        <Image
                                            src={step.image}
                                            alt={step.title}
                                            fill
                                            className={styles.mobileImage}
                                            unoptimized
                                        />
                                        <div className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-sm backdrop-blur-sm">
                                            <Icon size={20} className="text-blue-600" />
                                        </div>
                                    </div>

                                    <div className={styles.mobileContent}>
                                        <span className={styles.mobileNumber}>0{step.id}</span>
                                        <h3 className={styles.mobileTitle}>{step.title}</h3>
                                        <p className={styles.mobileDesc}>{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Mobile Dots Indicator */}
                    <div className={styles.mobileDots}>
                        {STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    styles.dot,
                                    index === mobileActiveStep && styles.activeDot
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
