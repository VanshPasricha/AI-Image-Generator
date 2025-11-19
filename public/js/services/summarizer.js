import { ensureAuthed, mountNavbar } from '../auth.js';
import { apiPost } from '../api.js';
import { toast } from '../ui.js';

await ensureAuthed();
mountNavbar('summarizer');

const form = document.getElementById('sum-form');
const textEl = document.getElementById('text');
const maxEl = document.getElementById('maxlen');
const resultEl = document.getElementById('result');

form.addEventListener('submit', async (e)=>{
  e.preventDefault(); resultEl.classList.add('hide');
  try{
    const r = await apiPost('/api/summarize', { text: textEl.value.trim(), max_length: Number(maxEl.value)||180 });
    resultEl.textContent = r.summary||''; resultEl.classList.remove('hide');
    toast('Summarized and saved to history');
  }catch(e){ toast(e.message||'Failed'); }
});
