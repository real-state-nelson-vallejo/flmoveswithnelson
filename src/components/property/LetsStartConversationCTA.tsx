"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, MessageCircle } from "lucide-react";
import { PropertyDTO } from "@/types/property";

interface LetsStartConversationCTAProps {
    property: PropertyDTO;
}

export function LetsStartConversationCTA({ property }: LetsStartConversationCTAProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (isDismissed) return;

        // Show the CTA after 5 seconds OR if the user scrolls down 30% of the page
        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > 30) {
                setIsVisible(true);
            }
        };

        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 5000);

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timer);
        };
    }, [isDismissed]);

    const handleOpenChat = () => {
        setIsVisible(false);
        setIsDismissed(true);
        // Dispatch custom event to open the AI Chat Widget
        const event = new CustomEvent("open-ai-chat", {
            detail: { message: `I am interested in ${property.UnparsedAddress} (${property.City}). Can you tell me more?` }
        });
        window.dispatchEvent(event);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        setIsDismissed(true);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed bottom-28 sm:bottom-32 right-4 sm:right-8 z-50 pointer-events-auto"
                >
                    <div
                        onClick={handleOpenChat}
                        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 max-w-[280px] sm:max-w-xs cursor-pointer hover:shadow-blue-500/10 hover:border-blue-100 transition-all group"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute -top-2 -right-2 bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full p-1 transition-colors border border-slate-200 z-10"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex gap-3">
                            <div className="bg-gradient-to-tr from-pink-400 to-rose-500 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-inner shrink-0 leading-none">
                                👩🏼‍💼
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">Hi, I'm Jesika</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                    Interested in <strong>{property.UnparsedAddress}</strong>? Let's start a conversation!
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 bg-blue-50 text-blue-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <MessageCircle size={14} />
                            Chat with me now
                        </div>

                        {/* Notification dot */}
                        <span className="absolute -top-1 -left-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
