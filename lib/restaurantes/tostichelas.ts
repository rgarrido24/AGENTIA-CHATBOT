/**
 * Tostichelas — config de cliente. Los datos son EXACTAMENTE los que antes estaban dentro del motor
 * (`app.ts`); al sacarlos aquí el motor queda sin datos de ningún restaurante.
 */
import type { Insumo, Producto } from './tipos';
import type { RestauranteConfig } from './config';

const SAB:string[]=['Sandía','Fresa','Miguelito','Tajín','Piña Mango','Cereza','Mora Azul Truena Pop','Ajonjolí Caramelizado'];
const BMODS:any[]=[
 {g:'Preparado',req:false,prefix:true,opts:[{l:'Michelada',p:[5,10]},{l:'Cubana',p:[15,20]},{l:'Clamato',p:[20,25]}]},
 {g:'Vaso',req:false,prefix:true,opts:[{l:'Escarchado',p:[10,15]},{l:'Michelado',p:[20,25]},{l:'Cubano',p:[25,30]},{l:'Clamato',p:[35,50]}]},
 {g:'Sabor del escarchado',req:true,showIf:['Vaso','Escarchado'],opts:SAB.map(l=>({l,p:[0,0]}))}
];
const P=(o:any):Producto=>Object.assign({avail:true,mods:[],desc:''},o);
const T=(id:string,name:string,p1:number,p3:number,prot:Record<string,number>,desc?:string,torKey?:string)=>P({id,cat:'Tacos',name,desc:desc||'Servidos con papa y nopales',emoji:'🌮',station:'cocina',v:[{l:'Pza',p:p1,f:1,s:0},{l:'Orden (3 pzas)',p:p3,f:3,s:1}],use:Object.assign({[torKey||'tor']:1,nop:.03,pap:.05},prot)});
const B=(id:string,name:string,ins:string,h:number,mg:number)=>{const v:any[]=[];if(h)v.push({l:'1/2',p:h,f:1,s:0});if(mg)v.push({l:'Mega',p:mg,f:2,s:1});return P({id,cat:'Cervezas',name,emoji:'🍺',station:'barra',v,use:{[ins]:1},mods:BMODS,desc:(h&&!mg)?'Solo en 1/2':(!h?'Solo en Mega':'')})};
const MENU:Producto[]=[
 P({id:'tag',cat:'Tostadas',name:'Tostada de Aguachile',desc:'Cebolla morada, pepino, mayonesa y aguacate',emoji:'🥒',station:'cocina',v:[{l:'Tostada',p:78,f:1,s:0}],use:{tos:1,cam:.07,agu:.25}}),
 P({id:'tce',cat:'Tostadas',name:'Tostada de Ceviche de camarón',desc:'Servido con mayonesa y aguacate',emoji:'🦐',station:'cocina',v:[{l:'Tostada',p:78,f:1,s:0}],use:{tos:1,cam:.07,agu:.25}}),
 T('tbi','Taco de bistec',38,100,{bis:.07}),
 T('tpo','Taco de pollo',38,100,{pol:.07}),
 T('tlo','Taco de longaniza',38,100,{lon:.06}),
 T('tmi','Taco de milanesa de res',43,115,{mil:.08}),
 T('tca','Taco campechano',43,115,{bis:.04,lon:.03}),
 T('tar','Taco de arrachera',48,130,{arr:.07}),
 T('tcm','Taco de camarón',78,220,{cam:.08,agu:.1},'Camarón empanizado con mayonesa, cebolla, jitomate y aguacate en tortilla de harina','torh'),
 T('tcc','Camachera',80,230,{cam:.05,arr:.05},'Camarón, queso y arrachera en tortilla de harina','torh'),
 B('cor','Corona','cor',60,120),B('vic','Victoria','vic',60,120),B('pac','Pacífico','pac',60,120),B('xx','XX Lager','xx',60,120),
 B('ult','Ultra','ult',60,0),B('mod','Modelo','mod',60,0),B('leo','León','leo',0,120),
 P({id:'boi',cat:'Bebidas',name:'Boing',emoji:'🥤',station:'barra',v:[{l:'Botella',p:40,f:1,s:0}],use:{boi:1}}),
 P({id:'coc',cat:'Bebidas',name:'Coca Cola',emoji:'🥤',station:'barra',v:[{l:'Botella',p:40,f:1,s:0}],use:{coc:1}}),
 P({id:'min',cat:'Bebidas',name:'Agua mineral',emoji:'🥤',station:'barra',v:[{l:'Botella',p:40,f:1,s:0}],use:{min:1}}),
 P({id:'sue',cat:'Bebidas',name:'Suero',emoji:'🥤',station:'barra',v:[{l:'Botella',p:50,f:1,s:0}],use:{sue:1}}),
 P({id:'sug',cat:'Bebidas',name:'Suero grande',emoji:'🥤',station:'barra',v:[{l:'Grande',p:70,f:1,s:0}],use:{sue:2}}),
 P({id:'cln',cat:'Bebidas',name:'Clamato natural',emoji:'🍅',station:'barra',v:[{l:'Vaso',p:60,f:1,s:0}],use:{clm:.3}}),
 P({id:'ha',cat:'Snacks',name:'Hamburguesa',emoji:'🍔',station:'cocina',v:[{l:'Sola',p:90,f:1,s:0}],use:{pan:1,car:1}}),
 P({id:'hp',cat:'Snacks',name:'Hamburguesa con papas',desc:'Servida con papas a la francesa',emoji:'🍔',station:'cocina',v:[{l:'Con papas',p:110,f:1,s:0}],use:{pan:1,car:1,pap:.15}}),
 P({id:'pf',cat:'Snacks',name:'Papas a la francesa',desc:'Preparadas con salsas negras, limón y tajín',emoji:'🍟',station:'cocina',v:[{l:'Orden',p:60,f:1,s:0}],use:{pap:.25}}),
 P({id:'pr',cat:'Snacks',name:'Papas fritas',desc:'Preparadas con salsas negras, limón y tajín',emoji:'🍟',station:'cocina',v:[{l:'Orden',p:60,f:1,s:0}],use:{pap:.25}})
];
const CATS:string[]=['Tostadas','Tacos','Cervezas','Bebidas','Snacks'];
const CATCOL:Record<string,string>={Tostadas:'#7DBB86',Tacos:'#F29A4A',Cervezas:'#F2C14E',Bebidas:'#7FB2E5',Snacks:'#E2573A'};

