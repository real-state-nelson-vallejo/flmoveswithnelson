"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface PropertyGalleryProps {
    images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
    // Ensure we have at least 1 image, ideally 5 for the collage
    const displayImages = images.length >= 5 ? images.slice(0, 5) : [...images, ...Array(5 - images.length).fill(images[0])];

    return (
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] mb-8 rounded-2xl overflow-hidden">
            {/* Main Image (Left, spans 2x2) */}
            <motion.div
                className="col-span-2 row-span-2 relative cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
            >
                <Image
                    src={displayImages[1]}
                    alt="Property Main"
                    fill
                    className="object-cover hover:opacity-95 transition-opacity"
                    priority
                    unoptimized
                />
            </motion.div>

            {/* Smaller Images */}
            {displayImages.slice(1).map((img, index) => (
                <motion.div
                    key={index}
                    className="relative cursor-pointer overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                >
                    <Image
                        src={img}
                        alt={`Property View ${index + 2}`}
                        fill
                        className="object-cover hover:opacity-95 transition-opacity"
                        unoptimized
                    />
                </motion.div>
            ))}
        </div>
    );
}
