// @ts-nocheck
import QRCode from 'qrcode';
/* Demo Tostichelas: app de un solo archivo montada desde page.tsx. */
export function initTostichelas(root: HTMLElement): () => void {
'use strict';
/* ---------- utilidades ---------- */
const $=(s)=>root.querySelector(s);
const ctl=new AbortController();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const m=n=>'$'+Math.round(n).toLocaleString('es-MX');
const m2=n=>'$'+(Math.round(n*100)/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const ago=ts=>{const x=Math.max(0,Math.floor((Date.now()-ts)/60000));return x<1?'ahora':x<60?x+' min':Math.floor(x/60)+' h '+(x%60)+' min'};
const mins=ts=>Math.max(0,Math.floor((Date.now()-ts)/60000));
let _u=0;const uid=()=>'u'+(++_u);
const rng=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(20261116);
const ICON={
 heart:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21l-1.4-1.3C5.4 15 2 11.9 2 8.1 2 5.1 4.4 3 7.2 3c1.6 0 3.2.8 4.8 2.5C13.6 3.8 15.2 3 16.8 3 19.6 3 22 5.1 22 8.1c0 3.8-3.4 6.9-8.6 11.6L12 21z"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18l-6.4 3.6L7 14.5 1.7 9.5l7.2-.9z"/></svg>',
 chat:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>',
 share:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16a3 3 0 00-2.2 1l-7-3.6a3 3 0 000-2.8l7-3.6A3 3 0 1015 6l-7 3.6a3 3 0 100 4.8l7 3.6A3 3 0 1018 16z"/></svg>'
};
const starsHtml=(avg,n)=>{let h='<span class="stars" role="img" aria-label="'+avg.toFixed(1)+' de 5">';for(let i=1;i<=5;i++)h+='<span class="'+(avg>=i-.25?'':'off')+'">'+ICON.star+'</span>';return h+'</span>'};

/* ---------- menú real de Tostichelas ---------- */
const SAB=['Sandía','Fresa','Miguelito','Tajín','Piña Mango','Cereza','Mora Azul Truena Pop','Ajonjolí Caramelizado'];
const BMODS=[
 {g:'Preparado',req:false,opts:[{l:'Michelada',p:[5,10]},{l:'Cubana',p:[15,20]},{l:'Clamato',p:[20,25]}]},
 {g:'Vaso',req:false,opts:[{l:'Escarchado',p:[10,15]},{l:'Michelado',p:[20,25]},{l:'Cubano',p:[25,30]},{l:'Clamato',p:[35,50]}]},
 {g:'Sabor del escarchado',req:true,showIf:['Vaso','Escarchado'],opts:SAB.map(l=>({l,p:[0,0]}))}
];
const P=o=>Object.assign({avail:true,mods:[],desc:''},o);
const T=(id,name,p1,p3,prot,desc,torKey)=>P({id,cat:'Tacos',name,desc:desc||'Servidos con papa y nopales',emoji:'🌮',station:'cocina',v:[{l:'Pza',p:p1,f:1,s:0},{l:'Orden (3 pzas)',p:p3,f:3,s:1}],use:Object.assign({[torKey||'tor']:1,nop:.03,pap:.05},prot)});
const B=(id,name,ins,h,mg)=>{const v=[];if(h)v.push({l:'1/2',p:h,f:1,s:0});if(mg)v.push({l:'Mega',p:mg,f:2,s:1});return P({id,cat:'Cervezas',name,emoji:'🍺',station:'barra',v,use:{[ins]:1},mods:BMODS,desc:(h&&!mg)?'Solo en 1/2':(!h?'Solo en Mega':'')})};
const MENU=[
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
const CATS=['Tostadas','Tacos','Cervezas','Bebidas','Snacks'];
const CATCOL={Tostadas:'#7DBB86',Tacos:'#F29A4A',Cervezas:'#F2C14E',Bebidas:'#7FB2E5',Snacks:'#E2573A'};
const PM=id=>MENU.find(p=>p.id===id);
const INS0=[
 ['cor','Corona','bot',96,24,17],['vic','Victoria','bot',96,24,16],['pac','Pacífico','bot',72,24,16],['ult','Ultra','bot',48,12,18],['xx','XX Lager','bot',72,24,16],['mod','Modelo','bot',48,12,17],['leo','León','bot',48,12,16],
 ['bis','Bistec','kg',8,2,190],['pol','Pollo','kg',8,2,110],['arr','Arrachera','kg',6,2,260],['lon','Longaniza','kg',5,1.5,120],['mil','Milanesa de res','kg',6,2,170],['cam','Camarón','kg',9,3,280],
 ['tor','Tortilla de maíz','pza',300,80,1.2],['torh','Tortilla de harina','pza',120,40,2.5],['pan','Pan de hamburguesa','pza',40,12,6],['car','Carne de hamburguesa','pza',40,12,22],
 ['pap','Papa','kg',20,6,35],['nop','Nopales','kg',6,2,30],['agu','Aguacate','pza',30,10,18],['tos','Tostada','pza',150,40,3],
 ['coc','Coca Cola','pza',48,12,14],['boi','Boing','pza',48,12,12],['min','Agua mineral','pza',48,12,13],['sue','Suero','pza',36,12,18],['clm','Clamato','l',12,4,45]
];

/* ---------- estado ---------- */
let S,ac;
const MESAS=[];for(let i=1;i<=9;i++)MESAS.push({k:'m'+i,label:'Mesa '+i,tipo:'mesa'});for(let i=1;i<=3;i++)MESAS.push({k:'p'+i,label:'Periquito '+i,tipo:'periquito'});
const mLabel=k=>(MESAS.find(x=>x.k===k)||{label:k}).label;
const tokenOf=k=>String(1000+((k.charCodeAt(0)*31+parseInt(k.slice(1),10)*977)%9000));
const ins=k=>S.inv.find(i=>i.id===k);

function lineFrom(p,vi,mods,qty,note){const v=p.v[vi];let unit=v.p;mods.forEach(x=>unit+=x.p);return{uid:uid(),pid:p.id,name:p.name,v:v.l,s:v.s,f:v.f,mods,unit,qty,note:note||'',station:p.station,status:'nuevo'}}
function lineCost(l){const p=PM(l.pid);let c=0;Object.keys(p.use).forEach(k=>{const it=ins(k);if(it)c+=p.use[k]*l.f*l.qty*it.cost});if(p.cost)c+=p.cost*l.f*l.qty;return c}
const lineTot=l=>l.unit*l.qty;
const sumLines=ls=>ls.reduce((a,l)=>a+lineTot(l),0);
const soldOut=p=>!p.avail||Object.keys(p.use).some(k=>{const it=ins(k);return it&&it.stock<p.use[k]*p.v[0].f});
function deduct(o,sign){o.lines.forEach(l=>{const p=PM(l.pid);Object.keys(p.use).forEach(k=>{const i=ins(k);if(!i)return;i.stock=Math.round((i.stock-(sign||1)*p.use[k]*l.f*l.qty)*100)/100})})}
function newOrder(x){const o=Object.assign({id:S.seq++,mesa:null,canal:'mesa',lines:[],cliente:{},hold:false,porConfirmar:false,src:'mesero',addr:'',envio:0,created:Date.now(),closed:false,cancel:false,stage:'cocina',done:false},x);S.orders.push(o);if(!o.hold)deduct(o);return o}
function release(o){o.hold=false;o.created=Date.now();deduct(o);beep()}
const live=()=>S.orders.filter(o=>!o.hold&&!o.cancel);
const mesaOrders=k=>S.orders.filter(o=>o.mesa===k&&!o.closed&&!o.cancel&&!o.hold);
const orderSub=o=>sumLines(o.lines);
const mesaTotal=k=>mesaOrders(k).reduce((a,o)=>a+orderSub(o),0);
function addPoints(c,sub,disc){return;let cu=S.cust.find(x=>x.tel===c.tel);if(!cu){cu={tel:c.tel,name:c.name||'Cliente',pts:0,visits:0,last:0};S.cust.push(cu)}if(c.name&&cu.name==='Cliente')cu.name=c.name;cu.pts+=Math.floor((sub-disc)/10);cu.visits++;cu.last=0}
function closeTicket(orders,o2){const lines=[];orders.forEach(o=>o.lines.forEach(l=>lines.push(Object.assign({},l,{cost:lineCost(l)}))));const sub=sumLines(lines);const t=Object.assign({id:S.tseq++,ts:Date.now(),lines,sub,disc:0,tip:0,method:'Efectivo',cliente:{},canal:'mesa',mesa:null,orderIds:orders.map(o=>o.id)},o2);t.total=sub-t.disc+t.tip+(t.envio||0);S.tickets.push(t);orders.forEach(o=>{o.closed=true});if(t.mesa)delete S.cuenta[t.mesa];addPoints(t.cliente,sub,t.disc);return t}
function restockCancel(o){if(!o.hold)deduct(o,-1);o.cancel=true}
function beep(){if(!S||!S.sound)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.15,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.4);o.start();o.stop(ac.currentTime+.4)}catch(e){}}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3200)}

function seed(){
 S={seq:101,tseq:2001,role:'cliente',sound:S?S.sound:false,modal:null,
  settings:{radio:50,cap:500,envio:25,pedMesa:true,pedLlevar:true,pedEntrega:true,aprobar:false,lat:null,lng:null,diasMes:26,costoPct:35,comisionPct:2},
  inv:INS0.map(r=>({id:r[0],name:r[1],unit:r[2],stock:r[3],min:r[4],cost:r[5],count:''})),
  orders:[],tickets:[],cuenta:{},mermas:[],cust:[],cancelados:1,gastos:[],fin:{cat:'Renta',con:'',monto:'',freq:'mensual'},invNew:{name:'',unit:'kg',stock:'',min:'',cost:''},
  soc:{likes:{},liked:{},rate:{},reviews:[],mine:{}},
  cli:{tab:'menu',geo:'dentro',mesa:'m4',canal:'mesa',cat:'Todo',sort:'pop',cart:[],addr:'',open:{},purchased:{}},
  me:{name:'',tel:''},
  mw:{sel:null,adding:false,cart:[]},
  caja:{sel:null,tab:'cobro',split:1,tip:0,method:'Efectivo',recv:'',tel:'',canje:false,fondo:500,contado:'',lc:null,nom:'',nac:'',busy:false,movs:[],mt:'retiro',mm:'',mo:''},
  auth:{},pins:{caja:'1111',dueno:'2222'},
  loy:{tel:'',data:null,loading:false,nom:'',nac:''},real:null,kds:{screen:false},
  own:{tab:'resumen'}};
 applyMenu();
 if(PROD){MENU.forEach(q=>{S.soc.likes[q.id]=0;S.soc.rate[q.id]={n:0,sum:0}});return}
 S.gastos=[{id:'g1',cat:'Renta',concepto:'Renta del local',monto:12000,freq:'mensual'},{id:'g2',cat:'Sueldos',concepto:'Cocinero',monto:9000,freq:'mensual'},{id:'g3',cat:'Sueldos',concepto:'Mesero',monto:7000,freq:'mensual'},{id:'g4',cat:'Servicios',concepto:'Luz y agua',monto:3500,freq:'mensual'},{id:'g5',cat:'Servicios',concepto:'Gas',monto:2400,freq:'mensual'},{id:'g6',cat:'Otros fijos',concepto:'Internet y sistema',monto:899,freq:'mensual'}];
 const LK={tag:128,tce:96,tcc:84,tcm:77,cor:71,vic:64,tar:58,pac:49,ha:44,hp:40,tca:39,tmi:37,tbi:33,xx:30,mod:31,leo:25,tlo:26,pf:22,tpo:21,ult:18,pr:19,sue:15,coc:14,cln:12,boi:9,sug:8,min:6};
 const RT={tag:[4.8,64],tce:[4.7,52],tcc:[4.9,48],tcm:[4.8,41],cor:[4.5,39],vic:[4.6,35],tar:[4.7,30],pac:[4.4,22],ha:[4.3,25],hp:[4.4,21],tca:[4.5,19],tmi:[4.5,17],tbi:[4.3,15],xx:[4.4,16],mod:[4.4,15],leo:[4.5,13],tlo:[4.4,12],pf:[4.2,14],tpo:[4.2,10],ult:[4.3,9],pr:[4.1,9],sue:[4.6,8],coc:[4.5,7],cln:[4.2,6],boi:[4.3,5],sug:[4.5,4],min:[4.2,3]};
 MENU.forEach(p=>{S.soc.likes[p.id]=LK[p.id]||5;const r=RT[p.id]||[4.3,3];S.soc.rate[p.id]={n:r[1],sum:Math.round(r[0]*r[1]*10)/10}});
 S.soc.reviews=[
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
 ].map(r=>Object.assign(r,{ts:Date.now()+r.ts*60000}));
 S.mermas=[{ts:Date.now()-26*3600000,name:'Bistec',unit:'kg',diff:-0.5,val:95},{ts:Date.now()-26*3600000,name:'Corona',unit:'bot',diff:-3,val:51}];
 S.cust=[
  {tel:'9991230001',name:'Karla M.',pts:130,visits:9,last:2},{tel:'9991230002',name:'Chuy P.',pts:84,visits:6,last:5},
  {tel:'9991230003',name:'Dany R.',pts:42,visits:3,last:12},{tel:'9991230004',name:'Lalo S.',pts:210,visits:14,last:41},
  {tel:'9991230005',name:'Beto G.',pts:63,visits:5,last:38},{tel:'9991230006',name:'Mariana L.',pts:18,visits:2,last:57}];
 /* ventas del día de ejemplo */
 const hmax=Math.max(14,Math.min(21,new Date().getHours()));
 const pool=['tag','tce','tcc','tcm','tar','tbi','cor','vic','pac','xx','ha','pf','tca','coc','hp'];
 const meth=['Efectivo','Efectivo','Efectivo','Tarjeta','Tarjeta','Tarjeta','Transferencia'];
 for(let i=0;i<30;i++){
  const d=new Date();d.setHours(13+Math.floor(rng()*(hmax-12)),Math.floor(rng()*60),0,0);if(d.getTime()>Date.now())d.setHours(hmax-1);
  const n=2+Math.floor(rng()*4),ls=[];
  for(let j=0;j<n;j++){const p=PM(pool[Math.floor(rng()*pool.length)]);const vi=Math.floor(rng()*p.v.length);const l=lineFrom(p,vi,[],1+Math.floor(rng()*2));l.cost=lineCost(l);ls.push(l)}
  const sub=sumLines(ls),r=rng();
  const tip=r<.35?Math.round(sub*.1/5)*5:0;
  S.tickets.push({id:S.tseq++,ts:d.getTime(),lines:ls,sub,disc:0,tip,method:meth[Math.floor(rng()*meth.length)],cliente:{},canal:r>.92?'entrega':r>.82?'llevar':'mesa',mesa:null,total:sub+tip,orderIds:[]});
 }
 /* mesas ocupadas de ejemplo */
 const mk=(mesa,items,age,st,extra)=>{const ls=items.map(a=>{const l=lineFrom(PM(a[0]),a[1],[],a[2]);l.status=st;return l});return newOrder(Object.assign({mesa,lines:ls,created:Date.now()-age*60000},extra||{}))};
 mk('m2',[['tcc',1,1],['cor',1,1]],4,'preparando');
 mk('m5',[['tag',0,2],['vic',1,1]],12,'listo');
 const o7=mk('m7',[['tar',1,1],['pac',0,2]],35,'entregado');S.cuenta.m7=true;
 mk('p1',[['xx',0,2]],8,'nuevo');
 if(!o7)return;
}
const ordersInit=()=>seed();


/* ilustraciones planas con el trazo grueso del logo */
const SK='stroke="#241610" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
function artSvg(p){
 const id=p.id,cat=p.cat;let b='';
 if(cat==='Cervezas')b='<path d="M14 24h28v28a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5z" fill="#F5B83D"/><path d="M42 30h5a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-5" fill="none"/><path d="M20 30v22M28 30v22" stroke-width="2" opacity=".35"/><circle cx="21" cy="19" r="7" fill="#fff"/><circle cx="31" cy="15" r="8" fill="#fff"/><circle cx="40" cy="21" r="6" fill="#fff"/>';
 else if(cat==='Tostadas')b='<circle cx="32" cy="34" r="23" fill="#E9C27E"/><circle cx="32" cy="34" r="17" fill="#D94F3A"/><circle cx="25" cy="30" r="4.5" fill="#fff"/><circle cx="37" cy="38" r="4.5" fill="#fff"/><circle cx="38" cy="28" r="3.5" fill="#fff"/><path d="M28 18q12 4 9 18-11-2-9-18z" fill="#8CC152"/><path d="M16 42a16 16 0 0 0 32 0z" fill="#C5E063"/>';
 else if(cat==='Tacos')b='<path d="M6 46a26 26 0 0 1 52 0z" fill="#F2C76B"/><path d="M13 46a19 19 0 0 1 38 0" fill="#C9473A"/><circle cx="24" cy="38" r="4.5" fill="#8CC152"/><circle cx="34" cy="33" r="4.5" fill="#fff"/><circle cx="43" cy="40" r="4" fill="#F5B83D"/>';
 else if(cat==='Bebidas')b='<path d="M26 6h12v11l6 10v27a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V27l6-10z" fill="#7FB2E5"/><rect x="21" y="34" width="22" height="14" fill="#fff"/>';
 else if(id==='pf'||id==='pr')b='<rect x="17" y="10" width="6" height="26" fill="#F5D45E"/><rect x="26" y="6" width="6" height="30" fill="#F5D45E"/><rect x="35" y="10" width="6" height="26" fill="#F5D45E"/><rect x="43" y="14" width="5" height="22" fill="#F5D45E"/><path d="M14 32h36l-4 26H18z" fill="#E2573A"/>';
 else b='<path d="M9 30a23 19 0 0 1 46 0z" fill="#E8A24A"/><path d="M7 33h50l-4 5H11z" fill="#8CC152"/><rect x="10" y="39" width="44" height="8" rx="4" fill="#7A4A2B"/><path d="M12 49h40a4 4 0 0 1-4 8H16a4 4 0 0 1-4-8z" fill="#E8A24A"/>';
 return '<svg viewBox="0 0 64 64" width="100%" height="100%" '+SK+' aria-hidden="true">'+b+'</svg>'}
