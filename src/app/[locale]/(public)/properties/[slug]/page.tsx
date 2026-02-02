"use client";

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { PropertyDTO } from "@/types/property";
import { getPropertyBySlugAction, getAdjacentPropertiesAction } from '@/actions/property/actions';
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertySidebar } from "@/components/property/PropertySidebar";
import { PropertyMap } from "@/components/property/PropertyMap";
import { SimilarProperties } from "@/components/property/SimilarProperties";
import { PropertyPagination } from "@/components/property/PropertyPagination";
import { MapPin, Calendar, Bed, Bath, Scaling, CheckCircle, Loader2, ArrowLeft, Video, PlayCircle } from "lucide-react";
import { formatPrice } from '@/lib/formatters';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, Variants } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
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

                    // Fetch adjacent properties
                    const adjRes = await getAdjacentPropertiesAction(res.property.id);
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center py-20 min-h-screen"
            >
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </motion.div>
        );
    }

    if (!property) {
        notFound();
    }

    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="pb-20"
        >
            {/* HER HERO SECTION */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    {property.images[0] ? (
                        <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-12 md:pb-20 max-w-[1400px]">
                    {/* Back Button */}
                    <div className="absolute top-8 left-4 md:left-8">
                        <Link
                            href={`/${locale}/properties`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full font-medium transition-colors text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Properties
                        </Link>
                    </div>

                    <motion.div variants={itemVariants} className="max-w-4xl">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md ${property.status === 'available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                property.status === 'sold' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                }`}>
                                {property.status}
                            </span>
                            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 text-white border border-white/20 backdrop-blur-md">
                                {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                            {property.title}
                        </h1>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-slate-200 text-lg font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin size={20} className="text-white" />
                                {property.location.address}, {property.location.city}, {property.location.zip}
                            </div>
                            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <div className="text-3xl font-bold text-white">
                                {formatPrice(property.price.amount)}
                                {property.type === 'rent' && <span className="text-lg font-normal text-slate-300">/mo</span>}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-[1400px]">
                {/* Gallery */}
                <motion.div variants={itemVariants} className="-mt-20 relative z-20">
                    <PropertyGallery images={property.images} />
                </motion.div>

                {/* Main Content Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Quick Specs Bar */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-wrap justify-between gap-6 md:gap-12"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Bed className="text-blue-500" size={28} /> {property.specs.beds}</span>
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Bedrooms</span>
                            </div>
                            <div className="w-px h-16 bg-slate-100 hidden md:block" />
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Bath className="text-blue-500" size={28} /> {property.specs.baths}</span>
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Bathrooms</span>
                            </div>
                            <div className="w-px h-16 bg-slate-100 hidden md:block" />
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Scaling className="text-blue-500" size={28} /> {property.specs.area.toLocaleString()}</span>
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Sq Ft</span>
                            </div>
                            {(property.specs.lotSize || property.specs.yearBuilt) && <div className="w-px h-16 bg-slate-100 hidden md:block" />}
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-bold text-slate-900 flex items-center gap-2"><Calendar className="text-blue-500" size={28} /> {property.specs.yearBuilt || 'N/A'}</span>
                                <span className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Built</span>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.div variants={itemVariants}>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">About this home</h3>
                            <div className="prose prose-lg prose-slate text-slate-600 leading-relaxed max-w-none whitespace-pre-line">
                                {property.description}
                            </div>

                            {/* Media Buttons Inline */}
                            <div className="flex gap-4 mt-8">
                                {property.virtualTourUrl && (
                                    <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-colors">
                                        <Video size={20} /> Virtual Tour
                                    </a>
                                )}
                                {property.videoUrl && (
                                    <a href={property.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-colors">
                                        <PlayCircle size={20} /> Watch Video
                                    </a>
                                )}
                            </div>
                        </motion.div>

                        {/* Features */}
                        <motion.div variants={itemVariants}>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Property Features</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-8 rounded-3xl">
                                {property.features.map((f, index) => (
                                    <motion.div
                                        key={f}
                                        className="flex items-center gap-3 text-slate-700 font-medium"
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={14} className="text-emerald-600" />
                                        </div>
                                        <span>{f}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Map */}
                        <motion.div variants={itemVariants}>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Location</h3>
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <PropertyMap address={`${property.location.address}, ${property.location.city}, ${property.location.zip}`} />
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-slate-500">
                                <MapPin size={16} />
                                <span className="font-medium">{property.location.address}, {property.location.city}, {property.location.zip}</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-1">
                        <PropertySidebar property={property} />
                    </div>
                </div>

                {/* Helper Navigation */}
                <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
                    <PropertyPagination locale={locale} prev={adjacent.prev} next={adjacent.next} />
                </motion.div>

                {/* Similar Properties */}
                <motion.div variants={itemVariants}>
                    <SimilarProperties currentId={property.id} locale={locale} />
                </motion.div>
            </div>
        </motion.main>
    );
}
