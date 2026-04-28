"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Star, Building2, MapPin, Loader2, Sparkles, Zap, X, Search,
    SlidersHorizontal, ChevronDown, ChevronUp, Tag as TagIcon, LandPlot,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase/client";
import type { AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

type QuickTarget = "listings" | "brokerage" | "zone";
type ListingKind = "any" | "sale" | "rent";

interface PreviewState {
    target: QuickTarget;
    filters: AdvancedPropertyFilters;
    label: string;
    total: number;
    estimatedMsQuality: number;
    estimatedMsFast: number;
}

function formatDuration(ms: number): string {
    const sec = ms / 1000;
    if (sec < 60) return `${Math.round(sec)}s`;
    const min = sec / 60;
    if (min < 60) return `${Math.round(min)} min`;
    const hr = Math.floor(min / 60);
    return `${hr}h ${Math.round(min % 60)}m`;
}

export function QuickSyncBar() {
    const NELSON_AGENT_ID = process.env.NEXT_PUBLIC_NELSON_AGENT_ID ?? "";
    const FL_MOVES_OFFICE_ID = process.env.NEXT_PUBLIC_NELSON_OFFICE_ID ?? "";

    // Primary inputs
    const [zoneInput, setZoneInput] = useState("");
    const [countyInput, setCountyInput] = useState("");

    // Advanced (collapsible) filters — kept intentionally minimal.
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [listingKind, setListingKind] = useState<ListingKind>("any");
    const [maxPrice, setMaxPrice] = useState<string>("");

    // Preview / submission state
    const [loading, setLoading] = useState<QuickTarget | null>(null);
    const [preview, setPreview] = useState<PreviewState | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const hasAdvancedFilters = listingKind !== "any" || maxPrice !== "";

    // Builds the filter payload applied to every quick-sync target.
    const buildAdvancedFilters = (base: AdvancedPropertyFilters): AdvancedPropertyFilters => {
        const f: AdvancedPropertyFilters = { ...base };
        if (listingKind === "sale") f.propertyType = "Residential";
        else if (listingKind === "rent") f.propertyType = "Residential Lease";
        if (maxPrice) f.maxPrice = Number(maxPrice);
        return f;
    };

    const clearAdvancedFilters = () => {
        setListingKind("any");
        setMaxPrice("");
    };

    const doPreview = async (target: QuickTarget, base: AdvancedPropertyFilters, label: string) => {
        const filters = buildAdvancedFilters(base);
        setLoading(target);
        setPreview(null);
        try {
            const res = await fetch("/api/sync/preview", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ filters }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Preview failed");
            if (data.total === 0) {
                toast.info(`No results for "${label}".`, {
                    description: hasAdvancedFilters
                        ? "Try relaxing the advanced filters."
                        : "Try a different zip or city.",
                });
                return;
            }
            setPreview({
                target,
                filters,
                label,
                total: data.total,
                estimatedMsQuality: data.estimatedMsQuality,
                estimatedMsFast: data.estimatedMsFast,
            });
        } catch (err: any) {
            toast.error(`Preview failed: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    const handleMyListings = () => {
        if (!NELSON_AGENT_ID) {
            toast.error("NEXT_PUBLIC_NELSON_AGENT_ID is not configured.");
            return;
        }
        doPreview("listings", { agentId: NELSON_AGENT_ID }, "My Listings");
    };

    const handleBrokerage = () => {
        if (!FL_MOVES_OFFICE_ID) {
            toast.error("NEXT_PUBLIC_NELSON_OFFICE_ID is not configured.");
            return;
        }
        doPreview("brokerage", { officeId: FL_MOVES_OFFICE_ID }, "FL Moves Brokerage");
    };

    // Shared comma-splitter used for both zones and counties. Dedupe + trim + drop empties.
    const splitAndDedupe = (raw: string): string[] => {
        const seen = new Set<string>();
        return raw
            .split(",")
            .map(z => z.trim())
            .filter(z => {
                if (z.length === 0) return false;
                const key = z.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    };

    const zonesParsed = splitAndDedupe(zoneInput);
    const countiesParsed = splitAndDedupe(countyInput);

    const handleAreaSearch = () => {
        if (zonesParsed.length === 0 && countiesParsed.length === 0) {
            toast.info("Enter a zip, city, or county name. Separate multiple with commas.");
            return;
        }

        const base: AdvancedPropertyFilters = {};
        if (zonesParsed.length > 0) base.zones = zonesParsed;
        if (countiesParsed.length > 0) base.counties = countiesParsed;

        const parts: string[] = [];
        if (zonesParsed.length) parts.push(`${zonesParsed.length === 1 ? "Zone" : "Zones"}: ${zonesParsed.join(", ")}`);
        if (countiesParsed.length) parts.push(`${countiesParsed.length === 1 ? "County" : "Counties"}: ${countiesParsed.join(", ")}`);
        const label = parts.join(" · ");

        doPreview("zone", base, label);
    };

    const removeZone = (zoneToRemove: string) => {
        const remaining = zonesParsed.filter(z => z.toLowerCase() !== zoneToRemove.toLowerCase());
        setZoneInput(remaining.join(", "));
    };

    const removeCounty = (countyToRemove: string) => {
        const remaining = countiesParsed.filter(c => c.toLowerCase() !== countyToRemove.toLowerCase());
        setCountyInput(remaining.join(", "));
    };

    const confirmSync = async (mode: "quality" | "fast") => {
        if (!preview) return;
        setSubmitting(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("No auth token");

            const res = await fetch("/api/sync/run", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filters: preview.filters,
                    mode,
                    total: preview.total,
                    label: preview.label,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Run failed");

            const estimate = mode === "quality" ? preview.estimatedMsQuality : preview.estimatedMsFast;
            toast.success(`Job queued · ${preview.label}`, {
                description: `${preview.total} properties · ~${formatDuration(estimate)} · track progress on the bottom bar`,
            });
            setPreview(null);
            setZoneInput("");
            setCountyInput("");
        } catch (err: any) {
            toast.error(`Could not queue the job: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Sync</span>
                    <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">— one click, no advanced filters</span>
                </div>
                <button
                    type="button"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        hasAdvancedFilters
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    title="Optional filters applied to every quick sync"
                >
                    <SlidersHorizontal size={12} />
                    <span>Filters{hasAdvancedFilters ? " (on)" : ""}</span>
                    {filtersOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>

            {filtersOpen && (
                <div className="mb-3 p-3 rounded-xl border border-dashed border-border bg-muted/20 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Listing kind pills */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Listing type</label>
                            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
                                {(['any', 'sale', 'rent'] as ListingKind[]).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setListingKind(k)}
                                        className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                                            listingKind === k
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {k === 'any' ? 'Any' : k === 'sale' ? 'For Sale' : 'For Rent'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max price */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max price (USD)</label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="No limit"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-[10px] text-muted-foreground">
                            These filters apply to all three Quick Sync actions below.
                        </p>
                        {hasAdvancedFilters && (
                            <button
                                type="button"
                                onClick={clearAdvancedFilters}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                            >
                                <X size={11} /> Clear filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* My Listings */}
                <button
                    type="button"
                    onClick={handleMyListings}
                    disabled={loading !== null || submitting}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-accent/50 hover:border-blue-300 dark:hover:border-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                        {loading === "listings" ? (
                            <Loader2 size={16} className="animate-spin text-blue-600" />
                        ) : (
                            <Star size={16} className="text-blue-600" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">My Listings</div>
                        <div className="text-[11px] text-muted-foreground truncate">Nelson&apos;s personal inventory</div>
                    </div>
                </button>

                {/* Brokerage */}
                <button
                    type="button"
                    onClick={handleBrokerage}
                    disabled={loading !== null || submitting}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-accent/50 hover:border-purple-300 dark:hover:border-purple-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                        {loading === "brokerage" ? (
                            <Loader2 size={16} className="animate-spin text-purple-600" />
                        ) : (
                            <Building2 size={16} className="text-purple-600" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">Brokerage</div>
                        <div className="text-[11px] text-muted-foreground truncate">Full FL Moves inventory</div>
                    </div>
                </button>

                {/* Zone + County combined search slot */}
                <div className="space-y-2">
                    {/* Zone input */}
                    <div className="flex items-stretch gap-2 rounded-xl border border-border bg-background overflow-hidden focus-within:border-emerald-300 dark:focus-within:border-emerald-800 transition-colors">
                        <div className="w-9 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                            {loading === "zone" ? (
                                <Loader2 size={16} className="animate-spin text-emerald-600" />
                            ) : (
                                <MapPin size={16} className="text-emerald-600" />
                            )}
                        </div>
                        <Input
                            type="text"
                            value={zoneInput}
                            onChange={(e) => setZoneInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAreaSearch(); }}
                            placeholder="City or ZIP — 33612, Tampa, Orlando…"
                            disabled={loading !== null || submitting}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 text-sm"
                        />
                    </div>
                    {zonesParsed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pl-1">
                            {zonesParsed.map((z) => {
                                const isZip = /^\d+$/.test(z);
                                return (
                                    <span
                                        key={z}
                                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                        <span className="opacity-60">{isZip ? "ZIP" : "CITY"}</span>
                                        {z}
                                        <button
                                            type="button"
                                            onClick={() => removeZone(z)}
                                            className="ml-0.5 opacity-60 hover:opacity-100"
                                            aria-label={`Remove ${z}`}
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* County input */}
                    <div className="flex items-stretch gap-2 rounded-xl border border-border bg-background overflow-hidden focus-within:border-amber-300 dark:focus-within:border-amber-800 transition-colors">
                        <div className="w-9 flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 shrink-0">
                            <LandPlot size={16} className="text-amber-600" />
                        </div>
                        <Input
                            type="text"
                            value={countyInput}
                            onChange={(e) => setCountyInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAreaSearch(); }}
                            placeholder="County — Polk, Hillsborough, Orange…"
                            disabled={loading !== null || submitting}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleAreaSearch}
                            disabled={loading !== null || submitting || (zonesParsed.length === 0 && countiesParsed.length === 0)}
                            className="px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 border-l border-border"
                        >
                            <Search size={13} />
                            {(() => {
                                const total = zonesParsed.length + countiesParsed.length;
                                return total > 1 ? `Search (${total})` : "Search";
                            })()}
                        </button>
                    </div>
                    {countiesParsed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pl-1">
                            {countiesParsed.map((c) => (
                                <span
                                    key={c}
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold"
                                >
                                    <span className="opacity-60">COUNTY</span>
                                    {c}
                                    <button
                                        type="button"
                                        onClick={() => removeCounty(c)}
                                        className="ml-0.5 opacity-60 hover:opacity-100"
                                        aria-label={`Remove ${c}`}
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {hasAdvancedFilters && !filtersOpen && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    <TagIcon size={10} />
                    <span className="font-semibold uppercase tracking-wider">Active filters:</span>
                    {listingKind !== "any" && <span className="px-1.5 py-0.5 rounded-full bg-muted">{listingKind === "sale" ? "For Sale" : "For Rent"}</span>}
                    {maxPrice && <span className="px-1.5 py-0.5 rounded-full bg-muted">≤ ${Number(maxPrice).toLocaleString()}</span>}
                </div>
            )}

            {/* Confirmation panel */}
            {preview && (
                <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                {preview.label}
                            </div>
                            <div className="text-2xl font-bold tabular-nums">
                                {preview.total.toLocaleString()}
                                <span className="text-sm font-normal text-muted-foreground ml-1">properties</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                ~{formatDuration(preview.estimatedMsQuality)} (Quality, with AI) · ~{formatDuration(preview.estimatedMsFast)} (Fast)
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => confirmSync("fast")}
                                disabled={submitting}
                                className="h-10 px-4 rounded-xl text-sm font-semibold border border-border bg-background hover:bg-accent disabled:opacity-40 inline-flex items-center gap-1.5"
                                title="Skip re-embedding for properties that didn't change description"
                            >
                                <Zap size={14} /> Fast
                            </button>
                            <button
                                type="button"
                                onClick={() => confirmSync("quality")}
                                disabled={submitting}
                                className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 inline-flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
                                title="Re-embed every property with Gemini for freshest semantic search"
                            >
                                {submitting ? (
                                    <><Loader2 size={14} className="animate-spin" /> Queueing…</>
                                ) : (
                                    <><Sparkles size={14} /> Sync (Quality)</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreview(null)}
                                disabled={submitting}
                                className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-accent flex items-center justify-center disabled:opacity-40"
                                title="Cancel"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
