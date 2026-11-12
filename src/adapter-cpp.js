/* 凪 Nagi — adapter for the real copyparty (runs inside browser.html via --js-browser).
   Data: the ?ls JSON API. Uploads: copyparty's own up2k engine. Share/mkdir/move/delete: copyparty's POST endpoints. */
(function(){
"use strict";
if(window.__nagiCppInit)return;
if(!window.fetch)return;
/* ht_brw is the <html> id on the file browser — present from the first byte, even in <head>.
   If this file ran as an early async load before body, wait for document.body (see whenBody). */
if(!document.getElementById('ht_brw'))return;
window.__nagiCppInit=1;
if(document.currentScript&&document.currentScript.nonce)window.__nagiNonce=document.currentScript.nonce;
var last={perms:[],acct:'*',cfg:{}};
if(/[?&]pw=x\b/.test(location.search))try{history.replaceState(null,'',location.pathname)}catch(e){}
function here(){var p=location.pathname;return p.endsWith('/')?p:p.replace(/[^\/]*$/,'')}
function parentOf(p){return (p||'/').replace(/[^\/]+\/?$/,'')||'/'}
function dec(s){try{return decodeURIComponent(s)}catch(e){return s}}
function parseSize(s){var m=/([\d.]+)\s*([KMGTP]?)i?B/i.exec(s||'');if(!m)return null;return parseFloat(m[1])*Math.pow(1024,' KMGTP'.indexOf((m[2]||' ').toUpperCase()))}
function post(url,body,type){return fetch(url,{method:'POST',credentials:'same-origin',headers:type?{'Content-Type':type}:{},body:body}).then(function(r){return r.text().then(function(t){if(r.status>=300)throw new Error((t||'').replace(/<[^>]+>/g,'').trim().slice(0,200)||('HTTP '+r.status));return t})})}
function upInput(dir){var f=document.getElementById('u2form');if(!f)return document.getElementById(dir?'dir1':'file1');
  var all=f.querySelectorAll(dir?'input[webkitdirectory],input[directory]':'input[type=file]');
  var last=null;
  for(var i=0;i<all.length;i++){var el=all[i],isDir=el.hasAttribute('webkitdirectory')||el.hasAttribute('directory');
    if(!!dir===isDir)last=el}
  return last||document.getElementById(dir?'dir1':'file1')}
function ck(id){var e=document.getElementById(id);return e?!!e.checked:false}
function tg(id){var e=document.getElementById(id);if(e)e.click()}
var A={
 rootName:'Everything',
 start:here,here:here,
 go:function(p){try{if(window.treectl&&treectl.goto){treectl.goto(p,true);return}}catch(e){}history.pushState({},'',p)},
 dots:function(){return /(?:^|;\s*)dots=y(?:;|$)/.test(document.cookie)},
 setDots:function(v){document.cookie=v?'dots=y;path=/;SameSite=Lax;max-age=31536000':'dots=;path=/;SameSite=Lax;max-age=0';if(A.invalidate)A.invalidate()},
 ls:function(path){return fetch(path+'?ls'+(A.dots&&A.dots()?'&dots':''),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){
   if(path==here()){last=j;A.user=j.acct&&j.acct!='*'?j.acct:null}
   var fr=/([\d.]+\s*\S+)\s+free of\s+([\d.]+\s*\S+)/.exec(j.srvinf||''),free=fr?parseSize(fr[1]):null,total=fr?parseSize(fr[2]):null;
   function m(x,isd){var name=dec(x.href.replace(/\/$/,'').split('?')[0]);return {name:name,href:x.href,path:path+x.href.split('?')[0],size:x.sz||0,ts:x.ts,tags:x.tags||{},count:isd&&x.tags&&x.tags['.files']!=null?x.tags['.files']:null}}
   return {path:path,dirs:(j.dirs||[]).map(function(x){return m(x,1)}),files:(j.files||[]).filter(function(x){return !/\.PARTIAL(\?|$)/.test(x.href)}).map(function(x){return m(x,0)}),free:free,total:total,perms:j.perms||[],acct:j.acct}})},
 perms:function(){var p=last.perms||[];return {read:p.indexOf('read')>=0,write:p.indexOf('write')>=0,move:p.indexOf('move')>=0,del:p.indexOf('delete')>=0,dot:p.indexOf('dot')>=0}},
 canShare:function(){return !!A.user&&!!(last.cfg&&last.cfg.shr_who)&&last.cfg.shr_who!='no'},
 url:function(x){return x.path},
 mdUrl:function(x){return x.path+'?v'},
 text:function(x){return fetch(x.path,{credentials:'same-origin'}).then(function(r){return r.text()})},
 /* lstat-only probe via /.nagi/sem?stat=. Never opens the file. A missing sidecar means "not dataless". */
 isDataless:function(x){if(!x||!x.path)return Promise.resolve(false);
   return fetch('/.nagi/sem?stat='+encodeURIComponent(x.path),{credentials:'same-origin'}).then(function(r){
     return r.json().then(function(j){return !!(j&&j.ok&&j.dataless)},function(){return false})},function(){return false})},
 readme:function(files){var rd=null,i,L=files||[];
   for(i=0;i<L.length;i++)if(!L[i].isDir&&/^README\.md$/i.test(L[i].name)){rd=L[i];break}
   if(!rd)return Promise.resolve(null);
   return A.isDataless(rd).then(function(dl){if(dl)return null;return A.text(rd).then(function(t){return {text:t,name:rd.name,path:rd.path,ts:rd.ts,size:rd.size}})})},
 ups:function(){return fetch(here()+'?ups',{credentials:'same-origin'}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.error)||('HTTP '+r.status));return j})})},
 unpost:function(paths){paths=(paths||[]).map(function(p){return dec(String(p).split('?')[0])});
   return post('/?delete&unpost&lim='+paths.length,JSON.stringify(paths),'application/json').then(function(t){if(A.invalidate)paths.forEach(function(p){A.invalidate(parentOf(p))});return t})},
 dupes:function(){return fetch('/.nagi/sem?dupes',{credentials:'same-origin'}).then(function(r){return r.json().then(function(j){if(r.status===401||r.status===403)throw new Error('forbidden');if(!r.ok||(j&&j.ok===false))throw new Error((j&&j.error)||('HTTP '+r.status));return j},function(){throw new Error('HTTP '+r.status)})})},
 saveText:function(x,body,lastmod){var fd=new FormData();fd.append('act','tput');fd.append('lastmod',String(lastmod==null?-1:lastmod));fd.append('body',body);
   return fetch(x.path,{method:'POST',credentials:'same-origin',body:fd}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t)}catch(e){throw new Error((t||'').replace(/<[^>]+>/g,'').trim().slice(0,200)||('HTTP '+r.status))}
     if(r.status>=300)throw new Error((t||'').replace(/<[^>]+>/g,'').trim().slice(0,200)||('HTTP '+r.status));
     if(j&&j.ok&&A.invalidate){A.invalidate(parentOf(x.path));A.invalidate(x.path)}
     return j})})},
 qr:function(u){return u+'?qr'},
 loginUrl:function(){return here()+'?h'},logoutUrl:function(){return here()+'?pw=x'},panelUrl:'/?h',
 zip:function(path,names){if(!names){location.href=path+'?zip';return}
   var f=document.createElement('form');f.method='post';f.action=path+'?zip';f.target='_blank';f.enctype='multipart/form-data';f.style.display='none';
   f.innerHTML='<input name="act" value="zip"><textarea name="files"></textarea>';f.querySelector('textarea').value=names.join('\n');document.body.appendChild(f);f.submit();setTimeout(function(){f.remove()},1000)},
 search:function(q){q=q.replace(/[*()]/g,' ').trim().replace(/\s+/g,' ');var w='*'+q.replace(/ /g,'*')+'*';
   return post('/?srch',JSON.stringify({q:'name like '+w+(window.have_tags_idx?' or tags like '+w:''),n:200}),'text/plain').then(function(t){var j=JSON.parse(t);return (j.hits||[]).map(function(h){var p='/'+h.rp,dir=p.replace(/[^\/]+$/,'');return {name:dec(p.split('/').pop()),path:p,dir:dir,size:h.sz,ts:h.ts,tags:h.tags||{},isDir:false}})})},
 smartSearch:function(q){return fetch('/.nagi/sem?q='+encodeURIComponent(q),{credentials:'same-origin'}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t)}catch(e){j=null}if(!r.ok||!j||j.sidecar===false)throw new Error((j&&j.error)||('HTTP '+r.status));return {hits:(j.hits||[]).map(function(h){var p=h.path||('/'+(h.rp||'')),dir=h.dir||p.replace(/[^\/]+$/,'');return {name:h.name||dec(p.split('/').pop()),path:p,dir:dir,size:h.size||h.sz||0,ts:h.ts,tags:h.tags||{},isDir:!!h.isDir,snip:h.snip||'',score:h.score,engine:'smart'}}),ms:j.ms,embedded:j.embedded,engine:'smart'}})})},
 smartStatus:function(){return fetch('/.nagi/sem?ping=1',{credentials:'same-origin'}).then(function(r){return r.json().then(function(j){return j},function(){return {ok:false}})},function(){return {ok:false,sidecar:false}})},
 engine:function(){return localStorage.nagi_search==='default'?'default':'smart'},
 setEngine:function(v){localStorage.nagi_search=v==='default'?'default':'smart'},
 share:function(paths,o){var k=Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,6);
   return post('/?share',JSON.stringify({k:k,vp:paths.map(function(p){return dec(p)}),pw:o.pw||'',exp:String(o.exp),perms:o.perms||['read']}),'text/plain').then(function(t){var m=/created share:\s*(\S+)/.exec(t);if(!m)throw new Error(t.slice(0,160));return m[1]})},
 mkdir:function(dir,name){var fd=new FormData();fd.append('act','mkdir');fd.append('name',name);return post(dir,fd)},
 rename:function(x,n){var isd=/\/$/.test(x.path),base=x.path.replace(/[^\/]+\/?$/,''),dst=base+encodeURIComponent(n)+(isd?'/':'');return post(x.path+'?move='+dst)},
 /* v3t: dest is a folder path (trailing slash). copyparty wants the full new vpath including the name. */
 _dest:function(x,dir){var isd=/\/$/.test(x.path),base=(dir||'/').replace(/\/?$/,'/') ;return base+encodeURIComponent(x.name)+(isd?'/':'')},
 move:function(x,dir){return post(x.path+'?move='+A._dest(x,dir))},
 copy:function(x,dir){return post(x.path+'?copy='+A._dest(x,dir))},
 del:function(list){return list.reduce(function(p,x){return p.then(function(){return post(x.path+'?delete')})},Promise.resolve())},
 pickFiles:function(){ensureCpp(function(){var e=upInput(false);if(e)e.click()})},
 pickFolder:function(){ensureCpp(function(){var e=upInput(true);if(e)e.click()})},
 // always feed drops into up2k's upload path (not the 'search' drop-zone; that is chosen by Y on a bare body drop)
 onDrop:function(e){try{e.preventDefault();e.stopPropagation()}catch(_){}
   ensureCpp(function(){var fn=document.body.ondrop,dz=document.getElementById('up_dz')||{getAttribute:function(){return 'up_dz'}};
     if(typeof fn==='function')fn.call(dz,e)})},

 uploads:function(){var u=window.up2k;if(!u||!u.ui||!u.ui.tab||!u.st)return [];var fl=u.st.files;
   return u.ui.tab.map(function(t,i){var f=fl[i]||{},hp=String(t.hp||''),m=/([\d.]+)%,\s*([^,]+),\s*([\d.]+)\s*MiB/.exec(hp),state=t.in=='ok'?'ok':t.in=='ng'?'ng':t.in=='q'&&!t.bd&&!t.nh?'q':'run';
     var pct=state=='ok'?100:m?parseFloat(m[1]):t.bt?100*t.bd/t.bt:0;if(t.in=='q'&&t.nh&&!t.bd)pct=0;
     return {name:dec(String(f.name||'').replace(/^a\n/,''))||String(t.hn||'').replace(/<[^>]+>/g,'').split(' / ').pop(),size:t.bt||f.size||0,dir:f.purl||here(),pct:pct,state:state,
       speed:m&&state=='run'?(parseFloat(m[3])*1.048576).toFixed(1)+' MB/s':'',eta:m&&state=='run'&&m[2].trim()!='0:00'?m[2].trim():''}})},
 uploadOpts:function(){var ow=parseInt(localStorage.u2ow||'0',10)||0;return [
   {label:'Ask before uploading',hint:'Show the list of files and wait for a yes',value:ck('ask_up'),set:function(){tg('ask_up')}},
   {label:'Keep hashing while uploading',hint:'Faster for many files; uses more CPU',value:ck('multitask'),set:function(){tg('multitask')}},
   {label:'Simple mode for slow devices',hint:'Hides live progress to save battery',value:ck('potato'),set:function(){tg('potato')}},
   {label:'Randomise file names',hint:'Uploaded files get random names',value:ck('u2rand'),set:function(){tg('u2rand')}},
   {label:'If a file already exists',choices:['Keep both (new name)','Replace if mine is newer','Replace if different','Skip it'],value:ow,set:function(v){for(var i=0;i<4&&(parseInt(localStorage.u2ow||'0',10)||0)!=v;i++)tg('u2ow')}}]},
 theme:function(){var t=localStorage.nagi_theme;if(t)return t;return /\bfz\b/.test(document.documentElement.className)?'yugure':'paper'},
 setTheme:function(t){localStorage.nagi_theme=t;apply()},
 classic:function(){ensureCpp(function(){document.documentElement.classList.add('nagi-classic');localStorage.nagi_classic='1'})},
 modalOpen:function(){return !!(window.modal&&modal.busy)}
};
function auto(){var h=new Date().getHours()+new Date().getMinutes()/60;return h>=17.5||h<6?'yugure':'paper'}
function apply(){var t=A.theme();if(t=='sky')t=auto();var c=t=='yugure'?'fz f z':'fy f y';var h=document.documentElement;['fz','fy','z','y'].forEach(function(x){h.classList.remove(x)});c.split(/\s+/).forEach(function(x){if(x)h.classList.add(x)});h.classList.add('nagi');if(localStorage.nagi_classic=='1')h.classList.add('nagi-classic');try{localStorage.cpp_thm=c}catch(e){}if(window.NagiFit)try{NagiFit()}catch(e){}}
apply();setInterval(function(){if(A.theme()=='sky')apply()},60000);
window.NagiCpp=A;
// v3m: remember folder listings for a short time, and let the garden prefetch on touch
(function(){var C={},TTL=45000;
  var raw=A.ls;
  A.ls=function(path){var k=path+'\0'+(A.dots&&A.dots()?'1':'0'),e=C[k];if(e&&e.d&&Date.now()-e.t<TTL)return Promise.resolve(e.d);if(e&&e.p)return e.p;
    var p=raw(path).then(function(d){C[k]={t:Date.now(),d:d};return d},function(err){if(C[k]&&C[k].p)delete C[k];throw err});
    C[k]={t:0,p:p};return p};
  A.prefetch=function(path){if(!path)return;var k=path+'\0'+(A.dots&&A.dots()?'1':'0');if(C[k]&&C[k].d&&Date.now()-C[k].t<TTL)return;A.ls(path)};
  A.invalidate=function(path){if(!path){C={};return}Object.keys(C).forEach(function(k){if(k===path||k.indexOf(path)===0||path.indexOf(k)===0)delete C[k]})};
})();
(function(){var mk=A.mkdir,rn=A.rename,dl=A.del,mv=A.move,cp=A.copy;
  function parent(p){return (p||'/').replace(/[^\/]+\/?$/,'')||'/'}
  A.mkdir=function(dir,name){return mk(dir,name).then(function(r){A.invalidate(dir);return r})};
  A.rename=function(x,n){return rn(x,n).then(function(r){A.invalidate(parent(x.path));return r})};
  A.del=function(list){return dl(list).then(function(r){list.forEach(function(x){A.invalidate(parent(x.path))});return r})};
  A.move=function(x,dir){return mv(x,dir).then(function(r){A.invalidate(parent(x.path));A.invalidate(dir);return r})};
  A.copy=function(x,dir){return cp(x,dir).then(function(r){A.invalidate(dir);return r})};
})();


