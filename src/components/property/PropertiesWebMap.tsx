"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, MarkerClustererF } from "@react-google-maps/api";
import { PropertyDTO } from "@/types/property";
import { formatCurrency } from "@/lib/formatters";
import { MapHoverCard } from "./MapHoverCard";

interface PropertiesWebMapProps {
    properties?: PropertyDTO[];
    hoveredPropertyId?: string | null;
    locale: string;
    onMarkerHover?: (id: string | null) => void;
}

interface MarkerData {
    id: string;
    position: { lat: number; lng: number };
    labelString: string;
    title: string;
    property: PropertyDTO;
}

const CLUSTER_THRESHOLD = 50;

export function PropertiesWebMap({
    properties = [],
    hoveredPropertyId,
    locale,
    onMarkerHover,
}: PropertiesWebMapProps) {
    const router = useRouter();
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

    const center = useMemo(() => ({ lat: 28.1, lng: -81.6 }), []);

    const markers = useMemo<MarkerData[]>(() => {
        return properties.map((p) => {
            const position = (p.Latitude && p.Longitude) ? { lat: p.Latitude, lng: p.Longitude } : {
                lat: center.lat + (Math.random() - 0.5) * 0.1,
                lng: center.lng + (Math.random() - 0.5) * 0.1,
            };
            return {
                id: p.ListingKey || p.slug || Math.random().toString(),
                position,
                labelString: `${formatCurrency(p.ListPrice)}`,
                title: p.UnparsedAddress,
                property: p,
            };
        });
    }, [properties, center]);

    const handleMarkerClick = useCallback((marker: MarkerData) => {
        const slug = marker.property.slug || marker.property.ListingKey;
        router.push(`/${locale}/properties/${slug}`);
    }, [router, locale]);

    const handleMarkerMouseOver = useCallback((marker: MarkerData) => {
        setActiveInfoId(marker.id);
        onMarkerHover?.(marker.id);
    }, [onMarkerHover]);

    const handleMarkerMouseOut = useCallback(() => {
        // Don't close instantly — user may want to interact with the info window.
        // The info window's own close button / another marker hover will clear it.
        onMarkerHover?.(null);
    }, [onMarkerHover]);

    if (!isLoaded) {
        return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;
    }

    const activeMarker = activeInfoId ? markers.find((m) => m.id === activeInfoId) : null;
    const hoveredMarker = hoveredPropertyId ? markers.find((m) => m.id === hoveredPropertyId) : null;
    const useClustering = markers.length > CLUSTER_THRESHOLD;

    const renderMarkers = (clusterer?: any) => markers.map((marker) => {
        const isHoveredFromList = hoveredPropertyId === marker.id;
        const isHoveredOnMap = activeInfoId === marker.id;
        const highlighted = isHoveredFromList || isHoveredOnMap;

        return (
            <MarkerF
                key={marker.id}
                position={marker.position}
                clusterer={clusterer}
                onClick={() => handleMarkerClick(marker)}
                onMouseOver={() => handleMarkerMouseOver(marker)}
                onMouseOut={handleMarkerMouseOut}
                zIndex={highlighted ? 50 : 1}
                label={{
                    text: marker.labelString,
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold",
                    className: `px-2 py-1 rounded-md shadow-lg font-sans transition-all ${highlighted ? "bg-blue-600 ring-2 ring-white scale-110" : "bg-slate-900"}`,
                }}
            />
        );
    });

    return (
        <div className="w-full h-full relative">
            <GoogleMap
                zoom={9}
                center={center}
                mapContainerClassName="w-full h-full"
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    clickableIcons: false,
                    styles: [
                        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                    ],
                }}
            >
                {useClustering ? (
                    <MarkerClustererF options={{ gridSize: 60, maxZoom: 12 }}>
                        {(clusterer) => <>{renderMarkers(clusterer)}</>}
                    </MarkerClustererF>
                ) : (
                    renderMarkers()
                )}

                {(activeMarker || hoveredMarker) && (() => {
                    const target = activeMarker || hoveredMarker!;
                    return (
                        <InfoWindowF
                            position={target.position}
                            onCloseClick={() => setActiveInfoId(null)}
                            options={{
                                pixelOffset: new google.maps.Size(0, -34),
                                disableAutoPan: false,
                            }}
                        >
                            <MapHoverCard property={target.property} locale={locale} />
                        </InfoWindowF>
                    );
                })()}
            </GoogleMap>
        </div>
    );
}
