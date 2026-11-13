/* 凪 Nagi garden v3: a field of river pebbles.
   Weighted power diagram over every item at one level, Lloyd-relaxed and seeded (stable),
   optionally wrapped around a "hole" (the context column, top-left) so the field flows under it.
   Each cell is inset by half the gap and drawn with heavy cubic corner rounding, so neighbours
   share parallel curved gaps. Pure geometry, no DOM. */
(function(){
"use strict";
function area(p){var a=0;for(var i=0,n=p.length;i<n;i++){var q=p[i],r=p[(i+1)%n];a+=q[0]*r[1]-r[0]*q[1]}return a/2}
function centroid(p){var a=0,x=0,y=0;for(var i=0,n=p.length;i<n;i++){var q=p[i],r=p[(i+1)%n],c=q[0]*r[1]-r[0]*q[1];a+=c;x+=(q[0]+r[0])*c;y+=(q[1]+r[1])*c}if(Math.abs(a)<1e-9)return p.length?p[0].slice():[0,0];return [x/(3*a),y/(3*a)]}
function clip(p,a,b,c){var o=[],n=p.length;if(!n)return o;for(var i=0;i<n;i++){var P=p[i],Q=p[(i+1)%n],dp=a*P[0]+b*P[1]-c,dq=a*Q[0]+b*Q[1]-c;if(dp<=0)o.push(P);if((dp<0&&dq>0)||(dp>0&&dq<0)){var t=dp/(dp-dq);o.push([P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t])}}return o}
function rng(seed){var s=seed>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function hash(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function bbox(p){var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;p.forEach(function(q){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])});return [x0,y0,x1,y1]}
function ccw(p){return area(p)<0?p.slice().reverse():p}
// ray-cast point in polygon (any simple polygon)
function inside(p,x,y){var c=false;for(var i=0,n=p.length,j=n-1;i<n;j=i++){var a=p[i],b=p[j];if(((a[1]>y)!=(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c}return c}
function segDist(x,y,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
function edgeDist(p,x,y){var m=1e9;for(var i=0,n=p.length;i<n;i++)m=Math.min(m,segDist(x,y,p[i],p[(i+1)%n]));return m}
// approximate pole of inaccessibility: best label point + its clearance
function pole(p){if(p.length<3)return {x:0,y:0,r:0};var bb=bbox(p),c=centroid(p),best=null,br=-1;
  function test(x,y){if(!inside(p,x,y))return;var d=edgeDist(p,x,y);if(d>br){br=d;best=[x,y]}}
  test(c[0],c[1]);var N=9;for(var i=0;i<=N;i++)for(var j=0;j<=N;j++)test(bb[0]+(bb[2]-bb[0])*(i+.5)/(N+1),bb[1]+(bb[3]-bb[1])*(j+.5)/(N+1));
  if(!best)return {x:c[0],y:c[1],r:0};
  // refine around best, but keep a pull toward the centroid so labels sit visually centred
  var s=Math.max(bb[2]-bb[0],bb[3]-bb[1])/(N+1);for(var k=0;k<3;k++){s/=2;var b0=best.slice();for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++)test(b0[0]+a*s,b0[1]+b*s)}
  var cd=inside(p,c[0],c[1])?edgeDist(p,c[0],c[1]):0;if(cd>br*.82)return {x:c[0],y:c[1],r:cd};
  return {x:best[0],y:best[1],r:br}}
// remove the axis-aligned hole box [x0,y0,x1,y1] from a convex polygon (hole touches the bound's top-left)
function cut(p,h){if(!h)return p;var n=p.length,o=[],X=h[2],Y=h[3];if(!n)return p;
  function inH(q){return q[0]<X-1e-6&&q[1]<Y-1e-6&&q[0]>h[0]-1e3&&q[1]>h[1]-1e3}
  var any=false;for(var i=0;i<n;i++)if(inH(p[i])){any=true;break}
  if(!any){// an edge could still cut the hole's corner
    var hit=false;for(var i=0;i<n&&!hit;i++){var a=p[i],b=p[(i+1)%n];if(segBox(a,b,X,Y))hit=true}if(!hit)return p}
  // walk edges; replace the part inside the hole by the hole's boundary (right side x=X, bottom side y=Y)
  var st0=-1;for(var i=0;i<n;i++)if(!inH(p[i])){st0=i;break}if(st0<0)return [];p=p.slice(st0).concat(p.slice(0,st0));
  var side=null;
  for(var i=0;i<n;i++){var a=p[i],b=p[(i+1)%n],ia=inH(a);if(!ia)o.push(a);
    var ts=segBoxT(a,b,X,Y);if(!ts)continue;
    if(ts[0]>1e-9){var e=[a[0]+(b[0]-a[0])*ts[0],a[1]+(b[1]-a[1])*ts[0]];o.push(e);side=Math.abs(e[0]-X)<1e-4?'r':'b'}
    if(ts[1]<1-1e-9){var x=[a[0]+(b[0]-a[0])*ts[1],a[1]+(b[1]-a[1])*ts[1]],xs=Math.abs(x[0]-X)<1e-4?'r':'b';if(side&&side!=xs)o.push([X,Y]);o.push(x);side=null}}
  o=dedupe(o,.01);
  // a stone never wraps around the column's corner: keep the larger convex side instead (leaves a little open paper)
  var wraps=o.some(function(q){return Math.abs(q[0]-X)<1e-6&&Math.abs(q[1]-Y)<1e-6});
  if(wraps){var A1=clip(p,-1,0,-X),A2=clip(p,0,-1,-Y),a1=A1.length>2?Math.abs(area(A1)):0,a2=A2.length>2?Math.abs(area(A2)):0;return a1>=a2?A1:A2}
  return o}
function segBoxT(a,b,X,Y){// Liang-Barsky against box (-inf..X, -inf..Y)
  var t0=0,t1=1,dx=b[0]-a[0],dy=b[1]-a[1];
  function f(pp,q){if(Math.abs(pp)<1e-12)return q>=0;var r=q/pp;if(pp<0){if(r>t1)return false;if(r>t0)t0=r}else{if(r<t0)return false;if(r<t1)t1=r}return true}
  if(!f(dx,X-a[0]))return null;if(!f(dy,Y-a[1]))return null;if(t1-t0<1e-9)return null;return [t0,t1]}
function segBox(a,b,X,Y){var t=segBoxT(a,b,X,Y);return !!t&&t[1]-t[0]>1e-6}
function power(sites,w,bound,hole){var n=sites.length,cells=[];for(var i=0;i<n;i++){var c=bound.slice(),si=sites[i];for(var j=0;j<n&&c.length;j++){if(j===i)continue;var sj=sites[j],a=2*(sj[0]-si[0]),b=2*(sj[1]-si[1]),cc=(sj[0]*sj[0]+sj[1]*sj[1]-w[j])-(si[0]*si[0]+si[1]*si[1]-w[i]);c=clip(c,a,b,cc)}cells.push(c.length>2?cut(c,hole):c)}return cells}
function inRegion(bound,hole,x,y){return inside(bound,x,y)&&!(hole&&x<hole[2]&&y<hole[3])}
function pushOut(bound,hole,s){if(hole&&s[0]<hole[2]&&s[1]<hole[3]){if(hole[2]-s[0]<hole[3]-s[1])s[0]=hole[2]+2;else s[1]=hole[3]+2}return s}

/* items: [{key, weight, anchor:[x,y]?}], bound: convex polygon, o: {seed, iter, hole:[x0,y0,x1,y1]} */
function layout(items,bound,o){
  o=o||{};bound=ccw(bound);var n=items.length,hole=o.hole||null;if(!n)return [];
  var A=Math.abs(area(bound));if(hole){var hb=clip(clip(bound,1,0,hole[2]),0,1,hole[3]);A-=Math.abs(area(hb))}
  if(n===1){var c1=cut(bound,hole);return [{item:items[0],poly:c1,area:Math.abs(area(c1)),c:centroid(c1)}]}
  var tot=0;items.forEach(function(it){tot+=it.weight});
  var tgt=items.map(function(it){return A*it.weight/tot});
  var bb=bbox(bound),W=bb[2]-bb[0],H=bb[3]-bb[1],sites=[],w=[];
  // region centre (of the L when there is a hole)
  var rc=hole?[hole[2]+(bb[2]-hole[2])*.48,bb[1]+H*.56]:[bb[0]+W/2,bb[1]+H/2];
  var order=items.map(function(_,i){return i}).sort(function(a,b){return items[b].weight-items[a].weight});
  var R=Math.hypot(W,H)/2,under={};
  // seed a fair share of stones in the band under the column so the field flows beneath it
  if(hole&&hole[3]<bb[3]-20&&hole[2]>bb[0]+20){var r2=[bb[0],hole[3],Math.min(hole[2],bb[2]),bb[3]],a2=(r2[2]-r2[0])*(r2[3]-r2[1]),k2=Math.round(n*a2/A*1.05),cand=order.slice(1).filter(function(i){return !items[i].anchor&&!items[i].pin&&!items[i].more});
    cand.sort(function(a,b){return (hash(items[a].key||'')%997)-(hash(items[b].key||'')%997)});
    var w2=0,wt=tot*a2/A;for(var q=0;q<cand.length&&k2>0;q++){var i=cand[q];if(w2+items[i].weight>wt*1.15)continue;under[i]=r2;w2+=items[i].weight;k2--}}
  // corner fan (Kanso): one stone (Free, else the largest) is pinned in a corner and the rest radiate
  // out from it by size, so the gaps form concentric, curving flows.
  var cor=o.corner||null,ai=-1,acc=0,sx=1,sy=1,fk=0;
  if(cor){for(var q=0;q<n;q++)if(items[q].anchor)ai=q;if(ai<0){for(var q=0;q<order.length;q++)if(!items[order[q]].pin&&!items[order[q]].more){ai=order[q];break}if(ai<0)ai=order[0]}sx=Math.sqrt(W/H);sy=Math.sqrt(H/W);acc=tgt[ai];under={}}
  // first ring around the pinned stone: the next few stones, largest at the middle of the arc,
  // smaller ones toward its ends, so the pinned stone's edge reads as one smooth curve
  var rF=cor?Math.sqrt(4*tgt[ai]/Math.PI):0,ring=cor?Math.min(n-1,n>12?6:n>6?5:4):0,RA=[];
  if(ring){var mid=[.5,.24,.76,.06,.94,.38,.62].slice(0,ring);RA=mid}
  for(var k=0;k<n;k++){var i=order[k],rr=rng(hash((o.seed||'')+'|'+(items[i].key||(''+i)))),x,y,tries=0;
    if(cor&&i===ai){var r0=Math.sqrt(4*tgt[i]/Math.PI);x=cor[0]+r0*sx*.34;y=cor[1]+r0*sy*.34}
    else if(items[i].pin==='br'){var pr=Math.sqrt(Math.max(tgt[i],400)/Math.PI);x=bb[2]-Math.max(24,Math.min(pr*.55,W*.22));y=bb[3]-Math.max(24,Math.min(pr*.55,H*.22))}
    else if(cor&&fk<ring){var rd=rF*1.12+Math.sqrt(tgt[i]/Math.PI)*.9,an=RA[fk]*Math.PI/2;fk++;acc+=tgt[i];
      x=cor[0]+Math.cos(an)*rd*sx;y=cor[1]+Math.sin(an)*rd*sy;
      x=Math.min(bb[2]-6-rr()*20,Math.max(bb[0]+6,x));y=Math.min(bb[3]-6-rr()*20,Math.max(bb[1]+6,y))}
    else if(cor){var rd=Math.max(rF*1.6,Math.sqrt(4*(acc+tgt[i]*.5)/Math.PI)),an=(.05+.9*((fk*.618034+.31)%1))*Math.PI/2;fk++;acc+=tgt[i];
      x=cor[0]+Math.cos(an)*rd*sx;y=cor[1]+Math.sin(an)*rd*sy;
      x=Math.min(bb[2]-6-rr()*20,Math.max(bb[0]+6,x));y=Math.min(bb[3]-6-rr()*20,Math.max(bb[1]+6,y))}
    else if(items[i].pin==='br'){var pr=Math.sqrt(Math.max(tgt[i],400)/Math.PI);x=bb[2]-Math.max(24,Math.min(pr*.55,W*.22));y=bb[3]-Math.max(24,Math.min(pr*.55,H*.22))}
    else if(items[i].anchor){x=items[i].anchor[0];y=items[i].anchor[1]}
    else if(under[i]){var u=under[i];x=u[0]+(u[2]-u[0])*(.1+.8*rr());y=u[1]+(u[3]-u[1])*(.15+.7*rr())}
    else{var rk=Math.pow(k/Math.max(1,n-1),.75);do{var ang=rr()*Math.PI*2,rad=R*(.05+.85*rk)*(.75+.5*rr());x=rc[0]+Math.cos(ang)*rad*(W/Math.max(W,H))*1.15;y=rc[1]+Math.sin(ang)*rad*(H/Math.max(W,H))*1.15;tries++}while(!inRegion(bound,hole,x,y)&&tries<60)}
    if(!inRegion(bound,hole,x,y)){x=rc[0]+(rr()-.5)*W*.3;y=rc[1]+(rr()-.5)*H*.3}
    sites[i]=[x,y];w[i]=0}
  var cells,it=o.iter||100,still=0;
  for(var t=0;t<it;t++){
    cells=power(sites,w,bound,hole);
    var damp=cor?(t<it*.6?.6:.4):(t<it*.6?1:.55),moved=0;
    for(var i=0;i<n;i++){
      var c=cells[i],a=c.length>2?Math.abs(area(c)):0;
      if(a<1){w[i]=w[i]*.5+0;if(items[i].pin==='br'){sites[i]=[bb[2]-28,bb[3]-28]}else sites[i]=[sites[i][0]+(rc[0]-sites[i][0])*.02,sites[i][1]+(rc[1]-sites[i][1])*.02];continue}
      var cg=centroid(c);if(!inRegion(bound,hole,cg[0],cg[1])){var pp=pole(c);cg=[pp.x,pp.y]}
      if(i!==ai&&!items[i].pin){var nx=sites[i][0]+(cg[0]-sites[i][0])*damp,ny=sites[i][1]+(cg[1]-sites[i][1])*damp,md=(nx-sites[i][0])*(nx-sites[i][0])+(ny-sites[i][1])*(ny-sites[i][1]);if(md>moved)moved=md;sites[i]=pushOut(bound,hole,[nx,ny]);
        if(cor){var ex=(sites[i][0]-cor[0])/sx,ey=(sites[i][1]-cor[1])/sy,e=Math.hypot(ex,ey),em=rF*1.08;if(e<em&&e>0){sites[i]=[cor[0]+ex/e*em*sx,cor[1]+ey/e*em*sy]}}}
      w[i]=w[i]+.9*(tgt[i]-a)/Math.PI}
    var mn=Math.min.apply(null,w);for(var i=0;i<n;i++)w[i]-=mn;
    for(var i=0;i<n;i++)for(var j=0;j<n;j++){if(i===j)continue;var dx=sites[i][0]-sites[j][0],dy=sites[i][1]-sites[j][1],d2=dx*dx+dy*dy;if(w[i]-w[j]>d2*.9)w[i]=w[j]+d2*.9}
    /* v4: stop once sites have settled — same shape, fewer wasted iterations. */
    if(t>14&&moved<0.16){still++;if(still>=2)break}else still=0;
  }
  cells=power(sites,w,bound,hole);
  return cells.map(function(c,i){return {item:items[i],poly:c,area:c.length>2?Math.abs(area(c)):0,c:c.length>2?centroid(c):sites[i]}}).filter(function(x){return x.area>4});
}
function dedupe(p,eps){var o=[];for(var i=0;i<p.length;i++){var q=p[i],r=o[o.length-1];if(!r||Math.hypot(q[0]-r[0],q[1]-r[1])>eps)o.push(q)}if(o.length>2&&Math.hypot(o[0][0]-o[o.length-1][0],o[0][1]-o[o.length-1][1])<eps)o.pop();return o}
function lineX(l1,l2){var d=l1[2]*l2[3]-l1[3]*l2[2];if(Math.abs(d)<1e-9)return [(l1[0]+l2[0])/2,(l1[1]+l2[1])/2];var t=((l2[0]-l1[0])*l2[3]-(l2[1]-l1[1])*l2[2])/d;return [l1[0]+l1[2]*t,l1[1]+l1[3]*t]}
// inset any simple polygon by d (miter offset, collapsing edges that flip)
function inset(p,d){p=ccw(dedupe(p,.05));if(p.length<3)return [];var L=[];
  for(var i=0,n=p.length;i<n;i++){var a=p[i],b=p[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<1e-6)continue;L.push([a[0]-dy/l*d,a[1]+dx/l*d,dx/l,dy/l])}
  for(var guard=0;guard<60&&L.length>=3;guard++){var m=L.length,V=[];for(var i=0;i<m;i++)V.push(lineX(L[(i-1+m)%m],L[i]));
    var worst=-1,wv=0;for(var i=0;i<m;i++){var a=V[i],b=V[(i+1)%m],dot=(b[0]-a[0])*L[i][2]+(b[1]-a[1])*L[i][3];if(dot<wv){wv=dot;worst=i}}
    if(worst<0){var out=dedupe(V,.05);return out.length>2&&area(out)>0.5?out:[]}
    L.splice(worst,1)}
  return []}
// smooth pebble path: cubic corners, radius r per corner (capped by half of each adjacent edge)
function path(p,rad,k){p=dedupe(p,.6);var n=p.length;if(n<3)return '';k=k==null?.5:k;var s='',f=function(v){return v.toFixed(1)};
  var P=[];for(var i=0;i<n;i++){var a=p[(i-1+n)%n],b=p[i],c=p[(i+1)%n],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),r=b.m?Math.min(l1,l2)*.4:Math.min(rad,l1*(a.m?.6:k),l2*(c.m?.6:k));
    P.push([[b[0]+(a[0]-b[0])*r/l1,b[1]+(a[1]-b[1])*r/l1],b,[b[0]+(c[0]-b[0])*r/l2,b[1]+(c[1]-b[1])*r/l2]])}
  for(var i=0;i<n;i++){var q=P[i],p1=q[0],b=q[1],p2=q[2],c1=[p1[0]+(b[0]-p1[0])*.62,p1[1]+(b[1]-p1[1])*.62],c2=[p2[0]+(b[0]-p2[0])*.62,p2[1]+(b[1]-p2[1])*.62];
    s+=(i?'L':'M')+f(p1[0])+' '+f(p1[1])+'C'+f(c1[0])+' '+f(c1[1])+' '+f(c2[0])+' '+f(c2[1])+' '+f(p2[0])+' '+f(p2[1])}
  return s+'Z'}
// pebble radius for a polygon: big and varied, like river stones
function prad(p,seed){var a=Math.abs(area(p)),j=seed!=null?.82+.36*((seed%1000)/1000):1;return Math.min(92,Math.sqrt(a)*.31*j)}
// concentric rings that follow the outline (true inward offsets)
function rings(p,step,rad,maxn){var out=[],q=p,last=p;for(var k=0;k<(maxn||60);k++){q=inset(q,step);if(q.length<3||Math.abs(area(q))<step*step*2.2)break;out.push(q);last=q}return {rings:out,core:last}}
// legacy scaled contours (used for upload progress rings)
function contours(p,rad,step,focus,maxn){var r=rings(p,step,rad,maxn);return r.rings.map(function(q){return path(q,Math.min(rad,prad(q)))})}
function roundRect(x,y,w,h,r){var o=[],seg=6;function arc(cx,cy,a0){for(var i=0;i<=seg;i++){var a=a0+i/seg*Math.PI/2;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}}
  arc(x+w-r,y+r,-Math.PI/2);arc(x+w-r,y+h-r,0);arc(x+r,y+h-r,Math.PI/2);arc(x+r,y+r,Math.PI);return o}

// a small decorative pebble field (login floor, theme previews). o:{w,h,seed,n,gap,bg,tones:[t1,t2,t3],ring,lit,stroke}
function swatch(o){var w=o.w,h=o.h,r=rng(hash(String(o.seed||'nagi'))),n=o.n||24,it=[];
  for(var i=0;i<n;i++){var v=r();it.push({key:'s'+i,weight:Math.pow(v,3)*40+1})}
  if(o.free!==false)it.push({key:'free',weight:n*2.2,free:1,anchor:[w*.3,h*.45]});
  var cells=layout(it,roundRect(0,0,w,h,Math.min(18,h/5)),{seed:o.seed,iter:60}),g=o.gap||Math.max(3,Math.min(7,w/120)),svg='',T=o.tones;
  cells.forEach(function(c,i){var q=inset(c.poly,g/2);if(q.length<3)return;var rad=prad(q,hash(c.item.key)),d=path(q,rad);
    if(c.item.free){rings(q,Math.max(3.5,g*1.1),0,40).rings.forEach(function(z){svg+='<path d="'+path(z,Math.min(rad,prad(z)))+'" fill="none" stroke="'+o.ring+'" stroke-width=".7" opacity=".55"/>'});return}
    var k=hash(c.item.key+o.seed)%10,mx=o.mix||[2,5],col=o.lit!=null&&i==o.lit?o.litc:k<mx[0]?T[0]:k<mx[1]?T[1]:T[2];
    svg+='<path d="'+d+'" fill="'+col+'"'+(col==T[2]&&o.stroke?' stroke="'+o.stroke+'" stroke-width=".8"':'')+'/>'});
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">'+(o.bg?'<rect width="'+w+'" height="'+h+'" fill="'+o.bg+'"/>':'')+svg+'</svg>'}

// soften straight sides into gentle curves. The bend uses a canonical normal per edge direction, so the
// two neighbours across a gap bend the same way and the gap stays a parallel curve (river stones).
function bulge(p,frac,mx,outer){frac=frac==null?.05:frac;mx=mx||11;var o=[],n=p.length;
  for(var i=0;i<n;i++){var a=p[i],b=p[(i+1)%n];o.push(a);var dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);if(l<36)continue;
    // sides on the field's edge bow outward, so edge stones read as whole pebbles, not slices
    if(outer&&outer([(a[0]+b[0])/2,(a[1]+b[1])/2])){var am=Math.min(mx*1.3,l*.075),mo=[(a[0]+b[0])/2+dy/l*am,(a[1]+b[1])/2-dx/l*am];mo.m=1;o.push(mo);continue}
    var ux=dx/l,uy=dy/l;if(ux<-1e-9||(Math.abs(ux)<1e-9&&uy<0)){ux=-ux;uy=-uy}
    var sg=((Math.round(Math.atan2(uy,ux)*7)%2)?1:-1),amt=Math.min(mx,l*frac)*sg;var m=[(a[0]+b[0])/2-uy*amt,(a[1]+b[1])/2+ux*amt];m.m=1;o.push(m)}
  return o}

window.NagiGarden={bulge:bulge,swatch:swatch,layout:layout,inset:inset,path:path,prad:prad,rings:rings,contours:contours,pole:pole,area:area,centroid:centroid,bbox:bbox,roundRect:roundRect,hash:hash,rng:rng,inside:inside ,cut:cut,clip:clip};
})();
