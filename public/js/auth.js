// Firebase auth + route protection and navbar user display
import { toast } from './ui.js';

function loadFirebase(){
  if(!window.firebase){ toast('Firebase SDK not loaded'); return null; }
  const app = firebase.apps?.length? firebase.app() : firebase.initializeApp(window.FIREBASE_CONFIG||{});
  return { app, auth: firebase.auth() };
}

export function onAuth(callback){
  const fb=loadFirebase(); if(!fb) return;
  fb.auth.onAuthStateChanged(callback);
}

export async function ensureAuthed(){
  return new Promise((resolve)=>{
    onAuth(async (user)=>{
      if(!user){ window.location.href='/login'; return; }
      resolve(user);
    });
  });
}

export async function loginWithEmail(email,password){
  const fb=loadFirebase();
  const cred = await fb.auth.signInWithEmailAndPassword(email,password);
  const idToken = await cred.user.getIdToken(true);
  await fetch('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken})});
  return cred.user;
}

export async function signupWithEmail(email,password,name){
  const fb=loadFirebase();
  const cred = await fb.auth.createUserWithEmailAndPassword(email,password);
  await cred.user.updateProfile({ displayName: name||'' });
  const idToken = await cred.user.getIdToken(true);
  await fetch('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken})});
  return cred.user;
}

export async function logout(){
  const fb=loadFirebase();
  await fetch('/api/auth/logout',{method:'POST'});
  await fb.auth.signOut();
  window.location.href='/login';
}

export function mountNavbar(active){
  const userEl=document.querySelector('#nav-user');
  onAuth((u)=>{
    if(userEl) userEl.textContent = u? (u.displayName||u.email||'User') : '';
  });
  document.querySelectorAll('[data-logout]').forEach(btn=>btn.addEventListener('click', logout));
  document.querySelectorAll('.navbar .links a').forEach(a=>{
    if(active && a.dataset.active===active){ a.classList.add('active'); }
  });
}
