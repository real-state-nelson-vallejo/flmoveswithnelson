import { RentCastEnrichment } from "@/backend/market/domain/RentCastEnrichment";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TrendingUp, DollarSign, Home, Activity } from "lucide-react";

interface RentCastInsightsProps {
    data: RentCastEnrichment;
}

export function RentCastInsights({ data }: RentCastInsightsProps) {
    if (!data) return null;

    const { valuation, marketStats } = data;

    const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" />
                    Market Pulse (Live Data)
                </h4>
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300">
                    Verified Source
                </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valuation Section */}
                <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Home size={14} /> Estimated Value
                    </h5>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                            {formatCurrency(valuation.price)}
                        </span>
                        <span className="text-xs text-slate-500">
                            (Range: {formatCurrency(valuation.priceRangeLow)} - {formatCurrency(valuation.priceRangeHigh)})
                        </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-1/2 rounded-full" />
                    </div>
                </div>

                {/* Rental Section */}
                <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <DollarSign size={14} /> Estimated Rent
                    </h5>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(valuation.rent)}
                        </span>
                        <span className="text-xs text-slate-500">
                            (Range: {formatCurrency(valuation.rentRangeLow)} - {formatCurrency(valuation.rentRangeHigh)})
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="block text-slate-400">Zip Avg Rent</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(marketStats.averageRent)}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="block text-slate-400">Days on Market</span>
                            <span className="font-semibold text-slate-700">{marketStats.averagedaysOnMarket} days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comps Preview (Mini List) */}
            {data.rentalComps && data.rentalComps.length > 0 && (
                <div className="border-t border-slate-100 p-3 bg-slate-50/50">
                    <p className="text-[10px] text-slate-500 mb-2 font-medium">ACTIVE COMPs USED FOR ANALYSIS:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {data.rentalComps.slice(0, 3).map((comp, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-slate-200 min-w-[140px] shadow-sm">
                                <p className="text-xs font-bold text-slate-800">{formatCurrency(comp.price)}</p>
                                <p className="text-[10px] text-slate-500 truncate">{comp.address}</p>
                                <p className="text-[10px] text-slate-400">{comp.distance.toFixed(1)} miles away</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
