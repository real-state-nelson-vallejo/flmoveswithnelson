"use client";

import { useEffect, useRef, useState } from "react";

type Comp = {
    id: string;
    address: string;
    price: number;
    distance?: number;
    type: string;
};

interface MapProps {
    center: [number, number];
    rentalComps?: Comp[];
    saleComps?: Comp[];
}

export function MarketMap({ center, rentalComps = [], saleComps = [] }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null); // Store map instance in ref to persist across renders
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Prevent double initialization in strict mode or quick re-renders
        if (mapInstanceRef.current) return;

        let isMounted = true;

        const initMap = async () => {
            try {
                // Initial check
                if (!mapRef.current) return;

                const L = (await import("leaflet")).default;

                // Sync check after await - CRITICAL
                if (!isMounted) return;
                if (!mapRef.current) return;

                // Check if element already has a leaflet instance (defensive)
                if ((mapRef.current as any)._leaflet_id) {
                    return;
                }

                // Fix default icon paths
                const icon = L.divIcon({
                    html: `<div style="width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.3)"></div>`,
                    className: "",
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });

                const rentIcon = L.divIcon({
                    html: `<div style="width:10px;height:10px;background:#3b82f6;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>`,
                    className: "",
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                });

                const saleIcon = L.divIcon({
                    html: `<div style="width:10px;height:10px;background:#f59e0b;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(245,158,11,0.3)"></div>`,
                    className: "",
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                });

                // Initialize map and store in ref
                const map = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: false,
                }).setView(center, 13);

                mapInstanceRef.current = map;

                L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                    maxZoom: 19,
                }).addTo(map);

                // Subject property
                L.marker(center, { icon })
                    .addTo(map)
                    .bindPopup(`<b style="color:#10b981">Subject Property</b>`);

                // Comps (approximate positions via small offset — real coords would need geocoding)
                rentalComps.slice(0, 5).forEach((comp, i) => {
                    const offset: [number, number] = [
                        center[0] + (Math.random() - 0.5) * 0.01,
                        center[1] + (Math.random() - 0.5) * 0.01,
                    ];
                    L.marker(offset, { icon: rentIcon })
                        .addTo(map)
                        .bindPopup(`<b style="color:#3b82f6">Rental</b><br/>${comp.address}<br/>$${comp.price?.toLocaleString()}/mo`);
                });

                saleComps.slice(0, 5).forEach((comp, i) => {
                    const offset: [number, number] = [
                        center[0] + (Math.random() - 0.5) * 0.01,
                        center[1] + (Math.random() - 0.5) * 0.01,
                    ];
                    L.marker(offset, { icon: saleIcon })
                        .addTo(map)
                        .bindPopup(`<b style="color:#f59e0b">For Sale</b><br/>${comp.address}<br/>$${comp.price?.toLocaleString()}`);
                });

                L.control.zoom({ position: "bottomright" }).addTo(map);

                if (isMounted) {
                    setMapLoaded(true);
                }
            } catch (e) {
                console.error("Map init failed", e);
                if (isMounted) {
                    setError(true);
                }
            }
        };

        // Delay slightly to allow strict mode unmount to happen if needed
        const timer = setTimeout(() => {
            initMap();
        }, 0);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            // Cleanup: remove map instance
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0d0d12] text-slate-500 text-sm">
                Map unavailable
            </div>
        );
    }

    return (
        <>
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d12]">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </>
    );
}
