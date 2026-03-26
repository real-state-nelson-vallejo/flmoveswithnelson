"use client";

import { useEffect, useState } from 'react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyDTO } from "@/types/property";
import { getPropertiesAction } from '@/actions/property/actions';
import { Loader2 } from 'lucide-react';
import styles from './PropertiesSection.module.css';


interface PropertiesSectionProps {
    locale: string;
}

export function PropertiesSection({ locale }: PropertiesSectionProps) {
    const [properties, setProperties] = useState<PropertyDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await getPropertiesAction();
                if (res.success && res.properties) {
                    setProperties(res.properties);
                }
            } catch (error) {
                console.error("Failed to fetch properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) {
        return (
            <section className={styles.section}>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            </section>
        );
    }

    if (properties.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    Featured Listings
                </h2>
                <p className={styles.subtitle}>
                    Explore our handpicked selection of premium properties.
                </p>
            </div>

            <div className={styles.grid}>
                {properties.slice(0, visibleCount).map((p) => (
                    <PropertyCard key={p.ListingKey || p.slug} property={p} locale={locale} />
                ))}
            </div>

            {visibleCount < properties.length && (
                <div className="mt-12 text-center">
                    <button 
                        onClick={() => setVisibleCount(v => v + 6)}
                        className="px-8 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition-colors border border-slate-200 shadow-sm"
                    >
                        Load More Properties
                    </button>
                </div>
            )}
        </section>
    );
}