const INS0:Insumo[]=[
 ['cor','Corona','bot',96,24,17],['vic','Victoria','bot',96,24,16],['pac','Pacífico','bot',72,24,16],['ult','Ultra','bot',48,12,18],['xx','XX Lager','bot',72,24,16],['mod','Modelo','bot',48,12,17],['leo','León','bot',48,12,16],
 ['bis','Bistec','kg',8,2,190],['pol','Pollo','kg',8,2,110],['arr','Arrachera','kg',6,2,260],['lon','Longaniza','kg',5,1.5,120],['mil','Milanesa de res','kg',6,2,170],['cam','Camarón','kg',9,3,280],
 ['tor','Tortilla de maíz','pza',300,80,1.2],['torh','Tortilla de harina','pza',120,40,2.5],['pan','Pan de hamburguesa','pza',40,12,6],['car','Carne de hamburguesa','pza',40,12,22],
 ['pap','Papa','kg',20,6,35],['nop','Nopales','kg',6,2,30],['agu','Aguacate','pza',30,10,18],['tos','Tostada','pza',150,40,3],
 ['coc','Coca Cola','pza',48,12,14],['boi','Boing','pza',48,12,12],['min','Agua mineral','pza',48,12,13],['sue','Suero','pza',36,12,18],['clm','Clamato','l',12,4,45]
];

const MESAS:{ k: string; label: string; tipo: string }[]=[];
for(let i=1;i<=9;i++)MESAS.push({k:'m'+i,label:'Mesa '+i,tipo:'mesa'});
for(let i=1;i<=3;i++)MESAS.push({k:'p'+i,label:'Periquito '+i,tipo:'periquito'});

