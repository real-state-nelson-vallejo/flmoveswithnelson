"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { PropertyDTO } from "@/types/property";
import styles from "./PropertyCard.module.css";
import { MapPin, Bed, Bath, Scaling } from "lucide-react";
import { formatPrice } from "@/lib/formatters";

interface PropertyCardProps {
    property: PropertyDTO;
    locale: string;
}

export function PropertyCard({ property, locale }: PropertyCardProps) {
    return (
        <Link href={`/${locale}/properties/${property.slug || property.id}`} className="block h-full">
            <motion.div
                className={styles.card}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 24
                }}
            >
                <motion.div
                    className={styles.imageContainer}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                >
                    <span className={styles.badge}>
                        {property.type === 'sale' ? 'For Sell' : 'For Rent'}
                    </span>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {property.images[0] ? (
                            <Image
                                src={property.images[0]}
                                alt={property.title}
                                fill
                                className={`object-cover ${styles.image}`}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <span className="text-xs">No Image</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <div className={styles.content}>
                    <h3 className={styles.title}>
                        {property.title}
                    </h3>

                    <div className={styles.address}>
                        <MapPin size={14} />
                        <span>{property.location.address}, {property.location.city}</span>
                    </div>

                    <div className={styles.stats}>
                        <span className={styles.statItem}><Bed size={16} /> {property.specs.beds} Beds</span>
                        <span className={styles.statItem}><Bath size={16} /> {property.specs.baths} Baths</span>
                        <span className={styles.statItem}><Scaling size={16} /> {property.specs.area.toLocaleString()} {property.specs.areaUnit}</span>
                    </div>

                    <div className={styles.price}>
                        {property.price.currency === 'USD' ? '$' : property.price.currency} {formatPrice(property.price.amount)}
                        {property.type === 'sale' ? <span>Property For Sell</span> : ''}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