const artHtml=p=>p.img?'<img src="'+esc(p.img)+'" alt="" loading="lazy">':artSvg(p);

/* ---------- pantalla cliente (menú social) ---------- */
const avgOf=id=>{const r=S.soc.rate[id];return r.n?r.sum/r.n:0};
const scoreOf=id=>S.soc.likes[id]+S.soc.rate[id].n*avgOf(id);
function lineHtml(l){return esc(l.name)+' <span class="muted">'+esc(l.v)+'</span>'+(l.mods.length?'<div class="mods">'+l.mods.map(x=>esc(x.l)).join(' · ')+'</div>':'')+(l.note?'<div class="xs muted">Nota: '+esc(l.note)+'</div>':'')}
function fromPrice(p){const min=Math.min.apply(null,p.v.map(v=>v.p));return(p.v.length>1?'desde ':'')+m(min)}
function prodCard(p){
 const a=avgOf(p.id),r=S.soc.rate[p.id],out=soldOut(p),open=S.cli.open[p.id],liked=S.soc.liked[p.id];
 const revs=S.soc.reviews.filter(x=>x.pid===p.id).sort((x,y)=>y.ts-x.ts);
 let h='<article class="prod'+(out?' out':'')+'"><div class="art" style="--c:'+CATCOL[p.cat]+'" aria-hidden="true">'+artHtml(p)+'</div><div class="stack" style="gap:6px">';
 h+='<div><h3>'+esc(p.name)+'</h3>'+(p.desc?'<div class="small muted">'+esc(p.desc)+'</div>':'')+'</div>';
 h+='<div class="soc">'+starsHtml(a)+'<span class="num">'+a.toFixed(1)+' ('+r.n+')</span><span class="num" style="color:var(--accent)">'+ICON.heart+' '+S.soc.likes[p.id]+'</span></div>';
 h+='<div class="row between"><span class="b num">'+fromPrice(p)+'</span>'+(out?'<span class="status s-bad">Agotado hoy</span>':'')+'</div>';
 h+='<div class="row"><button class="chip like" aria-pressed="'+(!!liked)+'" data-a="like" data-p="'+p.id+'">'+ICON.heart+' Me gusta</button>';
 h+='<button class="chip" aria-pressed="'+(!!open)+'" data-a="togrev" data-p="'+p.id+'">'+ICON.chat+' '+revs.length+'</button>';
 h+='<a class="chip" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent('Prueba '+p.name+' en Tostichelas, '+a.toFixed(1)+' de 5 con '+r.n+' opiniones')+'">'+ICON.share+' Recomendar</a>';
 h+=''+(canOrderAny()?'<button class="btn pri sm" data-a="add" data-p="'+p.id+'"'+(out?' disabled':'')+'>Agregar</button>':'')+'</div></div>';
 if(open){h+='<div class="reviews">';
  revs.slice(0,4).forEach(x=>{h+='<div class="rev"><div class="row between"><span class="b small">'+esc(x.user)+'</span>'+starsHtml(x.stars)+'</div><div class="small">'+esc(x.text)+'</div><div class="xs muted">'+(x.v?'<span class="status s-good" style="padding:1px 8px">Consumo verificado</span> ':'')+ago(x.ts)+'</div></div>'});
  if(!revs.length)h+='<div class="small muted">Aún no hay reseñas. Sé el primero.</div>';
  h+='<button class="btn sm" data-a="review" data-p="'+p.id+'">Calificar y opinar</button></div>'}
 return h+'</article>'}
function vCliente(){
 const c=S.cli;let h='<div class="stack" style="margin-top:12px"><img class="hero" src="/tostichelas/logo.jpg" alt="Tostichelas, tostadas, mariscos y cervezas" width="900" height="619">';
 h+='<div class="chips"><button class="chip" data-a="tab" data-v="menu" aria-pressed="'+(c.tab==='menu')+'">Menú</button><button class="chip" data-a="tab" data-v="pedido" aria-pressed="'+(c.tab==='pedido')+'">Mi pedido'+(c.cart.length?' ('+c.cart.reduce((a,l)=>a+l.qty,0)+')':'')+'</button><button class="chip" data-a="tab" data-v="puntos" aria-pressed="'+(c.tab==='puntos')+'">Mis puntos</button></div>';
 if(c.tab==='menu')h+=cMenu();else if(c.tab==='pedido')h+=cPedido();else h+=cPuntos();
 return h+'</div>'}
function presence(){
 if(PROD)return presenceReal();
 const c=S.cli;let h='<div class="card stack" style="gap:8px"><div class="row between"><span class="b small">Simular ubicación del cliente (demo)</span></div><div class="chips"><button class="chip" aria-pressed="'+(c.geo==='dentro')+'" data-a="geo" data-v="dentro">Estoy en el local</button><button class="chip" aria-pressed="'+(c.geo==='fuera')+'" data-a="geo" data-v="fuera">Estoy fuera</button></div>';
 if(c.geo==='dentro'){h+='<div class="banner good"><b>Presencia verificada.</b> Escaneaste el QR de <b>'+mLabel(c.mesa)+'</b> y tu celular está a menos de '+S.settings.radio+' m del local.</div><label class="f">Mesa del QR (para probar)<select data-in="mesa">'+MESAS.map(x=>'<option value="'+x.k+'"'+(x.k===c.mesa?' selected':'')+'>'+x.label+'</option>').join('')+'</select></label>'}
 else h+='<div class="banner warn"><b>No estás en el local.</b> Puedes pedir para llevar o entrega cercana, pero el pedido solo llega a cocina cuando el pago se confirma.</div>';
 return h+'</div>'}
function cMenu(){
 const c=S.cli;let h=presence();
 if(!canOrderAny())h+='<div class="banner warn"><b>Menú de consulta.</b> Por ahora los pedidos los toma tu mesero. Mira, califica y recomienda tus favoritos.</div>';
 const top=MENU.filter(p=>!soldOut(p)).sort((a,b)=>scoreOf(b.id)-scoreOf(a.id)).slice(0,5);
 h+='<div><span class="pill-title" style="margin-top:4px">La comunidad recomienda</span><div class="strip">'+top.map((p,i)=>'<div class="top-card"><div class="art" style="--c:'+CATCOL[p.cat]+'">'+artHtml(p)+'</div><div class="rank">#'+(i+1)+'</div><div class="b small">'+esc(p.name)+'</div><div class="xs">'+starsHtml(avgOf(p.id))+' <span class="num">'+avgOf(p.id).toFixed(1)+'</span></div><div class="xs num" style="color:var(--accent)">'+ICON.heart+' '+S.soc.likes[p.id]+'</div></div>').join('')+'</div></div>';
 h+='<div class="chips scroll">'+['Todo'].concat(CATS).map(x=>'<button class="chip" data-a="cat" data-v="'+x+'" aria-pressed="'+(c.cat===x)+'">'+x+'</button>').join('')+'</div>';
 h+='<div class="chips"><button class="chip" data-a="sort" data-v="pop" aria-pressed="'+(c.sort==='pop')+'">Más queridos</button><button class="chip" data-a="sort" data-v="rate" aria-pressed="'+(c.sort==='rate')+'">Mejor calificados</button><button class="chip" data-a="sort" data-v="menu" aria-pressed="'+(c.sort==='menu')+'">Orden del menú</button></div>';
 let list=MENU.filter(p=>c.cat==='Todo'||p.cat===c.cat);
 if(c.sort==='pop')list=list.slice().sort((a,b)=>S.soc.likes[b.id]-S.soc.likes[a.id]);
 if(c.sort==='rate')list=list.slice().sort((a,b)=>avgOf(b.id)-avgOf(a.id));
 return h+list.map(prodCard).join('')}
function myOrders(){return S.orders.filter(o=>o.src==='cliente'&&!o.cancel)}
function cPedido(){
 const c=S.cli,dentro=c.geo==='dentro';let h='';
 const al=allowedCanales(dentro);
 if(!al.length)return'<div class="card stack"><h3>Tu pedido</h3><div class="banner warn">'+(canOrderAny()?'Para pedir desde tu mesa escanea el QR de tu mesa y verifica que estás en el local.':'Por ahora el menú es solo para consultar. Pídele a tu mesero.')+'</div></div>';
 if(!al.includes(c.canal))c.canal=al[0];
 const sub=sumLines(c.cart);
 h+='<div class="card stack"><h3>Tu pedido</h3>';
 if(!c.cart.length)h+='<div class="muted small">Aún no agregas nada. Ve al menú y toca Agregar.</div>';
 c.cart.forEach((l,i)=>{h+='<div class="row between" style="align-items:flex-start"><div class="grow">'+lineHtml(l)+'</div><div class="qty"><button data-a="cq" data-i="'+i+'" data-d="-1" aria-label="Quitar uno">−</button><b class="num">'+l.qty+'</b><button data-a="cq" data-i="'+i+'" data-d="1" aria-label="Agregar uno">+</button></div><div class="b num" style="min-width:56px;text-align:right">'+m(lineTot(l))+'</div></div>'});
 if(c.cart.length){
  h+='<div class="sep"></div><div class="row between"><span class="b">Subtotal</span><span class="b num">'+m(sub)+'</span></div>';
  h+='<div class="stack" style="gap:8px"><span class="b small">¿Cómo lo quieres?</span><div class="chips">';
  if(al.includes('mesa'))h+='<button class="chip" data-a="canal" data-v="mesa" aria-pressed="'+(c.canal==='mesa')+'">En mi mesa</button>';
  h+=(al.includes('llevar')?'<button class="chip" data-a="canal" data-v="llevar" aria-pressed="'+(c.canal==='llevar')+'">Para llevar</button>':'')+(al.includes('entrega')?'<button class="chip" data-a="canal" data-v="entrega" aria-pressed="'+(c.canal==='entrega')+'">Entrega cercana +'+m(S.settings.envio)+'</button>':'')+'</div></div>';
  if(c.canal==='entrega')h+='<label class="f">Dirección o referencia<input type="text" data-in="addr" value="'+esc(c.addr)+'" placeholder="Calle, número y referencia"></label>';
  h+='<div class="grid2" style="gap:8px"><label class="f">Tu nombre<input type="text" data-in="name" value="'+esc(S.me.name)+'" placeholder="Nombre"></label><label class="f">WhatsApp (para puntos y ticket)<input type="tel" data-in="tel" value="'+esc(S.me.tel)+'" placeholder="10 dígitos"></label></div>';
  let eff=c.canal;if(!dentro&&eff==='mesa')eff='llevar';
  const unpaid=mesaTotal(c.mesa);
  if(eff==='mesa'){
   const need=unpaid+sub>S.settings.cap;
   h+='<div class="banner '+(need?'warn':'good')+'">'+(need?'Tu cuenta abierta superaría '+m(S.settings.cap)+'. Para evitar pedidos fantasma, este envío requiere <b>pago por adelantado</b>.':'Se envía directo a cocina y barra. El mesero confirma tu mesa y pagas al final, o antes desde tu celular.')+'</div>';
   h+='<button class="btn pri" data-a="send">'+(need?'Pagar y enviar a cocina':'Enviar a cocina y barra')+'</button>'}
  else h+='<div class="banner warn">Pedido a distancia: <b>pago previo obligatorio</b>. No entra a cocina hasta confirmar el pago.</div><button class="btn pri" data-a="send">Pagar '+m(sub+(eff==='entrega'?S.settings.envio:0))+' y enviar</button>';
 }
 h+='</div>';
 const mine=myOrders();
 if(mine.length){h+='<div class="card stack"><h3>Seguimiento</h3>';mine.slice().reverse().forEach(o=>{h+='<div><div class="row between"><b>Pedido #'+o.id+' · '+(o.canal==='mesa'?mLabel(o.mesa):o.canal==='llevar'?'Para llevar':'Entrega')+'</b>'+(o.hold?'<span class="status s-warn">'+(o.aprobar?'Por aprobar del mesero':'Esperando pago')+'</span>':o.closed?'<span class="status s-good">Pagado</span>':'<span class="status s-neutral">Cuenta abierta</span>')+'</div>'+o.lines.map(l=>'<div class="row between small"><span>'+l.qty+' × '+esc(l.name)+' '+esc(l.v)+'</span>'+stPill(l.status)+'</div>').join('');
   if(o.hold&&!o.aprobar)h+='<div class="row" style="margin-top:6px"><button class="btn pri sm" data-a="paynow" data-o="'+o.id+'">Pagar ahora</button></div>';
   h+='</div>'});h+='</div>'}
 if(dentro){const mo=mesaOrders(c.mesa).filter(o=>o.src==='cliente');if(mo.length){const tot=mesaTotal(c.mesa);h+='<div class="card stack"><h3>Cuenta de '+mLabel(c.mesa)+'</h3><div class="row between"><span>Total acumulado</span><b class="num">'+m(tot)+'</b></div><div class="row"><button class="btn sm" data-a="ctaCuenta">'+(S.cuenta[c.mesa]?'Cuenta solicitada':'Pedir la cuenta al mesero')+'</button><button class="btn pri sm" data-a="paymesa">Pagar desde mi celular</button></div></div>'}}
 return h}
function stPill(s){return s==='nuevo'?'<span class="status s-neutral">En cola</span>':s==='preparando'?'<span class="status s-warn">Preparando</span>':s==='listo'?'<span class="status s-good">Listo</span>':'<span class="status s-neutral">Servido</span>'}
function cPuntos(){
 const L=S.loy,d=L.data,tel=S.me.tel;
 const modelo=d?d.modelo:'cashback';
 let h='';
 if(d&&d.found){
  const cl=d.cliente;
  h+='<div class="loy"><div class="row between"><b style="font-family:var(--display);font-size:22px">TOSTICHELAS</b><span class="xs">Tarjeta de lealtad</span></div><div><div class="big num">'+fmtSaldo(d,cl.puntos)+'</div><div class="small">'+(modelo==='cashback'?'de saldo para tu próxima cuenta':unidad(d))+' · '+d.parametro+'% de cashback en cada visita</div></div><div class="xs">'+esc(cl.nombre)+' · '+cl.visitas+' visitas</div></div>';
 }else{
  h+='<div class="loy"><div class="row between"><b style="font-family:var(--display);font-size:22px">TOSTICHELAS</b><span class="xs">Tarjeta de lealtad</span></div><div><div class="big num">$0</div><div class="small">Regístrate y gana '+(d&&d.parametro?d.parametro:5)+'% de saldo en cada cuenta</div></div></div>';
 }
 h+='<div class="card stack"><label class="f">Tu WhatsApp<input type="tel" data-in="tel" value="'+esc(tel)+'" placeholder="10 dígitos"></label>';
 if(tel.length===10){
  if(L.loading||!d)h+='<div class="small muted">Buscando tu tarjeta…</div>';
  else if(d.error)h+='<div class="banner warn">No pudimos consultar tu tarjeta ahora. Intenta de nuevo.</div>';
  else if(d.found){
   h+='<div class="small muted">Tu saldo se aplica en caja al pagar. Tu tarjeta vive en tu celular.</div><button class="btn pri" data-a="wallet"'+(L.wbusy?' disabled':'')+'>'+(L.wbusy?'Preparando…':'Agregar a Google Wallet')+'</button>'+(L.wmsg?'<div class="xs muted">'+esc(L.wmsg)+'</div>':'');
  }else{
   h+='<div class="small muted">Aún no tienes tarjeta. Créala en 10 segundos.</div><div class="grid2" style="gap:8px"><label class="f">Nombre<input type="text" data-in="lnom" value="'+esc(L.nom)+'"></label><label class="f">Fecha de nacimiento<input type="date" data-in="lnac" value="'+esc(L.nac)+'"></label></div><button class="btn pri" data-a="lalta"'+(L.wbusy?' disabled':'')+'>Crear mi tarjeta</button>';
  }
 }else h+='<div class="small muted">Escribe tu número para ver o crear tu tarjeta.</div>';
 return h+'</div>'}
