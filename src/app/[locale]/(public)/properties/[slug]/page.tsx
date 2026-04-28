"use client";

import { useEffect, useState, use } from 'react';
import { PropertyDTO } from "@/types/property";
import { getPropertyBySlugAction, getAdjacentPropertiesAction } from '@/actions/property/actions';
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertySidebar } from "@/components/property/PropertySidebar";
import { PropertyMap } from "@/components/property/PropertyMap";
import { SimilarProperties } from "@/components/property/SimilarProperties";
import { PropertyPagination } from "@/components/property/PropertyPagination";
import {
    MapPin, Calendar, Bed, Bath, Scaling, CheckCircle, Loader2, ArrowLeft,
    Video, PlayCircle, Share, Heart, Archive,
    Wind, Snowflake, Flame, Droplets, TreePine, Car, Wifi, Shield,
    Coffee, Utensils, Tv, Shirt, Box, Dumbbell, Waves, Zap
} from "lucide-react";
import { formatPrice } from '@/lib/formatters';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, Variants } from "framer-motion";
import ReactMarkdown from 'react-markdown';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const getSmartIcon = (feature: string) => {
    const f = feature.toLowerCase();
    if (f.includes('pool') || f.includes('swim') || f.includes('spa')) return <Waves size={22} className="text-blue-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('cool') || f.includes('air') || f.includes('ac ') || f.includes('a/c') || f.includes('chill') || f.includes('refrigerat')) return <Snowflake size={22} className="text-sky-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('heat') || f.includes('fire') || f.includes('warm') || f.includes('oven')) return <Flame size={22} className="text-orange-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('park') || f.includes('tree') || f.includes('garden') || f.includes('yard') || f.includes('landscap') || f.includes('lawn') || f.includes('play')) return <TreePine size={22} className="text-emerald-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('garage') || f.includes('car')) return <Car size={22} className="text-slate-600 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('wash') || f.includes('dry') || f.includes('laundry')) return <Shirt size={22} className="text-indigo-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('dish') || f.includes('kitchen') || f.includes('cook') || f.includes('microwave') || f.includes('range') || f.includes('disposal')) return <Utensils size={22} className="text-amber-600 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('gym') || f.includes('fitness') || f.includes('exercis') || f.includes('sport')) return <Dumbbell size={22} className="text-rose-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('tv') || f.includes('cable') || f.includes('media') || f.includes('theater')) return <Tv size={22} className="text-purple-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('wifi') || f.includes('internet') || f.includes('network')) return <Wifi size={22} className="text-blue-600 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('secur') || f.includes('guard') || f.includes('gate') || f.includes('alarm') || f.includes('fence')) return <Shield size={22} className="text-slate-700 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('electric') || f.includes('power') || f.includes('generat')) return <Zap size={22} className="text-yellow-500 flex-shrink-0" strokeWidth={1.5} />;
    if (f.includes('water') || f.includes('plumb') || f.includes('sprinkler') || f.includes('irrigation')) return <Droplets size={22} className="text-cyan-500 flex-shrink-0" strokeWidth={1.5} />;
    
    // Elegant Default
    return <CheckCircle size={22} className="text-slate-400 flex-shrink-0" strokeWidth={1.5} />;
};

