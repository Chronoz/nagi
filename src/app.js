/* 凪 Nagi app — one calm window: context column (numeral, sentence, checklist, two buttons) + a packed garden.
   window.NagiApp.start(adapter). The adapter supplies data (real copyparty or the fictional mockup). */
(function(){
"use strict";
var G=window.NagiGarden,A,root,$={},st={path:'/',data:null,kids:{},sel:[],view:localStorage.nagi_view||'garden',sheet:null,hover:null,ups:[],q:[],qi:-1,lb:null,cells:[],clip:null};
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ic(n,c){return '<i class="ni ni-'+n+(c?' '+c:'')+'" style="--ni:var(--ni-'+n+')"></i>'}
function el(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild}
var RE={audio:/\.(mp3|flac|ogg|opus|m4a|wav|aac|wma|aif|aiff)$/i,image:/\.(jpe?g|png|gif|webp|avif|heic|bmp|svg)$/i,video:/\.(mp4|mkv|webm|mov|avi|m4v)$/i,
 doc:/\.(md|txt|pdf|docx?|rtf|log|csv|odt|epub|pages)$/i,archive:/\.(zip|tar|gz|tgz|7z|rar|bin|iso|dmg|bak|img)$/i,code:/\.(js|ts|py|css|html?|json|sh|go|rs|c|h|cpp|java|rb|php|ya?ml|toml|ini|conf)$/i};
function ftype(n){for(var k in RE)if(RE[k].test(n))return k;return 'other'}
// v3g: rows are grouped: folders first, then files by type; the chosen order applies inside each group
var GORD=['folder','video','audio','image','doc','code','archive','other'],GLAB={folder:'Folders',video:'Video',audio:'Audio',image:'Images',doc:'Documents',code:'Code',archive:'Archives',other:'Other'};
function grp(x){return x.isDir?'folder':GORD.indexOf(x.type)>0?x.type:'other'}
function grouped(list,cmp){return list.slice().sort(function(a,b){return (GORD.indexOf(grp(a))-GORD.indexOf(grp(b)))||cmp(a,b)})}
function rowIc(x){if(x.isDir)return '<span class="ty d">'+ic('folder','c')+ic('folder-open','o')+'</span>';
  var th=(!x.isDir&&(x.type=='image'||x.type=='video')&&A.thumb)?A.thumb(x):null;
  if(th)return '<span class="ty ths" data-th="'+esc(th)+'">'+ic(ICO[grp(x)])+'<img alt="" decoding="async"></span>';
  return '<span class="ty">'+ic(ICO[grp(x)])+'</span>'}
var ICO={folder:'folder',audio:'music',image:'image',video:'film',doc:'file-text',archive:'file-archive',code:'file-code',other:'file',free:'hard-drive',up:'cloud-upload'};
var NOUN={audio:['track','tracks'],image:['photo','photos'],video:['video','videos'],doc:['document','documents'],archive:['archive','archives'],code:['file','files'],other:['file','files'],folder:['folder','folders']};
function pl(n,t){var w=NOUN[t]||NOUN.other;return n+' '+(n==1?w[0]:w[1])}
function hs(b){b=+b||0;var u=['B','KB','MB','GB','TB','PB'],i=0;while(b>=1000&&i<u.length-1){b/=1000;i++}var v=i==0?String(Math.round(b)):b>=100?b.toFixed(0):b>=10?b.toFixed(1):b.toFixed(2);if(i&&v.indexOf('.')>0)v=v.replace(/\.?0+$/,'');return [v,u[i]]}
function fs(b){var h=hs(b);return h[0]+' '+h[1]}
function rel(ts){if(!ts)return '';var d=(Date.now()/1000-ts);if(d<90)return 'just now';if(d<3600)return Math.round(d/60)+' minutes ago';if(d<86400)return Math.round(d/3600)+(Math.round(d/3600)==1?' hour ago':' hours ago');if(d<86400*2)return 'yesterday';if(d<86400*30)return Math.round(d/86400)+' days ago';return new Date(ts*1000).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}
function dur(s){s=Math.max(0,Math.round(s||0));var m=Math.floor(s/60);return m+':'+('0'+(s%60)).slice(-2)}
function hexmix(a,b,t){function p(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]}var x=p(a),y=p(b);return '#'+x.map(function(v,i){return ('0'+Math.round(v+(y[i]-v)*t).toString(16)).slice(-2)}).join('')}
function lum(h){h=h.replace('#','');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return (.299*r+.587*g+.114*b)/255}
function tone(t,key){var v=getComputedStyle(root).getPropertyValue('--t-'+t).trim()||'#D8CDB6';if(key==null)return v;var k=G.hash(String(key))%3,dk=lum(v)<.5;return k==0?v:hexmix(v,dk?'#9FBDB3':'#FFFFFF',k==1?.08:.16)}
function dirname(p){return p.replace(/[^\/]+\/?$/,'')}
function title(p){if(p=='/'||!p)return A.rootName||'Everything';return decodeURIComponent(p.replace(/\/$/,'').split('/').pop())}

/* ---------- data ---------- */
function domType(list){var by={};list.forEach(function(e){var t=e.isDir?(e.dom||'folder'):e.type;by[t]=(by[t]||0)+(e.size||1)});var best='folder',bv=0;for(var k in by)if(by[k]>bv){bv=by[k];best=k}return best}
function mapIt(c){return c.dirs.map(function(y){y.isDir=1;y.type='folder';return y}).concat(c.files.map(function(y){y.type=ftype(y.name);return y}))}
function fileDom(files){var by={};files.forEach(function(y){by[y.type]=(by[y.type]||0)+(y.size||1)});var best=null,bv=0;for(var k in by)if(by[k]>bv){bv=by[k];best=k}return best}
function kidsOf(x){var k=x.path;if(st.kids[k]&&st.kids[k].ts==x.ts)return Promise.resolve(st.kids[k]);
  return A.ls(k).then(function(c){var it=mapIt(c),files=it.filter(function(y){return !y.isDir}),sub=it.filter(function(y){return y.isDir}).slice(0,4);
    var done=function(extra){var dom=it.length?(fileDom(files.concat(extra||[]))||'folder'):'empty';var r={ts:x.ts,items:it,dom:dom};st.kids[k]=r;return r};
    if(files.length||!sub.length)return done();
    return Promise.all(sub.map(function(y){return A.ls(y.path).then(function(cc){var ii=mapIt(cc);y.dom=fileDom(ii.filter(function(z){return !z.isDir}))||(ii.length?'folder':'empty');return ii.filter(function(z){return !z.isDir})},function(){return []})})).then(function(l){return done([].concat.apply([],l))})})}
function load(path,cb,force){
  A.ls(path,force).then(function(d){
    d.items=mapIt(d);
    var dirs=d.items.filter(function(x){return x.isDir}).slice(0,30);
    Promise.all(dirs.map(function(x){return kidsOf(x).then(function(r){x.kids=r.items;x.dom=r.dom},function(){})})).then(function(){cb(d)});
  },function(e){toast(ic('circle-alert')+' Could not open this folder');console.warn(e)})}

/* ---------- shell ---------- */
function build(){
  root=el('<div id="nagi">'+
   '<div class="win" role="application" aria-label="Nagi">'+
    '<div class="tb"><div class="ttl"><span class="wm">Nagi</span><span class="k">凪</span><span class="srv"></span></div>'+'<div class="fa" role="toolbar" aria-label="Folder actions"></div><button class="tbk" aria-label="Back to the parent folder">'+ic('chevron-left')+'</button><span class="tbt"></span><span class="tbn" role="status" aria-live="polite"></span><button class="tav" aria-label="Sign in"></button><span class="msel"></span><div class="mm" role="menu" aria-label="Actions"></div>'+
     '<div class="menu">'+
      '<button class="t" data-m="search">Search <kbd>/</kbd></button><button class="t" data-m="settings">Settings</button>'+
      '<button class="mb ib" data-m="search" aria-label="Search">'+ic('search')+'</button><button class="mb ib" data-m="upload" aria-label="Upload">'+ic('upload')+'</button><button class="mb ib" data-m="settings" aria-label="Settings">'+ic('settings-2')+'</button><button class="mb ib mo" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">'+ic('ellipsis')+'</button>'+
      '<span class="sep"></span><button class="me t" data-m="me"></button></div></div>'+
    '<div class="bd">'+
     '<section class="gd"><div class="stage"><svg class="g" aria-hidden="true"><g class="zoom"></g></svg><div class="lbs"></div><div class="tip"></div></div>'+
      '<div class="legend"><span><b>●</b>folder</span><span><b>◐</b>uploading</span><span><b>○</b>empty</span><span><i class="ct"></i>free space</span><span class="kh"><kbd>/</kbd>search <kbd>⇧U</kbd>upload <kbd>⌫</kbd>up</span><span class="sp"></span><span class="cnt"></span><div class="seg"><button data-v="garden">Garden</button><button data-v="list">List</button></div></div></section>'+
     '<aside class="ctx"><div class="drawer-h" aria-label="Expand"></div><nav class="crumb"></nav><div class="num"></div><p class="say"></p><p class="para"></p><div class="meter"><i></i></div>'+
      '<div class="nrd" hidden></div><div class="chh"></div><div class="chk" role="listbox" aria-multiselectable="true"></div><div class="acts"></div><div class="acts2 acts"></div>'+
      '<div class="np"><div class="top"><span class="eq"><i></i><i></i><i></i></span><div class="t"><b></b><span></span></div>'+dlb(0)+'<div class="ctl">'+
       '<button class="ib" data-p="prev" aria-label="Previous" title="Previous">'+ic('skip-back')+'</button><button class="ib big" data-p="toggle" aria-label="Play or pause" title="Play / pause (space)">'+ic('pause')+'</button><button class="ib" data-p="next" aria-label="Next" title="Next">'+ic('skip-forward')+'</button></div></div>'+
       '<div class="seek"><span class="a">0:00</span><div class="bar"><i></i><b></b></div><span class="z">0:00</span></div></div>'+
      '</aside>'+
     '<div class="veil"></div><div class="sheet"></div>'+
     '<div class="lbx"><div class="im"></div><div class="cap"></div><button class="ib nav p" aria-label="Previous photo">'+ic('arrow-left')+'</button><button class="ib nav n" aria-label="Next photo">'+ic('arrow-right')+'</button><button class="ib x" aria-label="Close">'+ic('x')+'</button></div>'+
     '<div class="dz"><div>'+ic('cloud-upload')+'<h4>Drop to upload</h4><p></p></div></div>'+
    '</div><div class="toast"></div></div><nav class="bb" aria-label="Actions"></nav></div>');
  document.body.appendChild(root);
  ['win','bd','fa','ctx','crumb','num','say','para','meter','nrd','chh','chk','acts','acts2','np','stage','lbs','tip','legend','veil','sheet','lbx','dz','toast','menu'].forEach(function(k){$[k]=root.querySelector('.'+k)});
  $.tbn=root.querySelector('.tbn');$.mm=root.querySelector('.mm');$.msel=root.querySelector('.msel');$.mo=root.querySelector('.mo');$.bb=root.querySelector('.bb');root.appendChild($.mm);$.tbt=root.querySelector('.tbt');$.tav=root.querySelector('.tav');$.tav.onclick=function(){if(A.user)openSheet('settings');else signIn()};root.querySelector('.tbk').onclick=function(){up()};$.svg=root.querySelector('svg.g');$.zoom=root.querySelector('.zoom');$.gh=$.legend;$.cnt=root.querySelector('.cnt');
  root.querySelector('.srv').textContent='';
  addEventListener('resize',debounce(function(){render(false)},160));
  $.menu.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;var m=b.dataset.m;if(m=='me')return A.user?openSheet('settings'):signIn();openSheet(m)});
  $.gh.querySelector('.seg').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setView(b.dataset.v)});
  $.veil.onclick=closeSheet;
  root.querySelector('.drawer-h').onclick=toggleDrawer;
  $.ctx.addEventListener('click',function(e){if(e.target.closest('.dtg'))toggleDrawer()});
  drawerDrag();
  // v3q: one listener on the checklist, not one per row (survives selection updates)
  $.chk.addEventListener('click',function(e){
    var r=e.target.closest('.row[data-p]');if(!r||r.classList.contains('more'))return;
    var x=find(r.dataset.p);if(!x)return;
    if(innerWidth<=760&&!e.target.closest('.cb')){open(x);return}
    toggleSel(x.path)});
  $.chk.addEventListener('dblclick',function(e){
    var r=e.target.closest('.row[data-p]');if(!r)return;
    var x=find(r.dataset.p);if(x)open(x)});
  $.chk.addEventListener('pointerdown',function(e){var r=e.target.closest('.row[data-p]');var x=r&&find(r.dataset.p);if(x)wf3warm(x)},{passive:true});
  $.chk.addEventListener('mouseover',function(e){
    var r=e.target.closest('.row[data-p]');if(!r||(e.relatedTarget&&r.contains(e.relatedTarget)))return;
    var x=find(r.dataset.p);if(x){hl(x.path,1);wf3warm(x)}});
  $.chk.addEventListener('mouseout',function(e){
    var r=e.target.closest('.row[data-p]');if(!r||(e.relatedTarget&&r.contains(e.relatedTarget)))return;
    var x=find(r.dataset.p);if(x)hl(x.path,0)});
  // v3g mobile: actions live in a small overflow menu, never as big buttons
  $.mo.onclick=function(e){e.stopPropagation();var on=!$.mm.classList.contains('on');$.mm.classList.toggle('on',on);$.mo.setAttribute('aria-expanded',on)};
  document.addEventListener('click',function(e){if(st.pop&&!e.target.closest('.pop,.fa'))popClose()});
  document.addEventListener('click',function(e){if($.mm.classList.contains('on')&&!e.target.closest('.mm,.bb .more')){$.mm.classList.remove('on');$.mo.setAttribute('aria-expanded','false')}if(!e.target.closest('.fm')){[].forEach.call(root.querySelectorAll('.fmm.on'),function(m){m.classList.remove('on');var b=m.parentNode&&m.parentNode.querySelector('button');if(b)b.setAttribute('aria-expanded','false')})}});
  $.np.addEventListener('click',function(e){if(e.target.closest('.dl')){if(st.q[st.qi])download([st.q[st.qi]]);return}var b=e.target.closest('[data-p]');if(!b)return;({prev:prev,next:next,toggle:toggle})[b.dataset.p]()});
  $.np.querySelector('.bar').addEventListener('pointerdown',function(e){var r=this.getBoundingClientRect();if(au.duration)au.currentTime=au.duration*Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));tick()});
  $.lbx.querySelector('.p').onclick=function(){lbStep(-1)};$.lbx.querySelector('.n').onclick=function(){lbStep(1)};$.lbx.querySelector('.x').onclick=lbClose;lbSwipe();
  $.lbx.querySelector('.im').onclick=function(e){if(e.target.tagName!='IMG')lbClose()};
  stageEvents();keys();drops();
  setInterval(pollUps,400);
}
function debounce(f,ms){var t;return function(){clearTimeout(t);t=setTimeout(f,ms)}}
function wallpaper(){}
// v3g: one small, quiet note style everywhere; auto-dismiss after 2 s (errors 4 s)
function toast(html,ms,err){var t=String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();upNote(t,!!err||/circle-alert/.test(html||''))}
// upload finished: a line in the upload panel if it is open, else a tiny status next to the folder actions
function upNote(txt,err){var box=st.sheet=='upload'&&$.sheet.querySelector('.unote'),t=box||$.tbn;clearTimeout(upNote.t);t.className=(box?'unote':'tbn')+(err?' err':'')+' on';t.innerHTML=(err?ic('circle-alert'):ic('check'))+'<span>'+esc(txt)+'</span>';
  upNote.t=setTimeout(function(){t.classList.remove('on')},err?4000:2000)}

/* ---------- navigation ---------- */
/* v3x: remember recent folders in memory so Back (and a return visit)
   paints at once — no fade, no garden-enter stagger, no wait on ?ls.
   A quiet revalidate then patches only if the listing changed.
   Sheets, the image viewer and the mobile drawer push a history entry
   so the first Back closes the overlay, the way a native app would. */
var MEM={},MEMN=24,navStack=[],ovPushed=false;
function memKey(p){return (p||'/')+'\0'+(A.dots&&A.dots()?'1':'0')+'\0'+(A.user||'*')}
function snapScroll(){var lst=$.stage&&$.stage.querySelector('.lst');return {bd:$.bd&&$.bd.scrollTop||0,chk:$.chk&&$.chk.scrollTop||0,lst:lst&&lst.scrollTop||0}}
function applyScroll(sc){if(!sc)return;function put(){if($.bd)$.bd.scrollTop=sc.bd||0;if($.chk)$.chk.scrollTop=sc.chk||0;var lst=$.stage&&$.stage.querySelector('.lst');if(lst)lst.scrollTop=sc.lst||0}put();requestAnimationFrame(put)}
function gardenCap(){return innerWidth<=760?6:20}
function sizeKey(){return innerWidth+'x'+innerHeight+'@'+(innerWidth<=760?'m':'d')+'c'+gardenCap()}
function memSave(){
  if(!st.path||!st.data)return;
  if(st.view=='garden'&&$.zoom)[].forEach.call($.zoom.querySelectorAll('.cell.in'),function(g){g.classList.remove('in')});
  var garden=st.view=='garden'&&$.zoom?{zoom:$.zoom.innerHTML,lbs:$.lbs?$.lbs.innerHTML:'',cells:st.cells,band:st.band,hole2:st.hole2}:null;
  MEM[memKey(st.path)]={t:Date.now(),data:st.data,view:st.view,scroll:snapScroll(),acct:A.user||'*',sk:sizeKey(),gc:gardenCap(),garden:garden};
  var ks=Object.keys(MEM);if(ks.length>MEMN){ks.sort(function(a,b){return MEM[a].t-MEM[b].t});for(var i=0;i<ks.length-MEMN;i++)delete MEM[ks[i]]}
  memPersist();
}
function memPersist(){
  try{
    var k=st.path&&memKey(st.path),e=k&&MEM[k];
    if(!e||!e.data)return;
    var g=e.garden,dump={k:k,path:st.path,t:e.t,data:e.data,view:e.view,scroll:e.scroll,acct:e.acct,sk:e.sk,gc:e.gc!=null?e.gc:gardenCap(),
      garden:g&&{zoom:g.zoom,lbs:g.lbs,band:g.band,hole2:g.hole2,cells:g.cells}};
    localStorage.setItem('nagi_mem',JSON.stringify(dump));
  }catch(err){try{var e2=MEM[memKey(st.path)];if(e2)localStorage.setItem('nagi_mem',JSON.stringify({k:memKey(st.path),path:st.path,t:e2.t,data:e2.data,view:e2.view,scroll:e2.scroll,acct:e2.acct,sk:e2.sk,gc:e2.gc!=null?e2.gc:gardenCap(),garden:e2.garden&&{zoom:e2.garden.zoom,lbs:e2.garden.lbs}}))}catch(e3){}}
}
function memHydrate(){
  try{
    var dump=JSON.parse(localStorage.getItem('nagi_mem')||'null');
    if(!dump||!dump.data||!dump.k)return;
    MEM[dump.k]=dump;
  }catch(e){}
}
function memGet(p){var e=MEM[memKey(p)];return e&&e.data?e:null}
function memClear(){MEM={};wf3clear();try{localStorage.removeItem('nagi_mem')}catch(e){}}
function memInvalidate(path){if(!path){MEM={};return}Object.keys(MEM).forEach(function(k){var p=k.split('\0')[0];if(p===path||p.indexOf(path)===0||path.indexOf(p)===0)delete MEM[k]})}
function listingSig(d){if(!d)return '';var all=d.all||d.items||[],bits=[d.acct||'',String(d.free||''),all.length];for(var i=0;i<all.length;i++){var x=all[i];bits.push(x.path,x.size||0,x.ts||0,x.count!=null?x.count:'',x.dom||'')}return bits.join('\t')}
function sameFolder(a,b){return (a||'/').replace(/\/$/,'')===(b||'/').replace(/\/$/,'')}
function drawerIsOv(){return innerWidth<=760&&$.ctx&&$.ctx.classList.contains('open')}
function pushOv(kind){if(ovPushed){try{history.replaceState({nagiOv:kind,path:st.path},'')}catch(e){}return}try{history.pushState({nagiOv:kind,path:st.path},'')}catch(e){}ovPushed=true}
function popOv(){if(!ovPushed)return;ovPushed=false;st._skipPop=true;try{history.back()}catch(e){}setTimeout(function(){st._skipPop=false},500)}
function toggleDrawer(){var c=$.ctx;c.style.transition='';c.style.transform='';c.style.willChange='';c.classList.remove('drag','peek');var on=!c.classList.contains('open');c.classList.toggle('open',on);if(innerWidth<=760){if(on)pushOv('drawer');else popOv()}}
function paintFolder(path,d,opt){
  opt=opt||{};st.path=path;st.data=d;st.sel=opt.sel||[];
  $.zoom.style.transition='none';$.zoom.style.transform='';$.zoom.style.opacity='';
  if(window.NagiKoi)NagiKoi.reset();$.lbs.style.opacity='';
  try{void $.zoom.getBoundingClientRect()}catch(e){}$.zoom.style.transition='';
  render(!!opt.anim);
  if(opt.closeDrawer!==false&&$.ctx)$.ctx.classList.remove('open');
  if(opt.scroll)applyScroll(opt.scroll);
  try{performance.mark('nagi-go-paint')}catch(e){}}
