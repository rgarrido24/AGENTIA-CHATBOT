/**
 * Seed alumnos anuario K3. Uso: node scripts/seed-anuario-k3-alumnos.js
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

const AlumnoSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    token: { type: String, required: true, unique: true },
    nombreCorto: { type: String, required: true },
    nombreCompleto: { type: String, default: '' },
    nombreTutor: { type: String, default: '' },
    suenioDeGrande: { type: String, default: '' },
    comidaFavorita: { type: String, default: '' },
    colorFavorito: { type: String, default: '' },
    mejorAmigo: { type: String, default: '' },
    fraseFavorita: { type: String, default: '' },
    loQueMasLeGusto: { type: String, default: '' },
    dedicatoriaMama: { type: String, default: '' },
    dedicatoriaPapa: { type: String, default: '' },
    fotos: [{ url: String, publicId: String, caption: String }],
    formularioEnviado: { type: Boolean, default: false },
    fechaEnvio: { type: Date },
  },
  { timestamps: true }
);

const Alumno = mongoose.models.AnuarioAlumno || mongoose.model('AnuarioAlumno', AlumnoSchema, 'alumnos');

const alumnos = [
  { nombreCorto: 'Elías', slug: 'elias' },
  { nombreCorto: 'Fernanda', slug: 'fernanda' },
  { nombreCorto: 'Ana Pau', slug: 'ana-pau' },
  { nombreCorto: 'Gabito', slug: 'gabito' },
  { nombreCorto: 'Naty', slug: 'naty' },
  { nombreCorto: 'Fabio', slug: 'fabio' },
  { nombreCorto: 'Matthías', slug: 'matthias' },
  { nombreCorto: 'Luciana', slug: 'luciana' },
  { nombreCorto: 'Amaia', slug: 'amaia' },
  { nombreCorto: 'Cami', slug: 'cami' },
  { nombreCorto: 'Lia', slug: 'lia' },
  { nombreCorto: 'Kesleigh', slug: 'kesleigh' },
  { nombreCorto: 'Sara', slug: 'sara' },
  { nombreCorto: 'Romina', slug: 'romina' },
];

async function seed() {
  const uri = process.env.ANUARIO_K3_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta ANUARIO_K3_MONGODB_URI o MONGODB_URI');

  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');

  for (const a of alumnos) {
    const exists = await Alumno.findOne({ slug: a.slug });
    if (exists) {
      console.log(`⏭  ${a.nombreCorto} ya existe — token: ${exists.token}`);
      continue;
    }
    const alumno = await Alumno.create({ ...a, token: uuidv4() });
    console.log(`✅ ${alumno.nombreCorto} — token: ${alumno.token}`);
  }

  console.log('\n📋 LINKS PARA PAPÁS:\n');
  const todos = await Alumno.find().sort('nombreCorto');
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://agentia.software').replace(/\/$/, '');
  todos.forEach((a) => {
    console.log(`${a.nombreCorto}: ${base}/anuariok3asbaje/formulario/${a.token}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Listo!');
}

seed().catch(console.error);
