"use client";

import Image from "next/image";
import { ExternalLink, MapPin, Bed, Bath, Scaling } from "lucide-react";

interface PropertyCardMiniProps {
    property: {
        id: string;
        title: string;
        price: number;
        currency: string;
        location: string;
        specs: string;
        propertyType: string;
        slug: string;
        image?: string;
    };
    locale: string;
}

export function PropertyCardMini({ property, locale }: PropertyCardMiniProps) {
    const handleOpenInNewTab = () => {
        window.open(`/${locale}/properties/${property.slug || property.id}`, '_blank');
    };

    // Parse specs (format: "3 bed, 2 bath, 1800 sqft")
    const specsParts = property.specs.split(',').map(s => s.trim());
    const beds = specsParts[0]?.replace(/\D/g, '') || '—';
    const baths = specsParts[1]?.replace(/\D/g, '') || '—';
    const area = specsParts[2] || '—';

    return (
        <div className="flex gap-3 p-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 group">
            {/* Image */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {property.image ? (
                    <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin size={24} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {property.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin size={12} />
                        <span className="truncate">{property.location}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <Bed size={14} /> {beds}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath size={14} /> {baths}
                        </span>
                        <span className="flex items-center gap-1">
                            <Scaling size={14} /> {area}
                        </span>
                    </div>
                </div>
            </div>

            {/* Price & Action */}
            <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                    <div className="text-base font-bold text-indigo-600">
                        ${property.price.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">{property.propertyType}</div>
                </div>

                <button
                    onClick={handleOpenInNewTab}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all"
                    title="Open in new tab"
                >
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );
}
