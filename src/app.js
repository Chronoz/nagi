/* 凪 Nagi app — one calm window: context column (numeral, sentence, checklist, two buttons) + a packed garden.
   window.NagiApp.start(adapter). The adapter supplies data (real copyparty or the fictional mockup). */
(function(){
"use strict";
var G=window.NagiGarden,A,root,$={},st={path:'/',data:null,kids:{},sel:[],view:localStorage.nagi_view||'garden',sheet:null,hover:null,ups:[],q:[],qi:-1,lb:null,cells:[]};
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
function rowIc(x){return x.isDir?'<span class="ty d">'+ic('folder','c')+ic('folder-open','o')+'</span>':'<span class="ty">'+ic(ICO[grp(x)])+'</span>'}
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
function load(path,cb){
  A.ls(path).then(function(d){
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
      '<div class="chh"></div><div class="chk" role="listbox" aria-multiselectable="true"></div><div class="acts"></div><div class="acts2 acts"></div>'+
      '<div class="np"><div class="top"><span class="eq"><i></i><i></i><i></i></span><div class="t"><b></b><span></span></div>'+dlb(0)+'<div class="ctl">'+
       '<button class="ib" data-p="prev" aria-label="Previous" title="Previous">'+ic('skip-back')+'</button><button class="ib big" data-p="toggle" aria-label="Play or pause" title="Play / pause (space)">'+ic('pause')+'</button><button class="ib" data-p="next" aria-label="Next" title="Next">'+ic('skip-forward')+'</button></div></div>'+
       '<div class="seek"><span class="a">0:00</span><div class="bar"><i></i><b></b></div><span class="z">0:00</span></div></div>'+
      '</aside>'+
     '<div class="veil"></div><div class="sheet"></div>'+
     '<div class="lbx"><div class="im"></div><div class="cap"></div><button class="ib nav p" aria-label="Previous photo">'+ic('arrow-left')+'</button><button class="ib nav n" aria-label="Next photo">'+ic('arrow-right')+'</button><button class="ib x" aria-label="Close">'+ic('x')+'</button></div>'+
     '<div class="dz"><div>'+ic('cloud-upload')+'<h4>Drop to upload</h4><p></p></div></div>'+
    '</div><div class="toast"></div></div><nav class="bb" aria-label="Actions"></nav></div>');
  document.body.appendChild(root);
  ['win','fa','ctx','crumb','num','say','para','meter','chh','chk','acts','acts2','np','stage','lbs','tip','legend','veil','sheet','lbx','dz','toast','menu'].forEach(function(k){$[k]=root.querySelector('.'+k)});
  $.tbn=root.querySelector('.tbn');$.mm=root.querySelector('.mm');$.msel=root.querySelector('.msel');$.mo=root.querySelector('.mo');$.bb=root.querySelector('.bb');root.appendChild($.mm);$.tbt=root.querySelector('.tbt');$.tav=root.querySelector('.tav');$.tav.onclick=function(){if(A.user)openSheet('settings');else signIn()};root.querySelector('.tbk').onclick=function(){up()};$.svg=root.querySelector('svg.g');$.zoom=root.querySelector('.zoom');$.gh=$.legend;$.cnt=root.querySelector('.cnt');
  root.querySelector('.srv').textContent='';
  addEventListener('resize',debounce(function(){render(false)},160));
  $.menu.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;var m=b.dataset.m;if(m=='me')return A.user?openSheet('settings'):signIn();openSheet(m)});
  $.gh.querySelector('.seg').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setView(b.dataset.v)});
  $.veil.onclick=closeSheet;
  root.querySelector('.drawer-h').onclick=function(){$.ctx.classList.toggle('open')};
  $.ctx.addEventListener('click',function(e){if(e.target.closest('.dtg'))$.ctx.classList.toggle('open')});
  drawerDrag();
  // v3g mobile: actions live in a small overflow menu, never as big buttons
  $.mo.onclick=function(e){e.stopPropagation();var on=!$.mm.classList.contains('on');$.mm.classList.toggle('on',on);$.mo.setAttribute('aria-expanded',on)};
  document.addEventListener('click',function(e){if(st.pop&&!e.target.closest('.pop,.fa'))popClose()});
  document.addEventListener('click',function(e){if($.mm.classList.contains('on')&&!e.target.closest('.mm,.bb .more')){$.mm.classList.remove('on');$.mo.setAttribute('aria-expanded','false')}});
  $.np.addEventListener('click',function(e){if(e.target.closest('.dl')){if(st.q[st.qi])download([st.q[st.qi]]);return}var b=e.target.closest('[data-p]');if(!b)return;({prev:prev,next:next,toggle:toggle})[b.dataset.p]()});
  $.np.querySelector('.bar').addEventListener('pointerdown',function(e){var r=this.getBoundingClientRect();if(au.duration)au.currentTime=au.duration*Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));tick()});
  $.lbx.querySelector('.p').onclick=function(){lbStep(-1)};$.lbx.querySelector('.n').onclick=function(){lbStep(1)};$.lbx.querySelector('.x').onclick=lbClose;
  $.lbx.querySelector('.im').onclick=function(e){if(e.target.tagName!='IMG')lbClose()};
  stageEvents();keys();drops();
  setInterval(pollUps,400);
}
function debounce(f,ms){var t;return function(){clearTimeout(t);t=setTimeout(f,ms)}}
function wallpaper(){}
// v3g: one small, quiet note style everywhere; auto-dismiss after 2 s (errors 4 s)
function toast(html,ms,err){$.toast.innerHTML=html;$.toast.classList.toggle('err',!!err||/circle-alert/.test(html));$.toast.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){$.toast.classList.remove('on')},ms||(/circle-alert/.test(html)?4000:2000))}
// upload finished: a line in the upload panel if it is open, else a tiny status next to the folder actions
function upNote(txt,err){var box=st.sheet=='upload'&&$.sheet.querySelector('.unote'),t=box||$.tbn;clearTimeout(upNote.t);t.className=(box?'unote':'tbn')+(err?' err':'')+' on';t.innerHTML=(err?ic('circle-alert'):ic('check'))+'<span>'+esc(txt)+'</span>';
  upNote.t=setTimeout(function(){t.classList.remove('on')},err?4000:2000)}

