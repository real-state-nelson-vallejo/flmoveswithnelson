"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import styles from "./FAQSection.module.css";

const FAQS = [
    {
        question: "Is it a good time to buy, or should I wait for prices to drop?",
        answer: "Market timing is difficult. The best time to buy is when you are financially ready. History shows that waiting for prices to drop can often lead to missing out on equity building or facing higher interest rates later."
    },
    {
        question: "Interest rates are high. Shouldn't I wait for them to go down?",
        answer: "While rates fluctuate, you can always refinance when rates drop. Buying now allows you to secure the home you want without the intense competition that lower rates might bring."
    },
    {
        question: "What if the market crashes after I buy?",
        answer: "Real estate is a long-term investment. Even if the market corrects, historically, property values appreciate over time. Buying a home you plan to stay in for 5-7 years mitigates short-term market volatility."
    },
    {
        question: "I'm a first-time buyer, where do I even start?",
        answer: "Start by getting pre-approved. This tells you your budget. Then, we can discuss your needs and start touring homes. I guide you through every step from offer to closing."
    },
    {
        question: "Do I have to pay for your services if you help me buy a home?",
        answer: "In most cases, no. The seller typically pays the commission for both agents. You get professional representation and negotiation expertise at no direct cost to you."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleIndex = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {/* LEFT COLUMN: Sticky Header */}
                <div className={styles.headerColumn}>
                    <span className={styles.pill}>Have Questions?</span>
                    <h2 className={styles.title}>
                        FREQUENTLY <br /> ASKED <br /> QUESTIONS
                    </h2>
                </div>

                {/* RIGHT COLUMN: Accordion */}
                <div className={styles.accordionList}>
                    {FAQS.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className={styles.accordionItem}>
                                <button
                                    className={styles.questionButton}
                                    onClick={() => toggleIndex(index)}
                                    aria-expanded={isOpen}
                                >
                                    <span className={styles.questionText}>{faq.question}</span>
                                    <span className={`${styles.iconWrapper} ${isOpen ? styles.open : ''}`}>
                                        <Plus size={24} />
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className={styles.answerWrapper}
                                        >
                                            <div className={styles.answerContent}>
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
