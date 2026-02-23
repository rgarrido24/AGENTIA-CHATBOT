# Despliegue en Vercel

> **Requisito**: Instala [Git para Windows](https://git-scm.com/download/win) si aún no lo tienes.

## 1. Variables de entorno (Vercel Dashboard)

En **Vercel → Tu proyecto → Settings → Environment Variables**, configura:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGODB_URI` | URI de MongoDB Atlas (producción) | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB` | Nombre de la base de datos | `agentia_chatbot_ventas` |
| `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY` | API Key de Google AI (Gemini) | `AIza...` |
| `META_VERIFY_TOKEN` | Token para verificación de webhooks Meta | Tu token secreto |
| `AGENTIA_CHATBOT_API_URL` | URL pública de tu app en Vercel | `https://tu-app.vercel.app` |
| `CRON_SECRET` | Secreto para proteger rutas cron | Cadena aleatoria |
| `WHATSAPP_QR_SECRET` | Secreto para proteger QR de WhatsApp | Cadena aleatoria |
| `ALERT_WHATSAPP_NUMBER` | Número para alertas (opcional) | `5215512345678` |

**Importante**: Usa la base de datos de **MongoDB Atlas** (cloud), no una instancia local.

## 2. Rutas API

Todas las peticiones del frontend usan rutas relativas (`/api/...`), por lo que funcionan automáticamente en local y en Vercel.

## 3. GitHub + Vercel

### Paso 1: Inicializar repositorio local

```powershell
cd "c:\Users\Rodolfo\Desktop\AGENTIA CHATBOT"
git init
```

### Paso 2: Primer commit

```powershell
git add .
git status
git commit -m "Preparar despliegue en Vercel"
```

### Paso 3: Crear repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repo: `agentia-chatbot` (o el que prefieras)
3. **No** marques "Add a README" (ya tienes archivos)
4. Clic en **Create repository**

### Paso 4: Conectar y subir

```powershell
git remote add origin https://github.com/TU_USUARIO/agentia-chatbot.git
git branch -M main
git push -u origin main
```

*(Reemplaza `TU_USUARIO` por tu usuario de GitHub)*

### Paso 5: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. **Add New** → **Project**
3. Importa tu repositorio de GitHub
4. En **Environment Variables**, añade las variables de la tabla anterior
5. **Deploy**