/* ---------- navigation ---------- */
function go(path,push){
  if(path==st.path&&st.data){return}
  var out=st.cells.filter(function(c){return c.item.path==path})[0];
  st.sel=[];closeLb();
  var anim=!RM&&out&&st.view=='garden';
  if(anim)zoomInto(out);
  else if(st.data){$.zoom.style.opacity='.0';$.lbs.style.opacity='0';if(window.NagiKoi)NagiKoi.follow('',0)}
  var t0=Date.now();
  if(push!==false&&A.go)A.go(path);
  load(path,function(d){var wait=anim?Math.max(0,460-(Date.now()-t0)):0;setTimeout(function(){st.path=path;st.data=d;$.zoom.style.transition='none';$.zoom.style.transform='';$.zoom.style.opacity='';if(window.NagiKoi)NagiKoi.reset();$.lbs.style.opacity='';void $.zoom.getBoundingClientRect();$.zoom.style.transition='';render(true);$.ctx.classList.remove('open')},wait)});
}
function zoomInto(c){var bb=G.bbox(c.poly),W=$.stage.clientWidth,H=$.stage.clientHeight,s=Math.min(W/(bb[2]-bb[0]),H/(bb[3]-bb[1]));
  var tx=(W-(bb[2]-bb[0])*s)/2-bb[0]*s,ty=(H-(bb[3]-bb[1])*s)/2-bb[1]*s;
  $.zoom.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';$.lbs.style.opacity='0';if(window.NagiKoi)NagiKoi.follow($.zoom.style.transform,0);
  [].forEach.call($.zoom.querySelectorAll('.cell'),function(g){if(g.dataset.i!=c.idx)g.style.opacity='0'})}
