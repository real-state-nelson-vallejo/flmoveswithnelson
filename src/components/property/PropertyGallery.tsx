"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyGalleryProps {
    images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
    // Ensure we have at least 1 image, ideally 5 for the collage
    const displayImages = images.length >= 5 ? images.slice(0, 5) : [...images, ...Array(5 - images.length).fill(images[0])];

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-auto md:h-[500px] mb-8 rounded-2xl overflow-hidden">
                {/* Main Image (Left, spans 2x2 on Desktop, Full on Mobile) */}
                <motion.div
                    className="col-span-1 md:col-span-2 md:row-span-2 relative cursor-pointer h-[300px] md:h-auto"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setSelectedIndex(0)}
                >
                    {displayImages[0] ? (
                        <Image
                            src={displayImages[0]}
                            alt="Property Main"
                            fill
                            className="object-cover hover:opacity-95 transition-opacity"
                            priority
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                            No Image
                        </div>
                    )}
                </motion.div>

                {/* Smaller Images (Hidden on extremely small screens if needed, or grid) */}
                <div className="col-span-1 md:col-span-2 md:row-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-[200px] md:h-auto">
                    {displayImages.slice(1).map((img, index) => (
                        <motion.div
                            key={index}
                            className="relative cursor-pointer overflow-hidden h-full rounded-xl md:rounded-none"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedIndex(index + 1)}
                        >
                            {img ? (
                                <Image
                                    src={img}
                                    alt={`Property View ${index + 2}`}
                                    fill
                                    className="object-cover hover:opacity-95 transition-opacity"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal Slider */}
            {selectedIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setSelectedIndex(null)}
                >

                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-4 right-4 text-white hover:text-slate-300 z-50 p-2"
                    >
                        <X size={32} />
                    </button>

                    {/* Left Arrow */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex((prev: number | null) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
                        }}
                        className="absolute left-4 text-white hover:text-slate-300 z-50 p-2 bg-black/20 rounded-full backdrop-blur-md"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    {/* Image */}
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <motion.div
                            key={selectedIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full h-full"
                        >
                            {images[selectedIndex] ? (
                                <Image
                                    src={images[selectedIndex]}
                                    alt={`Property View ${selectedIndex + 1}`}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            ) : (
                                <div className="text-white">Image not available</div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex((prev: number | null) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-4 text-white hover:text-slate-300 z-50 p-2 bg-black/20 rounded-full backdrop-blur-md"
                    >
                        <ChevronRight size={40} />
                    </button>

                    {/* Counter */}
                    <div className="absolute bottom-6 text-white text-sm font-medium tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                        {selectedIndex + 1} / {images.length}
                    </div>

                </div>
            )}
        </>
    );
}
