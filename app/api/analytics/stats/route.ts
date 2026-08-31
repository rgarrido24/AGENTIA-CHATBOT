import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { LANDING_PAGES, landingPageFilter } from '@/lib/landing-pages';

function startOf(range: string): Date {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'yesterday') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (range === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // default: 7d
  const d = new Date(now);
  d.setDate(d.getDate() - 7);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const range = req.nextUrl.searchParams.get('range') ?? '7d';
    const db = await getMongoDb();
    const col = db.collection('analytics_events');

    const fromToday = startOf('today');
    const fromYest  = startOf('yesterday');
    const endYest   = new Date(fromToday);
    const fromRange = startOf(range);

    // ── Today vs yesterday pageviews ──────────────────────────────────────────
    const [todayCount, yesterdayCount] = await Promise.all([
      col.countDocuments({ event: 'pageview', createdAt: { $gte: fromToday } }),
      col.countDocuments({ event: 'pageview', createdAt: { $gte: fromYest, $lt: endYest } }),
    ]);

    // ── Demos popularity (pageviews per demo in range) ────────────────────────
    const demosAgg = await col.aggregate([
      { $match: { event: 'pageview', demo: { $ne: null }, createdAt: { $gte: fromRange } } },
      { $group: { _id: '$demo', visitas: { $sum: 1 } } },
      { $sort: { visitas: -1 } },
    ]).toArray();

    // ── Avg time per demo ─────────────────────────────────────────────────────
    const avgTimeAgg = await col.aggregate([
      { $match: { event: 'time_spent', demo: { $ne: null }, createdAt: { $gte: fromRange } } },
      { $group: { _id: '$demo', avgSegundos: { $avg: '$seconds' } } },
    ]).toArray();
    const avgTimeMap: Record<string, number> = {};
    for (const row of avgTimeAgg) avgTimeMap[row._id as string] = Math.round(row.avgSegundos ?? 0);

    const demos = demosAgg.map((row) => ({
      demo: row._id as string,
      visitas: row.visitas as number,
      avgSegundos: avgTimeMap[row._id as string] ?? 0,
    }));

    // ── Countries ─────────────────────────────────────────────────────────────
    const paisAgg = await col.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: fromRange } } },
      { $group: { _id: '$pais', visitas: { $sum: 1 } } },
      { $sort: { visitas: -1 } },
      { $limit: 20 },
    ]).toArray();
    const totalPais = paisAgg.reduce((s, r) => s + (r.visitas as number), 0);
    const paises = paisAgg.map((r) => ({
      pais: r._id as string ?? 'Desconocido',
      visitas: r.visitas as number,
      pct: totalPais > 0 ? Math.round(((r.visitas as number) / totalPais) * 100) : 0,
    }));

    // ── Traffic sources ───────────────────────────────────────────────────────
    const referrerAgg = await col.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: fromRange } } },
      {
        $project: {
          fuente: {
            $cond: [
              // Prioriza ?ref= si existe, si no cae a referrer, si no Directo
              { $and: [{ $ne: ['$ref', null] }, { $ne: ['$ref', ''] }] },
              '$ref',
              {
                $cond: [
                  { $or: [{ $eq: ['$referrer', null] }, { $eq: ['$referrer', ''] }] },
                  'Directo',
                  {
                    $switch: {
                      branches: [
                        { case: { $regexMatch: { input: '$referrer', regex: 'whatsapp', options: 'i' } }, then: 'WhatsApp' },
                        { case: { $regexMatch: { input: '$referrer', regex: 'instagram', options: 'i' } }, then: 'Instagram' },
                        { case: { $regexMatch: { input: '$referrer', regex: 'facebook', options: 'i' } }, then: 'Facebook' },
                        { case: { $regexMatch: { input: '$referrer', regex: 'google', options: 'i' } }, then: 'Google' },
                        { case: { $regexMatch: { input: '$referrer', regex: 'linkedin', options: 'i' } }, then: 'LinkedIn' },
                      ],
                      default: 'Otro',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: '$fuente', visitas: { $sum: 1 } } },
      { $sort: { visitas: -1 } },
    ]).toArray();
    const fuentes = referrerAgg.map((r) => ({ fuente: r._id as string, visitas: r.visitas as number }));

    // ── Devices ───────────────────────────────────────────────────────────────
    const deviceAgg = await col.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: fromRange } } },
      { $group: { _id: '$dispositivo', visitas: { $sum: 1 } } },
      { $sort: { visitas: -1 } },
    ]).toArray();
    const dispositivos = deviceAgg.map((r) => ({ dispositivo: r._id as string ?? 'desktop', visitas: r.visitas as number }));

    // ── Recent events ─────────────────────────────────────────────────────────
    const recientes = await col
      .find({ event: 'pageview' })
      .sort({ createdAt: -1 })
      .limit(50)
      .project({ _id: 0, page: 1, demo: 1, pais: 1, ciudad: 1, dispositivo: 1, navegador: 1, createdAt: 1 })
      .toArray();

    // ── Top demo today ────────────────────────────────────────────────────────
    const topDemoAgg = await col.aggregate([
      { $match: { event: 'pageview', demo: { $ne: null }, createdAt: { $gte: fromToday } } },
      { $group: { _id: '$demo', c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $limit: 1 },
    ]).toArray();
    const topDemo = topDemoAgg[0]?._id ?? null;

    // ── Top country today ─────────────────────────────────────────────────────
    const topPaisAgg = await col.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: fromToday } } },
      { $group: { _id: '$pais', c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $limit: 1 },
    ]).toArray();
    const topPais = topPaisAgg[0]?._id ?? null;

    // ── Landings (por página / slug de marketing) ───────────────────────────
    const landings = await Promise.all(
      LANDING_PAGES.map(async (landing) => {
        const base = { event: 'pageview', ...landingPageFilter(landing) };
        const clickFilter = { event: 'cta_click', ...landingPageFilter(landing) };
        const [total, enPeriodo, hoy, visitantesUnicos, clicks] = await Promise.all([
          col.countDocuments(base),
          col.countDocuments({ ...base, createdAt: { $gte: fromRange } }),
          col.countDocuments({ ...base, createdAt: { $gte: fromToday } }),
          col.distinct('visitorId', { ...base, visitorId: { $ne: null } }).then((ids) => ids.length),
          col.countDocuments({ ...clickFilter, createdAt: { $gte: fromRange } }),
        ]);
        const ultima = await col
          .findOne(base, { sort: { createdAt: -1 }, projection: { createdAt: 1 } });
        return {
          slug: landing.slug,
          label: landing.label,
          path: landing.path,
          total,
          enPeriodo,
          hoy,
          visitantesUnicos,
          clicks,
          ultimaVisita: ultima?.createdAt ?? null,
        };
      }),
    );

    return NextResponse.json({
      hoy: { visitas: todayCount, topDemo, topPais },
      ayer: { visitas: yesterdayCount },
      landings,
      demos,
      paises,
      fuentes,
      dispositivos,
      recientes,
    });
  } catch (err) {
    console.error('[analytics/stats]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
