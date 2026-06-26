const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('agentia_chatbot_ventas');
  
  const catalog = `AROMAS 50 ML: Azahar $51, Baby $48, Bambu $75, Bergamota $48, Blue Berry $49, Cafe $46, Calabaza $51, Canela $42, Canela Especial $111, Cempasuchil $63, Cera de Abeja $59, Cereza $54, Chicle $54, Citricos $62, Citronela $51, Clavo $49, Coco $52, Coco Especial $76, Chocolate $45, Chocolate-Cereza $42, Delicia Frutal $44, Durazno $50, Eucalipto $47, Flores $44, Fresa $49, Fresco(Pepino-Menta) $61, Gardenia $40, Geranio $53, Grosella $41, Guayaba $48, Hierbabuena $48, Incienso $64, Jazmin $57, Lavanda $58, Limon $52, Mandarina $71, Mandarina-Mango $62, Mandarina-Te Verde $73, Mango $49, Manzana $47, Manzana-Canela $47, Manzana Verde $51, Melon $62, Menta $61, Miel $76, Nardo $54, Naranja $59, Orange Spice $70, Palo Santo $67, Patchouly $59, Pina $49, Pino Navideno $61, Rosas $51, Rosa de Castilla $51, Romero $67, Sandalo $55, Sandia $49, Tarta de Manzana $71, Toronja $64, Uva $45, Vainilla $39, Verbena-Bergamota $64, Violeta $59

AROMAS 250 ML: Azahar $157, Baby $135, Bambu $230, Bergamota $148, Blue Berry $142, Cafe $142, Calabaza $157, Canela $128, Canela Especial $340, Cempasuchil $193, Cera de Abeja $182, Cereza $166, Chicle $166, Citricos $192, Citronela $157, Clavo $144, Coco $159, Coco Especial $233, Chocolate $140, Chocolate-Cereza $130, Delicia Frutal $136, Durazno $154, Eucalipto $145, Flores $136, Fresa $150, Fresco(Pepino-Menta) $187, Gardenia $123, Geranio $164, Grosella $119, Guayaba $148, Hierbabuena $148, Incienso $197, Jazmin $176, Lavanda $183, Limon $159, Mandarina $217, Mandarina-Mango $199, Mandarina-Te Verde $226, Mango $150, Manzana $145, Manzana-Canela $145, Manzana Verde $157, Melon $191, Menta $188, Miel $233, Nardo $166, Naranja $190, Orange Spice $215, Palo Santo $205, Patchouly $182, Pina $150, Pino Navideno $188, Rosas $156, Rosa de Castilla $158, Romero $206, Sandalo $169, Sandia $144, Tarta de Manzana $218, Toronja $198, Uva $137, Vainilla $113, Verbena-Bergamota $198, Violeta $182

BIOVELA: 50grs $84, 150grs $114, 300grs $150

CERAS: Abeja Natural KG $138, Coco KG $112, Soya BPF KG $85, Estampada x Hoja $50, Natural 250grs $30, Natural KG $88

COLORES ESTANDAR (CH/250gr/KG): Amarillo $73/$209/$696, Azul $115/$330/$1096, Blanco $35/$88/$250, Cafe $115/$330/$1096, Naranja $115/$330/$1096, Negro $124/$355/$1183, Rojo $115/$330/$1096, Rosa $73/$209/$696, Verde $115/$330/$1096, Violeta $115/$330/$1096

COLORES FOSFORESCENTES (CH/250gr/KG): Amarillo $143/$410/$1366, Azul $143/$410/$1366, Magenta $143/$410/$1366, Naranja $143/$410/$1366, Rosa $143/$410/$1366, Verde $143/$410/$1366, Violeta $143/$410/$1366

PARAFINAS: Gel 8% $106, Liquida $85, Malasia $92, Refinada China $55`;

  const systemPrompt = `Eres el asistente virtual de La Rueda Veladoras / BIOVELA, tienda artesanal mexicana de velas corporales, aromatizantes y materias primas para hacer velas. Tono: cálido, femenino, cercano y apasionado por las velas.

INSTRUCCIÓN ABSOLUTA: JAMÁS pidas Código Postal. JAMÁS prometas llamadas sin que el cliente lo pida.

UBICACIÓN: Gabriel Ramos Millán Sección Bramadero, Iztacalco, CDMX
WHATSAPP: +52 55 3448 9552
TELÉFONO: 55 5657 9035
INSTAGRAM: @laruedabiov
TIENDA: biovela2.mitiendanube.com

DÍAS DE RECOLECCIÓN PRESENCIAL: martes, jueves y sábados
ENVÍOS: WeShip a todo México

FLUJO DE VENTA:
1. Saluda calurosamente
2. Pregunta si busca velas terminadas, aromas, ceras, colores o parafinas
3. Recomienda según lo que necesita usando SOLO precios del catálogo oficial
4. Para cerrar: ofrece recolección presencial o envío
5. Para pago: dirige a tienda online o Clip

CUANDO NO SEPAS EL STOCK: di que verifiques disponibilidad y que escriban al WhatsApp

CATÁLOGO OFICIAL BIOVELA (precios en MXN):
${catalog}`;

  const knowledge = catalog;

  await db.collection('business_configs').updateOne(
    { clientId: 'biovela' },
    { $set: { clientId: 'biovela', model: 'gemini-2.0-flash', systemPrompt, knowledge, updatedAt: new Date() } },
    { upsert: true }
  );
  console.log('BIOVELA OK');
  await client.close();
}
main();
