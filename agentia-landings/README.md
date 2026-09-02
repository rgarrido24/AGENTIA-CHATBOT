# Landing pages de productos — Agentia Software

Réplica del diseño de `agentia.software/lealtad` (fondo oscuro, Space Grotesk /
Inter / JetBrains Mono, verde #25D366, cyan #35C9F0, amber #F0A93D) para 5
productos independientes + homepage actualizado.

## Cómo integrar en tu repo `rgarrido24/AGENTIA-CHATBOT`

1. Copia las carpetas tal cual, respetando rutas (asume App Router de Next 14):
   - `styles/agentia-brand.css`
   - `components/shared/*.tsx`
   - `app/api/diagnostico-leads/route.ts`
   - `app/chatbot/page.tsx`, `app/crm/page.tsx`, `app/ecommerce/page.tsx`,
     `app/paginas-web/page.tsx`, `app/rastreo/page.tsx`
   - `app/page.tsx` — **este SÍ reemplaza tu homepage actual**, revísalo antes
     de sobreescribir por si tienes lógica que no quieras perder.

2. Los imports usan el alias `@/` (ej. `@/styles/agentia-brand.css`). Si tu
   `tsconfig.json` no tiene ese alias configurado hacia la raíz del proyecto,
   ajústalo o cambia los imports a rutas relativas.

3. **Variables de entorno** — el endpoint `app/api/diagnostico-leads/route.ts`
   necesita `MONGODB_URI` (ya la tienes en Render) y opcionalmente
   `MONGODB_DB` (default `agentia_chatbot_ventas`).

4. **Dos TODOs marcados en el código que requieren tu contexto real:**
   - `app/api/diagnostico-leads/route.ts` → función `notifyAgentiaPanel()`:
     conéctala a tu sistema de push existente (el mismo de los portales de
     asesoras de Luciano, con VAPID keys) en vez del `console.log` placeholder.
   - `app/page.tsx` → sección final: ahí va tu simulador de ROI general que
     ya existe en el sitio actual; no lo recreé para no duplicar esa lógica,
     solo importa tu componente existente.

5. Si ya tienes un helper compartido de conexión Mongo (`lib/mongodb.ts` o
   similar) úsalo en vez del cliente standalone del endpoint, para no abrir
   una segunda conexión al mismo cluster.

## Qué incluye cada landing

Cada página (`/chatbot`, `/crm`, `/ecommerce`, `/paginas-web`, `/rastreo`)
tiene: navbar con links a los otros productos, hero, casos reales con datos
de tus clientes actuales, 3 diferenciadores, un simulador de ROI configurado
con una fórmula distinta por producto, formulario de captura (guarda en
`diagnostico_leads` con el campo `producto`), botón flotante de WhatsApp al
+52 984 492 7769, y footer con link de vuelta a agentia.software.

## Pendiente de tu lado (no lo puedo hacer sin acceso a tu repo/Render)

- Pegar los archivos en tu proyecto local y correr `npm run build` para
  cachar cualquier tipo/import que no calce con tu estructura real.
- Conectar el push notification real.
- Meter el simulador de ROI general existente en el homepage.
- Deploy a Render (push a `rgarrido24/AGENTIA-CHATBOT`, el resto es automático
  según tu config actual).