function loadMe(){
 const L=S.loy,tel=S.me.tel;if(tel.length!==10)return;
 L.loading=true;L.data=null;
 lget('telefono='+tel).then(j=>{if(S.me.tel===tel){L.data=j;L.loading=false;render()}}).catch(e=>{if(S.me.tel===tel){L.data={error:e.message};L.loading=false;render()}});
}
async function addWallet(){
 const L=S.loy,tel=S.me.tel;L.wbusy=true;L.wmsg='';render();
 try{
  const r=await fetch('/api/wallet/tostichelas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({telefono:tel})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.saveUrl)throw new Error(j.error||'Wallet aún no está activo para esta demo');
  window.open(j.saveUrl,'_blank','noopener');L.wmsg='Se abrió Google Wallet para guardar tu tarjeta.';
 }catch(e){L.wmsg=e.message}
 L.wbusy=false;render();
}
async function altaMe(){
 const L=S.loy;
 if(!L.nom.trim()||!L.nac){toast('Escribe tu nombre y fecha de nacimiento');return}
 L.wbusy=true;render();
 try{await lpost({accion:'alta',telefono:S.me.tel,nombre:L.nom,fechaNacimiento:L.nac});toast('Tarjeta creada');S.real=null}catch(e){toast(e.message)}
 L.wbusy=false;loadMe();
}

/* ---------- modales ---------- */
function openProd(pid,target){const p=PM(pid);S.modal={type:'prod',pid,target,vi:0,pick:{},qty:1,note:'',quick:[]}}
function ticketTxt(t){return 'Tostichelas · Ticket '+t.id+'\n'+t.lines.map(l=>l.qty+' x '+l.name+' '+l.v+' '+m(lineTot(l))).join('\n')+'\nTotal '+m(t.total)+(t.loy&&t.loy.modelo==='cashback'?'\nSaldo en tu tarjeta: '+m2(t.loy.saldo):'')}
function modalHtml(){
 const md=S.modal;if(!md)return'';
 let h='<div class="scrim" data-a="mclose" data-scrim="1"><div class="sheet" role="dialog" aria-modal="true">';
 if(md.type==='prod'){
  const p=PM(md.pid),v=p.v[md.vi];
  h+='<div class="row between"><h2>'+esc(p.name)+'</h2><button class="btn ghost sm" data-a="mclose">Cerrar</button></div><div class="stack" style="margin-top:10px">';
  if(p.v.length>1){h+='<div><div class="b small">Presentación</div><div class="chips">'+p.v.map((x,i)=>'<button class="chip" data-a="mv" data-i="'+i+'" aria-pressed="'+(i===md.vi)+'">'+esc(x.l)+' · '+m(x.p)+'</button>').join('')+'</div></div>'}
  p.mods.forEach(g=>{
   if(g.showIf&&md.pick[g.showIf[0]]!==g.showIf[1])return;
   h+='<div><div class="b small">'+esc(g.g)+(g.req?' (obligatorio)':' (opcional)')+'</div><div class="chips">';
   if(!g.req)h+='<button class="chip" data-a="mo" data-g="'+esc(g.g)+'" data-l="" aria-pressed="'+(!md.pick[g.g])+'">Ninguno</button>';
   h+=g.opts.map(o=>{const pr=o.p[v.s];return'<button class="chip" data-a="mo" data-g="'+esc(g.g)+'" data-l="'+esc(o.l)+'" aria-pressed="'+(md.pick[g.g]===o.l)+'">'+esc(o.l)+(pr?' +'+m(pr):'')+'</button>'}).join('')+'</div></div>'});
  {const qs=quickOf(p.cat);if(qs.length)h+='<div><div class="b small">Personaliza tu pedido (opcional)</div><div class="chips">'+qs.map(x=>'<button class="chip" data-a="qk" data-l="'+esc(x)+'" aria-pressed="'+md.quick.includes(x)+'">'+esc(x)+'</button>').join('')+'</div></div>'}
  h+='<label class="f">Nota para cocina (opcional)<input type="text" data-in="mnote" value="'+esc(md.note)+'" placeholder="Sin cebolla, bien picoso..."></label>';
  const ready=p.mods.every(g=>!g.req||(g.showIf&&md.pick[g.showIf[0]]!==g.showIf[1])||md.pick[g.g]);
  const ln=buildLine();
  h+='<div class="row between"><div class="qty"><button data-a="mq" data-d="-1" aria-label="Quitar uno">−</button><b class="num">'+md.qty+'</b><button data-a="mq" data-d="1" aria-label="Agregar uno">+</button></div><button class="btn pri" data-a="madd"'+(ready?'':' disabled')+'>Agregar '+m(ln.unit*md.qty)+'</button></div></div>';
 }
 if(md.type==='rev'){
  const p=PM(md.pid);
  h+='<div class="row between"><h2>Califica '+esc(p.name)+'</h2><button class="btn ghost sm" data-a="mclose">Cerrar</button></div><div class="stack" style="margin-top:10px"><div class="chips">'+[1,2,3,4,5].map(n=>'<button class="chip" data-a="rstar" data-n="'+n+'" aria-pressed="'+(md.stars===n)+'">'+n+' ★</button>').join('')+'</div><label class="f">Tu opinión para los demás<textarea rows="3" data-in="rtext" placeholder="¿Qué pedirías de nuevo?">'+esc(md.text)+'</textarea></label><div class="xs muted">'+(S.cli.purchased[md.pid]?'Tu reseña llevará la marca de consumo verificado.':'Las reseñas de quienes ya pagaron este producto llevan marca de consumo verificado.')+'</div><button class="btn pri" data-a="rsend"'+(md.stars?'':' disabled')+'>Publicar reseña</button></div>';
 }
 if(md.type==='rate'){
  h+='<div class="row between"><h2>¿Cómo estuvo todo?</h2><button class="btn ghost sm" data-a="mclose">Después</button></div><p class="small muted">Tu calificación ayuda a que otros pidan lo mejor.</p><div class="stack">'+md.pids.map(id=>{const p=PM(id);return'<div class="row between"><span class="b">'+esc(p.name)+'</span><span class="chips">'+[1,2,3,4,5].map(n=>'<button class="chip" data-a="rrate" data-p="'+id+'" data-n="'+n+'" aria-pressed="'+(md.stars[id]===n)+'">'+n+'</button>').join('')+'</span></div>'}).join('')+'<button class="btn pri" data-a="rratesend">Enviar calificaciones</button></div>';
 }
 if(md.type==='pay'){
  h+='<div class="row between"><h2>Pago con link</h2><button class="btn ghost sm" data-a="mclose">Cerrar</button></div><div class="stack" style="margin-top:10px"><div class="banner warn">Simulación del pago. En producción abre Mercado Pago (SPEI, OXXO o tarjeta) y confirma solo.</div><div class="row between"><span>Total a pagar</span><b class="num" style="font-size:22px">'+m(md.total)+'</b></div><button class="btn pri" data-a="payok">Simular pago exitoso</button></div>';
 }

 if(md.type==='pedit'){
  const f=md.f,q=md.pid?PM(md.pid):null;
  h+='<div class="row between"><h2>'+(md.pid?'Editar producto':'Producto nuevo')+'</h2><button class="btn ghost sm" data-a="mclose">Cerrar</button></div><div class="stack" style="margin-top:10px"><div class="row" style="align-items:center"><div class="art pimg" style="--c:'+CATCOL[f.cat]+'">'+(f.img?'<img src="'+esc(f.img)+'" alt="">':'<span class="xs muted">Sin foto</span>')+'</div><div class="stack" style="gap:6px"><label class="btn sm" style="cursor:pointer">'+(md.up?'Subiendo…':'Subir foto')+'<input type="file" accept="image/*" data-file="pe" hidden></label>'+(f.img?'<button class="btn ghost sm" data-a="peimgx">Quitar foto</button>':'')+'<div class="xs muted">Se ajusta sola a un tamaño ligero.</div></div></div>'
  +'<label class="f">Nombre<input type="text" data-in="pe_name" value="'+esc(f.name)+'"></label><label class="f">Descripción<input type="text" data-in="pe_desc" value="'+esc(f.desc)+'" placeholder="Qué lleva"></label>'
  +'<div class="grid2" style="gap:8px"><label class="f">Categoría<select data-in="pe_cat">'+CATS.map(c=>'<option'+(c===f.cat?' selected':'')+'>'+c+'</option>').join('')+'</select></label><label class="f">Se prepara en<select data-in="pe_station"><option value="cocina"'+(f.station==='cocina'?' selected':'')+'>Cocina</option><option value="barra"'+(f.station==='barra'?' selected':'')+'>Barra</option></select></label></div>'
  +(q&&!q.custom&&q.v.length>1?q.v.map((x,i)=>'<label class="f">Precio · '+esc(x.l)+'<input type="number" inputmode="decimal" data-in="pe_p" data-i="'+i+'" value="'+esc(f.price[i])+'"></label>').join(''):(md.pid?'':'<label class="f">Presentación<input type="text" data-in="pe_label" value="'+esc(f.label)+'"></label>')+'<label class="f">Precio<input type="number" inputmode="decimal" data-in="pe_p" data-i="0" value="'+esc(f.price[0]||'')+'"></label>')
  +recetaHtml(f)+'<label class="f">Otros costos por pieza (empaque, etc.)<input type="number" inputmode="decimal" data-in="pe_cost" value="'+esc(f.cost)+'" placeholder="0"></label>'
  +'<div class="row between"><button class="btn pri" data-a="pesave"'+(md.up?' disabled':'')+'>Guardar</button>'+(q&&q.custom?'<button class="btn" data-a="pedel">Eliminar producto</button>':'')+'</div></div>';
 }
 if(md.type==='prodask'){
  h+='<div class="row between"><h2>Pasar a producción</h2><button class="btn ghost sm" data-a="mclose">Cancelar</button></div><div class="stack" style="margin-top:10px"><p class="small">Se borran las ventas, reseñas, clientes y pedidos de ejemplo. Se conservan tu menú, tus fotos y tus precios. No se puede deshacer.</p><label class="f">Escribe EMPEZAR para confirmar<input type="text" data-in="ptxt" value="'+esc(md.txt||'')+'" autocomplete="off"></label><button class="btn pri" data-a="prodgo">Borrar ejemplos y empezar</button></div>';
 }
 if(md.type==='pin'){
  h+='<div class="row between"><h2>Acceso de '+(md.role==='caja'?'Caja':'Dueño')+'</h2><button class="btn ghost sm" data-a="mclose">Cancelar</button></div><div class="stack" style="margin-top:10px"><label class="f">PIN de 4 dígitos<input type="password" inputmode="numeric" maxlength="4" data-in="pin" value="'+esc(md.pin)+'" placeholder="••••"></label><div class="xs muted">'+(PROD?'':'PIN de la demo: '+S.pins[md.role]+'. ')+'Cada perfil tiene el suyo, así el mesero no entra a la caja ni a las ganancias.</div><button class="btn pri" data-a="pinok">Entrar</button></div>';
 }
 if(md.type==='ticket'){
  const t=S.tickets.find(x=>x.id===md.id);
  const txt=ticketTxt(t);
  h+='<div class="row between"><h2>Ticket digital</h2><span class="row" style="gap:6px"><button class="btn ghost sm" data-a="printt" data-t="'+t.id+'">Imprimir (opcional)</button><button class="btn ghost sm" data-a="mclose">Cerrar</button></span></div><div class="stack" style="margin-top:10px"><div class="card stack" style="gap:6px"><b>TOSTICHELAS · #'+t.id+'</b><span class="xs muted">'+new Date(t.ts).toLocaleString('es-MX')+' · '+(t.mesa?mLabel(t.mesa):t.canal==='llevar'?'Para llevar':'Entrega')+'</span>'+t.lines.map(l=>'<div class="row between small"><span>'+l.qty+' × '+lineHtml(l)+'</span><span class="num">'+m(lineTot(l))+'</span></div>').join('')+(t.disc?'<div class="row between small"><span>Descuento por puntos</span><span class="num">−'+m(t.disc)+'</span></div>':'')+(t.tip?'<div class="row between small"><span>Propina</span><span class="num">'+m(t.tip)+'</span></div>':'')+(t.envio?'<div class="row between small"><span>Envío</span><span class="num">'+m(t.envio)+'</span></div>':'')+'<div class="row between b"><span>Total · '+esc(t.method)+'</span><span class="num">'+m(t.total)+'</span></div>'+(t.loy?'<hr><div class="small"><b>Tarjeta Tostichelas</b><br>'+(t.loy.usado?'Usaste '+m(t.loy.usado)+' de saldo.<br>':'')+(t.loy.modelo==='cashback'?'Ganaste '+m2(t.loy.ganado)+' de saldo. Saldo ahora: <b>'+m2(t.loy.saldo)+'</b>':'Ganaste '+t.loy.ganado+' y llevas <b>'+t.loy.saldo+'</b>')+(t.loy.nuevo?'<br>Tu tarjeta ya está creada: guárdala en Google Wallet desde la pestaña Mis puntos.':'')+'</div>':'')+'</div><a class="btn pri" style="text-decoration:none;text-align:center" target="_blank" rel="noopener" href="https://wa.me/'+(t.cliente&&t.cliente.tel?'52'+esc(t.cliente.tel):'')+'?text='+encodeURIComponent(txt)+'">Enviar ticket por WhatsApp</a><button class="btn" disabled>Facturar (en integración)</button><div class="xs muted">Sin impresora: el cliente recibe este ticket en su WhatsApp, junto con el link para guardar su tarjeta y calificar.</div></div>';
 }
 return h+'</div></div>'}
function buildLine(){const md=S.modal,p=PM(md.pid),v=p.v[md.vi];const mods=[];p.mods.forEach(g=>{if(g.showIf&&md.pick[g.showIf[0]]!==g.showIf[1])return;const l=md.pick[g.g];if(!l)return;const o=g.opts.find(x=>x.l===l);mods.push({g:g.g,l:(g.g==='Preparado'||g.g==='Vaso')?g.g+' '+l:l,p:o.p[v.s]})});return lineFrom(p,md.vi,mods,md.qty,(md.quick||[]).concat(md.note&&md.note.trim()?[md.note.trim()]:[]).join(', '))}

/* ---------- mesero ---------- */
function mesaState(k){const os=mesaOrders(k);return{os,pc:os.some(o=>o.porConfirmar)||S.orders.some(o=>o.mesa===k&&o.aprobar&&!o.cancel&&!o.closed),listo:os.some(o=>o.lines.some(l=>l.status==='listo')),cuenta:!!S.cuenta[k],total:os.reduce((a,o)=>a+orderSub(o),0)}}
function vMesero(){
 const w=S.mw;
 if(w.adding)return mAdd();
 let h='<div class="stack" style="margin-top:12px"><span class="pill-title" style="margin:4px 0">Mis mesas</span><div class="mesas">';
 MESAS.forEach(x=>{const s=mesaState(x.k);const cls=s.pc?'alerta':s.os.length?'ocupada':'';
  h+='<button class="mesa '+cls+'" data-a="msel" data-k="'+x.k+'" aria-pressed="'+(w.sel===x.k)+'"><span class="nm">'+x.label+'</span><span class="xs">'+(s.os.length?m(s.total):'Libre')+'</span><span class="row" style="gap:4px">'+(s.pc?'<span class="status s-bad">Confirmar</span>':'')+(s.cuenta?'<span class="status s-warn">Cuenta</span>':'')+(s.listo?'<span class="dot pulse" title="Hay algo listo"></span>':'')+'</span></button>'});
 h+='</div>';
 if(w.sel)h+=mDetail(w.sel);
 const take=S.orders.filter(o=>(o.canal==='llevar'||o.canal==='entrega')&&!o.cancel&&!o.hold&&!o.done);
 h+='<span class="pill-title" style="margin:4px 0">Para llevar y entregas</span>';
 if(!take.length)h+='<div class="card small muted">Sin pedidos para llevar por ahora. Los que llegan por link ya vienen pagados.</div>';
 take.forEach(o=>{const all=o.lines.every(l=>l.status==='listo'||l.status==='entregado');h+='<div class="card stack" style="gap:6px"><div class="row between"><b>#'+o.id+' · '+(o.canal==='llevar'?'Para llevar':'Entrega cercana')+' · '+esc(o.cliente.name||'Cliente')+'</b><span class="status s-good">Pagado</span></div>'+(o.addr?'<div class="small muted">Dirección: '+esc(o.addr)+'</div>':'')+o.lines.map(l=>'<div class="row between small"><span>'+l.qty+' × '+esc(l.name)+' '+esc(l.v)+'</span>'+stPill(l.status)+'</div>').join('')+'<div class="row">'+(o.canal==='entrega'&&o.stage!=='camino'?'<button class="btn sm" data-a="stage" data-o="'+o.id+'"'+(all?'':' disabled')+'>Salió a entregar</button>':'')+'<button class="btn pri sm" data-a="done" data-o="'+o.id+'"'+(all?'':' disabled')+'>'+(o.canal==='llevar'?'Entregado al cliente':'Entregado')+'</button></div></div>'});
 return h+'</div>'}
function qrHtml(k){let s='';let a=parseInt(tokenOf(k),10);for(let i=0;i<81;i++){a=(a*1103515245+12345)&0x7fffffff;const corner=(i%9<3&&Math.floor(i/9)<3)||(i%9>5&&Math.floor(i/9)<3)||(i%9<3&&Math.floor(i/9)>5);s+='<i class="'+((corner||a%3===0)?'on':'')+'"></i>'}return'<div class="qr" aria-hidden="true">'+s+'</div>'}
function mDetail(k){
 const s=mesaState(k);const pend=S.orders.filter(o=>o.mesa===k&&o.aprobar&&!o.cancel&&!o.closed);let h='<div class="card stack"><div class="row between"><h3>'+mLabel(k)+'</h3><span class="b num">'+m(s.total)+'</span></div><div class="row" style="gap:12px">'+mesaQr(k)+'<div class="small muted">QR de la mesa (se imprime en Dueño, Lealtad y QR). Cada QR trae un código que cambia al liberar la mesa: <b class="num">'+tokenOf(k)+'</b>. Con el código y la ubicación del celular, el cliente puede pedir desde su lugar.</div></div>';
 if(!s.os.length&&!pend.length)h+='<div class="small muted">Mesa libre. Agrega un pedido o espera a que el cliente escanee el QR.</div>';
 pend.concat(s.os).forEach(o=>{h+='<div class="stack" style="gap:6px"><div class="row between"><span class="b small">Pedido #'+o.id+' · '+(o.src==='cliente'?'por QR del cliente':'tomado por mesero')+'</span><span class="xs muted">hace '+ago(o.created)+'</span></div>';
  if(o.aprobar)h+='<div class="banner bad"><b>Pedido por aprobar.</b> El cliente lo pidió desde su celular. Revisa que sea real y mándalo a cocina.<div class="row" style="margin-top:6px"><button class="btn sm pri" data-a="aprob" data-o="'+o.id+'">Aprobar y mandar a cocina</button><button class="btn sm" data-a="rechaz" data-o="'+o.id+'">Rechazar</button></div></div>';else if(o.porConfirmar)h+='<div class="banner bad"><b>Confirma que hay gente en la mesa.</b> Si no hay nadie, anula el pedido y regresa el inventario.<div class="row" style="margin-top:6px"><button class="btn sm pri" data-a="conf" data-o="'+o.id+'">Sí, hay clientes</button><button class="btn sm" data-a="anular" data-o="'+o.id+'">Anular pedido</button></div></div>';
  o.lines.forEach(l=>{h+='<div class="row between" style="align-items:flex-start"><div class="small grow">'+l.qty+' × '+lineHtml(l)+'</div>'+stPill(l.status)+((l.status==='listo'||(S.kds.screen&&l.status==='preparando'))?'<button class="btn sm pri" data-a="servir" data-o="'+o.id+'" data-u="'+l.uid+'">'+(l.status==='listo'?'Servir':'Recoger y servir')+'</button>':'')+'</div>'});
  h+='</div><hr>'});
 h+='<div class="row"><button class="btn pri sm" data-a="madding" data-k="'+k+'">Agregar pedido</button>'+(s.os.length?'<button class="btn sm" data-a="mcuenta" data-k="'+k+'">'+(S.cuenta[k]?'Cuenta ya en caja':'Pasar cuenta a caja')+'</button>':'')+'</div></div>';
 return h}
function mAdd(){
 const w=S.mw;let h='<div class="stack" style="margin-top:12px"><div class="row between"><h2>Pedido para '+mLabel(w.sel)+'</h2><button class="btn ghost sm" data-a="mback">Volver</button></div>';
 CATS.forEach(c=>{h+='<div class="card stack" style="gap:6px"><b>'+c+'</b>'+MENU.filter(p=>p.cat===c).map(p=>'<div class="row between"><div class="grow"><span class="b small">'+esc(p.name)+'</span> <span class="xs muted">'+fromPrice(p)+'</span></div>'+(soldOut(p)?'<span class="status s-bad">Agotado</span>':'<button class="btn sm" data-a="mpick" data-p="'+p.id+'">+</button>')+'</div>').join('')+'</div>'});
 h+='<div class="card stack"><h3>Por enviar</h3>'+(w.cart.length?w.cart.map((l,i)=>'<div class="row between"><div class="small grow">'+l.qty+' × '+lineHtml(l)+'</div><b class="num small">'+m(lineTot(l))+'</b><button class="btn ghost sm" data-a="mrm" data-i="'+i+'">Quitar</button></div>').join(''):'<div class="small muted">Elige productos arriba.</div>')+'<button class="btn pri" data-a="msend"'+(w.cart.length?'':' disabled')+'>Enviar a cocina y barra</button></div></div>';
 return h}

/* ---------- cocina y barra ---------- */
function vKds(st){
 const title=st==='cocina'?'Cocina':'Barra';
 const tks=live().map(o=>({o,ls:o.lines.filter(l=>l.station===st&&l.status!=='entregado')})).filter(x=>x.ls.length);
 const stOf=x=>x.ls.every(l=>l.status==='listo')?'listo':x.ls.some(l=>l.status==='preparando')?'preparando':'nuevo';
 const cols=[['nuevo','Nuevos'],['preparando','Preparando'],['listo','Listos']];
 const sc=S.kds.screen;
 let h='<div class="stack" style="margin-top:12px"><div class="row between"><h2>'+title+'</h2><span class="row" style="gap:8px"><span class="small muted">'+(sc?'Modo pantalla: sin tocar. Avanza solo; el pedal o botón marca listo.':'Se actualiza solo. Toca el botón de cada comanda para avanzar.')+'</span><button class="btn sm" data-a="kscreen" aria-pressed="'+sc+'">'+(sc?'Salir de modo pantalla':'Modo pantalla (sin tocar)')+'</button></span></div><div class="kds">';
 cols.forEach(c=>{const arr=tks.filter(x=>stOf(x)===c[0]).sort((a,b)=>a.o.created-b.o.created);
  h+='<div class="kcol"><h3>'+c[1]+' ('+arr.length+')</h3>';
  if(!arr.length)h+='<div class="small muted">Sin comandas</div>';
  arr.forEach(x=>{const mi=mins(x.o.created);const cls=c[0]==='listo'?'ok':mi>=15?'late':'';
   h+='<div class="ticket '+cls+'"><div class="row between"><b>'+(x.o.canal==='mesa'?mLabel(x.o.mesa):x.o.canal==='llevar'?'Para llevar':'Entrega')+' · #'+x.o.id+'</b><span class="status '+(mi>=15&&c[0]!=='listo'?'s-bad':'s-neutral')+' num">'+mi+' min</span></div>'+(x.o.porConfirmar?'<div class="xs" style="color:var(--warn)">Mesero por confirmar mesa</div>':'')+'<ul>'+x.ls.map(l=>'<li>'+l.qty+' × '+lineHtml(l)+'</li>').join('')+'</ul>'+(sc?(c[0]==='nuevo'?'<span class="small muted">Entra a preparación en unos segundos</span>':c[0]==='preparando'?'<span class="small b">Pedal o tecla Espacio: marcar listo</span>':'<span class="small b" style="color:var(--good)">Listo. El mesero ya fue avisado</span>'):(c[0]==='nuevo'?'<button class="btn pri sm" data-a="kadv" data-o="'+x.o.id+'" data-s="'+st+'">Empezar a preparar</button>':c[0]==='preparando'?'<button class="btn pri sm" data-a="kadv" data-o="'+x.o.id+'" data-s="'+st+'">Marcar listo</button>':'<span class="small b" style="color:var(--good)">Esperando al mesero</span>'))+'</div>'});
  h+='</div>'});
 return h+'</div></div>'}

/* ---------- caja ---------- */
const holds=()=>S.orders.filter(o=>o.hold&&!o.cancel&&!o.aprobar);
function vCaja(){
 const c=S.caja;let h='<div class="stack" style="margin-top:12px"><div class="chips"><button class="chip" data-a="ctab" data-v="cobro" aria-pressed="'+(c.tab==='cobro')+'">Cobrar</button><button class="chip" data-a="ctab" data-v="corte" aria-pressed="'+(c.tab==='corte')+'">Corte de caja</button></div>';
 if(c.tab==='corte')return h+corte()+'</div>';
 h+='<div class="grid2"><div class="stack"><span class="pill-title" style="margin:0">Cuentas abiertas</span>';
 const abiertas=MESAS.filter(x=>mesaOrders(x.k).length);
 if(!abiertas.length)h+='<div class="card small muted">No hay cuentas abiertas.</div>';
 abiertas.forEach(x=>{const s=mesaState(x.k);h+='<button class="card row between" style="text-align:left;'+(c.sel==='m:'+x.k?'outline:3px solid var(--ink)':'')+'" data-a="csel" data-k="m:'+x.k+'"><span class="b">'+x.label+'</span><span class="row" style="gap:6px">'+(s.cuenta?'<span class="status s-warn">Pidió cuenta</span>':'')+'<b class="num">'+m(s.total)+'</b></span></button>'});
 const hs=holds();
 h+='<span class="pill-title" style="margin:8px 0 0">Esperando pago ('+hs.length+')</span>';
 if(!hs.length)h+='<div class="card small muted">Aquí caen los pedidos a distancia sin pagar. No llegan a cocina hasta que se confirma el pago.</div>';
 hs.forEach(o=>{h+='<div class="card stack" style="gap:6px"><div class="row between"><b>#'+o.id+' · '+(o.canal==='mesa'?mLabel(o.mesa):o.canal==='llevar'?'Para llevar':'Entrega')+'</b><span class="status s-warn">Hace '+ago(o.created)+'</span></div><div class="small muted">'+o.lines.map(l=>l.qty+' × '+esc(l.name)).join(', ')+'</div><div class="row between"><b class="num">'+m(orderSub(o)+o.envio)+'</b><span class="row"><button class="btn pri sm" data-a="hpaid" data-o="'+o.id+'">Pago recibido</button><button class="btn sm" data-a="hcancel" data-o="'+o.id+'">Cancelar</button></span></div></div>'});
 h+='</div><div>'+cobro()+'</div></div></div>';
 return h}
function cobro(){
 const c=S.caja;if(!c.sel||c.sel.indexOf('m:')!==0)return'<div class="card small muted">Elige una cuenta para cobrar.</div>';
 const k=c.sel.slice(2),os=mesaOrders(k);if(!os.length){c.sel=null;return'<div class="card small muted">Elige una cuenta para cobrar.</div>'}
 const sub=os.reduce((a,o)=>a+orderSub(o),0),tip=Math.round(sub*c.tip/100);
 const lc=c.lc&&c.lc.found?c.lc:null;const saldo=lc?Math.floor(lc.cliente.puntos):0;const disc=(c.canje&&saldo>0&&lc.modelo==='cashback')?Math.min(saldo,sub):0;const tot=sub-disc+tip;
 let h='<div class="card stack"><h3>Cobrar '+mLabel(k)+'</h3>';
 os.forEach(o=>o.lines.forEach(l=>{h+='<div class="row between small"><span>'+l.qty+' × '+lineHtml(l)+'</span><span class="num">'+m(lineTot(l))+'</span></div>'}));
 h+='<div class="sep"></div><div class="row between"><span>Subtotal</span><b class="num">'+m(sub)+'</b></div>';
 h+='<div><div class="b small">Propina</div><div class="chips">'+[0,10,15,20].map(x=>'<button class="chip" data-a="tip" data-v="'+x+'" aria-pressed="'+(c.tip===x)+'">'+(x?x+'%':'Sin propina')+'</button>').join('')+'</div></div>';
 h+='<div><div class="b small">Método</div><div class="chips">'+['Efectivo','Tarjeta','Transferencia'].map(x=>'<button class="chip" data-a="method" data-v="'+x+'" aria-pressed="'+(c.method===x)+'">'+x+'</button>').join('')+'</div></div>';
 if(c.method==='Efectivo')h+='<label class="f">Recibido<input type="number" inputmode="decimal" data-in="recv" value="'+esc(c.recv)+'" placeholder="0"></label><div class="b" id="cambio">'+cambioTxt(tot)+'</div>';
 else if(c.method==='Tarjeta')h+='<div class="small muted">Cobra en la terminal bancaria del negocio y registra aquí el pago.</div>';
 h+='<div><div class="b small">Dividir cuenta</div><div class="chips">'+[1,2,3,4,5,6].map(x=>'<button class="chip" data-a="split" data-v="'+x+'" aria-pressed="'+(c.split===x)+'">'+x+'</button>').join('')+'</div>'+(c.split>1?'<div class="small">Cada quien paga <b class="num">'+m(tot/c.split)+'</b></div>':'')+'</div>';

 h+='<div class="stack" style="gap:6px"><label class="f">WhatsApp del cliente (tarjeta de lealtad y ticket)<input type="tel" data-in="ctel" value="'+esc(c.tel)+'" placeholder="10 dígitos"></label>';
 const L=c.lc;
 if(c.tel.length===10){
  if(!L||L.loading)h+='<div class="small muted">Buscando tarjeta…</div>';
  else if(L.error)h+='<div class="banner warn">No se pudo consultar lealtad ('+esc(L.error)+'). Puedes cobrar sin puntos.</div>';
  else if(L.found){h+='<div class="row between small"><span><b>'+esc(L.cliente.nombre)+'</b> · saldo '+fmtSaldo(L,L.cliente.puntos)+' '+(L.modelo==='cashback'?'':unidad(L))+'</span>'+(L.modelo==='cashback'&&saldo>0?'<button class="chip" data-a="canje" aria-pressed="'+c.canje+'">Usar '+m(Math.min(saldo,sub))+' de saldo</button>':'')+'</div>'}
  else h+='<div class="banner warn">Cliente nuevo. Pide su nombre y fecha de nacimiento para crear su tarjeta.</div><div class="grid2" style="gap:8px"><label class="f">Nombre<input type="text" data-in="cnom" value="'+esc(c.nom)+'"></label><label class="f">Fecha de nacimiento<input type="date" data-in="cnac" value="'+esc(c.nac)+'"></label></div>';
  if(L&&!L.error&&!L.loading&&L.modelo==='cashback')h+='<div class="xs muted">Esta venta le suma aprox. '+m2((sub-disc)*L.parametro/100)+' de saldo ('+L.parametro+'% de cashback).</div>';
 }
 h+='</div>';
 if(disc)h+='<div class="row between small"><span>Saldo aplicado</span><b class="num">−'+m(disc)+'</b></div>';
 h+='<div class="row between"><span class="b">Total</span><b class="num" style="font-size:26px">'+m(tot)+'</b></div><button class="btn pri" data-a="cobrar"'+(c.busy?' disabled':'')+'>'+(c.busy?'Cobrando…':'Cobrar y enviar ticket')+'</button><button class="btn" disabled>Facturar (en integración)</button></div>';
 return h}
const cambioTxt=tot=>{const r=parseFloat(S.caja.recv);if(!r)return'Cambio: escribe lo recibido';return r>=tot?'Cambio: '+m(r-tot):'Faltan '+m(tot-r)};
function dayTickets(){const d=new Date();d.setHours(0,0,0,0);return S.tickets.filter(t=>t.ts>=d.getTime())}
const movNet=()=>S.caja.movs.reduce((a,x)=>a+(x.tipo==='entrada'?x.monto:-x.monto),0);
function corte(){
 const c=S.caja,ts=dayTickets();const by={Efectivo:0,Tarjeta:0,Transferencia:0,'Link de pago':0};let tips=0,sub=0;
 ts.forEach(t=>{by[t.method]=(by[t.method]||0)+t.total;tips+=t.tip;sub+=t.sub-t.disc});
 const esp=Number(c.fondo||0)+by.Efectivo+movNet(),cont=parseFloat(c.contado);
 let h='<div class="grid2"><div class="card stack"><h3>Corte del día</h3>';
 [['Efectivo',by.Efectivo],['Tarjeta',by.Tarjeta],['Transferencia',by.Transferencia],['Link de pago',by['Link de pago']||0]].forEach(x=>{h+='<div class="row between"><span>'+x[0]+'</span><b class="num">'+m(x[1])+'</b></div>'});
 h+='<div class="sep"></div><div class="row between"><span>Ventas sin propina</span><b class="num">'+m(sub)+'</b></div><div class="row between"><span>Propinas</span><b class="num">'+m(tips)+'</b></div><div class="row between"><span>Tickets</span><b class="num">'+ts.length+'</b></div></div>';
 h+='<div class="card stack"><h3>Cuadre de efectivo</h3><label class="f">Fondo inicial<input type="number" inputmode="decimal" data-in="fondo" value="'+esc(c.fondo)+'"></label>'+(c.movs.length?c.movs.map(x=>'<div class="row between small"><span>'+(x.tipo==='entrada'?'Entrada':'Retiro')+': '+esc(x.motivo)+'</span><b class="num">'+(x.tipo==='entrada'?'+':'−')+m(x.monto)+'</b></div>').join(''):'')+'<div class="row between"><span>Efectivo esperado</span><b class="num" id="esp">'+m(esp)+'</b></div><label class="f">Efectivo contado<input type="number" inputmode="decimal" data-in="contado" value="'+esc(c.contado)+'" placeholder="0"></label><div class="b" id="dif">'+difTxt(esp,cont)+'</div><div class="xs muted">En producción este cierre se guarda y se manda al dueño por WhatsApp.</div></div></div>';
 h+='<div class="card stack"><h3>Entradas y retiros de efectivo</h3><div class="chips"><button class="chip" data-a="mtipo" data-v="retiro" aria-pressed="'+(c.mt==='retiro')+'">Retiro</button><button class="chip" data-a="mtipo" data-v="entrada" aria-pressed="'+(c.mt==='entrada')+'">Entrada</button></div><div class="grid2" style="gap:8px"><label class="f">Monto<input type="number" inputmode="decimal" data-in="mm" value="'+esc(c.mm)+'" placeholder="0"></label><label class="f">Motivo<input type="text" data-in="mo" value="'+esc(c.mo)+'" placeholder="Hielo, cambio, propina…"></label></div><button class="btn" data-a="movadd">Registrar movimiento</button><div class="xs muted">Queda en el corte con quién y cuándo, y descuenta del efectivo esperado.</div></div>';
 return h}
const difTxt=(esp,cont)=>isNaN(cont)?'Escribe lo contado para ver la diferencia':(cont===esp?'Caja cuadrada':(cont>esp?'Sobran '+m(cont-esp):'Faltan '+m(esp-cont)));

/* ---------- dueño ---------- */
function stats(){
 const ts=dayTickets();let rev=0,cost=0,tips=0;const prod={},hours={},canal={mesa:0,llevar:0,entrega:0};
 ts.forEach(t=>{const sub=t.sub-t.disc;rev+=sub;tips+=t.tip;canal[t.canal]=(canal[t.canal]||0)+sub;t.lines.forEach(l=>{const cs=l.cost!=null?l.cost:lineCost(l);cost+=cs;const x=prod[l.pid]||(prod[l.pid]={pid:l.pid,qty:0,rev:0,cost:0});x.qty+=l.qty;x.rev+=lineTot(l);x.cost+=cs});const hr=new Date(t.ts).getHours();hours[hr]=(hours[hr]||0)+sub});
 return{ts,rev,cost,tips,prod:Object.keys(prod).map(k=>prod[k]),hours,canal}}
function vDueno(){
 const o=S.own;const tabs=[['resumen','Resumen'],['inventario','Inventario'],['menu','Menú y márgenes'],['finanzas','Finanzas'],['lealtad','Lealtad y QR'],['clientes','Clientes'],['ajustes','Ajustes'],['seguridad','Seguridad']];
 let h='<div class="stack" style="margin-top:12px"><div class="chips scroll">'+tabs.map(t=>'<button class="chip" data-a="otab" data-v="'+t[0]+'" aria-pressed="'+(o.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>';
 if(o.tab==='resumen')h+=dResumen();else if(o.tab==='inventario')h+=dInv();else if(o.tab==='menu')h+=dMenu();else if(o.tab==='clientes')h+=dClientes();else if(o.tab==='ajustes')h+=dAjustes();else if(o.tab==='finanzas')h+=dFin();else if(o.tab==='lealtad')h+=dLealtad();else h+=dSeg();
 return h+'</div>'}
function dResumen(){
 const s=stats(),n=s.ts.length,avg=n?s.rev/n:0,prof=s.rev-s.cost;
 let h='<div class="kpis cols3"><div class="kpi"><div class="xs muted">Ventas de hoy</div><div class="v num">'+m(s.rev)+'</div></div><div class="kpi"><div class="xs muted">Tickets</div><div class="v num">'+n+'</div></div><div class="kpi"><div class="xs muted">Ticket promedio</div><div class="v num">'+m(avg)+'</div></div><div class="kpi"><div class="xs muted">Ganancia estimada</div><div class="v num">'+m(prof)+'</div><div class="xs muted">'+(s.rev?Math.round(prof/s.rev*100):0)+'% de margen sobre insumos</div></div></div>';
 const hrs=[];for(let x=13;x<=21;x++)hrs.push(x);const mx=Math.max(1,...hrs.map(x=>s.hours[x]||0));
 h+='<div class="grid2"><div class="card stack"><h3>Ventas por hora</h3><div class="bars">'+hrs.map(x=>'<div class="bar" style="height:'+Math.round((s.hours[x]||0)/mx*100)+'%"><span class="num">'+(s.hours[x]?m(s.hours[x]):'')+'</span></div>').join('')+'</div><div class="axis">'+hrs.map(x=>'<div>'+x+'h</div>').join('')+'</div></div>';
 const topv=s.prod.slice().sort((a,b)=>b.rev-a.rev).slice(0,6);
 h+='<div class="card stack"><h3>Lo que más deja</h3><div class="scrollx"><table class="tbl"><thead><tr><th>Producto</th><th class="r">Uds</th><th class="r">Venta</th><th class="r">Ganancia</th></tr></thead><tbody>'+topv.map(x=>'<tr><td>'+esc(PM(x.pid).name)+'</td><td class="r num">'+x.qty+'</td><td class="r num">'+m(x.rev)+'</td><td class="r num">'+m(x.rev-x.cost)+'</td></tr>').join('')+'</tbody></table></div></div></div>';
 const rk=MENU.slice().sort((a,b)=>scoreOf(b.id)-scoreOf(a.id)).slice(0,5);
 h+='<div class="grid2"><div class="card stack"><h3>Canales</h3>'+[['mesa','En mesa'],['llevar','Para llevar'],['entrega','Entrega']].map(c=>'<div class="row between"><span>'+c[1]+'</span><b class="num">'+m(s.canal[c[0]]||0)+'</b></div>').join('')+'<div class="row between"><span>Propinas (van al equipo)</span><b class="num">'+m(s.tips)+'</b></div></div><div class="card stack"><h3>Lo que recomienda la comunidad</h3>'+rk.map(p=>'<div class="row between"><span>'+esc(p.name)+'</span><span class="small">'+starsHtml(avgOf(p.id))+' <span class="num">'+avgOf(p.id).toFixed(1)+'</span> · '+S.soc.likes[p.id]+' me gusta</span></div>').join('')+'</div></div>';
 h+='<div class="banner warn"><b>Facturación CFDI:</b> en integración. Hoy el ticket se envía digital y el dueño factura por su cuenta.</div>';
 return h}
function dInv(){
 const low=S.inv.filter(i=>i.stock<=i.min).length;
 let h='<div class="banner '+(low?'warn':'good')+'">'+(low?low+' insumos por debajo del mínimo. Cada venta descuenta inventario sola.':'Inventario en orden. Cada venta descuenta inventario sola.')+'</div>';
 h+='<div class="card stack"><h3>Inventario</h3><div class="scrollx"><table class="tbl"><thead><tr><th>Insumo</th><th>Nivel</th><th class="r">Sistema</th><th class="r">Costo</th><th>Conteo físico</th></tr></thead><tbody>'+S.inv.map(i=>{const pct=Math.min(100,Math.max(0,i.stock/(i.min*3)*100));const cls=i.stock<=0?'zero':i.stock<=i.min?'low':'';return'<tr><td>'+esc(i.name)+'</td><td><div class="meter '+cls+'"><i style="width:'+pct+'%"></i></div></td><td class="r num">'+(Math.round(i.stock*100)/100)+' '+i.unit+'</td><td class="r"><input type="number" inputmode="decimal" step="0.01" style="width:80px;min-height:32px;padding:2px 6px" data-in="icost" data-i="'+i.id+'" value="'+esc(i.cost)+'" aria-label="Costo de '+esc(i.name)+'"></td><td><div class="row" style="flex-wrap:nowrap"><input type="number" inputmode="decimal" style="width:80px;min-height:32px;padding:2px 6px" data-in="cnt" data-i="'+i.id+'" value="'+esc(i.count)+'" aria-label="Conteo de '+esc(i.name)+'"><button class="btn sm" data-a="cnt" data-i="'+i.id+'">Registrar</button></div></td></tr>'}).join('')+'</tbody></table></div></div>';
 h+=invExtra();
 h+='<div class="card stack"><h3>Mermas y diferencias</h3><div class="small muted">Si el conteo no coincide con lo que dice el sistema, queda registrado aquí con su valor en pesos.</div>'+(S.mermas.length?S.mermas.slice().reverse().map(x=>'<div class="row between small"><span>'+esc(x.name)+' · '+(x.diff>0?'sobran ':'faltan ')+Math.abs(Math.round(x.diff*100)/100)+' '+x.unit+'</span><span><b class="num" style="color:'+(x.diff<0?'var(--bad)':'var(--good)')+'">'+m(Math.abs(x.val))+'</b> <span class="xs muted">'+ago(x.ts)+'</span></span></div>').join(''):'<div class="small muted">Sin diferencias registradas.</div>')+'</div>';
 return h}
function dMenu(){
 return '<div class="card stack"><div class="row between"><h3>Tu menú</h3><button class="btn pri sm" data-a="pnew">Agregar producto</button></div><div class="small muted">Edita nombre, precio y foto de cada producto. Apaga uno cuando se acabe y desaparece del menú del cliente y del mesero. En el costo de producto escribe lo que te cuesta prepararlo para ver tu margen real.</div><div class="scrollx"><table class="tbl"><thead><tr><th>Producto</th><th class="r">Precio</th><th class="r">Costo</th><th class="r">Margen</th><th>Receta</th><th>Hoy</th><th></th></tr></thead><tbody>'+MENU.map(p=>{const l=lineFrom(p,0,[],1);const c=lineCost(l),pr=p.v[0].p;return'<tr><td><div class="row" style="flex-wrap:nowrap;gap:8px"><span class="art mini" style="--c:'+CATCOL[p.cat]+'">'+artHtml(p)+'</span><span>'+esc(p.name)+' <span class="xs muted">'+esc(p.v[0].l)+'</span></span></div></td><td class="r num">'+m(pr)+'</td><td class="r num">'+m(c)+'</td><td class="r num">'+(c?Math.round((pr-c)/pr*100)+'%':'—')+'</td><td>'+(Object.keys(p.use).length?'<span class="status s-good">Con receta</span>':'<span class="status s-warn">Sin receta</span>')+'</td><td><button class="chip" data-a="avail" data-p="'+p.id+'" aria-pressed="'+p.avail+'">'+(p.avail?'Disponible':'Apagado')+'</button></td><td><button class="btn sm" data-a="pedit" data-p="'+p.id+'">Editar</button></td></tr>'}).join('')+'</tbody></table></div></div>'}
function dClientes(){
 const R=S.real;
 if(!R){loadLista();return'<div class="card small muted">Cargando clientes de la tarjeta…</div>'}
 if(R.error)return'<div class="card small muted">No se pudo cargar la lista de clientes.</div>';
 const cs=R.clientes||[],inact=cs.filter(c=>c.diasSinVenir>30);
 return'<div class="card stack"><h3>Clientes con tarjeta ('+cs.length+')</h3><div class="small muted">Datos reales del motor de lealtad: lo que se cobra en Caja aparece aquí.</div>'+(cs.length?'<div class="scrollx"><table class="tbl"><thead><tr><th>Cliente</th><th class="r">Saldo</th><th class="r">Visitas</th><th>Última visita</th></tr></thead><tbody>'+cs.map(c=>'<tr><td>'+esc(c.nombre)+'<div class="xs muted">'+esc(c.telefono)+'</div></td><td class="r num">'+fmtSaldo(R,c.puntos)+'</td><td class="r num">'+c.visitas+'</td><td>'+(c.diasSinVenir<=0?'Hoy':'hace '+c.diasSinVenir+' días')+(c.diasSinVenir>30?' <span class="status s-warn">Inactivo</span>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="small muted">Aún no hay clientes. Cobra una cuenta en Caja con un WhatsApp para crear el primero.</div>')+'</div><div class="card stack"><h3>Recupera a los que dejaron de venir</h3><div class="small muted">'+inact.length+' clientes llevan más de 30 días sin visitar.</div><button class="btn pri" data-a="promo"'+(inact.length?'':' disabled')+'>Enviar promoción por WhatsApp</button></div>'}
function dSeg(){
 const s=S.settings;
 return '<div class="card stack"><h3>Reglas anti pedido fantasma</h3><div class="small">1. En mesa solo se pide con el QR de la mesa y con el celular dentro del radio del local.<br>2. El mesero confirma que hay gente; si no, anula y el inventario regresa.<br>3. Si la cuenta abierta pasa del tope, se pide pago por adelantado.<br>4. Fuera del local, el pedido no llega a cocina hasta confirmar el pago.</div></div><div class="card stack"><h3>Ajustes</h3><label class="f">Radio de ubicación (metros)<input type="number" data-in="cfg" data-k="radio" value="'+s.radio+'"></label><label class="f">Tope de cuenta sin pagar ($)<input type="number" data-in="cfg" data-k="cap" value="'+s.cap+'"></label><label class="f">Costo de entrega cercana ($)<input type="number" data-in="cfg" data-k="envio" value="'+s.envio+'"></label><div class="small muted">Pedidos anulados por mesero hoy: <b>'+S.cancelados+'</b></div><div class="xs muted">La ubicación del celular la pide el navegador del cliente. Sirve como filtro junto con el QR y la confirmación del mesero, no como garantía total.</div></div>'}

/* ---------- render ---------- */
const ROLES=[['cliente','Cliente'],['mesero','Mesero'],['cocina','Cocina'],['barra','Barra'],['caja','Caja'],['dueno','Dueño']];
function counts(){
 const act=st=>live().filter(o=>o.lines.some(l=>l.station===st&&l.status==='nuevo')).length;
 return{cocina:act('cocina'),barra:act('barra'),mesero:MESAS.filter(x=>{const s=mesaState(x.k);return s.pc||s.listo}).length,caja:holds().length+MESAS.filter(x=>S.cuenta[x.k]&&mesaOrders(x.k).length).length}}
function render(){
 const c=counts();
 if(PROD){S.cli.geo=presenceOk()?'dentro':'fuera';if(QRMESA)S.cli.mesa=QRMESA}
 $('#nav').innerHTML=ROLES.map(r=>'<button data-a="role" data-v="'+r[0]+'" aria-current="'+(S.role===r[0])+'">'+r[1]+(c[r[0]]?'<span class="cnt">'+c[r[0]]+'</span>':'')+'</button>').join('');
 $('#wrap').classList.toggle('wide',S.role==='dueno'||S.role==='caja'||S.role==='cocina'||S.role==='barra');
 const v={cliente:vCliente,mesero:vMesero,cocina:()=>vKds('cocina'),barra:()=>vKds('barra'),caja:vCaja,dueno:vDueno}[S.role]();
 $('#app').innerHTML=v;
 $('#modal').innerHTML=modalHtml();
 $('#soundBtn').textContent='Sonido: '+(S.sound?'sí':'no')+' · '+(online?'en línea':'sin conexión');const rb=root.querySelector('[data-a=reset]');if(rb)rb.style.display=PROD?'none':'';
}


/* ---------- lealtad real (mismo motor que Sabucan y Carnitas) ---------- */
const LAPI='/api/demo/tostichelas/lealtad';
async function lget(q){const r=await fetch(LAPI+'?'+q,{cache:'no-store'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Sin conexión con lealtad');return j}
async function lpost(b){const r=await fetch(LAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Sin conexión con lealtad');return j}
const unidad=lc=>!lc?'':lc.modelo==='sellos'?'sellos':lc.modelo==='puntos'?'puntos':'de saldo';
const fmtSaldo=(lc,n)=>lc&&lc.modelo==='cashback'?m2(n):String(Math.round(n*100)/100);
function loadCajaCliente(tel){
 const c=S.caja;c.lc={loading:true};
 lget('telefono='+tel).then(j=>{if(c.tel===tel){c.lc=j;render()}}).catch(e=>{if(c.tel===tel){c.lc={error:e.message};render()}});
}
function loadLista(){lget('lista=1').then(j=>{S.real=j;render()}).catch(()=>{S.real={error:true};render()})}


async function doCobro(){
 const c=S.caja;if(c.busy||!c.sel)return;
 const k=c.sel.slice(2),os=mesaOrders(k);if(!os.length)return;
 const sub=os.reduce((a,o)=>a+orderSub(o),0),tip=Math.round(sub*c.tip/100),tel=c.tel;
 const L=c.lc&&c.lc.found?c.lc:null;const saldo=L?Math.floor(L.cliente.puntos):0;
 const disc=(c.canje&&saldo>0&&L.modelo==='cashback')?Math.min(saldo,sub):0;
 let loy=null,nombre='';
 if(tel.length===10&&c.lc&&!c.lc.error&&!c.lc.loading){
  if(!c.lc.found&&(!c.nom.trim()||!c.nac)){toast('Cliente nuevo: escribe su nombre y fecha de nacimiento');return}
  c.busy=true;render();
  try{
   if(disc>0)await lpost({accion:'canje',telefono:tel,puntos:disc});
   if(sub-disc>0){const r=await lpost({accion:'venta',telefono:tel,monto:sub-disc,nombre:c.nom,fechaNacimiento:c.nac});loy={ganado:r.puntosGanados,saldo:r.cliente.puntos,nuevo:r.esNuevo,modelo:r.modelo,usado:disc};nombre=r.cliente.nombre}
  }catch(e){toast('Lealtad: '+e.message+'. Se cobró sin puntos.')}
  c.busy=false;
 }
 const cl={name:nombre||(L?L.cliente.nombre:''),tel};
 const t=closeTicket(os,{method:c.method,tip,disc,cliente:cl,mesa:k,canal:'mesa'});t.loy=loy;
 c.sel=null;c.tel='';c.canje=false;c.tip=0;c.recv='';c.split=1;c.lc=null;c.nom='';c.nac='';
 S.modal={type:'ticket',id:t.id};S.real=null;render();
}


/* ---------- menú editable por el dueño ---------- */
let PROD=false,MCFG={edits:{},custom:[]};
function applyMenu(){
 const ids=new Set(MCFG.custom.map(c=>c.id));
 for(let i=MENU.length-1;i>=0;i--)if(MENU[i].custom&&!ids.has(MENU[i].id))MENU.splice(i,1);
 MCFG.custom.forEach(c=>{let q=PM(c.id);if(!q){q=P(Object.assign({custom:true},c));MENU.push(q)}else{const a=q.avail;Object.assign(q,c);q.avail=a}});
 Object.keys(MCFG.edits).forEach(id=>{const q=PM(id),e=MCFG.edits[id];if(!q||q.custom)return;['name','desc','cat','station','img','cost'].forEach(k=>{if(e[k]!==undefined)q[k]=e[k]});if(e.price)e.price.forEach((x,i)=>{if(q.v[i]&&x>0)q.v[i].p=x});if(e.use)q.use=JSON.parse(JSON.stringify(e.use))});
 if(S)MENU.forEach(q=>{if(S.soc.likes[q.id]==null)S.soc.likes[q.id]=0;if(!S.soc.rate[q.id])S.soc.rate[q.id]={n:0,sum:0}});
}
const IAPI='/api/demo/tostichelas/imagen';
async function uploadImg(file){
 const bmp=await createImageBitmap(file);
 const sc=Math.min(1,900/Math.max(bmp.width,bmp.height));
 const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bmp.width*sc));cv.height=Math.max(1,Math.round(bmp.height*sc));
 cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
 let q=.82,data=cv.toDataURL('image/jpeg',q);while(data.length>900000&&q>.4){q-=.12;data=cv.toDataURL('image/jpeg',q)}
 const r=await fetch(IAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:S.dpin||'',data})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo subir la foto');return j.url;
}
function openPedit(pid){
 const q=pid?PM(pid):null;
 S.modal={type:'pedit',pid,up:false,f:q?{name:q.name,desc:q.desc||'',cat:q.cat,station:q.station,img:q.img||'',price:q.v.map(x=>x.p),label:q.v[0].l,cost:q.cost||'',use:Object.keys(q.use).map(k=>({id:k,q:q.use[k]}))}:{name:'',desc:'',cat:'Tostadas',station:'cocina',img:'',price:[0],label:'Pieza',cost:'',use:[]}};
}
function savePedit(){
 const md=S.modal,f=md.f;
 if(!f.name.trim()){toast('Ponle nombre al producto');return}
 if(f.price.some(x=>!(Number(x)>0))){toast('Revisa los precios');return}
 const price=f.price.map(Number),cost=Number(f.cost)||0;
 const use={};f.use.forEach(u=>{const qn=Number(u.q);if(u.id&&qn>0)use[u.id]=Math.round(((use[u.id]||0)+qn)*10000)/10000});
 if(md.pid){
  const q=PM(md.pid);
  if(q.custom){const c=MCFG.custom.find(x=>x.id===md.pid);Object.assign(c,{name:f.name.trim(),desc:f.desc.trim(),cat:f.cat,station:f.station,img:f.img,cost,use});c.v=[{l:f.label||'Pieza',p:price[0],f:1,s:0}]}
  else MCFG.edits[md.pid]={name:f.name.trim(),desc:f.desc.trim(),cat:f.cat,station:f.station,img:f.img,price,cost,use};
 }else{
  const id='x'+Date.now().toString(36);
  MCFG.custom.push({id,cat:f.cat,name:f.name.trim(),desc:f.desc.trim(),emoji:'🍽️',station:f.station,v:[{l:f.label||'Pieza',p:price[0],f:1,s:0}],use,mods:[],img:f.img,cost});
 }
 MCFG=JSON.parse(JSON.stringify(MCFG));applyMenu();S.modal=null;toast('Producto guardado');
}

/* ---------- sincronización entre dispositivos (MongoDB) ---------- */
const SAPI='/api/demo/tostichelas/estado';
let EPOCH=0,REV=0,LAST={cols:{},kv:{}},UU={},syncBusy=false,dirty=false,online=true,fails=0;
const COLS={
 orders:{arr:()=>S.orders,key:o=>String(o.id)},
 tickets:{arr:()=>S.tickets,key:t=>String(t.id)},
 mermas:{arr:()=>S.mermas,key:x=>x.ts+'_'+String(x.name).replace(/\W/g,'')},
 movs:{arr:()=>S.caja.movs,key:x=>String(x.ts)},
 reviews:{arr:()=>S.soc.reviews,key:x=>x.ts+'_'+x.pid},
 gastos:{arr:()=>S.gastos,key:x=>String(x.id)}
};
function kvNow(){
 const o={};
 Object.keys(S.settings).forEach(k=>o['settings|'+k]=S.settings[k]);
 MESAS.forEach(x=>o['cuenta|'+x.k]=!!S.cuenta[x.k]);
 S.inv.forEach(i=>o['inv|'+i.id]={name:i.name,unit:i.unit,stock:i.stock,cost:i.cost,min:i.min});
 MENU.forEach(q=>{o['avail|'+q.id]=!!q.avail;o['likes|'+q.id]=S.soc.likes[q.id]||0;const r=S.soc.rate[q.id]||{n:0,sum:0};o['rate|'+q.id]={n:r.n,sum:r.sum}});
 o.cancelados=S.cancelados||0;
 o.menu=MCFG;
 return o;
}
function applyKv(k,v){
 const a=k.split('|')[0],b=k.split('|')[1];
 if(a==='settings'&&b in S.settings)S.settings[b]=v;
 else if(a==='cuenta'){if(v)S.cuenta[b]=true;else delete S.cuenta[b]}
 else if(a==='inv'){if(!v)return;let i=ins(b);if(!i){if(!v.name)return;i={id:b,name:v.name,unit:v.unit,stock:0,min:0,cost:0,count:''};S.inv.push(i)}Object.assign(i,v)}
 else if(a==='avail'){const q=PM(b);if(q)q.avail=!!v}
 else if(a==='likes')S.soc.likes[b]=v;
 else if(a==='rate'&&v)S.soc.rate[b]={n:v.n,sum:v.sum};
 else if(k==='cancelados')S.cancelados=v;
 else if(k==='menu'){MCFG=v&&v.edits?v:{edits:{},custom:[]};applyMenu()}
}
function snapNow(){
 const cols={},kv={};
 Object.keys(COLS).forEach(n=>{const c=COLS[n],o={};c.arr().forEach(e=>{o[c.key(e)]=JSON.stringify(e)});cols[n]=o});
 const k=kvNow();Object.keys(k).forEach(x=>{kv[x]=JSON.stringify(k[x])});
 return{cols,kv};
}
function reseedKeep(){const k={role:S.role,auth:S.auth,dpin:S.dpin,me:S.me};seed();Object.assign(S,k);if(QRMESA)S.cli.mesa=QRMESA}
function softRender(){const a=root.ownerDocument.activeElement;if(a&&root.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){dirty=true;return}dirty=false;render()}
function applyResp(r){
 if(!r||r.error)return;
 let changed=false;
 PROD=!!r.prod;
 if(r.reset){const first=EPOCH===0;EPOCH=r.epoch;REV=0;UU={};if(!first||PROD){reseedKeep();changed=true}LAST=snapNow()}
 const inc={cols:[],kv:[]};
 Object.keys(r.cols||{}).forEach(name=>{const c=COLS[name];if(!c)return;r.cols[name].forEach(e=>{const key=name+'|'+e.k;if(UU[key]!==undefined&&UU[key]>=e.u)return;const arr=c.arr();const i=arr.findIndex(x=>c.key(x)===e.k);if(i>=0)arr[i]=e.d;else arr.push(e.d);UU[key]=e.u;inc.cols.push([name,e.k]);changed=true})});
 Object.keys(r.kv||{}).sort((a,b)=>a==='menu'?-1:b==='menu'?1:0).forEach(k=>{const e=r.kv[k];if(UU['kv|'+k]!==undefined&&UU['kv|'+k]>=e.u)return;applyKv(k,e.v);UU['kv|'+k]=e.u;inc.kv.push(k);changed=true});
 if(inc.cols.length||inc.kv.length){const cur=snapNow();inc.cols.forEach(x=>{LAST.cols[x[0]]=LAST.cols[x[0]]||{};LAST.cols[x[0]][x[1]]=cur.cols[x[0]][x[1]]});inc.kv.forEach(k=>{LAST.kv[k]=cur.kv[k]})}
 REV=r.rev||REV;
 S.orders.forEach(o=>{if(o.id>=S.seq)S.seq=o.id+1});S.tickets.forEach(t=>{if(t.id>=S.tseq)S.tseq=t.id+1});
 if(changed)softRender();
}
async function tick(){
 if(syncBusy||!S)return;syncBusy=true;
 try{
  const cur=snapNow(),now=Date.now(),push={cols:{},kv:{}};let n=0;
  Object.keys(cur.cols).forEach(name=>{Object.keys(cur.cols[name]).forEach(k=>{const j=cur.cols[name][k];if(LAST.cols[name]&&LAST.cols[name][k]===j)return;(push.cols[name]=push.cols[name]||[]).push({k,u:now,d:JSON.parse(j)});n++})});
  Object.keys(cur.kv).forEach(k=>{if(LAST.kv[k]===cur.kv[k])return;push.kv[k]={u:now,v:JSON.parse(cur.kv[k])};n++});
  let resp;
  if(n){
   const r=await fetch(SAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({since:REV,epoch:EPOCH,pin:S.dpin||'',cols:push.cols,kv:push.kv})});
   if(!r.ok)throw new Error('sync');resp=await r.json();
   Object.keys(push.cols).forEach(name=>push.cols[name].forEach(e=>{LAST.cols[name]=LAST.cols[name]||{};LAST.cols[name][e.k]=cur.cols[name][e.k];UU[name+'|'+e.k]=e.u}));
   Object.keys(push.kv).forEach(k=>{LAST.kv[k]=cur.kv[k];UU['kv|'+k]=push.kv[k].u});
  }else{
   const r=await fetch(SAPI+'?since='+REV+'&epoch='+EPOCH,{cache:'no-store'});if(!r.ok)throw new Error('sync');resp=await r.json();
  }
  online=true;fails=0;applyResp(resp);
 }catch(e){fails++;if(fails>=2&&online){online=false;render()}}
 syncBusy=false;
 if(dirty)softRender();
}
async function resetServer(accion){
 try{
  const r=await fetch(SAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion,pin:S.dpin||''})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){toast(j.error||'No se pudo');return}
  applyResp(j);toast(accion==='produccion'?'Listo: ya estás en producción, con datos limpios':'Demo reiniciada');
 }catch(e){toast('Sin conexión')}
 render();
}
async function verifyPin(){
 const md=S.modal;
 try{
  const r=await fetch(SAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'pin',rol:md.role,pin:md.pin})});
  const j=await r.json();
  if(j.ok){S.auth[md.role]=true;if(md.role==='dueno'){S.dpin=md.pin;S.pinDef=!!j.defecto}S.role=md.role;S.modal=null}else toast('PIN incorrecto');
 }catch(e){
  if(!PROD&&md.pin===S.pins[md.role]){S.auth[md.role]=true;if(md.role==='dueno')S.dpin=md.pin;S.role=md.role;S.modal=null}else toast('Sin conexión para validar el PIN');
 }
 render();
}
function dAjustes(){
 let h=dPedidosCfg()+dQuickCfg()+'<div class="card stack"><h3>Estado del sistema</h3><div class="row between"><span>Modo actual</span><span class="status '+(PROD?'s-good':'s-warn')+'">'+(PROD?'Producción':'Demo con datos de ejemplo')+'</span></div><div class="small muted">'+(PROD?'Todo lo que se registra es real. Menú, fotos y precios que editaste se conservan.':'Ahora se ven ventas, reseñas y clientes de ejemplo. Cuando termines de cargar tu menú y tus fotos, pasa a producción para empezar en limpio.')+'</div>'+(PROD?'':'<button class="btn pri" data-a="prodask">Pasar a producción</button>')+'</div>';
 h+='<div class="card stack"><h3>Antes de abrir al público</h3><ul class="small" style="margin:0;padding-left:18px"><li>Carga tus fotos y precios en "Menú y márgenes".</li><li>Captura tus costos reales de insumos en "Inventario".</li><li>Haz un conteo físico para dejar el inventario inicial correcto.</li>'+(S.pinDef?'<li><b style="color:var(--bad)">Cambia los PIN:</b> ahora usan los de la demo. Define TOSTICHELAS_PIN_DUENO y TOSTICHELAS_PIN_CAJA en el servidor.</li>':'')+'</ul></div>';
 return h}


/* ---------- personalización rápida ---------- */
const QDEF={Tostadas:'Sin chile, Sin cebolla, Sin cilantro, Sin jitomate, Sin aguacate, Sin mayonesa, Poco picante, Extra picante, Extra limón',Tacos:'Sin chile, Sin cebolla, Sin cilantro, Poco picante, Extra picante, Con limón',Snacks:'Sin chile, Sin cebolla, Sin jitomate, Sin mayonesa, Poco picante, Extra picante',Cervezas:'Bien helada, Con limón, Con sal, Sin popote',Bebidas:'Sin hielo, Poco hielo, Con limón'};
const quickOf=cat=>String((MCFG.quick&&MCFG.quick[cat]!==undefined)?MCFG.quick[cat]:(QDEF[cat]||'')).split(',').map(x=>x.trim()).filter(Boolean);
function dQuickCfg(){
 return'<div class="card stack"><h3>Opciones rápidas para personalizar</h3><div class="small muted">Son los botones que ve el cliente y el mesero al elegir un platillo ("Sin chile", "Sin cebolla"…). Separa con comas. Siempre pueden escribir una nota libre.</div>'+CATS.map(c=>'<label class="f">'+c+'<input type="text" data-in="qk" data-c="'+c+'" value="'+esc((MCFG.quick&&MCFG.quick[c]!==undefined)?MCFG.quick[c]:(QDEF[c]||''))+'"></label>').join('')+'</div>'}

/* ---------- control de pedidos desde el celular ---------- */
let QRMESA=null,GEOOK=null;
const canOrderAny=()=>!!(S.settings.pedMesa||S.settings.pedLlevar||S.settings.pedEntrega);
const canalOk=e=>e==='mesa'?!!S.settings.pedMesa:e==='llevar'?!!S.settings.pedLlevar:!!S.settings.pedEntrega;
const allowedCanales=dentro=>[].concat(dentro&&S.settings.pedMesa?['mesa']:[],S.settings.pedLlevar?['llevar']:[],S.settings.pedEntrega?['entrega']:[]);
function dPedidosCfg(){
 const s=S.settings,t=(k,l,d)=>'<div class="row between" style="align-items:flex-start;gap:10px"><div class="grow"><div class="b small">'+l+'</div><div class="xs muted">'+d+'</div></div><button class="chip" data-a="ped" data-k="'+k+'" aria-pressed="'+!!s[k]+'">'+(s[k]?'Activo':'Apagado')+'</button></div>';
 return'<div class="card stack"><h3>Pedidos desde el celular del cliente</h3><div class="small muted">Tú decides qué pueden pedir tus clientes solos. Puedes empezar con el menú de consulta y abrir poco a poco.</div><div class="chips"><button class="chip" data-a="pedpre" data-v="solover">Solo ver el menú</button><button class="chip" data-a="pedpre" data-v="inicio">Para empezar (mesa con aprobación)</button><button class="chip" data-a="pedpre" data-v="todo">Todo abierto</button></div>'
 +t('pedMesa','Pedir en su mesa','Solo con el QR de la mesa y estando en el local.')
 +t('aprobar','El mesero aprueba cada pedido de mesa','El pedido no llega a cocina hasta que el mesero lo aprueba. Ideal para perder el miedo a los pedidos falsos.')
 +t('pedLlevar','Para llevar','Siempre pagando por adelantado; no llega a cocina hasta confirmar el pago.')
 +t('pedEntrega','Entrega cercana','Pagando por adelantado, con costo de entrega.')
 +'<div class="sep"></div><div class="b small">Ubicación del local</div><div class="xs muted">'+(s.lat!=null?'Guardada. Los clientes deben estar a menos de '+s.radio+' m (el radio se cambia en Seguridad).':'Sin configurar: se valida solo con el QR de la mesa. Párate en el local y toca el botón.')+'</div><button class="btn sm" data-a="setloc">Usar mi ubicación actual como el local</button></div>'}
function setLoc(){
 if(!navigator.geolocation){toast('Este equipo no permite ubicación');return}
 navigator.geolocation.getCurrentPosition(p=>{S.settings.lat=Math.round(p.coords.latitude*1e6)/1e6;S.settings.lng=Math.round(p.coords.longitude*1e6)/1e6;toast('Ubicación del local guardada');render()},()=>toast('No pudimos leer tu ubicación. Revisa el permiso del navegador.'),{enableHighAccuracy:true,timeout:15000});
}
function distM(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b),h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function geoChk(){
 if(!navigator.geolocation){toast('Este equipo no permite ubicación');return}
 navigator.geolocation.getCurrentPosition(p=>{const d=distM(S.settings.lat,S.settings.lng,p.coords.latitude,p.coords.longitude);GEOOK=d<=S.settings.radio+Math.min(p.coords.accuracy||0,50);render()},()=>{GEOOK=false;toast('No pudimos verificar tu ubicación. Activa el permiso o pide al mesero.');render()},{enableHighAccuracy:true,timeout:15000});
}
const presenceOk=()=>!!QRMESA&&(S.settings.lat==null||GEOOK===true);
function presenceReal(){
 let h='<div class="card stack" style="gap:8px">';
 if(!QRMESA)h+='<div class="banner warn"><b>¿Estás en el restaurante?</b> Escanea el QR de tu mesa para pedir desde tu lugar. También puedes pedir para llevar pagando por adelantado.</div>';
 else if(S.settings.lat!=null&&GEOOK!==true)h+='<div class="banner warn"><b>Escaneaste el QR de '+mLabel(QRMESA)+'.</b> Falta confirmar que estás en el local.'+(GEOOK===false?' Parece que estás lejos.':'')+'</div><button class="btn pri sm" data-a="geochk">Verificar mi ubicación</button>';
 else h+='<div class="banner good"><b>Presencia verificada.</b> Pides desde '+mLabel(QRMESA)+'.</div>';
 return h+'</div>'}

/* ---------- QR reales e impresos ---------- */
const QRC={};
const baseUrl=()=>{try{return root.ownerDocument.defaultView.location.origin}catch(e){return''}};
const menuUrl=()=>baseUrl()+'/demo/tostichelas';
const mesaUrl=k=>menuUrl()+'?mesa='+k+'&t='+tokenOf(k);
const altaUrl=()=>baseUrl()+'/tostichelas/alta';
function qrImg(url,px,cls){
 if(QRC[url])return'<img class="'+(cls||'qrimg')+'" src="'+QRC[url]+'" width="'+px+'" height="'+px+'" alt="Código QR">';
 if(QRC[url]===undefined){QRC[url]=null;QRCode.toDataURL(url,{width:360,margin:1,errorCorrectionLevel:'M'}).then(d=>{QRC[url]=d;softRender()}).catch(()=>{QRC[url]=''})}
 return'<div class="qrimg" style="width:'+px+'px;height:'+px+'px;display:grid;place-items:center" aria-hidden="true"><span class="xs muted">QR…</span></div>'}
const mesaQr=k=>qrImg(mesaUrl(k),84);
async function copyTxt(t){try{await navigator.clipboard.writeText(t);toast('Link copiado')}catch(e){toast(t)}}
function openPrint(title,bodyFn){
 const w=window.open('','_blank','width=820,height=900');if(!w){toast('Permite las ventanas emergentes para imprimir');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{font-family:system-ui,Segoe UI,sans-serif;margin:0;padding:24px;color:#241610}h1{margin:0}.b{border:4px solid #241610;border-radius:24px;padding:28px;text-align:center;background:#F2C14E}.b .top{background:#E2573A;color:#fff;border-radius:16px;padding:14px}.b img.q{width:340px;height:340px;background:#fff;padding:10px;border-radius:12px;margin:16px auto;display:block}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.c{border:3px solid #241610;border-radius:16px;padding:12px;text-align:center}.c img{width:100%;max-width:200px}@page{margin:10mm}</style></head><body>Preparando…</body></html>');
 Promise.resolve().then(bodyFn).then(html=>{w.document.body.innerHTML=html;setTimeout(()=>w.print(),500)}).catch(()=>{w.document.body.textContent='No se pudo generar el QR'});
}
function printBanner(){
 const pct=(S.real&&S.real.parametro)||5;
 openPrint('Banner de tarjeta de lealtad',async()=>{const q=await QRCode.toDataURL(altaUrl(),{width:700,margin:1});return'<div class="b"><div class="top"><h1>TOSTICHELAS</h1></div><h1 style="margin-top:18px;font-size:38px">Gana saldo en cada visita</h1><p style="font-size:20px">Escanea, regístrate y guarda tu tarjeta en Google Wallet.<br>Sin apps y sin plásticos. Ganas '+pct+'% de saldo en cada cuenta.</p><img class="q" src="'+q+'" alt="QR de registro"><p style="font-size:14px">'+esc(altaUrl())+'</p></div>'});
}
function printMenuQr(){
 openPrint('QR del menú',async()=>{const q=await QRCode.toDataURL(menuUrl(),{width:700,margin:1});return'<div class="b"><div class="top"><h1>TOSTICHELAS</h1></div><h1 style="margin-top:18px;font-size:38px">Mira el menú y recomienda tus favoritos</h1><img class="q" src="'+q+'" alt="QR del menú"><p style="font-size:14px">'+esc(menuUrl())+'</p></div>'});
}
function printMesas(){
 openPrint('QR de las mesas',async()=>{const cs=await Promise.all(MESAS.map(async x=>'<div class="c"><b style="font-size:20px">'+esc(x.label)+'</b><img src="'+await QRCode.toDataURL(mesaUrl(x.k),{width:400,margin:1})+'" alt="QR '+esc(x.label)+'"><div style="font-size:13px">Escanea para pedir desde tu mesa</div></div>'));return'<h1 style="margin-bottom:14px">Tostichelas · QR de mesas</h1><div class="g">'+cs.join('')+'</div>'});
}
async function lcbSave(){
 const v=Number(S.lcb);if(!(v>0)){toast('Escribe un porcentaje');return}
 try{const r=await fetch(LAPI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'config',pin:S.dpin||'',parametro:v})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo');S.real=null;S.lcb=undefined;toast('Cashback actualizado')}catch(e){toast(e.message)}
 render();
}
function dLealtad(){
 const R=S.real;if(!R){loadLista();return'<div class="card small muted">Cargando lealtad…</div>'}
 if(R.error)return'<div class="card small muted">No se pudo cargar la lealtad.</div>';
 const pct=R.parametro||5,cs=R.clientes||[];
 let h='<div class="card stack"><h3>Tu tarjeta de lealtad</h3><div class="loy"><div class="row between"><b style="font-family:var(--display);font-size:22px">TOSTICHELAS</b><span class="xs">Tarjeta de lealtad</span></div><div><div class="big num">'+m2(120)+'</div><div class="small">de saldo · '+pct+'% de cashback en cada cuenta</div></div></div><div class="row" style="align-items:flex-end;gap:8px"><label class="f grow">% de cashback<input type="number" step="0.5" data-in="lcb" value="'+esc(S.lcb!==undefined?S.lcb:pct)+'"></label><button class="btn pri sm" data-a="lcbsave">Guardar</button></div><div class="xs muted">Cada $100 de cuenta le regresan $'+pct+' de saldo que usa en su siguiente visita. Hoy tienes '+cs.length+' clientes con tarjeta. Funciona igual que en tus otros negocios con Agentia, con Google Wallet.</div></div>';
 h+='<div class="card stack"><h3>QR de tu tarjeta (registro)</h3><div class="row" style="gap:12px;align-items:flex-start">'+qrImg(altaUrl(),150)+'<div class="stack" style="gap:6px"><div class="small muted">El cliente lo escanea, se registra solo y guarda su tarjeta en Google Wallet. Pon el banner en el mostrador y en cada mesa.</div><div class="row"><button class="btn pri sm" data-a="qrbanner">Imprimir banner</button><button class="btn sm" data-a="qrcopy" data-u="'+esc(altaUrl())+'">Copiar link</button></div></div></div></div>';
 h+='<div class="card stack"><h3>QR del menú</h3><div class="row" style="gap:12px;align-items:flex-start">'+qrImg(menuUrl(),150)+'<div class="stack" style="gap:6px"><div class="small muted">Para redes, tarjetas, volantes y el mostrador. Abre el menú con likes y recomendaciones.</div><div class="row"><button class="btn pri sm" data-a="qrmenu">Imprimir</button><button class="btn sm" data-a="qrcopy" data-u="'+esc(menuUrl())+'">Copiar link</button></div></div></div></div>';
 h+='<div class="card stack"><h3>QR por mesa</h3><div class="small muted">Cada mesa tiene su QR con un código. Con él, y la ubicación del celular, el cliente puede pedir desde su lugar. Imprímelos y pégalos en las 9 mesas y los 3 periquitos.</div><div class="grid2" style="gap:8px">'+MESAS.map(x=>'<div class="row" style="gap:8px;align-items:center">'+qrImg(mesaUrl(x.k),64)+'<b class="small">'+esc(x.label)+'</b></div>').join('')+'</div><button class="btn pri" data-a="qrmesas">Imprimir QR de todas las mesas</button></div>';
 return h}

/* ---------- recetas ---------- */
function recCost(use){return use.reduce((a,u)=>{const i=ins(u.id);return a+(i?(Number(u.q)||0)*i.cost:0)},0)}
function recetaHtml(f){
 const base=Number(f.price[0])||0,rc=recCost(f.use)+(Number(f.cost)||0);
 let h='<div class="card stack" style="gap:8px"><h3>Receta</h3><div class="xs muted">Lo que lleva UNA pieza, en la unidad del insumo. Ejemplo: 70 g de camarón se captura como 0.07 (kg). Con la receta, cada venta descuenta tu inventario sola y tu margen sale real.</div>';
 h+=f.use.map((u,i)=>'<div class="row" style="flex-wrap:nowrap;gap:6px"><select data-in="pe_ui" data-i="'+i+'" style="flex:1;min-width:0">'+S.inv.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===u.id?' selected':'')+'>'+esc(x.name)+' ('+esc(x.unit)+')</option>').join('')+'</select><input type="number" inputmode="decimal" step="any" style="width:84px" data-in="pe_uq" data-i="'+i+'" value="'+esc(u.q)+'" aria-label="Cantidad"><button class="btn ghost sm" data-a="peudel" data-i="'+i+'" aria-label="Quitar insumo">✕</button></div>').join('');
 h+='<button class="btn sm" data-a="peuadd">Agregar insumo</button>';
 if(rc>0&&base>0){const mg=Math.round((base-rc)/base*100);h+='<div class="row between small"><span>Costo del platillo</span><b class="num">'+m2(rc)+'</b></div><div class="row between small"><span>Margen con tu precio</span><b class="num" style="color:'+(mg<60?'var(--bad)':'var(--good)')+'">'+mg+'%</b></div><div class="xs muted">Para que los insumos sean cerca del 32% del precio, cóbralo en <b>'+m(Math.ceil(rc/0.32/5)*5)+'</b>.</div>'}
 return h+'</div>'}
function invExtra(){
 const sin=MENU.filter(p=>!Object.keys(p.use).length).length,n=S.invNew;
 let h='<div class="card stack"><h3>Cómo armar tus recetas</h3><ol class="small" style="margin:0;padding-left:18px"><li>Da de alta tus insumos con su unidad (kg, pza, l) y lo que pagas por cada uno.</li><li>Pesa o cuenta lo que lleva UNA pieza. Ejemplo: tostada de ceviche = 1 tostada, 70 g de camarón (0.07 kg) y un cuarto de aguacate (0.25 pza).</li><li>En Menú y márgenes toca Editar en el platillo y captura esa receta.</li><li>Cada venta descuenta sola. Cada semana haz un conteo físico: la diferencia son tus mermas.</li></ol>'+(sin?'<div class="banner warn">'+sin+' platillos todavía no tienen receta, así que no descuentan inventario.</div>':'<div class="banner good">Todos tus platillos tienen receta.</div>')+'</div>';
 h+='<div class="card stack"><h3>Agregar insumo</h3><div class="grid2" style="gap:8px"><label class="f">Nombre<input type="text" data-in="in_name" value="'+esc(n.name)+'" placeholder="Ej. Limón"></label><label class="f">Unidad<select data-in="in_unit">'+['kg','pza','l','bot','lata'].map(u=>'<option'+(u===n.unit?' selected':'')+'>'+u+'</option>').join('')+'</select></label><label class="f">Existencia inicial<input type="number" inputmode="decimal" data-in="in_stock" value="'+esc(n.stock)+'"></label><label class="f">Mínimo (aviso)<input type="number" inputmode="decimal" data-in="in_min" value="'+esc(n.min)+'"></label><label class="f">Costo por unidad<input type="number" inputmode="decimal" data-in="in_cost" value="'+esc(n.cost)+'"></label></div><button class="btn pri" data-a="iadd">Agregar al inventario</button></div>';
 return h}

/* ---------- finanzas del dueño ---------- */
const monthlyOf=g=>g.freq==='semanal'?g.monto*4.33:g.freq==='diario'?g.monto*(S.settings.diasMes||26):g.freq==='anual'?g.monto/12:g.monto;
function finCalc(){
 const dias=S.settings.diasMes||26,since=Date.now()-30*86400000;
 const ts=S.tickets.filter(t=>t.ts>=since);
 const ventas=ts.reduce((a,t)=>a+t.sub-t.disc,0);
 const costo=ts.reduce((a,t)=>a+t.lines.reduce((b,l)=>b+(l.cost||0),0),0);
 const diasV=new Set(ts.map(t=>new Date(t.ts).toDateString())).size;
 const tkt=ts.length?ventas/ts.length:0,avgDia=diasV?ventas/diasV:0,proy=avgDia*dias;
 const gs=S.gastos.filter(g=>!g.del);
 const compras=gs.filter(g=>g.cat==='Insumos').reduce((a,g)=>a+monthlyOf(g),0);
 const fijosL=gs.filter(g=>g.cat!=='Insumos'),fijos=fijosL.reduce((a,g)=>a+monthlyOf(g),0);
 const cRec=ventas>0?costo/ventas:0;let costoPct,src;
 if(compras>0&&proy>0){costoPct=compras/proy;src='tus compras reales de insumos'}else if(cRec>0.05){costoPct=cRec;src='las recetas de tus platillos'}else{costoPct=(S.settings.costoPct||35)/100;src='el porcentaje que tú indicas'}
 const comPct=(S.settings.comisionPct||0)/100,contrib=1-costoPct-comPct;
 const pe=contrib>0?fijos/contrib:0,util=proy*contrib-fijos;
 const by={};fijosL.forEach(g=>{by[g.cat]=(by[g.cat]||0)+monthlyOf(g)});
 return{dias,ventas,tkt,avgDia,proy,fijos,compras,cRec,costoPct,src,comPct,contrib,pe,util,by,peDia:pe/dias,tktsDia:tkt?pe/dias/tkt:0,n:ts.length}}
function dFin(){
 const f=finCalc(),F=S.fin;
 const cats=['Renta','Sueldos','Servicios','Marketing','Mantenimiento','Impuestos y contador','Otros fijos','Insumos'];
 const col=f.fijos<=0?'warn':f.util<0?'bad':f.proy>=f.pe*1.2?'good':'warn';
 const msg=f.fijos<=0?'Captura tus gastos para ver si el negocio es rentable.':f.util<0?'Con este ritmo pierde dinero: faltan '+m(f.pe-f.proy)+' de ventas al mes para el equilibrio.':f.proy>=f.pe*1.2?'Es rentable: vendes por encima de tu punto de equilibrio con colchón.':'Está en equilibrio, pero con poco colchón.';
 let h='<div class="banner '+col+'"><b>'+msg+'</b></div>';
 h+='<div class="kpis cols3"><div class="kpi"><div class="xs muted">Ventas proyectadas al mes</div><div class="v num">'+m(f.proy)+'</div></div><div class="kpi"><div class="xs muted">Gastos fijos al mes</div><div class="v num">'+m(f.fijos)+'</div></div><div class="kpi"><div class="xs muted">Punto de equilibrio</div><div class="v num">'+m(f.pe)+'</div></div><div class="kpi"><div class="xs muted">Equilibrio por día</div><div class="v num">'+m(f.peDia)+'</div></div><div class="kpi"><div class="xs muted">Cuentas por día para cubrirlo</div><div class="v num">'+Math.ceil(f.tktsDia)+'</div></div><div class="kpi"><div class="xs muted">Utilidad estimada al mes</div><div class="v num" style="color:var(--'+(f.util<0?'bad':'good')+')">'+m(f.util)+'</div></div></div>';
 const mx=Math.max(f.proy,f.pe,1);
 h+='<div class="card stack"><h3>¿Vendes lo suficiente?</h3><div class="row between small"><span>Ventas proyectadas</span><b class="num">'+m(f.proy)+'</b></div><div class="meter"><i style="width:'+Math.min(100,f.proy/mx*100)+'%"></i></div><div class="row between small"><span>Punto de equilibrio</span><b class="num">'+m(f.pe)+'</b></div><div class="meter low"><i style="width:'+Math.min(100,f.pe/mx*100)+'%"></i></div><div class="xs muted">Proyección = tu venta promedio por día abierto × '+f.dias+' días al mes. Ticket promedio: '+m(f.tkt)+'. Costo de insumos: '+Math.round(f.costoPct*100)+'% (según '+f.src+'). Por cada $100 que vendes, te quedan $'+Math.round(f.contrib*100)+' para pagar tus gastos fijos.</div></div>';
 const rec=[];
 if(f.fijos<=0)rec.push('Empieza por lo más pesado: renta y sueldos. Después servicios, gas, internet y contador.');
 if(f.costoPct>0.38)rec.push('Tus insumos pesan '+Math.round(f.costoPct*100)+'% de la venta. Lo sano en un restaurante es 30 a 35%. Revisa porciones, mermas y sube precio a los productos de menor margen.');
 const base=Math.max(f.proy,1);
 if((f.by['Sueldos']||0)/base>0.3)rec.push('Los sueldos son '+Math.round((f.by['Sueldos']||0)/base*100)+'% de tus ventas (lo sano es 25 a 30%). Más ventas con el mismo equipo lo corrige antes que recortar gente.');
 if((f.by['Renta']||0)/base>0.1)rec.push('La renta es '+Math.round((f.by['Renta']||0)/base*100)+'% de tus ventas (lo sano es menos de 10%). Necesitas vender más por metro o por mesa.');
 if(f.fijos>0&&f.util<0)rec.push('Para llegar al equilibrio necesitas unas '+Math.ceil(f.tktsDia)+' cuentas al día con tu ticket promedio de '+m(f.tkt)+'. Sube ese ticket sugiriendo bebida y botana en cada mesa.');
 if(f.proy>0)rec.push('Subir 5% el ticket promedio (con los mismos clientes) te deja unos '+m(f.proy*0.05*(1-f.comPct))+' más al mes.');
 if(f.compras>0&&f.cRec>0.05&&f.compras>f.proy*f.cRec*1.1)rec.push('Compras '+m(f.compras)+' en insumos, pero tus recetas dicen que deberías usar '+m(f.proy*f.cRec)+'. La diferencia es merma, desperdicio o porciones de más.');
 const mg=MENU.map(p=>{const l=lineFrom(p,0,[],1),c=lineCost(l);return{p,mg:c?(p.v[0].p-c)/p.v[0].p:null}}).filter(x=>x.mg!==null).sort((a,b)=>b.mg-a.mg);
 if(mg.length>=4)rec.push('Empuja los de mejor margen ('+mg.slice(0,3).map(x=>esc(x.p.name)+' '+Math.round(x.mg*100)+'%').join(', ')+') y revisa el precio de los más bajos ('+mg.slice(-2).map(x=>esc(x.p.name)+' '+Math.round(x.mg*100)+'%').join(', ')+').');
 h+='<div class="card stack"><h3>Qué te recomiendo</h3><ul class="small" style="margin:0;padding-left:18px">'+rec.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>';
 h+='<div class="card stack"><h3>Agregar gasto</h3><div class="grid2" style="gap:8px"><label class="f">Categoría<select data-in="f_cat">'+cats.map(c=>'<option'+(c===F.cat?' selected':'')+'>'+c+'</option>').join('')+'</select></label><label class="f">Frecuencia<select data-in="f_freq">'+[['mensual','Cada mes'],['semanal','Cada semana'],['diario','Cada día'],['anual','Cada año']].map(x=>'<option value="'+x[0]+'"'+(x[0]===F.freq?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label><label class="f">Concepto<input type="text" data-in="f_con" value="'+esc(F.con)+'" placeholder="Ej. Renta del local"></label><label class="f">Monto ($)<input type="number" inputmode="decimal" data-in="f_monto" value="'+esc(F.monto)+'"></label></div><button class="btn pri" data-a="gadd">Registrar gasto</button><div class="xs muted">"Insumos" es lo que compras de mercancía: no cuenta como gasto fijo, se usa para comparar contra lo que dicen tus recetas.</div></div>';
 const gl=S.gastos.filter(g=>!g.del);
 h+='<div class="card stack"><h3>Tus gastos</h3>'+(gl.length?'<div class="scrollx"><table class="tbl"><thead><tr><th>Concepto</th><th>Categoría</th><th class="r">Al mes</th><th></th></tr></thead><tbody>'+gl.map(g=>'<tr><td>'+esc(g.concepto)+'<div class="xs muted">'+m(g.monto)+' '+({mensual:'cada mes',semanal:'cada semana',diario:'cada día',anual:'cada año'}[g.freq]||'')+'</div></td><td>'+esc(g.cat)+'</td><td class="r num">'+m(monthlyOf(g))+'</td><td><button class="btn ghost sm" data-a="gdel" data-i="'+esc(g.id)+'">Quitar</button></td></tr>').join('')+'</tbody></table></div>':'<div class="small muted">Aún no capturas gastos.</div>')+'</div>';
 h+='<div class="card stack"><h3>Supuestos</h3><div class="grid2" style="gap:8px"><label class="f">Días abiertos al mes<input type="number" data-in="cfg" data-k="diasMes" value="'+S.settings.diasMes+'"></label><label class="f">Costo de insumos si no hay datos (%)<input type="number" data-in="cfg" data-k="costoPct" value="'+S.settings.costoPct+'"></label><label class="f">Comisión de terminal (%)<input type="number" step="0.1" data-in="cfg" data-k="comisionPct" value="'+S.settings.comisionPct+'"></label></div></div>';
 return h}

/* ---------- acciones ---------- */
function sendClient(){
 const c=S.cli;if(!c.cart.length)return;
 const dentro=c.geo==='dentro';let eff=c.canal;if(!dentro&&eff==='mesa')eff='llevar';
 if(!canalOk(eff)){toast('Por ahora el restaurante no acepta ese tipo de pedido desde el celular');return}
 if(eff==='entrega'&&!c.addr.trim()){toast('Escribe tu dirección para la entrega');return}
 const lines=c.cart.map(l=>Object.assign({},l,{uid:uid(),status:'nuevo'}));
 const cliente={name:S.me.name.trim(),tel:S.me.tel.trim()};
 const envio=eff==='entrega'?S.settings.envio:0;
 if(eff==='mesa'){
  const need=mesaTotal(c.mesa)+sumLines(lines)>S.settings.cap;
  const ap=!!S.settings.aprobar&&!need;
  const o=newOrder({mesa:c.mesa,canal:'mesa',lines,cliente,src:'cliente',hold:need||ap,aprobar:ap,porConfirmar:true});
  c.cart=[];
  if(need){S.modal={type:'pay',oid:o.id,total:orderSub(o),by:'order'}}else if(ap){toast('Tu pedido se mandó al mesero para aprobarlo')}else{beep();toast('Pedido enviado a cocina y barra')}
 }else{
  const o=newOrder({mesa:null,canal:eff,lines,cliente,src:'cliente',hold:true,addr:c.addr,envio});
  c.cart=[];S.modal={type:'pay',oid:o.id,total:orderSub(o)+envio,by:'order'}
 }
 c.tab='pedido'}
function settleHold(o){release(o);o.porConfirmar=false;const t=closeTicket([o],{method:'Link de pago',cliente:o.cliente,canal:o.canal,mesa:o.mesa,envio:o.envio});o.ticketId=t.id;return t}
function payOrderOnline(o){
 settleHold(o);toast('Pago confirmado. Tu pedido ya está en cocina'+(o.canal==='mesa'?' y barra':''));
 o.lines.forEach(l=>{S.cli.purchased[l.pid]=true});
 S.modal={type:'rate',pids:Array.from(new Set(o.lines.map(l=>l.pid))).slice(0,4),stars:{}}}
function payMesaOnline(){
 const k=S.cli.mesa,os=mesaOrders(k);if(!os.length)return;
 const sub=os.reduce((a,o)=>a+orderSub(o),0);
 closeTicket(os,{method:'Link de pago',cliente:{name:S.me.name,tel:S.me.tel},mesa:k,canal:'mesa'});
 os.forEach(o=>o.lines.forEach(l=>{S.cli.purchased[l.pid]=true}));
 S.modal={type:'rate',pids:Array.from(new Set(os.flatMap(o=>o.lines.map(l=>l.pid)))).slice(0,4),stars:{}};toast('Cuenta pagada: '+m(sub))}
function advance(oid,st){const o=S.orders.find(x=>x.id===oid);const ls=o.lines.filter(l=>l.station===st&&l.status!=='entregado');ls.forEach(l=>{if(l.status==='nuevo')l.status='preparando';else if(l.status==='preparando')l.status='listo'})}
function setupInput(el){
 const k=el.getAttribute('data-in'),v=el.value;
 if(k==='name')S.me.name=v;else if(k==='tel'){const t=v.replace(/\D/g,'').slice(0,10);if(t!==S.me.tel){S.me.tel=t;S.loy.data=null;if(t.length===10&&S.cli.tab==='puntos')loadMe()}}
 else if(k==='addr')S.cli.addr=v;else if(k==='mnote'){S.modal.note=v}
 else if(k==='rtext')S.modal.text=v;
 else if(k==='recv'){S.caja.recv=v;const e=$('#cambio');if(e){const os=mesaOrders(S.caja.sel.slice(2));const sub=os.reduce((a,o)=>a+orderSub(o),0);const L=S.caja.lc&&S.caja.lc.found?S.caja.lc:null;const sd=L?Math.floor(L.cliente.puntos):0;const disc=(S.caja.canje&&sd>0&&L.modelo==='cashback')?Math.min(sd,sub):0;e.textContent=cambioTxt(sub-disc+Math.round(sub*S.caja.tip/100))}}
 else if(k==='ctel'){const t=v.replace(/\D/g,'').slice(0,10);S.caja.canje=false;if(t!==S.caja.tel){S.caja.tel=t;S.caja.lc=null;if(t.length===10)loadCajaCliente(t)}}
 else if(k==='pe_uq')S.modal.f.use[+el.getAttribute('data-i')].q=v;else if(k==='qk'){MCFG.quick=MCFG.quick||{};MCFG.quick[el.getAttribute('data-c')]=v}else if(k==='f_con')S.fin.con=v;else if(k==='f_monto')S.fin.monto=v;else if(k==='lcb')S.lcb=v;else if(k==='in_name')S.invNew.name=v;else if(k==='in_stock')S.invNew.stock=v;else if(k==='in_min')S.invNew.min=v;else if(k==='in_cost')S.invNew.cost=v;else if(k==='pe_name')S.modal.f.name=v;else if(k==='pe_desc')S.modal.f.desc=v;else if(k==='pe_label')S.modal.f.label=v;else if(k==='pe_cost')S.modal.f.cost=v;else if(k==='pe_p')S.modal.f.price[+el.getAttribute('data-i')]=v;else if(k==='ptxt')S.modal.txt=v;else if(k==='icost'){const i=ins(el.getAttribute('data-i'));if(i)i.cost=Math.max(0,Number(v)||0)}
 else if(k==='mm')S.caja.mm=v;else if(k==='mo')S.caja.mo=v;else if(k==='pin')S.modal.pin=v;else if(k==='cnom')S.caja.nom=v;else if(k==='cnac')S.caja.nac=v
 else if(k==='lnom')S.loy.nom=v;else if(k==='lnac')S.loy.nac=v
 else if(k==='fondo'){S.caja.fondo=v;const ts=dayTickets();const ef=ts.filter(t=>t.method==='Efectivo').reduce((a,t)=>a+t.total,0);const esp=Number(v||0)+ef+movNet();$('#esp').textContent=m(esp);$('#dif').textContent=difTxt(esp,parseFloat(S.caja.contado))}
 else if(k==='contado'){S.caja.contado=v;const ts=dayTickets();const ef=ts.filter(t=>t.method==='Efectivo').reduce((a,t)=>a+t.total,0);$('#dif').textContent=difTxt(Number(S.caja.fondo||0)+ef+movNet(),parseFloat(v))}
 else if(k==='cnt'){ins(el.getAttribute('data-i')).count=v}
 else if(k==='cfg'){S.settings[el.getAttribute('data-k')]=Math.max(0,Number(v)||0)}
}
root.addEventListener('input',e=>{const el=e.target.closest('[data-in]');if(el&&el.tagName!=='SELECT')setupInput(el)},{signal:ctl.signal});
root.addEventListener('change',e=>{
 const fi=e.target.closest('input[data-file]');
 if(fi){const file=fi.files&&fi.files[0];if(!file||!S.modal||S.modal.type!=='pedit')return;S.modal.up=true;render();
  uploadImg(file).then(u=>{if(S.modal&&S.modal.type==='pedit'){S.modal.f.img=u}}).catch(er=>toast(er.message||'No se pudo subir la foto')).finally(()=>{if(S.modal)S.modal.up=false;render()});return}
 const el=e.target.closest('select[data-in]');if(!el)return;const k=el.getAttribute('data-in');
 if(k==='mesa'){S.cli.mesa=el.value;render()}
 else if(k==='pe_cat'){S.modal.f.cat=el.value;render()}
 else if(k==='pe_station'){S.modal.f.station=el.value}
 else if(k==='pe_ui'){S.modal.f.use[+el.getAttribute('data-i')].id=el.value;render()}
 else if(k==='f_cat')S.fin.cat=el.value;else if(k==='f_freq')S.fin.freq=el.value;else if(k==='in_unit')S.invNew.unit=el.value;
},{signal:ctl.signal});
root.addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el)return;
 if(el.getAttribute('data-scrim')&&e.target!==el)return;
 const a=el.getAttribute('data-a'),g=n=>el.getAttribute('data-'+n);
 const c=S.cli;
 switch(a){
  case'role':{const r=g('v');if((r==='caja'||r==='dueno')&&!S.auth[r]){S.modal={type:'pin',role:r,pin:''}}else S.role=r;break}
  case'reset':{if(!S.dpin){toast('Solo el dueño puede reiniciar: entra a Dueño con tu PIN');break}resetServer('reset');return}
  case'sound':S.sound=!S.sound;if(S.sound)beep();break;
  case'tab':c.tab=g('v');if(c.tab==='puntos'&&S.me.tel.length===10&&!S.loy.data&&!S.loy.loading)loadMe();break;
  case'geo':c.geo=g('v');if(c.geo==='fuera'&&c.canal==='mesa')c.canal='llevar';if(c.geo==='dentro')c.canal='mesa';break;
  case'cat':c.cat=g('v');break;
  case'sort':c.sort=g('v');break;
  case'like':{const p=g('p');if(S.soc.liked[p]){delete S.soc.liked[p];S.soc.likes[p]--}else{S.soc.liked[p]=true;S.soc.likes[p]++}break}
  case'togrev':c.open[g('p')]=!c.open[g('p')];break;
  case'review':S.modal={type:'rev',pid:g('p'),stars:0,text:''};break;
  case'add':openProd(g('p'),'cli');break;
  case'cq':{const l=c.cart[+g('i')];l.qty+=+g('d');if(l.qty<1)c.cart.splice(+g('i'),1);break}
  case'canal':c.canal=g('v');break;
  case'send':sendClient();break;
  case'paynow':{const o=S.orders.find(x=>x.id===+g('o'));S.modal={type:'pay',oid:o.id,total:orderSub(o)+o.envio,by:'order'};break}
  case'paymesa':S.modal={type:'pay',total:mesaTotal(c.mesa),by:'mesa'};break;
  case'ctaCuenta':S.cuenta[c.mesa]=true;toast('Avisamos al mesero que pediste la cuenta');break;
  /* modal */
  case'mclose':S.modal=null;break;
  case'mv':{S.modal.vi=+g('i');break}
  case'mo':{const gr=g('g'),l=g('l');if(l)S.modal.pick[gr]=l;else delete S.modal.pick[gr];if(gr==='Vaso'&&l!=='Escarchado')delete S.modal.pick['Sabor del escarchado'];break}
  case'mq':S.modal.qty=Math.max(1,S.modal.qty+ +g('d'));break;
  case'madd':{const ln=buildLine();const tgt=S.modal.target;S.modal=null;if(tgt==='cli'){c.cart.push(ln);toast('Agregado a tu pedido')}else{S.mw.cart.push(ln);toast('Agregado')}break}
  case'rstar':S.modal.stars=+g('n');break;
  case'rsend':{const md=S.modal;const r=S.soc.rate[md.pid];r.n++;r.sum+=md.stars;S.soc.reviews.push({pid:md.pid,user:S.me.name.trim()||'Tú',stars:md.stars,text:md.text||'Sin comentario',v:!!c.purchased[md.pid],ts:Date.now()});c.open[md.pid]=true;S.modal=null;toast('Gracias por tu reseña');break}
  case'rrate':S.modal.stars[g('p')]=+g('n');break;
  case'rratesend':{Object.keys(S.modal.stars).forEach(id=>{const r=S.soc.rate[id];r.n++;r.sum+=S.modal.stars[id]});S.modal=null;toast('Gracias, tu calificación ya se ve en el menú');c.tab='menu';break}
  case'payok':{const md=S.modal;if(md.by==='order'){payOrderOnline(S.orders.find(x=>x.id===md.oid))}else{S.modal=null;payMesaOnline()}break}
  /* mesero */
  case'msel':S.mw.sel=S.mw.sel===g('k')?null:g('k');break;
  case'madding':S.mw.adding=true;S.mw.sel=g('k');S.mw.cart=[];break;
  case'mback':S.mw.adding=false;break;
  case'mpick':openProd(g('p'),'mes');break;
  case'mrm':S.mw.cart.splice(+g('i'),1);break;
  case'msend':{const ls=S.mw.cart.map(l=>Object.assign({},l,{uid:uid(),status:'nuevo'}));newOrder({mesa:S.mw.sel,lines:ls,src:'mesero'});beep();S.mw.cart=[];S.mw.adding=false;toast('Enviado a cocina y barra');break}
  case'aprob':{const o=S.orders.find(x=>x.id===+g('o'));o.aprobar=false;o.porConfirmar=false;release(o);toast('Pedido enviado a cocina y barra');break}
  case'rechaz':{const o=S.orders.find(x=>x.id===+g('o'));o.cancel=true;o.aprobar=false;toast('Pedido rechazado');break}
  case'ped':S.settings[g('k')]=!S.settings[g('k')];break;
  case'pedpre':{const v=g('v');Object.assign(S.settings,v==='solover'?{pedMesa:false,pedLlevar:false,pedEntrega:false,aprobar:false}:v==='inicio'?{pedMesa:true,pedLlevar:false,pedEntrega:false,aprobar:true}:{pedMesa:true,pedLlevar:true,pedEntrega:true,aprobar:false});break}
  case'setloc':setLoc();return;
  case'geochk':geoChk();return;
  case'conf':{S.orders.find(x=>x.id===+g('o')).porConfirmar=false;toast('Mesa confirmada');break}
  case'anular':{const o=S.orders.find(x=>x.id===+g('o'));restockCancel(o);S.cancelados++;toast('Pedido anulado e inventario regresado');break}
  case'servir':{const o=S.orders.find(x=>x.id===+g('o'));o.lines.find(l=>l.uid===g('u')).status='entregado';break}
  case'mcuenta':S.cuenta[g('k')]=true;toast('La cuenta ya está en caja');break;
  case'stage':S.orders.find(x=>x.id===+g('o')).stage='camino';toast('Entrega en camino');break;
  case'done':{const o=S.orders.find(x=>x.id===+g('o'));o.done=true;o.lines.forEach(l=>l.status='entregado');toast('Pedido entregado');break}
  case'kadv':advance(+g('o'),g('s'));break;
  case'kscreen':S.kds.screen=!S.kds.screen;break;
  case'qk':{const q=S.modal.quick,l=g('l'),i=q.indexOf(l);if(i>=0)q.splice(i,1);else q.push(l);break}
  case'pedit':openPedit(g('p'));break;
  case'pnew':openPedit(null);break;
  case'peimgx':S.modal.f.img='';break;
  case'pesave':savePedit();break;
  case'peuadd':S.modal.f.use.push({id:S.inv[0].id,q:''});break;
  case'peudel':S.modal.f.use.splice(+g('i'),1);break;
  case'gadd':{const F=S.fin,mo=Number(F.monto);if(!F.con.trim()||!(mo>0)){toast('Escribe concepto y monto');return}S.gastos.push({id:'g'+Date.now().toString(36),cat:F.cat,concepto:F.con.trim(),monto:mo,freq:F.freq});F.con='';F.monto='';toast('Gasto registrado');break}
  case'gdel':{const x=S.gastos.find(q=>q.id===g('i'));if(x)x.del=true;break}
  case'iadd':{const n=S.invNew;if(!n.name.trim()){toast('Escribe el nombre del insumo');return}S.inv.push({id:'i'+Date.now().toString(36),name:n.name.trim(),unit:n.unit,stock:Number(n.stock)||0,min:Number(n.min)||0,cost:Number(n.cost)||0,count:''});S.invNew={name:'',unit:'kg',stock:'',min:'',cost:''};toast('Insumo agregado');break}
  case'lcbsave':lcbSave();return;
  case'qrcopy':copyTxt(g('u'));return;
  case'qrbanner':printBanner();return;
  case'qrmesas':printMesas();return;
  case'qrmenu':printMenuQr();return;
  case'pedel':{const id=S.modal.pid;MCFG.custom=MCFG.custom.filter(x=>x.id!==id);MCFG=JSON.parse(JSON.stringify(MCFG));applyMenu();S.modal=null;toast('Producto eliminado');break}
  case'prodask':S.modal={type:'prodask',txt:''};break;
  case'prodgo':{if((S.modal.txt||'').trim().toUpperCase()!=='EMPEZAR'){toast('Escribe EMPEZAR para confirmar');return}S.modal=null;resetServer('produccion');return}
  case'mtipo':S.caja.mt=g('v');break;
  case'movadd':{const mo=S.caja,mt=parseFloat(mo.mm);if(!(mt>0)||!mo.mo.trim()){toast('Escribe monto y motivo');return}mo.movs.push({tipo:mo.mt,monto:mt,motivo:mo.mo.trim(),ts:Date.now(),por:'Caja'});mo.mm='';mo.mo='';toast('Movimiento registrado');break}
  case'pinok':verifyPin();return;
  case'printt':{const t=S.tickets.find(x=>x.id===+g('t'));const w=window.open('','_blank','width=320,height=600');if(w){w.document.write('<pre style="font:14px monospace">'+esc(ticketTxt(t))+'</pre>');w.document.close();w.print()}return}
  /* caja */
  case'ctab':S.caja.tab=g('v');break;
  case'csel':S.caja.sel=g('k');S.caja.recv='';S.caja.canje=false;S.caja.split=1;break;
  case'tip':S.caja.tip=+g('v');break;
  case'method':S.caja.method=g('v');break;
  case'split':S.caja.split=+g('v');break;
  case'canje':S.caja.canje=!S.caja.canje;break;
  case'hpaid':{settleHold(S.orders.find(x=>x.id===+g('o')));toast('Pago confirmado, pedido enviado a cocina');break}
  case'hcancel':{const o=S.orders.find(x=>x.id===+g('o'));o.cancel=true;toast('Pedido cancelado, nunca llegó a cocina');break}
  case'cobrar':doCobro();return;
  /* dueño */
  case'otab':S.own.tab=g('v');break;
  case'avail':{const p=PM(g('p'));p.avail=!p.avail;break}
  case'cnt':{const i=ins(g('i'));const v=parseFloat(i.count);if(isNaN(v))break;const diff=Math.round((v-i.stock)*100)/100;if(diff!==0){S.mermas.push({ts:Date.now(),name:i.name,unit:i.unit,diff,val:diff*i.cost})}i.stock=v;i.count='';toast(diff?'Diferencia registrada':'Conteo coincide con el sistema');break}
  case'promo':toast('Promoción enviada a '+((S.real&&S.real.clientes)||[]).filter(x=>x.diasSinVenir>30).length+' clientes (simulado)');break;
  case'wallet':addWallet();return;
  case'lalta':altaMe();return;
 }
 render();setTimeout(tick,150)},{signal:ctl.signal});
