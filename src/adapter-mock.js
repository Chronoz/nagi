/* 凪 Nagi — fictional data for the interactive mockup (index.html). Same adapter shape as the copyparty one. */
(function(){
"use strict";
var GB=1e9,MB=1e6,R=NagiGarden.rng(20261111),now=Date.now()/1000;
function ri(a,b){return a+Math.floor(R()*(b-a+1))}
function img(seed,w,h){var r=NagiGarden.rng(seed),pal=[['#234744','#C9A23F'],['#14262A','#E9862F'],['#2F5D5B','#EEE5D1'],['#4F6478','#F2C94C'],['#24402F','#C24A34'],['#5E8C84','#E6DCC5']],p=pal[Math.floor(r()*pal.length)],c='';
  for(var i=0;i<5;i++){var x=r()*w,y=h*(.45+r()*.6),rr=h*(.12+r()*.25);c+='<circle cx="'+x.toFixed(0)+'" cy="'+y.toFixed(0)+'" r="'+rr.toFixed(0)+'" fill="'+p[0]+'" fill-opacity="'+(.35+r()*.4).toFixed(2)+'"/>'}
  var s='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>'+c+'</svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)}
var T={'/':{dirs:[],files:[]}};
function add(dir,e){(T[dir]=T[dir]||{dirs:[],files:[]});(e.isDir?T[dir].dirs:T[dir].files).push(e)}
function mkdir(parent,name,ts){var p=parent+encodeURIComponent(name)+'/';var e={name:name,path:p,size:0,ts:ts||now-ri(3600,86400*60),tags:{},count:0,isDir:1};add(parent,e);T[p]=T[p]||{dirs:[],files:[]};return p}
function file(dir,name,size,tags,ts){add(dir,{name:name,path:dir+encodeURIComponent(name),size:size,ts:ts||now-ri(600,86400*90),tags:tags||{}})}
var albums={'Kumo Ensemble - Evening Tapes':['Yūgure','Window Light','Cumulus, Low','Wet Asphalt','Wires','Slate'],'Kumo Ensemble - Rain on Slate':['Slate Roof','Gutter Song','Umbrella Hour','Puddle Mirror','Last Train'],
 'Mado - Window Sessions':['Orange Window','Kettle','Night Shift','Streetlight Hum','Laundry, 11pm'],'Field Recordings - Shimokita':['Crosswalk','Vending Machine','Bicycle Bell','Cicadas, Late','Station Rain','Konbini Door','Rail Crossing'],
 'Hinata - Paper Moons':['Tatami','Noren','Moon Viewing','Paper Lantern'],'Sora Quartet - Live at Nakano':['Opening','Blue Hour','Encore']};
var mu=mkdir('/','Music',now-7200);
Object.keys(albums).forEach(function(a,ai){var d=mkdir(mu,a),art=a.split(' - ');albums[a].forEach(function(t,i){file(d,('0'+(i+1)).slice(-2)+' '+t+'.flac',ri(18,62)*MB*(ai==0?18:9),{title:t,artist:art[0]+' (fictional)',album:art[1],'.dur':ri(150,420)})})});
var ph=mkdir('/','Photos',now-86400);['Kyoto, Autumn','Rooftops','Night Walks','Garden Stones','Harbour','Film Scans 2025','Family'].forEach(function(n,k){var d=mkdir(ph,n),nfiles=/Film Scans/.test(n)?64:ri(8,22);for(var i=0;i<nfiles;i++)file(d,n.split(/[ ,]/)[0].toLowerCase()+'-'+('00'+(i+1)).slice(-3)+'.jpg',ri(3,14)*MB*(k==5?6:1),{'.seed':k*100+i})});
var vi=mkdir('/','Video',now-86400*3);['Evening Walk','Harbour at Dusk','Tram Window','Rain Timelapse'].forEach(function(n){file(vi,n.toLowerCase().replace(/ /g,'-')+'.mp4',ri(4,60)*GB)});var vd=mkdir(vi,'Home Movies');for(var i=0;i<6;i++)file(vd,'tape-'+(i+1)+'.mkv',ri(6,30)*GB);
var bk=mkdir('/','Backups',now-86400*2);['phone-2026-09.tar.gz','laptop-home.zip','router-config.bin','photos-2024.tar','mail-archive.zip'].forEach(function(n){file(bk,n,ri(2,60)*GB)});
var pr=mkdir('/','Projects');['nagi-theme','tea-timer','garden-planner','dotfiles'].forEach(function(n,k){var d=mkdir(pr,n);['README.md','index.html','app.js','style.css','build.py','assets.zip'].forEach(function(f){file(d,f,f=='assets.zip'?ri(2,12)*GB:ri(4,90)*1e3)})});
var dc=mkdir('/','Documents');['README.md','tea-list.md','apartment-notes.txt','budget-2026.csv','reading.md','lease-2026.pdf','tax-return-2025.pdf','manual-kettle.pdf'].forEach(function(n){file(dc,n,n.endsWith('pdf')?ri(1,9)*MB:ri(2,40)*1e3)});var rc=mkdir(dc,'Scans');for(var i=0;i<9;i++)file(rc,'scan-'+(i+1)+'.pdf',ri(2,9)*GB/10);
var dl=mkdir('/','Downloads');['train-timetable.pdf','font-specimen.zip','wallpaper-dusk.jpg','ubuntu-26.04.iso','podcast-ep-41.mp3'].forEach(function(n){file(dl,n,/iso/.test(n)?6*GB:ri(2,90)*MB)});
mkdir('/','Inbox');
var eb=mkdir('/','Ebooks');['Kusamakura.epub','Walden.epub','In Praise of Shadows.epub','The Book of Tea.epub'].forEach(function(n){file(eb,n,ri(1,4)*MB)});
var pc=mkdir('/','Podcasts');for(var i=0;i<14;i++)file(pc,'slow-radio-'+(i+1)+'.mp3',ri(40,120)*MB);
var sc=mkdir('/','Screenshots');for(var i=0;i<30;i++)file(sc,'shot-'+(i+1)+'.png',ri(1,4)*MB);
var gm=mkdir('/','Games');['tetris-99.sav','pocket-garden.zip'].forEach(function(n){file(gm,n,ri(1,9)*GB)});
[['old-phone.img',18*GB],['wedding-cut.mov',11*GB],['tax-2025.zip',2.4*GB],['resume-2026.pdf',.9*MB],['notes.md',14e3],['todo.txt',3e3],['kettle.jpg',4.2*MB],['dusk.jpg',6.8*MB],['passport-scan.pdf',3.1*MB],['budget.csv',48e3],['voice-memo.m4a',38*MB],['install.sh',6e3]].forEach(function(f){file('/',f[0],f[1])});
// target folder sizes that read like a real drive (sizes in GB as in the concept)
function total(p){var t=T[p],s=0,c=0;t.dirs.forEach(function(d){var r=total(d.path);d.size=r[0];d.count=r[1];s+=r[0];c+=r[1]});t.files.forEach(function(f){s+=f.size;c++});return [s,c]}
total('/');
var FREE=528*GB,TOT=FREE+total('/')[0];
function clone(e){var o={};for(var k in e)o[k]=e[k];return o}
var tone=(function(){var C={};return function(x){var k=x.path;if(C[k])return C[k];var f=180+(NagiGarden.hash(k)%400),sr=8000,n=sr*20,b=new Uint8Array(44+n),v=new DataView(b.buffer);
  function s(o,t){for(var i=0;i<t.length;i++)b[o+i]=t.charCodeAt(i)}s(0,'RIFF');v.setUint32(4,36+n,true);s(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr,true);v.setUint16(32,1,true);v.setUint16(34,8,true);s(36,'data');v.setUint32(40,n,true);
  for(var i=0;i<n;i++){var env=Math.min(1,i/4000,(n-i)/8000);b[44+i]=128+Math.round(18*env*Math.sin(2*Math.PI*f*i/sr)*(0.6+0.4*Math.sin(i/sr*1.3)))}
  var bin='';for(var i=0;i<b.length;i+=8192)bin+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return C[k]='data:audio/wav;base64,'+btoa(bin)}})();
var ups=[],cur='/';
var NOTES={};
var recentUps=[
  {vp:'/Downloads/wallpaper-dusk.jpg',sz:6.8*MB,at:now-400},
  {vp:'/Documents/tea-list.md',sz:14e3,at:now-80},
  {vp:'/Inbox/draft.md',sz:2400,at:now-20,pd:47}
];
function parentOf(p){return (p||'/').replace(/[^\/]+\/?$/,'')||'/'}
function noteOf(x){if(NOTES[x.path])return NOTES[x.path];
  if(/README\.md$/i.test(x.name))return '# Notes for this folder\n\nA short welcome that sits quietly at the top of the listing.\n\n- Tea at four.\n- The quiet is the point.\n\n## More\n\nThis extra paragraph is here so the note can expand. It is still just a fictional mockup, with a [calm link](https://example.com).\n\nYou can edit this in the reader if you have write access.\n';
  if(/budget/.test(x.name))return 'month,rent,food\n1,1200,340\n2,1200,310\n3,1200,365\n';
  return '# '+x.name+'\n\nA fictional note in the Nagi mockup.\n\n- The quiet is the point.\n- Tea at four.\n'}
var A={rootName:'Everything',user:'tri',
 start:function(){return location.hash.replace(/^#/,'')||'/'},here:function(){return location.hash.replace(/^#/,'')||'/'},
 go:function(p){cur=p;history.pushState({},'','#'+p)},
 ls:function(p){var t=T[p];if(!t)return Promise.reject(new Error('missing'));return new Promise(function(res){setTimeout(function(){var show=A.dots&&A.dots(),hid=function(x){return String(x.name||'').charAt(0)==='.'};res({path:p,dirs:t.dirs.filter(function(x){return show||!hid(x)}).map(clone),files:t.files.filter(function(x){return show||!hid(x)}).map(clone),free:FREE,total:TOT,perms:['read','write','move','delete','dot'],acct:'tri'})},60)})},
 perms:function(){return {read:1,write:1,move:1,del:1,dot:1}},canShare:function(){return true},
 dots:function(){return /(?:^|;\s*)dots=y(?:;|$)/.test(document.cookie)},
 setDots:function(v){document.cookie=v?'dots=y;path=/;SameSite=Lax;max-age=31536000':'dots=;path=/;SameSite=Lax;max-age=0'},
 url:function(x){if(/\.(flac|mp3|wav)$/i.test(x.name))return tone(x);if(/\.(jpe?g|png)$/i.test(x.name))return img(NagiGarden.hash(x.path),1600,1100);return '#'},
 thumb:function(x,kind){if(!/\.(jpe?g|png)$/i.test(x.name))return null;return img(NagiGarden.hash(x.path),kind==='preview'?960:320,kind==='preview'?720:240)},
 text:function(x){return Promise.resolve(noteOf(x))},
 isDataless:function(){return Promise.resolve(false)},
 readme:function(files){var rd=null,i,L=files||[];for(i=0;i<L.length;i++)if(!L[i].isDir&&/^README\.md$/i.test(L[i].name)){rd=L[i];break}
   if(!rd)return Promise.resolve(null);
   return Promise.resolve({text:noteOf(rd),name:rd.name,path:rd.path,ts:rd.ts,size:rd.size})},
 ups:function(){return Promise.resolve({f:recentUps.slice(),nu:recentUps.filter(function(x){return x.pd!=null}).length,nc:recentUps.filter(function(x){return x.pd==null}).length})},
 unpost:function(paths){paths=paths||[];recentUps=recentUps.filter(function(f){return paths.indexOf(f.vp)<0});
   paths.forEach(function(vp){var d=parentOf(vp),t=T[d];if(!t)return;t.files=t.files.filter(function(e){return e.path!=vp});t.dirs=t.dirs.filter(function(e){return e.path!=vp})});
   return Promise.resolve('ok')},
 dupes:function(){return Promise.resolve({ok:true,groups:[
    {size:4823441,n:3,paths:['/Photos/IMG_1042.jpg','/Backup/IMG_1042.jpg','/Archive/2019/IMG_1042.jpg']},
    {size:184320,n:2,paths:['/Notes/agenda.txt','/Archive/agenda-copy.txt']}
  ]})},
 saveText:function(x,body,lastmod){NOTES[x.path]=body;var d=parentOf(x.path),t=T[d];
   (t&&t.files||[]).forEach(function(e){if(e.path==x.path){e.size=body.length;e.ts=Date.now()/1000}});
   return Promise.resolve({ok:true,lastmod:Date.now(),size:body.length})},
 qr:null,loginUrl:function(){return 'login.html'},logoutUrl:function(){return 'login.html'},panelUrl:null,
 zip:function(){NagiApp&&document.querySelector('#nagi .toast')&&(function(){var t=document.querySelector('#nagi .toast');t.innerHTML='<i class="ni" style="--ni:var(--ni-download)"></i> In copyparty this downloads a zip';t.classList.add('on');setTimeout(function(){t.classList.remove('on')},2400)})()},
 search:function(q){q=q.toLowerCase();var out=[];Object.keys(T).forEach(function(d){T[d].files.concat(T[d].dirs).forEach(function(e){var hay=(e.name+' '+(e.tags.artist||'')+' '+(e.tags.album||'')).toLowerCase();if(hay.indexOf(q)>=0)out.push({name:e.name,path:e.path,dir:e.isDir?e.path:d,size:e.size,ts:e.ts,tags:e.tags,isDir:!!e.isDir})})});return new Promise(function(r){setTimeout(function(){r(out)},180)})},
 smartSearch:function(q){var self=this;return this.search(q).then(function(hits){return {hits:hits,engine:'smart',embedded:false,ms:180}})},
 smartStatus:function(){return Promise.resolve({ok:true,sidecar:true,model:true,files:0})},
 engine:function(){return localStorage.nagi_search==='default'?'default':'smart'},
 setEngine:function(v){localStorage.nagi_search=v==='default'?'default':'smart'},
 share:function(paths){return new Promise(function(r){setTimeout(function(){r('https://nagi.local/shr/'+Math.random().toString(36).slice(2,9)+'/')},500)})},
 mkdir:function(dir,name){mkdir(dir,name,now);return Promise.resolve()},
 rename:function(x,n){var d=x.path.replace(/[^\/]+\/?$/,'');var t=T[d];[t.dirs,t.files].forEach(function(l){l.forEach(function(e){if(e.path==x.path){e.name=n;e.path=d+encodeURIComponent(n)+(e.isDir?'/':'')}})});return Promise.resolve()},
 _take:function(x){var d=x.path.replace(/[^\/]+\/?$/,'')||'/',t=T[d],found=null;
   t.dirs=t.dirs.filter(function(e){if(e.path==x.path)found=e;return e.path!=x.path});
   t.files=t.files.filter(function(e){if(e.path==x.path)found=e;return e.path!=x.path});return found},
 move:function(x,dir){dir=dir.replace(/\/?$/,'/') ;var e=A._take(x);if(!e)return Promise.reject(new Error('missing'));
   e.path=dir+encodeURIComponent(e.name)+(e.isDir?'/':'');(e.isDir?T[dir].dirs:T[dir].files).push(e);if(e.isDir){T[e.path]=T[e.path]||T[x.path]||{dirs:[],files:[]}}return Promise.resolve()},
 copy:function(x,dir){dir=dir.replace(/\/?$/,'/') ;var e={name:x.name,path:dir+encodeURIComponent(x.name)+(x.isDir?'/':''),size:x.size,ts:x.ts,tags:x.tags||{},isDir:x.isDir,count:x.count,type:x.type};
   (e.isDir?T[dir].dirs:T[dir].files).push(e);if(e.isDir)T[e.path]={dirs:[],files:[]};return Promise.resolve()},
 del:function(list){list.forEach(function(x){var d=x.path.replace(/[^\/]+\/?$/,''),t=T[d];t.dirs=t.dirs.filter(function(e){return e.path!=x.path});t.files=t.files.filter(function(e){return e.path!=x.path})});return Promise.resolve()},
 pickFiles:function(){pick(false)},pickFolder:function(){pick(true)},
 onDrop:function(e){e.preventDefault();if(e.dataTransfer&&e.dataTransfer.files.length)queue([].slice.call(e.dataTransfer.files))},
 uploads:function(){return ups},
 uploadOpts:function(){return [{label:'Ask before uploading',hint:'Show the list of files and wait for a yes',value:!!A._ask,set:function(v){A._ask=v}},{label:'Keep hashing while uploading',hint:'Faster for many files; uses more CPU',value:true,set:function(){}},{label:'Randomise file names',hint:'Uploaded files get random names',value:false,set:function(){}},{label:'If a file already exists',choices:['Keep both (new name)','Replace if mine is newer','Replace if different','Skip it'],value:A._ow||0,set:function(v){A._ow=v}}]},
 theme:function(){return localStorage.nagi_theme||'paper'},
 setTheme:function(t){localStorage.nagi_theme=t;apply()},
 demoUpload:function(list){queue(list.map(function(x){return {name:x[0],size:x[1]}}))}
};
addEventListener('dragover',function(e){e.preventDefault()});
function pick(dir){var i=document.createElement('input');i.type='file';i.multiple=true;if(dir)i.webkitdirectory=true;i.onchange=function(){queue([].slice.call(i.files))};i.click()}
function queue(files){var dir=NagiApp.state.path;files.forEach(function(f){ups.push({name:f.name,size:f.size||ri(2,40)*MB,dir:dir,pct:0,state:'q',speed:'',eta:''})});run()}
function run(){if(run.t)return;run.t=setInterval(function(){var act=ups.filter(function(u){return u.state=='run'});if(!act.length){var q=ups.filter(function(u){return u.state=='q'})[0];if(q){q.state='run';act=[q]}}
  if(!act.length){clearInterval(run.t);run.t=null;return}
  act.forEach(function(u){var sp=38*MB*(.8+R()*.4),inc=sp*.25/u.size*100;u.pct=Math.min(100,u.pct+Math.max(inc,1.2));u.speed=(sp/MB).toFixed(1)+' MB/s';var left=(100-u.pct)/100*u.size/sp;u.eta=left>1?Math.ceil(left)+'s':'';if(u.pct>=100){u.state='ok';file(u.dir,u.name,u.size,{},Date.now()/1000);total('/')}})},250)}
function auto(){var h=new Date().getHours();return h>=17||h<6?'yugure':'paper'}
function apply(){var t=A.theme();if(t=='sky')t=auto();document.documentElement.className=(t=='yugure'?'fz f z':'fy f y')+' nagi mock'}
apply();
window.NagiMock=A;
})();