/* v3s: copyparty's browser.js / baguettebox / up2k stay out of the first-paint path
   when nagi-early.js successfully defers them. Load on idle after the garden is up,
   or immediately on first upload / Classic / drop. If deferral did not take (the
   parser ran the tags anyway), this is a no-op once those globals exist. */
function cppReady(){return !!(window.up2k&&window.treectl)}
function hookToast(){var T=window.toast;if(T&&T.show&&!T._nagi){var orig=T.show;T._nagi=1;T.show=function(cl,sec,txt,tag){
    if(!document.documentElement.classList.contains('nagi-classic')){var s=String(txt||''),c=String(cl||'');
      if(/\n\n[^\n]* @ [^\n]*\/s$/.test(s))return;
      if(sec>0)sec=/^ok/.test(c)?Math.min(sec,2):/^inf/.test(c)?Math.min(sec,4):Math.min(sec,8)}
    return orig.call(T,cl,sec,txt,tag)}}}
function flushCppWaiters(){hookToast();try{apply()}catch(e){}var w=(window.__nagiCpp&&window.__nagiCpp.waiters)||[];if(window.__nagiCpp)window.__nagiCpp.waiters=[];for(var i=0;i<w.length;i++)try{w[i]()}catch(e){}}
function ensureCpp(cb){
  if(cppReady()){hookToast();if(cb)cb();return}
  window.__nagiCpp=window.__nagiCpp||{pending:[],waiters:[]};
  if(cb)window.__nagiCpp.waiters.push(cb);
  if(window.__nagiCpp.loading)return;
  window.__nagiCpp.loading=1;
  var n=0,poll=setInterval(function(){
    if(cppReady()){clearInterval(poll);window.__nagiCpp.loaded=1;flushCppWaiters()}
    else if(++n>50&&!window.__nagiCpp.injected){ /* ~1s: intercept held them back, or they're slow — inject */
      window.__nagiCpp.injected=1;
      var urls=window.__nagiCpp.pending&&window.__nagiCpp.pending.length?window.__nagiCpp.pending.slice():[];
      if(!urls.length){var ts=window.TS||'';urls=['/.cpr/w/baguettebox.js?_='+ts,'/.cpr/w/browser.js?_='+ts,'/.cpr/w/up2k.js?_='+ts]}
      var i=0;
      (function next(){
        if(i>=urls.length){clearInterval(poll);flushCppWaiters();return}
        var s=document.createElement('script');s.src=urls[i++];s.async=false;
        var nonce=window.__nagiNonce||window.JS_NONCE;if(nonce)s.setAttribute('nonce',nonce);
        s.onload=s.onerror=next;
        document.head.appendChild(s);
      })();
    }
  },20);
}
function whenBody(fn){if(document.body)fn();else{var mo=new MutationObserver(function(){if(document.body){mo.disconnect();fn()}});mo.observe(document.documentElement,{childList:true,subtree:true})}}