function kdsTick(){
 if(!S.kds.screen||(S.role!=='cocina'&&S.role!=='barra'))return;
 const now=Date.now();
 S.orders.forEach(o=>{if(o.hold||o.cancel)return;o.lines.forEach(l=>{if(l.station===S.role&&l.status==='nuevo'){l.seen=l.seen||now;if(now-l.seen>=6000)l.status='preparando'}})});
 render();
}
function kdsPedal(){
 if(!S.kds.screen||(S.role!=='cocina'&&S.role!=='barra'))return false;
 const cand=S.orders.filter(o=>!o.hold&&!o.cancel&&o.lines.some(l=>l.station===S.role&&l.status==='preparando')).sort((a,b)=>a.created-b.created)[0];
 if(!cand)return false;
 cand.lines.forEach(l=>{if(l.station===S.role&&l.status==='preparando')l.status='listo'});render();return true;
}
(root.ownerDocument||document).addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter'||e.key==='PageDown')&&kdsPedal()){e.preventDefault()}},{signal:ctl.signal});
const iv=setInterval(()=>{if(!S.kds.screen&&(S.role==='cocina'||S.role==='barra'))render()},20000);
const iv2=setInterval(kdsTick,3000);
seed();
try{const qs=new URLSearchParams(root.ownerDocument.defaultView.location.search),mm=qs.get('mesa');if(mm&&MESAS.some(x=>x.k===mm)&&qs.get('t')===tokenOf(mm)){QRMESA=mm;S.cli.mesa=mm;S.cli.geo='dentro';S.cli.canal='mesa'}}catch(e){}
render();LAST=snapNow();tick();
const iv3=setInterval(tick,2500);
return()=>{ctl.abort();clearInterval(iv);clearInterval(iv2);clearInterval(iv3)};
}
