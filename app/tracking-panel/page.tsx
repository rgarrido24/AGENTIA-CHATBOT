"use client";
import { useState, useCallback } from "react";
import { GoogleMap, Polyline, Marker, useJsApiLoader } from "@react-google-maps/api";

type Point = { lat: number; lng: number; timestamp: string; streetName: string | null };

export default function TrackingPanel() {
  const [jornadaId, setJornadaId] = useState("");
  const [points, setPoints] = useState<Point[]>([]);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const fetchRoute = useCallback(async () => {
    const res = await fetch(`/api/tracking/route/${jornadaId}`);
    const data = await res.json();
    setPoints(data.points || []);
  }, [jornadaId]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const center = path.length ? path[Math.floor(path.length / 2)] : { lat: 20.9674, lng: -89.5926 };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          value={jornadaId}
          onChange={(e) => setJornadaId(e.target.value)}
          placeholder="ID de jornada"
          className="border p-2 rounded"
        />
        <button onClick={fetchRoute} className="bg-blue-600 text-white px-4 rounded">
          Ver ruta
        </button>
      </div>

      <GoogleMap mapContainerStyle={{ width: "100%", height: "500px" }} center={center} zoom={15}>
        <Polyline path={path} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
        {path[0] && <Marker position={path[0]} label="Inicio" />}
        {path[path.length - 1] && <Marker position={path[path.length - 1]} label="Fin" />}
      </GoogleMap>
    </div>
  );
}
