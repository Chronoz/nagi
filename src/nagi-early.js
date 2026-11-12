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
