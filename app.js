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
    const tr=document.createElement('tr');tr.className=(s.paused?'paused':d<0?'over':d<=(s.rem||7)?'soon':'')+(s.trial?' trial':'');
    const when=s.paused?'paused':s.trial?(d<0?'trial ended':'cancel by: '+(d===0?'today':d+'d')):d<0?'overdue':d===0?'today':d+'d';
    tr.innerHTML=`<td>${esc(s.name)}</td><td>${esc(s.cat||'')}</td><td>${money(s.cost)}</td><td>${s.cycle}</td><td>${money(monthly(s))}</td><td>${s.next} (${when})</td><td></td>`;
    const td=tr.lastChild;
    td.append(btn('Edit',()=>edit(s)),btn(s.paused?'Resume':'Pause',()=>{s.paused=!s.paused;save();render()}));
    if(s.trial)td.append(btn('Keep (now paid)',()=>{s.trial=false;save();render()}));if(d<0&&!s.paused&&!s.trial)td.append(btn('Renewed',()=>{while(days(s.next)<0)advance(s);save();render()}));
    td.append(btn('Delete',()=>{if(confirm('Delete '+s.name+'?')){subs=subs.filter(x=>x!==s);save();render()}},'del'));
    tb.appendChild(tr)});
  if(!subs.length)tb.innerHTML='<tr><td colspan="7">No subscriptions yet. Add your first one above.</td></tr>';
  $('mo').textContent=money(m);$('yr').textContent=money(m*12);$('soon').textContent=soon;$('act').textContent=act;
  const trials=subs.filter(s=>s.trial&&!s.paused&&days(s.next)>=0&&days(s.next)<=(s.rem||3));
  $('alert').innerHTML=(trials.length?`<div class="card" style="background:var(--over,#fde2e2)">Cancel soon: ${trials.map(s=>esc(s.name)+' ('+s.next+')').join(', ')} free trial(s) end shortly.</div>`:'')+(soon?`<div class="card" style="background:var(--soon)">${soon} subscription(s) renew in the next 7 days.</div>`:'');
  const max=Math.max(...Object.values(cats),0.01);
  $('bycat').innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="cat"><span>${esc(c)}</span><div class="bar" style="width:${v/max*100}%"></div><span>${money(v)}</span></div>`).join('')||'<p>Nothing yet.</p>';
  $('cats').innerHTML=[...new Set(subs.map(s=>s.cat).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('');
}
function edit(s){editing=s.id;$('name').value=s.name;$('cost').value=s.cost;$('cycle').value=s.cycle;$('next').value=s.next;$('cat').value=s.cat||'';$('trial').checked=!!s.trial;$('rem').value=s.rem||3;$('save').textContent='Save changes';$('name').focus()}
$('f').onsubmit=e=>{e.preventDefault();const v={name:$('name').value.trim(),cost:+$('cost').value,cycle:$('cycle').value,next:$('next').value,cat:$('cat').value.trim(),trial:$('trial').checked,rem:+$('rem').value};
  if(editing){Object.assign(subs.find(s=>s.id===editing),v);editing=null;$('save').textContent='Add'}else subs.push({id:Date.now()+'',...v});save();e.target.reset();render()};
$('q').oninput=render;$('theme').onclick=()=>{prefs.dark=!prefs.dark;saveP();render()};$('cur').onchange=e=>{prefs.cur=e.target.value;saveP();render()};
const dl=(data,name,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click()};
$('csv').onclick=()=>{const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  dl([['Name','Category','Cost','Cycle','Monthly','Next renewal','Paused','Trial'].join(',')].concat(subs.map(s=>[s.name,s.cat||'',s.cost.toFixed(2),s.cycle,monthly(s).toFixed(2),s.next,s.paused?'yes':'no',s.trial?'yes':'no'].map(q).join(','))).join('\n'),'subscriptions.csv','text/csv')};
$('bk').onclick=()=>dl(JSON.stringify({subs,prefs},null,2),'subtracker-backup.json','application/json');
$('rs').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.subs))throw 0;if(confirm('Replace current data with backup?')){subs=d.subs;if(d.prefs)prefs=d.prefs;save();saveP();render()}}catch{alert('Not a valid SubTracker backup.')}});e.target.value=''};
function remind(){if(!('Notification'in window)||Notification.permission!=='granted')return;const t=iso(new Date()),sent=JSON.parse(localStorage.getItem('subtracker.sent')||'{}');
  subs.forEach(s=>{if(s.paused)return;const d=days(s.next),k=s.id+s.next;if(d>=0&&d<=(s.rem||3)&&sent[k]!==t){new Notification(s.trial?`Cancel ${s.name} trial by ${s.next}`:`${s.name} renews ${d?'in '+d+' day(s)':'today'}`,{body:money(s.cost)+' '+s.cycle});sent[k]=t}});
  localStorage.setItem('subtracker.sent',JSON.stringify(sent))}
$('notif').onclick=()=>'Notification'in window?Notification.requestPermission().then(p=>{$('notif').textContent=p==='granted'?'Reminders on':'Reminders blocked';remind()}):alert('This browser does not support notifications.');
if(window.Notification&&Notification.permission==='granted')$('notif').textContent='Reminders on';
render();remind();setInterval(remind,36e5);
// Pro milestone 2: bank CSV import with recurring-charge detection (runs locally, nothing uploaded)
(function(){
  const lab=document.createElement('label');lab.className='ghost';lab.style.cssText='cursor:pointer;margin-left:.5rem';lab.textContent='Import bank CSV';
  const inp=document.createElement('input');inp.type='file';inp.accept='.csv,text/csv';inp.style.display='none';lab.appendChild(inp);
  $('bk').insertAdjacentElement('afterend',lab);
  const box=document.createElement('div');box.id='bankres';$('alert').insertAdjacentElement('afterend',box);
  function parse(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'&&t[i+1]=='"'){f+='"';i++}else if(c=='"')q=false;else f+=c}else if(c=='"')q=true;else if(c==','||c==';'){r.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;r.push(f);rows.push(r);r=[];f=''}else f+=c}if(f||r.length){r.push(f);rows.push(r)}return rows.filter(x=>x.some(v=>v.trim()))}
  function pdate(s){s=s.trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,m[1]-1,+m[2])}const d=new Date(s);return isNaN(d)?null:d}
  const norm=s=>s.toLowerCase().replace(/[0-9#*]+/g,' ').replace(/\b(pos|debit|card|purchase|payment|recurring|www|com|inc|ltd|llc)\b/g,' ').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ');
  function detect(rows){const h=rows[0].map(x=>x.toLowerCase());const di=h.findIndex(x=>/date/.test(x)),ni=h.findIndex(x=>/desc|name|payee|merchant|memo|details/.test(x)),ai=h.findIndex(x=>/amount|debit|value/.test(x));
    if(di<0||ni<0||ai<0)throw new Error('Need Date, Description and Amount columns.');
    const g={};rows.slice(1).forEach(r=>{const d=pdate(r[di]||''),a=Math.abs(parseFloat((r[ai]||'').replace(/[^0-9.\-]/g,'')));const k=norm(r[ni]||'');if(!d||!a||!k)return;(g[k]=g[k]||{name:(r[ni]||'').trim(),tx:[]}).tx.push({d,a})});
    const out=[];Object.values(g).forEach(o=>{if(o.tx.length<2)return;o.tx.sort((x,y)=>x.d-y.d);const gaps=o.tx.slice(1).map((t,i)=>(t.d-o.tx[i].d)/864e5);const avg=gaps.reduce((a,b)=>a+b,0)/gaps.length;
      const cyc=avg>=5&&avg<=9?'weekly':avg>=26&&avg<=35?'monthly':avg>=85&&avg<=95?'quarterly':avg>=350&&avg<=380?'yearly':null;if(!cyc)return;
      const amts=o.tx.map(t=>t.a),last=o.tx[o.tx.length-1];if(Math.max(...amts)>Math.min(...amts)*1.25)return;
      const s={name:o.name.replace(/\s+/g,' ').slice(0,40),cost:last.a,cycle:cyc,next:iso(last.d)};while(days(s.next)<0)advance(s);
      s.priceUp=amts.length>1&&last.a>amts[amts.length-2]+0.009;out.push(s)});return out}
  inp.onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{let found;try{found=detect(parse(t))}catch(err){alert('Could not read this CSV. '+err.message);return}
    const have=new Set(subs.map(s=>norm(s.name)));found=found.filter(s=>!have.has(norm(s.name)));
    if(!found.length){box.innerHTML='<div class="card">No new recurring charges found in that file.</div>';return}
    box.innerHTML=`<div class="card"><b style="font-size:1rem">Found ${found.length} recurring charge(s). Tick the ones to add:</b>`+found.map((s,i)=>`<label style="display:block"><input type="checkbox" data-i="${i}" checked> ${esc(s.name)}: ${money(s.cost)} ${s.cycle}, next ${s.next}${s.priceUp?' <b style="color:#b33;font-size:1rem;display:inline">price went up</b>':''}</label>`).join('')+'<button id="bankadd">Add selected</button></div>';
    $('bankadd').onclick=()=>{box.querySelectorAll('input:checked').forEach(c=>{const s=found[+c.dataset.i];subs.push({id:Date.now()+'-'+c.dataset.i,name:s.name,cost:s.cost,cycle:s.cycle,next:s.next,cat:'Imported',rem:3})});save();box.innerHTML='';render()}});e.target.value=''};
})();
// Pro milestone 3: 12-month cost projection + "what if I cancel this" savings view
(function(){
  const sec=document.createElement('div');sec.innerHTML='<h3>Next 12 months</h3><div id="proj"></div><h3>What if I cancel?</h3><p style="opacity:.75;margin:.2rem 0">Tick subscriptions to see how much you would save.</p><div id="whatif"></div>';
  $('bycat').insertAdjacentElement('afterend',sec);const pick=new Set();
  function charges(s,start,end){const out=[];if(s.paused)return out;const c={...s};let n=0;while(new Date(c.next+'T00:00')<start&&n++<600)advance(c);n=0;while(new Date(c.next+'T00:00')<end&&n++<600){out.push(new Date(c.next+'T00:00'));advance(c)}return out}
  function draw(){const now=new Date(new Date().toDateString()),months=[];for(let i=0;i<12;i++)months.push({d:new Date(now.getFullYear(),now.getMonth()+i,1),v:0});
    const end=new Date(now.getFullYear(),now.getMonth()+12,1);
    subs.forEach(s=>charges(s,new Date(now.getFullYear(),now.getMonth(),1),end).forEach(d=>{const i=(d.getFullYear()-now.getFullYear())*12+d.getMonth()-now.getMonth();if(months[i])months[i].v+=s.trial?0:s.cost}));
    const tot=months.reduce((a,m)=>a+m.v,0),max=Math.max(...months.map(m=>m.v),0.01);
    $('proj').innerHTML=`<p>Projected charges over the next 12 months: <b>${money(tot)}</b> (free trials not counted)</p>`+months.map(m=>`<div class="cat"><span>${m.d.toLocaleString(undefined,{month:'short',year:'2-digit'})}</span><div class="bar" style="width:${m.v/max*100}%"></div><span>${money(m.v)}</span></div>`).join('');
    const act=subs.filter(s=>!s.paused);let sm=0;act.forEach(s=>{if(pick.has(s.id))sm+=monthly(s)});
    $('whatif').innerHTML=act.length?act.map(s=>`<label style="display:block;margin:.2rem 0"><input type="checkbox" data-id="${esc(s.id)}" ${pick.has(s.id)?'checked':''}> ${esc(s.name)} <span style="opacity:.7">${money(monthly(s))}/mo</span></label>`).join('')+`<div class="card" style="margin-top:.5rem">Cancel ${[...pick].filter(id=>act.some(s=>s.id===id)).length} selected: save <b>${money(sm)}/month</b> = ${money(sm*12)}/year</div>`:'<p>Nothing yet.</p>';
    $('whatif').querySelectorAll('input').forEach(c=>c.onchange=()=>{c.checked?pick.add(c.dataset.id):pick.delete(c.dataset.id);draw()})}
  const r0=render;render=function(){r0();draw()};draw();
})();
