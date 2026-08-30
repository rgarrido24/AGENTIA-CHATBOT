# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3010
npm run build        # Install deps + build for production
npm run start        # Start production server on port 3010
npm run typecheck    # TypeScript validation (no emit)

# WhatsApp bridge (separate process)
npm run whatsapp              # Start WhatsApp bridge (QR scan)
npm run whatsapp:reset        # Reset WhatsApp session
npm run whatsapp:kill-browser # Kill background browser process

# Database & config
npm run seed          # Seed business configs to MongoDB
npm run purge:knowledge # Remove knowledge docs from DB

# Testing & debugging
npm run test:comment  # Simulate Meta comment webhook
npm run debug:export  # Generate agentia-debug.json
npm run check:izzi    # Verify Izzi config and bot status
```

## Architecture Overview

**Agentia** is a multi-tenant AI chatbot CRM platform. The core loop is: incoming message → `src/lib/chat-handler.ts` orchestrates all logic → Gemini 2.5-Flash generates reply → reply posted back to channel.

### Request Flow

1. **Entry points**: `/api/chat` (direct), `/api/webhook` (Meta/Facebook/Instagram), or `scripts/whatsapp-bridge.js` (WhatsApp Web bridge — separate Node process)
2. **Orchestrator**: `src/lib/chat-handler.ts:handleChat()` — all business logic flows through here
3. **Kill switch**: Checks bot pause state before any processing (per-lead or global via `bot_settings` collection)
4. **Security layer**: `src/lib/input-sanitization.ts` detects prompt injection before calling Gemini
5. **Izzi document flow**: If `clientId === "izzi"` and image is attached, `document-ocr.ts` extracts INE/ID data via Gemini vision, then `sale-closure-flow.js` orchestrates the pipeline to "Cerrado" on confirmation
6. **System prompt assembly**: Business config from MongoDB + channel rules + knowledge base + contextual blocks (coverage, appointment slots, expedient) all injected before Gemini call
7. **Gemini call**: `src/lib/gemini.ts` wraps `@ai-sdk/google`; supports text + image (multimodal)
8. **Background operations**: Lead upsert, usage logging, alert creation — all fire after reply is ready

### Multi-Tenant Routing

Every request carries a `clientId`. `src/lib/business-config.ts` loads the matching config from the `business_configs` MongoDB collection (cached). Each config contains `systemPrompt`, `knowledge`, `model`, and `pageId` (Meta page ID for webhook routing).

### Key Libraries (`src/lib/`)

| File | Role |
|------|------|
| `chat-handler.ts` | Main orchestrator — start here for any chat logic changes |
| `gemini.ts` | Gemini integration via `@ai-sdk/google` |
| `document-ocr.ts` | Gemini vision OCR for ID/document images |
| `sale-closure-flow.js` | Izzi-specific: document collection → lead → external API |
| `knowledge-base-izzi.js` | Hard-coded Izzi pricing, packages, TV channels |
| `business-config.ts` | Multi-tenant config loader with MongoDB caching |
| `leads.ts` | Lead CRUD (`saveLead` = immutable log, `upsertLead` = mutable record) |
| `chat-sessions.ts` | Conversation state, follow-up logic |
| `appointment-flow.ts` | Calendar slot booking with conflict detection |
| `coverage-lookup.ts` | Izzi postal code → coverage DB query |
| `alerts.ts` | Urgent lead notifications (WhatsApp alerts to admin) |
| `lead-classifier.ts` | AI-powered lead classification via Gemini |

### MongoDB Collections

- `business_configs` — per-client bot configuration
- `leads_agentia` — immutable message log
- `leads` — mutable lead records with pipeline status
- `chat_sessions` — conversation state
- `document_pending_confirmations` — Izzi OCR data awaiting user confirmation
- `appointments` — booked calendar appointments
- `bot_settings` — global pause/resume flags per client
- `alerts` — urgent lead notifications
- `usage_logs` — token/cost tracking

### Tech Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Google Gemini 2.5-Flash** via `@ai-sdk/google` (chat, OCR, classification)
- **MongoDB 7.1** (Atlas) via `lib/mongodb.ts` (connection pooling for serverless)
- **whatsapp-web.js** (WhatsApp bridge — separate process, not serverless)
- **Google Calendar API** (OAuth2, optional)
- **Meta Webhooks** (Facebook/Instagram comments and DMs)

### Environment Variables

See `.env.example` for the full list. Critical ones:
- `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` — AI (required)
- `MONGODB_URI` + `MONGODB_DB` — database
- `META_VERIFY_TOKEN` — Meta webhook verification
- `ADMIN_PASSWORD` — protects `/admin`, `/dashboard`, `/api/admin`
- `LEADS_API_BASE_URL`, `WHATSAPP_SEND_URL`, `WHATSAPP_API_TOKEN` — Izzi external APIs

### Deployment

- **Render**: `Procfile` defines `web: npm start`. See `DEPLOY.md` for full guide.
- **Vercel**: See `DEPLOY_VERCEL.md`.
- WhatsApp bridge must run as a separate persistent process (not serverless).
- **Render / CI builds**: `package.json` tiene **`overrides`** que sustituye `puppeteer` por **`puppeteer-core`** (sin descarga de Chrome en `npm install`, evita fallos en Render). El bridge `whatsapp-web.js` usa Chrome del sistema; configura `PUPPETEER_EXECUTABLE_PATH` o instala Chrome en el worker. Si el build falló antes, **Clear build cache** en Render.

### Izzi-Specific Notes

The Izzi client (`clientId === "izzi"`) has the most complex flow:
- OCR document collection with multi-photo merging (`mergeExtractedData`)
- Postal code coverage verification before quoting packages
- External lead API submission on sale closure
- Hard-coded knowledge base in `knowledge-base-izzi.js` (pricing, channels, promo rules)
- Troubleshooting guide: `IZZI-CHAT-CHECKLIST.md`