export const TOSTICHELAS: RestauranteConfig = {
  slug: 'tostichelas',
  ruta: '/tostichelas',
  api: '/api/demo/tostichelas',
  lsPrefix: 'tos_',
  marca: {
    nombre: 'Tostichelas',
    nombreMayus: 'TOSTICHELAS',
    tagline: 'Tostadas, mariscos y cervezas',
    descripcion: 'Menú, pedidos, cocina, barra, caja y lealtad para Tostichelas.',
    logo: '/tostichelas/logo.jpg',
    logoAlt: 'Tostichelas, tostadas, mariscos y cervezas',
    logoW: 900,
    logoH: 619,
    mark: '/tostichelas/mark.webp',
    markAlt: 'Tostada de ceviche con cerveza',
    markW: 640,
    markH: 422,
    icono192: '/tostichelas/icon-192.png',
    icono512: '/tostichelas/icon-512.png',
    iconoMaskable: '/tostichelas/icon-maskable-512.png',
    iconoApple: '/tostichelas/apple-touch-icon.png',
    themeColor: '#FBE3CB',
    themeColorEquipo: '#241610',
    fondoManifest: '#FBE3CB',
    tema: '',
    trazo: '#241610',
    splash: { lineas: ['TOSTI', 'CHELAS'], sub: 'Tostadas, mariscos y cervezas bien frías', boton: 'Ver el menú', efecto: 'burbujas' },
  },
  textos: {
    buscar: 'Busca tostadas, chelas, tacos…',
    consulta: 'Pídele a tu mesero',
    premioEjemplo: 'tu chela gratis',
    ejemploReceta: 'tostada de ceviche = 1 tostada, 70 g de camarón (0.07 kg) y un cuarto de aguacate (0.25 pza).',
  },
  pago: 'previo',
  produccion: false,
  categorias: CATS,
  colores: CATCOL,
  menu: MENU,
  insumos: INS0,
  mesas: MESAS,
  mesaInicial: 'm4',
  maridaje: { Tostadas: ['Cervezas'], Tacos: ['Cervezas', 'Bebidas'], Cervezas: ['Tostadas', 'Snacks'], Bebidas: ['Tostadas', 'Tacos'], Snacks: ['Cervezas'] },
  maridajeTxt: {
    Tostadas: 'Va muy bien con una chela bien fría',
    Tacos: 'Acompáñalo con algo bien frío',
    Cervezas: 'Qué rica con una tostada',
    Bebidas: 'Combínala con una tostada o un taco',
    Snacks: 'Perfecto con una chela',
  },
  rapidas: {
    Tostadas: 'Sin chile, Sin cebolla, Sin cilantro, Sin jitomate, Sin aguacate, Sin mayonesa, Poco picante, Extra picante, Extra limón',
    Tacos: 'Sin chile, Sin cebolla, Sin cilantro, Poco picante, Extra picante, Con limón',
    Snacks: 'Sin chile, Sin cebolla, Sin jitomate, Sin mayonesa, Poco picante, Extra picante',
    Cervezas: 'Bien helada, Con limón, Con sal, Sin popote',
    Bebidas: 'Sin hielo, Poco hielo, Con limón',
  },
  demo: {
    pins: { caja: '1111', dueno: '2222', mesero: '3333', cocina: '4444' },
    likes: {tag:128,tce:96,tcc:84,tcm:77,cor:71,vic:64,tar:58,pac:49,ha:44,hp:40,tca:39,tmi:37,tbi:33,xx:30,mod:31,leo:25,tlo:26,pf:22,tpo:21,ult:18,pr:19,sue:15,coc:14,cln:12,boi:9,sug:8,min:6},
    rates: {tag:[4.8,64],tce:[4.7,52],tcc:[4.9,48],tcm:[4.8,41],cor:[4.5,39],vic:[4.6,35],tar:[4.7,30],pac:[4.4,22],ha:[4.3,25],hp:[4.4,21],tca:[4.5,19],tmi:[4.5,17],tbi:[4.3,15],xx:[4.4,16],mod:[4.4,15],leo:[4.5,13],tlo:[4.4,12],pf:[4.2,14],tpo:[4.2,10],ult:[4.3,9],pr:[4.1,9],sue:[4.6,8],coc:[4.5,7],cln:[4.2,6],boi:[4.3,5],sug:[4.5,4],min:[4.2,3]},
    reviews: [
   {pid:'tag',user:'Karla M.',stars:5,text:'El aguachile está en su punto y pica rico. Pídelo con una Victoria Mega.',v:true,ts:-95},
   {pid:'tag',user:'Dany R.',stars:5,text:'La mejor tostada de la zona, el aguacate no escatima.',v:true,ts:-1440},
   {pid:'tcc',user:'Chuy P.',stars:5,text:'La camachera es obligatoria. Camarón con arrachera y queso, sin pierde.',v:true,ts:-300},
   {pid:'tcc',user:'Mariana L.',stars:5,text:'Vine por recomendación y ya soy fan.',v:true,ts:-2800},
   {pid:'tce',user:'Beto G.',stars:4,text:'Muy fresco el ceviche. Yo le pondría más limón.',v:true,ts:-700},
   {pid:'cor',user:'Lalo S.',stars:5,text:'La Mega bien helada con michelada de la casa.',v:true,ts:-180},
   {pid:'tcm',user:'Ana V.',stars:5,text:'El taco de camarón empanizado se acaba rápido, pidan temprano.',v:true,ts:-4000},
   {pid:'tar',user:'Rubén C.',stars:4,text:'Arrachera tierna, la orden alcanza para compartir.',v:true,ts:-1200},
   {pid:'ha',user:'Nicté H.',stars:4,text:'Buena hamburguesa para acompañar la cerveza.',v:true,ts:-5000},
   {pid:'vic',user:'Pedro T.',stars:5,text:'Cerveza siempre bien fría.',v:true,ts:-60}
    ],
    mermas: [{ hace: 26, name: 'Bistec', unit: 'kg', diff: -0.5, val: 95 }, { hace: 26, name: 'Corona', unit: 'bot', diff: -3, val: 51 }],
    clientes: [
      { tel: '9991230001', name: 'Karla M.', pts: 130, visits: 9, last: 2 }, { tel: '9991230002', name: 'Chuy P.', pts: 84, visits: 6, last: 5 },
      { tel: '9991230003', name: 'Dany R.', pts: 42, visits: 3, last: 12 }, { tel: '9991230004', name: 'Lalo S.', pts: 210, visits: 14, last: 41 },
      { tel: '9991230005', name: 'Beto G.', pts: 63, visits: 5, last: 38 }, { tel: '9991230006', name: 'Mariana L.', pts: 18, visits: 2, last: 57 },
    ],
    gastos: [
      { id: 'g1', cat: 'Renta', concepto: 'Renta del local', monto: 12000, freq: 'mensual' }, { id: 'g2', cat: 'Sueldos', concepto: 'Cocinero', monto: 9000, freq: 'mensual' },
      { id: 'g3', cat: 'Sueldos', concepto: 'Mesero', monto: 7000, freq: 'mensual' }, { id: 'g4', cat: 'Servicios', concepto: 'Luz y agua', monto: 3500, freq: 'mensual' },
      { id: 'g5', cat: 'Servicios', concepto: 'Gas', monto: 2400, freq: 'mensual' }, { id: 'g6', cat: 'Otros fijos', concepto: 'Internet y sistema', monto: 899, freq: 'mensual' },
    ],
    pool: ['tag','tce','tcc','tcm','tar','tbi','cor','vic','pac','xx','ha','pf','tca','coc','hp'],
    mesasOcupadas: [
      ['m2', [['tcc', 1, 1], ['cor', 1, 1]], 4, 'preparando'],
      ['m5', [['tag', 0, 2], ['vic', 1, 1]], 12, 'listo'],
      ['m7', [['tar', 1, 1], ['pac', 0, 2]], 35, 'entregado'],
      ['p1', [['xx', 0, 2]], 8, 'nuevo'],
    ],
    mesaConCuenta: 'm7',
  },
};
