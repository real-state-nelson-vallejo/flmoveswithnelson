import { getPropertyAction } from "@/actions/property/actions";
import { ArrowLeft, MapPin, DollarSign, Target, ShieldCheck, Activity, TrendingUp, Zap, LineChart, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyzePropertyButton } from "@/components/dashboard/properties/AnalyzePropertyButton";

// Helper for currency
const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default async function PropertyMarketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await getPropertyAction(id);

    if (!res.success || !res.property) {
        return notFound();
    }

    const property = res.property;
    const analysis = property.investmentAnalysis;
    const oppScore = property.opportunityScore;
    const qScore = property.listingQualityScore;

    // Strict semantic coloring for Light & Dark mode contrast
    const isEmerald = (oppScore || 0) >= 80;
    const isAmber = (oppScore || 0) >= 60 && (oppScore || 0) < 80;
    
    const bgCard = isEmerald ? "bg-emerald-50 dark:bg-emerald-950/20" 
                 : isAmber ? "bg-amber-50 dark:bg-amber-950/20" 
                 : "bg-slate-100 dark:bg-slate-900/40";
                 
    const textVibrant = isEmerald ? "text-emerald-700 dark:text-emerald-400" 
                      : isAmber ? "text-amber-700 dark:text-amber-400" 
                      : "text-slate-700 dark:text-slate-300";
                      
    const borderVibrant = isEmerald ? "border-emerald-200 dark:border-emerald-900/50" 
                        : isAmber ? "border-amber-200 dark:border-amber-900/50" 
                        : "border-slate-200 dark:border-slate-800";

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-900 selection:text-indigo-50">
            {/* Top Navigation Bar */}
            <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/properties"
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-sm font-semibold text-foreground tracking-wide uppercase">AI Market Intelligence</h1>
                            <p className="text-xs text-muted-foreground font-mono">{property.ListingKey.substring(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Evaluation Engine</p>
                            <div className="flex items-center gap-1.5 justify-end">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">GEMINI NATIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-6 space-y-8">

                {/* Property Header */}
                <div className="space-y-1 mb-8">
                    <h2 className="text-3xl font-light text-foreground tracking-tight">{property.UnparsedAddress}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={16} />
                        <span className="font-light">{property.City}, {property.StateOrProvince} {property.PostalCode}</span>
                        <span className="text-border mx-2">|</span>
                        <span className="font-mono text-muted-foreground">{property.BedroomsTotal} BD • {property.BathroomsTotalInteger} BA • {property.LivingArea} SQFT</span>
                    </div>
                </div>

                {!analysis ? (
                    <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-16 text-center shadow-sm">
                        <Zap className="w-16 h-16 text-indigo-500 dark:text-indigo-400 mx-auto mb-6 opacity-80" />
                        <h3 className="text-foreground font-medium text-2xl mb-3">AI Analysis Pending</h3>
                        <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
                            This property has not yet been processed by the Native Gemini Engine. You can run the analysis right here to generate High ROI scores.
                        </p>
                        
                        <div className="flex flex-col items-center gap-4">
                            <AnalyzePropertyButton property={property} variant="primary" />
                            <Link href="/dashboard/properties" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors underline underline-offset-4 font-medium">
                                Return to Portfolio
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Premium Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Hero Score Box */}
                            <div className={`md:col-span-1 p-8 rounded-3xl border ${borderVibrant} ${bgCard} flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group`}>
                                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                                    <Target className="w-64 h-64 text-foreground" />
                                </div>
                                <span className={`text-sm font-bold tracking-widest uppercase mb-4 opacity-80 ${textVibrant}`}>AI Opportunity Score</span>
                                <div className={`text-8xl font-black tracking-tighter mb-4 ${textVibrant}`}>
                                    {oppScore}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full border ${borderVibrant} text-xs font-medium ${textVibrant} bg-background/50 backdrop-blur-sm`}>
                                    out of 100
                                </div>
                            </div>

                            {/* Analysis Metrics */}
                            <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <TrendingUp size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Est. ROI</span>
                                    </div>
                                    <span className="text-3xl font-mono text-foreground">{analysis.roi}%</span>
                                </div>
                                
                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <Activity size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Cap Rate</span>
                                    </div>
                                    <span className="text-3xl font-mono text-foreground">{analysis.capRate}%</span>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <DollarSign size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Cash Flow</span>
                                    </div>
                                    <span className="text-3xl font-mono text-emerald-600 dark:text-emerald-400">${analysis.cashFlow}<span className="text-sm text-muted-foreground">/mo</span></span>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                        <ShieldCheck size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Listing Score</span>
                                    </div>
                                    <span className="text-3xl font-mono text-foreground">{qScore}/100</span>
                                </div>
                                
                                {/* Intrinsic RESO Fields Context */}
                                <div className="col-span-2 lg:col-span-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
                                     <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                        <LineChart size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Intrinsic RESO Expenses</span>
                                    </div>
                                    <div className="flex flex-wrap gap-8 mt-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">List Price</p>
                                            <p className="font-mono text-foreground font-medium text-lg">{formatCurrency(property.ListPrice)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Annual Taxes</p>
                                            <p className="font-mono text-foreground font-medium text-lg">{property.TaxAnnualAmount ? formatCurrency(property.TaxAnnualAmount) : 'Pending'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Annual HOA</p>
                                            <p className="font-mono text-foreground font-medium text-lg">{property.HOAFee ? formatCurrency(property.HOAFee * 12) : 'None'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Days on Mkt</p>
                                            <p className="font-mono text-foreground font-medium text-lg">{property.DaysOnMarket || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</p>
                                            <p className="font-mono text-rose-600 dark:text-rose-400 font-bold uppercase text-sm mt-1">{property.marketStatus?.replace('_', ' ') || 'NORMAL'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* AI Executive Summary */}
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-3xl p-8 relative overflow-hidden mt-6 shadow-sm">
                             <div className="absolute -right-4 -bottom-4 opacity-5">
                                <Info size={120} className="text-indigo-900 dark:text-indigo-100" />
                            </div>
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                    <Zap size={24} className="text-indigo-600 dark:text-indigo-400" />
                                    Executive AI Summary
                                </h3>
                                {/* RE-ANALYZE BUTTON HEADER */}
                                <AnalyzePropertyButton property={property} variant="secondary" />
                            </div>
                            <p className="text-indigo-950 dark:text-indigo-100/90 text-lg leading-relaxed font-normal max-w-4xl tracking-wide">
                                &quot;{analysis.description}&quot;
                            </p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
