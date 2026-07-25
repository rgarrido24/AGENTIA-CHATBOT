import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { ANUARIO_COOKIE, anuarioAdminPassword } from '@/lib/anuario-k3/paths';
import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';

function assertAdmin() {
  const expected = anuarioAdminPassword();
  const cookieStore = cookies();
  return expected && cookieStore.get(ANUARIO_COOKIE)?.value === expected;
}

export async function GET(_req, { params }) {
  if (!assertAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  await connectDB();
  const alumno = await Alumno.findOne({ slug: params.slug }).lean();
  if (!alumno) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({
    alumno: {
      ...mapAlumnoToMemoria(alumno),
      memoriaRaw: alumno.memoria || {},
      factsRaw: {
        colorFavorito: alumno.colorFavorito,
        suenioDeGrande: alumno.suenioDeGrande,
        comidaFavorita: alumno.comidaFavorita,
        mejorAmigo: alumno.mejorAmigo,
        fraseFavorita: alumno.fraseFavorita,
        loQueMasLeGusto: alumno.loQueMasLeGusto,
        dedicatoriaMama: alumno.dedicatoriaMama,
        dedicatoriaPapa: alumno.dedicatoriaPapa,
      },
    },
  });
}

export async function PATCH(request, { params }) {
  if (!assertAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  await connectDB();
  const alumno = await Alumno.findOne({ slug: params.slug });
  if (!alumno) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (typeof body.nombreCorto === 'string') alumno.nombreCorto = body.nombreCorto.trim();
  if (typeof body.nombreCompleto === 'string') alumno.nombreCompleto = body.nombreCompleto.trim();

  const facts = body.facts || {};
  if (typeof facts.color === 'string') alumno.colorFavorito = facts.color;
  if (typeof facts.sueno === 'string') alumno.suenioDeGrande = facts.sueno;
  if (typeof facts.comida === 'string') alumno.comidaFavorita = facts.comida;
  if (typeof facts.amigos === 'string') alumno.mejorAmigo = facts.amigos;
  if (typeof facts.frase === 'string') alumno.fraseFavorita = facts.frase;
  if (typeof facts.gusto === 'string') alumno.loQueMasLeGusto = facts.gusto;

  if (!alumno.memoria) alumno.memoria = {};
  const mem = body.memoria || {};
  if (typeof mem.portadaUrl === 'string') alumno.memoria.portadaUrl = mem.portadaUrl;
  if (typeof mem.perfilUrl === 'string') alumno.memoria.perfilUrl = mem.perfilUrl;
  if (Array.isArray(mem.recuerdos)) alumno.memoria.recuerdos = mem.recuerdos;
  if (Array.isArray(mem.mensajes)) alumno.memoria.mensajes = mem.mensajes;
  if (typeof mem.published === 'boolean') alumno.memoria.published = mem.published;

  alumno.markModified('memoria');
  await alumno.save();

  return NextResponse.json({ alumno: mapAlumnoToMemoria(alumno.toObject()) });
}
