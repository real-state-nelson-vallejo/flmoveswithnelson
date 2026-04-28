import { PropertyDTO } from "@/types/property";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bed, Bath, Square, MapPin, Edit, Trash2, TrendingUp, AlertCircle, TrendingDown, ArrowUpRight, FileText, Tag } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { HOME_SECTION_LABELS, type HomeSection } from "@/lib/schemas/propertySchema";

interface PropertyCardProps {
    property: PropertyDTO;
    onEdit: (property: PropertyDTO) => void;
    onDelete: (id: string) => void;
    onTagEdit?: (property: PropertyDTO) => void;
}

export function PropertyCard({ property, onEdit, onDelete, onTagEdit }: PropertyCardProps) {
    const homeSections = (property.homeSections ?? []) as HomeSection[];
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'reserved': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'sold': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {property.Media && property.Media.length > 0 ? (
                    <Image
                        src={property.Media[0] || '/placeholder.jpg'}
                        alt={property.UnparsedAddress}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary">
                        <span className="text-sm">No Image</span>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${getStatusColor(property.StandardStatus || '')}`}>
                        {property.StandardStatus ? property.StandardStatus.charAt(0).toUpperCase() + property.StandardStatus.slice(1) : 'Unknown'}
                    </span>

                    {/* Market Status Indicators (Scalper features) */}
                    {property.marketStatus === 'price_drop' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm flex items-center gap-1">
                            <TrendingDown size={12} /> Price Drop
                        </span>
                    )}
                    {property.marketStatus === 'distressed' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-sm flex items-center gap-1">
                            <AlertCircle size={12} /> Distressed
                        </span>
                    )}
                </div>

                {/* Opportunity Score Badge - Top Right */}
                {property.opportunityScore !== undefined && (
                    <div className="absolute top-3 right-3">
                        <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 font-bold text-xs
                            ${property.opportunityScore >= 80 ? 'bg-emerald-500 border-emerald-400 text-white' :
                                property.opportunityScore >= 60 ? 'bg-amber-500 border-amber-400 text-white' :
                                    'bg-slate-800 border-slate-700 text-white'}
                        `}>
                            {property.opportunityScore}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground line-clamp-1 text-lg group-hover:text-primary transition-colors">
                        {property.UnparsedAddress}
                    </h3>
                </div>

                <p className="text-2xl font-bold text-foreground mb-4 tracking-tight">
                    {formatPrice(property.ListPrice)}
                </p>

                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <MapPin size={16} className="shrink-0" />
                    <span className="truncate">{property.City}, {property.StateOrProvince}</span>
                </div>

                {homeSections.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {homeSections.map((s) => (
                            <span
                                key={s}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-900"
                                title={HOME_SECTION_LABELS[s]?.description}
                            >
                                <Tag size={9} /> {HOME_SECTION_LABELS[s]?.label ?? s}
                            </span>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-border mb-4">
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Bed size={16} />
                            <span>{property.BedroomsTotal}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Beds</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Bath size={16} />
                            <span>{property.BathroomsTotalInteger}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Baths</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Square size={16} />
                            <span>{property.LivingArea}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{"sqft"}</span>
                    </div>
                </div>

                {/* Actions - Elevated z-index to stay above the hover overlay */}
                <div className="flex gap-2 relative z-10 mt-auto pt-4 border-t border-border">
                    <Link
                        href={`/en/properties/${property.slug || property.ListingKey}`}
                        target="_blank"
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                        <ArrowUpRight size={14} /> Preview
                    </Link>
                    <Link
                        href={`/dashboard/properties/${property.ListingKey}/market`}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                        <TrendingUp size={14} /> Insights
                    </Link>
                    <button
                        onClick={() => onEdit(property)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                        <Edit size={14} /> Edit
                    </button>
                    {onTagEdit && (
                        <button
                            onClick={() => onTagEdit(property)}
                            className={`p-2 rounded-lg transition-colors ${homeSections.length > 0 ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                            title={homeSections.length > 0 ? `Etiquetada en ${homeSections.length} ${homeSections.length === 1 ? "sección" : "secciones"}` : "Etiquetar para home sections"}
                        >
                            <Tag size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(property.ListingKey)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors hidden sm:block"
                    >
                        <Trash2 size={16} />
                    </button>
                    {/* Smart Inbox Quick Action */}
                    {(property.opportunityScore && property.opportunityScore >= 80) || property.marketStatus === 'distressed' ? (
                        <Link
                            href={`/en/dashboard/documents?template=offer&property=${property.ListingKey}`}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20"
                            title="Generate Offer Document"
                        >
                            <FileText size={16} />
                        </Link>
                    ) : null}
                </div>
            </div>


        </div>
    );
}
