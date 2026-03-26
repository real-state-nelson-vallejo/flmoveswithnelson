import { useMemo } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { PropertyDTO } from "@/types/property";
import { formatCurrency } from "@/lib/formatters";

interface PropertiesWebMapProps {
    properties?: PropertyDTO[];
    hoveredPropertyId?: string | null;
}

export function PropertiesWebMap({ properties = [], hoveredPropertyId }: PropertiesWebMapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const center = useMemo(() => ({ lat: 28.1, lng: -81.6 }), []); // Central FL approx

    const markers = useMemo(() => {
        return properties
            .map((p, index) => {
                // Determine a position, using fallback random offsets based on the map center if property lacks coordinates
                const position = (p.Latitude && p.Longitude) ? { lat: p.Latitude, lng: p.Longitude } : {
                    lat: center.lat + (Math.random() - 0.5) * 0.1, 
                    lng: center.lng + (Math.random() - 0.5) * 0.1
                };

                return {
                    id: p.ListingKey || p.slug || Math.random().toString(),
                    position,
                    labelString: `${formatCurrency(p.ListPrice)} - ${p.PropertyType === 'Residential' ? 'For Sale' : 'For Rent'}`,
                    title: p.UnparsedAddress
                };
            });
    }, [properties, center]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;

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
                        zIndex={hoveredPropertyId === marker.id ? 50 : 1}
                        label={{
                            text: marker.labelString,
                            color: "white",
                            fontSize: "13px",
                            fontWeight: "bold",
                            className: `px-2 py-1 rounded shadow-lg font-sans transition-all ${hoveredPropertyId === marker.id
                                ? 'bg-blue-600 ring-2 ring-white scale-110'
                                : 'bg-slate-900'
                                }`
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}
