"use client";

import { use } from "react";
import { motion, Variants } from "framer-motion";
import { servicesData } from "@/data/servicesData";
import { Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import styles from "@/components/homesections/Hero.module.css";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

export default function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);

    const handleOpenChatAction = (topic: string) => {
        const event = new CustomEvent("open-ai-chat", {
            detail: { message: `I am interested in: ${topic}. Could you tell me more about how you can help?` }
        });
        window.dispatchEvent(event);
    };

    return (
        <main className="min-h-screen pb-24">
            {/* Minimal Header Section */}
            <section className={`relative pt-32 pb-20 overflow-hidden bg-slate-900 ${styles.heroImage}`}>
                <div className="absolute inset-0 bg-slate-900/80 z-0"></div>

                <div className="container mx-auto px-4 z-10 relative text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block mb-6">
                            How I Can Help
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                            Elevating Your Real Estate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Experience</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Whether you're buying, selling, renting, or investing, I'm here to provide honest guidance and proven strategies to reach your goals.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Services List */}
            <section className="container mx-auto px-4 mt-8 md:-mt-8 relative z-20 max-w-[1200px]">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-8 md:gap-12"
                >
                    {servicesData.map((service, index) => {
                        const Icon = service.icon;
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className={`bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-slate-100 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center ${isEven ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Info Side */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Icon className="text-blue-600" size={28} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{service.tagline}</span>
                                            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{service.title}</h2>
                                        </div>
                                    </div>

                                    <p className="text-lg text-slate-600 leading-relaxed">
                                        {service.description}
                                    </p>

                                    <ul className="space-y-4 pt-2">
                                        {service.bullets.map((bullet, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-slate-700 font-medium">
                                                <div className="mt-1 flex-shrink-0">
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                </div>
                                                <span className="leading-snug">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="pt-6 flex flex-wrap gap-4">
                                        <button
                                            onClick={() => handleOpenChatAction(service.title)}
                                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-transform hover:scale-105 shadow-md flex gap-2 items-center"
                                        >
                                            <Bot size={18} /> Ask Jesika About This
                                        </button>
                                        <Link
                                            href={`/${locale}/#contact`}
                                            className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors flex gap-2 items-center"
                                        >
                                            Contact Nelson <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>

                                {/* Decor Side (can be an image conceptually, or a highly styled block) */}
                                <div className="lg:w-2/5 w-full bg-slate-50 rounded-2xl min-h-[300px] flex items-center justify-center border border-slate-100 p-8 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 z-0" />
                                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all duration-700" />

                                    <div className="relative z-10 text-center">
                                        <Icon size={120} strokeWidth={1} className="text-slate-200 mx-auto drop-shadow-sm mb-6 group-hover:scale-110 group-hover:text-blue-200 transition-all duration-500" />
                                        <p className="text-slate-500 font-medium italic relative z-10 px-6">
                                            "A personalized approach designed specifically for your {service.title.toLowerCase()} goals."
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>
        </main>
    );
}
