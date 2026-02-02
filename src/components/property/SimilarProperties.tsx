"use client";

import { useEffect, useState } from "react";
import { getPropertiesAction } from "@/actions/property/actions";
import { PropertyDTO } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { motion } from "framer-motion";

interface SimilarPropertiesProps {
    currentId: string;
    locale: string;
}

export function SimilarProperties({ currentId, locale }: SimilarPropertiesProps) {
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await getPropertiesAction();
                if (res.success && res.properties) {
                    setProperties(res.properties);
                }
            } catch (error) {
                console.error("Failed to fetch similar properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) return null;

    const similarProperties = properties
        .filter(p => p.id !== currentId)
        .slice(0, 3);

    if (similarProperties.length === 0) return null;

    return (
        <section className="mt-16 pt-16 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {similarProperties.map((p, index) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <PropertyCard property={p} locale={locale} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
