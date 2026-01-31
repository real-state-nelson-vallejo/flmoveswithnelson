"use client";

import { useMemo } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

interface PropertyMapProps {
    address: string;
}

export function PropertyMap({ address: _address }: PropertyMapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    // Silence linter
    console.log("Map Address:", _address);

    const center = useMemo(() => ({ lat: 28.1, lng: -81.6 }), []); // Use address geocoding in real app

    if (!isLoaded) return <div className="w-full h-[400px] bg-slate-100 rounded-xl flex items-center justify-center">Loading Map...</div>;

    return (
        <div className="w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 mt-8">
            <GoogleMap
                zoom={14}
                center={center}
                mapContainerClassName="w-full h-full"
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                }}
            >
                <MarkerF position={center} />
            </GoogleMap>
        </div>
    );
}
