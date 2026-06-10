const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('agentia_chatbot_ventas');
  
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
3. Recomienda según lo que necesita
4. Para cerrar: ofrece recolección presencial o envío
5. Para pago: dirige a tienda online o Clip

CUANDO NO SEPAS EL STOCK: di que verifiques disponibilidad y que escriban al WhatsApp`;

  const knowledge = `AROMAS 50 ML:
Durazno $50 | Chicle $54 | Azahar $51 | Fresa $49 | Citronela $51 | Cera de Abeja $59 | Hierbabuena $48 | Rosas $51 | Guayaba $48 | Café $46 | Grosella $39 | Cítricos $62 | Piña $49 | Mango $49 | Eucalipto $47 | Cempasúchil $63 | Incienso $64 | Clavo $47 | Violeta $59 | Sandía $47 | Fresco (Pepino-Menta) $61 | Patchouly $59 | Bergamota $48 | Romero $67 | Canela $42 | Miel $76 | Mandarina-Té Verde $73 | Baby $42 | Geranio $53 | Orange Spice $70 | Bambu $75 | Menta $61 | Sándalo $55 | Gardenia $40 | Mandarina-Mango $60 | Calabaza $51 | Jazmin $57 | Lavanda $58 | Rosa de Castilla $51 | Limon $52 | Naranja $59 | Palo Santo $67 | Melón $62 | Flores $44 | Coco $52 | Blue Berry $46 | Delicia Frutal $44 | Vainilla $37 | Verbena-Bergamota $64 | Manzana $47 | Coco Especial $76 | Tarta de Manzana $71 | Mandarina $71 | Grosella $39 | Canela Especial $111 | Nardo $54 | Chocolate $45 | Chocolate-Cereza $42 | Manzana Verde $51 | Manzana-Canela $47 | Galletas de Jengibre $59 | Pino Navideño $61 | Café $46 | Cereza $54 | Toronja $64

AROMAS 250 ML:
Toronja $198 | Jazmín $176 | Coco Especial $233 | Citronela $157 | Miel $233 | Manzana $145 | Clavo $144 | Naranja $181 | Manzana-Canela $145 | Bambu $230 | Fresa $150 | Chicle $166 | Eucalipto $145 | Cereza $166 | Manzana Verde $157 | Incienso $197 | Cempasúchil $193 | Cítricos $192 | Sandía $144 | Bergamota $148 | Canela Especial $340 | Mandarina-Té Verde $226 | Geranio $164 | Piña $150 | Calabaza $157 | Flores $136 | Menta $188 | Verbena-Bergamota $198 | Fresco (Pepino-Menta) $187 | Gardenia $123 | Lavanda $177 | Rosa de Castilla $158 | Orange Spice $215 | Limon $159 | Cera de Abeja $182 | Rosas $156 | Hierbabuena $148 | Delicia Frutal $136 | Mandarina $217 | Canela $128 | Grosella $119 | Guayaba $148 | Durazno $154 | Tarta de Manzana $218 | Pino Navideño $188 | Chocolate $140 | Nardo $166 | Melón $191 | Baby $130 | Mandarina-Té Verde $226 | Patchouly $182 | Manzana-Canela $145 | Violeta $182 | Sándalo $169 | Chocolate-Cereza $130 | Blue Berry $142 | Azahar $157 | Coco $159 | Toronja $198 | Palo Santo $205 | Uva $137 | Mango $150 | Café $142 | Romero $206 | Mandarina-Mango $185 | Vainilla $113 | Galletas de Jengibre $181

BIOVELA (vela corporal):
50 gms $84 | 150 gms $114 | 300 gms $150

CERAS:
Cera de Abeja Natural KG $138 | Cera de Soya BPF KG $85 | Cera Estampada de Abeja x hoja $50 | Cera Natural 250 grs $30 | Cera de Coco KG $112 | Cera Natural KG $88

COLORES 50 GR (CH):
Negro $124 | Blanco $35 | Azul $115 | Verde $115 | Violeta $115 | Naranja $115 | Café $115 | Rojo $115 | Rosa $73 | Amarillo $73 | Fosforescentes $143

COLORES 250 GR:
Negro $355 | Blanco $88 | Violeta $330 | Naranja $330 | Azul $330 | Rojo $330 | Verde $330 | Café $330 | Rosa $209 | Amarillo $209 | Fosforescentes $410

PARAFINAS:
Malasia $92 | Refinada China 58/60 $55 | Gel 8% $106 | Líquida $85`;

  await db.collection('business_configs').updateOne(
    { clientId: 'biovela' },
    { $set: { clientId: 'biovela', model: 'gemini-2.0-flash', systemPrompt, knowledge, updatedAt: new Date() } },
    { upsert: true }
  );
  console.log('BIOVELA OK');
  await client.close();
}
main();
