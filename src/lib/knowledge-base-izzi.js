/**
 * knowledge-base-izzi.js
 * Base de Conocimiento Comercial – izzi
 * Generado por Agentia Knowledge Engineer
 * Fuente: ACs oficiales izzi (vigencia al 31 de mayo 2026 / 31 de marzo 2026 según aplique)
 *
 * INSTRUCCIÓN CRÍTICA PARA EL BOT:
 * Solo ofrecer información contenida en este archivo.
 * Si el cliente pregunta algo no cubierto aquí, responder:
 * "Déjame consultar para darte la información exacta."
 */

// ─────────────────────────────────────────────
// 1. METADATOS GENERALES
// ─────────────────────────────────────────────
export const META = {
 marca: "izzi",
 tono: "resolutivo, profesional y directo",
 fallbackMessage:
 "Déjame consultar para darte la información exacta.",
 vigenciaOfertaFija: "31 de marzo 2026",
 vigenciaOfertaMovil: "31 de mayo 2026",
 segmentos: ["Residencial", "Negocios"],
 tiposCliente: ["Nuevos", "Existentes"],
};

// ─────────────────────────────────────────────
// 2. OFERTA BASE – PAQUETES FIJOS (AC 876 V19 / AC 975 V5)
// Precios de lista vigentes desde 28 de febrero 2026
// ─────────────────────────────────────────────
export const PAQUETES_FIJOS = {
 residencial: {
 "2P": [
 { nombre: "izzi 60", velocidad: 60, precio: 389 },
 { nombre: "izzi 80", velocidad: 80, precio: 480 },
 { nombre: "izzi 100", velocidad: 100, precio: 540 },
 { nombre: "izzi 150", velocidad: 150, precio: 640 },
 { nombre: "izzi 200", velocidad: 200, precio: 700 },
 { nombre: "izzi 500", velocidad: 500, precio: 820 },
 { nombre: "izzi 1000", velocidad: 1000, precio: 1020 },
 ],
 "3P": [
 { nombre: "izzi 60 + izzitv HD", velocidad: 60, canales: 100, precio: 539 },
 { nombre: "izzi 80 + izzitv HD", velocidad: 80, canales: 100, precio: 630 },
 { nombre: "izzi 100 + izzitv HD", velocidad: 100, canales: 200, precio: 720 },
 { nombre: "izzi 150 + izzitv HD", velocidad: 150, canales: 200, precio: 820 },
 { nombre: "izzi 200 + izzitv HD", velocidad: 200, canales: 200, precio: 880 },
 { nombre: "izzi 500 + izzitv HD", velocidad: 500, canales: 200, precio: 1000 },
 { nombre: "izzi 1000 + izzitv HD", velocidad: 1000, canales: 200, precio: 1200 },
 ],
 },
 negocios: {
 "2P": [
 { nombre: "izzi negocios 60", velocidad: 60, precio: 439 },
 { nombre: "izzi negocios 80", velocidad: 80, precio: 530 },
 { nombre: "izzi negocios 100", velocidad: 100, precio: 590 },
 { nombre: "izzi negocios 150", velocidad: 150, precio: 690 },
 { nombre: "izzi negocios 200", velocidad: 200, precio: 750 },
 { nombre: "izzi negocios 500", velocidad: 500, precio: 870 },
 { nombre: "izzi negocios 1000", velocidad: 1000, precio: 1070 },
 ],
 "3P": [
 { nombre: "izzi negocios 60 + izzitv HD", velocidad: 60, canales: 100, precio: 589 },
 { nombre: "izzi negocios 80 + izzitv HD", velocidad: 80, canales: 100, precio: 680 },
 { nombre: "izzi negocios 100 + izzitv HD", velocidad: 100, canales: 200, precio: 770 },
 { nombre: "izzi negocios 150 + izzitv HD", velocidad: 150, canales: 200, precio: 870 },
 { nombre: "izzi negocios 200 + izzitv HD", velocidad: 200, canales: 200, precio: 930 },
 { nombre: "izzi negocios 500 + izzitv HD", velocidad: 500, canales: 200, precio: 1050 },
 { nombre: "izzi negocios 1000 + izzitv HD", velocidad: 1000, canales: 200, precio: 1250 },
 ],
 },
};

// ─────────────────────────────────────────────
// 3. COMPLEMENTOS INCLUIDOS POR PAQUETE (AC 876 / AC 975)
// ─────────────────────────────────────────────
export const COMPLEMENTOS_INCLUIDOS = {
 streaming12Meses: {
 vixPremium: { desde: 80, hasta: 1000, nota: "Incluido 12 meses, baja automática mes 13" },
 hboMaxBasico: {
  desde: 80,
  hasta: 1000,
  nota: "Incluido 12 meses. En 80MB y 100MB vía CC Outbound Digital (AC 1165); en 100MB+ aplica en todos los canales. Baja automática mes 13.",
  promoCC_Outbound_AC1165: "Incluido desde 80MB (CC Outbound Digital)",
 },
 disneyPlusEstandar: {
  desde: 100,
  hasta: 1000,
  nota: "Incluido 12 meses. En 100MB vía CC Outbound Digital (AC 1165); en 150MB+ aplica en todos los canales con Apple TV. Baja mes 13.",
  promoCC_Outbound_AC1165: "Incluido desde 100MB (CC Outbound Digital)",
 },
 appleTV: { desde: 150, hasta: 1000, nota: "Incluido 12 meses, baja automática mes 13" },
 },
 skeelo: {
 skeeloLight: { desde: 60, hasta: 80, nota: "Skeelo Light incluido" },
 skeelo: { desde: 100, hasta: 1000, nota: "Plan Skeelo incluido" },
 },
 canalesTV: {
 "hasta100": { desde: 60, hasta: 80, play: "3P", nota: "Hasta 100 canales" },
 "hasta200": { desde: 100, hasta: 1000, play: "3P", nota: "Hasta 200 canales + 12 canales Sky Sports (F1, LALIGA, Bundesliga)" },
 },
 edye: { play: "3P", desde: 80, hasta: 1000, nota: "Incluido en paquetes 3P" },
 nbaLeaguePass: {
 disponible: false,
 nota: "NBA League Pass ya NO está incluido en paquetes de 500 y 1000MB a partir del 28 de febrero 2026",
 },
};

