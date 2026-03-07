# Despliegue de Agentia Lite (demo + admin)

## Variables de entorno

La aplicación usa **process.env** en producción: `GEMINI_API_KEY`, `ADMIN_PASSWORD`, `MONGODB_URI`, `PORT`. No usa `server.js`; es Next.js y arranca con `npm start` → `next start -p ${PORT:-3010}`.

Configura estas variables **antes** de desplegar (o en el panel de tu hosting):

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `GEMINI_API_KEY` | **Sí** (para el chat) | API Key de Google AI Studio (Gemini). Sin ella el chat muestra "Servicio no configurado". |
| `ADMIN_PASSWORD` | **Sí** (para /admin) | Contraseña para acceder a `/admin` y `/login`. |
| `GEMINI_MODEL` | No | Modelo Gemini (por defecto `gemini-2.5-flash`). |
| `PORT` | No | En Render/Vercel suele asignarse solo. Local: por defecto 3010. |

## Local

1. Copia `.env.local.example` a `.env.local`.
2. Edita `.env.local` y asigna `GEMINI_API_KEY` y `ADMIN_PASSWORD`.
3. Instala y arranca:
   ```bash
   npm install
   npm run dev
   ```
4. Abre `http://localhost:3010/demo/barber` para la demo.

Si ves **"Error de conexión"** o el banner amarillo de configuración:
- Comprueba que `GEMINI_API_KEY` está en `.env.local` y que **reiniciaste el servidor** después de añadirla.
- Comprueba que el servidor está en marcha (`npm run dev`).

## Render

**Importante:** En Render **no existe un archivo `.env`** en el servidor. Las variables se configuran solo en el panel:

1. Crea un **Web Service** y conecta tu repo.
2. Build command: `npm run build`
3. Start command: `npm start` (o usa el Procfile: `web: npm start`)
4. Ve a **Environment** (menú izquierdo del servicio) y añade las variables con **"Add Environment Variable"**:
   - **Key:** `GEMINI_API_KEY` → **Value:** tu API key de Google AI Studio
   - **Key:** `ADMIN_PASSWORD` → **Value:** la contraseña con la que quieres entrar a "Acceso Clientes" y al panel
5. **Redeploy:** Después de añadir o cambiar cualquier variable, haz **"Manual Deploy" → "Deploy latest commit"** (o un nuevo deploy). Si no redepliegas, la app sigue con las variables antiguas.

La demo quedará en `https://tu-app.onrender.com/demo/barber`. El enlace "Acceso Clientes" llevará a `/login` y solo con `ADMIN_PASSWORD` correcta podrás entrar.

### WhatsApp Bridge (Izzi / mensajes al Pipeline)

El **Bridge de WhatsApp** (`scripts/whatsapp-bridge.js`) es un **proceso independiente**: no se inicia con el servidor Next.js. Conecta un número por QR y reenvía los mensajes a `POST /api/chat`; la app crea/actualiza leads en MongoDB y responde con la IA.

- **Local:** En una segunda terminal ejecuta `npm run whatsapp`. Lee variables de `.env.local` y `.env`. La URL del API por defecto es `http://localhost:3010`.
- **Render:** Para que los mensajes de Izzi entren al Pipeline en producción:
  1. Crea un **segundo servicio** en Render: **Background Worker** (no Web Service).
  2. Mismo repo y branch que la app.
  3. **Build command:** `npm install` (o `npm run build` si quieres comprobar que compila).
  4. **Start command:** `npm run whatsapp`
  5. **Environment:** Añade al menos:
     - `AGENTIA_CHATBOT_API_URL` = URL de tu Web Service (ej. `https://agentia-chatbot-ventas.onrender.com`)
     - Si las rutas `/api/chat/outbound`, `/api/reminders/pending` o `/api/alerts/pending` exigen `CRON_SECRET`, añade también `CRON_SECRET` con el mismo valor que en la app.
  6. Despliega el Worker. La primera vez mostrará un QR en los logs; escanéalo con WhatsApp. La sesión se guarda y en los siguientes deploys suele reconectar sin QR (salvo que borres datos del servicio).

Si el bridge se detuvo o dejó de recibir mensajes, revisa los **Logs** del Background Worker en Render y comprueba que `AGENTIA_CHATBOT_API_URL` apunte a la app desplegada y que la app tenga `MONGODB_URI` y `GEMINI_API_KEY` configurados.

## Otros hostings (Vercel, Railway, etc.)

- Añade las mismas variables de entorno en el panel.
- Build: `npm run build`, Start: `npm start` (o el comando que use la plataforma para Next.js).

## Chatbot Izzi / WhatsApp

Si tienes **otro** chatbot (por ejemplo Izzi con WhatsApp) que también usa Gemini y está "parado":

- Suele ser la misma causa: **API key** no configurada, caducada o bloqueada.
- Comprueba en ese proyecto:
  1. Variable `GEMINI_API_KEY` (o la que use) en el entorno donde corre.
  2. Que la API key siga activa en [Google AI Studio](https://aistudio.google.com/apikey).
  3. Límites de uso o cuota de la API.
- Si el backend corre en otro servidor, verifica que ese servidor tenga red salida a Internet y que la key esté definida allí.

---

## Cuando "deja de funcionar de la nada" (demo local + Izzi en Render)

Si **los dos** (demo en local e Izzi en Render) dejan de responder a la vez, suele ser algo común: **Gemini** o la **misma API key**.

### 1. Diagnóstico rápido

Con el servidor en marcha, abre en el navegador:

- **Demo local:** `http://localhost:3010/api/health/gemini`
- **Izzi en Render:** `https://tu-app-izzi.onrender.com/api/health/gemini` (usa la URL real de tu servicio)

Ahí verás el error real de Gemini (cuota, key inválida, etc.) y un `hint` con qué hacer.

### 2. Causas típicas

| Causa | Qué hacer |
|-------|-----------|
| **429 / RESOURCE_EXHAUSTED** | Límite de la API. Revisa cuota en [Google AI Studio](https://aistudio.google.com/). Si usas la **misma** key para demo e Izzi, entre los dos pueden agotar el cupo. |
| **403 / API key invalid** | Genera una **nueva** key en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) y actualízala en .env.local y en Render → Environment. Reinicia/redeploy. |
| **Misma key para dos apps** | Mejor: una key para la demo y otra para Izzi, o vigila no pasarte del límite entre ambas. |

### 3. En Render (Izzi)

- **Logs** del servicio: busca errores al enviar un mensaje.
- **Environment**: que `GEMINI_API_KEY` esté bien escrita, sin espacios. Después de cambiar, **Redeploy**.

---

## Despliegue final en Render

- **Variables:** Define en Render → Environment: `GEMINI_API_KEY`, `ADMIN_PASSWORD` y, si usas prospección, `MONGODB_URI`. El puerto lo asigna Render (`PORT`); el script `start` usa `next start -p ${PORT:-3010}`.
- **Sin server.js:** La app es Next.js; el inicio es `npm start` (Procfile: `web: npm start`).
- **Seguridad:** Las 3 capas de seguridad y la lógica de conflicto están en `app/api/chat-demo/route.ts` (system instructions + interceptación de la primera hora). Activas en producción.
- **Ticket:** Datos en MAYÚSCULAS; enlace de Maps por defecto a ubicación real en Mérida (Plaza Altabrisa). Configurable en Admin.
