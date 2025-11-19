export async function apiGet(url){
  const r = await fetch(url,{ credentials:'include' });
  if(!r.ok) throw new Error((await r.json()).error||'Request failed');
  return r.json();
}
export async function apiPost(url,data){
  const r = await fetch(url,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), credentials:'include' });
  if(!r.ok){ let t; try{ t=await r.json(); }catch{ t={error:'Request failed'} } throw new Error(t.error); }
  const ct=r.headers.get('content-type')||''; return ct.includes('application/json')? r.json(): r.blob();
}
export async function apiDelete(url){
  const r = await fetch(url,{ method:'DELETE', credentials:'include' });
  if(!r.ok) throw new Error((await r.json()).error||'Delete failed');
  return r.json();
}