// ─────────────────────────────────────────────
// 4. PLANES MÓVILES (AC 876 / AC 975)
// ─────────────────────────────────────────────
export const PLANES_MOVIL = [
 {
 nombre: "izzi móvil 5 12 meses",
 gb: 5,
 plazo: 12,
 precioLista: 120,
 caracteristicas: ["5 GB datos para compartir", "WhatsApp ilimitado", "Llamadas ilimitadas", "SMS ilimitados"],
 },
 {
 nombre: "izzi móvil 10 12 meses",
 gb: 10,
 plazo: 12,
 precioLista: 150,
 caracteristicas: ["10 GB datos", "WhatsApp ilimitado", "Llamadas ilimitadas", "SMS ilimitados"],
 },
 {
 nombre: "izzi móvil 10",
 gb: 10,
 plazo: null,
 precioLista: 180,
 },
 {
 nombre: "izzi móvil 20",
 gb: 20,
 plazo: null,
 precioLista: 250,
 },
 {
 nombre: "izzi móvil Comparte tus datos 12 meses",
 gb: "Ilimitados para compartir",
 plazo: 12,
 precioLista: 300,
 caracteristicas: ["Datos ilimitados para compartir", "Minutos y SMS ilimitados"],
 },
 {
 nombre: "izzi móvil Comparte tus datos",
 gb: "Ilimitados para compartir",
 plazo: null,
 precioLista: 350,
 caracteristicas: ["Datos ilimitados para compartir", "Minutos y SMS ilimitados"],
 },
 {
 nombre: "izzi móvil Plan Familiar",
 gb: "Familiar",
 plazo: null,
 precioLista: 450,
 },
];

// ─────────────────────────────────────────────
// 5. PRECIOS PAQUETES FIJOS + MÓVIL COMBINADOS (AC 975 V5)
// Residencial 2PM y 3PM
// ─────────────────────────────────────────────
export const PRECIOS_COMBO_RESIDENCIAL = {
 "2PM": [
 // [paquete_fijo, plan_movil, precio_lista]
 { fijo: "izzi 60", movil: "izzi móvil 5 12 meses", precio: 509 },
 { fijo: "izzi 60", movil: "izzi móvil 10 12 meses", precio: 539 },
 { fijo: "izzi 60", movil: "izzi móvil 10", precio: 569 },
 { fijo: "izzi 60", movil: "izzi móvil 20", precio: 639 },
 { fijo: "izzi 60", movil: "izzi móvil Comparte tus datos 12 meses", precio: 689 },
 { fijo: "izzi 60", movil: "izzi móvil Comparte tus datos", precio: 739 },
 { fijo: "izzi 60", movil: "izzi móvil Plan Familiar", precio: 839 },
 { fijo: "izzi 80", movil: "izzi móvil 5 12 meses", precio: 600 },
 { fijo: "izzi 80", movil: "izzi móvil 10 12 meses", precio: 630 },
 { fijo: "izzi 80", movil: "izzi móvil 10", precio: 660 },
 { fijo: "izzi 80", movil: "izzi móvil 20", precio: 730 },
 { fijo: "izzi 80", movil: "izzi móvil Comparte tus datos 12 meses", precio: 780 },
 { fijo: "izzi 80", movil: "izzi móvil Comparte tus datos", precio: 830 },
 { fijo: "izzi 80", movil: "izzi móvil Plan Familiar", precio: 930 },
 { fijo: "izzi 100", movil: "izzi móvil 5 12 meses", precio: 660 },
 { fijo: "izzi 100", movil: "izzi móvil 10 12 meses", precio: 690 },
 { fijo: "izzi 100", movil: "izzi móvil 10", precio: 720 },
 { fijo: "izzi 100", movil: "izzi móvil 20", precio: 790 },
 { fijo: "izzi 100", movil: "izzi móvil Comparte tus datos 12 meses", precio: 840 },
 { fijo: "izzi 100", movil: "izzi móvil Comparte tus datos", precio: 890 },
 { fijo: "izzi 100", movil: "izzi móvil Plan Familiar", precio: 990 },
 { fijo: "izzi 150", movil: "izzi móvil 5 12 meses", precio: 760 },
 { fijo: "izzi 150", movil: "izzi móvil 10 12 meses", precio: 790 },
 { fijo: "izzi 150", movil: "izzi móvil 10", precio: 820 },
 { fijo: "izzi 150", movil: "izzi móvil 20", precio: 890 },
 { fijo: "izzi 150", movil: "izzi móvil Comparte tus datos 12 meses", precio: 940 },
 { fijo: "izzi 150", movil: "izzi móvil Comparte tus datos", precio: 990 },
 { fijo: "izzi 150", movil: "izzi móvil Plan Familiar", precio: 1090 },
 { fijo: "izzi 200", movil: "izzi móvil 5 12 meses", precio: 820 },
 { fijo: "izzi 200", movil: "izzi móvil 10 12 meses", precio: 850 },
 { fijo: "izzi 200", movil: "izzi móvil 10", precio: 880 },
 { fijo: "izzi 200", movil: "izzi móvil 20", precio: 950 },
 { fijo: "izzi 200", movil: "izzi móvil Comparte tus datos 12 meses", precio: 1000 },
 { fijo: "izzi 200", movil: "izzi móvil Comparte tus datos", precio: 1050 },
 { fijo: "izzi 200", movil: "izzi móvil Plan Familiar", precio: 1150 },
 { fijo: "izzi 500", movil: "izzi móvil 5 12 meses", precio: 940 },
 { fijo: "izzi 500", movil: "izzi móvil 10 12 meses", precio: 970 },
 { fijo: "izzi 500", movil: "izzi móvil 10", precio: 1000 },
 { fijo: "izzi 500", movil: "izzi móvil 20", precio: 1070 },
 { fijo: "izzi 500", movil: "izzi móvil Comparte tus datos 12 meses", precio: 1120 },
 { fijo: "izzi 500", movil: "izzi móvil Comparte tus datos", precio: 1170 },
 { fijo: "izzi 500", movil: "izzi móvil Plan Familiar", precio: 1270 },
 { fijo: "izzi 1000", movil: "izzi móvil 5 12 meses", precio: 1140 },
 { fijo: "izzi 1000", movil: "izzi móvil 10 12 meses", precio: 1170 },
 { fijo: "izzi 1000", movil: "izzi móvil 10", precio: 1200 },
 { fijo: "izzi 1000", movil: "izzi móvil 20", precio: 1270 },
 { fijo: "izzi 1000", movil: "izzi móvil Comparte tus datos 12 meses", precio: 1320 },
 { fijo: "izzi 1000", movil: "izzi móvil Comparte tus datos", precio: 1370 },
 { fijo: "izzi 1000", movil: "izzi móvil Plan Familiar", precio: 1470 },
 ],
};