function up(){if(st.path=='/'||!st.path)return;go(dirname(st.path.replace(/\/$/,'')))}

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
  [].forEach.call($.chk.querySelectorAll('.row[data-p]'),function(r){var x=find(r.dataset.p);r.onclick=function(){toggleSel(x.path)};r.ondblclick=function(){open(x)};
    r.onmouseenter=function(){hl(x.path,1)};r.onmouseleave=function(){hl(x.path,0)}});
  renderActs(sel);fitCtx();
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
var KEYS={U:'⇧U',S:'⇧S',N:'⇧N',P:'⇧P'};
function actList(sel){var L=[],can=A.perms(),k=kindOf(sel);
  if(!sel.length){
    if(can.write)L.push({t:'Upload',i:'upload',k:'U',f:function(){openSheet('upload')},main:1});
    L.push({t:'Download all',i:'download',k:'S',f:confirmAll});
    if(can.write)L.push({t:'New folder',i:'plus',k:'N',f:newFolder});
    var au=st.data.items.filter(function(x){return x.type=='audio'});
    if(au.length>1)L.push({t:'Play all '+au.length,i:'play',k:'P',f:function(){playList(au,0)}});
    if(A.canShare())L.push({t:'Share folder',i:'link',f:function(){openSheet('share',[st.path])}});
    return L}
  var one=sel.length==1?sel[0]:null;
  if(k=='audio')L.push({t:one?'Play':'Play '+sel.length,i:'play',k:'P',f:function(){playList(sel,0)},main:1});
  else if(k=='image')L.push({t:one?'View':'View '+sel.length,i:'eye',f:function(){lbOpen(sel,0)},main:1});
  else if(one&&one.isDir)L.push({t:'Open',i:'folder-open',f:function(){go(one.path)},main:1});
  else if(one&&(one.type=='video'||one.type=='doc'||one.type=='code'))L.push({t:one.type=='video'?'Watch':'Read',i:one.type=='video'?'play':'file-text',f:function(){open(one)},main:1});
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
  else{tabs.push(T('Clear','x',function(){st.sel=[];refresh()},'clr'));var acts=L.filter(function(o){return o.i!='x'});tabs=tabs.concat(acts.slice(0,acts.length>4?2:3).map(function(o){return T(o.t.replace(/^Download \d+$/,'Download'),o.i,o.f,o.danger?'danger':'')}));rest=acts.slice(acts.length>4?2:3)}
  $.bb.innerHTML='';$.bb.classList.toggle('selm',!!sel.length);
  tabs.forEach(function(o){var b=el('<button class="bt '+o.cls+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span>'+(o.cls=='clr'?'<b>'+sel.length+'</b>':'')+'</button>');b.onclick=function(){$.mm.classList.remove('on');o.f()};$.bb.appendChild(b)});
  if(!sel.length||rest.length){var mb=el('<button class="bt more" aria-haspopup="menu" aria-expanded="false">'+ic('ellipsis')+'<span>More</span></button>');mb.onclick=function(e){e.stopPropagation();var on=!$.mm.classList.contains('on');$.mm.classList.toggle('on',on);mb.setAttribute('aria-expanded',on)};$.bb.appendChild(mb)}
  if(!sel.length&&A.loginUrl){var ac=el(A.user?'<div class="acct"><div class="who"><b>'+esc(A.user.charAt(0).toUpperCase())+'</b><span>Signed in as <em>'+esc(A.user)+'</em></span></div><button role="menuitem" class="so">'+ic('log-out')+'<span>Sign out</span></button></div>':'<div class="acct"><button role="menuitem" class="si">'+ic('log-in')+'<span><b>Sign in</b><small>to upload and see your folders</small></span>'+ic('chevron-right')+'</button></div>');
    var sb=ac.querySelector('button');sb.onclick=function(){$.mm.classList.remove('on');A.user?signOut():signIn()};$.mm.appendChild(ac)}
  rest.forEach(function(o){if(o.i=='x')return;var m=el('<button role="menuitem" class="'+(o.danger?'danger':'')+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span></button>');m.onclick=function(){$.mm.classList.remove('on');o.f()};$.mm.appendChild(m)});
  fa.classList.toggle('selm',!!sel.length);
  if(sel.length)fa.appendChild(el('<span class="fn">'+sel.length+' selected</span>'));
  L.forEach(function(o,n){if(o.k)st.akeys[o.k]=o.f;var h=o.k?KEYS[o.k]:o.kh;
    var t=el('<button class="fb'+(o.danger?' danger':'')+'" title="'+esc(o.t)+(h?' ('+h+')':'')+'">'+ic(o.i)+'<span>'+esc(o.t)+'</span>'+(h?'<kbd>'+h+'</kbd>':'')+'</button>');t.onclick=o.f;fa.appendChild(t);
    // mobile drawer: first two as buttons, the rest quiet (second row when open)
    var tgt=n<3||!sel.length?a:b;if(!sel.length&&n>2)return;
    tgt.appendChild(btn(o.t,o.danger?'danger':n==0?'fill':n==1?'':'quiet',o.f))})}
// v3g: "Download all" asks first (it is easy to misclick): a small popover under the button, a sheet on phones
// v3k: the phone drawer follows the finger (handle + header; the list only when scrolled to the top), snaps by distance or flick
function drawerDrag(){var c=$.ctx,H=c.querySelector('.drawer-h'),d=null,eat=false,tm=0;
  function mob(){return innerWidth<=760&&getComputedStyle(H).display!='none'}
  function rub(x){return 46*(1-Math.exp(-x/110))}
  function lims(){var o=c.classList.contains('open'),h=c.offsetHeight,ih=c.style.height,ch,oh;c.style.transition='none';c.style.height='';
    c.classList.remove('open');ch=c.offsetHeight;c.classList.add('open');oh=c.offsetHeight;c.classList.toggle('open',o);c.style.height=ih;void c.offsetHeight;c.style.transition='';
    return {o:o,h:h,ch:ch,oh:Math.max(oh,ch+40)}}
  function start(y){if(!mob())return false;clearTimeout(tm);var L=lims();d={y0:y,ys:[[y,Date.now()]],L:L,moved:false,h:L.h};return true}
  function move(y){if(!d)return;var dy=d.y0-y;if(!d.moved){if(Math.abs(dy)<6)return;d.moved=true;c.classList.add('drag')}
    var L=d.L,h=L.h+dy;if(h>L.oh)h=L.oh+rub(h-L.oh);else if(h<L.ch)h=L.ch-rub(L.ch-h);d.h=h;
    c.style.height=h+'px';c.classList.toggle('open',L.o||h>L.ch+4);d.ys.push([y,Date.now()]);if(d.ys.length>6)d.ys.shift()}
  function end(cancel){if(!d)return;var D=d;d=null;if(!D.moved)return;eat=true;setTimeout(function(){eat=false},350);
    var L=D.L,z=D.ys[D.ys.length-1],a=D.ys.filter(function(q){return z[1]-q[1]<=90})[0]||D.ys[0],v=z[1]-a[1]>0?(a[0]-z[0])/(z[1]-a[1]):0,p=(D.h-L.ch)/(L.oh-L.ch),op;
    if(cancel)op=L.o;else if(Math.abs(v)>.35)op=v>0;else op=L.o?p>.7:p>=.3;
    c.classList.remove('drag');c.classList.add('open');void c.offsetHeight;
    var fin=function(){c.style.transition='';c.style.height='';c.classList.toggle('open',op)};
    if(RM){fin();return}
    c.style.transition='height .32s cubic-bezier(.2,.8,.2,1)';c.style.height=(op?L.oh:L.ch)+'px';tm=setTimeout(fin,340)}
  // pointer drag on the handle and header (touch-action:none there in CSS)
  c.addEventListener('pointerdown',function(e){if(!e.isPrimary||e.button>0||!e.target.closest('.drawer-h,.crumb,.num,.say')||e.target.closest('.np'))return;
    if(start(e.clientY)){try{c.setPointerCapture(e.pointerId)}catch(_){}}});
  c.addEventListener('pointermove',function(e){if(d&&d.pid!=='t')move(e.clientY)});
  c.addEventListener('pointerup',function(){if(d&&d.pid!=='t')end(false)});
  c.addEventListener('pointercancel',function(){if(d&&d.pid!=='t')end(true)});
  // pull the open list down to close, only from scroll-top; otherwise the list scrolls normally
  var ts=null;function scl(t){for(var n=t;n&&n!==c;n=n.parentNode)if(n.scrollTop>0)return true;return c.scrollTop>0}
  c.addEventListener('touchstart',function(e){ts=null;if(e.touches.length!=1||!c.classList.contains('open')||e.target.closest('.drawer-h,.crumb,.num,.say,.np,input'))return;if(scl(e.target))return;ts={y:e.touches[0].clientY,x:e.touches[0].clientX}},{passive:true});
  c.addEventListener('touchmove',function(e){if(e.touches.length!=1){if(d&&d.pid==='t')end(true);ts=null;return}var t=e.touches[0];
    if(ts&&!d){var dy=t.clientY-ts.y,dx=Math.abs(t.clientX-ts.x);if(dy>8&&dy>dx){if(start(ts.y)){d.pid='t';move(t.clientY)}ts=null}else if(dy<-4||dx>10)ts=null}
    if(d&&d.pid==='t'){e.preventDefault();move(t.clientY)}},{passive:false});
  c.addEventListener('touchend',function(){ts=null;if(d&&d.pid==='t')end(false)});
  c.addEventListener('touchcancel',function(){ts=null;if(d&&d.pid==='t')end(true)});
  // a drag is not a tap: swallow the click that follows it (handle toggle, crumb links)
  c.addEventListener('click',function(e){if(eat){eat=false;e.preventDefault();e.stopPropagation()}},true);
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
function refresh(){renderCtx();paintSel()}
function download(sel){if(sel.length==1&&!sel[0].isDir){var a=document.createElement('a');a.href=A.url(sel[0]);a.download=sel[0].name;document.body.appendChild(a);a.click();a.remove();return}
  if(sel.length==1)return A.zip(sel[0].path,null);A.zip(st.path,sel.map(function(x){return x.name}))}

/* ---------- garden ---------- */
// three stone tones, like Kanso: 1 charcoal, 2 mid, 3 light
var TONE={audio:1,video:1,image:2,code:2,archive:2,folder:2,doc:3,other:3,empty:3};
function toneOf(x){if(!x)return 3;if(st.age&&st.age[x.path])return st.age[x.path];if(x.isDir)return x.dom=='empty'?3:1;return TONE[x.type]||3}
// a folder of one kind of thing: stones weather with age (newest darkest), so the field still reads
function ageTones(list){st.age=null;var k={};list.forEach(function(x){k[x.isDir?(x.dom=='empty'?3:1):(TONE[x.type]||3)]=1});if(Object.keys(k).length>1||list.length<3)return;
  var srt=list.slice().sort(function(a,b){return (b.ts||0)-(a.ts||0)}),n=srt.length;st.age={};srt.forEach(function(x,i){st.age[x.path]=i<n/3?1:i<2*n/3?2:3})}
function items(){var d=st.data,list=d.items.slice(),out=[],sum=0,mx=0;
  list.forEach(function(x){var w=Math.pow((x.size||0)+1,.62);mx=Math.max(mx,w);out.push({key:x.path,weight:w,x:x});sum+=w});
  var n=out.length,floor=Math.max(sum*(n>24?.0045:.012),mx*.012,1);out.forEach(function(o){o.weight=Math.max(o.weight,floor)});sum=out.reduce(function(a,o){return a+o.weight},0);
  st.ups.filter(function(u){return u.dir==st.path&&u.state!='ok'}).forEach(function(u){if(list.some(function(x){return x.name==u.name}))return;var w=Math.max(Math.pow(u.size+1,.62),floor);out.push({key:'up:'+u.name,weight:w,up:u});sum+=w});
  if(st.path=='/'&&d.free!=null){var fw=Math.min(sum*.5,Math.max(sum*.3,Math.pow(d.free,.62)));out.push({key:'free',weight:fw||1,free:1,anchor:st.anchor})}
  return out}
function holeRect(W,H){if(innerWidth<=760)return null;var sr=$.stage.getBoundingClientRect(),cr=$.ctx.getBoundingClientRect(),g=26;
  var hx=cr.right-sr.left+g,hy=cr.bottom-sr.top+g;if(hx<=0)return null;if(H-hy<90)hy=H+1e4;return [-1e4,-1e4,hx,hy]}
// the field = the main area right of the column, plus a band under the column when there is room.
// Each part gets its own power diagram; stones are shared out by weight so the band holds a fair slice.
// horizontal room inside a polygon at height y around x
function chord(P,x,y){var L=-1e9,Rr=1e9;for(var i=0;i<P.length;i++){var a=P[i],b=P[(i+1)%P.length];if((a[1]>y)!=(b[1]>y)){var X=a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]);if(X<=x)L=Math.max(L,X);else Rr=Math.min(Rr,X)}}return Rr-L}
function fieldLayout(it,W,H,M0,hole,mob){var R=mob?22:34,iter=it.length>40?80:120;st.band=null;
  if(!hole||hole[3]>H-60){var x0=hole?hole[2]:M0;return G.layout(it,G.roundRect(x0,M0,W-M0-x0,H-2*M0,R),{seed:st.path,iter:iter,corner:[x0+2,M0+2]})}
  var X=hole[2],Y=hole[3],B=H-M0,bh=B-Y,bw=X-M0;
  // the strip under the column: real stones sit in a fan-shaped patch toward the field (top edge rising to
  // the right, left edge leaning in); the rest is negative space with a few ghost pebbles, sparser to the left.
  var cutX=bw*.34,lead=Math.min(bh*.5,70);
  var bp=[[M0+cutX,Y+lead],[M0+cutX+bw*.22,Y+lead*.28],[X,Y],[X,B],[M0+cutX*.7,B]];
  var ab=Math.abs(G.area(bp)),a1=(W-M0-X)*(H-2*M0),tot=it.reduce(function(a,o){return a+o.weight},0),want=tot*ab/(a1+ab);
  var big=it.slice().sort(function(a,b){return b.weight-a.weight})[0],cand=it.filter(function(o){return !o.free&&o!==big}).sort(function(a,b){return (G.hash(a.key+'|b')%997)-(G.hash(b.key+'|b')%997)});
  var two=[],w2=0;cand.forEach(function(o){if(w2+o.weight<=want*1.12){two.push(o);w2+=o.weight}});
  if(!two.length&&cand.length>=2){var sm=cand.slice().sort(function(a,b){return a.weight-b.weight})[0];two.push(sm);w2=sm.weight}
  if(!two.length||it.length-two.length<2||bh<80){return G.layout(it,G.roundRect(X,M0,W-M0-X,H-2*M0,R),{seed:st.path,iter:iter,corner:[X+2,M0+2]})}
  var one=it.filter(function(o){return two.indexOf(o)<0});
  // keep sizes honest: if the band stones weigh less than their share, pull the patch's left edge in
  if(w2<want*.9){var f=Math.max(.45,w2/want),nx=X-(X-(M0+cutX*.7))*f;bp=[[Math.max(nx,M0+cutX*.7),Y+lead],[Math.max(nx,M0+cutX*.7)+bw*.2*f,Y+lead*.28],[X,Y],[X,B],[Math.max(nx-cutX*.6*f,M0+cutX*.7),B]]}
  var c1=G.layout(one,G.roundRect(X,M0,W-M0-X,H-2*M0,R),{seed:st.path,iter:iter,corner:[X+2,M0+2]}),c2=G.layout(two,bp,{seed:st.path+'|band',iter:iter});
  st.band={x0:M0,y0:Y,x1:X,y1:B,poly:bp};st.hole2=[-1e4,-1e4,X,Y];return c1.concat(c2)}
// koi pond in the Free pebble (pinned in the corner): tap the water to scatter the koi; it never navigates
function pondUp(cells){if(!window.NagiKoi)return;var best=null;cells.forEach(function(c){if(c.d&&c.item.free)best=c});
  if(!best||best.area<9000||best.pr<34||root.classList.contains('off')){NagiKoi.hide();st.pond=null;return}
  st.pond=best;var gfree=$.zoom.querySelector('.cell[data-i="'+best.idx+'"]');if(gfree)gfree.classList.add('pondc');var pts=best.pb.map(function(v){return [v[0],v[1]]});NagiKoi.show($.stage,{poly:pts},{d:best.d,key:st.path+'|'+best.item.path,before:$.lbs,theme:root,interactive:true,avoid:best.c?[best.c[0],best.c[1],Math.min(70,Math.max(34,best.pr*.42))]:null});
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
function render(anim){if(!st.data)return;if(!st.data.all)st.data.all=st.data.items;var actv=st.ups.filter(function(u){return u.dir==st.path&&u.state!='ok'}).map(function(u){return u.name});st.data.items=st.data.all.filter(function(x){return x.isDir||actv.indexOf(x.name)<0});$.tip.classList.remove('on');st.upSig=st.ups.filter(function(x){return x.dir==st.path&&x.state!='ok'}).map(function(x){return x.name}).join('|');ageTones(st.data.items);renderCtx();
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
  st.hole2=null;var M0=mob?4:8,cells=fieldLayout(it,W,H,M0,hole,mob);st.cells=cells;
  var svg='',lbs='',sandI=-1,sandA=0;cells.forEach(function(c,i){var o=c.item,x=o.x;if(st.path!='/')return;if(o.free||o.up||!x)return;if((x.type=='image'||x.type=='video')&&A.thumb)return;if(c.area>sandA){sandA=c.area;sandI=i}});
  cells.forEach(function(c,i){c.idx=i;var o=c.item,x=o.x,poly=G.inset(c.poly,gap/2);if(poly.length<3)return;
    var hz=st.hole2||hole,thr=gap/2+3,outer=function(m){if(m[0]<M0+thr||m[0]>W-M0-thr||m[1]<M0+thr||m[1]>H-M0-thr)return true;if(hz&&((Math.abs(m[0]-hz[2])<thr&&m[1]<hz[3])||(Math.abs(m[1]-hz[3])<thr&&m[0]<hz[2])))return true;if(st.band&&m[0]<st.band.x1-thr&&Math.abs(polyD(m,st.band.poly))<thr)return true;return false};
    var pl1=G.pole(poly),ar=Math.abs(G.area(poly));c.sliver=false;
    if(pl1.r<6||(pl1.r<24&&ar/(pl1.r*pl1.r)>14)){c.sliver=true;var rr=Math.max(5,Math.min(pl1.r*1.05,22));poly=[];for(var e=0;e<10;e++){var an=e/10*Math.PI*2;poly.push([pl1.x+Math.cos(an)*rr*(1+.08*Math.sin(an*2+(G.hash(o.key||'')%7))),pl1.y+Math.sin(an)*rr*(.92+.08*Math.cos(an*3))])}}
    var hk=G.hash(o.key||''),rad=G.prad(poly,hk),pb=c.sliver?poly:G.bulge(poly,null,null,outer),d=G.path(pb,c.sliver?rr*.9:rad);c.ipoly=poly;c.d=d;c.pb=pb;c.pr=pl1.r;
    c.item.path=x?x.path:o.key;
    var tn=o.free||o.up?0:toneOf(x),dk=tn==1||tn==2;
    var cls='cell t'+tn+(anim&&!RM?' in':'')+(o.up?' up':'')+(o.free?' free':'')+(i===sandI&&!c.sliver?' sandc':'');
    svg+='<g class="'+cls+'" data-i="'+i+'" style="animation-delay:'+(anim?Math.min(i*16,420):0)+'ms"><path class="f" d="'+d+'"/>';
    if(x&&!x.isDir&&(x.type=='image'||x.type=='video')&&A.thumb&&c.area>2200&&!c.sliver&&pl1.r>=22){var th=A.thumb(x);if(th){var b3=G.bbox(poly),cid='cp'+i+'_'+(G.hash(st.path)%9999);svg+='<clipPath id="'+cid+'"><path d="'+d+'"/></clipPath><image class="th" data-th="'+esc(th)+'" x="'+b3[0].toFixed(1)+'" y="'+b3[1].toFixed(1)+'" width="'+(b3[2]-b3[0]).toFixed(1)+'" height="'+(b3[3]-b3[1]).toFixed(1)+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#'+cid+')"/>';c.thumb=1}}
    var core=null;
    if(i===sandI&&!c.sliver){var Rs=G.rings(pb.map(function(v){return [v[0],v[1]]}),mob?5.5:7,0,40);Rs.rings.forEach(function(q,j){svg+='<path class="sand" d="'+G.path(q,Math.max(2,Math.min(rad-(j+1)*4,G.prad(q,hk))))+'"/>'})}
    if(o.free&&window.NagiKoi&&pl1.r>=34&&ar>=9000){}
    else if(o.free){var pbx=pb.map(function(v){return [v[0],v[1]]}),R=G.rings(pbx,mob?6:8.5,0,64),st0=mob?6:8.5;R.rings.forEach(function(q,j){svg+='<path class="ring" d="'+G.path(q,Math.max(2,Math.min(rad-(j+1)*st0*.55,G.prad(q,hk))))+'"/>'});core=R.core}
    if(o.up){var R2=G.rings(poly,6,0,40),k=Math.round(R2.rings.length*(o.up.pct||0)/100);svg+='<path class="rim" d="'+d+'"/>';R2.rings.forEach(function(q,j){svg+='<path class="ring'+(j<k?'':' todo')+'" d="'+G.path(G.bulge(q),Math.min(rad,G.prad(q,hk)))+'"/>'})}
    svg+='</g>';
    // label at the stone's pole, small and centred (Kanso)
    var pl0=G.pole(core&&core.length>2?core:poly);if(o.free&&core&&core.length>2){var cc=G.centroid(core);pl0={x:cc[0],y:cc[1],r:Math.max(40,G.pole(poly).r)}}
    c.c=[pl0.x,pl0.y];c.r=pl0.r;var r=pl0.r;
    var gl=null;if(o.up)gl='◐';else if(x&&x.isDir)gl=x.dom=='empty'?'○':'●';
    var nm=x?(x.isDir||x.type=='other'?x.name:x.name.replace(/\.[^.]+$/,'')):o.free?'Free':o.up.name,v=fs(x?x.size:o.free?st.data.free:o.up.size);
    if(o.up)v=Math.round(o.up.pct||0)+'%';
    var lc=' k'+tn+(c.thumb?' ph':'')+(o.free?' fr':'')+(o.up?' upl':'')+(i===sandI&&!c.sliver?' sandl':'');
    var pos='left:'+pl0.x.toFixed(1)+'px;top:'+pl0.y.toFixed(1)+'px';
    var cw=chord(poly,pl0.x,pl0.y),nw=nm.length*8+(gl?14:0);
    if(o.free||(r>=30&&(cw-14>=Math.min(nw,150)||cw-14>=r*1.75))){var mw=o.free?Math.max(56,Math.min(r*1.75,170)):Math.max(56,Math.min(cw-14,190));
      lbs+='<div class="lb'+lc+'" data-i="'+i+'" style="'+pos+';--mw:'+mw.toFixed(0)+'px"><span class="n">'+(gl?'<b class="gl">'+gl+'</b>':'')+esc(nm)+'</span><span class="v">'+esc(v)+'</span></div>'}
    else if(r>=17&&(x||o.up)&&r*2.15>=v.length*7+(gl?14:0)){lbs+='<div class="lb sm'+lc+'" data-i="'+i+'" style="'+pos+'"><span class="n">'+(gl?'<b class="gl">'+gl+'</b>':'')+esc(v.replace(' ','\u202f'))+'</span></div>'}
    else if(r>=6&&gl){lbs+='<div class="lb gx'+lc+'" data-i="'+i+'" style="'+pos+'"><b class="gl">'+gl+'</b></div>'}
  });
  $.zoom.innerHTML=ghosts(gap)+svg;$.lbs.innerHTML=lbs;pondUp(cells);paintSel();
  [].forEach.call($.zoom.querySelectorAll('image[data-th]'),function(im){var u=im.getAttribute('data-th');(A.thumbOk?A.thumbOk(u):Promise.resolve(u)).then(function(ok){if(ok){im.setAttribute('href',ok);im.classList.add('on')}else{var l=$.lbs.querySelector('.lb[data-i="'+im.parentNode.dataset.i+'"]');if(l){l.classList.remove('ph')}}},function(){})});
}
function paintSel(){var kc=window.NagiKoi&&NagiKoi.pond;if(kc&&st.pond){var pp=st.pond.item.path;kc.cv.classList.toggle('sel',st.sel.indexOf(pp)>=0);kc.cv.classList.toggle('pl',!!(st.q[st.qi]&&st.q[st.qi].path==pp))}[].forEach.call($.zoom.querySelectorAll('.cell'),function(g){var c=st.cells[g.dataset.i];if(!c)return;var p=c.item.path;g.classList.toggle('sel',st.sel.indexOf(p)>=0);g.classList.toggle('play',!!(st.q[st.qi]&&st.q[st.qi].path==p))});
  [].forEach.call($.lbs.querySelectorAll('.lb'),function(l){var c=st.cells[l.dataset.i];l.classList.toggle('sl',!!c&&st.sel.indexOf(c.item.path)>=0);l.classList.toggle('pl',!!(c&&st.q[st.qi]&&st.q[st.qi].path==c.item.path));});
  [].forEach.call($.chk.querySelectorAll('.row[data-p]'),function(r){r.classList.toggle('sel',st.sel.indexOf(r.dataset.p)>=0)});
  var tl=$.stage.querySelector('.lst');if(tl)[].forEach.call(tl.querySelectorAll('tr.r'),function(r){r.classList.toggle('sel',st.sel.indexOf(r.dataset.p)>=0)})}
function hl(p,on){[].forEach.call($.zoom.querySelectorAll('.cell'),function(g){var c=st.cells[g.dataset.i];g.classList.toggle('dim',!!on&&c&&c.item.path!=p)});
  [].forEach.call($.chk.querySelectorAll('.row'),function(r){r.classList.toggle('hov',!!on&&r.dataset.p==p)})}
function stageEvents(){var clickT;
  $.stage.addEventListener('mousemove',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];
    if(!c){$.tip.classList.remove('on');hl(null,0);return}
    var r=$.stage.getBoundingClientRect(),x=c.item.x,o=c.item;
    if(st.hover!==c.item.path){st.hover=c.item.path;[].forEach.call($.chk.querySelectorAll('.row'),function(rw){rw.classList.toggle('hov',rw.dataset.p==c.item.path)})}
    var small=(c.r||0)<30;if(small){$.tip.innerHTML=esc(x?x.name:o.free?'Free space':o.up.name)+'<span>'+(x?fs(x.size):o.free?fs(st.data.free):Math.round(o.up.pct)+'%')+'</span>';$.tip.style.left=(e.clientX-r.left)+'px';$.tip.style.top=(e.clientY-r.top)+'px';$.tip.classList.add('on')}else $.tip.classList.remove('on')});
  $.stage.addEventListener('mouseleave',function(){$.tip.classList.remove('on');st.hover=null;[].forEach.call($.chk.querySelectorAll('.row'),function(rw){rw.classList.remove('hov')})});
  $.stage.addEventListener('pointerdown',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(c&&c.item.x&&c.item.x.isDir&&A.prefetch)A.prefetch(c.item.x.path)},{passive:true});
  $.stage.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(!c||!c.item.x){if(c&&c.item.free)toast(ic('hard-drive')+' '+fs(st.data.free)+' free of '+fs(st.data.total));return}
    var x=c.item.x;if(x.isDir&&!(e.metaKey||e.ctrlKey||e.shiftKey)){clearTimeout(clickT);return go(x.path)}
    clearTimeout(clickT);var multi=e.metaKey||e.ctrlKey||e.shiftKey;clickT=setTimeout(function(){toggleSel(x.path,false)},multi?0:190)});
  $.stage.addEventListener('dblclick',function(e){clearTimeout(clickT);var g=e.target.closest&&e.target.closest('.cell');var c=g&&st.cells[g.dataset.i];if(c&&c.item.x&&!c.item.x.isDir)open(c.item.x)})}
function setView(v){st.view=v;localStorage.nagi_view=v;render(true)}
function renderList(){if(window.NagiKoi)NagiKoi.hide();$.svg.style.display='none';$.lbs.style.display='none';var old=$.stage.querySelector('.lst');if(old)old.remove();
  var rows=grouped(st.data.items,function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true})}),gs={},ng=0,lastG=null;rows.forEach(function(x){if(!gs[grp(x)]){gs[grp(x)]=0;ng++}gs[grp(x)]++});var h='<div class="lst"><table><thead><tr><th>Name</th><th>Kind</th><th style="text-align:right">Size</th><th style="text-align:right">Changed</th></tr></thead><tbody>';
  rows.forEach(function(x){var t=x.isDir?'folder':x.type,ar=x.tags&&(x.tags.artist||''),gx=grp(x);if(ng>1&&gx!==lastG)h+='<tr class="g"><td colspan="4"><span>'+GLAB[gx]+'</span><i>'+gs[gx]+'</i></td></tr>';lastG=gx;h+='<tr class="r" data-p="'+esc(x.path)+'"><td class="nm">'+rowIc(x)+'<span>'+esc(x.name)+'</span></td><td class="mu">'+(x.isDir?(x.count!=null?pl(x.count,'other'):'Folder'):esc(ar||t))+'</td><td class="rt">'+fs(x.size)+'</td><td class="rt">'+esc(rel(x.ts))+'</td></tr>'});
  if(!rows.length)h+='<tr><td colspan="4" class="mu" style="height:120px;text-align:center">An empty clearing. Drop files to fill it.</td></tr>';
  $.stage.appendChild(el(h+'</tbody></table></div>'));
  [].forEach.call($.stage.querySelectorAll('tr.r'),function(r){var x=find(r.dataset.p);r.onclick=function(e){if(x.isDir&&!e.metaKey&&!e.ctrlKey)return go(x.path);toggleSel(x.path)};r.ondblclick=function(){open(x)}});paintSel()}

