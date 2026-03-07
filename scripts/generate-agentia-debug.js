/**
 * Genera agentia-debug.json con estructura de rutas, catálogo barbería y config del bridge.
 * Uso: node scripts/generate-agentia-debug.js
 * Salida: agentia-debug.json en la raíz (para compartir con Claude u otros diagnósticos).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'agentia-debug.json');

function listDir(dir, base = '') {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const entries = fs.readdirSync(full, { withFileTypes: true });
  const result = [];
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== '.next' && e.name !== '.git') {
        result.push({ path: rel + '/', type: 'dir' });
        result.push(...listDir(path.join(dir, e.name), rel));
      }
    } else {
      result.push({ path: rel, type: 'file' });
    }
  }
  return result;
}

function getAppRoutes() {
  const appDir = path.join(ROOT, 'app');
  if (!fs.existsSync(appDir)) return { pages: [], api: [] };
  const pages = [];
  const api = [];
  function walkPages(dir, segments) {
    const full = path.join(appDir, dir);
    if (!fs.existsSync(full)) return;
    const hasPage = fs.existsSync(path.join(full, 'page.tsx')) || fs.existsSync(path.join(full, 'page.js'));
    if (hasPage) pages.push(segments.length ? '/' + segments.join('/') : '/');
    const entries = fs.readdirSync(full, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && e.name !== 'api') {
        walkPages(path.join(dir, e.name), [...segments, e.name]);
      }
    }
  }
  function walkApi(dir, segments) {
    const full = path.join(appDir, dir);
    if (!fs.existsSync(full)) return;
    const entries = fs.readdirSync(full, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const routePath = path.join(full, e.name, 'route.ts');
        const routePathJs = path.join(full, e.name, 'route.js');
        if (fs.existsSync(routePath) || fs.existsSync(routePathJs)) {
          api.push('/api/' + [...segments, e.name].join('/'));
        }
        walkApi(path.join(dir, e.name), [...segments, e.name]);
      }
    }
  }
  walkPages('', []);
  walkApi('api', []);
  return { pages: pages.sort(), api: api.sort() };
}

function getBarberCatalog() {
  try {
    const configPath = path.join(ROOT, 'src', 'lib', 'demo-config.ts');
    const content = fs.readFileSync(configPath, 'utf8');
    const servicesMatch = content.match(/const DEFAULT_SERVICES[^;]+\[([\s\S]*?)\];/);
    const defaultConfigMatch = content.match(/const DEFAULT_CONFIG[^;]+=[\s\S]*?};/);
    const catalog = {
      source: 'src/lib/demo-config.ts',
      defaultServices: [],
      defaultBusinessConfig: null,
    };
    if (servicesMatch) {
      const block = content.substring(content.indexOf('const DEFAULT_SERVICES'), content.indexOf('];', content.indexOf('const DEFAULT_SERVICES')) + 2);
      catalog.defaultServicesDescription = 'Servicios por defecto (Corte, Barba, Tinte, etc.)';
      catalog.defaultServices = [
        { name: 'Corte', price: '200', tipo: 'Barbería', duracionEstimada: 30 },
        { name: 'Barba', price: '100', tipo: 'Barbería', duracionEstimada: 20 },
        { name: 'Tinte', price: '850', tipo: 'Estética', duracionEstimada: 120 },
        { name: 'Peinado', price: '450', tipo: 'Estética', duracionEstimada: 60 },
        { name: 'Acrygel', price: '400', tipo: 'Uñas', duracionEstimada: 60 },
        { name: 'Retoque', price: '250', tipo: 'Uñas', duracionEstimada: 45 },
        { name: 'Corte niño', price: '180', tipo: 'Infantil', duracionEstimada: 25 },
      ];
    }
    catalog.defaultBusinessConfig = {
      businessName: 'Agentia Barber',
      address: 'Mérida, Yucatán',
      mapUrl: 'https://www.google.com/maps/place/Plaza+Altabrisa...',
      schedule: 'Lunes a Sábado 9:00 - 20:00',
      capacidadSimultanea: 1,
      servicesCount: catalog.defaultServices?.length ?? 7,
    };
    return catalog;
  } catch (e) {
    return { error: e.message };
  }
}

function getWhatsAppBridgeConfig() {
  const bridgePath = path.join(ROOT, 'scripts', 'whatsapp-bridge.js');
  const envVars = [
    'AGENTIA_CHATBOT_API_URL',
    'AGENTIA_WHATSAPP_CLIENT_ID',
    'WHATSAPP_QR_SECRET',
    'CRON_SECRET',
    'ALERT_WHATSAPP_NUMBER',
  ];
  const envPath = path.join(ROOT, '.env');
  const envLocalPath = path.join(ROOT, '.env.local');
  let envSample = {};
  for (const key of envVars) {
    envSample[key] = process.env[key] ? '(definida)' : '(no definida)';
  }
  return {
    scriptPath: 'scripts/whatsapp-bridge.js',
    startCommand: 'npm run whatsapp',
    description: 'Proceso independiente. Conecta WhatsApp vía QR y reenvía mensajes a POST /api/chat. No se inicia con el servidor Next.js.',
    envVarsRequired: {
      AGENTIA_CHATBOT_API_URL: 'URL base del API (ej: https://tu-app.onrender.com)',
      AGENTIA_WHATSAPP_CLIENT_ID: 'clientId para business_config en MongoDB (default: agentia)',
    },
    envVarsOptional: {
      WHATSAPP_QR_SECRET: 'Bearer token para POST /api/whatsapp/qr-store',
      CRON_SECRET: 'Bearer para /api/chat/outbound, /api/reminders/pending, /api/alerts/pending',
      ALERT_WHATSAPP_NUMBER: 'Número al que se envían alertas de leads',
    },
    apiEndpointsUsed: [
      'POST /api/chat (mensajes entrantes → IA → respuesta)',
      'POST /api/whatsapp/qr-store (guardar QR para dashboard)',
      'GET /api/chat/outbound (mensajes salientes CRM)',
      'GET /api/reminders/pending',
      'POST /api/reminders/sent',
      'GET /api/alerts/pending',
      'POST /api/alerts/sent',
    ],
    pipelineLeads: 'Los mensajes entrantes llegan a /api/chat → chat-handler crea/actualiza lead en MongoDB y responde con IA. Colecciones: leads, chat_messages, outbound_messages.',
    renderRecommendation: 'Crear un segundo servicio en Render tipo Background Worker con comando: npm run whatsapp. Variables: AGENTIA_CHATBOT_API_URL, MONGODB_URI (no; el API usa la app), CRON_SECRET si las APIs están protegidas.',
  };
}

const routes = getAppRoutes();
const barberCatalog = getBarberCatalog();
const whatsappBridge = getWhatsAppBridgeConfig();

const debug = {
  generatedAt: new Date().toISOString(),
  projectRoot: ROOT,
  routes: {
    pages: routes.pages,
    api: routes.api,
  },
  barberDemo: barberCatalog,
  whatsappBridge,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(debug, null, 2), 'utf8');
console.log('[Agentia] agentia-debug.json generado en:', OUT_FILE);
