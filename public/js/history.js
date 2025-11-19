import { ensureAuthed, mountNavbar } from './auth.js';
import { apiGet, apiDelete } from './api.js';
import { toast } from './ui.js';

await ensureAuthed();
mountNavbar('history');

const el = document.getElementById('history');
let currentType='all';

async function load(){
  try{
    const url = currentType==='all'? '/api/user/history?limit=100' : `/api/user/history?limit=100&serviceType=${encodeURIComponent(currentType)}`;
    const r = await apiGet(url);
    if(!r.items.length){ el.innerHTML = '<div class="alert">No history yet.</div>'; return; }
    el.innerHTML = r.items.map(item=>renderItem(item)).join('');
    bindActions(r.items);
  }catch(e){ toast(e.message||'Failed to fetch history'); }
}

function renderItem(it){
  const date = new Date(it.timestamp).toLocaleString();
  const head = `<div><b>${it.serviceType}</b></div><div class='meta'>${date}</div>`;
  if(it.serviceType==='image' && it.output && it.output.startsWith('http')){
    return `<div class='item' data-id='${it.id}'><div style='display:flex;gap:12px;align-items:center'>${head}<div style='margin-left:auto;display:flex;gap:8px'><button class='btn secondary' data-download>Download</button><button class='btn' data-delete>Delete</button></div></div><img src='${it.output}' style='max-width:320px;border-radius:10px;margin-top:8px'/></div>`
  }
  return `<div class='item' data-id='${it.id}'><div style='display:flex;gap:12px;align-items:center'>${head}<div style='margin-left:auto;display:flex;gap:8px'><button class='btn secondary' data-download>Download</button><button class='btn' data-delete>Delete</button></div></div><div style='margin-top:8px;white-space:pre-wrap'>${(it.output||'').slice(0,1500)}</div></div>`
}

function bindActions(items){
  document.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click', async (e)=>{
    const id = e.target.closest('.item').dataset.id;
    try{ await apiDelete(`/api/user/history/${id}`); toast('Deleted'); load(); }catch(err){ toast(err.message||'Delete failed'); }
  }));
  document.querySelectorAll('[data-download]').forEach((btn,idx)=>btn.addEventListener('click',(e)=>{
    const item = items[idx];
    const a=document.createElement('a');
    if(item.serviceType==='image' && item.output.startsWith('http')){ a.href=item.output; a.download=`image-${item.id}.png`; }
    else { const blob=new Blob([item.output||''],{type:'text/plain'}); a.href=URL.createObjectURL(blob); a.download=`${item.serviceType}-${item.id}.txt`; }
    a.click();
  }));
}

document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',(e)=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  e.target.classList.add('active');
  currentType=e.target.dataset.type; load();
}));

load();
