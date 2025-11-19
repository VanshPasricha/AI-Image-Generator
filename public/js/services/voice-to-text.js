import { ensureAuthed, mountNavbar } from '../auth.js';
import { apiPost } from '../api.js';
import { toast } from '../ui.js';

await ensureAuthed();
mountNavbar('voice');

const btn = document.getElementById('record');
const audioEl = document.getElementById('audio');
const statusEl = document.getElementById('rec-status');
const transcriptEl = document.getElementById('transcript');
const downloadBtn = document.getElementById('download');

let recorder, chunks=[];

function toBase64(blob){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(blob); }); }

btn.addEventListener('click', async ()=>{
  if(!recorder){
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e)=>{ if(e.data.size) chunks.push(e.data); };
    recorder.onstop = async ()=>{
      const blob = new Blob(chunks, { type: 'audio/webm' }); chunks=[];
      audioEl.src = URL.createObjectURL(blob); audioEl.classList.remove('hide');
      statusEl.textContent = 'Uploading...';
      try{
        const audioBase64 = await toBase64(blob);
        const r = await apiPost('/api/voice-to-text', { audioBase64, contentType: 'audio/webm' });
        transcriptEl.value = r.text || '';
        statusEl.textContent = 'Done';
        toast('Transcribed and saved to history');
      }catch(e){ statusEl.textContent='Failed'; toast(e.message||'Transcription failed'); }
    };
  }
  if(recorder.state==='recording'){
    recorder.stop(); btn.textContent='Start Recording'; statusEl.textContent='Processing...';
  } else {
    recorder.start(); btn.textContent='Stop Recording'; statusEl.textContent='Recording...'; audioEl.classList.add('hide'); transcriptEl.value='';
  }
});

downloadBtn.addEventListener('click',()=>{
  const blob = new Blob([transcriptEl.value||''], {type:'text/plain'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`transcript-${Date.now()}.txt`; a.click();
});
