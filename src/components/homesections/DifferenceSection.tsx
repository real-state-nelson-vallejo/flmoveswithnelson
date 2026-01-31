"use client";

import { motion } from "framer-motion";
import styles from "./DifferenceSection.module.css";
import { BadgeDollarSign, MessageCircle, TrendingUp, Presentation, HeartHandshake, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

// We need a perfect 3-column masonry/bento fit.
// Row 1: Item 1 (1 col) + Item 2 (2 cols) = 3 cols
// Row 2: Item 3 (2 cols) + Item 4 (1 col) = 3 cols
// Row 3: Item 5 (1 col) + Item 6 (2 cols) = 3 cols
// Total items: 6.
// Spans: 1, 2, 2, 1, 1, 2.

const DIFFERENCE_ITEMS = [
    {
        icon: BadgeDollarSign,
        title: "Genuine Commitment",
        text: "Your success is my greatest reward. I'm personally invested in the joy you feel when you get your keys.",
        className: "" // 1 col
    },
    {
        icon: MessageCircle,
        title: "Honest Communication",
        text: "You'll be informed at every step. My motto is \"what you see is what you get\". Transparent updates, clear timelines, and open channels 24/7.",
        className: styles.cardLarge // 2 cols
    },
    {
        icon: Presentation,
        title: "Innovative Marketing",
        text: "I use creative digital strategies to find your dream home or make your property stand out. From cinematic video tours to targeted social campaigns, I ensure maximum visibility.",
        className: styles.cardLarge // 2 cols
    },
    {
        icon: TrendingUp,
        title: "Market Expertise",
        text: "I provide clear analysis and current strategies to address your concerns about today's market.",
        className: "" // 1 col
    },
    {
        icon: HeartHandshake,
        title: "Guidance, Not Pressure",
        text: "My role is to advise, not to sell. I provide the facts so you can make the best decision for your family.",
        className: "" // 1 col
    },
    {
        icon: Settings,
        title: "A Simpler Process",
        text: "Buying a home can be stressful. My job is to handle the complexities so you can enjoy the journey. I manage the paperwork, inspections, and negotiations flawlessly.",
        className: styles.cardLarge // 2 cols
    }
];

export function DifferenceSection() {
    return (
        <section className={styles.section}>
            {/* Universal Container Class for Alignment */}
            <div className="container">
                <div className={styles.header}>
                    <span className={styles.pill}>MY COMMITMENT TO YOU</span>
                    <h2 className={styles.title}>
                        THE DIFFERENCE WHEN WE WORK <span className={styles.highlight}>TOGETHER</span>
                    </h2>
                </div>

                <div className={styles.bentoGrid}>
                    {DIFFERENCE_ITEMS.map((item, index) => (
                        <motion.div
                            key={index}
                            className={cn(styles.card, item.className)}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <div className={styles.iconWrapper}>
                                <item.icon size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className={styles.cardTitle}>{item.title}</h3>
                                <p className={styles.cardText}>{item.text}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
