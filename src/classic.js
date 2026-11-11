/* 凪 Nagi — progressive extras for copyparty's browser page.
   Loaded with --js-browser /.nagi/nagi.js ; does nothing unless the Nagi theme (html.f*) is active. */
(function(){
  function parseSize(s){var m=/([\d.]+)\s*([KMGTP]i?B)/i.exec(s||'');if(!m)return null;var u={K:1,M:2,G:3,T:4,P:5}[m[2][0].toUpperCase()];return +m[1]*Math.pow(1024,u)}
  function fmt(b){var u=['B','KiB','MiB','GiB','TiB'],i=0;while(b>=1024&&i<4){b/=1024;i++}return[(b>=100?Math.round(b):b.toFixed(1)),u[i]]}
  function contours(){var d='',r=7;for(var k=1;k<=12;k++){var R=k*9,pts=[],n=28;for(var i=0;i<n;i++){var a=i/n*Math.PI*2,w=1+Math.sin(i*1.7+k*.6)*.08;pts.push([260+Math.cos(a)*R*2.2*w,60+Math.sin(a)*R*w])}
    d+='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1)}).join('L')+'Z'}return'<svg viewBox="0 0 520 120" aria-hidden="true"><path d="'+d+'"/></svg>'}
  function hero(){
    if(!/\bf[yz]\b/.test(document.documentElement.className))return;
    var info=document.querySelector('#srv_info span:nth-child(2)');if(!info)return;
    var m=/(.+) free of (.+)/.exec(info.textContent);if(!m)return;
    var free=parseSize(m[1]),tot=parseSize(m[2]);if(!free||!tot)return;
    var used=fmt(tot-free),el=document.getElementById('nagi-hero');
    if(!el){el=document.createElement('div');el.id='nagi-hero';var w=document.getElementById('wrap');w.insertBefore(el,w.firstChild)}
    el.innerHTML='<div><div class="ey">This volume</div><div class="big">'+used[0]+'<small>'+used[1]+'</small></div><div class="sub">used of '+m[2]+' · '+m[1]+' free</div><div class="cap"><i style="width:'+((1-free/tot)*100).toFixed(1)+'%"></i></div></div>'+contours();
  }
  // copyparty is an SPA: re-run after each folder change
  var last='';setInterval(function(){if(location.pathname!==last){last=location.pathname;setTimeout(hero,150)}},400);
})();
/* classic: mark open tree branches + play state for icon CSS */
(function(){if(!document.getElementById('ht_brw'))return;function mark(){[].forEach.call(document.querySelectorAll('#treeul a[dst]'),function(a){a.parentNode.classList.toggle('nagi-open',/^[-–]$/.test(a.textContent.trim()))});var b=document.getElementById('bplay');if(b)b.classList.toggle('nagi-pause',/⏸|\u23F8/.test(b.textContent))}
 var mo=new MutationObserver(function(){clearTimeout(mark.t);mark.t=setTimeout(mark,30)});function go(){var t=document.getElementById('tree'),w=document.getElementById('widget');if(t)mo.observe(t,{subtree:true,childList:true,characterData:true});if(w)mo.observe(w,{subtree:true,childList:true,characterData:true});mark()}
 if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
