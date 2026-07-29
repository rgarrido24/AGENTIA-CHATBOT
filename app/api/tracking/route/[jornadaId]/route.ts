import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

type TrackingPoint = {
  _id?: ObjectId;
  lat: number;
  lng: number;
  timestamp: Date;
  streetName: string | null;
};

type StreetSegment = {
  streetName: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function extractRouteName(geocodeData: {
  results?: Array<{ address_components?: Array<{ long_name: string; types: string[] }> }>;
}): string | null {
  const components = geocodeData.results?.[0]?.address_components;
  if (!components) return null;
  const route = components.find((c) => c.types.includes("route"));
  return route?.long_name ?? null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!key) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    return extractRouteName(data);
  } catch (err) {
    console.error("Error en reverse geocoding:", err);
    return null;
  }
}

async function enrichStreetNames(db: ReturnType<typeof client.db>, points: TrackingPoint[]) {
  let lastGeocodedIndex = -1;
  let lastGeocodedLat = 0;
  let lastGeocodedLng = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    if (point.streetName) {
      lastGeocodedIndex = i;
      lastGeocodedLat = point.lat;
      lastGeocodedLng = point.lng;
      continue;
    }

    let shouldGeocode = lastGeocodedIndex === -1 || i % 3 === 0;
    if (!shouldGeocode && lastGeocodedIndex >= 0) {
      const dist = haversineDistance(lastGeocodedLat, lastGeocodedLng, point.lat, point.lng);
      if (dist > 80) shouldGeocode = true;
    }

    if (!shouldGeocode) continue;

    const streetName = await reverseGeocode(point.lat, point.lng);
    if (streetName && point._id) {
      await db.collection("tracking_points").updateOne(
        { _id: point._id },
        { $set: { streetName } }
      );
      point.streetName = streetName;
    }

    lastGeocodedIndex = i;
    lastGeocodedLat = point.lat;
    lastGeocodedLng = point.lng;
  }
}

function buildStreetSegments(points: TrackingPoint[]): StreetSegment[] {
  const enriched = points.map((p) => ({ ...p }));
  for (let i = 0; i < enriched.length; i++) {
    if (!enriched[i].streetName && i > 0) {
      enriched[i].streetName = enriched[i - 1].streetName;
    }
  }

  const segments: StreetSegment[] = [];
  let groupStart = -1;
  let groupName: string | null = null;

  const closeGroup = (endIdx: number) => {
    if (groupStart < 0 || !groupName) return;
    const startPoint = enriched[groupStart];
    const endPoint = enriched[endIdx];
    const entry = new Date(startPoint.timestamp);
    const exit = new Date(endPoint.timestamp);
    segments.push({
      streetName: groupName,
      entryTime: entry.toISOString(),
      exitTime: exit.toISOString(),
      durationMinutes: Math.round((exit.getTime() - entry.getTime()) / 60000),
    });
  };

  for (let i = 0; i < enriched.length; i++) {
    const name = enriched[i].streetName;
    if (!name) {
      if (groupName) {
        closeGroup(i - 1);
        groupStart = -1;
        groupName = null;
      }
      continue;
    }

    if (name !== groupName) {
      if (groupName) closeGroup(i - 1);
      groupStart = i;
      groupName = name;
    }
  }

  if (groupName && groupStart >= 0) {
    closeGroup(enriched.length - 1);
  }

  return segments;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { jornadaId: string } }
) {
  try {
    await client.connect();
    const db = client.db(dbName);

    const jornada = await db.collection("jornadas").findOne({ jornadaId: params.jornadaId });
    const points = (await db
      .collection("tracking_points")
      .find({ jornadaId: params.jornadaId })
      .sort({ timestamp: 1 })
      .toArray()) as TrackingPoint[];

    let durationMinutes = 0;
    if (points.length >= 2) {
      const first = new Date(points[0].timestamp).getTime();
      const last = new Date(points[points.length - 1].timestamp).getTime();
      durationMinutes = Math.round((last - first) / 60000);
    }

    let distanceMeters = 0;
    for (let i = 1; i < points.length; i++) {
      distanceMeters += haversineDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }

    await enrichStreetNames(db, points);
    const streetSegments = buildStreetSegments(points);

    return NextResponse.json({
      jornada,
      points,
      durationMinutes,
      distanceMeters: Math.round(distanceMeters),
      streetSegments,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