// ─────────────────────────────────────────────
// 6. PROMOCIONES MÓVIL (ACs 981, 1013, 1150)
// ─────────────────────────────────────────────
export const PROMOCIONES_MOVIL = [
 {
 id: "AC981",
 nombre: "Promo móvil comparte datos $250 x 12 meses",
 plan: "izzi móvil Comparte tus datos 12 meses",
 precioPromo: 250,
 descuento: 50,
 vigencia: "31 de mayo 2026",
 duracionDescuento: "12 meses",
 descuentoAdicionalPortabilidad: 53,
 ahorroPotencial: 1236,
 canales: ["CC DB INHOUSE", "CC DISTRIBUIDOR DIGITAL", "CC INBOUND", "CC MARKETPLACE", "CC OUTBOUND", "CC REDES SOCIALES", "CALL CENTER", "RET SUCURSALES"],
 requisitos: [
 "Cliente debe tener servicios activos de video, internet o telefonía fija de izzi con antigüedad mayor a 1 año",
 "Aplica hasta 5 líneas con el plan izzi comparte tus datos 12 meses",
 "Si cancela todos los servicios fijos, pierde el descuento",
 "A partir del mes 13 se cobra tarifa normal",
 "No aplica para cuentas subtipo empleado",
 "No aplica en otros canales de venta",
 ],
 conviveCon: "Promoción portabilidad de izzi móvil",
 siebel: "Promo movil comparte datos $250 x 12 meses → -$50.00",
 },
 {
 id: "AC1013",
 nombre: "Promo especial móvil 5 $99 durante 12 meses",
 plan: "izzi móvil 5 12 meses",
 precioPromo: 99,
 descuento: 21,
 vigencia: "31 de mayo 2026",
 duracionDescuento: "12 meses",
 restricciones: ["NO aplica para Tijuana"],
 canales: ["CC Inbound", "CC Marketplace", "CC Outbound", "CC Redes Sociales", "Ret Sucursales", "Cambaceo", "Cambaceo EI", "Modulos", "CV Sucursales", "Distribuidor", "Comisionistas", "Web", "Call Center"],
 requisitos: [
 "Cliente debe tener servicios activos de video, internet o telefonía fija con antigüedad mayor a 3 meses",
 "No aplica para single play móvil",
 "No aplica a cuentas subtipo empleado",
 "No aplica para clientes con servicios activos wizz",
 "Aplica hasta 5 líneas",
 ],
 productosRestringidos: [
 "internet SP 40 Mbps_R", "izzi_100_R", "izzi 20_R", "izzi_130_R",
 "izzi negocios 2_0 25", "izzi negocios", "izzi Unlimited 30 1S_R",
 "izzi 130 + izzitv HD_R", "izzi 40 + izzitv HD_R", "Internet 40 M",
 "izzi 40 + izzitv HD FTTH_R", "Internet 60 M", "izzi 50 + PackTV NxtGen_R",
 "Internet 80 M", "izzi_50_R", "Internet 150 M", "izzi 80 + izzitv HD_R",
 "wizzplus_20 + wizzplus TV", "izzi 80 + izzitv HD FTTH_R",
 ],
 siebel: "Promo especial movil 5 $99 durante 12 meses → -$21.00",
 },
 {
 id: "AC1150",
 nombre: "Promo móvil comparte datos_12M $270 x 12 meses",
 plan: "izzi móvil Comparte tus datos 12 meses",
 precioPromo: 270,
 descuento: 30,
 vigencia: "01 de marzo al 31 de mayo de 2026",
 duracionDescuento: "12 meses",
 descuentoAdicionalPortabilidad: 53,
 ahorroPotencial: 996,
 canales: ["Sucursal", "Sucursal VR", "Cambaceo", "Cambaceo EI", "Cambaceo Tablet", "Cambaceo VR", "Modulos", "Modulos VR", "Distribuidor", "Comisionistas"],
 requisitos: [
 "Clientes nuevos: deben contratar en el mismo flujo servicio fijo + móvil",
 "Clientes existentes: con servicios activos de video, internet o telefonía fija",
 "Aplica cuentas Residencial y Negocios",
 "No aplica para clientes SP móvil",
 "No aplica para cuentas subtipo empleado",
 "Aplica hasta 5 líneas",
 ],
 conviveCon: "Promoción portabilidad de móvil",
 siebel: "Promo móvil comparte datos_12M $270 x 12 meses → -$30.00",
 },
];

// ─────────────────────────────────────────────
// 7. PROMOCIONES FIJAS – DESCUENTO EN PAQUETES (AC 878 V48)
// Vigencia: hasta 31 de marzo 2026
// ─────────────────────────────────────────────
export const PROMO_DESCUENTO_PAQUETES = {
 vigencia: "31 de marzo 2026",
 clientesTipo: "Nuevos",
 segmentos: ["Residencial", "Negocios"],
 reglas: [
 "No aplica en paquetes con productos de izzi móvil",
 "No aplica a empleados",
 "El descuento se da de baja si el cliente modifica su paquete principal",
 "Aplica mismos montos al agregar Streaming y/o complementos",
 ],
 residencial: {
 "2P": {
 mesesDescuento: 3,
 tabla: [
 { paquete: "izzi 60", precioLista: 389, descuento: 40, precioPromo: 349 },
 { paquete: "izzi 80", precioLista: 480, descuento: 51, precioPromo: 429 },
 { paquete: "izzi 100", precioLista: 540, descuento: 81, precioPromo: 459 },
 { paquete: "izzi 150", precioLista: 640, descuento: 101, precioPromo: 539 },
 { paquete: "izzi 200", precioLista: 700, descuento: 101, precioPromo: 599 },
 { paquete: "izzi 500", precioLista: 820, descuento: 101, precioPromo: 719 },
 { paquete: "izzi 1000", precioLista: 1020, descuento: 101, precioPromo: 919 },
 ],
 },
 "3P": {
 mesesDescuento: 6,
 tabla: [
 { paquete: "izzi 60 + izzitv HD", precioLista: 539, descuento: 40, precioPromo: 499 },
 { paquete: "izzi 80 + izzitv HD", precioLista: 630, descuento: 51, precioPromo: 579 },
 { paquete: "izzi 100 + izzitv HD", precioLista: 720, descuento: 81, precioPromo: 639 },
 { paquete: "izzi 150 + izzitv HD", precioLista: 820, descuento: 101, precioPromo: 719 },
 { paquete: "izzi 200 + izzitv HD", precioLista: 880, descuento: 101, precioPromo: 779 },
 { paquete: "izzi 500 + izzitv HD", precioLista: 1000, descuento: 101, precioPromo: 899 },
 { paquete: "izzi 1000 + izzitv HD", precioLista: 1200, descuento: 101, precioPromo: 1099 },
 ],
 },
 },
 negocios: {
 "2P": {
 mesesDescuento: 3,
 tabla: [
 { paquete: "izzi negocios 60", precioLista: 439, descuento: 40, precioPromo: 399 },
 { paquete: "izzi negocios 80", precioLista: 530, descuento: 51, precioPromo: 479 },
 { paquete: "izzi negocios 100", precioLista: 590, descuento: 81, precioPromo: 509 },
 { paquete: "izzi negocios 150", precioLista: 690, descuento: 101, precioPromo: 589 },
 { paquete: "izzi negocios 200", precioLista: 750, descuento: 101, precioPromo: 649 },
 { paquete: "izzi negocios 500", precioLista: 870, descuento: 101, precioPromo: 769 },
 { paquete: "izzi negocios 1000", precioLista: 1070, descuento: 101, precioPromo: 969 },
 ],
 },
 "3P": {
 mesesDescuento: 6,
 tabla: [
 { paquete: "izzi negocios 60 + izzitv HD", precioLista: 589, descuento: 40, precioPromo: 549 },
 { paquete: "izzi negocios 80 + izzitv HD", precioLista: 680, descuento: 51, precioPromo: 629 },
 { paquete: "izzi negocios 100 + izzitv HD", precioLista: 770, descuento: 81, precioPromo: 689 },
 { paquete: "izzi negocios 150 + izzitv HD", precioLista: 870, descuento: 101, precioPromo: 769 },
 { paquete: "izzi negocios 200 + izzitv HD", precioLista: 930, descuento: 101, precioPromo: 829 },
 { paquete: "izzi negocios 500 + izzitv HD", precioLista: 1050, descuento: 101, precioPromo: 949 },
 { paquete: "izzi negocios 1000 + izzitv HD", precioLista: 1250, descuento: 101, precioPromo: 1149 },
 ],
 },
 },
 exclusiones: [
 "60 y 80MB no aplican para Acapulco (ver AC 987)",
 "100MB no aplica para: Acapulco, Aguascalientes, Amecameca, Campeche, Celaya, Chalco, Chihuahua, Chilpancingo, Chimalhuacán, Ciudad Juárez, Coatzacoalcos, Córdoba, Cuautla, Cuernavaca, Ensenada, Fortín, HUB Aragón, Irapuato, Ixtapaluca, Los Reyes Acaquilpan, Los Reyes Acozac, Mexicali, Nezahualcóyotl, Ojo de Agua, San Buenaventura, San Luis Potosí, San Martín Texmelucan, San Vicente Chicoloapan, Tecámac, Teolocholco, Texcoco, Tlaxcala, Xico y Yautepec (ver AC 1034)",
 "150MB no aplica para HUB Polanco y Monterrey (ver AC 1017)",
 ],
};

