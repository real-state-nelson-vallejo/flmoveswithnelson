"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
// Removed unused Link import
import { useParams } from "next/navigation";
import { Eye, Target, Award, Users, TrendingUp, CalendarDays, MessageSquare, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

export default function AboutPage() {
    const params = useParams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const locale = (params?.locale as string) || 'en';

    // Video Player State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24 font-sans">
            {/* Header Section */}
            <section className="container mx-auto px-6 lg:px-8 mb-16 text-center max-w-4xl">
                <motion.span
                    className="inline-block py-1 px-4 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-6 tracking-widest uppercase"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    About Nelson Vallejo
                </motion.span>
                <motion.h1
                    className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    More Than An Agent, <br /> Your <span className="text-blue-600 bg-clip-text">Trusted Advisor</span>
                </motion.h1>
                <motion.p
                    className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    My job is to be your trusted guide through the buying, selling, or investing process. I simplify every step to make it a clear and positive experience, because seeing your joy when you get the keys is my greatest reward.
                </motion.p>
                <motion.div
                    className="flex flex-col sm:flex-row items-center justify-center gap-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-ai-chat', {
                                detail: { message: "Hi, I'd like to get in contact with you." }
                            }));
                        }}
                        className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:shadow-[0_8px_40px_rgb(37,99,235,0.4)] hover:-translate-y-1 w-full sm:w-auto"
                    >
                        <MessageSquare size={22} className="group-hover:animate-pulse" />
                        Talk to my AI Agent
                    </button>
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-ai-chat', {
                                detail: { message: "I would like to schedule a consultation with Nelson." }
                            }));
                        }}
                        className="group flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-blue-600 text-slate-800 hover:text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-lg w-full sm:w-auto"
                    >
                        <CalendarDays size={22} className="group-hover:scale-110 transition-transform" />
                        Schedule Consultation
                    </button>
                </motion.div>
            </section>

            {/* Video Section */}
            <section className="container mx-auto px-6 lg:px-8 mb-28 max-w-5xl">
                <motion.div
                    className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/50 group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="relative w-full h-full group/video">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted={isMuted}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleVideoEnd}
                            onClick={togglePlay}
                            poster="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2Fnelson_vallejo_profile.webp?alt=media&token=855aa562-e57b-4775-99a8-c3b1a40ca395"
                        >
                            <source src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Fabout-me.mp4?alt=media&token=1fc175d6-529c-4dff-88ef-7d1e234156a5" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Play/Pause Large Center Overlay */}
                        {!isPlaying && (
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm transition-all duration-300 cursor-pointer pointer-events-none group-hover/video:bg-slate-900/50"
                            >
                                <div className="bg-blue-600 text-white rounded-full p-6 sm:p-8 shadow-[0_0_40px_rgba(37,99,235,0.6)] transform transition-transform hover:scale-110">
                                    <Play size={48} className="ml-2" />
                                </div>
                            </div>
                        )}

                        {/* Custom Controls Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent pt-16 pb-4 px-6 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-600/50 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-100 ease-linear rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={togglePlay}
                                        className="hover:text-blue-400 transition-colors focus:outline-none"
                                        aria-label={isPlaying ? "Pause" : "Play"}
                                    >
                                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                    </button>
                                    <button
                                        onClick={toggleMute}
                                        className="hover:text-blue-400 transition-colors focus:outline-none"
                                        aria-label={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                    </button>
                                </div>
                                <button
                                    onClick={toggleFullscreen}
                                    className="hover:text-blue-400 transition-colors focus:outline-none"
                                    aria-label="Fullscreen"
                                >
                                    <Maximize size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Content Multi-Column Section */}
            <section className="container mx-auto px-6 lg:px-8 mb-24 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">
                    <motion.div
                        className="w-full lg:w-5/12 relative max-w-md lg:max-w-full mx-auto"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="absolute inset-0 bg-blue-600/10 rounded-3xl transform rotate-3 scale-105 -z-10 transition-transform duration-500 hover:rotate-6"></div>
                        <Image
                            src="https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2Fnelson_vallejo_profile.webp?alt=media&token=855aa562-e57b-4775-99a8-c3b1a40ca395"
                            alt="Nelson Vallejo"
                            width={600}
                            height={800}
                            className="rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white"
                            unoptimized
                        />
                    </motion.div>

                    <div className="w-full lg:w-7/12 flex flex-col gap-10">
                        {/* Stats Row */}
                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 text-center flex flex-col items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <Users className="w-8 h-8 mb-3 text-blue-600" />
                                <div className="text-4xl font-extrabold text-slate-900 mb-1">50+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Families Guided</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 text-center flex flex-col items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <Award className="w-8 h-8 mb-3 text-blue-600" />
                                <div className="text-4xl font-extrabold text-slate-900 mb-1">70+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Happy Clients</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 text-center col-span-2 md:col-span-1 flex flex-col items-center justify-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <TrendingUp className="w-8 h-8 mb-3 text-blue-600" />
                                <div className="text-4xl font-extrabold text-slate-900 mb-1">$10M+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Sales</div>
                            </div>
                        </motion.div>

                        {/* Mission & Vision */}
                        <div className="space-y-6">
                            <motion.div
                                className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-5 mb-5">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Target size={28} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900">My Mission</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-lg md:text-xl">
                                    To guide you with honesty and transparency at every step, ensuring you make informed and confident decisions. We believe that real estate transactions should be built on trust and clear communication.
                                </p>
                            </motion.div>

                            <motion.div
                                className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <div className="flex items-center gap-5 mb-5">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Eye size={28} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900">My Vision</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-lg md:text-xl">
                                    To be the #1 trusted advisor for new home purchases and investments, building lifelong relationships through valuable content, relentless dedication, and real results.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
