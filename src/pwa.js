/* v3g: installable web app (iPhone "Add to Home Screen") + app-like touch behaviour. Shared by every Nagi page. */
(function(){if(window.__nagiPwa||!document.head)return;window.__nagiPwa=1;var H=document.head,B='/.nagi/';
  function tag(t,k,v,at){var e=H.querySelector(t+'['+k+'="'+v+'"]');if(!e){e=document.createElement(t);e.setAttribute(k,v);H.appendChild(e)}for(var a in at)e.setAttribute(a,at[a]);return e}
  tag('link','rel','manifest',{href:B+'manifest.json'});
  tag('link','rel','apple-touch-icon',{href:B+'icon-180.png'});
  tag('meta','name','apple-mobile-web-app-capable',{content:'yes'});
  tag('meta','name','mobile-web-app-capable',{content:'yes'});
  tag('meta','name','apple-mobile-web-app-title',{content:'Nagi'});
  tag('meta','name','apple-mobile-web-app-status-bar-style',{content:'black-translucent'});
  // copyparty ships initial-scale=0.8: on a phone that renders Nagi at 80 % (468 css px on an iPhone X), which made
  // every icon and tap target 20 % smaller than designed. Nagi is laid out for the real width; classic keeps copyparty's.
  var vp=H.querySelector('meta[name="viewport"]');if(!vp)vp=tag('meta','name','viewport',{content:'width=device-width, initial-scale=1'});
  var vp0=vp.content,NV='width=device-width, initial-scale=1, viewport-fit=cover';
  function syncVp(){var c=document.documentElement.classList.contains('nagi-classic')?vp0+(/viewport-fit/.test(vp0)?'':', viewport-fit=cover'):NV;if(vp.content!==c)vp.content=c}
  // theme-color follows the Nagi light (paper / yūgure) so the status bar matches the page
  var tc=tag('meta','name','theme-color',{content:'#F1EADB'});
  function sync(){syncVp();var dark=/\bfz\b/.test(document.documentElement.className);tc.setAttribute('content',dark?'#0F1D1E':'#F1EADB')}
  sync();try{new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(e){}
  var standalone=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  document.documentElement.classList.toggle('nagi-app',!!standalone);
  // a service worker needs a secure context (https or localhost); over plain http (tailscale) we simply do without
  // (iOS installs and runs the home-screen app without one). Nothing is cached, so nothing can go stale.
  // In a Safari tab, a touch that starts at the very screen edge would trigger back/forward swipe navigation:
  // swallow those edge starts (and turn a short tap there back into a click). Not needed when installed.
  // v3h: never on controls (buttons, links, fields, stones, rows, the bottom bar): a swallowed touchstart there
  // broke taps, e.g. on the top-right ⋯. Only bare background near the edge is guarded.
  if(!standalone&&'ontouchstart' in window){var E=14,UI='button,a,input,select,textarea,label,summary,[role],.cell,.row,.bb,.mm,.sheet,.lbx,.np,.ctx,.tb';
    document.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;var t=e.touches[0],el=e.target;if(t.clientX>=E&&t.clientX<=innerWidth-E)return;if(el&&el.closest&&el.closest(UI))return;e.preventDefault()},{passive:false})}
})();
