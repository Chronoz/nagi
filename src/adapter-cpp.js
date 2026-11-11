/* 凪 Nagi — adapter for the real copyparty (runs inside browser.html via --js-browser).
   Data: the ?ls JSON API. Uploads: copyparty's own up2k engine. Share/mkdir/move/delete: copyparty's POST endpoints. */
(function(){
"use strict";
if(!document.getElementById('ht_brw')||!window.fetch)return;
var last={perms:[],acct:'*',cfg:{}};
if(/[?&]pw=x\b/.test(location.search))try{history.replaceState(null,'',location.pathname)}catch(e){}
function here(){var p=location.pathname;return p.endsWith('/')?p:p.replace(/[^\/]*$/,'')}
function dec(s){try{return decodeURIComponent(s)}catch(e){return s}}
function parseSize(s){var m=/([\d.]+)\s*([KMGTP]?)i?B/i.exec(s||'');if(!m)return null;return parseFloat(m[1])*Math.pow(1024,' KMGTP'.indexOf((m[2]||' ').toUpperCase()))}
function post(url,body,type){return fetch(url,{method:'POST',credentials:'same-origin',headers:type?{'Content-Type':type}:{},body:body}).then(function(r){return r.text().then(function(t){if(r.status>=300)throw new Error((t||'').replace(/<[^>]+>/g,'').trim().slice(0,200)||('HTTP '+r.status));return t})})}
function ck(id){var e=document.getElementById(id);return e?!!e.checked:false}
function tg(id){var e=document.getElementById(id);if(e)e.click()}
var A={
 rootName:'Everything',
 start:here,here:here,
 go:function(p){try{if(window.treectl&&treectl.goto){treectl.goto(p,true);return}}catch(e){}history.pushState({},'',p)},
 ls:function(path){return fetch(path+'?ls',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){
   if(path==here()){last=j;A.user=j.acct&&j.acct!='*'?j.acct:null}
   var fr=/([\d.]+\s*\S+)\s+free of\s+([\d.]+\s*\S+)/.exec(j.srvinf||''),free=fr?parseSize(fr[1]):null,total=fr?parseSize(fr[2]):null;
   function m(x,isd){var name=dec(x.href.replace(/\/$/,'').split('?')[0]);return {name:name,href:x.href,path:path+x.href.split('?')[0],size:x.sz||0,ts:x.ts,tags:x.tags||{},count:isd&&x.tags&&x.tags['.files']!=null?x.tags['.files']:null}}
   return {path:path,dirs:(j.dirs||[]).map(function(x){return m(x,1)}),files:(j.files||[]).filter(function(x){return !/\.PARTIAL(\?|$)/.test(x.href)}).map(function(x){return m(x,0)}),free:free,total:total,perms:j.perms||[],acct:j.acct}})},
 perms:function(){var p=last.perms||[];return {read:p.indexOf('read')>=0,write:p.indexOf('write')>=0,move:p.indexOf('move')>=0,del:p.indexOf('delete')>=0}},
 canShare:function(){return !!A.user&&!!(last.cfg&&last.cfg.shr_who)&&last.cfg.shr_who!='no'},
 url:function(x){return x.path},
 mdUrl:function(x){return x.path+'?v'},
 text:function(x){return fetch(x.path,{credentials:'same-origin'}).then(function(r){return r.text()})},
 qr:function(u){return u+'?qr'},
 loginUrl:function(){return here()+'?h'},logoutUrl:function(){return here()+'?pw=x'},panelUrl:'/?h',
 zip:function(path,names){if(!names){location.href=path+'?zip';return}
   var f=document.createElement('form');f.method='post';f.action=path+'?zip';f.target='_blank';f.enctype='multipart/form-data';f.style.display='none';
   f.innerHTML='<input name="act" value="zip"><textarea name="files"></textarea>';f.querySelector('textarea').value=names.join('\n');document.body.appendChild(f);f.submit();setTimeout(function(){f.remove()},1000)},
 search:function(q){q=q.replace(/[*()]/g,' ').trim().replace(/\s+/g,' ');var w='*'+q.replace(/ /g,'*')+'*';
   return post('/?srch',JSON.stringify({q:'name like '+w+(window.have_tags_idx?' or tags like '+w:''),n:200}),'text/plain').then(function(t){var j=JSON.parse(t);return (j.hits||[]).map(function(h){var p='/'+h.rp,dir=p.replace(/[^\/]+$/,'');return {name:dec(p.split('/').pop()),path:p,dir:dir,size:h.sz,ts:h.ts,tags:h.tags||{},isDir:false}})})},
 share:function(paths,o){var k=Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,6);
   return post('/?share',JSON.stringify({k:k,vp:paths.map(function(p){return dec(p)}),pw:o.pw||'',exp:String(o.exp),perms:o.perms||['read']}),'text/plain').then(function(t){var m=/created share:\s*(\S+)/.exec(t);if(!m)throw new Error(t.slice(0,160));return m[1]})},
 mkdir:function(dir,name){var fd=new FormData();fd.append('act','mkdir');fd.append('name',name);return post(dir,fd)},
 rename:function(x,n){var isd=/\/$/.test(x.path),base=x.path.replace(/[^\/]+\/?$/,''),dst=base+encodeURIComponent(n)+(isd?'/':'');return post(x.path+'?move='+dst)},
 del:function(list){return list.reduce(function(p,x){return p.then(function(){return post(x.path+'?delete')})},Promise.resolve())},
 pickFiles:function(){var e=document.getElementById('file1');if(e)e.click()},
 pickFolder:function(){var e=document.getElementById('dir1');if(e)e.click()},
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
 classic:function(){document.documentElement.classList.add('nagi-classic');localStorage.nagi_classic='1'},
 modalOpen:function(){return !!(window.modal&&modal.busy)}
};
function auto(){var h=new Date().getHours()+new Date().getMinutes()/60;return h>=17.5||h<6?'yugure':'paper'}
function apply(){var t=A.theme();if(t=='sky')t=auto();var c=t=='yugure'?'fz f z':'fy f y';var h=document.documentElement,keep=h.classList.contains('nagi-classic');var app=h.classList.contains('nagi-app');h.className=c+(keep?' nagi-classic':'')+(app?' nagi-app':'')+' nagi';try{localStorage.cpp_thm=c}catch(e){}}
apply();setInterval(function(){if(A.theme()=='sky')apply()},60000);
window.NagiCpp=A;
function boot(){
  if(localStorage.nagi_classic=='1')document.documentElement.classList.add('nagi-classic');
  window.NagiApp.start(A);
  // v3g: copyparty's toasts stay small (bridge.css) and short; the upload summary is replaced by Nagi's own quiet note
  var T=window.toast;if(T&&T.show&&!T._nagi){var orig=T.show;T._nagi=1;T.show=function(cl,sec,txt,tag){
    if(!document.documentElement.classList.contains('nagi-classic')){var s=String(txt||''),c=String(cl||'');
      if(/\n\n[^\n]* @ [^\n]*\/s$/.test(s))return;
      if(sec>0)sec=/^ok/.test(c)?Math.min(sec,2):/^inf/.test(c)?Math.min(sec,4):Math.min(sec,8)}
    return orig.call(T,cl,sec,txt,tag)}}
  var back=document.createElement('button');back.id='nagi-back';back.innerHTML='<i class="ni" style="--ni:var(--ni-wand-sparkles)"></i>Back to Nagi';back.onclick=function(){document.documentElement.classList.remove('nagi-classic');localStorage.nagi_classic='';NagiApp.refresh()};document.body.appendChild(back);
}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})();
(function(){var A=window.NagiCpp;if(!A)return;var th=window.CGV1&&CGV1.have_th!==undefined?CGV1.have_th:true;A.thumb=function(x){return th?x.path+'?th=w':null};var TC={},fmt=null;function get(u){return fetch(u,{credentials:'same-origin'}).then(function(r){var ct=r.headers.get('content-type')||'';if(!r.ok||!/^image\//.test(ct)||/svg/.test(ct))return null;return r.blob()},function(){return null})}
 A.thumbOk=function(url){if(TC[url])return TC[url];var u=fmt=='j'?url.replace(/\?th=w$/,'?th=j'):url;return TC[url]=get(u).then(function(b){if(b){if(!fmt)fmt=/th=j$/.test(u)?'j':'w';return URL.createObjectURL(b)}if(/\?th=w$/.test(u)&&fmt!='w')return get(url.replace(/\?th=w$/,'?th=j')).then(function(b2){if(!b2)return null;fmt='j';return URL.createObjectURL(b2)});return null})}})();