// ─────────────────────────────────────────────
// 8. MEGAS ADICIONALES (AC 878 V48)
// Vigencia: hasta 31 de marzo 2026
// ─────────────────────────────────────────────
export const PROMO_MEGAS_ADICIONALES = {
 vigencia: "31 de marzo 2026",
 clientesTipo: "Nuevos",
 segmentos: ["Residencial", "Negocios"],
 duracion: "6 meses (meses 1 al 6)",
 nota: "NO seleccionar el complemento 'Beneficio' manualmente en la OS — se agrega automático",
 aplica: "Nacional (con exclusiones)",
 noAplicaConMovil: true,
 aplicaEmpleados: true,
 tabla: [
 { paquetes: ["izzi 60", "izzi 60 + izzitv HD"], megasFinales: 80, complementoSiebel: "Beneficio 80 M" },
 { paquetes: ["izzi 80", "izzi 80 + izzitv HD"], megasFinales: 120, complementoSiebel: "Beneficio 120 M" },
 { paquetes: ["izzi 100", "izzi 100 + izzitv HD"], megasFinales: 150, complementoSiebel: "Beneficio 150 M" },
 { paquetes: ["izzi 150", "izzi 150 + izzitv HD"], megasFinales: 200, complementoSiebel: "Beneficio 200 M" },
 { paquetes: ["izzi 200", "izzi 200 + izzitv HD"], megasFinales: 300, complementoSiebel: "Beneficio 300 M" },
 { paquetes: ["izzi 500", "izzi 500 + izzitv HD"], megasFinales: 600, complementoSiebel: "Beneficio 600 M" },
 ],
 exclusiones: [
 "100MB: mismas plazas excluidas que en descuento paquetes",
 "150MB no aplica para Monterrey y HUB Polanco",
 "200, 300 y 600 megas finales sujetos a cobertura Axtel, FTTH o DOCSIS 3.1",
 ],
};

// ─────────────────────────────────────────────
// 9. EXTENSIONES DE TV (AC 878 V48)
// ─────────────────────────────────────────────
export const PROMO_EXTENSIONES_TV = {
 vigencia: "31 de marzo 2026",
 clientesTipo: "Nuevos y existentes",
 segmentos: ["Residencial", "Negocios"],
 precioLista: 115,
 precioPromo: 79,
 descuento: 36,
 maxExtensiones: 3,
 aplicaPara: "SP izzitv HD y todos los paquetes 3P con izzitv HD",
 aplicaConMovil: true,
 nota: "Si requiere 4+ extensiones, sugerir cuenta PyME",
 prohibido: [
 "Cancelar extensiones actuales para reactivarlas con promo",
 "Contratar más extensiones de las permitidas",
 ],
};

// ─────────────────────────────────────────────
// 10. PAGO ANTICIPADO (AC 1023 V23)
// Vigencia: hasta 31 de marzo 2026
// ─────────────────────────────────────────────
export const PROMO_PAGO_ANTICIPADO = {
 vigencia: "31 de marzo 2026",
 clientesTipo: "Nuevos",
 aplica: "Solo en el primer mes",
 nota: "Del mes 2 en adelante aplican las promociones de descuento correspondientes (RPT)",
 variantes: [
 {
 monto: 300,
 play: ["3P", "3PM"],
 velocidades: [80, 100, 150, 200, 500, 1000],
 canales: "Todos excepto referido 'Call Center'",
 exclusionesPlaza: {
 "80y100MB": ["Acapulco", "Celaya", "Chetumal", "Cholula", "Coatzacoalcos", "El Salto", "Ensenada", "Guadalajara", "Mérida", "Nanchital", "Progreso", "Rosarito", "Tala", "Tecate", "Tehuacán", "Tijuana", "Tlajomulco", "Tlaquepaque", "Tonalá", "Umán", "Zapopan"],
 },
 tablaResidencial: [
 { paquete: "izzi 80 + izzitv HD", precioLista: 630, pagoMes1: 300 },
 { paquete: "izzi 100 + izzitv HD", precioLista: 720, pagoMes1: 300 },
 { paquete: "izzi 150 + izzitv HD", precioLista: 820, pagoMes1: 300 },
 { paquete: "izzi 200 + izzitv HD", precioLista: 880, pagoMes1: 300 },
 { paquete: "izzi 500 + izzitv HD", precioLista: 1000, pagoMes1: 300 },
 { paquete: "izzi 1000 + izzitv HD", precioLista: 1200, pagoMes1: 300 },
 ],
 tablaResidencialMovil: [
 { movil: "izzi móvil 5 12 meses", precioMovil: 120, pagoTotal: 420 },
 { movil: "izzi móvil 10 12 meses", precioMovil: 150, pagoTotal: 450 },
 { movil: "izzi móvil 10", precioMovil: 180, pagoTotal: 480 },
 { movil: "izzi móvil 20", precioMovil: 250, pagoTotal: 550 },
 { movil: "izzi móvil Comparte tus datos 12 meses", precioMovil: 300, pagoTotal: 600 },
 { movil: "izzi móvil Comparte tus datos", precioMovil: 350, pagoTotal: 650 },
 { movil: "izzi móvil Plan Familiar", precioMovil: 450, pagoTotal: 750 },
 ],
 },
 {
 monto: 100,
 play: ["2P", "2PM", "3P", "3PM"],
 velocidades: [60, 80, 100],
 canales: "Todos excepto referido 'Call Center'",
 aplica: "Solo en RPTs: Celaya, Chetumal, Cholula, Coatzacoalcos, El Salto, Ensenada, Guadalajara, Mérida, Nanchital, Progreso, Rosarito, Tala, Tecate, Tehuacán, Tijuana, Tlajomulco, Tlaquepaque, Tonalá, Uman y Zapopan",
 tablaResidencial: [
 { paquete: "izzi 60", precioLista: 389, pagoMes1: 100 },
 { paquete: "izzi 80", precioLista: 480, pagoMes1: 100 },
 { paquete: "izzi 100", precioLista: 540, pagoMes1: 100 },
 { paquete: "izzi 60 + izzitv HD", precioLista: 539, pagoMes1: 100 },
 { paquete: "izzi 80 + izzitv HD", precioLista: 630, pagoMes1: 100 },
 { paquete: "izzi 100 + izzitv HD", precioLista: 720, pagoMes1: 100 },
 ],
 },
 ],
};

