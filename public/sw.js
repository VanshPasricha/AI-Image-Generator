self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/api/generate' && event.request.method === 'POST') {
    event.respondWith((async ()=>{
      try{
        const data = await event.request.clone().json();
        return await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include'
        });
      }catch(e){
        return new Response(JSON.stringify({error:'SW intercept failed'}), {status:500, headers:{'Content-Type':'application/json'}});
      }
    })());
  }
});
