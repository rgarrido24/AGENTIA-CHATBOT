# Correr múltiples bridges de WhatsApp en paralelo

Cada cliente que use WhatsApp necesita su propio proceso `whatsapp-bridge.js` con su número escaneado.
Los bridges se diferencian por la variable `AGENTIA_WHATSAPP_CLIENT_ID`.

---

## Setup actual (2 bridges)

### Terminal 1 — Bridge Izzi

```bash
AGENTIA_WHATSAPP_CLIENT_ID=izzi node scripts/whatsapp-bridge.js
```

- **clientId:** `izzi`
- **Sesión WhatsApp:** `.wwebjs_auth_izzi/`
- **Puerto health:** `10000` (configura `PORT=10001` si hay conflicto)
- **clientId en MongoDB:** `izzi`

### Terminal 2 — Bridge Agentia Ventas

```bash
AGENTIA_WHATSAPP_CLIENT_ID=agentia-ventas node scripts/whatsapp-bridge.js
```

- **clientId:** `agentia-ventas`
- **Sesión WhatsApp:** `.wwebjs_auth_agentia-ventas/`
- **Puerto health:** cambia `PORT=10002` para evitar conflicto
- **clientId en MongoDB:** `agentia-ventas`
- **Poller extra:** follow-up automático de prospectos cada 6 horas

---

## Variables de entorno necesarias por bridge

Cada bridge lee las mismas variables del `.env` / `.env.local`, pero puedes sobrescribir con prefijo en el comando:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `AGENTIA_WHATSAPP_CLIENT_ID` | Identifica el bridge y el número de WhatsApp | `izzi` / `agentia-ventas` |
| `AGENTIA_CHATBOT_API_URL` | URL del servidor Next.js | `https://agentia-chatbot-ventas.onrender.com` |
| `ALERT_WHATSAPP_NUMBER` | Número que recibe alertas | `521XXXXXXXXXX` |
| `CRON_SECRET` | Protege endpoints internos | string aleatorio |
| `PORT` | Puerto del `/health` del bridge | `10000`, `10001`, `10002`... |

---

## Script de inicio rápido (Windows)

Ejecuta `start-bridges.bat` — abre dos terminales automáticamente.

---

## Cómo agregar un cliente nuevo

1. **Crear config en MongoDB:**
   ```bash
   # Agrega el nuevo clientId en scripts/seed-business-configs.js
   # y ejecuta:
   node scripts/seed-business-configs.js
   ```

2. **Agregar variable de entorno:**
   ```
   AGENTIA_WHATSAPP_CLIENT_ID=nombre-cliente
   ```

3. **Abrir nueva terminal:**
   ```bash
   PORT=10003 AGENTIA_WHATSAPP_CLIENT_ID=nombre-cliente node scripts/whatsapp-bridge.js
   ```

4. **Escanear QR:** El bridge muestra el QR en consola y en `http://localhost:10003/qr`.

5. **Verificar conexión:** `http://localhost:10003/health`

---

## Sesiones almacenadas

Cada bridge guarda su sesión de WhatsApp en una carpeta separada:

```
.wwebjs_auth_izzi/
.wwebjs_auth_agentia-ventas/
.wwebjs_auth_nombre-cliente/
```

Para resetear un bridge específico:
```bash
rm -rf .wwebjs_auth_agentia-ventas/
```

---

## Escalabilidad

| Bridges activos | RAM estimada | Notas |
|---|---|---|
| 1-3 | ~500 MB | OK en máquina estándar |
| 4-8 | ~1-2 GB | Considera un VPS dedicado |
| 8+ | >2 GB | Usar `--max-old-space-size=512` por proceso |

Para producción con muchos clientes, considera un proceso manager como PM2:

```bash
pm2 start scripts/whatsapp-bridge.js --name "bridge-izzi" -- --env AGENTIA_WHATSAPP_CLIENT_ID=izzi
pm2 start scripts/whatsapp-bridge.js --name "bridge-agentia-ventas" -- --env AGENTIA_WHATSAPP_CLIENT_ID=agentia-ventas
pm2 save
pm2 startup
```
