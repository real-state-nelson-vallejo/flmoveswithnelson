"use client";

import { useMemo } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

export function PropertiesWebMap() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const center = useMemo(() => ({ lat: 28.1, lng: -81.6 }), []); // Central FL approx

    const markers = useMemo(() => [
        { id: 1, position: { lat: 28.12, lng: -81.61 }, price: '$390k' },
        { id: 2, position: { lat: 28.08, lng: -81.58 }, price: '$2.5M' },
        { id: 3, position: { lat: 28.11, lng: -81.65 }, price: '$850k' },
    ], []);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;

    return (
        <div className="w-full h-full relative">
            <GoogleMap
                zoom={11}
                center={center}
                mapContainerClassName="w-full h-full"
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        },
                    ]
                }}
            >
                {markers.map((marker) => (
                    <MarkerF
                        key={marker.id}
                        position={marker.position}
                        label={{
                            text: marker.price,
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                            className: "bg-slate-900 px-2 py-1 rounded shadow-lg"
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}