// ─────────────────────────────────────────────
// 11. PROMOCIONES EXCLUSIVAS 100MB (AC 1034 V18)
// Vigencia: hasta 31 de marzo 2026
// ─────────────────────────────────────────────
export const PROMO_100MB = {
 vigencia: "31 de marzo 2026",
 plazasAplicables: [
 "Aguascalientes", "Amecameca", "Campeche", "Celaya", "Chalco", "Chihuahua",
 "Chilpancingo", "Chimalhuacán", "Ciudad Juárez", "Coatzacoalcos", "Córdoba",
 "Cuautla", "Cuernavaca", "Ensenada", "Fortín", "HUB Aragón", "Irapuato",
 "Ixtapaluca", "Los Reyes Acaquilpan", "Los Reyes Acozac", "Mexicali",
 "Nezahualcóyotl", "Ojo de Agua", "San Buenaventura", "San Luis Potosí",
 "San Martín Texmelucan", "San Vicente Chicoloapan", "Tecámac", "Teolocholco",
 "Texcoco", "Tlaxcala", "Xico", "Yautepec",
 ],
 descuentoPaquetes: {
 monto: 91,
 play: ["2P", "2PM", "3P", "3PM"],
 residencial: {
 "2P y 2PM": [
 { paquete: "izzi 100", precioLista: 540, precioPromo: 449 },
 { paquete: "izzi 100 + izzitv HD", precioLista: 720, precioPromo: 629 },
 ],
 "3P y 3PM": [
 { paquete: "izzi 100", precioLista: 540, precioPromo: 449 },
 { paquete: "izzi 100 + izzitv HD", precioLista: 720, precioPromo: 629 },
 ],
 },
 aplica: "Desde mes 1, mientras no haya cambios en el paquete",
 noAplicaEmpleados: true,
 aplicaConMovil: true,
 },
 megasAdicionales: {
 megasFinales: 150,
 tipo: "Simétricos",
 duracion: "Meses 1 al 12",
 red: "Solo en domicilios con cobertura FTTH",
 complementoSiebel: "Beneficio 150 M",
 noAplicaConMovil: true,
 aplicaEmpleados: true,
 advertencia: "NO seleccionar el complemento 'Beneficio' manualmente en la OS",
 },
};

// ─────────────────────────────────────────────
// 12. PROMOCIONES PLAZAS ESPECIALES (AC 1016 V19)
// Vigencia: hasta 27 de febrero 2026 (EXPIRADA – solo referencia)
// ─────────────────────────────────────────────
export const PROMO_PLAZAS_ESPECIALES = {
 vigencia: "31 de marzo 2026",
 estado: "VIGENTE",
 nota: "Promoción vigente hasta el 31 de marzo de 2026 para plazas especiales. Aplica descuentos en paquetes 2P, 2PM, 3P y 3PM de 60 y 80MB, más ViX Premium en paquetes de 60MB.",
 play: ["2P", "2PM", "3P", "3PM"],
 velocidades: [60, 80],
 clientesTipo: "Nuevos",
 segmentos: ["Residencial", "Negocios"],
 descuentos: {
 residencial: [
 { play: "2P", paquete: "izzi 60", precioLista: 389, descuento: 60, precioPromo: 329 },
 { play: "2P", paquete: "izzi 80", precioLista: 510, descuento: 101, precioPromo: 409 },
 { play: "3P", paquete: "izzi 60 + izzitv HD", precioLista: 539, descuento: 60, precioPromo: 479 },
 { play: "3P", paquete: "izzi 80 + izzitv HD", precioLista: 690, descuento: 101, precioPromo: 589 },
 ],
 negocios: [
 { play: "2P", paquete: "izzi negocios 60", precioLista: 439, descuento: 60, precioPromo: 379 },
 { play: "2P", paquete: "izzi negocios 80", precioLista: 560, descuento: 101, precioPromo: 459 },
 { play: "3P", paquete: "izzi negocios 60 + izzitv HD", precioLista: 589, descuento: 60, precioPromo: 529 },
 { play: "3P", paquete: "izzi negocios 80 + izzitv HD", precioLista: 740, descuento: 101, precioPromo: 639 },
 ],
 },
 vixPremium: {
 aplica: "Paquetes 2P, 2PM, 3P y 3PM de 60 megas",
 duracion: "12 meses sin costo, baja automática mes 13",
 advertencia: "NO seleccionar ViX Premium en el configurador — se otorga automáticamente",
 },
 reglas: [
 "El descuento aplica desde el mes 1 y mientras no haya cambios en el paquete principal",
 "Aplica mismos montos al agregar Streaming y/o complementos",
 "Aplica también en paquetes con productos de izzi móvil",
 "No aplica a empleados",
 ],
 plazas: [
 "Amealco", "Buctzotz", "Chemax", "Chetumal", "Cobá", "Cosoleacaque",
 "Cuauhtémoc", "Delicias", "Espita", "Izamal", "Jáltipan", "Minatitlán",
 "Motul", "Oaxaca", "Pachuca", "Poza Rica", "San Juan del Río", "Temax",
 "Temozón", "Tepeji del Río", "Tizimín", "Tula", "Tulancingo", "Tuxpam",
 "Valladolid", "Zacatecas",
 ],
};

