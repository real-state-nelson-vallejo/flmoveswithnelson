"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Circle, Marker, Polygon } from "@react-google-maps/api";
import { MapPin, Radius, PenTool, Trash2, LocateFixed } from "lucide-react";

const MAP_LIBRARIES: ("drawing" | "geometry")[] = ["drawing", "geometry"];

const containerStyle = { width: "100%", height: "340px" };
const defaultCenter = { lat: 25.7617, lng: -80.1918 }; // Miami, FL

export interface SpatialBoxResult {
    latMin: number; latMax: number;
    lngMin: number; lngMax: number;
    /** For display: the polygon path (array of lat/lng points) or null if circle */
    path?: { lat: number; lng: number }[];
    /** Circle params (for display only) */
    circle?: { lat: number; lng: number; radius: number };
}

interface SyncMapSelectorProps {
    onSpatialChange: (spatial: SpatialBoxResult | undefined) => void;
    value?: SpatialBoxResult;
}

type DrawMode = "circle" | "polygon";

function metersToMiles(m: number) { return (m / 1609.34).toFixed(1); }
function milesToDeg(miles: number) { return miles / 69; }

export function SyncMapSelector({ onSpatialChange, value }: SyncMapSelectorProps) {
    const [isActive, setIsActive] = useState(false);
    const [drawMode, setDrawMode] = useState<DrawMode>("circle");
    const [circleCenter, setCircleCenter] = useState(defaultCenter);
    const [circleRadius, setCircleRadius] = useState(8046.72); // 5 miles in meters
    const [polygonPath, setPolygonPath] = useState<{ lat: number; lng: number }[]>([]);
    const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script-sync",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: MAP_LIBRARIES,
    });

    const emitCircle = useCallback((center: { lat: number; lng: number }, radiusM: number) => {
        const miles = radiusM / 1609.34;
        const degLat = milesToDeg(miles);
        const degLng = milesToDeg(miles) * 1.2;
        onSpatialChange({
            latMin: center.lat - degLat,
            latMax: center.lat + degLat,
            lngMin: center.lng - degLng,
            lngMax: center.lng + degLng,
            circle: { lat: center.lat, lng: center.lng, radius: miles },
        });
    }, [onSpatialChange]);

    const emitPolygon = useCallback((path: { lat: number; lng: number }[]) => {
        if (path.length < 3) return;
        const lats = path.map(p => p.lat);
        const lngs = path.map(p => p.lng);
        onSpatialChange({
            latMin: Math.min(...lats),
            latMax: Math.max(...lats),
            lngMin: Math.min(...lngs),
            lngMax: Math.max(...lngs),
            path,
        });
    }, [onSpatialChange]);

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !isActive) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        if (drawMode === "circle") {
            setCircleCenter({ lat, lng });
            emitCircle({ lat, lng }, circleRadius);
        } else {
            // polygon drawing
            setIsDrawingPolygon(true);
            setPolygonPath(prev => [...prev, { lat, lng }]);
        }
    }, [isActive, drawMode, circleRadius, emitCircle]);

    useEffect(() => {
        if (isActive && drawMode === "polygon" && polygonPath.length >= 3) {
            emitPolygon(polygonPath);
        }
    }, [polygonPath, drawMode, isActive, emitPolygon]);

    const handleToggleActive = () => {
        const next = !isActive;
        setIsActive(next);
        if (!next) {
            setPolygonPath([]);
            setIsDrawingPolygon(false);
            onSpatialChange(undefined);
        } else {
            if (drawMode === "circle") {
                emitCircle(circleCenter, circleRadius);
            }
        }
    };

    const handleClearPolygon = () => {
        setPolygonPath([]);
        setIsDrawingPolygon(false);
        if (drawMode === "circle") {
            emitCircle(circleCenter, circleRadius);
        } else {
            onSpatialChange(undefined);
        }
    };

    const handleRadiusChange = (val: number) => {
        const radiusM = val * 1609.34;
        setCircleRadius(radiusM);
        if (isActive && drawMode === "circle") emitCircle(circleCenter, radiusM);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(pos => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCircleCenter(c);
            mapRef.current?.panTo(c);
            if (isActive && drawMode === "circle") emitCircle(c, circleRadius);
        });
    };

    const switchMode = (mode: DrawMode) => {
        setDrawMode(mode);
        setPolygonPath([]);
        setIsDrawingPolygon(false);
        if (isActive) {
            if (mode === "circle") emitCircle(circleCenter, circleRadius);
            else onSpatialChange(undefined);
        }
    };

    const radiusMiles = Math.round(circleRadius / 1609.34);

    if (loadError) return (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            Google Maps no disponible. Verifica la API Key.
        </div>
    );

    if (!isLoaded) return (
        <div className="p-4 bg-slate-50 text-center text-sm rounded-xl border border-slate-200 animate-pulse text-slate-500">
            Cargando mapa...
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Toggle Header */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                        onClick={handleToggleActive}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500" /> Búsqueda Espacial en Mapa
                    </span>
                </label>
                {isActive && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        Activo
                    </span>
                )}
            </div>

            {isActive && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {/* Mode Switcher */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                        <button
                            onClick={() => switchMode("circle")}
                            title="Círculo de Radio"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${drawMode === "circle" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                        >
                            <Radius size={13} /> Radio
                        </button>
                        <button
                            onClick={() => switchMode("polygon")}
                            title="Dibujar polígono"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${drawMode === "polygon" ? "bg-violet-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                        >
                            <PenTool size={13} /> Polígono
                        </button>
                        <div className="flex-1" />
                        {drawMode === "polygon" && polygonPath.length > 0 && (
                            <button onClick={handleClearPolygon} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                                <Trash2 size={12} /> Borrar
                            </button>
                        )}
                        <button onClick={handleLocateMe} title="Mi ubicación" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium">
                            <LocateFixed size={13} /> Mi zona
                        </button>
                    </div>

                    {/* Circle Controls */}
                    {drawMode === "circle" && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50/60 border-b border-blue-100">
                            <span className="text-xs text-slate-500 whitespace-nowrap">Radio:</span>
                            <input
                                type="range" min={1} max={50} value={radiusMiles}
                                onChange={e => handleRadiusChange(Number(e.target.value))}
                                className="flex-1 h-1.5 accent-blue-600"
                            />
                            <span className="text-xs font-bold text-blue-700 w-16 text-right">{radiusMiles} millas</span>
                        </div>
                    )}

                    {/* Polygon Instructions */}
                    {drawMode === "polygon" && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50/60 border-b border-violet-100">
                            <PenTool size={12} className="text-violet-500 flex-shrink-0" />
                            <span className="text-xs text-violet-700 font-medium">
                                {polygonPath.length === 0
                                    ? "Haz clic en el mapa para trazar tu zona personalizada"
                                    : polygonPath.length < 3
                                        ? `${polygonPath.length} punto${polygonPath.length > 1 ? 's' : ''} — necesitas al menos 3`
                                        : `Zona definida con ${polygonPath.length} puntos`
                                }
                            </span>
                        </div>
                    )}

                    {/* Map */}
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={circleCenter}
                        zoom={11}
                        onClick={handleMapClick}
                        onLoad={map => { mapRef.current = map; }}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            streetViewControl: false,
                            styles: [
                                { featureType: "poi", stylers: [{ visibility: "off" }] },
                                { featureType: "transit", stylers: [{ visibility: "off" }] },
                            ],
                            draggableCursor: isActive ? (drawMode === "polygon" ? "crosshair" : "pointer") : "default",
                        }}
                    >
                        {drawMode === "circle" && (
                            <>
                                <Marker position={circleCenter} />
                                <Circle
                                    center={circleCenter}
                                    radius={circleRadius}
                                    options={{
                                        fillColor: "#3b82f6", fillOpacity: 0.15,
                                        strokeColor: "#3b82f6", strokeOpacity: 0.9, strokeWeight: 2,
                                        clickable: false,
                                    }}
                                />
                            </>
                        )}
                        {drawMode === "polygon" && polygonPath.length > 0 && (
                            <>
                                {polygonPath.map((point, i) => (
                                    <Marker
                                        key={i}
                                        position={point}
                                        options={{
                                            icon: {
                                                path: google.maps.SymbolPath.CIRCLE,
                                                scale: i === 0 ? 7 : 5,
                                                fillColor: i === 0 ? "#7c3aed" : "#a78bfa",
                                                fillOpacity: 1,
                                                strokeColor: "#fff",
                                                strokeWeight: 2,
                                            }
                                        }}
                                    />
                                ))}
                                {polygonPath.length >= 3 && (
                                    <Polygon
                                        paths={polygonPath}
                                        options={{
                                            fillColor: "#7c3aed", fillOpacity: 0.15,
                                            strokeColor: "#7c3aed", strokeOpacity: 0.9, strokeWeight: 2,
                                            clickable: false,
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </GoogleMap>

                    {/* Footer info */}
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {drawMode === "circle"
                                ? `Centro: ${circleCenter.lat.toFixed(4)}, ${circleCenter.lng.toFixed(4)}`
                                : polygonPath.length > 0
                                    ? `Bounding box calculado de ${polygonPath.length} vértices`
                                    : "Sin zona activa"
                            }
                        </span>
                        {drawMode === "circle" && (
                            <span className="text-xs font-medium text-blue-600">
                                ~{radiusMiles} millas de radio
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
