import { getPropertyAction } from "@/actions/property/actions";
import { getMarketOpportunitiesAction } from "@/actions/market/actions";
import { PropertyDTO } from "@/types/property";
import { ArrowLeft, Home, MapPin, Building, DollarSign, TrendingUp, TrendingDown, Clock, Activity, AlertCircle, BarChart3, LineChart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketMap } from "@/components/market/MarketMap";

// Helper for currency
const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default async function PropertyMarketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const res = await getPropertyAction(id);

    if (!res.success || !res.property) {
        return notFound();
    }

    const property = res.property;
    const enrichment = property.rentCastData;

    // Default coords if missing (Miami center)
    const coordinates: [number, number] = property.location.coordinates
        ? [property.location.coordinates.lat, property.location.coordinates.lng]
        : [25.7617, -80.1918];

    // Calculate Verdict
    const listPrice = property.price.amount;
    const estValue = enrichment?.valuation?.price || 0;
    const priceDiff = listPrice - estValue;
    const priceDiffPercent = estValue > 0 ? (priceDiff / estValue) * 100 : 0;

    let verdict = "Fair Price";
    let verdictColor = "text-muted-foreground";
    let verdictBg = "bg-muted";

    if (estValue > 0) {
        if (priceDiffPercent < -10) {
            verdict = "Undervalued (Buy)";
            verdictColor = "text-emerald-400";
            verdictBg = "bg-emerald-950/30 border-emerald-900/50";
        } else if (priceDiffPercent > 10) {
            verdict = "Overpriced";
            verdictColor = "text-rose-400";
            verdictBg = "bg-rose-950/30 border-rose-900/50";
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-emerald-900 selection:text-emerald-50">
            {/* Top Navigation Bar */}
            <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/properties"
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-sm font-semibold text-foreground tracking-wide uppercase">Market Intelligence</h1>
                            <p className="text-xs text-muted-foreground font-mono">{property.id.substring(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Data</p>
                            <div className="flex items-center gap-1.5 justify-end">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-mono font-medium text-emerald-500">CONNECTED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1800px] mx-auto p-6 space-y-8">

                {/* Property Header & Verdict */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-1">
                        <h2 className="text-3xl font-light text-foreground tracking-tight">{property.title}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin size={16} className="text-muted-foreground" />
                            <span className="font-light">{property.location.address}, {property.location.city}, {property.location.state} {property.location.zip}</span>
                            <span className="text-border mx-2">|</span>
                            <span className="font-mono text-muted-foreground">{property.specs.beds} BD • {property.specs.baths} BA • {property.specs.area.toLocaleString()} SQFT</span>
                        </div>
                    </div>
                    <div className={`p-6 rounded-xl border border-dashed flex flex-col justify-center items-center text-center ${verdictBg} ${verdictColor === 'text-muted-foreground' ? 'border-border' : verdictBg.split(' ')[1]}`}>
                        <span className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">AI Valuation Verdict</span>
                        <div className={`text-2xl font-bold ${verdictColor}`}>{verdict}</div>
                        {estValue > 0 && (
                            <p className="text-sm mt-1 opacity-80 font-mono">
                                {priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}% vs Market
                            </p>
                        )}
                    </div>
                </div>

                {!enrichment ? (
                    <div className="border border-amber-900/30 bg-amber-950/10 rounded-xl p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-white font-medium text-lg mb-2">Market Data Unavailable</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Run an analysis in the Edit form or ensure the address is correct to fetch real-time market data from RentCast.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: List Price */}
                            <div className="bg-card border border-border p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={48} />
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">List Price</p>
                                <div className="text-2xl font-mono text-foreground font-medium">
                                    {formatCurrency(property.price.amount)}
                                </div>
                                <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>Listed {new Date(property.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Card 2: Est Value */}
                            <div className="bg-card border border-border p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={48} className="text-emerald-500" />
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Est. Value</p>
                                <div className="text-2xl font-mono text-emerald-400 font-medium">
                                    {formatCurrency(enrichment.valuation.price)}
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Range</span>
                                    <span className="text-muted-foreground font-mono">
                                        {formatCurrency(enrichment.valuation.priceRangeLow)} - {formatCurrency(enrichment.valuation.priceRangeHigh)}
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Est Rent */}
                            <div className="bg-card border border-border p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BarChart3 size={48} className="text-blue-500" />
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Est. Rent</p>
                                <div className="text-2xl font-mono text-blue-400 font-medium">
                                    {formatCurrency(enrichment.valuation.rent)}<span className="text-sm text-muted-foreground">/mo</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Range</span>
                                    <span className="text-muted-foreground font-mono">
                                        {formatCurrency(enrichment.valuation.rentRangeLow)} - {formatCurrency(enrichment.valuation.rentRangeHigh)}
                                    </span>
                                </div>
                            </div>

                            {/* Card 4: Market Heat (Days on Market) */}
                            <div className="bg-card border border-border p-6 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <LineChart size={48} className="text-purple-500" />
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Avg Days On Market</p>
                                <div className="text-2xl font-mono text-foreground font-medium flex items-center gap-2">
                                    {enrichment.marketStats.averagedaysOnMarket}
                                    <span className="text-sm font-normal text-muted-foreground">days</span>
                                </div>
                                <div className="w-full bg-secondary h-1.5 mt-4 rounded-full overflow-hidden">
                                    {/* Heatmap line: <30 days = hot (red), 30-60 = warm (orange), >60 = cold (blue) */}
                                    <div
                                        className={`h-full rounded-full ${enrichment.marketStats.averagedaysOnMarket < 45 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(10, (enrichment.marketStats.averagedaysOnMarket / 90) * 100))}%` }}
                                    ></div>
                                </div>
                                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                    <span>Hot</span>
                                    <span>Cold</span>
                                </div>
                            </div>
                        </div>

                        {/* Map & Comps Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                            {/* Map Container */}
                            <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden relative group">
                                <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur border border-border py-1 px-3 rounded text-xs text-foreground font-mono shadow-lg">
                                    {property.location.zip} MARKET AREA
                                </div>
                                <MarketMap
                                    center={coordinates}
                                    rentalComps={enrichment.rentalComps}
                                    saleComps={enrichment.saleComps}
                                />
                            </div>

                            {/* Comps Tables */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                {/* Rentals Column */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            Rental Comps
                                        </h3>
                                        <span className="text-xs font-mono text-muted-foreground">{enrichment.rentalComps.length} found</span>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                                        {enrichment.rentalComps.map((comp: any) => (
                                            <div key={comp.id} className="p-3 rounded-lg bg-background border border-border hover:border-blue-500/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-blue-400 font-medium">{formatCurrency(comp.price)}</span>
                                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                                                        {comp.distance.toFixed(1)}mi
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{comp.address}</p>
                                                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>{new Date(comp.listedDate).toLocaleDateString()}</span>
                                                    <span className="uppercase tracking-wider">Active</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sales Column */}
                                <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            Sale Comps
                                        </h3>
                                        <span className="text-xs font-mono text-muted-foreground">{enrichment.saleComps.length} found</span>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                                        {enrichment.saleComps.map((comp: any) => (
                                            <div key={comp.id} className="p-3 rounded-lg bg-background border border-border hover:border-amber-500/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-amber-400 font-medium">{formatCurrency(comp.price)}</span>
                                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                                                        {comp.distance.toFixed(1)}mi
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{comp.address}</p>
                                                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                                    <span>{new Date(comp.listedDate).toLocaleDateString()}</span>
                                                    <span className="uppercase tracking-wider">Active</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Stats Bar */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Zip Code {property.location.zip} Averages</h3>
                            <div className="grid grid-cols-3 gap-8 text-center divide-x divide-border">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                                    <p className="text-xl font-mono text-foreground">{formatCurrency(enrichment.marketStats.averagePrice)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Average Rent</p>
                                    <p className="text-xl font-mono text-foreground">{formatCurrency(enrichment.marketStats.averageRent)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Turnover Speed</p>
                                    <p className="text-xl font-mono text-foreground">{enrichment.marketStats.averagedaysOnMarket} <span className="text-sm text-muted-foreground">days</span></p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