// ─────────────────────────────────────────────
// 13A. COMPLEMENTO VIX PREMIUM MUNDIAL 2026
// Fuente: Lanzamiento ViX Premium Mundial
// Disponibilidad: Desde 7 de enero 2026
// ─────────────────────────────────────────────
export const PROMO_VIX_MUNDIAL_2026 = {
 nombre: "Complemento ViX Premium Mundial 2026",
 descripcion: "Acceso a TODOS los partidos del Mundial (48 selecciones) en México, EUA y Canadá.",
 disponibleDesde: "7 de enero 2026",
 clientesTipo: ["Nuevos", "Existentes"],
 segmentos: ["Residencial", "Negocios", "wizz"],
 tipo: "Complemento OTT – no incluye canales de TV",
 requiereVixPremiumActivo: true,
 sinPlazoForzoso: true,
 vigencias: [
  { periodo: "Enero–Febrero 2026",    pagos: 4, montoPorPago: 99.99,  total: 399.99 },
  { periodo: "Marzo–Abril 2026",      pagos: 3, montoPorPago: 199.99, total: 599.99 },
  { periodo: "Mayo–Junio 2026",       pagos: 1, montoPorPago: 799,    total: 799    },
 ],
 reglasCriticas: [
  "Es un complemento OTT: no incluye canales lineales de televisión.",
  "El cliente DEBE tener ViX Premium activo para poder adquirir este complemento.",
  "No tiene plazo forzoso — el cliente puede cancelar en cualquier momento.",
  "Disponible para clientes nuevos y existentes de Residencial, Negocios y wizz.",
  "El precio cambia según el mes de contratación (ver tabla de vigencias).",
 ],
 gancho_ventas: "Si el cliente menciona fútbol, deportes o el Mundial, usar este complemento como gancho de cierre. Ejemplo: '¿Sabes que con tu paquete puedes ver TODOS los partidos del Mundial 2026 desde el primer día?'",
};

// ─────────────────────────────────────────────
// 13B. PROMOCIONES ESPECIALES AC 1165
// Vigencia: 18 de marzo al 12 de abril 2026
// Canal: CC Outbound Digital (salvo indicación)
// ─────────────────────────────────────────────
export const PROMO_AC1165 = {
 ac: "AC 1165",
 vigencia: "18 de marzo al 12 de abril de 2026",
 estado: "VIGENTE",
 canal: "CC Outbound Digital",

 // ── Paquete 2P 80MB ───────────────────────────────────────────────
 paquete2P_80MB: {
  nombre: "izzi 80 (2P) – Promo CC Outbound Digital",
  precioLista: 480,
  descuentoMeses1a3: 51,
  precioMeses1a3: 429,
  descuentoMes4enAdelante: 31,
  precioMes4enAdelante: 449,
  nota: "Aplica SOLO para CC Outbound Digital.",
 },

 // ── Streaming de regalo (12 meses) ─────────────────────────────────
 streamingRegalo: {
  nota: "Streaming incluido sin costo por 12 meses al contratar o migrar. Baja automática mes 13.",
  hboMaxBasico: {
   incluido: true,
   velocidadRequerida: "80 MB",
   play: ["Residencial 2P", "Negocios 2P"],
   canal: "CC Outbound Digital",
   descripcion: "HBO Max Básico (con anuncios) incluido 12 meses al contratar/migrar a 80MB.",
  },
  disneyPlusEstandar: {
   incluido: true,
   velocidadRequerida: "100 MB",
   play: ["Residencial 2P", "Negocios 2P"],
   canal: "CC Outbound Digital",
   descripcion: "Disney+ Estándar (con anuncios) incluido 12 meses al contratar/migrar a 100MB.",
  },
 },

 // ── Paquetes 3P con descuento desde mes 1 ──────────────────────────
 paquetes3P: [
  {
   nombre: "izzi 60 + izzitv HD",
   precioLista: 539,
   descuento: 60,
   precioPromo: 479,
   aplicaDesde: "Mes 1",
   canalesTV: 100,
  },
  {
   nombre: "izzi 80 + izzitv HD",
   precioLista: 630,
   descuento: 51,
   precioPromo: 579,
   aplicaDesde: "Mes 1",
   canalesTV: 100,
  },
 ],

 reglasCriticas: [
  "Las promociones de AC 1165 aplican SOLO para el canal CC Outbound Digital.",
  "El streaming de HBO Max y Disney+ se otorga automáticamente — NO seleccionar manualmente en el configurador.",
  "80MB: HBO Max Básico incluido 12 meses sin costo.",
  "100MB: Disney+ Estándar incluido 12 meses sin costo.",
  "Los paquetes 3P de 60MB y 80MB tienen descuento desde el mes 1 (no solo 3 o 6 meses).",
  "Vigencia estricta: 18 de marzo al 12 de abril 2026.",
 ],

 guion_ventas: {
  para80MB: "Con tu paquete izzi 80 tienes HBO Max incluido gratis por un año entero — series, películas, todo en alta definición. Solo pagarías $429 los primeros 3 meses y $449 después.",
  para100MB: "Con izzi 100MB llevas Disney+ incluido gratis por 12 meses además de tu internet de alta velocidad.",
  para3P: "Además del internet, con TV incluida desde $479 en 60MB y $579 en 80MB — precio especial desde el primer mes.",
 },
};

// ─────────────────────────────────────────────
// 13. COBERTURA Y REDES
// ─────────────────────────────────────────────
export const COBERTURA_REDES = {
 HFC: { maxMegas: 150 },
 Axtel: { maxMegas: 200 },
 DOCSIS31: { maxMegas: 500 },
 FTTH: { maxMegas: 1000, simetrico: true, nota: "La velocidad de subida = velocidad de bajada" },
};

// ─────────────────────────────────────────────
// 14. COMPLEMENTOS ADICIONALES DE VIDEO (AC 876)
// ─────────────────────────────────────────────
export const COMPLEMENTOS_VIDEO = [
 "ViX Premium", "Sky Sports", "HBO Max", "Netflix", "Disney+", "Apple TV",
 "ViX Premium FIFA", "Sony One", "Universal+", "Paramount+",
 "Qello Concerts by Stingray", "Stingray Karaoke", "NBA League Pass",
 "edye", "DogTV", "Fox Sports Premium", "Hotpack", "Hazlo Internacional",
];

