# Multi-Bridge WhatsApp — Guía de deploy en Render

Corre los bridges de **izzi** y **agentia-ventas** en un solo Background Worker,
sin pagar dos servicios separados.

---

## Arquitectura

```
Render Background Worker
└── start-multi-bridge.js  (proceso padre — health en :PORT)
    ├── whatsapp-bridge.js   CLIENT_ID=izzi            PORT=10001
    └── whatsapp-bridge.js   CLIENT_ID=agentia-ventas  PORT=10002
```

Los puertos internos 10001/10002 no están expuestos externamente.

---

## Deploy en Render

### 1. Crear el Background Worker

En el dashboard de Render → **New → Background Worker**:

| Campo | Valor |
|---|---|
| Repository | tu repo de Agentia |
| Branch | `master` |
| Build Command | `npm install` |
| Start Command | `node scripts/start-multi-bridge.js` |

### 2. Variables de entorno del worker

| Variable | Valor |
|---|---|
| `AGENTIA_CHATBOT_API_URL` | `https://agentia.software` |
| `WHATSAPP_QR_SECRET` | (mismo valor que el web service) |
| `MONGODB_URI` | (mismo valor que el web service) |
| `CRON_SECRET` | (mismo valor que el web service) |
| `ALERT_WHATSAPP_NUMBER` | `529844927769` |

> Los `CLIENT_ID` los maneja el script internamente — no se necesitan variables separadas.

### 3. Primer arranque y escaneo de QR

1. Haz deploy del worker
2. Abre los **Logs** del worker en Render
3. Espera a que aparezca `[IZZI   ] QR enviado al API`
4. Ve a `https://agentia.software/dashboard/whatsapp` y escanea el QR de izzi
5. ~8 segundos después aparece el bridge de agentia-ventas
6. Escanea el QR de agentia-ventas con ese teléfono

---

## Ver logs por bridge

Cada línea tiene prefijo de qué bridge la generó:

```
[MULTI  ] ════ Agentia Multi-Bridge Worker arrancando
[IZZI   ] ▶ Iniciando bridge (intento 1) — PORT=10001
[AGENTIA] ▶ Iniciando bridge (intento 1) — PORT=10002
[IZZI   ] QR enviado al API para vincular desde la web.
[AGENTIA] WhatsApp conectado correctamente.
```

Para filtrar en Render: usa la barra de búsqueda de logs y escribe `[IZZI` o `[AGENTIA`.

---

## Reiniciar un bridge sin afectar el otro

Los bridges se auto-reinician solos al caerse:

| Reinicios | Delay |
|---|---|
| 1 – 4 | 5 segundos |
| 5 + | 60 segundos (backoff) |
| 20 | Se detiene — requiere restart manual del worker |

**Re-escanear QR de un bridge:**
El bridge detecta la desconexión, se reinicia, genera nuevo QR y lo publica en
`/dashboard/whatsapp` — escanea desde ahí sin tocar el otro bridge.

**Reiniciar el worker completo:**
Render → worker → **Manual Deploy** o botón **Restart**.
Ambos bridges arrancan de nuevo; hay que re-escanear los dos QRs.

---

## Health check del worker

El proceso padre expone `/health` en el `PORT` asignado por Render:

```json
{
  "ok": true,
  "bridges": [
    { "clientId": "izzi",           "port": 10001, "alive": true, "restarts": 0 },
    { "clientId": "agentia-ventas", "port": 10002, "alive": true, "restarts": 0 }
  ],
  "timestamp": "2026-04-21T10:00:00.000Z"
}
```

---

## Nota sobre sesiones

Cada bridge guarda su sesión de WhatsApp en:
- `.wwebjs_auth_izzi/`
- `.wwebjs_auth_agentia-ventas/`

En Render el filesystem **no persiste** entre deploys — hay que re-escanear los QRs
cada vez que hagas deploy del worker. Para evitarlo, configura un
**Disk persistente** en Render y móntalo en la raíz del proyecto.
