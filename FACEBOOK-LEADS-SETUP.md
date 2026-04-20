# Facebook Lead Ads — Setup Guide

## Overview

When a user fills a Facebook Lead Ad form, Meta sends a webhook to:
```
POST /api/webhook/facebook-leads
```
The server saves the lead to MongoDB and enqueues a WhatsApp welcome message in `outbound_queue`.

---

## 1. Environment Variables

Add these to your `.env.local` / production environment:

| Variable | Description |
|---|---|
| `FB_VERIFY_TOKEN` | Any secret string — used to verify Meta's GET handshake |
| `FB_APP_SECRET` | Your Facebook App's App Secret (for HMAC signature verification) |
| `FB_PAGE_ACCESS_TOKEN` | Page Access Token (long-lived) for sending messages via API |
| `FB_CLIENT_ID` | The `clientId` to assign to FB leads (default: `trafficker`) |

---

## 2. Facebook App Configuration

1. Go to **Meta for Developers → Your App → Webhooks**
2. Add a new webhook subscription:
   - **Callback URL**: `https://yourdomain.com/api/webhook/facebook-leads`
   - **Verify Token**: the value of `FB_VERIFY_TOKEN`
3. Subscribe to the **`leadgen`** field on the **Page** object
4. Make sure the app has the **`leads_retrieval`** permission

---

## 3. Webhook Payload

Meta sends a POST like this when a lead form is submitted:

```json
{
  "entry": [{
    "id": "PAGE_ID",
    "changes": [{
      "field": "leadgen",
      "value": {
        "leadgen_id": "123",
        "form_id": "456",
        "ad_id": "789",
        "ad_name": "Campaña Barberías CDMX",
        "adset_name": "Intereses corte",
        "campaign_name": "Agentia Q2 2026",
        "page_id": "PAGE_ID",
        "field_data": [
          { "name": "full_name", "values": ["Juan García"] },
          { "name": "phone_number", "values": ["5512345678"] },
          { "name": "email", "values": ["juan@gmail.com"] }
        ]
      }
    }]
  }]
}
```

---

## 4. Outbound Queue

The webhook inserts a document into the `outbound_queue` MongoDB collection:

```json
{
  "to": "5212345678",
  "clientId": "trafficker",
  "leadId": "5212345678_PAGE_ID_trafficker",
  "type": "welcome_fb_lead",
  "context": { "full_name": "Juan García", "campaign_name": "..." },
  "status": "pending",
  "attempts": 0,
  "createdAt": "2026-04-19T..."
}
```

The WhatsApp bridge polls `GET /api/outbound/pending?clientId=trafficker` and sends the message.

---

## 5. Dashboard

In `/dashboard/prospectos`:
- **Fuente** column shows colored badges: `FB Ads` (blue), `IG Ads` (pink), `WhatsApp` (green), `Manual` (gray)
- **Campaña** column shows the campaign name (truncated)
- **Contactar** button (phone icon) opens `wa.me/<phone>` in a new tab
- **Fuente filter** lets you view only FB Ads, IG Ads, WhatsApp, or Manual leads

---

## 6. Testing the Webhook

Use Meta's **Lead Ads Testing Tool** in the Facebook Developer console, or simulate with:

```bash
curl -X POST https://yourdomain.com/api/webhook/facebook-leads \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<HMAC>" \
  -d '{"entry":[{"id":"PAGE_ID","changes":[{"field":"leadgen","value":{"leadgen_id":"test123","form_id":"form1","campaign_name":"Test Campaign","field_data":[{"name":"full_name","values":["Test User"]},{"name":"phone_number","values":["5512345678"]}]}}]}]}'
```

To generate the correct HMAC:
```js
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', FB_APP_SECRET).update(body).digest('hex');
```