function restoreFolder(path,cached){
  st.path=path;st.data=cached.data;st.sel=[];
  $.zoom.style.transition='none';$.zoom.style.transform='';$.zoom.style.opacity='';
  if(window.NagiKoi)NagiKoi.reset();$.lbs.style.opacity='';
  try{void $.zoom.getBoundingClientRect()}catch(e){}$.zoom.style.transition='';
  var g=cached.garden;
  if(g&&g.zoom&&cached.view==='garden'&&st.view==='garden'&&cached.sk===sizeKey()&&cached.gc===gardenCap()){
    if(!st.data.all)st.data.all=st.data.items;
    [].forEach.call($.gh.querySelectorAll('.seg button'),function(b){b.classList.toggle('on',b.dataset.v==st.view)});
    var nd=st.data.items.filter(function(x){return x.isDir}).length,nf=st.data.items.length-nd;$.cnt.textContent=pl(nd,'folder')+' · '+(nf==1?'1 file':nf+' files');
    $.tav.innerHTML=A.user?'<b>'+esc(A.user.charAt(0).toUpperCase())+'</b>':ic('user');$.tav.classList.toggle('in',!!A.user);$.tav.setAttribute('aria-label',A.user?'Account: signed in as '+A.user:'Sign in');
    var me=root.querySelector('.menu .me');if(me){me.innerHTML=A.user?'<b>'+esc(A.user.charAt(0).toUpperCase())+'</b><span>'+esc(A.user)+'</span>':'<b class="g">'+ic('user')+'</b><span>Sign in</span>';me.classList.toggle('in',!!A.user)}
    root.classList.toggle('vlist',false);
    var old=$.stage.querySelector('.lst');if(old)old.remove();$.svg.style.display='';$.lbs.style.display='';
    $.zoom.innerHTML=g.zoom.replace(/(\s)in\b/g,'');$.lbs.innerHTML=g.lbs;st.cells=g.cells||[];st.band=g.band;st.hole2=g.hole2;
    [].forEach.call($.zoom.querySelectorAll('.cell.in'),function(g){g.classList.remove('in')});
    renderCtx();pondUp(st.cells);paintSel();bindThumbs($.zoom,{root:$.gd});
    if($.ctx)$.ctx.classList.remove('open');
    applyScroll(cached.scroll);
    try{performance.mark('nagi-go-paint')}catch(e){}
    return;
  }
  render(false);
  if($.ctx)$.ctx.classList.remove('open');
  if(cached.scroll)applyScroll(cached.scroll);
  try{performance.mark('nagi-go-paint')}catch(e){}}
function revalidate(path){load(path,function(d){if(st.path!==path)return;if(listingSig(d)===listingSig(st.data)){var e=memGet(path);if(e)e.t=Date.now();return}var sc=snapScroll();st.data=d;render(false);applyScroll(sc);memSave()},true)}
function go(path,push,how){
  if(path==st.path&&st.data){return}
  thFlush();thDrop($.zoom);thDrop($.chk);var _lst=$.stage&&$.stage.querySelector('.lst');thDrop(_lst);
  memSave();
  if(st.lb)lbClose(true);if(st.sheet)closeSheet(true);
  st.sel=[];
  if(push!==false){
    if(st.path)navStack.push(st.path);
    if(ovPushed){ovPushed=false;try{history.replaceState({nagi:1,from:st.path,path:path},'',path)}catch(e){if(A.go)A.go(path)}}
    else if(A.go)A.go(path);
  }else if(how==='back'&&navStack.length)navStack.pop();
  var cached=memGet(path);
  if(cached){restoreFolder(path,cached);revalidate(path);return}
  var out=how!=='back'&&!RM&&st.view=='garden'&&st.cells?st.cells.filter(function(c){return c.item.path==path})[0]:null;
  var anim=!!out;
  if(anim)zoomInto(out);
  else if(st.data){$.zoom.style.opacity='.0';$.lbs.style.opacity='0';if(window.NagiKoi)NagiKoi.follow('',0)}
  var t0=Date.now();
  load(path,function(d){
    if(how==='back'){paintFolder(path,d,{anim:false});return}
    var wait=anim?Math.max(0,460-(Date.now()-t0)):0;
    setTimeout(function(){paintFolder(path,d,{anim:true})},wait);
  });
}
function zoomInto(c){var bb=G.bbox(c.poly),W=$.stage.clientWidth,H=$.stage.clientHeight,s=Math.min(W/(bb[2]-bb[0]),H/(bb[3]-bb[1]));
  var tx=(W-(bb[2]-bb[0])*s)/2-bb[0]*s,ty=(H-(bb[3]-bb[1])*s)/2-bb[1]*s;
  $.zoom.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';$.lbs.style.opacity='0';if(window.NagiKoi)NagiKoi.follow($.zoom.style.transform,0);
  [].forEach.call($.zoom.querySelectorAll('.cell'),function(g){if(g.dataset.i!=c.idx)g.style.opacity='0'})}
function up(){if(st.path=='/'||!st.path)return;var par=dirname(st.path.replace(/\/$/,''))||'/';if(navStack.length&&sameFolder(navStack[navStack.length-1],par)){history.back();return}go(par)}

/* ---------- context column ---------- */
function selItems(){return st.data?st.data.items.filter(function(x){return st.sel.indexOf(x.path)>=0}):[]}
function kindOf(list){var t={};list.forEach(function(x){t[x.isDir?'folder':x.type]=1});var k=Object.keys(t);return k.length==1?k[0]:'mixed'}
// v3m: keep the summary line's height and width stable; crossfade the figure and the note (no movement)
function paintNum(h,note,items){var n=$.num;
  if(!n.querySelector('.nv')){
    n.innerHTML='<span class="nv"><span class="nva on"><span class="big">'+esc(h[0])+'</span><small>'+esc(h[1])+'</small></span><span class="nvb"><span class="big"></span><small></small></span></span><span class="note"><span class="na on"></span><span class="nb"></span></span><button class="dtg" aria-label="Show or hide the list"><span class="dlb"></span>'+ic('chevron-up')+'</button>';
    n.querySelector('.na').textContent=note;n.querySelector('.dlb').textContent=items;n.dataset.face='a';reserveNum(n);return}
  var face=n.dataset.face||'a',next=face==='a'?'b':'a',
      curN=n.querySelector('.nv'+face),nxtN=n.querySelector('.nv'+next),
      curT=n.querySelector('.n'+face),nxtT=n.querySelector('.n'+next);
  n.querySelector('.dlb').textContent=items;
  var sameN=curN.querySelector('.big').textContent===h[0]&&curN.querySelector('small').textContent===h[1],
      sameT=curT.textContent===note;
  if(sameN&&sameT){reserveNum(n);return}
  nxtN.querySelector('.big').textContent=h[0];nxtN.querySelector('small').textContent=h[1];nxtT.textContent=note;
  if(RM){curN.classList.remove('on');curT.classList.remove('on');nxtN.classList.add('on');nxtT.classList.add('on');n.dataset.face=next;reserveNum(n);return}
  nxtN.classList.remove('on');nxtT.classList.remove('on');void n.offsetWidth;
  curN.classList.remove('on');curT.classList.remove('on');nxtN.classList.add('on');nxtT.classList.add('on');n.dataset.face=next;reserveNum(n)}
function reserveNum(n){n=n||$.num;var nv=n.querySelector('.nv');if(!nv)return;var a=n.querySelector('.nva'),b=n.querySelector('.nvb'),w=Math.max(a.scrollWidth,b.scrollWidth);
  if(w)nv.style.minWidth=w+'px'}

function renderCtx(){
  var d=st.data,p=st.path,segs=p.split('/').filter(Boolean),acc='/',cr='<a data-go="/">'+esc(A.rootName||'Everything')+'</a>';
  segs.forEach(function(s){acc+=s+'/';cr+='<span class="s">/</span><a data-go="'+esc(acc)+'">'+esc(decodeURIComponent(s))+'</a>'});
  $.crumb.innerHTML=cr;root.classList.toggle('sub',p!='/');$.tbt.textContent=p=='/'?'':title(p);
  [].forEach.call($.crumb.querySelectorAll('a'),function(a){a.onclick=function(){go(a.dataset.go)}});
  var sel=selItems(),total=d.items.reduce(function(a,x){return a+(x.size||0)},0),nd=d.items.filter(function(x){return x.isDir}).length,nf=d.items.length-nd;
  var big=sel.length?sel.reduce(function(a,x){return a+(x.size||0)},0):total,h=hs(big);
  var note=sel.length?'selected of '+fs(total)+' here':p=='/'&&d.free!=null?'used · '+fs(d.free)+' free':'in '+esc(title(p));
  var items=d.items.length?d.items.length+(d.items.length==1?' item':' items'):'empty';
  paintNum(h,note,items);
  var selSz=sel.reduce(function(a,x){return a+(x.size||0)},0);
  $.chh.innerHTML=d.items.length?'<span class="h1"><b>●</b>Largest first</span><span class="h2">'+(sel.length?sel.length+' selected · '+fs(selSz):fs(total))+'</span>'+(d.items.length?'<a class="sa">'+(sel.length==d.items.length?'Clear':'Select all')+'</a>':''):'';
  var sa=$.chh.querySelector('.sa');if(sa)sa.onclick=function(){st.sel=sel.length==d.items.length?[]:d.items.map(function(x){return x.path});refresh()};
  var name=title(p),say,para,k=kindOf(d.items.filter(function(x){return !x.isDir}));
  function countPhrase(){var bits=[];if(nd){var dk=d.items.filter(function(x){return x.isDir}).map(function(x){return x.dom});var allAu=dk.every(function(t){return t=='audio'});bits.push(nd+' '+(allAu?(nd==1?'album':'albums'):(nd==1?'folder':'folders')))}
    if(nf)bits.push(k!='mixed'?pl(nf,k):nf+(nf==1?' file':' files'));return bits.join(' and ')||'nothing yet'}
  if(sel.length){var sk=kindOf(sel);say=(sk=='mixed'?sel.length+' items':pl(sel.length,sk))+' selected, <em>'+fs(big)+'</em>.';
    para=esc(sel.slice(0,3).map(function(x){return x.name}).join(', '))+(sel.length>3?' and '+(sel.length-3)+' more.':'.')+' Press Esc to clear.'}
  else if(p=='/'){say='Everything here comes to '+fs(total)+' across '+countPhrase()+'.';
    para=(d.free!=null?fs(d.free)+' of '+fs(d.total)+' is still free on this drive, the open field of contour lines. ':'')+'Click a stone to step inside it.'}
  else{say=esc(name)+' holds '+fs(total)+' across '+countPhrase()+'.';var newest=d.items.reduce(function(a,x){return Math.max(a,x.ts||0)},0),secs=d.items.reduce(function(a,x){return a+((x.tags&&x.tags['.dur'])||0)},0);
    para='Last changed '+rel(newest)+'.'+(secs>0?' About '+(secs>=3600?(secs/3600).toFixed(1)+' hours':Math.max(1,Math.round(secs/60))+' minutes')+' of listening.':'')+(nd?' Click a folder to open it; click files to select them.':' Click to select, double-click to open.')}
  if(st.age&&!sel.length)para+=' Darker stones changed more recently.';
  // v3c: no summary sentence or paragraph; the numeral, its note and the checklist carry it
  $.say.innerHTML='';$.para.innerHTML='';
  if(p=='/'&&d.total){$.meter.style.display='';$.meter.firstChild.style.width=(100*(d.total-d.free)/d.total).toFixed(1)+'%'}else $.meter.style.display='none';
  // checklist
  var rows=grouped(d.items,function(a,b){return (b.size||0)-(a.size||0)}),html='',gs={},ng=0;rows.forEach(function(x){if(!gs[grp(x)]){gs[grp(x)]=0;ng++}gs[grp(x)]++});var lastG=null;
  rows.forEach(function(x){var gx=grp(x);if(ng>1&&gx!==lastG){html+='<div class="grp" data-g="'+gx+'"><span>'+GLAB[gx]+'</span><i>'+gs[gx]+'</i></div>'}lastG=gx;var on=st.sel.indexOf(x.path)>=0,t=x.isDir?(x.dom&&x.dom!='empty'?x.dom:'folder'):x.type,playing=st.q[st.qi]&&st.q[st.qi].path==x.path;
    html+='<div class="row'+(on?' sel':'')+(playing?' play':'')+'" role="option" aria-selected="'+on+'" data-p="'+esc(x.path)+'"><span class="cb">'+ic('check')+'</span>'+rowIc(x)+'<span class="nm">'+esc(x.name)+(x.isDir&&x.count!=null?'<i>'+x.count+'</i>':'')+'</span><span class="sz">'+fs(x.size)+'</span></div>'});
  if(!rows.length)html='<div class="row more"><span>This folder is empty. Drop files anywhere to fill it.</span></div>';
  $.chk.innerHTML=html;
  bindThumbs($.chk);renderActs(sel);fitCtx();
}
// fit the checklist to the room left above a pebble band: whole rows only, never an inner scroll
function fitCtx(){var c=$.ctx;c.classList.remove('tight','tighter');var old=$.chk.querySelector('.row.rest');if(old)old.remove();
  var rows=[].slice.call($.chk.querySelectorAll('.row[data-p]'));rows.forEach(function(r){r.style.display=''});
  if(innerWidth<=760||!rows.length)return;
  var bdH=c.parentNode.clientHeight,band=Math.max(170,Math.min(300,bdH*.31)),limit=bdH-band-c.offsetTop;
  if(c.offsetHeight>limit)c.classList.add('tight');
  var gl=[].slice.call($.chk.querySelectorAll('.grp'));gl.forEach(function(g){g.style.display=''});
  var rh=rows[0].offsetHeight||37,over=c.offsetHeight-limit;
  if(over>0){var hide=Math.max(0,Math.min(rows.length-2,Math.ceil(over/rh)-1)),m=el('<div class="row more rest"><span></span><a>Show all</a></div>');m.querySelector('a').onclick=function(){setView('list')};$.chk.appendChild(m);
    var apply=function(){rows.forEach(function(r,i){r.style.display=i>=rows.length-hide?'none':''});gl.forEach(function(g){var n=g.nextElementSibling;g.style.display=n&&n.style.display=='none'?'none':''});m.firstChild.textContent='and '+hide+' more'};
    apply();while(c.offsetHeight>limit&&rows.length-hide>2){hide++;apply()}if(!hide)m.remove()}
  if(c.offsetHeight>limit)c.classList.add('tighter')}
function find(p){return st.data.items.filter(function(x){return x.path==p})[0]}
function btn(label,cls,fn,icn){var b=el('<button class="btn '+(cls||'')+'">'+(icn?ic(icn):'')+esc(label)+'</button>');b.onclick=fn;return b}
// actions live in the top bar (quiet, with key hints); the mobile drawer gets the same list as buttons.
// Keys avoid copyparty's own hotkeys (A B C D E F G I J K L M O P R S T U V X Y, digits): shift+letter.
var KEYS={U:'⇧U',S:'⇧S',N:'⇧N',P:'⇧P',M:'⇧M',C:'⇧C',V:'⇧V',X:'⇧X'};
function actList(sel){var L=[],can=A.perms(),k=kindOf(sel);
  if(!sel.length){
    if(can.write)L.push({t:'Upload',i:'upload',k:'U',f:function(){openSheet('upload')},main:1});
    L.push({t:'Download all',i:'download',k:'S',f:confirmAll});
    if(can.write)L.push({t:'New folder',i:'plus',k:'N',f:newFolder});
    if(st.clip&&st.clip.items&&st.clip.items.length&&(st.clip.mode=='copy'?can.write:can.move&&can.write))
      L.push({t:(st.clip.mode=='copy'?'Paste':'Move')+' '+st.clip.items.length+(st.clip.items.length==1?' item':' items')+' here',i:st.clip.mode=='copy'?'clipboard-paste':'folder',k:'V',f:function(){doPaste(st.path)}});
    var au=st.data.items.filter(function(x){return x.type=='audio'});
    if(au.length>1)L.push({t:'Play all '+au.length,i:'play',k:'P',f:function(){playList(au,0)}});
    if(A.canShare())L.push({t:'Share folder',i:'link',f:function(){openSheet('share',[st.path])}});
    if(A.user&&can.write&&A.ups)L.push({t:'Undo upload',i:'undo-2',more:1,f:function(){openSheet('unpost')}});
    if(A.user&&A.dupes)L.push({t:'Duplicates',i:'files',more:1,f:function(){openSheet('dupes')}});
    return L}
  var one=sel.length==1?sel[0]:null;
  if(k=='audio')L.push({t:one?'Play':'Play '+sel.length,i:'play',k:'P',f:function(){playList(sel,0)},main:1});
  else if(k=='image')L.push({t:one?'View':'View '+sel.length,i:'eye',f:function(){lbOpen(sel,0)},main:1});
  else if(one&&one.isDir)L.push({t:'Open',i:'folder-open',f:function(){go(one.path)},main:1});
  else if(one&&(one.type=='video'||one.type=='doc'||one.type=='code'))L.push({t:one.type=='video'?'Watch':'Read',i:one.type=='video'?'play':'file-text',f:function(){open(one)},main:1});
  if(can.move)L.push({t:'Move to…',i:'folder',k:'X',f:function(){openSheet('move',{mode:'move',items:sel})}});
  L.push({t:'Copy to…',i:'copy',k:'C',f:function(){openSheet('move',{mode:'copy',items:sel})}});
  L.push({t:one&&!one.isDir?'Download':'Download '+sel.length,i:'download',k:'S',f:function(){download(sel)}});
  if(A.canShare())L.push({t:'Share',i:'link',f:function(){openSheet('share',sel.map(function(x){return x.path}))}});
  if(one&&can.move)L.push({t:'Rename',i:'pencil',f:function(){rename(one)}});
  if(can.del)L.push({t:'Delete',i:'trash-2',f:function(){del(sel)},danger:1});
  L.push({t:'Clear',i:'x',kh:'Esc',f:function(){st.sel=[];refresh()}});
  return L}
