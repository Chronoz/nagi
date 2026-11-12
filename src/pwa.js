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
  var vp=H.querySelector('meta[name="viewport"]');if(!vp)vp=tag('meta','name','viewport',{content:'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'});
  /* v3v: lock pinch / double-tap zoom. copyparty ships initial-scale=0.8 (and on the
     browser page, minimum-scale=0.6). We overwrite that single existing tag — never
     add a second viewport meta, which iOS merges unpredictably. maximum-scale=1 also
     snaps iOS off the 0.8 it may have already applied. v3j used to lift the lock
     after 600ms so pinch still worked; that is the opposite of what we want now.
     iOS Safari ignores user-scalable=no on its own (iOS 10+), so gesture and
     multi-touch preventDefault below are the real pinch block. */
  var NV='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  function syncVp(){if(vp.content!==NV)vp.content=NV}
  // theme-color follows the Nagi light (paper / yūgure) so the status bar matches the page
  var tc=tag('meta','name','theme-color',{content:'#F1EADB'});
  function sync(){syncVp();var dark=/\bfz\b/.test(document.documentElement.className);tc.setAttribute('content',dark?'#0F1D1E':'#F1EADB')}
  sync();try{new MutationObserver(function(){sync();if(window.NagiFit)NagiFit();else if(typeof fit==='function')fit()}).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(e){}
  var standalone=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  document.documentElement.classList.toggle('nagi-app',!!standalone);
  // a service worker needs a secure context (https or localhost); over plain http (tailscale) we simply do without
  // (iOS installs and runs the home-screen app without one). Nothing is cached, so nothing can go stale.
  // In a Safari tab, a touch that starts at the very screen edge would trigger back/forward swipe navigation:
  // swallow those edge starts (and turn a short tap there back into a click). Not needed when installed.
  // v3h: never on controls (buttons, links, fields, stones, rows, the bottom bar): a swallowed touchstart there
  // broke taps, e.g. on the top-right ⋯. Only bare background near the edge is guarded.
  // v3j: iOS Safari mis-aims taps on fixed layers once the document behind them has scrolled (toolbar collapse,
  // the keyboard pushing the page up and leaving it there): the bottom bar looked in place but its hit boxes sat
  // lower. Nagi owns the whole screen, so keep the document pinned at 0,0 and size the app to the real viewport.
  var R=document.documentElement;function app(){return R.classList.contains('nagi')&&!R.classList.contains('nagi-classic')}
  function typing(){var a=document.activeElement;return a&&(a.tagName=='INPUT'||a.tagName=='TEXTAREA'||a.isContentEditable)}
  /* v3s: early nagi.js runs before browser.js, which later overwrites
     documentElement.className (theme + "read write") and would drop our
     "nagi" class — without it, fit() no-ops and html.nagi rules never apply.
     Re-add it whenever it disappears. */
  function keepNagi(){if(!(window.__nagiStarted||document.getElementById('nagi')))return;if(!R.classList.contains('nagi'))R.classList.add('nagi')}
  /* v3r: never write a keyboard-shrunk height into --nagi-h. Prefer the
     visual viewport (the pixels actually on screen) over innerHeight, which
     can disagree after an early viewport-meta snap. typing() still skips. */
  function vv(){var v=window.visualViewport;return (v&&v.height>100)?v.height:window.innerHeight}
  function fit(){keepNagi();if(!app())return;if(typing())return;R.style.setProperty('--nagi-h',vv()+'px');
    if(window.scrollY||window.scrollX||(document.body&&document.body.scrollTop)||R.scrollTop){window.scrollTo(0,0);if(document.body)document.body.scrollTop=0;R.scrollTop=0}
    var w=document.querySelector('#nagi .win');if(w&&w.scrollTop)w.scrollTop=0}
  ['resize','orientationchange','pageshow','load','scroll'].forEach(function(t){addEventListener(t,fit,{passive:true})});
  if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit)}
  document.addEventListener('focusout',function(){setTimeout(fit,60);setTimeout(fit,400)});
  function startFit(){fit();setTimeout(fit,300);setTimeout(fit,1200)}
  if(document.body)startFit();else{var _mo=new MutationObserver(function(){if(document.body){_mo.disconnect();startFit()}});_mo.observe(R,{childList:true,subtree:true})}
  window.NagiFit=fit;
  // iOS only applies :active (our press states) when the page listens for touches
  document.addEventListener('touchstart',function(){},{passive:true});
  if(!standalone&&'ontouchstart' in window){var E=14,UI='button,a,input,select,textarea,label,summary,[role],.cell,.row,.bb,.mm,.sheet,.lbx,.np,.ctx,.tb';
    document.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;var t=e.touches[0],el=e.target;if(t.clientX>=E&&t.clientX<=innerWidth-E)return;if(el&&el.closest&&el.closest(UI))return;e.preventDefault()},{passive:false})}
  /* v3v: iOS Safari (and the home-screen web app) still pinch-zooms despite
     user-scalable=no. Kill Safari's gesture events and any multi-finger
     touchmove. Single-finger touchmove is left alone so list / sheet scroll,
     the drawer swipe, reader text selection, and the edge-swipe guard above
     keep working. Capture + non-passive so preventDefault actually sticks. */
  function noZoom(e){e.preventDefault()}
  ;['gesturestart','gesturechange','gestureend'].forEach(function(n){document.addEventListener(n,noZoom,{passive:false,capture:true})});
  document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false,capture:true});

  /* v3s: Newsreader / italic / Plex are not on the first garden screen — load them
     on demand (sheets, login, idle) so first paint does not wait on 190 KB+ of serif. */
  var DF=B+'nagi-fonts-defer.css?nagi=__NAGI_DF__&cache=31536000';
  window.NagiDeferFonts=function(){if(window.__nagiDf||!document.head)return;window.__nagiDf=1;var l=document.createElement('link');l.rel='stylesheet';l.href=DF;document.head.appendChild(l)};
  if(!document.getElementById('ht_brw')){
    if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',function(){window.NagiDeferFonts()});
    else window.NagiDeferFonts();
  }
})();