export default function PropertyDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = use(params);
    const [property, setProperty] = useState<PropertyDTO | null>(null);
    const [adjacent, setAdjacent] = useState<{ prev: PropertyDTO | null; next: PropertyDTO | null }>({ prev: null, next: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await getPropertyBySlugAction(slug);
                if (res.success && res.property) {
                    setProperty(res.property);
                    const adjRes = await getAdjacentPropertiesAction(res.property.ListingKey);
                    if (adjRes.success) {
                        setAdjacent({ prev: adjRes.prev || null, next: adjRes.next || null });
                    }
                } else {
                    setProperty(null);
                }
            } catch (error) {
                console.error("Failed to fetch property:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [slug]);

    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center py-32 min-h-screen">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </motion.div>
        );
    }

    if (!property) return notFound();

    return (
        <motion.main variants={containerVariants} initial="hidden" animate="visible" className="w-full bg-white min-h-screen pb-20">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8">
                
                {/* 1. Top Header */}
                <motion.div variants={itemVariants} className="mb-6">
                    <Link href={`/${locale}/properties`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition-colors text-sm mb-6 underline decoration-slate-200 underline-offset-4 hover:decoration-slate-400">
                        <ArrowLeft size={16} /> Back to properties
                    </Link>

                    {property.archived && (
                        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 md:p-5 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <Archive size={18} className="text-amber-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-amber-900 font-bold text-base mb-0.5">Esta propiedad ya no está disponible</h3>
                                <p className="text-amber-800 text-sm">
                                    Su estado en el MLS cambió a <span className="font-semibold">{property.StandardStatus}</span>.
                                    Mirá propiedades similares abajo o explorá el listado completo.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href={`/${locale}/properties`}
                                        className="inline-flex items-center gap-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                                    >
                                        Ver todas las propiedades
                                    </Link>
                                    <Link
                                        href={`/${locale}/properties?q=${encodeURIComponent(property.City ?? '')}`}
                                        className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-amber-200"
                                    >
                                        Otras en {property.City}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-6">
                        <div className="max-w-3xl">
                            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight capitalize leading-tight mb-2">
                                {property.UnparsedAddress?.toLowerCase()}
                            </h1>
                            <div className="flex items-center gap-2 text-slate-700 font-medium text-base sm:text-lg">
                                <span className="flex items-center gap-1.5 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-slate-900 transition-colors capitalize">
                                    <MapPin size={18} /> {property.City?.toLowerCase()}, {property.StateOrProvince?.toUpperCase() || 'FL'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => {
                                if (navigator.share) {
                                    navigator.share({ title: property.UnparsedAddress, url: window.location.href });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }} className="flex items-center gap-2 px-4 py-2 rounded-xl focus:ring-2 hover:bg-slate-50 font-semibold text-slate-800 transition-all text-sm underline decoration-slate-300 underline-offset-4 hover:decoration-slate-500 border border-transparent hover:border-slate-200">
                                <Share size={16} /> Share
                            </button>
                            <button onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-save-search-modal', {
                                    detail: { searchParams: `q=${encodeURIComponent(property.UnparsedAddress)}` }
                                }));
                            }} className="flex items-center gap-2 px-5 py-2 rounded-xl focus:ring-2 hover:bg-red-50 font-semibold text-slate-800 hover:text-red-600 transition-all text-sm border border-slate-200 shadow-sm">
                                <Heart size={16} className="text-red-500" /> Save
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Photo Gallery (Bento Grid) */}
                <motion.div variants={itemVariants} className="mb-12">
                    <PropertyGallery images={property.Media} />
                </motion.div>

                {/* 3. Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 relative">
                    
                    {/* Left Column (Property Details) */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* Highlights & Basic Info */}
                        <motion.div variants={itemVariants} className="pb-8 border-b border-slate-200">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 capitalize">
                                {property.PropertySubType?.toLowerCase() || 'Single Family Residence'} hosted carefully
                            </h2>
                            <p className="text-slate-600 font-medium flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[15px]">
                                <span>{property.BedroomsTotal || 0} beds</span>
                                <span className="opacity-50 text-xs">•</span> 
                                <span>{property.BathroomsTotalInteger || 0} baths</span>
                                <span className="opacity-50 text-xs">•</span> 
                                <span>{(property.LivingArea || 0).toLocaleString()} sqft</span>
                                <span className="opacity-50 text-xs">•</span> 
                                <span className="capitalize">{property.StandardStatus?.toLowerCase() || 'active'}</span>
                            </p>
                        </motion.div>

                        {/* Top Highlights */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-5 pb-8 border-b border-slate-200">
                            {(property.opportunityScore ?? 0) >= 80 && (
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Highly Rated Investment</h3>
                                        <p className="text-slate-500 text-sm mt-0.5">This property has an AI Opportunity Score of {property.opportunityScore}/100.</p>
                                    </div>
                                </div>
                            )}
                            {property.YearBuilt && (
                                <div className="flex items-start gap-4">
                                    <Calendar className="text-slate-800" size={28} strokeWidth={1.5} />
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Year Built: {property.YearBuilt}</h3>
                                        <p className="text-slate-500 text-sm mt-0.5">Check out the beautiful architectural details preserved from its construction.</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <CheckCircle className="text-slate-800" size={28} strokeWidth={1.5} />
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Immediate Access</h3>
                                    <p className="text-slate-500 text-sm mt-0.5">Contact our team to schedule a live or virtual tour today.</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* New RESO Highlights Bento Grid */}
                        <motion.div variants={itemVariants} className="pb-8 border-b border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Home Highlights</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {property.DaysOnMarket !== undefined && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Time on Market</div>
                                        <div className="text-slate-900 font-extrabold text-xl">{property.DaysOnMarket} Days</div>
                                    </div>
                                )}
                                {property.YearBuilt !== undefined && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Year Built</div>
                                        <div className="text-slate-900 font-extrabold text-xl">{property.YearBuilt}</div>
                                    </div>
                                )}
                                {property.GarageSpaces !== undefined && property.GarageSpaces > 0 && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Garage</div>
                                        <div className="text-slate-900 font-extrabold text-xl">{property.GarageSpaces} Spaces</div>
                                    </div>
                                )}
                                {property.HOAFee !== undefined && property.HOAFee > 0 && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">HOA Fee</div>
                                        <div className="text-slate-900 font-extrabold text-xl">${property.HOAFee.toLocaleString()}<span className="text-sm text-slate-500 font-semibold">/mo</span></div>
                                    </div>
                                )}
                                {property.TaxAnnualAmount !== undefined && property.TaxAnnualAmount > 0 && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Annual Taxes</div>
                                        <div className="text-slate-900 font-extrabold text-xl">${property.TaxAnnualAmount.toLocaleString()}</div>
                                    </div>
                                )}
                                {property.PoolPrivateYN && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-blue-50 hover:shadow-sm">
                                        <div className="text-blue-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Amenities</div>
                                        <div className="text-blue-900 font-extrabold text-xl">Private Pool</div>
                                    </div>
                                )}
                                {property.WaterfrontYN && (
                                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-blue-50 hover:shadow-sm">
                                        <div className="text-blue-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Location</div>
                                        <div className="text-blue-900 font-extrabold text-xl">Waterfront</div>
                                    </div>
                                )}
                                {property.Cooling && property.Cooling.length > 0 && (
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center transition-all hover:bg-slate-100 hover:shadow-sm">
                                        <div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1.5 line-clamp-1">Cooling</div>
                                        <div className="text-slate-900 font-extrabold text-xl truncate" title={property.Cooling.join(', ')}>{property.Cooling[0]}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.div variants={itemVariants} className="pb-8 border-b border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">About this home</h3>
                            <div className="prose prose-slate text-slate-600 leading-relaxed max-w-none text-[15px]">
                                <ReactMarkdown>
                                    {property.PublicRemarks?.replace(/([A-Z]+)/g, (match) => match.charAt(0) + match.slice(1).toLowerCase()) || "No description provided."}
                                </ReactMarkdown>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 mt-6">
                                {property.virtualTourUrl && (
                                    <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors text-sm">
                                        <Video size={18} /> Virtual Tour
                                    </a>
                                )}
                                {property.videoUrl && (
                                    <a href={property.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors text-sm">
                                        <PlayCircle size={18} /> Watch Video
                                    </a>
                                )}
                            </div>
                        </motion.div>

                        {/* Property Features */}
                        <motion.div variants={itemVariants} className="pb-8 border-b border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">What this place offers</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                                {[
                                    ...(property.ExteriorFeatures || []),
                                    ...(property.Appliances || []),
                                    ...(property.AssociationAmenities || []),
                                    ...(property.ArchitecturalStyle || [])
                                ].slice(0, 16).map((f, index) => (
                                    <div key={index} className="flex items-center gap-3 text-slate-700 text-[15px] font-medium">
                                        {getSmartIcon(f)}
                                        <span className="capitalize leading-tight">{f.toLowerCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Map Section */}
                        <motion.div variants={itemVariants} className="pb-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Where you'll be</h3>
                            <p className="text-slate-600 mb-6 capitalize">{property.City?.toLowerCase()}, {property.StateOrProvince?.toUpperCase() || 'FL'}, United States</p>
                            <div className="rounded-2xl overflow-hidden border border-slate-200 h-[400px]">
                                <PropertyMap address={`${property.UnparsedAddress}, ${property.City}, ${property.PostalCode}`} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column (Sticky Form) - Hidden on Mobile, Shown on Desktop */}
                    <div className="hidden lg:block lg:col-span-4 relative">
                        {/* We put the PropertySidebar rendering here. It has `sticky top-24` inside */}
                        <PropertySidebar property={property} />
                    </div>
                    
                    {/* Mobile Bottom Floating Bar (Replaces Sidebar on Mobile) */}
                    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-6 flex items-center justify-between z-40 shadow-2xl">
                        <div>
                            <span className="text-lg font-extrabold text-slate-900">${formatPrice(property.ListPrice)}</span>
                            <span className="text-sm text-slate-600 font-medium"> {property.PropertyType?.toLowerCase().includes('lease') ? '/ month' : ''}</span>
                        </div>
                        <button 
                            className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-ai-chat', {
                                    detail: { message: `Hi, I am interested in property ${property.ListingKey}.` }
                                }));
                            }}
                        >
                            Reserve or Tour
                        </button>
                    </div>

                </div>

                {/* Similar Properties */}
                <motion.div variants={itemVariants} className="mt-16 pt-16 border-t border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-8">Similar properties you may like</h3>
                    <SimilarProperties currentId={property.ListingKey} locale={locale} />
                </motion.div>

                {/* Pagination */}
                <motion.div variants={itemVariants} className="mt-8 mb-8 border-t border-slate-200 pt-8">
                    <PropertyPagination locale={locale} prev={adjacent.prev} next={adjacent.next} />
                </motion.div>
            </div>
        </motion.main>
    );
}