/* ---------- open / media ---------- */
function open(x){if(x.isDir)return go(x.path);
  var same=st.data.items.filter(function(y){return y.type==x.type});
  if(x.type=='audio')return playList(same,same.indexOf(x));
  if(x.type=='image')return lbOpen(same,same.indexOf(x));
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
function lbOpen(list,i){st.lb={list:list,i:i||0};$.lbx.classList.add('on');lbShow()}
function lbShow(){var x=st.lb.list[st.lb.i];$.lbx.querySelector('.im').innerHTML='<img alt="'+esc(x.name)+'" src="'+esc(A.url(x))+'">';
  $.lbx.querySelector('.cap').innerHTML='<span><b>'+esc(x.name)+'</b>'+dlb(1)+fs(x.size)+' · '+esc(rel(x.ts))+'</span><span>'+(st.lb.i+1)+' of '+st.lb.list.length+'</span>';
  $.lbx.querySelector('.cap .dl').onclick=function(){download([x])};var im=$.lbx.querySelector('img');im.onload=function(){$.lbx.querySelector('.cap span').insertAdjacentHTML('beforeend',' · '+im.naturalWidth+' × '+im.naturalHeight)};
  $.lbx.querySelector('.p').style.visibility=st.lb.i>0?'':'hidden';$.lbx.querySelector('.n').style.visibility=st.lb.i<st.lb.list.length-1?'':'hidden'}
function lbStep(d){if(!st.lb)return;var n=st.lb.i+d;if(n<0||n>=st.lb.list.length)return;st.lb.i=n;lbShow()}
function lbClose(){$.lbx.classList.remove('on');st.lb=null}
function closeLb(){if(st.lb)lbClose()}

/* ---------- sheets ---------- */
function openSheet(kind,arg){st.sheet=kind;var s=$.sheet;s.className='sheet'+(kind=='video'||kind=='read'?' wide':'');var f=SHEETS[kind];if(!f)return;
  s.innerHTML='';f(s,arg);var x=s.querySelector('.sh-x');if(x)x.onclick=closeSheet;
  [].forEach.call($.menu.querySelectorAll('[data-m]'),function(b){b.classList.toggle('on',b.dataset.m==kind)});
  requestAnimationFrame(function(){s.classList.add('on');$.veil.classList.add('on')});
  var inp=s.querySelector('input[autofocus]');if(inp)setTimeout(function(){inp.focus()},120)}
function signIn(){location.href=A.loginUrl()}
function signOut(){location.href=A.logoutUrl()}
function closeSheet(){if(!st.sheet)return;st.sheet=null;$.sheet.classList.remove('on');$.veil.classList.remove('on');[].forEach.call($.menu.querySelectorAll('[data-m]'),function(b){b.classList.remove('on')});
  var v=$.sheet.querySelector('video');if(v)v.pause();setTimeout(function(){if(!st.sheet)$.sheet.innerHTML=''},450)}
function dlb(k){return '<button class="ib sm dl" aria-label="Download" title="Download'+(k?' (⇧S)':'')+'">'+ic('download')+'</button>'}
function head(t,p,dl){return '<div class="sh-h"><div><div class="sh-t"><h3>'+t+'</h3>'+(dl?dlb(1):'')+'</div>'+(p?'<p>'+p+'</p>':'')+'</div><button class="ib sh-x" aria-label="Close" title="Close (Esc)">'+ic('x')+'</button></div>'}
function topo(w,h){var poly=G.roundRect(4,4,w-8,h-8,18),r=G.contours(poly,18,11,[w*.78,h*.3],40);return '<svg class="topo" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+r.map(function(d){return '<path d="'+d+'" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width=".8"/>'}).join('')+'</svg>'}
var SHEETS={
 upload:function(s){var where=title(st.path);
  s.innerHTML=head('Upload','Files go into <b style="font-weight:500;color:var(--n-ink)">'+esc(where)+'</b>.')+'<div class="sh-b">'+
   '<div class="drop">'+topo(384,230)+'<div class="big">'+ic('cloud-upload')+'</div><h4>Drop files or folders here</h4><p>or pick them from your computer. Each file grows into the garden as it arrives.</p>'+
   '<div class="acts"><button class="btn fill" data-u="f">Choose files</button><button class="btn" data-u="d">Choose folder</button></div></div>'+
   '<div class="usum"></div><div class="unote" role="status" aria-live="polite"></div><div class="uq"></div>'+
   '<details class="opt"><summary>Options '+ic('chevron-down')+'</summary><div class="opts"></div></details></div>';
  s.querySelector('[data-u=f]').onclick=function(){A.pickFiles()};s.querySelector('[data-u=d]').onclick=function(){A.pickFolder()};
  var dz=s.querySelector('.drop');dz.style.color='var(--n-ink)';
  renderOpts(s.querySelector('.opts'));pollUps(true)},
 search:function(s){s.innerHTML=head('Search','Names, artists, albums and titles, across every folder you can open.')+'<div class="sh-b"><label class="field">'+ic('search')+'<input type="search" autofocus placeholder="Try “evening” or “kyoto”" aria-label="Search"></label><div class="res" style="margin-top:14px"></div></div>';
  var inp=s.querySelector('input'),res=s.querySelector('.res'),n=0;
  function run(){var q=inp.value.trim(),me=++n;if(q.length<2){res.innerHTML='<p class="hint">Type at least two letters. Results come from the server index, so they include folders you have not opened yet.</p>';return}
   res.innerHTML='<p class="hint">Looking…</p>';A.search(q).then(function(hits){if(me!=n)return;if(!hits.length){res.innerHTML='<p class="hint">Nothing called “'+esc(q)+'”. Try fewer letters, or another word from the name.</p>';return}
    var re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
    res.innerHTML='<div class="lab">'+pl(hits.length,'other').replace('files','results').replace('file','result')+'</div>'+hits.slice(0,80).map(function(h,i){var t=h.isDir?'folder':ftype(h.name);return '<div class="sr" data-i="'+i+'"><span class="ic" style="background:'+tone(t)+';color:'+(lum(tone(t))<.5?'var(--on-dark)':'var(--on-light)')+'">'+ic(ICO[t])+'</span><div><b>'+esc(h.name).replace(re,'<mark>$1</mark>')+'</b><span>'+esc(decodeURIComponent(h.dir)||'/')+(h.tags&&h.tags.artist?' · '+esc(h.tags.artist):'')+'</span></div><span class="sz">'+fs(h.size)+'</span></div>'}).join('');
    [].forEach.call(res.querySelectorAll('.sr'),function(r){r.onclick=function(){var h=hits[r.dataset.i];closeSheet();var tgt=h.isDir?h.path:h.dir;var after=function(){if(!h.isDir){st.sel=[h.path];refresh()}};if(tgt==st.path)after();else{go(tgt);var w=setInterval(function(){if(st.path==tgt&&st.data){clearInterval(w);setTimeout(after,500)}},100)}}})},function(){res.innerHTML='<p class="hint">Search is not available on this server.</p>'})}
  inp.oninput=debounce(run,220);run()},
 settings:function(s){var th=A.theme(),u=A.user,c=A.perms();
  s.innerHTML=head('Settings','Changes apply right away and stay on this device.')+'<div class="sh-b">'+
   '<div class="lab">Light</div><div class="choice" style="--n:3">'+
    ['paper:Paper:Cream daylight','yugure:Yūgure:Evening teal','sky:Follow the sky:Changes at dusk'].map(function(v){v=v.split(':');return '<button data-t="'+v[0]+'" class="'+(th==v[0]?'on':'')+'"><div class="sky">'+G.swatch(v[0]=='paper'?{w:200,h:80,seed:'pp',n:14,bg:'#F1EADB',tones:['#22302F','#7D8984','#DCD3C0'],ring:'#55625F',stroke:'#CEC4AE'}:v[0]=='yugure'?{w:200,h:80,seed:'yy',n:14,bg:'#0F1D1E',tones:['#E4DAC4','#6C8781','#2A4444'],ring:'#B9C5B9'}:{w:200,h:80,seed:'ss',n:14,bg:'#173031',tones:['#E4DAC4','#7D8984','#2F4B4A'],ring:'#B9C5B9',lit:3,litc:'#E07E24'})+'</div>'+v[1]+'<span>'+v[2]+'</span></button>'}).join('')+'</div>'+
   '<div class="lab">Uploads</div><div class="opts"></div>'+
   '<div class="lab">Elsewhere</div>'+
    (A.classic?'<div class="tg" data-x="classic"><div><b>Classic copyparty view</b><span>Every tool, the original layout, same Nagi colours</span></div>'+ic('arrow-right')+'</div>':'')+
    (A.panelUrl?'<div class="tg" data-x="panel"><div><b>Control panel</b><span>Volumes, recent uploads, shares, connect as a drive</span></div>'+ic('arrow-right')+'</div>':'')+
   '<div class="lab">Account</div>'+(u?'<div class="tg" data-x="out"><div><b>Signed in as '+esc(u)+'</b><span>Sign out on this browser</span></div>'+ic('log-out')+'</div>':'<div class="tg" data-x="in"><div><b>You are browsing as a guest</b><span>Sign in to upload, share and tidy up</span></div>'+ic('log-in')+'</div>')+
   '<p class="hint" style="margin-top:22px">Nagi 凪 · a calm skin for copyparty. Icons: Lucide (ISC).</p></div>';
  [].forEach.call(s.querySelectorAll('[data-t]'),function(b){b.onclick=function(){A.setTheme(b.dataset.t);[].forEach.call(s.querySelectorAll('[data-t]'),function(o){o.classList.toggle('on',o==b)});setTimeout(function(){wallpaper();render(false)},30)}});
  renderOpts(s.querySelector('.opts'));
  [].forEach.call(s.querySelectorAll('[data-x]'),function(r){r.onclick=function(){var x=r.dataset.x;if(x=='classic')A.classic();if(x=='panel')location.href=A.panelUrl;if(x=='out')signOut();if(x=='in')signIn()}})},
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
 read:function(s,x){st.sx=x;var md=/\.md$/i.test(x.name);s.innerHTML=head(esc(x.name),fs(x.size)+' · '+esc(rel(x.ts)),1)+'<div class="sh-b" style="position:relative;padding:0 6px 6px">'+(md&&A.mdUrl?'<iframe class="reader" title="'+esc(x.name)+'" src="'+esc(A.mdUrl(x))+'"></iframe>':'<pre class="txt" style="padding:10px 22px 30px">Loading…</pre>')+'</div>';
  var ifr=s.querySelector('iframe');if(ifr)ifr.addEventListener('load',function(){try{ifr.contentDocument.documentElement.classList.add('nagi-embed')}catch(e){}});
  s.querySelector('.dl').onclick=function(){download([x])};
  if(!(md&&A.mdUrl))A.text(x).then(function(t){var p=s.querySelector('pre');if(p)p.textContent=t.length>200000?t.slice(0,200000)+'\n…':t})}
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
  s.innerHTML=head(t,body)+'<div class="sh-b">'+(input!=null?'<label class="field"><input type="text" autofocus value="'+esc(input)+'" aria-label="'+esc(t)+'"></label>':'')+'<div class="acts" style="margin-top:18px"><button class="btn fill ok"'+(danger?' style="background:var(--n-car);border-color:var(--n-car)"':'')+'>'+esc(okL)+'</button><button class="btn quiet no">Cancel</button></div></div>';
  var i=s.querySelector('input');function done(v){closeSheet();res(v)}
  s.querySelector('.ok').onclick=function(){done(i?i.value:true)};s.querySelector('.no').onclick=s.querySelector('.sh-x').onclick=function(){done(null)};
  if(i)i.onkeydown=function(e){if(e.key=='Enter')done(i.value)};else setTimeout(function(){var o=s.querySelector('.ok');if(o)o.focus()},150);
  requestAnimationFrame(function(){s.classList.add('on');$.veil.classList.add('on');if(i){i.focus();i.select()}})})}