// ─────────────────────────────────────────────
// 15. PAQUETES CON STREAMING INCLUIDO (AC 876)
// ─────────────────────────────────────────────
export const PAQUETES_STREAMING = {
 "60MB": {
 nota: "Elige entre 1, 2 o 3 streamings adicionales",
 opciones1streaming: [
 { combo: "ViX Premium", costoExtra: 60 },
 { combo: "Netflix Estándar", costoExtra: 100 },
 ],
 opciones2streamings: [
 { combo: "ViX + Netflix Estándar", costoExtra: 160 },
 { combo: "ViX + Netflix Estándar", costoExtra: 280 },
 { combo: "ViX + Netflix Estándar", costoExtra: 360 },
 { combo: "ViX + Netflix Estándar", costoExtra: 190 },
 ],
 opciones3streamings: [
 { combo: "ViX + Netflix + HBO Max", costoExtra: 290 },
 { combo: "ViX + Netflix + HBO Max", costoExtra: 410 },
 { combo: "ViX + Netflix + HBO Max", costoExtra: 490 },
 ],
 },
 "80MBenAdelante": {
 nota: "Elige entre 2 o 3 streamings adicionales",
 opciones2streamings: [
 { combo: "ViX + Netflix Estándar", costoExtra: 100 },
 { combo: "ViX + Netflix Estándar", costoExtra: 220 },
 { combo: "ViX + Netflix Estándar", costoExtra: 300 },
 { combo: "ViX + Netflix Estándar", costoExtra: 130 },
 ],
 opciones3streamings: [
 { combo: "ViX + Netflix + HBO Max", costoExtra: 230 },
 { combo: "ViX + Netflix + HBO Max", costoExtra: 350 },
 { combo: "ViX + Netflix + HBO Max", costoExtra: 430 },
 ],
 },
};

// ─────────────────────────────────────────────
// 16. COMPLEMENTO LÍNEA ADICIONAL DE TELEFONÍA (AC 876)
// ─────────────────────────────────────────────
export const LINEA_ADICIONAL_TELEFONIA = {
 precioMes: 50,
 maxLineas: 3, // adicionales (total 4 con la principal)
 incluye: [
 "Llamadas ilimitadas a fijos y celulares de todo México",
 "Llamadas ilimitadas a fijos y celulares de EUA y Canadá",
 "Llamadas ilimitadas a fijos y celulares de Europa",
 "Desde $1.10/min al resto del mundo",
 "Soluciones digitales incluidas",
 ],
};

// ─────────────────────────────────────────────
// 16B. IZZITV+ Y IZZITV+ PREMIUM (AC 1058 V9)
// ─────────────────────────────────────────────
export const PROMO_IZZITV_PLUS = {
 ac: "AC 1058 v9",
 vigencia: "31 de marzo 2026", // Confirmado activo por operador — documento base indica 28 feb 2026
 estado: "VIGENTE",
 cobertura: "Nacional",
 clientesTipo: "Nuevos",
 segmento: "Residencial",
 canales: "Todos",
 oferta: "izzi modular wow (Ladrillos) / Portafolio Productos Off / ON Net izzi",

 // ── IZZITV+ (versión base) ─────────────────────────────────────────
 izzitv_plus: {
 descripcion: "Servicio de TV con Android TV, 200 canales (85 HD), izzi go, perfil por miembro, renta de contenido, Sky Sports, LaLiga, Bundesliga",
 precioLista: 299,
 precioPromo: 249,
 descuento: 50,
 duracionPromo: "3 meses (meses 1 al 3)",
 precioMes4enAdelante: 299,
 vigenciaPromo: "16 de julio 2025 – 31 de marzo 2026",
 canalesIncluidos: 200,
 canalesHD: 85,
 incluyeSkyLiga: true,
 incluyeIzziGo: true,
 reglas: [
 "Aplica para clientes que contraten izzitv+ en Single Play o con paquete de izzi móvil",
 "NO aplica para clientes que contraten paquete 2P + izzitv+",
 "Solo clientes nuevos, segmento residencial",
 "El descuento se da de baja automáticamente si el cliente modifica el paquete durante los 3 meses",
 "A partir del mes 4 paga precio de lista $299/mes",
 "Aplica también en paquetes con productos de izzi móvil",
 "No aplica a empleados",
 "Aplica domiciliación y portabilidad",
 ],
 tablaConMovil: [
 { movil: "–", precioLista: 299, precioPromo: 249 },
 { movil: "izzi móvil 5GB (12 meses)", precioLista: 419, precioPromo: 369 },
 { movil: "izzi móvil 10GB (12 meses)", precioLista: 449, precioPromo: 399 },
 { movil: "izzi móvil 10GB", precioLista: 479, precioPromo: 429 },
 { movil: "izzi móvil 20GB", precioLista: 519, precioPromo: 499 },
 { movil: "izzi móvil Comparte tus datos 12m", precioLista: 599, precioPromo: 549 },
 { movil: "izzi móvil Comparte tus datos", precioLista: 649, precioPromo: 599 },
 { movil: "izzi móvil Plan Familiar", precioLista: 749, precioPromo: 699 },
 ],
 },

 // ── IZZITV+ PREMIUM ───────────────────────────────────────────────
 izzitv_plus_premium: {
 descripcion: "TV premium con Android TV exclusivo, 200 canales, ViX Premium + HBO Max + Paramount+ + Apple TV + Sky Sports + LaLiga + Bundesliga + F1 durante 12 meses",
 precioPromo: 399,
 duracionPromo: "3 meses (meses 1 al 3)",
 precioMes4enAdelante: 499,
 vigenciaPromo: "10 de noviembre 2025 – 31 de marzo 2026",
 canalesIncluidos: 200,
 streamingIncluido12Meses: ["ViX Premium", "HBO Max", "Paramount+", "Apple TV", "Sky Sports", "LaLiga", "Bundesliga", "Fórmula 1"],
 requiereInternet: true,
 velocidadMinimaRecomendada: "20 Mbps por equipo de video",
 equipos: "Android TV de izzi exclusivo para este producto",
 extensionesTV: {
 ciudadesIzzi: { costo: 79, maxExtensiones: 1 },
 ciudadesWizzPM: { costo: 79, maxExtensiones: 3 },
 },
 reglas: [
 "Promoción aplicable SOLO para izzitv+ Premium en Single Play (SP)",
 "El domicilio DEBE tener conexión a internet activa (cualquier proveedor)",
 "Velocidad mínima recomendada: 20 Mbps por cada equipo de video",
 "Se instala con equipos Android TV de izzi, exclusivos para este producto",
 "izzitv+ Premium NO es compatible ni puede coexistir con otros servicios principales de video",
 "Off Net: el instalador autorizado realiza la instalación directamente",
 "On Net: la venta aplica pero la instalación la coordina izzi",
 ],
 ventajaOffNet: "Disponible en zonas sin cobertura de internet izzi — funciona con internet de cualquier compañía",
 municipiosYucatanOffNet: [
 "Telchac Puerto (97407)", "Telchac Pueblo (97400)", "Dzilam de Bravo (97606)",
 "Dzilam González (97600)", "San Felipe (97616)", "Río Lagartos (97720, 97723)",
 "Sinanché (97420, 97424)", "Yobaín (97425, 97426)", "Dzemul (97404–97406)",
 "Chicxulub Pueblo (97340)", "Hunucmá (97350, 97353, 97356)", "Celestún (97367)",
 "Dzoncauich (97646, 97647)",
 ],
 },

 advertenciasBot: [
 "Antes de confirmar instalación de izzitv+ Premium: preguntar velocidad de internet del cliente (mínimo 20 Mbps)",
 "izzitv+ Premium NO convive con otro servicio de video — verificar si el cliente ya tiene TV de paga",
 "En zonas Off Net: confirmar que el instalador cubre el municipio antes de agendar",
 "No confundir izzitv+ (base, $249 promo) con izzitv+ Premium ($399 promo) — son productos distintos",
 ],
};

