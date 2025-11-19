export function toast(message, timeout=2500){
  let el=document.querySelector('.toast');
  if(!el){ el=document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent=message; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), timeout);
}

export function setLoading(el, isLoading){
  if(!el) return; if(isLoading) el.classList.add('loading'); else el.classList.remove('loading');
}
