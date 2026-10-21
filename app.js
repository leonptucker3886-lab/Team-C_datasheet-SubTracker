const KEY='subtracker.v1';
let subs=JSON.parse(localStorage.getItem(KEY)||'[]');
const save=()=>localStorage.setItem(KEY,JSON.stringify(subs));
const monthly=s=>s.cycle==='yearly'?s.cost/12:s.cycle==='weekly'?s.cost*52/12:s.cost;
const days=d=>Math.ceil((new Date(d+'T00:00')-new Date(new Date().toDateString()))/864e5);
const $=id=>document.getElementById(id);
function render(){
  const tb=$('rows');tb.innerHTML='';let m=0,soon=0;
  subs.sort((a,b)=>a.next.localeCompare(b.next)).forEach((s,i)=>{
    m+=monthly(s);const d=days(s.next);if(d>=0&&d<=7)soon++;
    const tr=document.createElement('tr');if(d<0)tr.className='over';else if(d<=7)tr.className='soon';
    [s.name,s.cat||'',`$${s.cost.toFixed(2)}`,s.cycle,`$${monthly(s).toFixed(2)}`,`${s.next} (${d<0?'overdue':d+'d'})`].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.appendChild(td)});
    const td=document.createElement('td'),b=document.createElement('button');b.textContent='Delete';b.className='del';b.onclick=()=>{subs.splice(i,1);save();render()};td.appendChild(b);tr.appendChild(td);tb.appendChild(tr);
  });
  $('mo').textContent=`$${m.toFixed(2)}`;$('yr').textContent=`$${(m*12).toFixed(2)}`;$('soon').textContent=soon;
}
$('f').onsubmit=e=>{e.preventDefault();subs.push({name:$('name').value.trim(),cost:+$('cost').value,cycle:$('cycle').value,next:$('next').value,cat:$('cat').value.trim()});save();e.target.reset();render()};
$('csv').onclick=()=>{
  const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  const csv=[['Name','Category','Cost','Cycle','Monthly','Next renewal'].join(',')].concat(subs.map(s=>[s.name,s.cat||'',s.cost.toFixed(2),s.cycle,monthly(s).toFixed(2),s.next].map(q).join(','))).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='subscriptions.csv';a.click();
};
render();
