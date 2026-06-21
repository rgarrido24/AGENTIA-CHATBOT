import { NextResponse } from 'next/server';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { token, fotos, ...datos } = body;

    const alumno = await Alumno.findOne({ token });
    if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });

    Object.assign(alumno, {
      ...datos,
      fotos: fotos || [],
      formularioEnviado: true,
      fechaEnvio: new Date(),
    });
    await alumno.save();

    try {
      await enviarEmail(alumno);
    } catch (e) {
      console.error('Email error:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function enviarEmail(alumno) {
  const from = process.env.ANUARIO_K3_EMAIL_FROM || process.env.EMAIL_FROM;
  const pass = process.env.ANUARIO_K3_EMAIL_PASS || process.env.EMAIL_PASS;
  const to = process.env.ANUARIO_K3_EMAIL_TO || process.env.EMAIL_TO;
  if (!from || !pass || !to) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: from, pass },
  });

  const fotosHtml = (alumno.fotos || [])
    .map(
      (f, i) =>
        `<img src="${f.url}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:4px;" />`
    )
    .join('');

  await transporter.sendMail({
    from: `"Anuario K3 Asbaje" <${from}>`,
    to,
    subject: `🎓 Formulario recibido: ${alumno.nombreCompleto || alumno.nombreCorto}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1B4F8A,#7C4DFF);padding:2rem;border-radius:12px 12px 0 0;text-align:center;color:white;">
          <h1 style="margin:0;">🎓 Nuevo formulario recibido</h1>
          <p style="opacity:0.9;">Anuario K3 — Colegio Asbaje 2024-2025</p>
        </div>
        <div style="background:white;padding:2rem;border:1px solid #eee;border-radius:0 0 12px 12px;">
          <h2 style="color:#1B4F8A;">👶 ${alumno.nombreCorto} — ${alumno.nombreCompleto}</h2>
          <p><strong>Tutor:</strong> ${alumno.nombreTutor}</p><hr/>
          <p>🚒 <strong>Sueño:</strong> ${alumno.suenioDeGrande}</p>
          <p>🍕 <strong>Comida:</strong> ${alumno.comidaFavorita}</p>
          <p>🎨 <strong>Color:</strong> ${alumno.colorFavorito}</p>
          <p>👫 <strong>Mejor amigo:</strong> ${alumno.mejorAmigo}</p>
          <p>💬 <strong>Frase:</strong> ${alumno.fraseFavorita || '—'}</p>
          <p>⭐ <strong>Le gustó:</strong> ${alumno.loQueMasLeGusto}</p>
          <hr/>
          ${alumno.dedicatoriaMama ? `<p>💜 <strong>Mamá:</strong> ${alumno.dedicatoriaMama}</p>` : ''}
          ${alumno.dedicatoriaPapa ? `<p>💙 <strong>Papá:</strong> ${alumno.dedicatoriaPapa}</p>` : ''}
          <hr/>
          <p><strong>📸 Fotos (${alumno.fotos.length}):</strong></p>
          <div>${fotosHtml}</div>
        </div>
      </div>
    `,
  });
}
