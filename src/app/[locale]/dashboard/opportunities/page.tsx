"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, DollarSign, MapPin, ExternalLink, RefreshCw, AlertCircle, Sparkles, Filter, X } from "lucide-react";
import { getMarketOpportunitiesAction, runMarketScanAction } from "@/actions/market/actions";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function OpportunitiesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [filteredOpportunities, setFilteredOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [filterType, setFilterType] = useState<'all' | 'flip' | 'cashflow'>('all');
    const [minEquity, setMinEquity] = useState(0); // For flips
    const [minCapRate, setMinCapRate] = useState(0); // For cashflow
    const [scanZip, setScanZip] = useState('33139'); // Default zip

    const fetchData = async () => {
        setLoading(true);
        const res = await getMarketOpportunitiesAction();
        if (res.success && res.opportunities) {
            setOpportunities(res.opportunities);
            setFilteredOpportunities(res.opportunities);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters whenever state changes
    useEffect(() => {
        let result = opportunities;

        if (filterType !== 'all') {
            result = result.filter(opp => opp.type === filterType);
        }

        if (filterType === 'flip' || filterType === 'all') {
            // If specifically looking for flips, or all, filter flips by equity
            // Note: Cashflow items won't have discountPercent, so we only filter if it is a flip
            result = result.filter(opp => {
                if (opp.type === 'flip') {
                    return (opp.discountPercent || 0) * 100 >= minEquity;
                }
                return true;
            });
        }

        if (filterType === 'cashflow' || filterType === 'all') {
            result = result.filter(opp => {
                if (opp.type === 'cashflow') {
                    return (opp.capRate || 0) >= minCapRate;
                }
                return true;
            });
        }

        setFilteredOpportunities(result);
    }, [opportunities, filterType, minEquity, minCapRate]);


    const handleScan = async () => {
        setScanning(true);
        // Default scan of Miami basics or user zip
        const zipsToScan = scanZip ? [scanZip] : ['33139', '33130', '33101'];
        const res = await runMarketScanAction(zipsToScan);
        if (res.success) {
            await fetchData();
        } else {
            alert("Scan failed");
        }
        setScanning(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Market Opportunities</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Sparkles size={14} className="text-emerald-500" />
                        <p className="text-sm">AI-detected deals based on live market anomalies.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors flex items-center gap-2 ${showFilters ? 'bg-secondary text-foreground border-border' : 'text-muted-foreground hover:text-foreground border-border'}`}
                    >
                        <Filter size={16} />
                        Filter
                    </button>

                    {/* Filter Popover */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-12 right-0 w-72 bg-card border border-border shadow-xl rounded-xl p-5 z-20"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-sm">Filters</h3>
                                    <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Opportunity Type</label>
                                        <div className="flex bg-secondary rounded-lg p-1">
                                            {['all', 'flip', 'cashflow'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setFilterType(t as any)}
                                                    className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-all ${filterType === t ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(filterType === 'all' || filterType === 'flip') && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-medium text-muted-foreground">Min Equity Spread</label>
                                                <span className="text-xs font-mono text-emerald-400">{minEquity}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                step="5"
                                                value={minEquity}
                                                onChange={(e) => setMinEquity(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            />
                                        </div>
                                    )}

                                    {(filterType === 'all' || filterType === 'cashflow') && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-medium text-muted-foreground">Min Cap Rate</label>
                                                <span className="text-xs font-mono text-blue-400">{minCapRate}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="15"
                                                step="0.5"
                                                value={minCapRate}
                                                onChange={(e) => setMinCapRate(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-border">
                                        <div className="text-xs text-center text-muted-foreground">
                                            Found <span className="font-mono text-foreground font-medium">{filteredOpportunities.length}</span> matches
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 shadow-lg shadow-primary/20"
                    >
                        {scanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {scanning ? "Scanning..." : "Scan Market"}
                    </button>
                    <input
                        type="text"
                        placeholder="Zip Code"
                        value={scanZip}
                        onChange={(e) => setScanZip(e.target.value)}
                        className="w-20 pl-2 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-32">
                    <Loader2 size={32} className="animate-spin text-muted-foreground" />
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-32 rounded-2xl border border-dashed border-border bg-card/50">
                    <TrendingUp className="mx-auto text-muted-foreground mb-4" size={48} />
                    <h3 className="text-lg font-medium text-foreground">No opportunities match criteria</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        Adjust your filters or run a fresh market scan to detect new deals.
                    </p>
                    <button
                        onClick={() => { setFilterType('all'); setMinEquity(0); setMinCapRate(0); }}
                        className="mt-4 text-sm text-emerald-500 hover:text-emerald-400 font-medium"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOpportunities.map((opp, i) => (
                        <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card border border-border rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors group relative"
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            {/* Image Background (if available) */}
                            {opp.listing.images && opp.listing.images.length > 0 && (
                                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-10 transition-opacity">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={opp.listing.images[0]}
                                        alt="Property"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-card/80 backdrop-blur-[1px]"></div>
                                </div>
                            )}

                            {/* Header Badge */}
                            <div className={`px-4 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider relative z-10
                                ${opp.type === 'flip'
                                    ? 'bg-indigo-500/10 text-indigo-400 border-b border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'}`}>
                                <span className="flex items-center gap-1.5">
                                    {opp.type === 'flip' ? <TrendingUp size={14} /> : <DollarSign size={14} />}
                                    {opp.type === 'flip' ? 'Flip Opportunity' : 'Cash Flow Deal'}
                                </span>
                                <span className="text-muted-foreground font-medium">{formatDistanceToNow(opp.detectedAt)} ago</span>
                            </div>

                            <div className="p-6 space-y-5 relative z-10">
                                {/* Property Info */}
                                <div>
                                    <h3 className="font-heading font-semibold text-lg text-foreground truncate">{opp.listing.address}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <MapPin size={12} className="text-muted-foreground" />
                                        {opp.listing.city}, {opp.listing.state} {opp.listing.zipCode}
                                    </p>
                                    <div className="flex gap-3 mt-3 text-xs font-mono text-muted-foreground">
                                        <span className="bg-secondary px-2 py-1 rounded">{opp.listing.bedrooms} Beds</span>
                                        <span className="bg-secondary px-2 py-1 rounded">{opp.listing.bathrooms} Baths</span>
                                        <span className="bg-secondary px-2 py-1 rounded">{opp.listing.propertyType}</span>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">
                                    <div className="bg-card p-3">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">List Price</p>
                                        <p className="font-mono font-medium text-foreground">{formatCurrency(opp.listing.price)}</p>
                                    </div>
                                    <div className="bg-card p-3">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">Est. Value</p>
                                        <p className="font-mono font-medium text-foreground">{formatCurrency(opp.estimatedValue)}</p>
                                    </div>

                                    {opp.type === 'flip' ? (
                                        <div className="col-span-2 bg-indigo-950/20 p-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Equity Spread</p>
                                                <p className="font-mono font-bold text-indigo-400">+{Math.round((opp.discountPercent || 0) * 100)}%</p>
                                            </div>
                                            <div className="w-full bg-secondary h-1 mt-2 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (opp.discountPercent || 0) * 100 * 3)}%` }}></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 text-right">
                                                Potential: <span className="text-indigo-300">{formatCurrency(opp.discountAmount || 0)}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="col-span-2 bg-emerald-950/20 p-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cap Rate</p>
                                                <p className="font-mono font-bold text-emerald-400">{opp.capRate}%</p>
                                            </div>
                                            <div className="w-full bg-secondary h-1 mt-2 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (opp.capRate || 0) * 10)}%` }}></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 text-right">
                                                Est. Cash Flow: <span className="text-emerald-300">${opp.cashFlow}/mo</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <a
                                        href={opp.listing.listingUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center w-full py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-foreground"
                                    >
                                        View Listing <ExternalLink size={12} className="ml-2 opacity-50" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
