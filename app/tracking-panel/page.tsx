"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { GoogleMap, Polyline, Marker, useJsApiLoader } from "@react-google-maps/api";

type Point = { lat: number; lng: number; timestamp: string; streetName: string | null };

type Jornada = {
  jornadaId: string;
  userId: string;
  userName: string;
  plaza: string;
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

type ZonaJornada = {
  jornadaId: string;
  userName: string;
  plaza: string;
  points: Array<{ lat: number; lng: number }>;
};

const USER_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#0d9488",
];

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    desde: toDateInputValue(monday),
    hasta: toDateInputValue(sunday),
  };
}

function formatJornadaLabel(jornada: Jornada) {
  const fecha = new Date(jornada.startTime).toLocaleString("es-MX", {
    timeZone: "America/Merida",
  });
  return `${jornada.userName} (${jornada.plaza}) - ${fecha} (${jornada.status})`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Merida",
  });
}

function colorForUser(userName: string, colorByUser: Map<string, string>) {
  if (colorByUser.has(userName)) return colorByUser.get(userName)!;
  const color = USER_COLORS[colorByUser.size % USER_COLORS.length];
  colorByUser.set(userName, color);
  return color;
}

export default function TrackingPanel() {
  const week = useMemo(() => getCurrentWeekBounds(), []);
  const [vista, setVista] = useState<"jornada" | "zonas">("jornada");
  const [jornadaId, setJornadaId] = useState("");
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [streetSegments, setStreetSegments] = useState<StreetSegment[]>([]);
  const [desde, setDesde] = useState(week.desde);
  const [hasta, setHasta] = useState(week.hasta);
  const [zonasJornadas, setZonasJornadas] = useState<ZonaJornada[]>([]);
  const [zonasLoading, setZonasLoading] = useState(false);

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

  const fetchZonas = useCallback(async (desdeFecha: string, hastaFecha: string) => {
    setZonasLoading(true);
    try {
      const res = await fetch(
        `/api/tracking/zonas?desde=${encodeURIComponent(desdeFecha)}&hasta=${encodeURIComponent(hastaFecha)}`
      );
      const data = await res.json();
      setZonasJornadas(Array.isArray(data.jornadas) ? data.jornadas : []);
    } catch (err) {
      console.error(err);
      setZonasJornadas([]);
    } finally {
      setZonasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vista === "zonas") {
      fetchZonas(desde, hasta);
    }
    // Solo al entrar a la vista; Actualizar maneja cambios de fecha
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

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

  const colorByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of zonasJornadas) {
      colorForUser(j.userName, map);
    }
    return map;
  }, [zonasJornadas]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const jornadaCenter = path.length
    ? path[Math.floor(path.length / 2)]
    : { lat: 20.9674, lng: -89.5926 };
  const distanceKm =
    distanceMeters != null ? (distanceMeters / 1000).toFixed(1) : null;

  const allZonaPoints = zonasJornadas.flatMap((j) => j.points);
  const zonasCenter = allZonaPoints.length
    ? allZonaPoints[Math.floor(allZonaPoints.length / 2)]
    : { lat: 20.9674, lng: -89.5926 };

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => setVista(vista === "jornada" ? "zonas" : "jornada")}
          className="border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 rounded hover:bg-gray-700"
        >
          {vista === "jornada" ? "Ver mapa de zonas" : "Ver jornada individual"}
        </button>

        {vista === "jornada" ? (
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
        ) : (
          <>
            <label className="text-gray-300 text-sm flex items-center gap-2">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="border border-gray-600 bg-gray-900 text-gray-100 p-2 rounded"
              />
            </label>
            <label className="text-gray-300 text-sm flex items-center gap-2">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="border border-gray-600 bg-gray-900 text-gray-100 p-2 rounded"
              />
            </label>
            <button
              type="button"
              onClick={() => fetchZonas(desde, hasta)}
              disabled={zonasLoading}
              className="border border-gray-600 bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {zonasLoading ? "Cargando..." : "Actualizar"}
            </button>
          </>
        )}
      </div>

      {vista === "jornada" ? (
        <>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "500px" }}
            center={jornadaCenter}
            zoom={15}
          >
            <Polyline path={path} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
            {path[0] && <Marker position={path[0]} label="Inicio" />}
            {path[path.length - 1] && (
              <Marker position={path[path.length - 1]} label="Fin" />
            )}
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
                <p className="text-gray-400">
                  Sin datos de calles disponibles para esta jornada
                </p>
              ) : (
                <div className="overflow-x-auto border border-gray-700 rounded">
                  <table className="w-full text-sm text-left text-gray-200">
                    <thead className="bg-gray-800 text-gray-300">
                      <tr>
                        <th className="px-4 py-2 border-b border-gray-700">Calle</th>
                        <th className="px-4 py-2 border-b border-gray-700">
                          Hora entrada
                        </th>
                        <th className="px-4 py-2 border-b border-gray-700">
                          Hora salida
                        </th>
                        <th className="px-4 py-2 border-b border-gray-700">
                          Duración (min)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {streetSegments.map((seg, idx) => (
                        <tr
                          key={`${seg.streetName}-${idx}`}
                          className="border-b border-gray-800"
                        >
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
        </>
      ) : (
        <>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "500px" }}
            center={zonasCenter}
            zoom={12}
          >
            {zonasJornadas.map((j) => (
              <Polyline
                key={j.jornadaId}
                path={j.points}
                options={{
                  strokeColor: colorByUser.get(j.userName) || USER_COLORS[0],
                  strokeWeight: 3,
                  strokeOpacity: 0.85,
                }}
              />
            ))}
          </GoogleMap>

          <div className="mt-4">
            <p className="text-gray-200 font-medium mb-2">Leyenda</p>
            {colorByUser.size === 0 ? (
              <p className="text-gray-400 text-sm">
                {zonasLoading
                  ? "Cargando rutas..."
                  : "No hay rutas en el rango seleccionado"}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-4">
                {Array.from(colorByUser.entries()).map(([userName, color]) => (
                  <li key={userName} className="flex items-center gap-2 text-gray-200 text-sm">
                    <span
                      className="inline-block w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    {userName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
