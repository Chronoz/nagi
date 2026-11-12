/* Nagi koi: a calm koi pond that lives inside the "free space" pebble.

   Koi pond adapted from Mia-lab's "Koi Pond, Noon"
     https://github.com/MiaAI-Lab/Claude-Fable-5.2-HTML-Files  (009-koi-pond-noon.html)
     https://miaai-lab.github.io/Claude-Fable-5.2-HTML-Files/009-koi-pond-noon.html
   used with thanks. The original carries no licence notice; its author retains all rights to
   their portions. The MIT licence of this repository covers Nagi's own code only, not those portions.

   Kept from the original: the towed-chain spine, body profile, tail/fin shapes, varieties and
   patterns, soft low-res floor shadows, idle gulps. Dropped for calm and CPU: lily pads, striders,
   the fly, feeding, sound, pointer cursor. Re-done for Nagi: layered water/koi canvases, dirty-rect
   redraw, idle 30 fps, sizes that scale with the stone instead of the viewport. */
(function(){'use strict';
var TAU=Math.PI*2,NSEG=14,SHK=.3;
var PROF_S=[0,.012,.035,.07,.13,.22,.32,.45,.6,.75,.88,1],PROF_W=[0,.036,.06,.08,.098,.113,.119,.11,.088,.06,.037,.023];
function rngf(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function clamp(v,a,b){return v<a?a:v>b?b:v}function lerp(a,b,t){return a+(b-a)*t}
function angd(a,b){var d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d}
function smooth(c,p,n){var lx=p[n*2-2],ly=p[n*2-1];c.moveTo((lx+p[0])/2,(ly+p[1])/2);for(var i=0;i<n;i++){var x=p[i*2],y=p[i*2+1],j=(i+1)%n;c.quadraticCurveTo(x,y,(x+p[j*2])/2,(y+p[j*2+1])/2)}c.closePath()}
function wprof(s){if(s<=0)return 0;if(s>=1)return PROF_W[11];for(var i=1;i<12;i++)if(s<=PROF_S[i])return lerp(PROF_W[i-1],PROF_W[i],(s-PROF_S[i-1])/(PROF_S[i]-PROF_S[i-1]));return PROF_W[11]}
function inside(P,x,y){var c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var a=P[i],b=P[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
// distance to the polygon edge and the inward direction there
function edge(P,x,y,o){var best=1e9,bx=0,by=0;for(var i=0;i<P.length;i++){var a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1),px=a[0]+t*dx,py=a[1]+t*dy,d=Math.hypot(x-px,y-py);if(d<best){best=d;bx=px;by=py}}
  var inn=inside(P,x,y),ux=(x-bx)/(best||1),uy=(y-by)/(best||1);if(!inn){ux=-ux;uy=-uy}o.d=inn?best:-best;o.ux=ux;o.uy=uy;return o}
var E={d:0,ux:0,uy:0};
var ORDER=['kohaku','ogon','showa','tancho','kohaku','showa'];
function blob(r,s,u,rs,ru,col,wob){var v=[];for(var i=0;i<12;i++)v.push(1-wob/2+r()*wob);return {s:s,u:u,rs:rs,ru:ru,col:col,v:v}}
function makePattern(f,r,P){var b=[],i,n;f.base=P.white;f.fin=P.finW;
  if(f.variety=='kohaku'){n=3+Math.floor(r()*3);for(i=0;i<n;i++)b.push(blob(r,.07+(i+r()*.7)/n*.86,(r()-.5)*.9,.07+r()*.085,.75+r()*.75,P.orange,.5))}
  else if(f.variety=='showa'){for(i=0;i<3;i++)b.push(blob(r,.08+(i+r()*.6)/3*.8,(r()-.5)*.8,.08+r()*.07,.8+r()*.6,P.orange,.5));n=4+Math.floor(r()*2);for(i=0;i<n;i++)b.push(blob(r,.04+(i+r())/n*.92,(r()-.5)*1.7,.045+r()*.07,.5+r()*.8,P.ink,.7));f.finDark=true}
  else if(f.variety=='tancho')b.push(blob(r,.1,0,.052,.66,P.orange,.14));
  else{f.base=P.gold;f.fin=P.finG}
  f.blobs=b}
var SP={x:0,y:0,nx:0,ny:0};
function spineAt(f,s){var t=s*(NSEG-1),i=clamp(Math.floor(t),0,NSEG-2),fr=t-i;SP.x=f.px[i]+(f.px[i+1]-f.px[i])*fr;SP.y=f.py[i]+(f.py[i+1]-f.py[i])*fr;var g=clamp(fr,0,1);SP.nx=f.nx[i]+(f.nx[i+1]-f.nx[i])*g;SP.ny=f.ny[i]+(f.ny[i+1]-f.ny[i])*g;return SP}
function poseFish(f){var n=f.nodes,i,tx,ty,d,A=f.B*.062*(.3+.7*f.thrust);
  for(i=0;i<NSEG;i++){var a=Math.max(0,i-1),b=Math.min(NSEG-1,i+1);tx=n[b*2]-n[a*2];ty=n[b*2+1]-n[a*2+1];d=Math.hypot(tx,ty)||1;tx/=d;ty/=d;var s=i/(NSEG-1),off=A*(.1+s*s*1.15)*Math.sin(f.phase-s*5.2);f.px[i]=n[i*2]-ty*off;f.py[i]=n[i*2+1]+tx*off}
  for(i=0;i<NSEG;i++){var a2=Math.max(0,i-1),b2=Math.min(NSEG-1,i+1);tx=f.px[b2]-f.px[a2];ty=f.py[b2]-f.py[a2];d=Math.hypot(tx,ty)||1;f.nx[i]=-ty/d;f.ny[i]=tx/d}
  var o=f.out;for(i=0;i<12;i++){spineAt(f,PROF_S[i]);var w=PROF_W[i]*f.B;if(i===0){o[0]=SP.x;o[1]=SP.y;continue}o[i*2]=SP.x+SP.nx*w;o[i*2+1]=SP.y+SP.ny*w;var k=23-i;o[k*2]=SP.x-SP.nx*w;o[k*2+1]=SP.y-SP.ny*w}}
function tailPath(c,f){var e=NSEG-1,bx=f.px[e],by=f.py[e],nx=f.nx[e],ny=f.ny[e],tx=ny,ty=-nx,sw=.62*(.35+.65*f.thrust)*Math.sin(f.phase-6.1),cs=Math.cos(sw),sn=Math.sin(sw),dx=tx*cs-ty*sn,dy=tx*sn+ty*cs,TL=f.B*.36*f.tailK,spd=.5+.13*Math.sin(f.phase*2+1)-.12*f.thrust,w=PROF_W[11]*f.B;
  function pt(an,len){var c2=Math.cos(an),s2=Math.sin(an);return [bx+(dx*c2-dy*s2)*len,by+(dx*s2+dy*c2)*len]}
  var tl=pt(spd,TL),tr=pt(-spd,TL*.94),no=pt(sw*.3,TL*.56),c1=pt(spd*1.7,TL*.5),c2=pt(spd*.55,TL*.9),c3=pt(-spd*.55,TL*.86),c4=pt(-spd*1.7,TL*.5);
  c.beginPath();c.moveTo(bx+nx*w,by+ny*w);c.quadraticCurveTo(c1[0],c1[1],tl[0],tl[1]);c.quadraticCurveTo(c2[0],c2[1],no[0],no[1]);c.quadraticCurveTo(c3[0],c3[1],tr[0],tr[1]);c.quadraticCurveTo(c4[0],c4[1],bx-nx*w,by-ny*w);c.closePath();return [bx,by,tl,tr,no]}
function finPath(c,f,s,side,ang,len,fat){spineAt(f,s);var nx=SP.nx,ny=SP.ny,tx=ny,ty=-nx,w=wprof(s)*f.B*.82,ax=SP.x+nx*side*w,ay=SP.y+ny*side*w,cs=Math.cos(ang),sn=Math.sin(ang),dx=tx*cs+nx*side*sn,dy=ty*cs+ny*side*sn,qx=-tx*sn+nx*side*cs,qy=-ty*sn+ny*side*cs,tipx=ax+dx*len,tipy=ay+dy*len;
  c.beginPath();c.moveTo(ax-tx*len*.1,ay-ty*len*.1);c.quadraticCurveTo(ax+dx*len*.5+qx*len*fat,ay+dy*len*.5+qy*len*fat,tipx,tipy);c.quadraticCurveTo(ax+dx*len*.72-qx*len*fat*.75,ay+dy*len*.72-qy*len*fat*.75,ax+tx*len*.16,ay+ty*len*.16);c.closePath();return [ax,ay,tipx,tipy,qx,qy]}
function pecAngle(f,side){return 1+.36*Math.sin(f.paddle+(side>0?0:2.1))-.62*f.thrust}
function drawShadow(c,f){c.beginPath();smooth(c,f.out,23);c.fill();tailPath(c,f);c.fill();finPath(c,f,.2,1,pecAngle(f,1),f.B*.24,.3);c.fill();finPath(c,f,.2,-1,pecAngle(f,-1),f.B*.24,.3);c.fill()}
function drawFish(c,f,P){var i,B=f.B,side,r;
  for(side=-1;side<=1;side+=2){r=finPath(c,f,.2,side,pecAngle(f,side),B*.24,.3);c.fillStyle=f.fin;c.fill();if(f.finDark){c.fillStyle='rgba(27,27,27,.3)';c.fill()}
    c.strokeStyle='rgba(20,40,42,.14)';c.lineWidth=.6;for(i=-1;i<=1;i++){c.beginPath();c.moveTo(r[0],r[1]);c.lineTo(lerp(r[0],r[2],.86)+r[4]*i*B*.035,lerp(r[1],r[3],.86)+r[5]*i*B*.035);c.stroke()}
    finPath(c,f,.56,side,.62+.15*Math.sin(f.paddle*.7+side),B*.11,.32);c.fillStyle=f.fin;c.fill()}
  var tp=tailPath(c,f);c.fillStyle=f.fin;c.fill();
  if(f.variety=='kohaku'||f.variety=='showa'){var tg=c.createRadialGradient(tp[0],tp[1],0,tp[0],tp[1],B*.3);tg.addColorStop(0,f.variety=='showa'?'rgba(27,27,27,.5)':P.orangeA);tg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=tg;c.fill()}
  c.beginPath();smooth(c,f.out,23);c.fillStyle=f.base;c.fill();c.save();c.clip();
  var pts=[];for(i=0;i<f.blobs.length;i++){var b=f.blobs[i];pts.length=0;for(var k=0;k<12;k++){var a=k/12*TAU,s=b.s+Math.cos(a)*b.rs*b.v[k],uu=b.u+Math.sin(a)*b.ru*b.v[k];spineAt(f,s);var w=wprof(clamp(s,.07,.94))*B*uu;pts.push(SP.x+SP.nx*w,SP.y+SP.ny*w)}c.fillStyle=b.col;c.beginPath();smooth(c,pts,12);c.fill()}
  c.lineJoin='round';c.strokeStyle=f.variety=='ogon'?'rgba(140,90,20,.32)':'rgba(20,40,42,.2)';c.lineWidth=B*.085;c.beginPath();smooth(c,f.out,23);c.stroke();
  c.lineCap='round';c.beginPath();for(i=0;i<=10;i++){spineAt(f,.06+i*.07);var hx=SP.x-B*.012,hy=SP.y-B*.02;if(i)c.lineTo(hx,hy);else c.moveTo(hx,hy)}c.strokeStyle=f.variety=='ogon'?'rgba(255,244,214,.5)':'rgba(255,255,255,.26)';c.lineWidth=B*.05;c.stroke();c.restore();
  c.beginPath();for(i=0;i<=6;i++){spineAt(f,.3+i*.055);if(i)c.lineTo(SP.x,SP.y);else c.moveTo(SP.x,SP.y)}c.strokeStyle=f.variety=='ogon'?'rgba(140,90,20,.42)':'rgba(20,40,42,.22)';c.lineWidth=B*.016;c.stroke();c.lineCap='butt';
  spineAt(f,.085);var ew=wprof(.085)*B*.8,er=Math.max(.8,B*.017);c.fillStyle=P.ink;c.beginPath();c.arc(SP.x+SP.nx*ew,SP.y+SP.ny*ew,er,0,TAU);c.fill();c.beginPath();c.arc(SP.x-SP.nx*ew,SP.y-SP.ny*ew,er,0,TAU);c.fill()}

/* ---------- the pond ---------- */
var pond=null,parked=null,mq=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
function palette(el){var cs=getComputedStyle(el),g=function(n,d){return (cs.getPropertyValue(n)||'').trim()||d},dark=document.documentElement.classList.contains('z')||/yugure|z/.test(el.className||'');
  return {dark:dark,orange:g('--n-window','#E07A2E'),orangeA:'rgba(224,122,46,.45)',gold:g('--n-gold','#D9A441'),ink:'#1C2626',white:dark?'#EFE6D2':'#F6F0E2',finW:'rgba(246,240,226,.62)',finG:'rgba(232,196,120,.7)',
    w0:dark?'#3F7489':'#8DBACB',w1:dark?'#22506A':'#4F87A0',w2:dark?'#0F2A3B':'#2A5670',shade:dark?'#04121b':'#0f2a3a'}}
function Pond(host,cell,o){this.host=host;this.key=o.key;this.fish=[];this.rip=[];this.T=0;this.acc=0;this.last=0;this.raf=0;
  // v3f layers (bottom→top), all clipped once by the wrapper's CSS clip-path (no per-frame clip):
  //   floor (static canvas) · two tiny caustic canvases upscaled by CSS and cross-faded by opacity ·
  //   three wave bands moved by a CSS transform animation · koi canvas (the only per-frame drawing) · rim (static)
  var cv=this.cv=document.createElement('div');cv.className='koi';cv.setAttribute('aria-hidden','true');
  var L=function(t,c){var e=document.createElement(t);e.className=c;cv.appendChild(e);return e};
  this.wc=L('canvas','kw');this.kc=L('canvas','kk');var O=function(){return document.createElement('canvas')};this.fl=O();this.lc=O();
  this.ca=document.createElement('canvas');this.cb=document.createElement('canvas');host.insertBefore(cv,o.before||null);
  this.sh=document.createElement('canvas');if(o.interactive)this.wire();
  var me=this;if(window.IntersectionObserver){this.io=new IntersectionObserver(function(es){me.vis=es[es.length-1].isIntersecting;if(me.vis)me.start();else me.stop()});this.vis=true;this.io.observe(cv)}
  this.fit(cell,o)}
Pond.prototype.wire=function(){var me=this,cv=this.cv;cv.classList.add('live');
  function at(e){var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;return {x:x,y:y,in:inside(me.P,x,y)}}
  cv.addEventListener('pointermove',function(e){var a=at(e);me.ptr={x:a.x,y:a.y,on:a.in};cv.style.cursor=a.in?'pointer':''});
  cv.addEventListener('pointerleave',function(){me.ptr=null});
  cv.addEventListener('pointerdown',function(e){var a=at(e);if(!a.in)return;e.stopPropagation();me.tap(a.x,a.y)});
  ['click','dblclick','mousedown','mouseup','contextmenu'].forEach(function(t){cv.addEventListener(t,function(e){var a=at(e);if(a.in)e.stopPropagation()})})};
// a tap on the water: a ripple, and nearby koi dart away from it
Pond.prototype.tap=function(x,y){this.rip.push({x:x,y:y,t:0,R:this.S*.16});this.rip.push({x:x,y:y,t:-.35,R:this.S*.12});
  this.fish.forEach(function(f){var dx=f.x-x,dy=f.y-y,d=Math.hypot(dx,dy);if(d<f.B*2.8){f.fleeT=.7+Math.random()*.6;f.fleeA=Math.atan2(dy,dx)+(Math.random()-.5)*.6}});
  if(mq.matches){this.step(.05,true);this.draw()}else this.start()};
// fit to the stone. Called on every garden render, so it must be idempotent: one persistent canvas,
// resized (and therefore cleared) only when its pixel size really changes, redrawn in the same task,
// and the koi keep swimming where they are (rescaled), never re-spawned.
Pond.prototype.fit=function(cell,o){var P=cell.poly,bb=[1e9,1e9,-1e9,-1e9];P.forEach(function(p){bb[0]=Math.min(bb[0],p[0]);bb[1]=Math.min(bb[1],p[1]);bb[2]=Math.max(bb[2],p[0]);bb[3]=Math.max(bb[3],p[1])});
  var ow=this.W,oh=this.H,W=bb[2]-bb[0],H=bb[3]-bb[1];this.bb=bb;this.W=W;this.H=H;this.d=o.d;this.av=o.avoid?[o.avoid[0]-bb[0],o.avoid[1]-bb[1],o.avoid[2]]:null;
  this.P=P.map(function(p){return [p[0]-bb[0],p[1]-bb[1]]});
  var A=0,cx=0,cy=0;for(var i=0;i<P.length;i++){var a=this.P[i],b=this.P[(i+1)%P.length];A+=a[0]*b[1]-b[0]*a[1];cx+=a[0];cy+=a[1]}A=Math.abs(A/2);cx/=P.length;cy/=P.length;this.area=A;this.S=Math.sqrt(A);this.ctr=[cx,cy];
  // inward unit normal per edge, for smooth wall avoidance
  this.EN=this.P.map(function(a,i,Q){var b=Q[(i+1)%Q.length],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;if(nx*(cx-(a[0]+b[0])/2)+ny*(cy-(a[1]+b[1])/2)<0){nx=-nx;ny=-ny}return [nx,ny]});
  // internal resolution: DPR ≤ 1.5 and at most ~0.35 MP for the pond
  var low=!!((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.connection&&(navigator.connection.saveData||navigator.connection.effectiveType==="slow-2g")));
  this.low=low;var D=Math.min(low?1:1.5,window.devicePixelRatio||1);if(W*H*D*D>(low?180000:350000))D=Math.max(1,Math.sqrt((low?180000:350000)/(W*H)));this.DPR=D;
  var cv=this.cv;cv.style.left=bb[0]+'px';cv.style.top=bb[1]+'px';cv.style.width=W+'px';cv.style.height=H+'px';
  var kc=this.kc,pw=Math.round(W*D),ph=Math.round(H*D);if(kc.width!==pw||kc.height!==ph){kc.width=pw;kc.height=ph}this.dirty=null;
  // the water (floor + light + rim) lives on its own canvas at ≤1× and is recomposed at ~20 Hz: it only
  // drifts slowly. The koi canvas above it is transparent and only holds shadows, koi and ripples.
  var WD=this.WD=Math.min(1,D),ww=Math.round(W*WD),wh=Math.round(H*WD),wc=this.wc;if(wc.width!==ww||wc.height!==wh){wc.width=ww;wc.height=wh}this.wT=-1;
  if(this.sh.width!==Math.ceil(W*SHK)||this.sh.height!==Math.ceil(H*SHK)){this.sh.width=Math.ceil(W*SHK);this.sh.height=Math.ceil(H*SHK)}
  this.path=new Path2D(o.d);var pal=palette(o.theme||document.body),pk=pw+'x'+ph+(pal.dark?'d':'p');this.pal=pal;
  if(pk!==this.pk){this.pk=pk;this.paintFloor();this.bakeRim();this.setupCaus()}
  this.wa=pal.dark?.035:.06;this.cal=pal.dark?.28:.42;
  var n=clamp(Math.round(A/42000)+2,3,6),base=this.S*.27,me=this;
  if(!this.fish.length){for(var k=0;k<n;k++)this.fish.push(this.make(k,base));for(k=0;k<90;k++)this.step(.1,true)}
  else{var sx=W/(ow||W),sy=H/(oh||H),ks=base/(this.fish[0].Bk||base);
    if(Math.abs(sx-1)>1e-3||Math.abs(sy-1)>1e-3||Math.abs(ks-1)>1e-3)this.fish.forEach(function(f){f.x*=sx;f.y*=sy;for(var j=0;j<NSEG;j++){f.nodes[j*2]*=sx;f.nodes[j*2+1]*=sy}f.Bk=base;f.B*=ks;f.cruise*=ks});
    while(this.fish.length<n)this.fish.push(this.make(this.fish.length,base));if(this.fish.length>n)this.fish.length=n;this.fish.forEach(poseFish)}
  this.draw()};
Pond.prototype.make=function(i,base){var r=rngf(7001+i*131+(this.key?this.key.length*17:0)),f={variety:ORDER[i%ORDER.length]},size=[1,.78,.62,.86,.5,.7][i%6]*(.92+r()*.16);
  f.Bk=base;f.B=base*size;f.cruise=f.B*(.32+r()*.12);f.tailK=.9+r()*.3;makePattern(f,r,this.pal);
  var tries=0,x,y;var a0=i/6*TAU+r()*.6;do{var rr0=.18+.22*r();x=this.W*(.5+Math.cos(a0)*rr0);y=this.H*(.5+Math.sin(a0)*rr0);a0+=.7;tries++}while((!inside(this.P,x,y)||edge(this.P,x,y,E).d<f.B*.5)&&tries<50);
  f.x=x;f.y=y;f.h=r()*TAU;f.speed=f.cruise;f.thrust=.6;f.phase=r()*TAU;f.paddle=r()*TAU;f.wander=0;f.fleeT=0;f.fleeA=0;f.gulp=8+r()*30;f.rnd=r;
  f.nodes=new Float32Array(NSEG*2);f.px=new Float32Array(NSEG);f.py=new Float32Array(NSEG);f.nx=new Float32Array(NSEG);f.ny=new Float32Array(NSEG);f.out=new Float32Array(46);
  var seg=f.B/(NSEG-1);for(var k=0;k<NSEG;k++){f.nodes[k*2]=f.x-Math.cos(f.h)*seg*k;f.nodes[k*2+1]=f.y-Math.sin(f.h)*seg*k}poseFish(f);return f};
Pond.prototype.paintFloor=function(){var c=this.fl,W=this.W,H=this.H,D=this.DPR,p=this.pal;c.width=Math.round(W*D);c.height=Math.round(H*D);var x=c.getContext('2d');x.setTransform(D,0,0,D,0,0);
  var cx=W*.42,cy=H*.4,g=x.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.72);g.addColorStop(0,p.w0);g.addColorStop(.55,p.w1);g.addColorStop(1,p.w2);x.fillStyle=g;x.fillRect(0,0,W,H);
  // a few soft pebbles on the floor, scaled to the stone
  var r=rngf(4411),n=Math.round(this.area/900);for(var i=0;i<n;i++){var px=r()*W,py=r()*H,rad=(.006+r()*r()*.02)*this.S,sq=.6+r()*.4,rot=r()*Math.PI;x.fillStyle=r()>.5?'rgba(255,255,255,'+(.03+r()*.05)+')':'rgba(0,0,0,'+(.05+r()*.06)+')';x.beginPath();x.ellipse(px,py,rad,rad*sq,rot,0,TAU);x.fill()}};
// caustic light (from the source page), on a small grid scaled up: cheap, soft
// caustic light (the source page's formula) on a small grid. To keep every frame the same cost (a heavy
// frame every so often is what made frames repeat and the koi then jump), the next texture is computed a
// few rows per frame into a back buffer, and the last two finished textures cross-fade continuously.
Pond.prototype.setupCaus=function(){var W=this.W,H=this.H,cell=Math.max(5,Math.max(W,H)/72),cw=Math.max(8,Math.round(W/cell)),ch=Math.max(8,Math.round(H/cell));
  this.cw=cw;this.ch=ch;this.csc=TAU*(Math.max(W,H)/(this.S*.42))/Math.max(cw,ch);
  var m=this.cmask=new Float32Array(cw*ch);for(var y=0;y<ch;y++)for(var x=0;x<cw;x++){var ux=(x+.5)/cw-.45,uy=(y+.5)/ch-.42;m[y*cw+x]=255*clamp(1-Math.hypot(ux,uy)*1.25,.25,1)}
  this.ca.width=this.cb.width=this.lc.width=cw;this.ca.height=this.cb.height=this.lc.height=ch;this.cA=this.ca;this.cB=this.cb;
  var cx=this.cA.getContext('2d');this.cimg=cx.createImageData(cw,ch);var d=this.cimg.data;for(var i=0;i<d.length;i+=4){d[i]=236;d[i+1]=248;d[i+2]=255}
  this.CP=.5;// seconds of pond time per caustic texture
  this.ct0=this.T||0;this.cRows(0,ch,this.ct0);this.cA.getContext('2d').putImageData(this.cimg,0,0);
  this.cRows(0,ch,this.ct0+this.CP);this.cB.getContext('2d').putImageData(this.cimg,0,0);this.crow=0;this.cNext=this.ct0+2*this.CP};
Pond.prototype.cRows=function(y0,y1,tt){var cw=this.cw,d=this.cimg.data,sc=this.csc,inten=.005,mk=this.cmask,time=tt*.38+3.1;
  for(var y=y0;y<y1;y++){var py=y*sc-250,k=y*cw*4+3,q=y*cw;for(var x=0;x<cw;x++){var px=x*sc-250,ix=px,iy=py,cc=1;for(var n=0;n<3;n++){var t=time*(1-3.5/(n+1)),nx=px+Math.cos(t-ix)+Math.sin(t+iy),ny=py+Math.sin(t-iy)+Math.cos(t+ix);ix=nx;iy=ny;var a=px/(Math.sin(ix+t)/inten),b=py/(Math.cos(iy+t)/inten);cc+=1/Math.sqrt(a*a+b*b)}
    cc/=3;cc=1.17-Math.pow(cc,1.4);var v=cc*cc;v=v*v;v=v*v;d[k]=(v>1?1:v)*mk[q++];k+=4}}};
// advance the caustic cycle: rows are spread over the cycle so the work per frame is constant
Pond.prototype.cTick=function(){var T=this.T||0,u=(T-this.ct0)/this.CP;
  var want=Math.min(this.ch,Math.ceil(clamp(u,0,1)*this.ch*1.25));if(want>this.crow){this.cRows(this.crow,want,this.cNext);this.crow=want}
  if(u>=1){if(this.crow<this.ch){this.cRows(this.crow,this.ch,this.cNext);this.crow=this.ch}
    var t=this.cA;this.cA=this.cB;this.cB=t;this.cB.getContext('2d').putImageData(this.cimg,0,0);this.ct0+=this.CP;this.cNext+=this.CP;this.crow=0;u=(T-this.ct0)/this.CP;
    if(u>1){this.ct0=T;u=0}} // after a long pause: restart the cycle from now
  return clamp(u,0,1)};
Pond.prototype.step=function(dt,quiet){var fish=this.fish,P=this.P,i;
  for(i=0;i<fish.length;i++){var f=fish[i],fx=0,fy=0,r=f.rnd,vt=f.cruise;
    f.wander+=(r()-.5)*dt*4;f.wander*=1-dt*.3;f.wander=clamp(f.wander,-1,1);fx+=Math.cos(f.h+f.wander);fy+=Math.sin(f.h+f.wander);
    var m=f.B*.75,k;for(var e=0;e<P.length;e++){var a=P[e],b=P[(e+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],tt=clamp(((f.x-a[0])*ex+(f.y-a[1])*ey)/(ex*ex+ey*ey||1),0,1),dd0=Math.hypot(f.x-a[0]-tt*ex,f.y-a[1]-tt*ey);if(dd0<m){k=(m-dd0)/m*3.2/Math.max(1,P.length/12);fx+=this.EN[e][0]*k;fy+=this.EN[e][1]*k}}
    if(!inside(P,f.x,f.y)){var qx=this.ctr[0]-f.x,qy=this.ctr[1]-f.y,qd=Math.hypot(qx,qy)||1;fx+=qx/qd*4;fy+=qy/qd*4}
    for(var j=0;j<fish.length;j++){var o=fish[j];if(o===f)continue;var dx=f.x-o.x,dy=f.y-o.y,d=Math.hypot(dx,dy)||1,lim=(f.B+o.B)*.62;if(d<lim){k=(lim-d)/lim*1.8;fx+=dx/d*k;fy+=dy/d*k}}
    if(f.fleeT>0){f.fleeT-=dt;fx+=Math.cos(f.fleeA)*5;fy+=Math.sin(f.fleeA)*5;vt=f.cruise*3.6;f.thrust=1}
    else if(this.ptr&&this.ptr.on){var px=this.ptr.x-f.x,py=this.ptr.y-f.y,pd=Math.hypot(px,py)||1,R2=f.B*2.6,wq=pd<R2?Math.sin(Math.PI*clamp((pd-f.B*.3)/(R2-f.B*.3),0,1)):0;if(wq>0){fx+=px/pd*1.3*wq;fy+=py/pd*1.3*wq;vt=f.cruise*(1+.2*wq)}}
    // keep the stone's label clear so it stays legible
    if(this.av){var ax=f.x-this.av[0],ay=f.y-this.av[1],ad=Math.hypot(ax,ay)||1,al=this.av[2]+f.B*.35;if(ad<al){k=(al-ad)/al*2.4;fx+=ax/ad*k;fy+=ay/ad*k}}
    f.thrust*=Math.exp(-dt*2.6);if(f.speed<vt*.62&&f.thrust<.22)f.thrust=1;f.speed+=(f.thrust*vt*2.6-f.speed*.6)*dt;
    var dh=angd(Math.atan2(fy,fx),f.h);f.h+=clamp(dh*3,-1.6,1.6)*dt;f.x+=Math.cos(f.h)*f.speed*dt;f.y+=Math.sin(f.h)*f.speed*dt;
    f.phase+=dt*(2+7.5*f.thrust+f.speed/f.B*3);f.paddle+=dt*(2.6+f.thrust);
    f.gulp-=dt;if(f.gulp<=0){f.gulp=24+r()*40;if(!quiet)this.rip.push({x:f.x,y:f.y,t:0,R:f.B*.5})}
    var n=f.nodes,seg=f.B/(NSEG-1);n[0]=f.x;n[1]=f.y;for(var q=1;q<NSEG;q++){var ax=n[q*2]-n[q*2-2],ay=n[q*2+1]-n[q*2-1],dd=Math.hypot(ax,ay)||1;n[q*2]=n[q*2-2]+ax/dd*seg;n[q*2+1]=n[q*2-1]+ay/dd*seg}}
  for(i=0;i<fish.length;i++)poseFish(fish[i]);
  for(i=this.rip.length-1;i>=0;i--){this.rip[i].t+=dt;if(this.rip[i].t>3.2)this.rip.splice(i,1)}};
// the rim shade is baked once per fit; everything else is drawn every frame at constant cost.
Pond.prototype.bakeRim=function(){var W=this.W,H=this.H,D=this.DPR,p=this.pal,bb=this.bb,c=this.fl.getContext('2d');
  c.setTransform(D,0,0,D,-bb[0]*D,-bb[1]*D);c.save();c.clip(this.path);
  c.strokeStyle='rgba(6,24,40,'+(p.dark?.16:.09)+')';c.lineWidth=Math.max(16,this.S*.12);c.stroke(this.path);c.lineWidth=Math.max(6,this.S*.045);c.stroke(this.path);c.restore()};
// merge overlapping rectangles (so a shared area is drawn once)
function merge(R){var out=R.slice(),k=true;while(k){k=false;for(var a=0;a<out.length&&!k;a++)for(var b=a+1;b<out.length;b++){var A=out[a],B=out[b];if(A[0]<=B[2]&&B[0]<=A[2]&&A[1]<=B[3]&&B[1]<=A[3]){out[a]=[Math.min(A[0],B[0]),Math.min(A[1],B[1]),Math.max(A[2],B[2]),Math.max(A[3],B[3])];out.splice(b,1);k=true;break}}}return out}
Pond.prototype.draw=function(force){var c=this.kc.getContext('2d'),D=this.DPR,W=this.W,H=this.H,i,p=this.pal;
  // the light layer (caustics cross-fade + the three wave bands) is composed at the caustic grid size
  // (~70 px wide), then drawn scaled up, additively, over the static floor (+ baked rim): one full-size draw each
  if(this.cA){var u=this.cTick(),l=this.lc.getContext('2d'),cw=this.cw,ch=this.ch,kx=cw/W,T=this.T||0;l.setTransform(1,0,0,1,0,0);l.clearRect(0,0,cw,ch);
    l.globalAlpha=this.cal*(1-u);l.drawImage(this.cA,0,0);l.globalAlpha=this.cal*u;l.drawImage(this.cB,0,0);l.globalAlpha=1;
    l.setTransform(kx,0,0,ch/H,0,0);for(var wv=0;wv<3;wv++){var ph=(T*.035+wv*.37)%1,yy=-H*.3+ph*H*1.6,g2=l.createLinearGradient(0,yy-this.S*.07,W*.25,yy+this.S*.07);g2.addColorStop(0,'rgba(255,255,255,0)');g2.addColorStop(.5,'rgba(255,255,255,'+this.wa+')');g2.addColorStop(1,'rgba(255,255,255,0)');l.fillStyle=g2;l.fillRect(0,0,W,H)}}
  var T0=this.T||0;if(force||this.wT<0||T0-this.wT>=.05||T0<this.wT){this.wT=T0;var w=this.wc.getContext('2d'),WD=this.WD;w.setTransform(WD,0,0,WD,0,0);w.clearRect(0,0,W,H);w.save();w.translate(-this.bb[0],-this.bb[1]);w.clip(this.path);w.translate(this.bb[0],this.bb[1]);
    w.drawImage(this.fl,0,0,W,H);if(this.cA){w.globalCompositeOperation='lighter';w.drawImage(this.lc,0,0,W,H);w.globalCompositeOperation='source-over'}w.restore()}
  // dirty rectangles: only the areas around koi / ripples (this frame's and last frame's) are cleared and redrawn
  var R=[],ri;for(i=0;i<this.fish.length;i++){var g=this.fish[i],m=g.B*1.5+4;R.push([g.x-m,g.y-m,g.x+m+g.B*.12+3,g.y+m+g.B*.18+4])}
  for(i=0;i<this.rip.length;i++){var q=this.rip[i],m=q.R*1.75+3;if(q.t>=0)R.push([q.x-m,q.y-m,q.x+m,q.y+m])}
  R=merge(R);var Q=merge((this.dirty||[[0,0,W,H]]).concat(R));this.dirty=R;
  c.setTransform(D,0,0,D,0,0);for(ri=0;ri<Q.length;ri++){var z=Q[ri];c.clearRect(Math.floor(z[0]),Math.floor(z[1]),Math.ceil(z[2]-z[0])+1,Math.ceil(z[3]-z[1])+1)}
  c.save();c.translate(-this.bb[0],-this.bb[1]);c.clip(this.path);c.translate(this.bb[0],this.bb[1]);
  var s=this.sh.getContext('2d');s.setTransform(1,0,0,1,0,0);s.clearRect(0,0,this.sh.width,this.sh.height);s.fillStyle=p.shade;
  for(i=0;i<this.fish.length;i++){var f=this.fish[i],ox=f.B*.1+2,oy=f.B*.16+3;s.setTransform(SHK,0,0,SHK,ox*SHK,oy*SHK);drawShadow(s,f)}
  c.globalAlpha=p.dark?.42:.3;var sw=this.sh.width,shh=this.sh.height;for(ri=0;ri<R.length;ri++){var z=R[ri],x0=Math.max(0,z[0]),y0=Math.max(0,z[1]),x1=Math.min(W,z[2]),y1=Math.min(H,z[3]);if(x1-x0<1||y1-y0<1)continue;
    c.drawImage(this.sh,x0*SHK,y0*SHK,Math.min(sw,(x1-x0)*SHK),Math.min(shh,(y1-y0)*SHK),x0,y0,x1-x0,y1-y0)}c.globalAlpha=1;
  for(i=0;i<this.fish.length;i++)drawFish(c,this.fish[i],p);
  if(this.rip.length){c.lineWidth=1;for(i=0;i<this.rip.length;i++){var r=this.rip[i],k=r.t/3.2;if(k<0)continue;c.strokeStyle='rgba(255,255,255,'+(.22*(1-k))+')';c.beginPath();c.ellipse(r.x,r.y,r.R*(.3+k*1.4),r.R*(.3+k*1.4)*.92,0,0,TAU);c.stroke()}}c.restore()};
Pond.prototype.start=function(){var me=this;if(this.raf||mq.matches||document.hidden||this.vis===false)return;var gen=this.gen=(this.gen||0)+1;this.last=-1;
  // the original's loop: one update per animation frame, dt from rAF timestamps only, clamped to 50 ms
  var loop=function(now){if(me.gen!==gen)return;me.raf=requestAnimationFrame(loop);
    // ≤60 fps; ≤30 fps when nobody is looking (window unfocused, or no input for 90 s)
    if(me.last<0){me.last=now;return}if(now-me.last<(idle()||me.low?30:14))return;var dt=Math.min(.05,(now-me.last)/1000);me.last=now;
    if(!me.cv.offsetParent)return; // hidden (list or classic view): no work
    me.T+=dt;me.step(dt*.8);me.draw()};this.raf=requestAnimationFrame(loop)};
var lastAct=Date.now(),idleK=0,idleV=false;['pointermove','pointerdown','keydown','wheel','touchstart'].forEach(function(t){window.addEventListener(t,function(){lastAct=Date.now()},{passive:true,capture:true})});
function idle(){if(++idleK%30===0)idleV=!document.hasFocus()||Date.now()-lastAct>90000;return idleV}
Pond.prototype.stop=function(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.gen=(this.gen||0)+1};
Pond.prototype.destroy=function(){this.stop();if(this.io)this.io.disconnect();if(this.cv.parentNode)this.cv.parentNode.removeChild(this.cv)};
document.addEventListener('visibilitychange',function(){if(!pond)return;if(document.hidden)pond.stop();else pond.start()});
if(mq.addEventListener)mq.addEventListener('change',function(){if(!pond)return;if(mq.matches){pond.stop();pond.draw()}else pond.start()});
window.NagiKoi={
  // host: positioned container; cell: {poly:[[x,y]..]} in host coordinates; o: {d: svg path in host coords, key, before, theme}
  show:function(host,cell,o){if(pond&&(pond.key!==o.key||pond.host!==host)){NagiKoi.hide()}
    if(!pond&&parked&&parked.key===o.key&&parked.host===host){pond=parked;parked=null;var cv=pond.cv;cv.style.transition='none';cv.style.transform='';cv.style.opacity='';cv.classList.remove('in');host.insertBefore(cv,o.before||null);void cv.offsetWidth;cv.style.transition='';cv.classList.add('in');pond.fit(cell,o)}
    else if(!pond){if(parked){parked.destroy();parked=null}pond=new Pond(host,cell,o);pond.cv.classList.add('in')}else pond.fit(cell,o);if(o.before&&pond.cv.nextSibling!==o.before)host.insertBefore(pond.cv,o.before);if(typeof requestAnimationFrame==="function")requestAnimationFrame(function(){requestAnimationFrame(function(){if(pond)pond.start()})});else pond.start();return pond},
  // leaving the root: park the pond (stopped, detached) so coming back resumes the same koi without a flash
  hide:function(){if(pond){pond.stop();if(pond.cv.parentNode)pond.cv.parentNode.removeChild(pond.cv);parked=pond;pond=null}},
  // move with the garden's zoom transition (same transform, origin and timing) and fade like the other stones
  follow:function(tf,op){if(!pond)return;var cv=pond.cv;cv.style.transformOrigin=(-pond.bb[0])+'px '+(-pond.bb[1])+'px';cv.style.transform=tf||'';cv.style.opacity=op==null?'':String(op)},
  reset:function(){if(!pond)return;var cv=pond.cv;cv.style.transition='none';cv.style.transform='';cv.style.opacity='';void cv.offsetWidth;cv.style.transition=''},
  pause:function(){if(pond)pond.stop()},resume:function(){if(pond)pond.start()},
  get pond(){return pond}};
})();
