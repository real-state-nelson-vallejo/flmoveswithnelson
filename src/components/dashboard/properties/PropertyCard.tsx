import { PropertyDTO } from "@/types/property";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bed, Bath, Square, MapPin, Edit, Trash2, TrendingUp, AlertCircle, Hash, TrendingDown, ArrowUpRight, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface PropertyCardProps {
    property: PropertyDTO;
    onEdit: (property: PropertyDTO) => void;
    onDelete: (id: string) => void;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
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
                {property.images && property.images.length > 0 ? (
                    <Image
                        src={property.images[0] || '/placeholder.jpg'}
                        alt={property.title}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${getStatusColor(property.status)}`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
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
                        {property.title}
                    </h3>
                </div>

                <p className="text-2xl font-bold text-foreground mb-4 tracking-tight">
                    {formatPrice(property.price.amount)}
                </p>

                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                    <MapPin size={16} className="shrink-0" />
                    <span className="truncate">{property.location.city}, {property.location.state}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 border-t border-border mb-4">
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Bed size={16} />
                            <span>{property.specs.beds}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Beds</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Bath size={16} />
                            <span>{property.specs.baths}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Baths</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                            <Hash size={16} />
                            <span>{property.specs.area}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{property.specs.areaUnit}</span>
                    </div>
                </div>

                {/* Actions - Elevated z-index to stay above the hover overlay */}
                <div className="flex gap-2 relative z-10 mt-auto pt-4 border-t border-border">
                    <Link
                        href={`/dashboard/properties/${property.id}/market`}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                        <TrendingUp size={14} /> Insights
                    </Link>
                    <button
                        onClick={() => onEdit(property)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                        <Edit size={14} /> Review
                    </button>
                    <button
                        onClick={() => onDelete(property.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Hover overlay for quick analysis */}
            {property.investmentAnalysis && (
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] pointer-events-none z-0">
                    <div className="bg-card p-4 rounded-xl shadow-lg border border-border transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 min-w-[200px]">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2 text-center">AI Analysis</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground">Proj. ROI</span>
                                <span className="font-bold text-emerald-600">{property.investmentAnalysis.roi}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground">Cap Rate</span>
                                <span className="font-bold text-blue-600">{property.investmentAnalysis.capRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