// ─────────────────────────────────────────────
// 17. REGLAS GENERALES DEL BOT
// ─────────────────────────────────────────────
export const REGLAS_BOT = {
 ceroAlucinaciones: true,
 fallbackResponse: "Déjame consultar para darte la información exacta.",
 instrucciones: [
 "Solo ofrecer productos, precios y promociones que aparecen en esta base de conocimiento.",
 "Verificar siempre la vigencia de la promoción antes de ofrecerla.",
 "Si el cliente está en una plaza excluida, informarlo claramente y ofrecer la alternativa disponible.",
 "Para clientes móvil: validar si son existentes con servicios fijos para aplicar promoción correcta.",
 "No inventar descuentos, plazos ni beneficios no documentados.",
 "Si el cliente pregunta por NBA League Pass: indicar que ya no está disponible desde el 28 de febrero 2026.",
 "Para ViX Premium, HBO Max y Disney+: NO pedir que se seleccione en el configurador; se otorga automáticamente.",
 "Para Megas adicionales: NO pedir que se seleccione el complemento 'Beneficio'; se agrega automáticamente.",
 "Máximo 3 extensiones de TV por cuenta residencial o negocios.",
 "Para izzitv+ Premium Off Net: SIEMPRE verificar velocidad de internet antes de confirmar instalación (mínimo 20 Mbps).",
 "izzitv+ Premium NO puede coexistir con otro servicio de video activo en el mismo domicilio.",
 "CLIENTES ACTIVOS: Si el cliente ya tiene servicio izzi activo y pide aplicar una nueva promoción, reportar un problema, una queja o pagar su recibo, responder: 'Este número es exclusivo para contrataciones nuevas. Para cualquier gestión en tu servicio actual, comunícate al 800-120-5000.' NO tramitar nada para clientes con servicio activo EXCEPTO: ofrecerles una línea izzi móvil adicional si no la tienen.",
 "ÚNICO UPSELL PARA CLIENTES ACTIVOS: La única gestión permitida con clientes que ya tienen izzi es ofrecerles izzi móvil. Cualquier otra solicitud (cambio de paquete, queja, pago, promo nueva sobre servicio existente) debe redirigirse al 800-120-5000.",
 "MUNDIAL 2026: Si el cliente menciona fútbol, deportes, selección o Mundial, ofrecer el complemento ViX Premium Mundial 2026 como gancho de cierre.",
 "AC 1165 (18 mar – 12 abr 2026, CC Outbound Digital): En 80MB HBO Max básico incluido 12 meses; en 100MB Disney+ estándar incluido 12 meses.",
 "AC 1165 paquetes 3P (CC Outbound Digital): izzi 60+TV $479 y izzi 80+TV $579 con descuento desde el mes 1.",
 "En paquetes de 80MB y 100MB por CC Outbound Digital (AC 1165): el streaming YA VIENE INCLUIDO sin costo adicional por un año.",
 ],
 vigenciasActivas: {
 ofertaFija: "31 de marzo 2026",
 ofertaMovil: "31 de mayo 2026",
 pagoAnticipado: "31 de marzo 2026",
 descuentoPaquetes: "31 de marzo 2026",
 megasAdicionales: "31 de marzo 2026",
 extensionesTV: "31 de marzo 2026",
 promo100MB: "31 de marzo 2026",
 plazasEspeciales1016: "31 de marzo 2026",
 izzitv_plus_1058: "31 de marzo 2026",
 vixMundial2026: "Enero–Junio 2026 (precio escalonado por mes)",
 ac1165_OutboundDigital: "18 de marzo al 12 de abril 2026",
 },
 vigenciasExpiradas: {},
};

// ─────────────────────────────────────────────
// 18. HELPER – BUSCAR PRECIO DE PAQUETE
// ─────────────────────────────────────────────
/**
 * Retorna el precio de lista de un paquete fijo dado su nombre y segmento.
 * @param {string} nombrePaquete
 * @param {"residencial"|"negocios"} segmento
 * @param {"2P"|"3P"} play
 * @returns {number|null}
 */
export function getPrecioPaquete(nombrePaquete, segmento = "residencial", play = "2P") {
 const lista = PAQUETES_FIJOS[segmento]?.[play] ?? [];
 const paquete = lista.find(
 (p) => p.nombre.toLowerCase() === nombrePaquete.toLowerCase()
 );
 return paquete ? paquete.precio : null;
}

// ─────────────────────────────────────────────
// 19. HELPER – OBTENER PROMOCIÓN MÓVIL DISPONIBLE
// ─────────────────────────────────────────────
/**
 * Retorna las promociones móviles disponibles para un canal dado.
 * @param {string} canal Ej: "CC Inbound", "Sucursal"
 * @returns {Array}
 */
export function getPromosMovilPorCanal(canal) {
 return PROMOCIONES_MOVIL.filter((promo) =>
 promo.canales.some((c) => c.toLowerCase().includes(canal.toLowerCase()))
 );
}

// ─────────────────────────────────────────────
// 20. HELPER – VERIFICAR PLAZA PARA PROMO 100MB
// ─────────────────────────────────────────────
/**
 * @param {string} plaza
 * @returns {boolean}
 */
export function plazaAplicaPromo100MB(plaza) {
 return PROMO_100MB.plazasAplicables.some(
 (p) => p.toLowerCase() === plaza.toLowerCase()
 );
}

export default {
 META,
 PAQUETES_FIJOS,
 COMPLEMENTOS_INCLUIDOS,
 PLANES_MOVIL,
 PRECIOS_COMBO_RESIDENCIAL,
 PROMOCIONES_MOVIL,
 PROMO_DESCUENTO_PAQUETES,
 PROMO_MEGAS_ADICIONALES,
 PROMO_EXTENSIONES_TV,
 PROMO_PAGO_ANTICIPADO,
 PROMO_IZZITV_PLUS,
 PROMO_100MB,
 PROMO_PLAZAS_ESPECIALES,
 COBERTURA_REDES,
 COMPLEMENTOS_VIDEO,
 PAQUETES_STREAMING,
 LINEA_ADICIONAL_TELEFONIA,
 PROMO_VIX_MUNDIAL_2026,
 PROMO_AC1165,
 REGLAS_BOT,
 getPrecioPaquete,
 getPromosMovilPorCanal,
 plazaAplicaPromo100MB,
};

