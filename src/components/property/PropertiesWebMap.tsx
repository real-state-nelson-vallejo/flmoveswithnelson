import { useMemo } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { PropertyDTO } from "@/types/property";
import { formatPrice } from "@/lib/formatters";

interface PropertiesWebMapProps {
    properties?: PropertyDTO[];
}

export function PropertiesWebMap({ properties = [] }: PropertiesWebMapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const center = useMemo(() => ({ lat: 28.1, lng: -81.6 }), []); // Central FL approx

    const markers = useMemo(() => {
        return properties
            .filter(p => p.location.coordinates) // Only show properties with coordinates
            .map(p => ({
                id: p.id,
                position: p.location.coordinates!,
                price: formatPrice(p.price.amount, { notation: 'compact', compactDisplay: 'short' }),
                title: p.title
            }));
    }, [properties]);

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
                        label={{
                            text: `$${marker.price}`,
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                            className: "bg-slate-900 px-2 py-1 rounded shadow-lg font-sans"
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}
