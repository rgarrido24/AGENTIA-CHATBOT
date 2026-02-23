# Agentia - Módulos Planificados

## ✅ Implementado

### 1. Base Next.js + Tailwind + Dark Theme
- Next.js 14 con App Router
- Tailwind CSS con tema oscuro (`--background`, `--primary`, etc.)
- Variables CSS para Marca Blanca (cambiar colores en `app/globals.css`)
- Dashboard home con navegación a módulos

### 2. Dashboard Admin
- **Leads** (`/admin/leads`): Lista de leads y últimos mensajes
- **Campañas** (`/admin/campaigns`): Placeholder
- **Conocimiento** (`/admin/knowledge`): Placeholder
- **Calendario** (`/admin/calendar`): Placeholder

### 3. APIs migradas a Next.js
- `/api/chat` - Chat con Gemini
- `/api/webhook` - Webhook Meta (feed + messaging)
- `/api/leads` - JSON de leads y mensajes
- `/api/knowledge` - Carga de documentos .txt por cliente

### 4. Módulo de Comentarios (Feed)
- Webhook escucha evento **feed** de Meta
- Comentario en post → respuesta fija: "¡Hola! Te envié la información por mensaje privado 📩"
- DM automático con paquetes/info generada por la IA
- **Config:** Suscribir `feed` en Meta Developer Console → Webhooks → Page → Subscriptions

### 5. WhatsApp Puente
- Conexión por QR (`whatsapp-web.js`)
- `npm run whatsapp` → escanea QR y conecta
- Mensajes usan IA + conocimiento y se registran en CRM
- Variables: `AGENTIA_CHATBOT_API_URL`, `AGENTIA_WHATSAPP_CLIENT_ID`

### 6. Prueba de Comentarios
- `npm run test:comment` → simula un comentario en el webhook
- Verifica que el flujo no crashea

---

## 🔜 Por implementar

### Módulo Google Calendar
- OAuth2 con Google
- Almacenar tokens en MongoDB
- Crear evento al confirmar cita (izzi/inmobiliaria)
- Enviar invitación al cliente
- **Variables de entorno:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### Cerebro Multi-Agente (Knowledge Base)
- Carpeta/base de conocimientos por `clientId`
- Subir PDFs y textos por cliente
- Gemini File API o embeddings para RAG
- Respuestas basadas solo en el conocimiento del cliente
- **Storage:** MongoDB GridFS o Vercel Blob

### Motor de Campañas Outbound
- Interfaz: subir Excel (.xlsx) con columna de teléfonos
- Mensaje plantilla
- Programación de envíos
- **Políticas Meta:** Respetar opt-in, ventana 24h, templates aprobados
- **Dependencia:** `xlsx` para parsear Excel

### Shadcn/ui components
- `npx shadcn@latest init` para agregar componentes
- Button, Card, Input, Table, etc.

---

## Cambiar colores (Marca Blanca)

Edita `app/globals.css`:

```css
:root {
  --background: 222 47% 6%;   /* Fondo oscuro */
  --primary: 263 70% 58%;     /* Morado - cambiar para tu marca */
  --muted: 217 33% 12%;
  --border: 217 33% 17%;
}
```

Para modo claro, añade `.light` con valores distintos.