function newFolder(){ask('New folder','It will be created inside '+esc(title(st.path))+'.','Create',false,'').then(function(n){if(!n)return;A.mkdir(st.path,n).then(function(){toast(ic('check')+' Folder created');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function rename(x){ask('Rename','Give “'+esc(x.name)+'” a new name.','Rename',false,x.name).then(function(n){if(!n||n==x.name)return;A.rename(x,n).then(function(){st.sel=[];toast(ic('check')+' Renamed');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function del(sel){ask('Delete '+(sel.length==1?'“'+esc(sel[0].name)+'”':sel.length+' items')+'?','This removes them from the server for good. There is no bin.','Delete',true).then(function(ok){if(!ok)return;A.del(sel).then(function(){st.sel=[];toast(ic('check')+' Deleted');reload()},function(e){toast(ic('circle-alert')+' '+esc(e.message||e),4000)})})}
function reload(){var p=st.path;st.kids={};load(p,function(d){st.data=d;render(true)})}

/* ---------- keys + drops ---------- */
function keys(){addEventListener('keydown',function(e){
  if(A.modalOpen&&A.modalOpen())return;
  var t=e.target,typing=t&&(t.tagName=='INPUT'||t.tagName=='TEXTAREA'||t.isContentEditable);
  if(root.classList.contains('off'))return;
  if(st.pop){if(e.key=='Escape'){popClose()}else if(e.key=='Enter'){e.preventDefault();st.pop.ok()}else if(e.key=='Tab'){e.preventDefault();var bs=st.pop.el.querySelectorAll('button'),i=[].indexOf.call(bs,document.activeElement);bs[(i+(e.shiftKey?bs.length-1:1))%bs.length].focus()}else return;e.stopImmediatePropagation();return}
  if(e.key=='Escape'){if(st.lb)lbClose();else if(st.sheet)closeSheet();else if(st.sel.length){st.sel=[];refresh()}e.stopImmediatePropagation();return}
  if(typing){return}
  if(st.sheet=='ask'&&e.key=='Enter'){var ok=$.sheet.querySelector('.ok');if(ok){e.preventDefault();ok.click()}e.stopImmediatePropagation();return}
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

window.NagiApp={start:function(adapter){A=adapter;build();var p=A.start();st.path=null;go(p,false);
  addEventListener('popstate',function(){var p=A.here();if(p!=st.path)go(p,false)});
  if(A.onTheme)A.onTheme(function(){wallpaper();render(false)})},
 state:st,go:function(p){go(p)},open:function(k,a){openSheet(k,a)},close:closeSheet,view:setView,select:function(ps){st.sel=ps;refresh()},play:function(i){var au2=st.data.items.filter(function(x){return x.type=='audio'});playList(au2,i||0)},
 lightbox:function(i){var im=st.data.items.filter(function(x){return x.type=='image'});lbOpen(im,i||0)},audio:au,refresh:function(){render(false)},el:function(){return root}};
})();