function renderActs(sel){var a=$.acts,b=$.acts2,fa=$.fa;a.innerHTML='';b.innerHTML='';fa.innerHTML='';var L=actList(sel);st.akeys={};
  $.mm.innerHTML='';$.mo.classList.toggle('dot',!!sel.length);$.msel.innerHTML=sel.length?'<b>'+sel.length+'</b> selected<button class="ib sm" aria-label="Clear selection">'+ic('x')+'</button>':'';$.msel.classList.toggle('on',!!sel.length);
  var mx=$.msel.querySelector('button');if(mx)mx.onclick=function(){st.sel=[];refresh()};
  // v3h mobile: a bottom bar with big targets; whatever does not fit goes into "More" (opens upwards)
  var can=A.perms(),tabs=[],rest=[],T=function(t,i,f,c){return {t:t,i:i,f:f,cls:c||''}};
  if(!sel.length){tabs.push(T('Search','search',function(){openSheet('search')}));if(can.write)tabs.push(T('Upload','upload',function(){openSheet('upload')}));tabs.push(T('Settings','settings-2',function(){openSheet('settings')}));
    L.forEach(function(o){if(o.i!='upload')rest.push(o)})}
  else{tabs.push(T('Clear','x',function(){st.sel=[];refresh()},'clr'));var acts=L.filter(function(o){return o.i!='x'});tabs=tabs.concat(acts.slice(0,acts.length>4?2:3).map(function(o){return T(o.t.replace(/^Download \d+$/,'Download').replace(/^Move to…$/,'Move').replace(/^Copy to…$/,'Copy'),o.i,o.f,o.danger?'danger':'')}));rest=acts.slice(acts.length>4?2:3)}
  $.bb.innerHTML='';$.bb.classList.toggle('selm',!!sel.length);
  tabs.forEach(function(o){var b=el('<button class="bt '+o.cls+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span>'+(o.cls=='clr'?'<b>'+sel.length+'</b>':'')+'</button>');b.onclick=function(){$.mm.classList.remove('on');o.f()};$.bb.appendChild(b)});
  if(!sel.length||rest.length){var mb=el('<button class="bt more" aria-haspopup="menu" aria-expanded="false">'+ic('ellipsis')+'<span>More</span></button>');mb.onclick=function(e){e.stopPropagation();var on=!$.mm.classList.contains('on');$.mm.classList.toggle('on',on);mb.setAttribute('aria-expanded',on)};$.bb.appendChild(mb)}
  if(!sel.length&&A.loginUrl){var ac=el(A.user?'<div class="acct"><div class="who"><b>'+esc(A.user.charAt(0).toUpperCase())+'</b><span>Signed in as <em>'+esc(A.user)+'</em></span></div><button role="menuitem" class="so">'+ic('log-out')+'<span>Sign out</span></button></div>':'<div class="acct"><button role="menuitem" class="si">'+ic('log-in')+'<span><b>Sign in</b><small>to upload and see your folders</small></span>'+ic('chevron-right')+'</button></div>');
    var sb=ac.querySelector('button');sb.onclick=function(){$.mm.classList.remove('on');A.user?signOut():signIn()};$.mm.appendChild(ac)}
  rest.forEach(function(o){if(o.i=='x')return;var m=el('<button role="menuitem" class="'+(o.danger?'danger':'')+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span></button>');m.onclick=function(){$.mm.classList.remove('on');o.f()};$.mm.appendChild(m)});
  fa.classList.toggle('selm',!!sel.length);
  if(sel.length)fa.appendChild(el('<span class="fn">'+sel.length+' selected</span>'));
  var quiet=[];
  L.forEach(function(o,n){if(o.k)st.akeys[o.k]=o.f;if(o.more){quiet.push(o);return}var h=o.k?KEYS[o.k]:o.kh;
    var t=el('<button class="fb'+(o.danger?' danger':'')+'" title="'+esc(o.t)+(h?' ('+h+')':'')+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span>'+(h?'<kbd>'+h+'</kbd>':'')+'</button>');t.onclick=o.f;fa.appendChild(t);
    // mobile drawer: first two as buttons, the rest quiet (second row when open)
    var tgt=n<3||!sel.length?a:b;if(!sel.length&&n>2)return;
    tgt.appendChild(btn(o.t,o.danger?'danger':n==0?'fill':n==1?'':'quiet',o.f))});
  if(quiet.length){var wrap=el('<div class="fm"><button class="fb" aria-haspopup="menu" aria-expanded="false" title="More">'+ic('ellipsis')+'<span>More</span></button><div class="fmm" role="menu"></div></div>');
    var mb=wrap.querySelector('button'),menu=wrap.querySelector('.fmm');
    quiet.forEach(function(o){var m=el('<button role="menuitem" class="'+(o.danger?'danger':'')+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span></button>');m.onclick=function(){menu.classList.remove('on');mb.setAttribute('aria-expanded','false');o.f()};menu.appendChild(m)});
    mb.onclick=function(e){e.stopPropagation();var on=!menu.classList.contains('on');menu.classList.toggle('on',on);mb.setAttribute('aria-expanded',on)};
    fa.appendChild(wrap)}}
// v3g: "Download all" asks first (it is easy to misclick): a small popover under the button, a sheet on phones
// v3k: the phone drawer follows the finger (handle + header; the list only when scrolled to the top), snaps by distance or flick
function drawerDrag(){var c=$.ctx,H=c.querySelector('.drawer-h'),d=null,eat=false,tm=0;
  function mob(){return innerWidth<=760&&getComputedStyle(H).display!='none'}
  function rub(x){return 46*(1-Math.exp(-x/110))}
  function lims(){var s=getComputedStyle(root),ch=parseFloat(s.getPropertyValue('--dh'))||112,bbh=parseFloat(s.getPropertyValue('--bbh'))||57;
    var oh=Math.max(innerHeight-bbh-24,ch+40);return {o:c.classList.contains('open'),ch:ch,oh:oh,max:Math.max(40,oh-ch)}}
  function tyNow(L){var tr=c.style.transform,m=/translate3d\(0,\s*([-\d.]+)px/.exec(tr)||/translateY\(([-\d.]+)px/.exec(tr);
    if(m)return parseFloat(m[1]);return L.o?0:L.max}
  function apply(y,L){c.style.transform='translate3d(0,'+y+'px,0)';var openish=y<L.max-8;c.classList.toggle('peek',openish);c.classList.toggle('open',openish||L.o)}
  function start(y){if(!mob())return false;clearTimeout(tm);var L=lims();d={y0:y,ty0:tyNow(L),ys:[[y,Date.now()]],L:L,moved:false,ty:tyNow(L)};
    c.classList.add('drag');c.style.willChange='transform';c.style.transition='none';return true}
  function move(y){if(!d)return;var dy=d.y0-y;if(!d.moved){if(Math.abs(dy)<6)return;d.moved=true}
    var L=d.L,ty=d.ty0-dy;if(ty<0)ty=-rub(-ty);else if(ty>L.max)ty=L.max+rub(ty-L.max);
    d.ty=ty;apply(ty,L);d.ys.push([y,Date.now()]);if(d.ys.length>6)d.ys.shift()}
  function end(cancel){if(!d)return;var D=d;d=null;if(!D.moved){c.classList.remove('drag');c.style.willChange='';return}eat=true;setTimeout(function(){eat=false},350);
    var L=D.L,z=D.ys[D.ys.length-1],a=D.ys.filter(function(q){return z[1]-q[1]<=90})[0]||D.ys[0],v=z[1]-a[1]>0?(a[0]-z[0])/(z[1]-a[1]):0,p=1-D.ty/L.max,op;
    if(cancel)op=L.o;else if(Math.abs(v)>.35)op=v>0;else op=L.o?p>.28:p>=.3;
    c.classList.remove('drag');
    if(innerWidth<=760&&op!==L.o){if(op)pushOv('drawer');else popOv()}
    var fin=function(){c.style.transition='';c.style.transform='';c.style.willChange='';c.classList.remove('peek');c.classList.toggle('open',op)};
    if(RM){fin();return}
    c.style.transition='transform .32s cubic-bezier(.2,.8,.2,1)';c.style.transform='translate3d(0,'+(op?0:L.max)+'px,0)';c.classList.toggle('open',op);c.classList.remove('peek');
    tm=setTimeout(fin,340)}
  c.addEventListener('pointerdown',function(e){if(!e.isPrimary||e.button>0||!e.target.closest('.drawer-h,.crumb,.num,.say')||e.target.closest('.np'))return;
    if(start(e.clientY)){d.pid=e.pointerId;try{c.setPointerCapture(e.pointerId)}catch(_){}}});
  c.addEventListener('pointermove',function(e){if(d&&d.pid===e.pointerId)move(e.clientY)});
  c.addEventListener('pointerup',function(e){if(d&&d.pid===e.pointerId)end(false)});
  c.addEventListener('pointercancel',function(e){if(d&&d.pid===e.pointerId)end(true)});
  var ts=null;function scl(t){for(var n=t;n&&n!==c;n=n.parentNode)if(n.scrollTop>0)return true;return c.scrollTop>0}
  c.addEventListener('touchstart',function(e){ts=null;if(e.touches.length!=1||!c.classList.contains('open')||e.target.closest('.drawer-h,.crumb,.num,.say,.np,input'))return;if(scl(e.target))return;ts={y:e.touches[0].clientY,x:e.touches[0].clientX}},{passive:true});
  c.addEventListener('touchmove',function(e){if(e.touches.length!=1){if(d&&d.pid==='t')end(true);ts=null;return}var t=e.touches[0];
    if(ts&&!d){var dy=t.clientY-ts.y,dx=Math.abs(t.clientX-ts.x);if(dy>8&&dy>dx){if(start(ts.y)){d.pid='t';move(t.clientY)}ts=null}else if(dy<-4||dx>10)ts=null}
    if(d&&d.pid==='t'){e.preventDefault();move(t.clientY)}},{passive:false});
  c.addEventListener('touchend',function(){ts=null;if(d&&d.pid==='t')end(false)});
  c.addEventListener('touchcancel',function(){ts=null;if(d&&d.pid==='t')end(true)});
  c.addEventListener('click',function(e){if(eat){eat=false;e.preventDefault();e.stopPropagation()}},true);
  addEventListener('resize',function(){if(!mob()){c.style.transform='';c.classList.remove('drag','peek')}});
}

// v3l: Safari/iOS (every iPhone browser is WebKit) can't open MKV/AVI/WMV/FLV/... at all; say so instead of showing a dead player
var NOSAF=/^(mkv|avi|wmv|flv|mpg|mpeg|vob|ogv|ogm|3gp|ts|m2ts|mts|rm|rmvb|asf|divx|xvid)$/;
function APPLE_WK(){var u=navigator.userAgent;return /iP(hone|ad|od)/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)||(/Safari/.test(u)&&!/Chrome|Chromium|Edg|OPR|Firefox|Android/.test(u))}
function vno(ext,apple,x,codec){return '<div class="vno">'+ic('film')+'<b>'+(apple?(codec?'Safari can\u2019t play this video':'Safari can\u2019t play this format'):'This browser can\u2019t play this video')+'</b>'+
  '<p>'+(codec||!apple?'This file\u2019s video or audio codec isn\u2019t supported here. Download it and open it in a video app like VLC or Infuse.':'<span class="ext">.'+esc(ext)+'</span> videos need an app like VLC or Infuse on iPhone. MP4 or MOV (H.264 / HEVC with AAC audio) plays here.')+'</p>'+
  '<button class="btn fill vdl">'+ic('download')+'Download'+(x&&x.size?' · '+fs(x.size):'')+'</button></div>'}
function confirmAll(){var d=st.data;if(!d)return;var nd=d.items.filter(function(x){return x.isDir}).length,nf=d.items.length-nd,tot=d.items.reduce(function(a,x){return a+(x.size||0)},0);
  var bits=[];if(nd)bits.push(nd+(nd==1?' folder':' folders'));if(nf)bits.push(nf+(nf==1?' file':' files'));
  var what=(bits.join(', ')||'nothing yet')+' · '+fs(tot)+' as a .zip',name=esc(title(st.path)),go=function(){A.zip(st.path,null)};
  var anchor=[].filter.call($.fa.querySelectorAll('.fb'),function(b){return /^Download all/.test(b.title)})[0];
  if(innerWidth<=760||!anchor||!anchor.offsetParent){ask('Download all of '+name+'?',what,'Download',false,null).then(function(ok){if(ok)go()});return}
  popClose();var p=el('<div class="pop" role="dialog" aria-modal="true" aria-labelledby="popt"><p id="popt"><b>Download all of '+name+'?</b><span>'+esc(what)+'</span></p><div class="pa"><button class="btn fill sm ok">Download</button><button class="btn quiet sm no">Cancel</button><span class="ph"><kbd>↵</kbd><kbd>Esc</kbd></span></div></div>');
  root.appendChild(p);var r=anchor.getBoundingClientRect(),rr=root.getBoundingClientRect();p.style.left=Math.max(12,Math.min(r.left-rr.left-8,rr.width-p.offsetWidth-12))+'px';p.style.top=(r.bottom-rr.top+8)+'px';
  st.pop={el:p,ok:function(){popClose();go()},back:anchor};p.querySelector('.ok').onclick=st.pop.ok;p.querySelector('.no').onclick=popClose;
  requestAnimationFrame(function(){p.classList.add('on')});p.querySelector('.ok').focus()}
function popClose(){if(!st.pop)return;var p=st.pop.el,b=st.pop.back;st.pop=null;p.classList.remove('on');setTimeout(function(){p.remove()},200);if(b&&b.focus)b.focus()}
function toggleSel(p,only){var i=st.sel.indexOf(p);if(only){st.sel=i>=0&&st.sel.length==1?[]:[p]}else if(i>=0)st.sel.splice(i,1);else st.sel.push(p);refresh()}
function refresh(){
  if(!st.data)return;
  var d=st.data,p=st.path,sel=selItems(),total=d.items.reduce(function(a,x){return a+(x.size||0)},0);
  var big=sel.length?sel.reduce(function(a,x){return a+(x.size||0)},0):total;
  var note=sel.length?'selected of '+fs(total)+' here':p=='/'&&d.free!=null?'used · '+fs(d.free)+' free':'in '+esc(title(p));
  var items=d.items.length?d.items.length+(d.items.length==1?' item':' items'):'empty';
  paintNum(hs(big),note,items);
  var selSz=sel.reduce(function(a,x){return a+(x.size||0)},0);
  $.chh.innerHTML=d.items.length?'<span class="h1"><b>●</b>Largest first</span><span class="h2">'+(sel.length?sel.length+' selected · '+fs(selSz):fs(total))+'</span>'+(d.items.length?'<a class="sa">'+(sel.length==d.items.length?'Clear':'Select all')+'</a>':''):'';
  var sa=$.chh.querySelector('.sa');if(sa)sa.onclick=function(){st.sel=sel.length==d.items.length?[]:d.items.map(function(x){return x.path});refresh()};
  var playing=st.q[st.qi]&&st.q[st.qi].path;
  [].forEach.call($.chk.querySelectorAll('.row[data-p]'),function(r){
    var on=st.sel.indexOf(r.dataset.p)>=0;
    r.classList.toggle('sel',on);
    r.classList.toggle('play',playing===r.dataset.p);
    r.setAttribute('aria-selected',on?'true':'false')});
  renderActs(sel);paintSel();
}
function dlUrl(x){var u=A.url(x);if(!u||u==='#'||/^(data:|blob:)/.test(u)||/[?&]dl(=|&|$)/.test(u))return u;return u+(u.indexOf('?')>=0?'&':'?')+'dl'}
function download(sel){if(sel.length==1&&!sel[0].isDir){var a=document.createElement('a');a.href=dlUrl(sel[0]);a.download=sel[0].name;document.body.appendChild(a);a.click();a.remove();return}
  if(sel.length==1)return A.zip(sel[0].path,null);A.zip(st.path,sel.map(function(x){return x.name}))}

/* ---------- garden ---------- */
// three stone tones, like Kanso: 1 charcoal, 2 mid, 3 light
var TONE={audio:1,video:1,image:2,code:2,archive:2,folder:2,doc:3,other:3,empty:3};
function toneOf(x){if(!x)return 3;if(st.age&&st.age[x.path])return st.age[x.path];if(x.isDir)return x.dom=='empty'?3:1;return TONE[x.type]||3}
// a folder of one kind of thing: stones weather with age (newest darkest), so the field still reads
function ageTones(list){st.age=null;var k={};list.forEach(function(x){k[x.isDir?(x.dom=='empty'?3:1):(TONE[x.type]||3)]=1});if(Object.keys(k).length>1||list.length<3)return;
  var srt=list.slice().sort(function(a,b){return (b.ts||0)-(a.ts||0)}),n=srt.length;st.age={};srt.forEach(function(x,i){st.age[x.path]=i<n/3?1:i<2*n/3?2:3})}
function moreWeight(stones,floor){
  /* Desktop: a quiet corner stone, same modest share as v3z2.
     Mobile: the +N cell should come out 3rd-largest — smaller than the
     two biggest stones, at least as large as the rest. Take the midpoint
     of the 2nd and 3rd stone weights (not a fixed %). A later area
     nudge in render() confirms the rank from the final tessellation. */
  if(innerWidth>760){var s=stones.reduce(function(a,o){return a+o.weight},0);return Math.max(s*.055,floor*5)}
  var ws=stones.filter(function(o){return !o.free&&!o.up&&!o.more}).map(function(o){return o.weight}).sort(function(a,b){return b-a});
  if(!ws.length)return floor*5;
  var hi=ws.length>1?ws[1]:ws[0],lo=ws.length>2?ws[2]:hi*.85,mw=(hi+lo)/2;
  if(hi-lo>1e-6){if(mw>=hi)mw=hi-(hi-lo)*.4;if(mw<lo)mw=lo}
  else mw=lo;
  return mw}
function items(){var d=st.data,list=d.items.slice(),out=[],sum=0,mx=0,cap=gardenCap();
  /* v3x / v4.1.4: at most 6 cells on a narrow screen (5 stones + "+N"
     when the folder overflows; 6 or fewer items show them all, no "+N"),
     20 on a wider one. Keep the heaviest items (same size-weight as the
     garden already used; folders first on a tie). v3z: when anything is
     hidden, a "+N" sand-ring cell is pinned in the bottom-right. */
  list.sort(function(a,b){var wa=Math.pow((a.size||0)+1,.62),wb=Math.pow((b.size||0)+1,.62);return (wb-wa)||((b.isDir?1:0)-(a.isDir?1:0))||(a.name||'').localeCompare(b.name||'')});
  var rest=0;if(list.length>cap){rest=list.length-(cap-1);list=list.slice(0,cap-1)}
  list.forEach(function(x){var w=Math.pow((x.size||0)+1,.62);mx=Math.max(mx,w);out.push({key:x.path,weight:w,x:x});sum+=w});
  /* v3z2: +N is a genuine cell in the tessellation, pinned to the
     bottom-right so neighbours curve around it with the same gutter. */
  st.moreRest=rest;
  var n=out.length,floor=Math.max(sum*(n>24?.0045:.012),mx*.012,1);out.forEach(function(o){o.weight=Math.max(o.weight,floor)});sum=out.reduce(function(a,o){return a+o.weight},0);
  if(rest){var mw=moreWeight(out,floor);out.push({key:'more',weight:mw,more:rest,pin:'br'});sum+=mw}
  st.ups.filter(function(u){return u.dir==st.path&&u.state!='ok'}).forEach(function(u){if(list.some(function(x){return x.name==u.name}))return;var w=Math.max(Math.pow(u.size+1,.62),floor);out.push({key:'up:'+u.name,weight:w,up:u});sum+=w});
  if(st.path=='/'&&d.free!=null){var fw=Math.min(sum*.5,Math.max(sum*.3,Math.pow(d.free,.62)));out.push({key:'free',weight:fw||1,free:1,anchor:st.anchor})}
  return out}
function holeRect(W,H){if(innerWidth<=760)return null;var sr=$.stage.getBoundingClientRect(),cr=$.ctx.getBoundingClientRect(),g=26;
  var hx=cr.right-sr.left+g,hy=cr.bottom-sr.top+g;if(hx<=0)return null;if(H-hy<90)hy=H+1e4;return [-1e4,-1e4,hx,hy]}
// the field = the main area right of the column, plus a band under the column when there is room.
// Each part gets its own power diagram; stones are shared out by weight so the band holds a fair slice.
// horizontal room inside a polygon at height y around x
function chord(P,x,y){var L=-1e9,Rr=1e9;for(var i=0;i<P.length;i++){var a=P[i],b=P[(i+1)%P.length];if((a[1]>y)!=(b[1]>y)){var X=a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]);if(X<=x)L=Math.max(L,X);else Rr=Math.min(Rr,X)}}return Rr-L}
/* Rake lines follow a cell's own outline (true inward offsets), with a
   quiet shared-phase ripple so they feel hand-raked rather than compass-drawn. */
function rakeRings(p,step,maxn,amt){
  var Rs=G.rings(p,step,0,maxn), c=G.centroid(p), a0=0.62, n=Rs.rings.length;
  return Rs.rings.map(function(q,j){
    var k=(amt==null?.032:amt)*(1-j/(n+1.5));
    return q.map(function(pt){
      var a=Math.atan2(pt[1]-c[1],pt[0]-c[0]);
      var f=1+k*Math.sin(3*a+a0)+k*.42*Math.cos(5*a+a0*1.35);
      return [c[0]+(pt[0]-c[0])*f,c[1]+(pt[1]-c[1])*f];
    });
  });
}
function fieldLayout(it,W,H,M0,hole,mob){var R=mob?22:34,iter=it.length>40?48:64;st.band=null;st.moreSlot=null;try{performance.mark("nagi-layout-start")}catch(e){}
  if(!hole||hole[3]>H-60){var x0=hole?hole[2]:M0;return G.layout(it,G.roundRect(x0,M0,W-M0-x0,H-2*M0,R),{seed:st.path,iter:iter,corner:[x0+2,M0+2]})}
  var X=hole[2],Y=hole[3],B=H-M0,bh=B-Y,bw=X-M0;
  // the strip under the column: real stones sit in a fan-shaped patch toward the field (top edge rising to
  // the right, left edge leaning in); the rest is negative space with a few ghost pebbles, sparser to the left.
  var cutX=bw*.34,lead=Math.min(bh*.5,70);
  var bp=[[M0+cutX,Y+lead],[M0+cutX+bw*.22,Y+lead*.28],[X,Y],[X,B],[M0+cutX*.7,B]];
  var ab=Math.abs(G.area(bp)),a1=(W-M0-X)*(H-2*M0),tot=it.reduce(function(a,o){return a+o.weight},0),want=tot*ab/(a1+ab);
  var big=it.slice().sort(function(a,b){return b.weight-a.weight})[0],cand=it.filter(function(o){return !o.free&&!o.more&&o!==big}).sort(function(a,b){return (G.hash(a.key+'|b')%997)-(G.hash(b.key+'|b')%997)});
  var two=[],w2=0;cand.forEach(function(o){if(w2+o.weight<=want*1.12){two.push(o);w2+=o.weight}});
  if(!two.length&&cand.length>=2){var sm=cand.slice().sort(function(a,b){return a.weight-b.weight})[0];two.push(sm);w2=sm.weight}
  if(!two.length||it.length-two.length<2||bh<80){return G.layout(it,G.roundRect(X,M0,W-M0-X,H-2*M0,R),{seed:st.path,iter:iter,corner:[X+2,M0+2]})}
  var one=it.filter(function(o){return two.indexOf(o)<0});
  // keep sizes honest: if the band stones weigh less than their share, pull the patch's left edge in
  if(w2<want*.9){var f=Math.max(.45,w2/want),nx=X-(X-(M0+cutX*.7))*f;bp=[[Math.max(nx,M0+cutX*.7),Y+lead],[Math.max(nx,M0+cutX*.7)+bw*.2*f,Y+lead*.28],[X,Y],[X,B],[Math.max(nx-cutX*.6*f,M0+cutX*.7),B]]}
  var c1=G.layout(one,G.roundRect(X,M0,W-M0-X,H-2*M0,R),{seed:st.path,iter:iter,corner:[X+2,M0+2]}),c2=G.layout(two,bp,{seed:st.path+'|band',iter:iter});
  st.band={x0:M0,y0:Y,x1:X,y1:B,poly:bp};st.hole2=[-1e4,-1e4,X,Y];return c1.concat(c2)}
function loadKoi(cb){if(window.NagiKoi){if(cb)cb();return}if(window.__nagiKoiLoading){if(cb)(window.__nagiKoiCbs=window.__nagiKoiCbs||[]).push(cb);return}window.__nagiKoiLoading=1;var s=document.createElement('script');s.src='__NAGI_KOI_URL__';s.async=true;var n=document.currentScript&&document.currentScript.nonce||(document.querySelector('script[nonce]')||{}).nonce;if(n)s.setAttribute('nonce',n);s.onload=function(){window.__nagiKoiLoading=0;var q=window.__nagiKoiCbs||[];window.__nagiKoiCbs=null;q.forEach(function(f){try{f()}catch(e){}});if(cb)cb();if(st.view=='garden'&&st.cells)pondUp(st.cells)};s.onerror=function(){window.__nagiKoiLoading=0};(document.head||document.documentElement).appendChild(s)}
function pondUp(cells){if(!window.NagiKoi){loadKoi();return}var best=null;cells.forEach(function(c){if(c.d&&c.item.free)best=c});
  if(!best||best.area<9000||best.pr<34||root.classList.contains('off')){NagiKoi.hide();st.pond=null;return}
  st.pond=best;var gfree=$.zoom.querySelector('.cell[data-i="'+best.idx+'"]');if(gfree){gfree.classList.add('pondc');[].forEach.call(gfree.querySelectorAll('path.ring, path.sand'),function(p){p.remove()})}var pts=best.pb.map(function(v){return [v[0],v[1]]});NagiKoi.show($.stage,{poly:pts},{d:best.d,key:st.path+'|'+best.item.path,before:$.lbs,theme:root,interactive:true,avoid:best.c?[best.c[0],best.c[1],Math.min(70,Math.max(34,best.pr*.42))]:null});
  [].forEach.call($.lbs.querySelectorAll('.lb'),function(l){l.classList.toggle('pond',+l.dataset.i===best.idx)})}
function segD(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function polyD(p,P){var d=1e9;for(var i=0;i<P.length;i++)d=Math.min(d,segD(p,P[i],P[(i+1)%P.length]));return G.inside(P,p[0],p[1])?-d:d}
// decorative, non-interactive pebbles in the negative space under the column (seeded by folder, so stable)
function ghosts(gap){var b=st.band;if(!b)return '';var r=G.rng(G.hash(st.path+'|ghost')),out=[],svg='',W=b.x1-b.x0,H=b.y1-b.y0;
  for(var t=0;t<140&&out.length<14;t++){var x=b.x0+r()*W,y=b.y0+r()*H,f=(x-b.x0)/W,rad=4+r()*(6+16*f);
    if(r()>.18+.75*f)continue;
    if(x-rad<b.x0+12||y-rad<b.y0+4||y+rad>b.y1-2||x+rad>b.x1-4)continue;
    if(polyD([x,y],b.poly)<rad+gap*1.6)continue;
    if(out.some(function(o){return Math.hypot(o[0]-x,o[1]-y)<o[2]+rad+gap*1.4}))continue;out.push([x,y,rad,r()])}
  out.forEach(function(o){var q=[],k=G.hash(st.path+o[0].toFixed(0))%7,sq=.82+o[3]*.3;for(var e=0;e<10;e++){var an=e/10*Math.PI*2;q.push([o[0]+Math.cos(an)*o[2]*sq*(1+.1*Math.sin(an*2+k)),o[1]+Math.sin(an)*o[2]/sq*(.9+.1*Math.cos(an*3+k))])}
    if(o[3]<.16)return; // an empty gap: nothing drawn
    svg+='<path class="gh '+(o[3]<.7?'o':'f')+'" d="'+G.path(q,o[2]*.85)+'"/>'});
  // a thin sliver along the far-left edge, as in Kanso
  var sh=Math.min(H*.62,150),sy=b.y1-sh-2;if(sh>40)svg+='<path class="gh f" d="'+G.path(G.roundRect(b.x0+1,sy,6,sh,3),3)+'"/>';
  return '<g class="ghosts" aria-hidden="true">'+svg+'</g>'}

/* ---------- v3u: folder README (sanitized, collapsed) ---------- */
function mdSafe(src){
  var s=String(src||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  s=s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s=s.replace(/```[\w-]*\n([\s\S]*?)```/g,function(_,c){return '<pre><code>'+c.replace(/\n$/,'')+'</code></pre>'});
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s=s.replace(/(^|[^*\n])\*([^*\n]+)\*/g,'$1<em>$2</em>');
  s=s.replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1');
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,function(_,tx,u){u=String(u||'').trim();
    if(/^(https?:\/\/|\/)[^\s<]*$/i.test(u)&&u.indexOf('javascript:')<0&&u.indexOf('data:')<0)
      return '<a href="'+u.replace(/"/g,'&quot;')+'" rel="noopener noreferrer"'+(u.charAt(0)=='/'?'':' target="_blank"')+'>'+tx+'</a>';
    return tx});
  var lines=s.split('\n'),out=[],ul=0,i;
  function flush(){if(ul){out.push('</ul>');ul=0}}
  for(i=0;i<lines.length;i++){
    var L=lines[i];
    if(/^#{1,4} /.test(L)){flush();var n=Math.min(4,L.match(/^#+/)[0].length);out.push('<h'+ (n+3) +'>'+L.replace(/^#{1,4} /,'')+'</h'+(n+3)+'>')}
    else if(/^[-*] /.test(L)){if(!ul){out.push('<ul>');ul=1}out.push('<li>'+L.replace(/^[-*] /,'')+'</li>')}
    else if(L===''){flush()}
    else if(/^<pre>/.test(L)||L.indexOf('<pre>')>=0){flush();out.push(L)}
    else{if(ul)flush();out.push('<p>'+L+'</p>')}
  }
  flush();
  return out.join('\n');
}
var rdCache={key:'',el:null};
function loadReadme(d){
  var box=$.nrd;if(!box||!A.readme){if(box){box.hidden=true;box.innerHTML=''}return}
  var files=(d&&(d.files||d.items))||[],path=(d&&d.path)||st.path;
  var rd=null,i;for(i=0;i<files.length;i++)if(!files[i].isDir&&/^README\.md$/i.test(files[i].name)){rd=files[i];break}
  if(!rd){box.hidden=true;box.innerHTML='';rdCache.key='';return}
  var key=rd.path+'@'+(rd.ts||'')+'@'+(rd.size||'');
  if(rdCache.key===key&&rdCache.html){box.innerHTML=rdCache.html;box.hidden=false;bindReadme(box);return}
  A.readme(files).then(function(r){
    if(st.path!==path)return;
    if(!r||!r.text||!String(r.text).trim()){box.hidden=true;box.innerHTML='';rdCache.key='';return}
    var raw=String(r.text);if(raw.length>200000)raw=raw.slice(0,200000)+'\n…';
    var html='<div class="nrd-inner"><div class="nrd-body">'+mdSafe(raw)+'</div><button type="button" class="nrd-more" hidden>Show more</button></div>';
    rdCache={key:key,html:html};box.innerHTML=html;box.hidden=false;bindReadme(box);
  },function(){box.hidden=true;box.innerHTML=''});
}
function bindReadme(box){
  var inner=box.querySelector('.nrd-body'),btn=box.querySelector('.nrd-more');if(!inner||!btn)return;
  var need=inner.scrollHeight>inner.clientHeight+8;
  btn.hidden=!need;btn.textContent='Show more';inner.classList.remove('open');
  btn.onclick=function(){var on=inner.classList.toggle('open');btn.textContent=on?'Show less':'Show more'};
}
function cancelEdit(){if(st._ed&&st._edLeave)st._edLeave()}

/* Mobile: after the first pack, adjust the +N weight so its finished
   cell area ranks 3rd among the stones — smaller than the two biggest,
   at least as large as the rest. The pond (free) is not a stone and is
   left out of this ranking. A short binary search, a few relayouts at
   most; six cells pack quickly. */
function fitMoreArea(it,cells,relayout){
  var moreI=it.filter(function(o){return o.more})[0];if(!moreI)return cells;
  function measure(cs){
    var stones=cs.filter(function(c){return !c.item.more&&!c.item.free&&!c.item.up});
    var more=cs.filter(function(c){return c.item.more})[0];
    if(!more||stones.length<2)return null;
    var areas=stones.map(function(c){return c.area}).sort(function(a,b){return b-a});
    var hi=areas[1],lo=areas.length>2?areas[2]:0;
    var stoneRank=1;stones.concat([more]).sort(function(a,b){return b.area-a.area}).forEach(function(c,i){if(c.item.more)stoneRank=i+1});
    return {more:more,hi:hi,lo:lo,want:lo+(hi-lo)/2,area:more.area,stoneRank:stoneRank,ok:stoneRank===3&&more.area<=hi&&more.area>=lo};
  }
  var m=measure(cells);if(!m||m.ok)return cells;
  var loW=moreI.weight*.12,hiW=moreI.weight*3,w=moreI.weight;
  var best=cells,bestScore=1e15;
  for(var k=0;k<8;k++){
    if(m.area>m.hi){hiW=Math.min(hiW,w);w=(w+loW)/2}
    else if(m.area<m.lo){loW=Math.max(loW,w);w=(w+hiW)/2}
    else break;
    if(!(hiW>loW))break;
    moreI.weight=Math.max(w,1e-6);
    cells=relayout();m=measure(cells);if(!m)return best;
    var score=m.ok?0:(Math.abs(m.stoneRank-3)*1e9+Math.abs(m.area-m.want));
    if(score<bestScore){bestScore=score;best=cells}
    if(m.ok)return cells;
    w=moreI.weight;
  }
  return best;
}
function render(anim){if(!st.data)return;if(!st.data.all)st.data.all=st.data.items;var actv=st.ups.filter(function(u){return u.dir==st.path&&u.state!='ok'}).map(function(u){return u.name});st.data.items=st.data.all.filter(function(x){return x.isDir||actv.indexOf(x.name)<0});$.tip.classList.remove('on');st.upSig=st.ups.filter(function(x){return x.dir==st.path&&x.state!='ok'}).map(function(x){return x.name}).join('|');ageTones(st.data.items);renderCtx();loadReadme(st.data);
  [].forEach.call($.gh.querySelectorAll('.seg button'),function(b){b.classList.toggle('on',b.dataset.v==st.view)});
  var nd=st.data.items.filter(function(x){return x.isDir}).length,nf=st.data.items.length-nd;$.cnt.textContent=pl(nd,'folder')+' · '+(nf==1?'1 file':nf+' files');
  $.tav.innerHTML=A.user?'<b>'+esc(A.user.charAt(0).toUpperCase())+'</b>':ic('user');$.tav.classList.toggle('in',!!A.user);$.tav.setAttribute('aria-label',A.user?'Account: signed in as '+A.user:'Sign in');
  var me=root.querySelector('.menu .me');if(me){me.innerHTML=A.user?'<b>'+esc(A.user.charAt(0).toUpperCase())+'</b><span>'+esc(A.user)+'</span>':'<b class="g">'+ic('user')+'</b><span>Sign in</span>';me.setAttribute('aria-label',A.user?'Signed in as '+A.user:'Sign in');me.title=A.user?'Signed in as '+A.user:''}
  root.classList.toggle('vlist',st.view=='list');
  if(st.view=='list')return renderList();
  var old=$.stage.querySelector('.lst');if(old)old.remove();$.svg.style.display='';$.lbs.style.display='';
  var W=$.stage.clientWidth,H=$.stage.clientHeight;if(W<40||H<40)return;
  var hole=holeRect(W,H),mob=W<520,gap=mob?5:7.5;
  st.anchor=hole?[hole[2]+Math.min(260,(W-hole[2])*.28),Math.min(H*.3,hole[3]*.5)]:[W*.28,H*.26];
  var it=items();
  if(!it.length){$.zoom.innerHTML='';$.lbs.innerHTML='<div class="empty" style="left:'+(hole?hole[2]:0)+'px"><div><div class="pebble0"></div><h3>An empty clearing</h3><p class="hint">Drop files anywhere, or use Upload.</p></div></div>';st.cells=[];return}
  st.hole2=null;var M0=mob?4:8,tL=typeof performance!="undefined"?performance.now():0,cells=fieldLayout(it,W,H,M0,hole,mob);
  if(innerWidth<=760)cells=fitMoreArea(it,cells,function(){return fieldLayout(it,W,H,M0,hole,mob)});
  st.cells=cells;try{performance.measure("nagi-layout","nagi-layout-start");performance.mark("nagi-layout-end")}catch(e){}
  var svg='',lbs='',sandI=-1,sandA=0;cells.forEach(function(c,i){var o=c.item,x=o.x;if(st.path!='/')return;if(o.free||o.up||!x)return;if((x.type=='image'||x.type=='video')&&A.thumb)return;if(c.area>sandA){sandA=c.area;sandI=i}});
  cells.forEach(function(c,i){c.idx=i;var o=c.item,x=o.x,poly=G.inset(c.poly,gap/2);if(poly.length<3)return;
    var hz=st.hole2||hole,thr=gap/2+3,outer=function(m){if(m[0]<M0+thr||m[0]>W-M0-thr||m[1]<M0+thr||m[1]>H-M0-thr)return true;if(hz&&((Math.abs(m[0]-hz[2])<thr&&m[1]<hz[3])||(Math.abs(m[1]-hz[3])<thr&&m[0]<hz[2])))return true;if(st.band&&m[0]<st.band.x1-thr&&Math.abs(polyD(m,st.band.poly))<thr)return true;return false};
    var pl1=G.pole(poly),ar=Math.abs(G.area(poly));c.sliver=false;
    if(!o.more&&(pl1.r<6||(pl1.r<24&&ar/(pl1.r*pl1.r)>14))){c.sliver=true;var rr=Math.max(5,Math.min(pl1.r*1.05,22));poly=[];for(var e=0;e<10;e++){var an=e/10*Math.PI*2;poly.push([pl1.x+Math.cos(an)*rr*(1+.08*Math.sin(an*2+(G.hash(o.key||'')%7))),pl1.y+Math.sin(an)*rr*(.92+.08*Math.cos(an*3))])}}
    var hk=G.hash(o.key||''),rad=G.prad(poly,hk),pb=c.sliver?poly:G.bulge(poly,null,null,outer);
    var d=G.path(pb,c.sliver?rr*.9:rad);c.ipoly=poly;c.d=d;c.pb=pb;c.pr=pl1.r;
    c.item.path=x?x.path:o.key;
    var tn=o.free||o.up||o.more?0:toneOf(x),dk=tn==1||tn==2;
    var cls='cell t'+tn+(anim&&!RM?' in':'')+(o.up?' up':'')+(o.free?' free':'')+(o.more?' more sandc':'')+(i===sandI&&!c.sliver&&!o.more?' sandc':'');
    svg+='<g class="'+cls+'" data-i="'+i+'" style="animation-delay:'+(anim?Math.min(i*16,420):0)+'ms"><path class="f" d="'+d+'"/>';
    if(x&&!x.isDir&&(x.type=='image'||x.type=='video')&&A.thumb&&c.area>2200&&!c.sliver&&pl1.r>=22){var th=A.thumb(x);if(th){var b3=G.bbox(poly),cid='cp'+i+'_'+(G.hash(st.path)%9999);svg+='<clipPath id="'+cid+'"><path d="'+d+'"/></clipPath><image class="th" data-th="'+esc(th)+'" x="'+b3[0].toFixed(1)+'" y="'+b3[1].toFixed(1)+'" width="'+(b3[2]-b3[0]).toFixed(1)+'" height="'+(b3[3]-b3[1]).toFixed(1)+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#'+cid+')"/>';c.thumb=1}}
    var core=null;
    if(o.more){var rings=rakeRings(pb.map(function(v){return [v[0],v[1]]}),mob?4.4:5.2,10,mob?.028:.024);rings.forEach(function(q,j){svg+='<path class="sand" d="'+G.path(q,Math.max(2,Math.min(rad-(j+1)*3.6,G.prad(q,hk))))+'"/>'})}
    else if(i===sandI&&!c.sliver){var Rs=G.rings(pb.map(function(v){return [v[0],v[1]]}),mob?5.5:7,0,40);Rs.rings.forEach(function(q,j){svg+='<path class="sand" d="'+G.path(q,Math.max(2,Math.min(rad-(j+1)*4,G.prad(q,hk))))+'"/>'})}
    /* Pond-sized free space: the koi pond lives here (it may still be
       loading — v4.1 defers nagi-koi.js). Never paint fallback rake
       rings into this cell; they sit in the SVG above the water and
       pondc only clears .f, so they would stay visible "for no reason".
       A smaller free pebble still gets the quiet contour rings. */
    if(o.free&&!(pl1.r>=34&&ar>=9000)){var pbx=pb.map(function(v){return [v[0],v[1]]}),R=G.rings(pbx,mob?6:8.5,0,64),st0=mob?6:8.5;R.rings.forEach(function(q,j){svg+='<path class="ring" d="'+G.path(q,Math.max(2,Math.min(rad-(j+1)*st0*.55,G.prad(q,hk))))+'"/>'});core=R.core}
    if(o.up){var R2=G.rings(poly,6,0,40),k=Math.round(R2.rings.length*(o.up.pct||0)/100);svg+='<path class="rim" d="'+d+'"/>';R2.rings.forEach(function(q,j){svg+='<path class="ring'+(j<k?'':' todo')+'" d="'+G.path(G.bulge(q),Math.min(rad,G.prad(q,hk)))+'"/>'})}
    svg+='</g>';
    // label at the stone's pole, small and centred (Kanso)
    var pl0=G.pole(core&&core.length>2?core:poly);if(o.free&&core&&core.length>2){var cc=G.centroid(core);pl0={x:cc[0],y:cc[1],r:Math.max(40,G.pole(poly).r)}}
    c.c=[pl0.x,pl0.y];c.r=pl0.r;var r=pl0.r;
    var gl=null;if(o.up)gl='◐';else if(x&&x.isDir)gl=x.dom=='empty'?'○':'●';
    var nm=o.more?('+'+o.more):x?(x.isDir||x.type=='other'?x.name:x.name.replace(/\.[^.]+$/,'')):o.free?'Free':o.up.name,v=o.more?'':fs(x?x.size:o.free?st.data.free:o.up.size);
    if(o.up)v=Math.round(o.up.pct||0)+'%';
    var lc=' k'+tn+(c.thumb?' ph':'')+(o.free?' fr':'')+(o.up?' upl':'')+(o.more?' more sandl':'')+(i===sandI&&!c.sliver&&!o.more?' sandl':'');
    var pos='left:'+pl0.x.toFixed(1)+'px;top:'+pl0.y.toFixed(1)+'px';
    var cw=chord(poly,pl0.x,pl0.y),nw=nm.length*8+(gl?14:0);
    if(o.more||o.free||(r>=30&&(cw-14>=Math.min(nw,150)||cw-14>=r*1.75))){var mw=o.more?Math.max(48,Math.min(r*1.4,100)):o.free?Math.max(56,Math.min(r*1.75,170)):Math.max(56,Math.min(cw-14,190));
      lbs+='<div class="lb'+lc+'" data-i="'+i+'" style="'+pos+';--mw:'+mw.toFixed(0)+'px"><span class="n">'+(gl?'<b class="gl">'+gl+'</b>':'')+esc(nm)+'</span><span class="v">'+esc(v)+'</span></div>'}
    else if(r>=17&&(x||o.up)&&r*2.15>=v.length*7+(gl?14:0)){lbs+='<div class="lb sm'+lc+'" data-i="'+i+'" style="'+pos+'"><span class="n">'+(gl?'<b class="gl">'+gl+'</b>':'')+esc(v.replace(' ','\u202f'))+'</span></div>'}
    else if(r>=6&&gl){lbs+='<div class="lb gx'+lc+'" data-i="'+i+'" style="'+pos+'"><b class="gl">'+gl+'</b></div>'}
  });
  $.zoom.innerHTML=ghosts(gap)+svg;$.lbs.innerHTML=lbs;pondUp(cells);paintSel();
  bindThumbs($.zoom,{root:$.gd});
}
function clipHas(p){return !!(st.clip&&st.clip.mode=='cut'&&st.clip.items.some(function(x){return x.path==p}))}
function paintSel(){var kc=window.NagiKoi&&NagiKoi.pond;if(kc&&st.pond){var pp=st.pond.item.path;kc.cv.classList.toggle('sel',st.sel.indexOf(pp)>=0);kc.cv.classList.toggle('pl',!!(st.q[st.qi]&&st.q[st.qi].path==pp));kc.cv.classList.toggle('cut',clipHas(pp))}[].forEach.call($.zoom.querySelectorAll('.cell'),function(g){var c=st.cells[g.dataset.i];if(!c)return;var p=c.item.path;g.classList.toggle('sel',st.sel.indexOf(p)>=0);g.classList.toggle('play',!!(st.q[st.qi]&&st.q[st.qi].path==p));g.classList.toggle('cut',clipHas(p))});
  [].forEach.call($.lbs.querySelectorAll('.lb'),function(l){var c=st.cells[l.dataset.i];l.classList.toggle('sl',!!c&&st.sel.indexOf(c.item.path)>=0);l.classList.toggle('pl',!!(c&&st.q[st.qi]&&st.q[st.qi].path==c.item.path));l.classList.toggle('cut',!!c&&clipHas(c.item.path));});
  [].forEach.call($.chk.querySelectorAll('.row[data-p]'),function(r){r.classList.toggle('sel',st.sel.indexOf(r.dataset.p)>=0);r.classList.toggle('cut',clipHas(r.dataset.p))});
  [].forEach.call(root.querySelectorAll('.lst tr.r[data-p]'),function(r){r.classList.toggle('cut',clipHas(r.dataset.p))});
  var tl=$.stage.querySelector('.lst');if(tl)[].forEach.call(tl.querySelectorAll('tr.r'),function(r){r.classList.toggle('sel',st.sel.indexOf(r.dataset.p)>=0)})}
function hl(p,on){[].forEach.call($.zoom.querySelectorAll('.cell'),function(g){var c=st.cells[g.dataset.i];g.classList.toggle('dim',!!on&&c&&c.item.path!=p)});
  [].forEach.call($.chk.querySelectorAll('.row'),function(r){r.classList.toggle('hov',!!on&&r.dataset.p==p)})}
function stageEvents(){var clickT;
  $.stage.addEventListener('mousemove',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];
    if(!c){$.tip.classList.remove('on');hl(null,0);return}
    var r=$.stage.getBoundingClientRect(),x=c.item.x,o=c.item;
    if(st.hover!==c.item.path){st.hover=c.item.path;[].forEach.call($.chk.querySelectorAll('.row'),function(rw){rw.classList.toggle('hov',rw.dataset.p==c.item.path)});if(x)wf3warm(x)}
    var small=(c.r||0)<30;if(small){$.tip.innerHTML=esc(o.more?('+'+o.more+' more'):x?x.name:o.free?'Free space':o.up.name)+'<span>'+(o.more?'':(x?fs(x.size):o.free?fs(st.data.free):Math.round(o.up.pct)+'%'))+'</span>';$.tip.style.left=(e.clientX-r.left)+'px';$.tip.style.top=(e.clientY-r.top)+'px';$.tip.classList.add('on')}else $.tip.classList.remove('on')});
  $.stage.addEventListener('mouseleave',function(){$.tip.classList.remove('on');st.hover=null;[].forEach.call($.chk.querySelectorAll('.row'),function(rw){rw.classList.remove('hov')})});
  $.stage.addEventListener('pointerdown',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(c&&c.item.x&&c.item.x.isDir&&A.prefetch)A.prefetch(c.item.x.path);if(c&&c.item.x)wf3warm(c.item.x)},{passive:true});
  $.stage.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(c&&c.item.more){showRest();return}if(!c||!c.item.x){if(c&&c.item.free)toast(ic('hard-drive')+' '+fs(st.data.free)+' free of '+fs(st.data.total));return}
    var x=c.item.x;if(x.isDir&&!(e.metaKey||e.ctrlKey||e.shiftKey)){clearTimeout(clickT);return go(x.path)}
    clearTimeout(clickT);var multi=e.metaKey||e.ctrlKey||e.shiftKey;clickT=setTimeout(function(){toggleSel(x.path,false)},multi?0:190)});
  $.stage.addEventListener('dblclick',function(e){clearTimeout(clickT);var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(c&&c.item.x&&!c.item.x.isDir)open(c.item.x)})}
function openDrawer(){var c=$.ctx;if(innerWidth>760||!c)return;c.style.transition='';c.style.transform='';c.style.willChange='';c.classList.remove('drag','peek');if(!c.classList.contains('open')){c.classList.add('open');pushOv('drawer')}}
/* v3y: +N opens the existing drawer / checklist, and leaves the garden as it is.
   It must not switch to list view. On a phone this is the same open as the
   handle (the .32s snap). On a wider screen the panel is already there: show
   every row inside it and let that list scroll, without a jump. */
function showRest(){
  if(innerWidth<=760){openDrawer();requestAnimationFrame(function(){if($.chk)$.chk.scrollTop=0});return}
  var chk=$.chk;if(!chk)return;
  var h=chk.clientHeight;
  [].forEach.call(chk.querySelectorAll('.row[data-p],.grp'),function(r){r.style.display=''});
  var rest=chk.querySelector('.row.more.rest');if(rest)rest.remove();
  if($.ctx)$.ctx.classList.remove('tight','tighter');
  if(h){chk.style.maxHeight=h+'px';chk.style.overflowY='auto'}
  chk.scrollTop=0;
}
function setView(v){st.view=v;localStorage.nagi_view=v;render(true)}
/* v4.1: at most TH_MAX thumbnail requests in flight; a new folder flushes the rest. */
var TH_MAX=4,thQ=[],thN=0,thGen=0;
function thFlush(){thGen++;thQ.length=0}
function thDrop(el){if(!el)return;if(el._thIO){try{el._thIO.disconnect()}catch(e){}el._thIO=null}}
function thPump(){while(thN<TH_MAX&&thQ.length){var fn=thQ.shift();thN++;(function(f){var once=0;f(function(){if(once)return;once=1;thN--;thPump()})})(fn)}}
function thEnqueue(run){var g=thGen;thQ.push(function(done){if(g!==thGen){done();return}run(done)});thPump()}

function bindThumbs(rootEl,opt){if(!rootEl)return;
  if(rootEl._thIO){try{rootEl._thIO.disconnect()}catch(e){}rootEl._thIO=null}
  var nodes=rootEl.querySelectorAll?rootEl.querySelectorAll('[data-th]'):[];
  if(!nodes.length)return;
  function load(el){if(el.dataset.thOn)return;el.dataset.thOn='1';var u=el.getAttribute('data-th');if(!u)return;
    thEnqueue(function(done){
    function ok(url){
      function painted(){el.classList.add('on');done()}
      if(el.tagName==='image'||el.tagName==='IMAGE'){var pr=new Image();pr.onload=function(){el.setAttribute('href',url);el.setAttributeNS('http://www.w3.org/1999/xlink','href',url);painted()};pr.onerror=fail;pr.src=url}
      else if(el.tagName==='IMG'){el.decoding='async';el.onload=painted;el.onerror=fail;el.src=url}
      else{var im=el.querySelector('img');if(im){im.decoding='async';im.onload=painted;im.onerror=function(){if(/[?&]th=w/.test(im.src||u)){im.onerror=null;im.src=(im.getAttribute('src')||u).replace('th=w','th=j')}else{el.classList.add('miss');done()}};im.src=url}else painted()}}
    function fail(){if(/[?&]th=w/.test(u)&&!el.dataset.thJ){el.dataset.thJ='1';u=u.replace('th=w','th=j');ok(u);return}
      el.classList.add('miss');var i=el.parentNode&&el.parentNode.dataset&&el.parentNode.dataset.i,l=i!=null&&$.lbs?$.lbs.querySelector('.lb[data-i="'+i+'"]'):null;if(l)l.classList.remove('ph');done()}
    if(A.thumbOk)A.thumbOk(u).then(function(src){if(src)ok(src);else fail()},fail);else ok(u)})}
  if(typeof IntersectionObserver!=='function'){[].forEach.call(nodes,load);return}
  var io=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){io.unobserve(en.target);load(en.target)}})},{root:(opt&&opt.root)||null,rootMargin:'120px',threshold:0.01});
  rootEl._thIO=io;
  [].forEach.call(nodes,function(n){io.observe(n)});
}
function renderList(){if(window.NagiKoi)NagiKoi.hide();$.svg.style.display='none';$.lbs.style.display='none';var old=$.stage.querySelector('.lst');if(old)old.remove();
  var rows=grouped(st.data.items,function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true})}),gs={},ng=0,lastG=null;rows.forEach(function(x){if(!gs[grp(x)]){gs[grp(x)]=0;ng++}gs[grp(x)]++});var h='<div class="lst"><table><thead><tr><th>Name</th><th>Kind</th><th style="text-align:right">Size</th><th style="text-align:right">Changed</th></tr></thead><tbody>';
  rows.forEach(function(x){var t=x.isDir?'folder':x.type,ar=x.tags&&(x.tags.artist||''),gx=grp(x);if(ng>1&&gx!==lastG)h+='<tr class="g"><td colspan="4"><span>'+GLAB[gx]+'</span><i>'+gs[gx]+'</i></td></tr>';lastG=gx;h+='<tr class="r" data-p="'+esc(x.path)+'"><td class="nm">'+rowIc(x)+'<span>'+esc(x.name)+'</span></td><td class="mu">'+(x.isDir?(x.count!=null?pl(x.count,'other'):'Folder'):esc(ar||t))+'</td><td class="rt">'+fs(x.size)+'</td><td class="rt">'+esc(rel(x.ts))+'</td></tr>'});
  if(!rows.length)h+='<tr><td colspan="4" class="mu" style="height:120px;text-align:center">An empty clearing. Drop files to fill it.</td></tr>';
  $.stage.appendChild(el(h+'</tbody></table></div>'));
  [].forEach.call($.stage.querySelectorAll('tr.r'),function(r){var x=find(r.dataset.p);r.onclick=function(e){if(x.isDir&&!e.metaKey&&!e.ctrlKey)return go(x.path);if(innerWidth<=760&&!e.metaKey&&!e.ctrlKey)return open(x);toggleSel(x.path)};r.ondblclick=function(){open(x)};r.addEventListener('pointerdown',function(){if(x)wf3warm(x)},{passive:true});r.addEventListener('mouseenter',function(){if(x)wf3warm(x)})});bindThumbs($.stage.querySelector('.lst'),{root:$.stage.querySelector('.lst')});paintSel()}

/* ---------- open / media ---------- */
function open(x){if(x.isDir)return go(x.path);
  var same=st.data.items.filter(function(y){return y.type==x.type});
  if(x.type=='audio')return playList(same,same.indexOf(x));
  if(x.type=='image'){var imgs=lbSet(x),ix=imgs.findIndex(function(y){return y.path==x.path});return lbOpen(imgs,ix<0?0:ix)}
  if(x.type=='video')return openSheet('video',x);
  if(x.type=='doc'||x.type=='code')return openSheet('read',x);
  download([x])}
var au=new Audio();au.preload='auto';
function playList(list,i){st.q=list.slice();st.qi=-1;playAt(i||0)}
function playAt(i){if(i<0||i>=st.q.length){return}st.qi=i;var x=st.q[i];au.src=A.url(x);au.play().catch(function(){});
  $.np.classList.add('on');var tg=x.tags||{};$.np.querySelector('.t b').textContent=tg.title||x.name.replace(/\.[^.]+$/,'');$.np.querySelector('.t span').textContent=(tg.artist||'')+(tg.album?' · '+tg.album:'')||title(dirname(x.path));
  if('mediaSession' in navigator)try{navigator.mediaSession.metadata=new MediaMetadata({title:tg.title||x.name,artist:tg.artist||'',album:tg.album||''});['previoustrack','nexttrack','play','pause'].forEach(function(a){navigator.mediaSession.setActionHandler(a,{previoustrack:prev,nexttrack:next,play:toggle,pause:toggle}[a])})}catch(e){}
  root.classList.add('playing');refresh();renderGlyphs()}
function renderGlyphs(){if(st.view=='garden')render(false)}
function next(){if(st.qi<st.q.length-1)playAt(st.qi+1);else{au.pause();tick()}}
function prev(){if(au.currentTime>3)au.currentTime=0;else if(st.qi>0)playAt(st.qi-1)}
function toggle(){if(st.qi<0)return;if(au.paused)au.play();else au.pause();tick()}
au.addEventListener('ended',next);au.addEventListener('timeupdate',tick);au.addEventListener('play',tick);au.addEventListener('pause',tick);
function tick(){var d=au.duration||0,t=au.currentTime||0,f=d?t/d:0;$.np.querySelector('.bar i').style.width=(f*100)+'%';$.np.querySelector('.bar b').style.left=(f*100)+'%';
  $.np.querySelector('.a').textContent=dur(t);$.np.querySelector('.z').textContent=dur(d);$.np.classList.toggle('paused',au.paused);
  var b=$.np.querySelector('[data-p=toggle]');b.innerHTML=ic(au.paused?'play':'pause');root.classList.toggle('playing',!au.paused)}
function lbOpen(list,i){st.lb={list:list,i:i||0};$.lbx.classList.add('on');if(list&&list[i||0])wf3warm(list[i||0],0);lbShow();pushOv('lb')}
/* v3w: the viewer shows ONLY a light preview (?th=wf3, uncropped, 960×768
   bound with the default --th-size). v3p stacked a cropped ?th=w3 under a
   second img that then fetched the original and faded it in — two pictures,
   and a heavy download. The original is fetched only if the file cannot be
   thumbnailed (svg, or a thumb error). Prev/next preload neighbour previews,
   never the full files. Download is a quiet "Download" for the original. */
/* v3z: neighbours (±2 to ±3, swipe direction first) are fetched two at a
   time, decoded with img.decode(), and kept in a small in-memory cache so
   the next swipe can paint at once. Hover and touchstart on a visible
   image warm its preview before the viewer opens. Originals are never
   prefetched; Download stays ?dl. */
/* v3z2: a 3-slot filmstrip (prev, current, next). Each slot holds a real
   <img> already pointing at a decoded wf3, or the garden's tiny thumb
   blurred-up until that decode finishes — never a blank. The finger drags
   the strip, so the next photo is on screen mid-swipe. Originals are never
   fetched here; Download stays ?dl. */
function lbSlot(slot,x,rise){
  var kind=slot.classList.contains('prev')?'prev':slot.classList.contains('next')?'next':'cur';
  var token=slot._gen=(slot._gen||0)+1;
  slot.innerHTML='';slot.className='slot '+kind;
  if(!x){slot.classList.add('empty');return}
  var u=wf3url(x),hit=u&&wf3get(u),th=thUrl(x);
  function putWf(src){
    if(!slot.isConnected||slot._gen!==token)return;
    if(slot.querySelector('img.wf'))return;
    var im=new Image();
    im.alt=x.name;im.decoding='async';
    im.className='wf'+(rise?'':' norise');
    function show(){
      if(!slot.isConnected||slot._gen!==token)return;
      if(slot.querySelector('img.wf'))return;
      slot.appendChild(im);
      var ph=slot.querySelector('img.ph');
      if(ph)ph.remove();
    }
    function go(){if(im.decode)im.decode().then(show,show);else show()}
    im.onerror=function(){var s=im.getAttribute('src')||'';if(/[?&]th=w/.test(s)){im.onerror=function(){};im.src=s.replace('th=w','th=j')}};
    im.onload=go;im.src=src;
    if(im.complete&&im.naturalWidth)go();
  }
  if(hit){putWf(hit.src);return}
  if(th){
    var ph=new Image();ph.alt='';ph.className='ph norise';
    ph.onerror=function(){var s=ph.getAttribute('src')||'';if(/[?&]th=w/.test(s)){ph.onerror=null;ph.src=s.replace('th=w','th=j')}};
    ph.src=th;slot.appendChild(ph);
  }
  if(u)wf3ready(u,function(img){putWf(img.src)});
  else if(!th&&x&&kind==='cur'){var im=new Image();im.alt=x.name;im.className='wf'+(rise?'':' norise');im.src=A.url(x);slot.appendChild(im)}
}
function lbStrip(){
  var box=$.lbx.querySelector('.im'),strip=box&&box.querySelector('.strip');
  if(!box)return null;
  if(!strip){box.innerHTML='';strip=document.createElement('div');strip.className='strip';box.appendChild(strip)}
  return strip;
}
function lbPane(){var im=$.lbx&&$.lbx.querySelector('.im');return (im&&im.clientWidth)||innerWidth}
function lbHome(strip,W){
  if(!strip)return;
  W=W||lbPane();
  strip.style.transition='none';
  strip.classList.remove('drag','snap');
  strip.style.transform='translate3d('+(-W)+'px,0,0)';
}
function lbPaintCap(){
  if(!st.lb)return;
  var list=st.lb.list,i=st.lb.i,x=list[i];if(!x)return;
  $.lbx.querySelector('.cap').innerHTML='<span><b>'+esc(x.name)+'</b><button class="ib sm dl" type="button" aria-label="Download full size" title="Download full size (⇧S)">'+ic('download')+'<span>Download</span></button>'+fs(x.size)+' · '+esc(rel(x.ts))+'</span><span>'+(i+1)+' of '+list.length+'</span>';
  $.lbx.querySelector('.cap .dl').onclick=function(){download([x])};
  $.lbx.querySelector('.p').style.visibility=i>0?'':'hidden';
  $.lbx.querySelector('.n').style.visibility=i<list.length-1?'':'hidden';
}
/* v3z3: after a snap (or an arrow), recycle the three slot nodes so the
   already-painted neighbour becomes current without touching its src.
   Only the far slot that just left the screen is reloaded. Transform is
   reset in the same frame with transitions off, so WebKit never blanks. */
function lbAdvance(dir){
  if(!st.lb)return false;
  var list=st.lb.list,i=st.lb.i+dir;
  if(i<0||i>=list.length)return false;
  var strip=lbStrip(),slots=strip&&strip.children;
  if(!strip||slots.length!==3){st.lb.i=i;wf3.dir=dir;lbShow();return true}
  var W=lbPane();
  /* transition off BEFORE any DOM or transform change */
  strip.style.transition='none';
  strip.classList.remove('drag','snap');
  var a=slots[0],b=slots[1],c=slots[2],far;
  if(dir>0){strip.appendChild(a);b.className='slot prev';c.className='slot cur';a.className='slot next';far=a}
  else{strip.insertBefore(c,a);c.className='slot prev';a.className='slot cur';b.className='slot next';far=c}
  strip.style.transform='translate3d('+(-W)+'px,0,0)';
  void strip.offsetWidth;
  st.lb.i=i;wf3.dir=dir;
  lbSlot(far,list[i+dir],false);
  lbPreload(list,i);
  lbPaintCap();
  return true;
}
function lbShow(){
  if(!st.lb)return;
  var list=st.lb.list,i=st.lb.i,x=list[i],noRise=!!st.lb.noRise;st.lb.noRise=0;
  var strip=lbStrip();if(!strip)return;
  var W=lbPane();
  strip.style.transition='none';strip.classList.remove('drag','snap');
  strip.innerHTML='<div class="slot prev"></div><div class="slot cur"></div><div class="slot next"></div>';
  lbPreload(list,i);
  lbSlot(strip.querySelector('.prev'),list[i-1],false);
  lbSlot(strip.querySelector('.cur'),x,!noRise);
  lbSlot(strip.querySelector('.next'),list[i+1],false);
  strip.style.transform='translate3d('+(-W)+'px,0,0)';
  void strip.offsetWidth;
  lbPaintCap();
}
function lbStep(d){if(!st.lb)return;lbAdvance(d)}

/* v3z preview cache: at most 8 decoded wf3 bitmaps, 2 fetches at a time. */
var wf3={map:Object.create(null),ord:[],q:[],busy:0,gen:0,dir:1,MAX:8,CONCUR:2,wait:Object.create(null)};
function wf3url(x){return (x&&!x.isDir&&x.type=='image'&&A.thumb)?A.thumb(x,'preview'):null}
function wf3get(u){var e=u&&wf3.map[u];return (e&&e.ready&&e.img)?e.img:null}
function wf3ready(u,fn){
  if(!u||!fn)return;
  var e=wf3.map[u];
  if(e&&e.ready&&e.img){fn(e.img);return}
  (wf3.wait[u]=wf3.wait[u]||[]).push(fn);
  e=wf3.map[u];
  if(e&&e.ready&&e.img){var ws=wf3.wait[u];delete wf3.wait[u];ws.forEach(function(f){try{f(e.img)}catch(_){}})}
}
function thUrl(x){return (x&&!x.isDir&&x.type=='image'&&A.thumb)?A.thumb(x):null}
function wf3clear(){wf3.q=[];wf3.gen++;wf3.wait=Object.create(null);Object.keys(wf3.map).forEach(function(u){var e=wf3.map[u];if(e&&e.img){e.abort=1;try{e.img.onload=e.img.onerror=null;if(e.loading)e.img.src=''}catch(_){}}});wf3.map=Object.create(null);wf3.ord=[];wf3.busy=0}
function wf3trim(){
  while(wf3.ord.length>wf3.MAX){
    var drop=-1;for(var i=0;i<wf3.ord.length;i++){var e=wf3.map[wf3.ord[i]];if(e&&!e.loading){drop=i;break}}
    if(drop<0)break;
    var u=wf3.ord.splice(drop,1)[0],e=wf3.map[u];
    if(e&&e.img){try{e.img.onload=e.img.onerror=null}catch(_){}}
    delete wf3.map[u];
  }
}
function wf3enq(u,pri,gen){
  if(!u||wf3get(u)||(wf3.map[u]&&wf3.map[u].loading))return;
  for(var i=0;i<wf3.q.length;i++)if(wf3.q[i].u===u){wf3.q[i].pri=Math.min(wf3.q[i].pri,pri);wf3.q[i].gen=gen;return}
  wf3.q.push({u:u,pri:pri,gen:gen});
  wf3.q.sort(function(a,b){return a.pri-b.pri||a.gen-b.gen});
  wf3pump();
}
function wf3pump(){
  wf3.q=wf3.q.filter(function(j){return j.gen===wf3.gen});
  while(wf3.busy<wf3.CONCUR&&wf3.q.length){
    var j=wf3.q.shift();
    if(wf3get(j.u)||(wf3.map[j.u]&&wf3.map[j.u].loading))continue;
    wf3fetch(j.u);
  }
}
function wf3fetch(u){
  var e={img:new Image(),ready:false,loading:true,abort:false};
  wf3.map[u]=e;wf3.busy++;
  e.img.decoding='async';
  function fin(ok){
    e.loading=false;
    if(e.abort){if(wf3.map[u]===e)delete wf3.map[u]}
    else if(ok){e.ready=true;var i=wf3.ord.indexOf(u);if(i>=0)wf3.ord.splice(i,1);wf3.ord.push(u);wf3trim();var ws=wf3.wait[u];if(ws){delete wf3.wait[u];ws.forEach(function(fn){try{fn(e.img)}catch(_){}})}}
    else if(wf3.map[u]===e)delete wf3.map[u];
    wf3.busy=Math.max(0,wf3.busy-1);
    wf3pump();
  }
  e.img.onload=function(){
    var d=e.img.decode?e.img.decode():Promise.resolve();
    Promise.resolve(d).then(function(){fin(true)},function(){fin(true)});
  };
  e.img.onerror=function(){fin(false)};
  e.img.src=u;
}
function wf3cancel(keep){
  wf3.q=wf3.q.filter(function(j){return keep[j.u]});
  Object.keys(wf3.map).forEach(function(u){
    var e=wf3.map[u];
    if(e&&e.loading&&!keep[u]){
      e.abort=1;
      try{e.img.onload=e.img.onerror=null;e.img.src=''}catch(_){}
      if(wf3.map[u]===e)delete wf3.map[u];
      wf3.busy=Math.max(0,wf3.busy-1);
    }
  });
}
function lbPreload(list,i){
  if(!A.thumb||!list||!list.length)return;
  var d=wf3.dir||1,gen=++wf3.gen,keep={},urls=[],seen={};
  function add(n){var x=list[n],u=wf3url(x);if(!u||seen[u])return;seen[u]=1;urls.push(u);keep[u]=1}
  add(i);
  for(var k=1;k<=3;k++){add(i+k*d);add(i-k*d)}
  wf3cancel(keep);
  urls.forEach(function(u,pri){wf3enq(u,pri,gen)});
}
function wf3warm(x,span){
  if(!x||x.isDir||x.type!='image'||!A.thumb)return;
  var list=lbSet(x),ix=list.findIndex(function(y){return y.path==x.path});
  if(ix<0){var u=wf3url(x);if(u){var gen=wf3.gen;wf3enq(u,0,gen)}return}
  var n=span==null?2:span,d=wf3.dir||1,gen=wf3.gen,keep={},urls=[],seen={};
  function add(j){var u=wf3url(list[j]);if(!u||seen[u])return;seen[u]=1;urls.push(u);keep[u]=1}
  add(ix);
  for(var k=1;k<=n;k++){add(ix+k*d);add(ix-k*d)}
  urls.forEach(function(u,pri){wf3enq(u,pri,gen)});
}
function lbClose(fromPop){$.lbx.classList.remove('on');st.lb=null;if(!fromPop)popOv()}
function closeLb(fromPop){if(st.lb)lbClose(fromPop)}
function lbSet(x){
  /* v3y: swipe (and arrows) walk the current image selection when one exists
     and the opened file is in it; otherwise every image in the folder. */
  var all=st.data?st.data.items.filter(function(y){return y.type=='image'}):[];
  var sel=(st.sel||[]).map(find).filter(function(y){return y&&y.type=='image'});
  if(sel.length&&(!x||sel.some(function(y){return y.path==x.path})))return sel;
  return all;
}
/* v3y: one-finger left/right swipe on the preview, following the finger,
   then a calm snap (same easing as the drawer). Two-finger touches are
   ignored so the pinch-zoom block is left alone. Neighbour previews only;
   the original is never fetched. Desktop keeps the arrow keys. */
function lbSwipe(){
  var s=null,eat=false;
  function strip(){return $.lbx&&$.lbx.querySelector('.im .strip')}
  function onDown(e){
    if(!st.lb||!$.lbx.classList.contains('on'))return;
    if(e.pointerType==='mouse'||(e.button!=null&&e.button>0)||e.isPrimary===false)return;
    if(e.target.closest&&e.target.closest('.nav,.x,.cap,button,.dl'))return;
    var el=strip();if(!el)return;
    var W=lbPane();
    s={x:e.clientX,y:e.clientY,t:Date.now(),el:el,moved:false,dx:0,pid:e.pointerId,W:W,base:-W};
    lbHome(el,W);
    try{$.lbx.setPointerCapture(e.pointerId)}catch(_){}
  }
  function onMove(e){
    if(!s||s.pid!==e.pointerId)return;
    var dx=e.clientX-s.x,dy=e.clientY-s.y;
    if(!s.moved){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;if(Math.abs(dy)>Math.abs(dx)){s=null;return}s.moved=true;s.el.classList.add('drag');s.el.style.transition='none'}
    if(e.cancelable)try{e.preventDefault()}catch(_){}
    var atEnd=(dx>0&&st.lb.i===0)||(dx<0&&st.lb.i===st.lb.list.length-1);
    s.dx=atEnd?dx*.28:dx;
    s.el.style.transform='translate3d('+(s.base+s.dx)+'px,0,0)';
  }
  function onEnd(e){
    if(!s||(e&&s.pid!==e.pointerId))return;
    var D=s;s=null;var el=D.el,dx=D.dx,dt=Math.max(1,Date.now()-D.t),v=dx/dt,W=D.W||lbPane();
    if(!D.moved){lbHome(el,W);return}
    eat=true;setTimeout(function(){eat=false},350);
    var dir=(Math.abs(dx)>56||Math.abs(v)>.35)?(dx<0?1:-1):0;
    var can=dir&&st.lb&&st.lb.i+dir>=0&&st.lb.i+dir<st.lb.list.length;
    function snap(to,done){
      if(RM){if(done)done();else lbHome(el,W);return}
      el.classList.remove('drag');el.classList.add('snap');
      el.style.transition='transform .32s cubic-bezier(.2,.8,.2,1)';
      el.style.transform='translate3d('+to+'px,0,0)';
      var finished=false;
      function end(){
        if(finished)return;finished=true;
        if(done)done();
        else lbHome(el,W);
      }
      el.addEventListener('transitionend',end,{once:true});
      setTimeout(end,400);
    }
    /* snap so the already-painted neighbour sits in the middle, then
       recycle the slot nodes — do not rebuild or reassign src. */
    if(can)snap(dir>0?-2*W:0,function(){if(st.lb)lbAdvance(dir)});
    else snap(-W);
  }
  $.lbx.addEventListener('pointerdown',onDown);
  $.lbx.addEventListener('pointermove',onMove);
  $.lbx.addEventListener('pointerup',onEnd);
  $.lbx.addEventListener('pointercancel',function(e){if(!s||s.pid!==e.pointerId)return;var el=s.el;s=null;lbHome(el)});
  $.lbx.addEventListener('touchstart',function(e){if(e.touches&&e.touches.length>1){if(s){lbHome(s.el);s=null}}},{passive:true});
  $.lbx.addEventListener('touchmove',function(e){if(s&&s.moved&&e.cancelable)e.preventDefault()},{passive:false});
  $.lbx.addEventListener('click',function(e){if(eat){e.preventDefault();e.stopPropagation()}},true);
}

/* ---------- sheets ---------- */
function pinWin(){if($.win)$.win.scrollTop=0;if($.bd)$.bd.scrollTop=0}
function focusQuiet(el){if(!el)return;try{el.focus({preventScroll:true})}catch(e){el.focus()}pinWin()}
function openSheet(kind,arg){st.sheet=kind;var s=$.sheet;s.className='sheet'+(kind=='video'||kind=='read'?' wide':'');var f=SHEETS[kind];if(!f)return;
  s.innerHTML='';f(s,arg);var x=s.querySelector('.sh-x');if(x)x.onclick=closeSheet;
  [].forEach.call($.menu.querySelectorAll('[data-m]'),function(b){b.classList.toggle('on',b.dataset.m==kind)});
  /* v3r: commit the closed transform after the first fill so the open transition
     starts from translateY(105%) (mobile), not an unpainted identity. Native
     autofocus (and a mid-transition focus()) would scroll .win — overflow:hidden
     is still programmatically scrollable — and leave the sheet sitting in the
     top half of the screen. That is why only the first Search tap went blank. */
  if(window.NagiDeferFonts)NagiDeferFonts();void s.offsetWidth;pinWin();
  requestAnimationFrame(function(){s.classList.add('on');$.veil.classList.add('on')});
  var inp=s.querySelector('input[data-autofocus]');if(inp)setTimeout(function(){focusQuiet(inp)},200);pushOv('sheet')}
function signIn(){location.href=A.loginUrl()}
function signOut(){memClear();if(A.invalidate)A.invalidate();location.href=A.logoutUrl()}
function closeSheet(fromPop){if(!st.sheet)return;st._unAsk=null;st._ed=null;st.sheet=null;$.sheet.classList.remove('on');$.veil.classList.remove('on');[].forEach.call($.menu.querySelectorAll('[data-m]'),function(b){b.classList.remove('on')});
  var v=$.sheet.querySelector('video');if(v)v.pause();pinWin();setTimeout(function(){if(!st.sheet){$.sheet.innerHTML='';pinWin()}},450);if(!fromPop)popOv()}
function dlb(k){return '<button class="ib sm dl" aria-label="Download" title="Download'+(k?' (⇧S)':'')+'">'+ic('download')+'</button>'}
function head(t,p,dl){return '<div class="sh-h"><div><div class="sh-t"><h3>'+t+'</h3>'+(dl?dlb(1):'')+'</div>'+(p?'<p>'+p+'</p>':'')+'</div><button class="ib sh-x" aria-label="Close" title="Close (Esc)">'+ic('x')+'</button></div>'}
function topo(w,h){var poly=G.roundRect(4,4,w-8,h-8,18),r=G.contours(poly,18,11,[w*.78,h*.3],40);return '<svg class="topo" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+r.map(function(d){return '<path d="'+d+'" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width=".8"/>'}).join('')+'</svg>'}

/* ---------- v3t: move / copy ---------- */
function parentPath(p){return (p||'/').replace(/[^\/]+\/?$/,'')||'/'}
function normPath(p){p=p||'/';return p=='/'?'/':p.replace(/\/?$/,'/')}
function samePath(a,b){return normPath(a)===normPath(b)}
function isInside(parent,child){var p=normPath(parent),c=normPath(child);return c!==p&&c.indexOf(p)===0}
function mvRecent(){try{return JSON.parse(localStorage.nagi_mv_recent||'[]')}catch(e){return []}}
function mvRemember(p){p=normPath(p);if(!p||p=='/')return;var r=mvRecent().filter(function(x){return !samePath(x,p)});r.unshift(p);try{localStorage.nagi_mv_recent=JSON.stringify(r.slice(0,6))}catch(e){}}
function mvMsg(e,x,dest){var m=String((e&&e.message)||e||'');
  if(/target file exists/i.test(m))return 'A file named “'+x.name+'” is already in '+title(dest)+'.';
  if(/parent into subfolder/i.test(m))return 'Cannot move a folder into itself.';
  if(/mountpoint/i.test(m))return 'That is a volume mount and cannot be moved.';
  if(/403|not allowed|authenticate/i.test(m))return 'You do not have permission to do that.';
  return m.replace(/^(mv2?|cp2?):\s*/i,'')||'Could not finish.'}
function placeBlock(items,dest,mode){dest=normPath(dest);
  for(var i=0;i<items.length;i++){var x=items[i];
    if(x.isDir&&(samePath(x.path,dest)||isInside(x.path,dest)))return 'Cannot '+(mode=='copy'?'copy':'move')+' “'+x.name+'” into itself.';
  }
  if(items.length&&samePath(parentPath(items[0].path),dest)&&mode!='copy')return 'already';
  return null}
function setClip(mode,items){st.clip={mode:mode,items:items.slice(),from:st.path};refresh();
  var n=items.length,w=n==1?'“'+items[0].name+'”':n+' items';
  upNote((mode=='copy'?'Copied ':'Cut ')+w+'. Open a folder and paste.')}
function clearClip(silent){if(!st.clip)return;st.clip=null;refresh();if(!silent)upNote('Cleared the clipboard.')}
function doPaste(dest,mode){
  var clip=st.clip;if(!clip||!clip.items||!clip.items.length){upNote('Nothing to paste.',true);return}
  var md=mode||clip.mode;
  runPlace(md,clip.items,dest,function(){if(md=='cut')st.clip=null})}
function runPlace(mode,items,dest,done){
  dest=normPath(dest);var blk=placeBlock(items,dest,mode);
  if(blk=='already'){upNote('Those items are already here.',true);return}
  if(blk){upNote(blk,true);return}
  var ok=0,fail=0,last='';
  function next(i){
    if(i>=items.length){
      if(A.invalidate){A.invalidate(parentPath(items[0].path));A.invalidate(dest)}
      mvRemember(dest);st.sel=[];
      var verb=mode=='copy'?'Copied':'Moved';
      var msg=fail&&ok?verb+' '+ok+', '+fail+' could not: '+last:fail?last:verb+' '+(ok==1?'“'+items[0].name+'”':ok+' items')+' to '+title(dest)+'.';
      load(st.path,function(d){st.data=d;render(true);upNote(msg,!!fail)});
      if(done)done();
      return}
    var x=items[i],fn=mode=='copy'?A.copy:A.move;
    if(!fn){upNote('This server cannot '+(mode=='copy'?'copy':'move')+' files.',true);return}
    fn(x,dest).then(function(){ok++;next(i+1)},function(e){fail++;last=mvMsg(e,x,dest);next(i+1)})}
  next(0)}

var SHEETS={
 move:function(s,arg){arg=arg||{};var mode=arg.mode=='copy'?'copy':'move',items=arg.items||[],here=normPath(st.path),cur=here;
  var verb=mode=='copy'?'Copy':'Move',n=items.length,who=n==1?'“'+esc(items[0].name)+'”':n+' items';
  s.classList.add('mv');
  s.innerHTML=head(verb+' to…','Choose a folder for '+who+'.')+
    '<div class="sh-b">'+
      '<div class="mv-crumb crumb" role="navigation" aria-label="Folder"></div>'+
      '<div class="mv-recent"></div>'+
      '<div class="mv-list" role="list"></div>'+
      '<div class="mv-new" hidden><label class="field"><input type="text" aria-label="New folder name" placeholder="Folder name"><button class="btn fill sm mk">Create</button><button class="btn quiet sm mkx">Cancel</button></label></div>'+
      '<p class="hint mv-why">In the same volume this is a rename, which is safe for Dropbox. Across volumes, copyparty may copy first — that can download online-only files.</p>'+
    '</div>'+
    '<div class="mv-foot"><button class="btn quiet mv-nf">'+ic('plus')+' New folder</button><span class="sp"></span><button class="btn fill mv-go" disabled>'+verb+' here</button></div>';
  var crumb=s.querySelector('.mv-crumb'),list=s.querySelector('.mv-list'),rec=s.querySelector('.mv-recent');
  var goBtn=s.querySelector('.mv-go'),nfBtn=s.querySelector('.mv-nf'),nfBox=s.querySelector('.mv-new'),nfInp=nfBox.querySelector('input');
  function crumbs(p){var parts=[{p:'/',n:A.rootName||'Everything'}],acc='/';
    (p||'/').replace(/^\/|\/$/g,'').split('/').filter(Boolean).forEach(function(seg){acc+=seg+'/';parts.push({p:acc,n:decodeURIComponent(seg)})});
    crumb.innerHTML=parts.map(function(x,i){return (i?'<span class="s">/</span>':'')+'<a href="#" data-p="'+esc(x.p)+'">'+esc(x.n)+'</a>'}).join('');
    [].forEach.call(crumb.querySelectorAll('a'),function(a){a.onclick=function(e){e.preventDefault();browse(a.getAttribute('data-p'))}})}
  function recent(){var rs=mvRecent().filter(function(p){return !samePath(p,cur)});
    if(!rs.length){rec.innerHTML='';return}
    rec.innerHTML='<div class="lab">Recent</div>'+rs.map(function(p){return '<button type="button" class="mv-r" data-p="'+esc(p)+'">'+ic('history')+'<span>'+esc(p=='/'?(A.rootName||'Everything'):title(p))+'</span></button>'}).join('');
    [].forEach.call(rec.querySelectorAll('.mv-r'),function(b){b.onclick=function(){browse(b.getAttribute('data-p'))}})}
  function updateGo(perms){
    var write=perms&&perms.indexOf('write')>=0,blk=placeBlock(items,cur,mode),alr=blk=='already';
    goBtn.disabled=!write||!!blk;
    goBtn.textContent=verb+' here';
    nfBtn.disabled=!write;
    nfBtn.title=write?'':'You cannot write in this folder.';
    if(!write)goBtn.title='You cannot write in this folder.';
    else if(alr)goBtn.title='Those items are already here.';
    else if(blk)goBtn.title=blk;
    else goBtn.title='';
  }
  function browse(p){p=normPath(p);cur=p;crumbs(p);list.innerHTML='<p class="hint">Opening…</p>';goBtn.disabled=true;
    A.ls(p).then(function(d){
      var dirs=(d.dirs||[]).slice().sort(function(a,b){return a.name.localeCompare(b.name)});
      if(!dirs.length)list.innerHTML='<p class="hint">No folders in '+esc(title(p))+'. You can still '+(mode=='copy'?'copy':'move')+' here, or make a new one.</p>';
      else list.innerHTML=dirs.map(function(x){
        var blocked=x.isDir&&items.some(function(it){return it.isDir&&(samePath(it.path,x.path)||isInside(it.path,x.path))});
        return '<button type="button" class="mv-dir'+(blocked?' off':'')+'" data-p="'+esc(x.path)+'" '+(blocked?'disabled':'')+' role="listitem">'+ic('folder')+'<span>'+esc(x.name)+'</span>'+ic('chevron-right')+'</button>';
      }).join('');
      [].forEach.call(list.querySelectorAll('.mv-dir:not(.off)'),function(b){b.onclick=function(){browse(b.getAttribute('data-p'))}});
      var perms=d.perms||[];
      if(typeof perms==='object'&&!Array.isArray(perms)){perms=[];if(d.perms.write)perms.push('write');if(d.perms.move)perms.push('move')}
      /* ls() on the real adapter returns the raw array from copyparty */
      if(d.perms&&d.perms.write===undefined&&Array.isArray(d.perms))perms=d.perms;
      updateGo(perms);recent();
    },function(e){list.innerHTML='<p class="hint">Could not open this folder.</p>';updateGo([])})}
  goBtn.onclick=function(){if(goBtn.disabled)return;closeSheet();runPlace(mode,items,cur,function(){if(mode=='cut'||(st.clip&&st.clip.mode=='cut'))st.clip=null})};
  nfBtn.onclick=function(){nfBox.hidden=false;nfInp.value='';setTimeout(function(){focusQuiet(nfInp)},50)};
  nfBox.querySelector('.mkx').onclick=function(){nfBox.hidden=true};
  nfBox.querySelector('.mk').onclick=function(){
    var n=(nfInp.value||'').trim();if(!n)return;
    A.mkdir(cur,n).then(function(){nfBox.hidden=true;browse(normPath(cur)+encodeURIComponent(n)+'/')},function(e){upNote(String(e.message||e),true)})};
  nfInp.onkeydown=function(e){if(e.key=='Enter'){e.preventDefault();nfBox.querySelector('.mk').click()}};
  browse(here)},

 upload:function(s){var where=title(st.path);
  s.innerHTML=head('Upload','Files go into <b style="font-weight:500;color:var(--n-ink)">'+esc(where)+'</b>.')+'<div class="sh-b">'+
   '<div class="drop">'+topo(384,230)+'<div class="big">'+ic('cloud-upload')+'</div><h4>Drop files or folders here</h4><p>or pick them from your computer. Each file grows into the garden as it arrives.</p>'+
   '<div class="acts"><button class="btn fill" data-u="f">Choose files</button><button class="btn" data-u="d">Choose folder</button></div></div>'+
   '<div class="usum"></div><div class="unote" role="status" aria-live="polite"></div><div class="uq"></div>'+
   '<details class="opt"><summary>Options '+ic('chevron-down')+'</summary><div class="opts"></div></details></div>';
  s.querySelector('[data-u=f]').onclick=function(){A.pickFiles()};s.querySelector('[data-u=d]').onclick=function(){A.pickFolder()};
  var dz=s.querySelector('.drop');dz.style.color='var(--n-ink)';
  renderOpts(s.querySelector('.opts'));pollUps(true)},
 search:function(s){s.innerHTML=head('Search',(A.engine&&A.engine()=='smart')?'Describe it, or type a name. Smart search looks inside files you can open.':'Names, artists, albums and titles, across every folder you can open.')+'<div class="sh-b"><label class="field">'+ic('search')+'<input type="search" data-autofocus placeholder="Try “evening” or “kyoto”" aria-label="Search"></label><div class="res" style="margin-top:14px"></div></div>';
  var inp=s.querySelector('input'),res=s.querySelector('.res'),n=0;
  function paint(q,hits,note){
    if(!hits.length){
      res.innerHTML='<p class="hint">Nothing called “'+esc(q)+'”. Try fewer letters, or another word'+(note?'':' from the name')+'.</p>'+(note?'<p class="hint">'+note+'</p>':'');
      return;
    }
    var re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
    var lab='<div class="lab">'+pl(hits.length,'other').replace('files','results').replace('file','result')+'</div>';
    res.innerHTML=(note?'<p class="hint">'+note+'</p>':'')+lab+hits.slice(0,80).map(function(h,i){
      var t=h.isDir?'folder':ftype(h.name);h.type=t;
      var sub=esc(decodeURIComponent(h.dir)||'/')+(h.tags&&h.tags.artist?' · '+esc(h.tags.artist):'')+(h.snip?' · '+esc(h.snip):'');
      var th=(!h.isDir&&(t=='image'||t=='video')&&A.thumb)?A.thumb(h):null;
      var icc=th?'<span class="ic ths" data-th="'+esc(th)+'">'+ic(ICO[t])+'<img alt="" decoding="async"></span>':'<span class="ic" style="background:'+tone(t)+';color:'+(lum(tone(t))<.5?'var(--on-dark)':'var(--on-light)')+'">'+ic(ICO[t])+'</span>';
      return '<div class="sr" data-i="'+i+'">'+icc+'<div><b>'+esc(h.name).replace(re,'<mark>$1</mark>')+'</b><span>'+sub+'</span></div><span class="sz">'+fs(h.size)+'</span></div>';
    }).join('');
    bindThumbs(res,{root:s.querySelector('.sh-b')||s});
    [].forEach.call(res.querySelectorAll('.sr'),function(el){
      el.onclick=function(){
        var h=hits[+el.dataset.i];
        closeSheet();
        if(h.isDir){go(h.path);return}
        h.type=h.type||ftype(h.name);
        if(h.type=='image'){var imgs=hits.filter(function(x){return !x.isDir&&(x.type||ftype(x.name))=='image'});return lbOpen(imgs,Math.max(0,imgs.indexOf(h)))}
        if(h.type=='video')return openSheet('video',h);
        if(h.type=='audio')return playList([h],0);
        if(h.type=='doc'||h.type=='code')return openSheet('read',h);
        var tgt=h.dir,after=function(){st.sel=[h.path];refresh()};
        if(tgt==st.path) after();
        else{go(tgt);var w=setInterval(function(){if(st.path==tgt&&st.data){clearInterval(w);setTimeout(after,400)}},80)}
      };
    });
  }
  function run(){
    var q=inp.value.trim(),me=++n;
    if(q.length<2){res.innerHTML='<p class="hint">Type at least two letters. Results include folders you have not opened yet.</p>';return}
    res.innerHTML='<p class="hint">Looking…</p>';
    var se=A.engine?A.engine():'smart';
    function deflt(){return A.search(q).then(function(hits){return {hits:hits||[],engine:'default'}})}
    var req=(se==='smart'&&A.smartSearch)
      ? A.smartSearch(q).then(function(r){return r},function(){return deflt().then(function(r){r.fallback=true;return r})})
      : deflt();
    req.then(function(r){
      if(me!=n)return;
      paint(q,r.hits||[],r.fallback?'Smart search is off; showing filename matches.':'');
    },function(){
      if(me!=n)return;
      res.innerHTML='<p class="hint">Search is not available on this server.</p>';
    });
  }
    inp.oninput=debounce(run,220);run()},
 unpost:function(s){
  st._unAsk=null;
  s.classList.add('unp');
  s.innerHTML=head('Undo upload','Your recent uploads, including unfinished ones.')+'<div class="sh-b"><p class="hint">Loading…</p></div>';
  function decp(vp){vp=String(vp||'').split('?')[0];try{return decodeURIComponent(vp)}catch(e){return vp}}
  function nameOf(vp){var p=decp(vp).split('/').filter(Boolean);return p.length?p[p.length-1]:vp}
  function paint(j){
    var f=(j&&j.f)||[],box=s.querySelector('.sh-b');
    if(!f.length){box.innerHTML='<p class="hint">Nothing to undo.</p>';return}
    box.innerHTML='<p class="hint">These are yours. Removing one deletes it from the server.</p><div class="un-l">'+f.map(function(u,i){
      var vp=decp(u.vp),done=u.pd===undefined,meta=(done?fs(u.sz||0):((u.pd||0)+'% · not finished'))+' · '+rel(u.at);
      return '<button type="button" class="un-row" data-i="'+i+'"><span class="un-n">'+esc(nameOf(vp))+'</span><span class="un-p">'+esc(vp)+'</span><span class="un-m">'+esc(meta)+'</span></button>';
    }).join('')+'</div><div class="un-ask" hidden></div>';
    [].forEach.call(box.querySelectorAll('.un-row'),function(b){b.onclick=function(){askUndo(f[+b.dataset.i])}});
  }
  function askUndo(u){
    var vp=decp(u.vp),done=u.pd===undefined,ask=s.querySelector('.un-ask');
    ask.hidden=false;
    ask.innerHTML='<p>Remove “'+esc(nameOf(vp))+'”'+(done?' from the server':' — cancel this unfinished upload')+'?</p><div class="un-acts"><button type="button" class="btn fill ok">Undo</button><button type="button" class="btn quiet no">Cancel</button><span class="ph"><kbd>↵</kbd><kbd>Esc</kbd></span></div>';
    st._unAsk={vp:vp,box:ask};
    ask.querySelector('.ok').onclick=function(){doUndo(vp)};
    ask.querySelector('.no').onclick=function(){ask.hidden=true;st._unAsk=null};
    setTimeout(function(){var o=ask.querySelector('.ok');if(o)focusQuiet(o)},60);
  }
  function doUndo(vp){
    var ask=s.querySelector('.un-ask');if(ask){ask.querySelectorAll('button').forEach(function(b){b.disabled=true})}
    A.unpost([vp]).then(function(){st._unAsk=null;upNote('Upload undone');if(A.invalidate)A.invalidate();reload();if(st.sheet==='unpost')SHEETS.unpost(s)},
      function(e){st._unAsk=st._unAsk||{box:ask};if(ask){ask.hidden=false;ask.innerHTML='<p>Could not undo: '+esc(e.message||e)+'</p><div class="un-acts"><button type="button" class="btn quiet no">Close</button></div>';ask.querySelector('.no').onclick=function(){ask.hidden=true;st._unAsk=null}}});
  }
  A.ups().then(paint,function(){s.querySelector('.sh-b').innerHTML='<p class="hint">Could not load recent uploads.</p>'})
},
 dupes:function(s){
  s.classList.add('dup');
  s.innerHTML=head('Duplicates','Files with the same contents. This list is read-only — delete an extra copy from the usual menu if you want.')+'<div class="sh-b"><p class="hint">Loading…</p></div>';
  if(!A.user){s.querySelector('.sh-b').innerHTML='<p class="hint">Sign in to see duplicates.</p>';return}
  function parentOf(p){return (p||'/').replace(/[^\/]+\/?$/,'')||'/'}
  function nameOf(p){var a=String(p||'').split('/').filter(Boolean);return a.length?a[a.length-1]:p}
  function paint(j){
    var g=(j&&j.groups)||[],box=s.querySelector('.sh-b');
    if(!g.length){box.innerHTML='<p class="hint">No duplicates in the folders you can see. If the server is still hashing files, this list will fill in on its own.</p>';return}
    box.innerHTML='<div class="dup-l">'+g.map(function(grp,i){
      var n=grp.n||((grp.paths||[]).length),meta=fs(grp.size||0)+' · '+n+' cop'+(n===1?'y':'ies');
      return '<div class="dup-g" data-i="'+i+'"><div class="dup-h">'+esc(meta)+'</div>'+(grp.paths||[]).map(function(vp){
        return '<button type="button" class="dup-row" data-p="'+esc(vp)+'"><span class="dup-n">'+esc(nameOf(vp))+'</span><span class="dup-p">'+esc(vp)+'</span></button>';
      }).join('')+'</div>';
    }).join('')+'</div>';
    [].forEach.call(box.querySelectorAll('.dup-row'),function(b){b.onclick=function(){var vp=b.getAttribute('data-p');if(!vp)return;closeSheet();go(parentOf(vp))}})}
  A.dupes().then(paint,function(){s.querySelector('.sh-b').innerHTML='<p class="hint">Could not load duplicates.</p>'})
},
 settings:function(s){var th=A.theme(),u=A.user,c=A.perms();
  s.innerHTML=head('Settings','Changes apply right away and stay on this device.')+'<div class="sh-b">'+
   '<div class="lab">Light</div><div class="choice" style="--n:3">'+
    ['paper:Paper:Cream daylight','yugure:Yūgure:Evening teal','sky:Follow the sky:Changes at dusk'].map(function(v){v=v.split(':');return '<button data-t="'+v[0]+'" class="'+(th==v[0]?'on':'')+'"><div class="sky">'+G.swatch(v[0]=='paper'?{w:200,h:80,seed:'pp',n:14,bg:'#F1EADB',tones:['#22302F','#7D8984','#DCD3C0'],ring:'#55625F',stroke:'#CEC4AE'}:v[0]=='yugure'?{w:200,h:80,seed:'yy',n:14,bg:'#0F1D1E',tones:['#E4DAC4','#6C8781','#2A4444'],ring:'#B9C5B9'}:{w:200,h:80,seed:'ss',n:14,bg:'#173031',tones:['#E4DAC4','#7D8984','#2F4B4A'],ring:'#B9C5B9',lit:3,litc:'#E07E24'})+'</div>'+v[1]+'<span>'+v[2]+'</span></button>'}).join('')+'</div>'+
   '<div class="lab">View</div><div class="choice se" style="--n:2">'+'<button data-vw="garden" class="'+(st.view!='list'?'on':'')+'">Garden<span>Pebbles sized by how much they take</span></button>'+'<button data-vw="list" class="'+(st.view=='list'?'on':'')+'">List<span>A tidy table of names and sizes</span></button></div>'+
   '<div class="lab">Search engine</div><div class="choice se" style="--n:2">'+'<button data-se="smart" class="'+( (A.engine?A.engine():'smart')=='smart'?'on':'')+'">Smart<span>Meaning and words, with EmbeddingGemma 2</span></button>'+'<button data-se="default" class="'+( (A.engine?A.engine():'smart')=='default'?'on':'')+'">Default<span>Filenames from copyparty’s index</span></button></div>'+'<p class="hint se-note"></p>'+(u&&c&&c.dot?'<div class="lab">Files</div><div class="tg'+(A.dots&&A.dots()?' on':'')+'" data-x="dots" role="switch" aria-checked="'+(A.dots&&A.dots()?'true':'false')+'"><div><b>Show hidden files</b><span>Names that start with a period, like .notes</span></div><span class="sw2"></span></div>':'')+'<div class="lab">Uploads</div><div class="opts"></div>'+
   '<div class="lab">Elsewhere</div>'+
    (A.classic?'<div class="tg" data-x="classic"><div><b>Classic copyparty view</b><span>Every tool, the original layout, same Nagi colours</span></div>'+ic('arrow-right')+'</div>':'')+
    (A.panelUrl?'<div class="tg" data-x="panel"><div><b>Control panel</b><span>Volumes, recent uploads, shares, connect as a drive</span></div>'+ic('arrow-right')+'</div>':'')+
   '<div class="lab">Account</div>'+(u?'<div class="tg" data-x="out"><div><b>Signed in as '+esc(u)+'</b><span>Sign out on this browser</span></div>'+ic('log-out')+'</div>':'<div class="tg" data-x="in"><div><b>You are browsing as a guest</b><span>Sign in to upload, share and tidy up</span></div>'+ic('log-in')+'</div>')+
   '<p class="hint dav-tip">On an iPhone: in the Files app, tap ⋯ then Connect to Server, and enter this site’s address (WebDAV is already on). Use the same sign-in as Nagi.</p>'+
   '<p class="hint" style="margin-top:22px">Nagi 凪 · a calm skin for copyparty. Icons: Lucide (ISC).</p></div>';
  [].forEach.call(s.querySelectorAll('[data-t]'),function(b){b.onclick=function(){A.setTheme(b.dataset.t);[].forEach.call(s.querySelectorAll('[data-t]'),function(o){o.classList.toggle('on',o==b)});setTimeout(function(){wallpaper();render(false)},30)}});
  [].forEach.call(s.querySelectorAll('[data-se]'),function(b){b.onclick=function(){if(A.setEngine)A.setEngine(b.dataset.se);[].forEach.call(s.querySelectorAll('[data-se]'),function(o){o.classList.toggle('on',o==b)})}});
  [].forEach.call(s.querySelectorAll('[data-vw]'),function(b){b.onclick=function(){setView(b.dataset.vw);[].forEach.call(s.querySelectorAll('[data-vw]'),function(o){o.classList.toggle('on',o==b)})}});
  if(A.smartStatus)A.smartStatus().then(function(st){var n=s.querySelector('.se-note');if(!n)return;if(st&&st.sidecar!==false&&st.ok!==false)n.textContent=st.files!=null?('Smart is ready · '+st.files+' files indexed'+(st.vecs!=null?' · '+st.vecs+' passages':'')):'Smart is ready.';else n.textContent='Smart is not running on this server; Default still works.'},function(){var n=s.querySelector('.se-note');if(n)n.textContent='Smart is not running on this server; Default still works.'});
  renderOpts(s.querySelector('.opts'));
  [].forEach.call(s.querySelectorAll('[data-x]'),function(r){r.onclick=function(){var x=r.dataset.x;if(x=='classic')A.classic();if(x=='panel')location.href=A.panelUrl;if(x=='out')signOut();if(x=='in')signIn();if(x=='dots'&&A.setDots){var on=!r.classList.contains('on');A.setDots(on);r.classList.toggle('on',on);r.setAttribute('aria-checked',on?'true':'false');load(st.path,function(d){st.data=d;render(false)})}}})},
 share:function(s,paths){var nm=paths.length==1?title(paths[0]):pl(paths.length,'other').replace('files','items');
  s.innerHTML=head('Share','Make a link to <b style="font-weight:500;color:var(--n-ink)">'+esc(nm)+'</b> that anyone can open.')+'<div class="sh-b">'+
   '<div class="lab">Link stops working</div><div class="choice" style="--n:4">'+[['60','In an hour'],['1440','Tomorrow'],['10080','In a week'],['0','Never']].map(function(v,i){return '<button data-e="'+v[0]+'" class="'+(i==2?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'+
   '<div class="lab">Visitors can</div><div class="tg on" data-pm="read"><div><b>Open and download</b><span>Always on</span></div><span class="sw2"></span></div><div class="tg" data-pm="write"><div><b>Add files</b><span>Lets them upload into the shared folder</span></div><span class="sw2"></span></div>'+
   '<div class="lab">Password</div><label class="field">'+ic('lock')+'<input type="text" placeholder="Optional" aria-label="Share password"></label>'+
   '<div class="acts" style="margin-top:22px"><button class="btn fill mk">Create link</button></div><div class="out"></div></div>';
  var exp='10080';[].forEach.call(s.querySelectorAll('[data-e]'),function(b){b.onclick=function(){exp=b.dataset.e;[].forEach.call(s.querySelectorAll('[data-e]'),function(o){o.classList.toggle('on',o==b)})}});
  s.querySelector('[data-pm=write]').onclick=function(){this.classList.toggle('on')};
  s.querySelector('.mk').onclick=function(){var b=this;b.disabled=true;b.textContent='Creating…';var perms=['read'];if(s.querySelector('[data-pm=write]').classList.contains('on'))perms.push('write');
   A.share(paths,{exp:exp,pw:s.querySelector('.field input').value,perms:perms}).then(function(url){b.textContent='Link ready';s.querySelector('.out').innerHTML='<div class="link"><input readonly value="'+esc(url)+'"><button class="btn fill cp">Copy</button></div>'+(A.qr?'<img class="qr" alt="QR code for the link" src="'+esc(A.qr(url))+'">':'');
    s.querySelector('.cp').onclick=function(){var i=s.querySelector('.link input');i.select();(navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(function(){toast(ic('check')+' Link copied')},function(){document.execCommand('copy');toast(ic('check')+' Link copied')})}},
   function(e){b.disabled=false;b.textContent='Create link';toast(ic('circle-alert')+' '+esc(e&&e.message||'Could not create the link'),4000)})}},
 video:function(s,x){st.sx=x;var ext=((x.name||'').match(/\.([^.\/]+)$/)||['',''])[1].toLowerCase(),apple=APPLE_WK();
  s.innerHTML=head(esc(x.name),fs(x.size)+' · '+esc(rel(x.ts)),1)+'<div class="sh-b">'+(apple&&NOSAF.test(ext)?vno(ext,apple,x):'<video controls playsinline preload="metadata" src="'+esc(A.url(x))+'"></video>')+'</div>';
  s.querySelector('.dl').onclick=function(){download([x])};if(!au.paused)au.pause();
  var v=s.querySelector('video'),bad=function(){var b=s.querySelector('.sh-b');if(!b||!b.contains(v))return;v.removeAttribute('src');try{v.load()}catch(_){}b.innerHTML=vno(ext,apple,x,1);wire()},
   wire=function(){var d=s.querySelector('.vdl');if(d)d.onclick=function(){download([x])}};
  wire();if(v){v.addEventListener('error',bad);var p=v.play&&v.play();if(p&&p.catch)p.catch(function(e){if(e&&e.name=='NotSupportedError')bad()})}},
 read:function(s,x){st.sx=x;st._ed=null;st._edForce=false;
  var md=/\.md$/i.test(x.name),txt=/\.txt$/i.test(x.name),canEd=!!(A.perms().write&&A.saveText&&(md||txt));
  s.innerHTML=head(esc(x.name),fs(x.size)+' · '+esc(rel(x.ts)),1)+'<div class="sh-b rd-b" style="position:relative;padding:0 6px 6px">'+(md&&A.mdUrl?'<iframe class="reader" title="'+esc(x.name)+'" src="'+esc(A.mdUrl(x))+'"></iframe>':'<pre class="txt" style="padding:10px 22px 30px">Loading…</pre>')+'<textarea class="ed" hidden spellcheck="false" aria-label="Edit '+esc(x.name)+'"></textarea></div>';
  var ifr=s.querySelector('iframe'),pre=s.querySelector('pre.txt'),ta=s.querySelector('textarea.ed'),bar=s.querySelector('.sh-t');
  if(ifr)ifr.addEventListener('load',function(){try{ifr.contentDocument.documentElement.classList.add('nagi-embed')}catch(e){}});
  s.querySelector('.dl').onclick=function(){download([x])};
  var body='',lm=Math.round(Number(x.ts||0)*1000);
  function setView(t){body=t||'';if(pre)pre.textContent=body.length>200000?body.slice(0,200000)+'\n…':body}
  if(!(md&&A.mdUrl))A.text(x).then(setView);else if(canEd)A.text(x).then(function(t){body=t});
  if(canEd){bar.insertAdjacentHTML('beforeend','<button class="ib sm ed-go" aria-label="Edit" title="Edit">'+ic('pencil')+'</button><button class="ib sm ed-save" hidden aria-label="Save" title="Save">'+ic('save')+'</button><button class="ib sm ed-cx" hidden aria-label="Cancel editing" title="Cancel">'+ic('x')+'</button><span class="ed-note" hidden role="status"></span>');
    var go=s.querySelector('.ed-go'),sv=s.querySelector('.ed-save'),cx=s.querySelector('.ed-cx'),note=s.querySelector('.ed-note');
    function showNote(m,err){note.hidden=!m;note.className='ed-note'+(err?' err':'');note.textContent=m||''}
    function enter(){function start(t){body=t||'';ta.value=body;ta.hidden=false;if(ifr)ifr.hidden=true;if(pre)pre.hidden=true;go.hidden=true;sv.hidden=false;cx.hidden=false;st._ed=1;showNote('');setTimeout(function(){ta.focus()},80)}
      if(body)start(body);else A.text(x).then(start,function(){start('')})}
    function leave(t){st._ed=null;st._edForce=false;ta.hidden=true;if(ifr){ifr.hidden=false;if(t!=null&&A.mdUrl)ifr.src=A.mdUrl(x)+(A.mdUrl(x).indexOf('?')>=0?'&':'?')+'_='+Date.now()}if(pre)pre.hidden=false;go.hidden=false;sv.hidden=true;cx.hidden=true;if(t!=null)setView(t);showNote('')}
    go.onclick=enter;cx.onclick=function(){leave()};
    sv.onclick=function(){var v=ta.value;
      function fail(e){sv.disabled=false;showNote((e&&e.message)||'Could not save',true)}
      function after(j,used){sv.disabled=false;
        if(j&&j.ok){lm=j.lastmod||Date.now();x.ts=lm/1000;leave(v);upNote('Saved');return}
        // listing ts is seconds; the server lastmod is milliseconds — retry once with the exact value
        if(!st._edForce&&j&&j.lastmod!=null&&used!=-1&&Math.abs(j.lastmod-used)<1000){
          sv.disabled=true;showNote('Saving…');A.saveText(x,v,j.lastmod).then(function(j2){after(j2,-1)},fail);return}
        st._edForce=true;showNote('This note changed on the server. Save again to overwrite.',true)}
      var use=st._edForce?-1:lm;sv.disabled=true;showNote('Saving…');
      A.saveText(x,v,use).then(function(j){after(j,use)},fail)}
    st._edLeave=leave}
}
};

function renderOpts(box){if(!box||!A.uploadOpts)return;var o=A.uploadOpts();box.innerHTML=o.map(function(x,i){if(x.choices)return '<div class="tg ch" data-i="'+i+'"><div><b>'+esc(x.label)+'</b><span>'+esc(x.choices[x.value])+'</span></div>'+ic('chevrons-up-down')+'</div>';return '<div class="tg'+(x.value?' on':'')+'" data-i="'+i+'"><div><b>'+esc(x.label)+'</b><span>'+esc(x.hint)+'</span></div><span class="sw2"></span></div>'}).join('');
  [].forEach.call(box.querySelectorAll('.tg'),function(r){r.onclick=function(){var x=o[r.dataset.i];x.set(x.choices?(x.value+1)%x.choices.length:!x.value);renderOpts(box)}})}
var lastOk=0;
function pollUps(force){if(!A.uploads)return;var u=A.uploads();var was=JSON.stringify(st.ups.map(function(x){return x.name+x.state})),now=JSON.stringify(u.map(function(x){return x.name+x.state}));
  var changedSet=was!=now;st.ups=u;var ok=u.filter(function(x){return x.state=='ok'}).length,ngc=u.filter(function(x){return x.state=='ng'}).length,busy=u.some(function(x){return x.state=='run'||x.state=='q'});
  if(!st.upB)st.upB={ok:ok,ng:ngc};
  if(!busy){var dk=Math.max(0,ok-st.upB.ok),dn=Math.max(0,ngc-st.upB.ng);st.upB={ok:ok,ng:ngc};var nf=function(n){return n==1?'1 file':n+' files'};if(dk||dn)upNote(dk?nf(dk)+' uploaded'+(dn?' · '+dn+' failed':''):nf(dn)+' failed',!!dn)}
  if(ok>lastOk){lastOk=ok;clearTimeout(pollUps.t);pollUps.t=setTimeout(function(){var p=st.path;st.data=null;load(p,function(d){st.data=d;render(false)})},700)}
  var sig=u.filter(function(x){return x.dir==st.path&&x.state!='ok'}).map(function(x){return x.name}).join('|');
  if(st.view=='garden'&&st.data&&sig!=(st.upSig||'')&&st.sheet!='upload'){st.upSig=sig;render(false)}
  else if(u.some(function(x){return x.state=='run'})&&st.view=='garden')updRings();
  if(st.sheet=='upload'){var q=$.sheet.querySelector('.uq'),sm=$.sheet.querySelector('.usum');if(!q)return;
    var ord={run:0,q:1,ng:2,ok:3};q.innerHTML=u.map(function(x,i){x._i=i;return x}).sort(function(a,b){return (ord[a.state]-ord[b.state])||(b._i-a._i)}).slice(0,60).map(function(x){var t=ftype(x.name),stt=x.state=='ok'?'<span class="st ok">Done</span>':x.state=='ng'?'<span class="st ng">Failed</span>':x.state=='q'?'<span class="st">Waiting</span>':'<span class="st">'+(x.speed?esc(x.speed)+' · ':'')+(x.eta?esc(x.eta)+' left':Math.round(x.pct)+'%')+'</span>';
      return '<div class="ur '+x.state+'"><span class="ic">'+ic(ICO[t])+'</span><span class="nm">'+esc(x.name)+'</span>'+stt+'<span class="pb"><i style="width:'+(x.state=='ok'?100:x.pct||0)+'%"></i></span></div>'}).join('');
    var dn=u.filter(function(x){return x.state=='ok'}).length,tot=u.reduce(function(a,x){return a+x.size},0);sm.innerHTML=u.length?'<span>'+dn+' of '+u.length+' done</span><span>'+fs(tot)+'</span>':''}}
function updRings(){st.cells.forEach(function(c,i){if(!c.item.up)return;var u=st.ups.filter(function(x){return 'up:'+x.name==c.item.key})[0];if(!u)return;var g=$.zoom.querySelector('.cell[data-i="'+i+'"]');if(!g)return;var rs=g.querySelectorAll('.ring'),k=Math.round(rs.length*(u.pct||0)/100);[].forEach.call(rs,function(r,j){r.classList.toggle('todo',j>=k)});
  var l=$.lbs.querySelector('.lb[data-i="'+i+'"] .m');if(l)l.textContent=Math.round(u.pct||0)+'% uploaded'})}

/* ---------- small dialogs ---------- */
function ask(t,body,okL,danger,input){return new Promise(function(res){var s=$.sheet;st.sheet='ask';s.className='sheet ask';
  s.innerHTML=head(t,body)+'<div class="sh-b">'+(input!=null?'<label class="field"><input type="text" data-autofocus value="'+esc(input)+'" aria-label="'+esc(t)+'"></label>':'')+'<div class="acts" style="margin-top:18px"><button class="btn fill ok"'+(danger?' style="background:var(--n-car);border-color:var(--n-car)"':'')+'>'+esc(okL)+'</button><button class="btn quiet no">Cancel</button></div></div>';
  var i=s.querySelector('input');function done(v){closeSheet();res(v)}
  s.querySelector('.ok').onclick=function(){done(i?i.value:true)};s.querySelector('.no').onclick=s.querySelector('.sh-x').onclick=function(){done(null)};
  if(i)i.onkeydown=function(e){if(e.key=='Enter')done(i.value)};else setTimeout(function(){var o=s.querySelector('.ok');if(o)focusQuiet(o)},200);
  void s.offsetWidth;pinWin();
  requestAnimationFrame(function(){s.classList.add('on');$.veil.classList.add('on');if(i)setTimeout(function(){focusQuiet(i);i.select()},200)})})}
function newFolder(){ask('New folder','It will be created inside '+esc(title(st.path))+'.','Create',false,'').then(function(n){if(!n)return;A.mkdir(st.path,n).then(function(){toast(ic('check')+' Folder created');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function rename(x){ask('Rename','Give “'+esc(x.name)+'” a new name.','Rename',false,x.name).then(function(n){if(!n||n==x.name)return;A.rename(x,n).then(function(){st.sel=[];toast(ic('check')+' Renamed');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function del(sel){ask('Delete '+(sel.length==1?'“'+esc(sel[0].name)+'”':sel.length+' items')+'?','This removes them from the server for good. There is no bin.','Delete',true).then(function(ok){if(!ok)return;A.del(sel).then(function(){st.sel=[];toast(ic('check')+' Deleted');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function reload(){var p=st.path;st.kids={};memInvalidate(p);if(A.invalidate)A.invalidate(p);load(p,function(d){st.data=d;render(true)},true)}

/* ---------- keys + drops ---------- */
function keys(){addEventListener('keydown',function(e){
  if(A.modalOpen&&A.modalOpen())return;
  if(document.documentElement.classList.contains('nagi-classic'))return;
  var t=e.target,typing=t&&(t.tagName=='INPUT'||t.tagName=='TEXTAREA'||t.isContentEditable);
  if(root.classList.contains('off'))return;
  var mod=e.metaKey||e.ctrlKey;
  if(mod&&!e.altKey&&!typing&&!st.sheet&&!st.pop&&!st.lb){
    var k=(e.key||'').toLowerCase(),can=A.perms&&A.perms();
    if(k=='x'&&can&&can.move){var sel=st.sel.map(find).filter(Boolean);if(sel.length){e.preventDefault();e.stopImmediatePropagation();setClip('cut',sel);return}}
    if(k=='c'){var sel=st.sel.map(find).filter(Boolean);if(sel.length){e.preventDefault();e.stopImmediatePropagation();setClip('copy',sel);return}}
    if(k=='v'&&st.clip){e.preventDefault();e.stopImmediatePropagation();doPaste(st.path);return}
  }
  if(st.pop){if(e.key=='Escape'){popClose()}else if(e.key=='Enter'){e.preventDefault();st.pop.ok()}else if(e.key=='Tab'){e.preventDefault();var bs=st.pop.el.querySelectorAll('button'),i=[].indexOf.call(bs,document.activeElement);bs[(i+(e.shiftKey?bs.length-1:1))%bs.length].focus()}else return;e.stopImmediatePropagation();return}
  if(e.key=='Escape'){if(st.lb)lbClose();else if(st.sheet=='unpost'&&st._unAsk){st._unAsk.box.hidden=true;st._unAsk=null}else if(st.sheet=='read'&&st._ed){cancelEdit()}else if(st.sheet)closeSheet();else if(st.sel.length){st.sel=[];refresh()}else if(st.clip)clearClip();e.stopImmediatePropagation();return}
  if(typing&&!(st.sheet=='unpost'&&st._unAsk)){return}
  if(st.sheet=='ask'&&e.key=='Enter'){var ok=$.sheet.querySelector('.ok');if(ok){e.preventDefault();ok.click()}e.stopImmediatePropagation();return}
  if(st.sheet=='unpost'&&st._unAsk&&e.key=='Enter'){var uo=$.sheet.querySelector('.un-ask .ok');if(uo){e.preventDefault();uo.click()}e.stopImmediatePropagation();return}
  var k=e.key,used=true;
  if(st.lb&&(k=='ArrowLeft'||k=='ArrowRight'))lbStep(k=='ArrowLeft'?-1:1);
  else if(k=='/'){e.preventDefault();openSheet('search')}
  else if(e.shiftKey&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&(k=='S'||k=='s')&&(st.lb||(st.sheet=='video'||st.sheet=='read')&&st.sx)){e.preventDefault();download([st.lb?st.lb.list[st.lb.i]:st.sx])}
  else if(e.shiftKey&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&/^[A-Za-z]$/.test(k)&&st.akeys&&st.akeys[k.toUpperCase()]){e.preventDefault();st.akeys[k.toUpperCase()]()}
  else if(k=='g'||k=='G')setView(st.view=='garden'?'list':'garden');
  else if(k=='Backspace'||(k=='ArrowUp'&&e.altKey)){e.preventDefault();up()}
  else if(k==' '&&st.qi>=0){e.preventDefault();toggle()}
  else if(k=='a'&&(e.metaKey||e.ctrlKey)){e.preventDefault();st.sel=st.data.items.map(function(x){return x.path});refresh()}
  else if(e.metaKey||e.ctrlKey||e.altKey)used=false;
  if(used!==false)e.stopImmediatePropagation()},true)}
function drops(){var n=0;function show(on){$.dz.classList.toggle('on',on);if(on)$.dz.querySelector('p').textContent='Into '+title(st.path)}
  function isFiles(e){return e.dataTransfer&&[].indexOf.call(e.dataTransfer.types,'Files')>=0}
  addEventListener('dragenter',function(e){if(!isFiles(e))return;n++;show(true)},true);
  addEventListener('dragover',function(e){if(!isFiles(e))return;e.preventDefault();try{e.dataTransfer.dropEffect='copy'}catch(_){}},true);
  addEventListener('dragleave',function(){if(--n<=0){n=0;show(false)}},true);
  addEventListener('drop',function(e){if(!isFiles(e)&&!(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length))return;n=0;show(false);e.preventDefault();if(A.onDrop)A.onDrop(e);if(st.sheet!='upload')setTimeout(function(){openSheet('upload')},300)},true)}

window.NagiApp={start:function(adapter){if(window.__nagiStarted)return;window.__nagiStarted=1;A=adapter;
  var _inv=A.invalidate;A.invalidate=function(path){memInvalidate(path);if(_inv)_inv(path)};
  build();try{performance.mark('nagi-bb')}catch(e){}try{if(window.NagiFit)NagiFit()}catch(e){}memHydrate();var p=A.start();st.path=null;go(p,false);
  addEventListener('popstate',function(){
    if(st._skipPop){st._skipPop=false;return}
    if(st.lb||st.sheet||drawerIsOv()){
      ovPushed=false;
      if(st.lb)lbClose(true);
      if(st.sheet)closeSheet(true);
      if(drawerIsOv()){$.ctx.classList.remove('open');$.ctx.style.transform='';$.ctx.classList.remove('drag','peek')}
      return;
    }
    ovPushed=false;
    var p=A.here();if(p!=st.path)go(p,false,'back');
  });
  addEventListener('pageshow',function(e){
    if(!e.persisted)return;
    var p=A.here&&A.here()||st.path||'/';
    if(!A.ls)return;
    A.ls(p,true).then(function(d){
      var u=d.acct&&d.acct!='*'?d.acct:null;
      if(u!==A.user){memClear();if(_inv)_inv();location.reload()}
    },function(){memClear();if(_inv)_inv();location.reload()});
  });
  if(A.onTheme)A.onTheme(function(){wallpaper();render(false)})},
 state:st,go:function(p){go(p)},open:function(k,a){openSheet(k,a)},close:closeSheet,view:setView,select:function(ps){st.sel=ps;refresh()},play:function(i){var au2=st.data.items.filter(function(x){return x.type=='audio'});playList(au2,i||0)},
 lightbox:function(i){var im=st.data.items.filter(function(x){return x.type=='image'});lbOpen(im,i||0)},audio:au,refresh:function(){render(false)},el:function(){return root}};
})();
