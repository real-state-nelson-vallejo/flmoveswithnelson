"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./TestimonialsSection.module.css";
import { Star } from "lucide-react";

const REVIEWS = [
    {
        id: 1,
        name: "Max Castillo",
        text: "Highly Recommend best professional Realtor I've came across.",
        rating: 5
    },
    {
        id: 2,
        name: "Nelda Hernandez",
        text: "Nelson is one outstanding Realtor! I have had the pleasure of meeting with him and I can truly say he values his customer and is more of a guide in the process.",
        rating: 5
    },
    {
        id: 3,
        name: "Roberto Martinez",
        text: "Nelson is a fantastic real estate agent, thorough, professional and a fierce negotiator. If you're looking to buy or sell your home, make sure to reach out.",
        rating: 5
    },
    {
        id: 4,
        name: "Joshua De Jesus",
        text: "Very communicative, know him from school. Very trustworthy person. He will get your home for sure. Contact him.",
        rating: 5
    },
    {
        id: 5,
        name: "Milad Elias",
        text: "Highly recommended!! He is so professional and knows what he is doing. Thank you Nelson.",
        rating: 5
    },
    {
        id: 6,
        name: "Mark Thompson",
        text: "He was very patient with us during the process as it was stressful doing both at once. Nelson never hesitated to answer any of our questions.",
        rating: 5
    }
];

const GALLERY_IMAGES = [
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_1881.jpg?alt=media&token=9cbc0fac-dd78-4903-8c7f-135729d14818", span: "span2" },
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_3559.jpg?alt=media&token=f18f1b09-a250-4a77-8c5f-cbf979f54ec0", span: "" },
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_4474.jpg?alt=media&token=452eb18f-c27d-4649-84c1-4dae3090aa29", span: "" },
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_5648.jpg?alt=media&token=1ddeb458-90e3-436c-b8e1-425a8623a478", span: "" },
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_6074.jpg?alt=media&token=4e4a4d5a-e8ac-4832-ba61-0dc71629ff59", span: "span2" },
    { src: "https://firebasestorage.googleapis.com/v0/b/local-digital-eye.firebasestorage.app/o/business%2Fnelson-vallejo%2FIMG_7811.jpg?alt=media&token=244c63ae-9f52-4c31-ac79-0e21282e4340", span: "span2" }
];

// Duplicate reviews for Infinite Marquee
const MARQUEE_REVIEWS = [...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS];

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 100;

    // Check if text needs truncation
    const needsTruncation = review.text.length > MAX_LENGTH;

    const displayedText = isExpanded || !needsTruncation
        ? review.text
        : review.text.slice(0, MAX_LENGTH) + "...";

    return (
        <div className={styles.card}>
            <div className={styles.cardTop}>
                <div className={styles.stars}>
                    {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="#0f172a" strokeWidth={0} />
                    ))}
                </div>
                <div className={styles.reviewContent}>
                    <p className={styles.reviewText}>&quot;{displayedText}&quot;</p>
                    {needsTruncation && (
                        <button
                            className={styles.readMoreBtn}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? "Show Less" : "Read More"}
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.author}>
                <div className={styles.authorInitial}>
                    {review.name.charAt(0)}
                </div>
                <div className={styles.authorInfo}>
                    <span className={styles.authorName}>{review.name}</span>
                    <span className={styles.authorRole}>Client</span>
                </div>
            </div>
        </div>
    );
}

export function TestimonialsSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* PART 1: REVIEWS CAROUSEL */}
                <div className={styles.reviewsLayout}>
                    <div className={styles.headerCentered}>
                        <motion.span
                            className={styles.pill}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            What My Clients Say
                        </motion.span>
                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            REAL EXPERIENCES, <br />
                            <span className={styles.highlight}>REAL RESULTS</span>
                        </motion.h2>
                    </div>

                    {/* Auto-Play Marquee Carousel with CSS Pause */}
                    <div className={styles.carouselWrapper}>
                        <div className={styles.marqueeContainer}>
                            <div className={styles.marqueeTrack}>
                                {MARQUEE_REVIEWS.map((review, index) => (
                                    <ReviewCard key={`${review.id}-${index}`} review={review} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PART 2: STRICT BENTO GALLERY */}
                <div className={styles.gallerySection}>
                    <div className={styles.galleryHeader}>
                        <h2 className={styles.galleryTitle}>Welcome Home</h2>
                        <p className={styles.description}>Celebrating the moment you get your keys.</p>
                    </div>

                    <div className={styles.galleryCollage}>
                        {GALLERY_IMAGES.map((img, index) => (
                            <motion.div
                                key={index}
                                className={styles.galleryItem}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <Image
                                    src={img.src}
                                    alt="Happy clients"
                                    fill
                                    className={styles.galleryImg}
                                    unoptimized
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
