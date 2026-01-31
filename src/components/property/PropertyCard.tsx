"use client";

import { motion } from "framer-motion";
import { Property } from "@/backend/property/domain/Property";
import styles from "./PropertyCard.module.css";
import { MapPin, Bed, Bath, Scaling } from "lucide-react";
import NextLink from 'next/link';
import { formatPrice } from "@/lib/formatters";

interface PropertyCardProps {
    property: Property;
    locale: string;
}

export function PropertyCard({ property, locale }: PropertyCardProps) {
    return (
        <NextLink href={`/${locale}/properties/${property.id}`} passHref legacyBehavior>
            <motion.div
                className={styles.card}
                layoutId={`card-${property.id}`}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <div className={styles.imageContainer}>
                    <span className={styles.badge}>
                        {property.type === 'sale' ? 'For Sell' : 'For Rent'}
                    </span>
                    <motion.img
                        layoutId={`image-${property.id}`}
                        src={property.images[0] || "/placeholder.jpg"}
                        alt={property.title}
                        className={styles.image}
                    />
                </div>

                <div className={styles.content}>
                    <motion.h3 className={styles.title} layoutId={`title-${property.id}`}>
                        {property.title}
                    </motion.h3>

                    <div className={styles.address}>
                        <MapPin size={14} />
                        <span>{property.location.address}, {property.location.city}</span>
                    </div>

                    <div className={styles.stats}>
                        <span className={styles.statItem}><Bed size={16} /> {property.specs.beds} Beds</span>
                        <span className={styles.statItem}><Bath size={16} /> {property.specs.baths} Baths</span>
                        <span className={styles.statItem}><Scaling size={16} /> {property.specs.area.toLocaleString()} {property.specs.areaUnit}</span>
                    </div>

                    <motion.div className={styles.price} layoutId={`price-${property.id}`}>
                        {property.price.currency === 'USD' ? '$' : property.price.currency} {formatPrice(property.price.amount)}
                        {property.type === 'sale' ? <span>Property For Sell</span> : ''}
                    </motion.div>
                </div>
            </motion.div>
        </NextLink>
    );
}
