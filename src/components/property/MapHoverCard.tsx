"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, Scaling, ArrowRight } from "lucide-react";
import { PropertyDTO } from "@/types/property";
import { formatCurrency } from "@/lib/formatters";

interface MapHoverCardProps {
    property: PropertyDTO;
    locale: string;
}

export function MapHoverCard({ property, locale }: MapHoverCardProps) {
    const href = `/${locale}/properties/${property.slug || property.ListingKey}`;
    const image = property.Media?.[0];
    const isRent = property.PropertyType?.toLowerCase().includes("lease") || property.PropertyType === "rent";

    return (
        <div className="w-[260px] bg-white rounded-xl overflow-hidden">
            <div className="relative w-full h-[120px] bg-slate-100">
                {image ? (
                    <Image
                        src={image}
                        alt={property.UnparsedAddress}
                        fill
                        sizes="260px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Sin imagen
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isRent ? "For Rent" : "For Sale"}
                </div>
            </div>

            <div className="p-3 space-y-2">
                <div>
                    <div className="font-bold text-slate-900 text-base tabular-nums">
                        {formatCurrency(property.ListPrice)}
                        {isRent && <span className="text-xs font-normal text-slate-500 ml-1">/mo</span>}
                    </div>
                    <div className="text-xs text-slate-600 truncate capitalize">
                        {property.UnparsedAddress?.toLowerCase() || "Sin dirección"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate capitalize">
                        {property.City?.toLowerCase()}{property.StateOrProvince ? `, ${property.StateOrProvince.toUpperCase()}` : ""}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                        <Bed size={12} /> {property.BedroomsTotal ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Bath size={12} /> {property.BathroomsTotalInteger ?? 0}
                    </span>
                    {property.LivingArea ? (
                        <span className="flex items-center gap-1">
                            <Scaling size={12} /> {Math.round(property.LivingArea).toLocaleString()} sqft
                        </span>
                    ) : null}
                </div>

                <Link
                    href={href}
                    className="mt-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                    Ver propiedad <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}
