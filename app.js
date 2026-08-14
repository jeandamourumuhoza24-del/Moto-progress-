
/*
 Moto Progress Firebase edition.
 Keeps the original Moto Progress UI/data model and adds:
 - Email/password registration & login
 - Cloud Firestore sync per authenticated user
 - Local cache for offline use
*/
const LOCAL_PREFIX='motoProgressFirebaseV1_';
const blank={user:{name:'Umukoresha',phone:'',plate:'',goal:300000,odometer:12000},trips:[],expenses:[],savings:[],goals:[],maintenance:[],reminders:[],debts:[]};
let db=structuredClone(blank), page='home', currentUser=null, firebaseReady=false, authBusy=false;

const rwf=n=>new Intl.NumberFormat('rw-RW',{maximumFractionDigits:0}).format(Math.round(Number(n)||0))+' Frw';
const today=()=>new Date().toISOString().slice(0,10);
const daysAgo=n=>{let d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
const sum=(a,k='amount')=>a.reduce((x,y)=>x+Number(y[k]||0),0);

function cacheKey(){return LOCAL_PREFIX+(currentUser?.uid||'guest')}
function loadLocal(){
  try { const x=localStorage.getItem(cacheKey()); db=x?JSON.parse(x):structuredClone(blank); }
  catch { db=structuredClone(blank); }
}
function localSave(){try{localStorage.setItem(cacheKey(),JSON.stringify(db))}catch{}}

async function cloudSave(){
  localSave();
  if(!currentUser||!firebaseReady)return;
  try{
    const {firestore,doc,setDoc}=window.firebaseServices;
    await setDoc(doc(firestore,'users',currentUser.uid),db,{merge:false});
  }catch(e){console.warn('Firestore sync failed',e)}
}
async function cloudLoad(){
  if(!currentUser||!firebaseReady){loadLocal();return}
  try{
    const {firestore,doc,getDoc}=window.firebaseServices;
    const snap=await getDoc(doc(firestore,'users',currentUser.uid));
    if(snap.exists()) db=snap.data(); else await cloudSave();
  }catch(e){loadLocal();console.warn('Firestore load failed',e)}
  localSave();
}
async function save(){localSave(); await cloudSave(); render()}

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function monthTrips(){return db.trips.filter(x=>String(x.date||'').startsWith(today().slice(0,7)))}
function monthExp(){return db.expenses.filter(x=>String(x.date||'').startsWith(today().slice(0,7)))}
function profit(){return sum(monthTrips())-sum(monthExp())}
function advice(){const t=monthTrips(),e=monthExp(),p=sum(t),x=sum(e);if(!t.length&&!e.length)return 'Tangira wandika urugendo n’amafaranga wakoresheje kugira ngo nkwereke aho amafaranga yawe ajya.';if(x>p*.35)return 'Amafaranga usohora ari hejuru ugereranyije n’ayo winjiza. Reba cyane cyane lisansi n’andi mafaranga yisubiramo.';if(t.length>=2)return `Umaze gukora ingendo ${t.length} muri uku kwezi, impuzandengo ni ${rwf(p/t.length)} kuri trip.`;return 'Komeza wandike amakuru yawe buri munsi; uko data yiyongera ni ko inama zizaba nziza.'}

function authScreen(message=''){
 return `<div class="content authbox"><div class="card section">
 <h1>🏍️ Moto Progress</h1><p class="muted">Injira cyangwa wiyandikishe kugira ngo amakuru yawe abikwe online.</p>
 ${message?`<div class="card" style="margin:10px 0"><b>${esc(message)}</b></div>`:''}
 <form class="form" onsubmit="login(event)">
 <label class="muted">Email<input id="authEmail" type="email" required placeholder="email@example.com"></label>
 <label class="muted">Password<input id="authPassword" type="password" minlength="6" required placeholder="Nibura inyuguti 6"></label>
 <button class="btn primary" type="submit">Kwinjira</button>
 </form>
 <button class="btn dark" style="margin-top:10px" onclick="register()">Kwiyandikisha</button>
 <p class="muted" style="margin-top:12px">Iyo umaze kwinjira, trips, expenses, savings na raporo byawe bibikwa muri Firestore.</p>
 </div></div>`
}
async function login(e){
 e.preventDefault(); if(!firebaseReady)return alert('Firebase ntirategurwa. Shyiramo config muri firebase-config.js.');
 try{authBusy=true;const {auth,signInWithEmailAndPassword}=window.firebaseServices;
 await signInWithEmailAndPassword(auth,document.getElementById('authEmail').value.trim(),document.getElementById('authPassword').value);
 }catch(err){alert('Kwinjira byanze: '+(err.code||err.message))}finally{authBusy=false}
}
async function register(){
 if(!firebaseReady)return alert('Firebase ntirategurwa. Shyiramo config muri firebase-config.js.');
 const email=document.getElementById('authEmail')?.value.trim(), pass=document.getElementById('authPassword')?.value;
 if(!email||!pass||pass.length<6)return alert('Andika email na password yibura inyuguti 6.');
 try{
  const {auth,createUserWithEmailAndPassword,updateProfile}=window.firebaseServices;
  const cred=await createUserWithEmailAndPassword(auth,email,pass);
  await updateProfile(cred.user,{displayName:email.split('@')[0]});
 }catch(err){alert('Kwiyandikisha byanze: '+(err.code||err.message))}
}
async function logout(){if(firebaseReady)await window.firebaseServices.signOut(window.firebaseServices.auth)}

function nav(){return `<div class="nav"><div class="navin">${[['home','⌂','Ahabanza'],['trips','↗','Ingendo'],['expenses','↘','Yasohotse'],['savings','◔','Kuzigama'],['moto','⚙','Moto']].map(x=>`<button class="${page==x[0]?'active':''}" onclick="go('${x[0]}')"><span class="ico">${x[1]}</span>${x[2]}</button>`).join('')}</div></div>`}
function header(){return `<header class="top"><div><div class="brand">Moto Progress</div><div class="sub">Gucunga amafaranga no guteza imbere moto</div></div><div><button class="btn dark" onclick="go('reports')">📊 Raporo</button> <button class="btn dark" onclick="logout()">Sohoka</button></div></header>`}
function card(label,val,cls=''){return `<div class="card"><div class="muted">${label}</div><div class="metric ${cls}">${rwf(val)}</div></div>`}
function home(){const mt=monthTrips(),me=monthExp(),inc=sum(mt),exp=sum(me),sav=sum(db.savings.filter(x=>x.type==='DEPOSIT'))-sum(db.savings.filter(x=>x.type==='WITHDRAW'));const goal=db.user.goal||300000,pct=Math.min(100,Math.max(0,sav/goal*100));return `<div class="content"><div class="welcome"><b>Muraho, ${esc(db.user.name)}! 👋</b><div class="sub" style="color:#182b36;margin-top:5px">Intego y’ukwezi: ${rwf(goal)}</div></div><div class="grid">${card('Winjije uku kwezi',inc,'income')}${card('Wakoresheje uku kwezi',exp,'expense')}${card('Inyungu',inc-exp,'income')}${card('Trips',mt.length)}</div><div class="actions"><button class="btn primary" onclick="modal('trip')">＋ Andika urugendo</button><button class="btn danger" onclick="modal('expense')">− Andika amafaranga</button></div><div class="card section"><b>💡 Inama y’uyu munsi</b><p class="muted">${advice()}</p></div><div class="card section"><div style="display:flex;justify-content:space-between"><b>Kuzigama</b><b>${Math.round(pct)}%</b></div><p class="muted">${rwf(sav)} / ${rwf(goal)}</p><div class="progress"><i style="width:${pct}%"></i></div></div></div>`}
function listPage(type){let isT=type==='trips',arr=isT?db.trips:db.expenses;return `<div class="content"><div style="display:flex;justify-content:space-between;align-items:center"><h2>${isT?'Ingendo n’Amafaranga':'Amafaranga Yasohotse'}</h2><button class="btn ${isT?'primary':'danger'}" onclick="modal('${isT?'trip':'expense'}')">＋ Andika</button></div><div class="card">Total: <b class="${isT?'income':'expense'}">${rwf(sum(arr))}</b></div><div class="list section">${arr.slice().reverse().map((x)=>`<div class="row"><div><b>${isT?rwf(x.amount):esc(x.category)}</b><div class="muted">${x.date}${isT&&x.pickup?' · '+esc(x.pickup)+' → '+esc(x.dropoff):''}</div></div><div><b class="${isT?'income':'expense'}">${isT?'+':''}${rwf(x.amount)}</b></div></div>`).join('')||'<div class="empty">Nta makuru arandikwa.</div>'}</div></div>`}
function savings(){let dep=sum(db.savings.filter(x=>x.type==='DEPOSIT')),wit=sum(db.savings.filter(x=>x.type==='WITHDRAW')),bal=dep-wit;return `<div class="content"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Kuzigama</h2><button class="btn primary" onclick="modal('saving')">＋ Kuzigama</button></div>${card('Amafaranga asigaye mu savings',bal,'income')}<div class="section"><button class="btn dark" onclick="modal('goal')">🎯 Shyiraho intego</button></div><div class="list section">${db.goals.map((g,i)=>{let p=Math.min(100,g.current/g.target*100);return `<div class="card"><b>${esc(g.title)}</b><div class="muted">${rwf(g.current)} / ${rwf(g.target)}</div><div class="progress"><i style="width:${p}%"></i></div><div style="margin-top:10px"><button class="btn primary" onclick="contribute(${i})">Ongeramo</button></div></div>`}).join('')||'<div class="empty">Nta ntego ufite.</div>'}</div></div>`}
function moto(){return `<div class="content"><h2>Moto yanjye</h2><div class="grid">${card('Kilometero',db.user.odometer)}${card('Service zose',sum(db.maintenance))}</div><div class="actions"><button class="btn primary" onclick="modal('maintenance')">＋ Service</button><button class="btn dark" onclick="modal('reminder')">🔔 Kwibutsa</button></div><div class="card section"><b>Reminders</b><div class="list">${db.reminders.map(r=>`<div class="row"><div>${esc(r.title)}<div class="muted">${r.date}</div></div></div>`).join('')||'<div class="empty">Nta byibutsa.</div>'}</div></div></div>`}
function reports(){const inc=sum(db.trips),exp=sum(db.expenses),sav=sum(db.savings.filter(x=>x.type==='DEPOSIT'))-sum(db.savings.filter(x=>x.type==='WITHDRAW'));return `<div class="content"><h2>Raporo</h2><div class="grid">${card('Amafaranga yose yinjiye',inc,'income')}${card('Amafaranga yose yasohotse',exp,'expense')}${card('Inyungu',inc-exp,'income')}${card('Savings',sav,'income')}</div></div>`}
function modal(type){let title='',fields=[];if(type==='trip'){title='Andika urugendo';fields=[['amount','Amafaranga yishyuwe','number'],['date','Itariki','date'],['pickup','Aho yavuye','text'],['dropoff','Aho yajyaga','text']]}else if(type==='expense'){title='Andika amafaranga yasohotse';fields=[['amount','Amafaranga','number'],['date','Itariki','date'],['category','Icyiciro','text']]}else if(type==='saving'){title='Kuzigama';fields=[['amount','Amafaranga','number'],['date','Itariki','date'],['type','DEPOSIT cyangwa WITHDRAW','text']]}else if(type==='goal'){title='Intego';fields=[['title','Izina ry’intego','text'],['target','Amafaranga ugamije','number'],['current','Ayo watangiranye','number']]}else if(type==='maintenance'){title='Service ya moto';fields=[['type','Ubwoko bwa service','text'],['amount','Igiciro','number'],['km','Kilometero','number'],['date','Itariki','date']]}else{title='Icyibutsa';fields=[['title','Icyo nkwibutsa','text'],['date','Itariki','date']]}const fn={trip:'saveTrip',expense:'saveExpense',saving:'saveSaving',goal:'saveGoal',maintenance:'saveMaintenance',reminder:'saveReminder'}[type];document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="modal"><div class="modalbox"><div class="modalhead"><h2>${title}</h2><button class="close" onclick="closeModal()">×</button></div><form class="form" onsubmit="${fn}(event)">${fields.map(([id,label,t])=>`<label class="muted">${label}<input id="f_${id}" type="${t}" ${id==='date'?`value="${today()}"`:''} ${t==='number'?'min="0" step="1"':''} required></label>`).join('')}<button class="btn primary" type="submit">Bika</button></form></div></div>`)}
const val=id=>document.getElementById('f_'+id)?.value||'';
function closeModal(){document.getElementById('modal')?.remove()}
async function saveTrip(e){e.preventDefault();db.trips.push({amount:+val('amount'),date:val('date'),pickup:val('pickup'),dropoff:val('dropoff')});closeModal();await save()}
async function saveExpense(e){e.preventDefault();db.expenses.push({amount:+val('amount'),date:val('date'),category:val('category')||'Ibindi'});closeModal();await save()}
async function saveSaving(e){e.preventDefault();db.savings.push({amount:+val('amount'),date:val('date'),type:(val('type')||'DEPOSIT').toUpperCase()});closeModal();await save()}
async function saveGoal(e){e.preventDefault();db.goals.push({title:val('title'),target:+val('target'),current:+val('current')||0});closeModal();await save()}
async function saveMaintenance(e){e.preventDefault();db.maintenance.push({type:val('type'),amount:+val('amount'),km:+val('km'),date:val('date')});db.user.odometer=Math.max(db.user.odometer,+val('km'));closeModal();await save()}
async function saveReminder(e){e.preventDefault();db.reminders.push({title:val('title'),date:val('date')});closeModal();await save()}
async function contribute(i){let a=Number(prompt('Andikamo amafaranga uzigamaho:'));if(a>0){db.goals[i].current=Math.min(db.goals[i].target,db.goals[i].current+a);db.savings.push({amount:a,date:today(),type:'DEPOSIT'});await save()}}
function go(p){page=p;render()}
function render(){
 const app=document.getElementById('app');
 if(!currentUser){app.innerHTML=authScreen();return}
 let body=page==='home'?home():page==='trips'?listPage('trips'):page==='expenses'?listPage('expenses'):page==='savings'?savings():page==='moto'?moto():reports();
 app.innerHTML=header()+body+nav();
}
window.go=go;window.modal=modal;window.closeModal=closeModal;window.login=login;window.register=register;window.logout=logout;window.saveTrip=saveTrip;window.saveExpense=saveExpense;window.saveSaving=saveSaving;window.saveGoal=saveGoal;window.saveMaintenance=saveMaintenance;window.saveReminder=saveReminder;window.contribute=contribute;

window.addEventListener('firebase-ready',async()=>{
 firebaseReady=true;
 const {auth,onAuthStateChanged}=window.firebaseServices;
 onAuthStateChanged(auth,async user=>{
   currentUser=user;
   if(user){loadLocal();await cloudLoad();if(!db.user.name||db.user.name==='Umukoresha')db.user.name=user.displayName||user.email?.split('@')[0]||'Umukoresha';}
   render();
 });
});
render();
