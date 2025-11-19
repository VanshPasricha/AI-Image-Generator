import { ensureAuthed, mountNavbar } from '../auth.js';
import { apiPost } from '../api.js';
import { toast } from '../ui.js';

await ensureAuthed();
mountNavbar('chat');

const messages=[];
const list = document.getElementById('messages');
const input = document.getElementById('msg');
const send = document.getElementById('send');

function render(){
  list.innerHTML = messages.map(m=>`<div class='bubble ${m.role==='user'?'user':'bot'}'>${m.content.replace(/</g,'&lt;')}</div>`).join('');
  list.scrollTop = list.scrollHeight;
}

async function sendMsg(){
  const text = input.value.trim(); if(!text) return;
  messages.push({role:'user', content:text}); input.value=''; render();
  try{
    const r = await apiPost('/api/chat', { messages });
    messages.push({role:'assistant', content: r.reply||''}); render();
  }catch(e){ toast(e.message||'Chat failed'); }
}

send.addEventListener('click', sendMsg);
input.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendMsg(); }});
