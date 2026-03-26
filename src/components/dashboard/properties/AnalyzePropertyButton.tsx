"use client";

import { useState } from "react";
import { analyzePropertyContentAction, updatePropertyAction } from "@/actions/property/actions";
import { Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { PropertyDTO } from "@/types/property";

export function AnalyzePropertyButton({ property, variant = "primary" }: { property: PropertyDTO, variant?: "primary" | "secondary" | "outline" | "ghost" }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            // First run the analysis pipeline
            const res = await analyzePropertyContentAction(property);
            if (res.success && res.analysis) {
                // Then save the results
                await updatePropertyAction({
                    id: property.ListingKey,
                    // We only update the analysis fields
                    opportunityScore: res.analysis.opportunityScore,
                    listingQualityScore: res.analysis.listingQualityScore,
                    marketStatus: res.analysis.marketStatus,
                    investmentAnalysis: res.analysis.investmentAnalysis as any
                });
                // Refresh to show the beautiful bento grid
                router.refresh();
            } else {
                alert("Failed to analyze property.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during analysis.");
        } finally {
            setLoading(false);
        }
    };

    const baseClasses = "flex items-center gap-2 justify-center font-medium transition-all focus:outline-none focus:ring-2 disabled:opacity-50";
    const variantClasses = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25",
        secondary: "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 px-4 py-2 rounded-lg text-sm border border-indigo-200 dark:border-indigo-800/50",
        outline: "border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-2 rounded-xl",
        ghost: "hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs"
    };

    return (
        <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`${baseClasses} ${variantClasses[variant]}`}
        >
            {loading ? <Loader2 className="animate-spin" size={variant === 'primary' ? 18 : 14} /> : <Zap size={variant === 'primary' ? 18 : 14} />}
            {loading ? (variant === 'primary' ? "Running Engine..." : "Analyzing...") : (variant === 'primary' ? "Run AI Analysis Now" : "Re-Analyze")}
        </button>
    );
}
