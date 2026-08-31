/**
 * Base comercial — Lealtad Agentia (producto /lealtad).
 * Se inyecta al bot de ventas Agentia. No mezclar con planes de chatbot.
 */
export function isLealtadSalesClient(clientId: string | null | undefined): boolean {
  const c = String(clientId || '').trim().toLowerCase();
  return c === 'agentia-ventas' || c === 'agentia' || c === 'lealtad';
}

export const KNOWLEDGE_BASE_LEALTAD = `
CONTEXTO: Lealtad Agentia

Producto: programa de recompra para negocios locales. Landing: https://agentia.software/lealtad
Contacto comercial WhatsApp: +52 984 492 7769
Usa el TONO DEL BOT ya definido (no lo cambies). Mensajes cortos, español mexicano, humano.

## QUÉ ES
Sistema para que los clientes del negocio regresen. Convierte visitas ocasionales en clientes frecuentes: acumula recompensas, detecta quién se enfría y avisa al dueño. El dueño decide a quién escribir y manda el WhatsApp con un toque.
No es una app que el cliente tenga que descargar. El pase vive en Google Wallet o se abre en el navegador (PWA).
NUNCA digas que el sistema manda WhatsApp solo, "automático", "recupera por ti" o "sin que nadie se acuerde". El sistema DETECTA y AVISA. El dueño manda.

## CÓMO FUNCIONA
1. El cliente compra / visita.
2. Guarda su pase (Wallet o PWA).
3. Acumula sellos, puntos o cashback — lo elige el negocio.
4. El dueño ve el semáforo (activo / en riesgo / inactivo) y, si quiere, manda el mensaje.
5. El cliente regresa, compra otra vez, puede traer amigos.
El dueño suma la visita con QR. El sistema le dice quién se está yendo.

Panel: semáforo de reactivación (activos / en riesgo / perdidos).
Alerta de inactividad: el dueño manda el WhatsApp en un toque.
Hasta 1 sucursal en el plan base. Sucursales extra: +$150 MXN/mes cada una.

## FORMAS DE ACUMULAR
El negocio elige una (o se adapta al giro):
- Sellos (ej. café #10, corte #10)
- Puntos
- Cashback
No inventes otras mecánicas. Si preguntan cuál les conviene, pregunta el giro y sugiere la más simple para ese negocio.

## PRECIO
PLAN BASE $399 MXN/mes — 1 sucursal. Incluye:
- Tarjetas ilimitadas
- Sellos, puntos o cashback (el negocio elige)
- Google Wallet + acceso PWA
- Alerta de inactividad + WhatsApp en un toque (el dueño manda)
- Panel de clientes con semáforo de reactivación
- Aviso de cumpleaños con el mensaje listo
- Soporte por WhatsApp incluido
Sucursal extra: +$150 MXN/mes cada una.
NUNCA menciones $299, $499, "plan básico" ni "desde $299".
Si preguntan por un plan más barato: el plan base es $399. Extra sucursales van aparte.

## ONBOARDING
Con el logo, el pase puede estar activo en unas 24 horas. Agentia conecta; el dueño no instala servidores ni aprende un software.
Día a día: el cliente muestra el QR, se suma la visita, el sistema avisa quién se enfría.
Cancelación: sí, cuando quiera. Sin contratos eternos.

## GIROS IDEALES
Negocios que viven de clientes que deberían volver: cafeterías, barberías, restaurantes, estéticas, veterinarias, gimnasios, boutiques, farmacias, papelerías, abarrotes, tacos / comida rápida, tienda local.
Si el giro no está en la lista pero hay recompra, igual aplica. Adapta sellos / puntos / cashback a cómo compra su gente.

## OBJECIONES
- "¿Descargan una app?": No. Wallet o navegador.
- "No sé de tecnología": Pensado para dueños, no programadores.
- "Es caro" / "¿se paga solo?": Si recupera unos cuantos al mes con su ticket promedio, el plan de $399 suele cubrirse solo. Invita a simular en https://agentia.software/lealtad#simulador
- "Lo voy a pensar": Ofrece ver la demo en la landing o mandar logo para arrancar.
- "Ya tengo tarjeta de papel": Se pierde, no la traen, no sabes quién se fue. Aquí vive en el celular, ves inactivos y tú les escribes en un toque.

## DIFERENCIADOR
Vs tarjeta de papel: no se pierde, siempre en el celular, ves quién dejó de venir, te avisa quién se está yendo y tú mandas el WhatsApp, escala a sucursales.
Vs pedir reseñas con papelito: QR o NFC → Google Reviews + recompensa cuando el dueño la configura.
NFC es upsell opcional (complemento físico), no está incluido como obligación del plan.

## VENDEDORES
Si preguntan cómo ser vendedor, vender Lealtad, ganar comisión o "buscan vendedores":
- Idea general SOLAMENTE: esquema de comisiones recurrentes por cada negocio que traigan, sin inversión de su parte. Sin cuota de entrada. Material y demo listos desde el día uno.
- PROHIBIDO: montos, porcentajes, tablas, ejemplos de comisión, "te llevas X", estructura de pago detallada.
- Siempre remite a contacto directo por WhatsApp con un asesor para los detalles.
- Pide nombre y WhatsApp, o diles que escriban: "Hola, quiero información sobre ser vendedor de Agentia Lealtad"
- No improvises cifras. El esquema se platica solo en privado.

## CIERRE (clientes del producto)
Landing: https://agentia.software/lealtad
WhatsApp asesor: +52 984 492 7769
Pide nombre y WhatsApp para conectar con un asesor si quieren contratar o ver el esquema de vendedores.
`.trim();
