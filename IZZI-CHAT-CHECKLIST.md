# Checklist: Chat Izzi sin respuestas

Si el puente de WhatsApp está conectado pero **no recibes respuestas** del bot de Izzi, revisa lo siguiente en orden.

---

## 1. Variable del puente: `AGENTIA_WHATSAPP_CLIENT_ID=izzi`

El **Background Worker** (puente) que usa el número de Izzi **debe** enviar `clientId: "izzi"` al API. Si no, el API usa otra configuración y no aplica la base de conocimiento de Izzi.

- En **Render** → tu servicio **Background Worker** (puente Izzi) → **Environment**.
- Añade o edita: `AGENTIA_WHATSAPP_CLIENT_ID` = `izzi` (todo en minúsculas).
- Reinicia el Worker después de cambiar variables.

---

## 2. URL del API en el puente: `AGENTIA_CHATBOT_API_URL`

El puente debe llamar al **mismo** backend que tiene la base de conocimiento y Gemini.

- En el mismo Worker: `AGENTIA_CHATBOT_API_URL` = `https://agentia-chatbot-ventas.onrender.com` (o la URL de tu Web Service en Render, sin barra final).

---

## 3. Configuración de negocio "izzi" en MongoDB

El API devuelve **404** si no existe un documento con `clientId: "izzi"` en la colección **business_configs**. En ese caso el puente recibe error y no hay respuesta.

**Comprobar / crear:**

- En **MongoDB Atlas**: abre la base de datos que usa tu app y la colección `business_configs`.
- Busca un documento con `clientId: "izzi"`.
- **Si no existe:** en tu máquina, pon `MONGODB_URI` (y si usas, `MONGODB_DB`) en `.env` (el script de seed lee `.env`) y ejecuta:
  ```bash
  node scripts/seed-business-configs.js
  ```
  Eso crea/actualiza la config de `izzi`, `agentia` y `demo-inmobiliaria`.

**Diagnóstico rápido (si tienes MONGODB_URI en .env o .env.local):**

```bash
npm run check:izzi
```

El script te dice si falta la config de izzi o si el bot está pausado.

---

## 4. Bot no pausado para "izzi"

Si el bot está pausado globalmente para Izzi, el API responde 200 pero con **respuesta vacía** y el puente no envía mensaje.

- En **MongoDB**: colección **bot_settings**. Si hay un documento con `clientId: "izzi"` y `globalPaused: true`, el bot no responde.
- **Solución:** eliminar ese documento o poner `globalPaused: false`, o usar el dashboard/API de Agentia para “despausar” el bot para Izzi.

---

## 5. Logs del puente y del Web Service

- **Puente (Worker):** si el API devuelve 404, en los logs suele aparecer algo como `[Agentia] API error: 404` y el cuerpo del error (ej. "No existe config para clientId='izzi'").
- **Web Service:** en los logs de Render del **Web Service** (no del Worker) puedes ver si llegan requests a `/api/chat` y si hay excepciones (p. ej. Gemini, MongoDB).

---

## Resumen rápido

| Qué | Dónde | Valor / Acción |
|-----|--------|----------------|
| ClientId del bot | Render → Worker Izzi → Environment | `AGENTIA_WHATSAPP_CLIENT_ID=izzi` |
| URL del API | Mismo Worker → Environment | `AGENTIA_CHATBOT_API_URL=https://...onrender.com` |
| Config izzi en MongoDB | Atlas → `business_configs` | Debe existir doc con `clientId: "izzi"` → si no, `node scripts/seed-business-configs.js` |
| Bot pausado | Atlas → `bot_settings` | No debe haber `clientId: "izzi"` con `globalPaused: true` |

Después de cualquier cambio en variables de Render, **reinicia** el Worker (y si tocaste solo el backend, un deploy del Web Service).
