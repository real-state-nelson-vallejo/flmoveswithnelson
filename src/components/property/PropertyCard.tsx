"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { PropertyDTO } from "@/types/property";
import { Heart, MapPin, BedDouble, Bath } from "lucide-react";
import { formatPrice } from "@/lib/formatters";

interface PropertyCardProps {
    property: PropertyDTO;
    locale: string;
    onHover?: (isHovered: boolean) => void;
}

export function PropertyCard({ property, locale, onHover }: PropertyCardProps) {
    return (
        <div
            onMouseEnter={() => onHover && onHover(true)}
            onMouseLeave={() => onHover && onHover(false)}
            className="group block h-full cursor-pointer"
        >
            <Link href={`/${locale}/properties/${property.slug || property.ListingKey}`} className="block h-full">
                <motion.div
                    className="flex flex-col h-full bg-white transition-all duration-300"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    {/* Image Container */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3">
                        {property.Media && property.Media[0] ? (
                            <Image
                                src={property.Media[0]}
                                alt={property.UnparsedAddress}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <span className="text-sm font-medium">No Image Available</span>
                            </div>
                        )}
                        
                        {/* Overlay Gradient for contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Top Right Heart Icon */}
                        <button 
                            className="absolute top-3 right-3 p-2 bg-white/70 backdrop-blur-md rounded-full text-slate-600 hover:text-rose-500 hover:bg-white transition-all shadow-sm z-10"
                            onClick={(e) => { e.preventDefault(); /* TODO: Save logic */ }}
                        >
                            <Heart size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
                        </button>

                        {/* Top Left Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pl-1 pr-12">
                            {property.ListAgentMlsId === '272509597' && (
                                <span className="bg-blue-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider border border-blue-500/50">
                                    Exclusive Listing
                                </span>
                            )}
                            <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                {property.PropertyType?.toLowerCase().includes('lease') || property.PropertyType === 'rent' ? 'For Rent' : 'For Sale'}
                            </span>
                            {property.StandardStatus === 'Active' && (
                                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="pt-3 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-0.5">
                            <h3 className="text-[15px] font-semibold text-slate-900 truncate pr-2 capitalize">
                                {property.City?.toLowerCase()}, {property.StateOrProvince?.toUpperCase() || 'FL'}
                            </h3>
                            {/* Airbnb puts ratings here; we can add a subtle MLS tag or AI dot instead if Opportunity is high */}
                            {(property.opportunityScore && property.opportunityScore >= 80) && (
                                <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-[13px] bg-blue-50 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span>Hot</span>
                                </div>
                            )}
                        </div>

                        <p className="text-[14px] text-slate-500 font-normal truncate mb-0.5 capitalize">
                            {property.UnparsedAddress?.toLowerCase()}
                        </p>
                        
                        <p className="text-[14px] text-slate-500 font-normal truncate mb-1 capitalize">
                            {property.PropertySubType?.toLowerCase() || 'Single Family Residence'}
                            <span className="mx-1.5 opacity-50">•</span>
                            {property.BedroomsTotal || 0} Beds
                            <span className="mx-1.5 opacity-50">•</span>
                            {property.BathroomsTotalInteger || 0} Baths
                        </p>

                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-[15px] font-semibold text-slate-900">
                                ${formatPrice(property.ListPrice)}
                            </span>
                            {property.PropertyType?.toLowerCase().includes('lease') && (
                                <span className="text-[14px] text-slate-500">month</span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </Link>
        </div>
    );
}