function boot(){
  if(localStorage.nagi_classic=='1'){document.documentElement.classList.add('nagi-classic');ensureCpp()}
  window.NagiApp.start(A);
  hookToast();
  if(!document.getElementById('nagi-back')){
    var back=document.createElement('button');back.id='nagi-back';back.innerHTML='<i class="ni" style="--ni:var(--ni-wand-sparkles)"></i>Back to Nagi';back.onclick=function(){document.documentElement.classList.remove('nagi-classic');localStorage.nagi_classic='';NagiApp.refresh()};document.body.appendChild(back);
  }
  var idle=function(){ensureCpp()};
  if('requestIdleCallback' in window)requestIdleCallback(idle,{timeout:2500});else setTimeout(idle,1200);
}
whenBody(boot);
})();
(function(){var A=window.NagiCpp;if(!A)return;var th=window.CGV1&&CGV1.have_th!==undefined?CGV1.have_th:true;
var THUMBED=/\.(jpe?g|png|gif|webp|tif|tiff|bmp|heic|heif|avif|mp4|m4v|mov|webm|mkv|avi)$/i;
var TC={},fmt=null;
A.thumb=function(x,kind){if(!th||!x||x.isDir||!THUMBED.test(x.name||x.path||''))return null;
  /* preview is uncropped 3× (default --th-size 320x256 → 960×768 fit). w3 is centre-cropped, which framed the photo differently from the original and made the v3p double-show worse. */
  var f=fmt||'w',q=kind==='preview'?(f==='j'?'jf3':'wf3'):f;return x.path+'?th='+q};
function get(u){return fetch(u,{credentials:'same-origin'}).then(function(r){var ct=r.headers.get('content-type')||'';if(!r.ok||!/^image\//.test(ct)||/svg/.test(ct))return null;return r.blob()},function(){return null})}
A.thumbOk=function(url){if(TC[url])return TC[url];var u=fmt=='j'?url.replace(/th=w/g,'th=j'):url;
  return TC[url]=get(u).then(function(b){if(b){if(!fmt)fmt=/th=j/.test(u)?'j':'w';return URL.createObjectURL(b)}
    if(/th=w/.test(u)&&fmt!='w')return get(url.replace(/th=w/g,'th=j')).then(function(b2){if(!b2)return null;fmt='j';return URL.createObjectURL(b2)});
    return null})}
})();
