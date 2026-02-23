# Agentia ManyChat Clone (API)

API serverless en Vercel con Node.js + TypeScript que expone `POST /api/chat` y responde usando Gemini vía `@google/generative-ai`.

> Nota: El modelo se selecciona por `GEMINI_MODEL` (default `gemini-flash-latest`) o por `business_configs.model`.

## Requisitos

- Node.js 20+
- Cuenta en Vercel (para desplegar)
- API Key de Gemini

## Variables de entorno

Copia `.env.example` a `.env` y completa:

- `GEMINI_API_KEY`
- `GEMINI_SYSTEM_PROMPT` (pega aquí el System Prompt de Sales Closer)

En Vercel: Project Settings → Environment Variables.

## Desarrollo local

```bash
npm install
npm run dev:vercel
```

## Probar el endpoint

```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"clientId\":\"izzi\",\"message\":\"Hola, ¿qué paquetes tienes?\"}"
```

Respuesta:

```json
{ "clientId": "izzi", "reply": "..." }
```

## Multi-negocio (clientId → MongoDB)

El endpoint busca configuración dinámica por `clientId` en MongoDB:

- **Colección**: `business_configs`
- **Campos**: `clientId`, `systemPrompt`, `knowledge`, `model`

Semilla rápida:

```bash
node ./scripts/seed-business-configs.js
```

