/* v3v: lock the (single) viewport meta on every Nagi page, including login.
   Runs from <head> via --html-head-s, immediately after copyparty's own
   viewport tag, and updates that tag in place so we never have two. The
   same content is kept by pwa.js; this just wins the race before first paint. */
(function(){
  var C='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  var m=document.querySelector('meta[name="viewport"]');
  if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');(document.head||document.documentElement).appendChild(m)}
  if(m.getAttribute('content')!==C)m.setAttribute('content',C);
})();
/* v3s: runs from <head> on the file browser only (html#ht_brw). Starts nagi.js
   async so the garden can boot without waiting for DOMContentLoaded (which waits
   for copyparty's blocking browser.js / baguettebox / up2k). Best-effort: if the
   HTML parser goes through the `src` setter, those three scripts are stashed
   and loaded after first paint (idle, or on first upload/Classic). If the parser
   ignores the setter — typical for parser-inserted tags — they still run in
   document order; Nagi has already started. */
(function(){
  if(!document.getElementById('ht_brw')||window.__nagiBootTag)return;
  window.__nagiBootTag=1;
  window.__nagiCpp=window.__nagiCpp||{pending:[],waiters:[]};
  var DEFER=/\/(?:baguettebox|browser|up2k)\.js(\?|$)/;
  try{
    var proto=HTMLScriptElement.prototype;
    var desc=Object.getOwnPropertyDescriptor(proto,'src');
    if(desc&&desc.set){
      Object.defineProperty(proto,'src',{
        configurable:true,enumerable:!!desc.enumerable,
        get:function(){return desc.get.call(this)},
        set:function(v){
          if(DEFER.test(String(v))){
            var u=String(v);
            if(window.__nagiCpp.pending.indexOf(u)<0)window.__nagiCpp.pending.push(u);
            window.J_BBX=window.J_BBX||2;window.J_BRW=window.J_BRW||2;window.J_U2K=window.J_U2K||2;
            return;
          }
          return desc.set.call(this,v);
        }
      });
    }
  }catch(e){}
})();

/* v4.1.1: splash lives in the inlined head CSS, but ONLY on html#ht_brw
   (the file browser / garden). Login, ?h, 401/403, the md editor, ?ups and
   other copyparty pages never create #nagi, so waiting for it left them
   covered forever. This IIFE (a) honours a stored yūgure theme, (b) promotes
   the non-blocking stylesheets on every page, and (c) dismisses the splash
   on #nagi, on DOMContentLoaded / load if #nagi is absent, or after 1.2s,
   whichever comes first. The layer is pointer-events:none the whole time. */
(function(){
  try{
    var t=localStorage.nagi_theme;
    if(t==='yugure'||(!t&&/\bfz\b/.test(document.documentElement.className))){
      document.documentElement.classList.add('nagi-dark');
      var m=document.querySelector('meta[name="theme-color"]');
      if(m)m.setAttribute('content','#0F1D1E');
    }
  }catch(e){}
  function promote(id){
    var l=document.getElementById(id);if(!l)return;
    var go=function(){if(l.media!=='all')l.media='all'};
    if(l.sheet)go();else l.addEventListener('load',go);
    l.addEventListener('error',go);
  }
  function promoteAll(){promote('nagi-pages-css');promote('nagi-css')}
  promoteAll();
  var done=0,mo,iv;
  function cleanup(){
    if(mo)try{mo.disconnect()}catch(e){}
    mo=null;
    if(iv){clearInterval(iv);iv=0}
  }
  function fade(force){
    var h=document.documentElement;
    if(h.classList.contains('nagi-booted')){cleanup();return}
    // Non-browser pages (login, ?h, 401, md, …): take the layer off at once.
    var browser=h.id==='ht_brw'||!!document.getElementById('nagi');
    if(!browser||force==='now'){
      h.classList.add('nagi-ready');h.classList.add('nagi-booted');cleanup();return;
    }
    if(h.classList.contains('nagi-ready'))return;
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      if(h.classList.contains('nagi-booted'))return;
      h.classList.add('nagi-ready');
      setTimeout(function(){h.classList.add('nagi-booted');cleanup()},500);
    })});
  }
  function onNagi(){
    if(document.getElementById('nagi')){cleanup();fade();return true}
    return false;
  }
  function onReady(){
    promoteAll();
    if(onNagi())return;
    // Document is ready and there is no garden: this is login / ?h / an error page.
    fade('now');
  }
  // Known from the first byte on every copyparty page: html#ht_spl (login),
  // ht_msg (error / 401), ht_svc (?h), ht_shr, ht_rup. Dismiss immediately.
  if(document.documentElement.id&&document.documentElement.id!=='ht_brw'){
    fade('now');return;
  }
  if(onNagi())return;
  if(document.readyState==='complete'||document.readyState==='interactive'){
    // Parsed, still no #nagi: give the deferred nagi.js a tick, then give up.
    setTimeout(function(){if(!onNagi())onReady()},0);
  }else{
    document.addEventListener('DOMContentLoaded',onReady);
    try{var mo0=new MutationObserver(function(){if(onNagi()){try{mo0.disconnect()}catch(e){}}});mo0.observe(document.documentElement,{childList:true,subtree:true});mo=mo0}catch(e){}
  }
  addEventListener('load',function(){if(!document.getElementById('nagi'))onReady()});
  setTimeout(function(){if(!document.documentElement.classList.contains('nagi-ready')&&!document.documentElement.classList.contains('nagi-booted'))fade('now')},1200);
  if(window.MutationObserver&&!mo){
    try{mo=new MutationObserver(function(){onNagi()});mo.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  }
  var n=0;iv=setInterval(function(){
    if(onNagi())return;
    if(++n>80){clearInterval(iv);iv=0} // ~1.3s at 16ms, timeout above already fired
  },16);
})();
