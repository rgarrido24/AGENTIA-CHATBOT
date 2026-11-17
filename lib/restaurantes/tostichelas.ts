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

/* extras con precio (precios de ejemplo: ajustar con el restaurante) */
const XQ=(g:string,l:string,a:number,b?:number)=>({g,req:false,opts:[{l,p:[a,b==null?a:b]}]});
const SALSA_X=()=>({g:'Salsa',req:false,opts:['Verde','Roja','Habanero','Macha'].map(l=>({l,p:[0,0]}))});
MENU.forEach((q:any)=>{
 if(q.cat==='Tostadas')q.mods=q.mods.concat([XQ('Aguacate extra','Sí',15),XQ('Doble porción','Sí',35),SALSA_X()]);
 else if(q.cat==='Tacos')q.mods=q.mods.concat([XQ('Queso extra','Sí',10,25),XQ('Aguacate extra','Sí',10,25),SALSA_X()]);
 else if(q.cat==='Snacks')q.mods=q.mods.concat([XQ('Queso extra','Sí',15),SALSA_X()]);
});

/* ilustración propia por producto (trazo grueso del logo; el motor pone el trazo) */
const BEER:Record<string,string[]>={cor:['#F5B83D','#2F6FB5','#F7E27A'],vic:['#C98A2B','#C0392B','#F3D9A4'],pac:['#E7B04A','#1F9AD6','#FFFFFF'],xx:['#B8721E','#2E8B57','#F5B83D'],ult:['#F2C14E','#3FA9F5','#E8EEF2'],mod:['#E5A82F','#E5B73B','#241610'],leo:['#5B2A14','#8C3B1B','#F2D6A0']};
const DRINK:Record<string,string[]>={boi:['#9BD34A','#F5D45E'],coc:['#3B1F18','#D0312D'],min:['#CFE9F7','#FFFFFF'],sue:['#EAF6FB','#3FA9F5'],sug:['#EAF6FB','#2E7DD1'],cln:['#C9473A','#8CC152']};
const bottle=(c:string[],big?:boolean)=>'<path d="M26 4h12v4h-3v8c0 4 7 8 7 15v23a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V31c0-7 7-11 7-15V8h-3z" fill="'+c[0]+'"/><rect x="23" y="'+(big?30:34)+'" width="18" height="'+(big?22:16)+'" fill="'+c[1]+'" stroke-width="2"/><circle cx="32" cy="'+(big?41:42)+'" r="4" fill="'+c[2]+'" stroke-width="2"/><rect x="27" y="2" width="10" height="5" rx="2" fill="#241610"/>';
const TACO:Record<string,[string,string]>={tbi:['#8B4A2B','<path d="M18 40l8-6M28 41l8-7M38 40l7-5" stroke="#4A2412" stroke-width="2.5" fill="none"/>'],tpo:['#EBCB9C','<path d="M17 40q5-4 10 0t10 0 8-1M20 35q5-3 10 0t8 0" stroke="#B88B54" stroke-width="2.2" fill="none"/>'],tlo:['#B0342B','<circle cx="22" cy="39" r="4" fill="#7E1F1A"/><circle cx="32" cy="35" r="4" fill="#7E1F1A"/><circle cx="42" cy="39" r="4" fill="#7E1F1A"/>'],tmi:['#DDA845','<path d="M14 42l36-6" stroke="#B9822A" stroke-width="7"/><circle cx="22" cy="40" r="1.4" fill="#fff"/><circle cx="36" cy="37" r="1.4" fill="#fff"/><circle cx="46" cy="35" r="1.4" fill="#fff"/>'],tca:['#9A4A2A','<path d="M14 42a18 18 0 0 1 18-16v17z" fill="#B0342B"/><path d="M32 43V26a18 18 0 0 1 18 16z" fill="#8B4A2B"/>'],tar:['#5E2F1E','<path d="M17 41l7-5M27 42l8-7M38 41l7-5" stroke="#241610" stroke-width="3" fill="none"/><path d="M45 28l10 6-9 6z" fill="#C5E063"/>'],tcm:['#F08A3E','<path d="M18 41q4-8 9-3M30 40q4-9 9-3M41 41q3-6 8-2" stroke="#B85A1C" stroke-width="3" fill="none"/>'],tcc:['#8B4A2B','<path d="M14 40q6 5 12 0t12 0 10 0v4H14z" fill="#F5D45E"/><path d="M20 37l6-5M33 36l6-5" stroke="#4A2412" stroke-width="3" fill="none"/><circle cx="46" cy="34" r="4" fill="#F08A3E"/>']};
function arteDe(id:string,cat:string):string{
 let b='';
 if(cat==='Cervezas')b=bottle(BEER[id]||['#F5B83D','#C0392B','#fff']);
 else if(cat==='Tostadas'){
  const ag=id==='tag';
  b='<circle cx="32" cy="34" r="23" fill="#E9C27E"/><circle cx="32" cy="34" r="18" fill="'+(ag?'#DDEBB4':'#F07A4D')+'"/>'
   +(ag?'<circle cx="24" cy="29" r="6" fill="#8CC152"/><circle cx="24" cy="29" r="3" fill="#E7F2C2" stroke-width="1.5"/><circle cx="38" cy="38" r="6" fill="#8CC152"/><circle cx="38" cy="38" r="3" fill="#E7F2C2" stroke-width="1.5"/><path d="M30 22q8 1 12 7-7 3-12-7z" fill="#B14B8A"/><path d="M20 40q4 5 9 4" fill="none" stroke="#B14B8A" stroke-width="3"/><path d="M40 24q5 1 6 6-5 1-6-6z" fill="#F08A3E"/>'
    :'<path d="M22 30q4-6 9-2-1 6-9 2zM33 36q5-5 10-1-2 6-10 1zM26 41q4-3 8 0" fill="#F5A04A"/><path d="M28 20q12 4 10 15-10-2-10-15z" fill="#8CC152"/><circle cx="41" cy="28" r="3" fill="#fff"/><path d="M16 42a16 16 0 0 0 32 0z" fill="#C5E063"/>');
 }else if(cat==='Tacos'){
  const t=TACO[id]||['#8B4A2B',''];const harina=id==='tcm'||id==='tcc';
  b='<path d="M6 46a26 26 0 0 1 52 0z" fill="'+(harina?'#F6E8C8':'#F2C76B')+'"/><path d="M13 46a19 19 0 0 1 38 0z" fill="'+t[0]+'"/>'+t[1]+'<circle cx="22" cy="29" r="2.5" fill="#8CC152"/><circle cx="41" cy="27" r="2.5" fill="#8CC152"/><circle cx="32" cy="24" r="2.5" fill="#fff"/><path d="M8 50h48" stroke-width="2.5" opacity=".4"/>';
 }else if(cat==='Bebidas'){
  const c=DRINK[id]||['#7FB2E5','#fff'];
  if(id==='cln')b='<path d="M16 12h32l-4 44a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="'+c[0]+'"/><path d="M42 4l-6 16" stroke="'+c[1]+'" stroke-width="4"/><circle cx="46" cy="14" r="6" fill="#C5E063"/>';
  else if(id==='boi')b='<path d="M20 8h24l3 10v36a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V18z" fill="'+c[0]+'"/><circle cx="32" cy="36" r="9" fill="'+c[1]+'"/><path d="M26 36h12" stroke-width="2.5"/>';
  else b=bottle([c[0],c[1],id==='coc'?'#fff':c[0]],id==='sug');
 }else if(id==='pf')b='<rect x="17" y="10" width="6" height="26" fill="#F5D45E"/><rect x="26" y="6" width="6" height="30" fill="#F5D45E"/><rect x="35" y="10" width="6" height="26" fill="#F5D45E"/><rect x="43" y="14" width="5" height="22" fill="#F5D45E"/><path d="M14 32h36l-4 26H18z" fill="#E2573A"/><path d="M20 38q6 4 12 0t12 0" stroke="#fff" stroke-width="3" fill="none"/>';
 else if(id==='pr')b='<path d="M12 28l4 28h32l4-28z" fill="#E8C27E"/><path d="M16 28l-3-16M26 28l-1-20M36 28l2-18M46 28l5-14" stroke="#F5D45E" stroke-width="6" fill="none"/>';
 else if(id==='hp')b='<path d="M6 26a20 16 0 0 1 40 0z" fill="#E8A24A"/><path d="M5 28h42l-3 4H8z" fill="#8CC152"/><rect x="7" y="33" width="38" height="7" rx="3" fill="#7A4A2B"/><path d="M8 42h36a4 4 0 0 1-4 7H12a4 4 0 0 1-4-7z" fill="#E8A24A"/><rect x="40" y="38" width="5" height="16" fill="#F5D45E"/><rect x="47" y="34" width="5" height="20" fill="#F5D45E"/><rect x="54" y="40" width="5" height="14" fill="#F5D45E"/><path d="M38 52h24l-3 8H41z" fill="#E2573A"/>';
 else b='<path d="M9 30a23 19 0 0 1 46 0z" fill="#E8A24A"/><circle cx="24" cy="23" r="1.5" fill="#fff"/><circle cx="34" cy="19" r="1.5" fill="#fff"/><path d="M7 33h50l-4 5H11z" fill="#8CC152"/><path d="M10 38h44v3H10z" fill="#F5D45E"/><rect x="10" y="41" width="44" height="8" rx="4" fill="#7A4A2B"/><path d="M12 49h40a4 4 0 0 1-4 8H16a4 4 0 0 1-4-8z" fill="#E8A24A"/>';
 return b;
}
const ARTE:Record<string,string>={};
MENU.forEach(q=>{ARTE[q.id]=arteDe(q.id,q.cat)});

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
    splash: { lineas: ['TOSTI', 'CHELAS'], sub: 'Tostadas, mariscos y cervezas bien frías', boton: 'Ver el menú', efecto: 'burbujas', img: { src: '/tostichelas/logo-hero.webp', w: 900, h: 617, alt: 'Tostichelas · tostadas, mariscos y cervezas' } },
    logoHero: { src: '/tostichelas/logo-hero.webp', w: 900, h: 617, alt: 'Tostichelas · tostadas, mariscos y cervezas' },
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
  arte: ARTE,
  inicio: { destacado: 'tcm', combos: [['tag', 'vic', 'Aguachile + Victoria'], ['tcc', 'cor', 'Camachera + Corona'], ['tar', 'mod', 'Arrachera + Modelo']], tituloCombos: 'Va muy bien con una chela' },
  ajustes: { pedMesa: true },
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
