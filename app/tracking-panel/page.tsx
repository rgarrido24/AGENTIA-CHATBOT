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

type StreetSegment = {
  streetName: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
};

function formatJornadaLabel(jornada: Jornada) {
  const fecha = new Date(jornada.startTime).toLocaleString("es-MX", {
    timeZone: "America/Merida",
  });
  return `${jornada.userName} - ${fecha} (${jornada.status})`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Merida",
  });
}

export default function TrackingPanel() {
  const [jornadaId, setJornadaId] = useState("");
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [streetSegments, setStreetSegments] = useState<StreetSegment[]>([]);
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
    setDurationMinutes(data.durationMinutes ?? null);
    setDistanceMeters(data.distanceMeters ?? null);
    setStreetSegments(data.streetSegments || []);
  }, []);

  const handleJornadaChange = (id: string) => {
    setJornadaId(id);
    if (id) {
      fetchRoute(id);
    } else {
      setPoints([]);
      setDurationMinutes(null);
      setDistanceMeters(null);
      setStreetSegments([]);
    }
  };

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const center = path.length ? path[Math.floor(path.length / 2)] : { lat: 20.9674, lng: -89.5926 };
  const distanceKm =
    distanceMeters != null ? (distanceMeters / 1000).toFixed(1) : null;

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <select
          value={jornadaId}
          onChange={(e) => handleJornadaChange(e.target.value)}
          className="border border-gray-600 bg-gray-900 text-gray-100 p-2 rounded min-w-[320px]"
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

      {jornadaId && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-6 text-gray-200">
            <p>
              <span className="font-medium">Duración total:</span>{" "}
              {durationMinutes != null ? `${durationMinutes} min` : "—"}
            </p>
            <p>
              <span className="font-medium">Distancia recorrida:</span>{" "}
              {distanceKm != null ? `${distanceKm} km` : "—"}
            </p>
          </div>

          {streetSegments.length === 0 ? (
            <p className="text-gray-400">Sin datos de calles disponibles para esta jornada</p>
          ) : (
            <div className="overflow-x-auto border border-gray-700 rounded">
              <table className="w-full text-sm text-left text-gray-200">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-700">Calle</th>
                    <th className="px-4 py-2 border-b border-gray-700">Hora entrada</th>
                    <th className="px-4 py-2 border-b border-gray-700">Hora salida</th>
                    <th className="px-4 py-2 border-b border-gray-700">Duración (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {streetSegments.map((seg, idx) => (
                    <tr key={`${seg.streetName}-${idx}`} className="border-b border-gray-800">
                      <td className="px-4 py-2">{seg.streetName}</td>
                      <td className="px-4 py-2">{formatTime(seg.entryTime)}</td>
                      <td className="px-4 py-2">{formatTime(seg.exitTime)}</td>
                      <td className="px-4 py-2">{seg.durationMinutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
