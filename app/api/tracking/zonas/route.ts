import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "agentia_chatbot_ventas";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const week = getCurrentWeekBounds();
    const desde = searchParams.get("desde") || week.desde;
    const hasta = searchParams.get("hasta") || week.hasta;

    const start = new Date(`${desde}T00:00:00.000`);
    const end = new Date(`${hasta}T23:59:59.999`);

    await client.connect();
    const db = client.db(dbName);

    const points = await db
      .collection("tracking_points")
      .find({
        timestamp: { $gte: start, $lte: end },
      })
      .sort({ timestamp: 1 })
      .toArray();

    const byJornada = new Map<
      string,
      Array<{ lat: number; lng: number; userName?: string }>
    >();

    for (const p of points) {
      const jornadaId = p.jornadaId as string;
      if (!jornadaId) continue;
      const list = byJornada.get(jornadaId) || [];
      list.push({
        lat: p.lat as number,
        lng: p.lng as number,
        userName: p.userName as string | undefined,
      });
      byJornada.set(jornadaId, list);
    }

    const jornadaIds = Array.from(byJornada.keys());
    const jornadasMeta = await db
      .collection("jornadas")
      .find(
        { jornadaId: { $in: jornadaIds } },
        { projection: { _id: 0, jornadaId: 1, userName: 1, plaza: 1 } }
      )
      .toArray();

    const metaById = new Map(
      jornadasMeta.map((j) => [j.jornadaId as string, j])
    );

    const jornadas = jornadaIds.map((jornadaId) => {
      const pts = byJornada.get(jornadaId)!;
      const meta = metaById.get(jornadaId);
      return {
        jornadaId,
        userName: (meta?.userName as string) || pts[0]?.userName || "Desconocido",
        plaza: (meta?.plaza as string) || "",
        points: pts.map(({ lat, lng }) => ({ lat, lng })),
      };
    });

    return NextResponse.json({ jornadas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
