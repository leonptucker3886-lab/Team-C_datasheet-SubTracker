const KEY='subtracker.v1',PK='subtracker.prefs';
let subs=JSON.parse(localStorage.getItem(KEY)||'[]'),prefs=JSON.parse(localStorage.getItem(PK)||'{"cur":"USD","dark":false}'),editing=null;
subs.forEach((s,i)=>{if(!s.id)s.id=Date.now()+'-'+i});
const save=()=>localStorage.setItem(KEY,JSON.stringify(subs)),saveP=()=>localStorage.setItem(PK,JSON.stringify(prefs));
const $=id=>document.getElementById(id);
const monthly=s=>({yearly:s.cost/12,weekly:s.cost*52/12,quarterly:s.cost/3}[s.cycle]??s.cost);
const days=d=>Math.round((new Date(d+'T00:00')-new Date(new Date().toDateString()))/864e5);
const money=v=>new Intl.NumberFormat(undefined,{style:'currency',currency:prefs.cur}).format(v);
const esc=t=>{const e=document.createElement('span');e.textContent=t;return e.innerHTML};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function advance(s){const d=new Date(s.next+'T00:00');if(s.cycle==='weekly')d.setDate(d.getDate()+7);else d.setMonth(d.getMonth()+({monthly:1,quarterly:3,yearly:12}[s.cycle]));s.next=iso(d)}
function btn(t,f,c){const b=document.createElement('button');b.textContent=t;b.className=c||'ghost';b.onclick=f;return b}
function render(){
  document.body.classList.toggle('dark',prefs.dark);$('theme').textContent=prefs.dark?'Light mode':'Dark mode';$('cur').value=prefs.cur;
  const q=$('q').value.toLowerCase(),tb=$('rows');tb.innerHTML='';let m=0,soon=0,act=0;const cats={};
  subs.sort((a,b)=>a.next.localeCompare(b.next));
  subs.forEach(s=>{const d=days(s.next);
    if(!s.paused){m+=monthly(s);act++;if(d>=0&&d<=7)soon++;const c=s.cat||'Other';cats[c]=(cats[c]||0)+monthly(s)}
    if(q&&!(s.name+' '+(s.cat||'')).toLowerCase().includes(q))return;
    const tr=document.createElement('tr');tr.className=s.paused?'paused':d<0?'over':d<=7?'soon':'';
    const when=s.paused?'paused':d<0?'overdue':d===0?'today':d+'d';
    tr.innerHTML=`<td>${esc(s.name)}</td><td>${esc(s.cat||'')}</td><td>${money(s.cost)}</td><td>${s.cycle}</td><td>${money(monthly(s))}</td><td>${s.next} (${when})</td><td></td>`;
    const td=tr.lastChild;
    td.append(btn('Edit',()=>edit(s)),btn(s.paused?'Resume':'Pause',()=>{s.paused=!s.paused;save();render()}));
    if(d<0&&!s.paused)td.append(btn('Renewed',()=>{while(days(s.next)<0)advance(s);save();render()}));
    td.append(btn('Delete',()=>{if(confirm('Delete '+s.name+'?')){subs=subs.filter(x=>x!==s);save();render()}},'del'));
    tb.appendChild(tr)});
  if(!subs.length)tb.innerHTML='<tr><td colspan="7">No subscriptions yet. Add your first one above.</td></tr>';
  $('mo').textContent=money(m);$('yr').textContent=money(m*12);$('soon').textContent=soon;$('act').textContent=act;
  $('alert').innerHTML=soon?`<div class="card" style="background:var(--soon)">${soon} subscription(s) renew in the next 7 days.</div>`:'';
  const max=Math.max(...Object.values(cats),0.01);
  $('bycat').innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="cat"><span>${esc(c)}</span><div class="bar" style="width:${v/max*100}%"></div><span>${money(v)}</span></div>`).join('')||'<p>Nothing yet.</p>';
  $('cats').innerHTML=[...new Set(subs.map(s=>s.cat).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('');
}
function edit(s){editing=s.id;$('name').value=s.name;$('cost').value=s.cost;$('cycle').value=s.cycle;$('next').value=s.next;$('cat').value=s.cat||'';$('save').textContent='Save changes';$('name').focus()}
$('f').onsubmit=e=>{e.preventDefault();const v={name:$('name').value.trim(),cost:+$('cost').value,cycle:$('cycle').value,next:$('next').value,cat:$('cat').value.trim()};
  if(editing){Object.assign(subs.find(s=>s.id===editing),v);editing=null;$('save').textContent='Add'}else subs.push({id:Date.now()+'',...v});save();e.target.reset();render()};
$('q').oninput=render;$('theme').onclick=()=>{prefs.dark=!prefs.dark;saveP();render()};$('cur').onchange=e=>{prefs.cur=e.target.value;saveP();render()};
const dl=(data,name,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click()};
$('csv').onclick=()=>{const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  dl([['Name','Category','Cost','Cycle','Monthly','Next renewal','Paused'].join(',')].concat(subs.map(s=>[s.name,s.cat||'',s.cost.toFixed(2),s.cycle,monthly(s).toFixed(2),s.next,s.paused?'yes':'no'].map(q).join(','))).join('\n'),'subscriptions.csv','text/csv')};
$('bk').onclick=()=>dl(JSON.stringify({subs,prefs},null,2),'subtracker-backup.json','application/json');
$('rs').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.subs))throw 0;if(confirm('Replace current data with backup?')){subs=d.subs;if(d.prefs)prefs=d.prefs;save();saveP();render()}}catch{alert('Not a valid SubTracker backup.')}});e.target.value=''};
render();
