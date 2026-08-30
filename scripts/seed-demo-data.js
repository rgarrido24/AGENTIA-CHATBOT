/**
 * Carga 8 clientes ficticios en cada demo (café, barbería, abarrotes) para que
 * el semáforo de inactividad se vea completo desde el primer momento.
 *
 * Reparto de última visita: 3 en verde (1-5 días), 3 en amarillo (8-14 días)
 * y 2 en rojo (más de 20 días), calculado contra la fecha de hoy.
 *
 *   node scripts/seed-demo-data.js            # las 3 demos
 *   node scripts/seed-demo-data.js cafe       # solo una
 *   node scripts/seed-demo-data.js --limpiar  # borra solo lo sembrado
 *
 * Escribe directo en Mongo (no necesita que el servidor esté corriendo) y no
 * sincroniza Google Wallet: son datos de vitrina.
 */
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv('.env.local');
loadEnv('.env');

const SEED_FLAG = 'seedDemo';

const DEMOS = {
  cafe: { nombre: 'Café Luna', collection: 'demo_cafe_clientes', ticket: [80, 260] },
  barberia: { nombre: 'Barbería El Patrón', collection: 'demo_barberia_clientes', ticket: [180, 650] },
  abarrotes: {
    nombre: 'Abarrotes La Providencia',
    collection: 'demo_abarrotes_clientes',
    ticket: [120, 900],
  },
};

/** Nombres mexicanos genéricos: 8 distintos por negocio. */
const NOMBRES = {
  cafe: [
    'María Fernanda López',
    'Carlos Alberto Ramírez',
    'Ana Sofía Hernández',
    'Luis Ángel Torres',
    'Gabriela Martínez',
    'Ricardo Domínguez',
    'Paulina Vázquez',
    'Héctor Iván Cruz',
  ],
  barberia: [
    'Jorge Alejandro Ruiz',
    'Diego Armando Flores',
    'Miguel Ángel Sánchez',
    'Fernando Gutiérrez',
    'Óscar Eduardo Reyes',
    'Alan Ricardo Mendoza',
    'Sergio Alonso Castro',
    'Emiliano Ríos',
  ],
  abarrotes: [
    'Guadalupe Jiménez',
    'Rosa María Aguilar',
    'Juan Pablo Morales',
    'Verónica Estrada',
    'Martha Patricia Núñez',
    'Alfredo Salazar',
    'Claudia Ivette Ponce',
    'Ernesto Villalobos',
  ],
};

/** 3 verdes (1-5 días), 3 amarillos (8-14), 2 rojos (>20). */
const DIAS_SIN_VISITA = [2, 4, 5, 9, 11, 14, 23, 31];

const FECHAS_NACIMIENTO = [
  '1988-04-17',
  '1995-09-03',
  '1979-12-28',
  '1992-06-11',
  '1985-01-22',
  '2000-03-08',
  '1974-11-15',
  '1998-07-30',
];

function isoHaceDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(13, 30, 0, 0);
  return d.toISOString();
}

function isoFechaNacimiento(yyyymmdd) {
  return new Date(`${yyyymmdd}T12:00:00.000Z`).toISOString();
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/** Teléfonos ficticios y estables de 10 dígitos: 55 + prefijo + consecutivo. */
function telefonoFicticio(prefijo, i) {
  const tel = `55${prefijo}${String(i + 1).padStart(6, '0')}`;
  if (tel.length !== 10) throw new Error(`Teléfono ficticio inválido: ${tel}`);
  return tel;
}

const PREFIJO = { cafe: '31', barberia: '32', abarrotes: '33' };

function clientesDe(key) {
  const cfg = DEMOS[key];
  const [min, max] = cfg.ticket;

  return NOMBRES[key].map((nombre, i) => {
    // Ticket y número de visitas deterministas: capturas reproducibles.
    const monto = Math.round(min + ((max - min) * i) / (NOMBRES[key].length - 1));
    const visitas = 3 + (i % 4);
    const diasInactivo = DIAS_SIN_VISITA[i];
    const ultimaVisita = isoHaceDias(diasInactivo);
    const ahora = new Date().toISOString();

    // Historial hacia atrás: la última visita primero, como lo espera la UI.
    const historial = [];
    let puntos = 0;
    for (let v = 0; v < visitas; v += 1) {
      const montoVisita = Math.round(monto * (1 - v * 0.12));
      const ganados = round1(montoVisita / 100);
      historial.push({
        fecha: isoHaceDias(diasInactivo + v * 21),
        monto: montoVisita,
        puntosGanados: ganados,
        tipo: 'compra',
      });
      puntos = round1(puntos + ganados);
    }

    return {
      telefono: telefonoFicticio(PREFIJO[key], i),
      nombre,
      nombreCompleto: nombre,
      fechaNacimiento: isoFechaNacimiento(FECHAS_NACIMIENTO[i]),
      ultimaVisita,
      puntos,
      historial,
      [SEED_FLAG]: true,
      created_at: ahora,
      updated_at: ahora,
    };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const limpiar = args.includes('--limpiar');
  const pedidos = args.filter((a) => a in DEMOS);
  const keys = pedidos.length > 0 ? pedidos : Object.keys(DEMOS);

  const uri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB || '').trim();
  if (!uri || !dbName) throw new Error('Faltan MONGODB_URI / MONGODB_DB');

  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log('db:', dbName);
  console.log('demos:', keys.join(', '));

  const resumen = [];
  try {
    for (const key of keys) {
      const cfg = DEMOS[key];
      const coll = db.collection(cfg.collection);

      if (limpiar) {
        const del = await coll.deleteMany({ [SEED_FLAG]: true });
        console.log(`\n${cfg.nombre}: eliminados ${del.deletedCount ?? 0} de ${cfg.collection}`);
        resumen.push({ demo: key, eliminados: del.deletedCount ?? 0 });
        continue;
      }

      await coll.createIndex({ telefono: 1 }, { unique: true }).catch(() => {});

      let insertados = 0;
      let actualizados = 0;
      for (const doc of clientesDe(key)) {
        const res = await coll.updateOne(
          { telefono: doc.telefono },
          { $set: doc },
          { upsert: true },
        );
        if (res.upsertedCount > 0) insertados += 1;
        else actualizados += 1;
      }

      const verde = await coll.countDocuments({
        [SEED_FLAG]: true,
        ultimaVisita: { $gte: isoHaceDias(7) },
      });
      // Mismos cortes que el semáforo de la UI: verde ≤7, amarillo 8-15, rojo >15.
      const rojo = await coll.countDocuments({
        [SEED_FLAG]: true,
        ultimaVisita: { $lt: isoHaceDias(15) },
      });

      console.log(`\n${cfg.nombre} (${cfg.collection})`);
      console.log(`  insertados: ${insertados} · actualizados: ${actualizados}`);
      console.log(`  semáforo → verde: ${verde} · rojo: ${rojo} · amarillo: ${8 - verde - rojo}`);
      resumen.push({ demo: key, insertados, actualizados, verde, rojo });
    }
  } finally {
    await client.close();
  }

  console.log('\n========== RESUMEN ==========');
  console.log(JSON.stringify(resumen, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
