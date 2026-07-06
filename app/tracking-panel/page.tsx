"use client";
import { useState, useCallback, useEffect } from "react";
import { GoogleMap, Polyline, Marker, useJsApiLoader } from "@react-google-maps/api";

type Point = { lat: number; lng: number; timestamp: string; streetName: string | null };

type Jornada = {
  jornadaId: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string | null;
  status: string;
};

function formatJornadaLabel(jornada: Jornada) {
  const fecha = new Date(jornada.startTime).toLocaleString("es-MX");
  return `${jornada.userName} - ${fecha} (${jornada.status})`;
}

export default function TrackingPanel() {
  const [jornadaId, setJornadaId] = useState("");
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    fetch("/api/tracking/jornadas")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJornadas(data);
      })
      .catch(console.error);
  }, []);

  const fetchRoute = useCallback(async (id: string) => {
    const res = await fetch(`/api/tracking/route/${id}`);
    const data = await res.json();
    setPoints(data.points || []);
  }, []);

  const handleJornadaChange = (id: string) => {
    setJornadaId(id);
    if (id) fetchRoute(id);
  };

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const center = path.length ? path[Math.floor(path.length / 2)] : { lat: 20.9674, lng: -89.5926 };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <select
          value={jornadaId}
          onChange={(e) => handleJornadaChange(e.target.value)}
          className="border p-2 rounded min-w-[320px]"
        >
          <option value="">Selecciona una jornada</option>
          {jornadas.map((j) => (
            <option key={j.jornadaId} value={j.jornadaId}>
              {formatJornadaLabel(j)}
            </option>
          ))}
        </select>
      </div>

      <GoogleMap mapContainerStyle={{ width: "100%", height: "500px" }} center={center} zoom={15}>
        <Polyline path={path} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
        {path[0] && <Marker position={path[0]} label="Inicio" />}
        {path[path.length - 1] && <Marker position={path[path.length - 1]} label="Fin" />}
      </GoogleMap>
    </div>
  );
}
