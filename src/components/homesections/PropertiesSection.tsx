"use client";

import { useEffect, useState } from 'react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyDTO } from "@/types/property";
import { getPropertiesAction } from '@/actions/property/actions';
import { Loader2 } from 'lucide-react';

interface PropertiesSectionProps {
    locale: string;
}

export function PropertiesSection({ locale }: PropertiesSectionProps) {
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
                console.error("Failed to fetch properties:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    if (loading) {
        return (
            <section className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-sm)' }}>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            </section>
        );
    }

    if (properties.length === 0) return null;

    return (
        <section className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-sm)' }}>
            <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase', color: '#0f172a' }}>
                    Featured Listings
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Explore our handpicked selection of premium properties.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '3rem'
            }}>
                {properties.map(p => (
                    <PropertyCard key={p.id} property={p} locale={locale} />
                ))}
            </div>
        </section>
    );
}
