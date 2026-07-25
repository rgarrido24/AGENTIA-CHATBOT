import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { ANUARIO_COOKIE, anuarioAdminPassword } from '@/lib/anuario-k3/paths';
import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';
import crypto from 'crypto';

function assertAdmin() {
  const expected = anuarioAdminPassword();
  const cookieStore = cookies();
  return expected && cookieStore.get(ANUARIO_COOKIE)?.value === expected;
}

function slugify(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

export async function GET() {
  if (!assertAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  await connectDB();
  const alumnos = await Alumno.find().sort('nombreCorto').lean();
  return NextResponse.json({
    alumnos: alumnos.map((a) => ({
      ...mapAlumnoToMemoria(a),
      formularioEnviado: a.formularioEnviado,
      memoriaRaw: a.memoria || {},
    })),
  });
}

export async function POST(request) {
  if (!assertAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json();
  const nombreCorto = String(body.nombreCorto || '').trim();
  if (!nombreCorto) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  await connectDB();
  let base = slugify(nombreCorto) || `alumno-${Date.now()}`;
  let slug = base;
  let n = 2;
  while (await Alumno.findOne({ slug })) {
    slug = `${base}-${n++}`;
  }

  const token = crypto.randomBytes(16).toString('hex');
  const alumno = await Alumno.create({
    slug,
    token,
    nombreCorto,
    nombreCompleto: body.nombreCompleto || nombreCorto,
    memoria: {
      portadaUrl: '',
      perfilUrl: '',
      recuerdos: [],
      mensajes: [],
      published: false,
    },
  });

  return NextResponse.json({ alumno: mapAlumnoToMemoria(alumno.toObject()) });
}
