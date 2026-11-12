/* v3s: --js-browser fallback. If the early async nagi.js already booted, this is a no-op.
   Otherwise load nagi.js here (document-order, after copyparty's own scripts). */
(function(){
  if(window.__nagiJs)return;
  var s=document.createElement('script');
  s.src='__NAGI_JS_URL__';
  s.async=false;
  var n=document.currentScript&&document.currentScript.nonce;
  if(n)s.setAttribute('nonce',n);
  var cur=document.currentScript;
  (cur&&cur.parentNode?cur.parentNode:document.head).insertBefore(s, cur?cur.nextSibling:null);
})();
