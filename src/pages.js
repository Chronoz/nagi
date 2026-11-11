/* 凪 Nagi — non-browser pages: the login / control panel becomes the evening-street scene with a paper card. */
(function(){
"use strict";
var H=document.documentElement,id=H.id;
function ic(n){return '<i class="ni" style="--ni:var(--ni-'+n+')"></i>'}
function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function mk(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
try{var t=localStorage.nagi_theme;if(t=='sky'){var h=new Date().getHours();t=h>=17||h<6?'yugure':'paper'}if(t&&(id=='ht_spl'||id=='ht_msg'||id=='ht_svc'||id=='ht_shr'||id=='ht_rup')){H.className=t=='yugure'?'fz f z':'fy f y'}}catch(e){}
if(id=='ht_msg'){ // "naw dude" = wrong password; show a calm line and go back to the sign-in card
  var b=q('#box'),t=(b&&b.textContent||'').toLowerCase();
  if(/naw dude|wrong|invalid/.test(t)){try{sessionStorage.nagi_bad='1'}catch(e){}for(var i=0;i<200;i++)clearTimeout(i);
    b.innerHTML='<p style="font:400 22px Newsreader,Georgia,serif;margin:0 0 6px">That did not match.</p><p style="margin:0;color:var(--n-mute)">Taking you back to sign in…</p>';
    b.setAttribute('style','max-width:360px;margin:30vh auto 0;padding:0;background:none;text-align:center');
    setTimeout(function(){location.replace('/?h')},900)}
  return}
if(id!='ht_spl')return;
var wrap=q('#wrap');if(!wrap)return;
var guest=!!q('#b'),uname=(q('#un')||{}).textContent||'',srv=(document.title||'').replace(/^copyparty\s*@\s*/,'').trim();
// scene backdrop
var bd=mk('div','nagi-backdrop');bd.setAttribute('aria-hidden','true');document.body.appendChild(bd);
function scene(){if(!window.NagiGarden)return;var w=Math.max(200,innerWidth-48),h=Math.round(Math.max(110,Math.min(innerHeight*.19,170))),dk=document.documentElement.classList.contains('z');
  bd.innerHTML=NagiGarden.swatch(dk?{w:w,h:h,seed:'login',n:Math.round(w/30),mix:[1,3],tones:['#E4DAC4','#6C8781','#2A4444'],ring:'#B9C5B9',lit:7,litc:'#F49A3F'}:{w:w,h:h,seed:'login',n:Math.round(w/30),mix:[1,3],tones:['#22302F','#7D8984','#DCD3C0'],ring:'#55625F',stroke:'#CEC4AE',lit:7,litc:'#E07E24'})}
scene();addEventListener('resize',function(){clearTimeout(scene.t);scene.t=setTimeout(scene,150)});
// top bar
var top=mk('div','nagi-top','<a class="nagi-mark" href="/"><span class="k">凪</span><span><b>Nagi</b><small>'+(srv?srv.replace(/</g,'&lt;')+' · ':'')+'copyparty</small></span></a><div class="nagi-qlinks"></div>');
var ql=q('.nagi-qlinks',top);
var cn=q('#v');if(cn){var a=mk('a','',ic('hard-drive')+'Connect as a drive');a.href=cn.getAttribute('href');ql.appendChild(a)}
if(!guest){var o=mk('a','',ic('log-out')+'Sign out');o.href=(q('#c')||{}).getAttribute?q('#c').getAttribute('href'):'/?pw=x';ql.appendChild(o)}
wrap.insertBefore(top,wrap.firstChild);
// card
var bad=false;try{bad=sessionStorage.nagi_bad=='1';sessionStorage.removeItem('nagi_bad')}catch(e){}
var form=q('#lf'),msg=q('#msg'),card=mk('div','nagi-card');
var is404=msg&&/404|not found/i.test(msg.textContent);
if(msg&&!form){card.innerHTML=is404?'<div class="big404">404</div><h2>Nothing grows here</h2><p class="lede">This path does not exist, or it is hidden from you.</p><div class="nagi-btnrow"><a class="nagi-btn fill" href="/">'+ic('house')+'Back to Everything</a></div>':'<div class="ey">Note</div><h2>'+msg.innerHTML+'</h2>'}
else if(form){
  var shr=!!q('#z'),hasU=!!q('#lu',form);
  card.innerHTML=(is404?'<div class="ey">404 · not found</div><h2>Nothing grows here</h2><p class="lede">This path does not exist, or you need to sign in to see it.</p>':guest||shr?'<div class="ey">'+(shr?'Private share':'Welcome')+'</div><h2>'+(shr?'Unlock this share':'Sign in to Nagi')+'</h2><p class="lede">'+(shr?'The person who shared it gave you a password.':'Your files are where you left them. Guests can still browse what is public.')+'</p>':'<div class="ey">Switch account</div><h2>Sign in as someone else</h2><p class="lede">You are signed in as <b>'+uname.replace(/</g,'&lt;')+'</b>.</p>')+
    (bad?'<div class="nagi-err">'+ic('circle-alert')+'<span>That '+(hasU?'username and password do':'password does')+' not match. Try again, slowly.</span></div>':'')+'<div class="slot"></div>';
  if(is404&&!guest){card.classList.add('nagi-404in');q('.lede',card).innerHTML='This path does not exist, or it is not shared with <b>'+uname.replace(/</g,'&lt;')+'</b>.';card.insertAdjacentHTML('beforeend','<div class="nagi-btnrow"><a class="nagi-btn fill" href="/">'+ic('house')+'Back to Everything</a></div>')}
  var slot=q('.slot',card),lu=q('#lu',form),lp=q('#lp',form),ls=q('#ls',form);
  if(lu){var f1=mk('div','nagi-field','<label for="lu">Username</label>');form.insertBefore(f1,lu);f1.appendChild(lu);lu.placeholder='';lu.autocomplete='username';lu.setAttribute('autocapitalize','none');lu.setAttribute('autocorrect','off');lu.spellcheck=false;lu.setAttribute('enterkeyhint','next');lu.removeAttribute('size')}
  if(lp){var f2=mk('div','nagi-field','<label for="lp">Password</label>');form.insertBefore(f2,lp);f2.appendChild(lp);lp.placeholder='';lp.autocomplete='current-password';lp.setAttribute('enterkeyhint','go');lp.removeAttribute('size')}
  if(ls)ls.value=shr?'Unlock':'Sign in';
  var x=q('#x',form);if(x){x.textContent='Change password';x.className='nagi-q'}
  slot.appendChild(form);
  // phones: when the keyboard opens, keep the Sign in button visible above it
  form.addEventListener('focusin',function(){var b=ls||q('input[type=submit]',form);if(!b)return;setTimeout(function(){var vv=window.visualViewport,r=b.getBoundingClientRect(),h=vv?vv.height:innerHeight;if(r.bottom>h-12)window.scrollBy({top:r.bottom-h+24,behavior:'smooth'})},320)});
  if(bad){card.classList.add('shake');setTimeout(function(){(lp||{}).focus&&lp.focus()},50)}
  var lm=q('#lm');if(lm)new MutationObserver(function(){var t=lm.textContent.trim();var e=q('.nagi-err',card);if(!t){if(e&&!bad)e.remove();return}
    t=t.replace(/^ERROR:\s*/,'');if(!e){e=mk('div','nagi-err');card.insertBefore(e,slot)}e.innerHTML=ic('circle-alert')+'<span>'+t.replace(/</g,'&lt;')+'.</span>';card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake')}).observe(lm,{childList:true,characterData:true,subtree:true});
}
if(!guest&&!is404){var who=mk('div','nagi-card');who.innerHTML='<div class="ey">Control panel</div><div class="nagi-who"><span class="av">'+(uname[0]||'?').toUpperCase()+'</span><div><h2 style="margin:0;font-size:28px">Hello, '+uname.replace(/</g,'&lt;')+'</h2></div></div><p class="lede">Everything you can reach on this server is listed below.</p><div class="nagi-btnrow"><a class="nagi-btn fill" href="/">'+ic('folder-open')+'Open my files</a><a class="nagi-btn" href="#" data-sw>'+ic('user')+'Switch account</a></div>';
  wrap.appendChild(who);
  if(form){card.style.display='none';q('[data-sw]',who).onclick=function(e){e.preventDefault();card.style.display=card.style.display?'':'none';if(!card.style.display)card.scrollIntoView({behavior:'smooth',block:'center'})}}
  else q('[data-sw]',who).remove()}
if(card.innerHTML)wrap.appendChild(card);
// volumes
function sec(title,cls){var s=mk('div','nagi-sec '+(cls||''),'<h3>'+title+'</h3><div class="nagi-list"></div>');wrap.appendChild(s);return q('.nagi-list',s)}
var seen={};
function vols(h1id,title,icon){var h=q('#'+h1id);if(!h)return;var ul=h.nextElementSibling;if(!ul||ul.tagName!='UL')return;var list=sec(title);
  qa('a',ul).forEach(function(a){var href=a.getAttribute('href'),n=decodeURIComponent(href.replace(/\?.*$/,'').replace(/^\/|\/$/g,''))||'Everything';var b=mk('a','',ic(icon)+'<span>'+n.replace(/</g,'&lt;')+'</span><span class="go">'+ic('arrow-right')+'</span>');b.href=href;list.appendChild(b)})}
if(guest){var af=mk('div','nagi-after');var fh=q('#f');if(fh&&fh.nextElementSibling){var a1=q('a',fh.nextElementSibling);if(a1){var g1=mk('a','',ic('eye')+'Browse as a guest');g1.href=a1.getAttribute('href');af.appendChild(g1)}}
  [['af','history','Recent uploads'],['k','rotate-cw','Reset this device']].forEach(function(r){var a=q('#'+r[0]);if(!a)return;var b=mk('a','',ic(r[1])+r[2]);b.href=a.getAttribute('href');if(r[0]=='k')b.onclick=function(){localStorage.clear();return true};af.appendChild(b)});
  wrap.appendChild(af)}
else{vols('f','Folders you can open','folder');vols('g','Folders you can upload to','cloud-upload')}
// live activity + admin tables
var aa=q('#aa'),ae=q('#ae');[aa,ae].forEach(function(h){if(!h)return;var t=h.nextElementSibling;var l=sec(h.id=='aa'?'Uploads in progress':'Downloads in progress');l.style.padding='4px 6px';l.appendChild(t)});
var adm=qa('#wrap>h1').filter(function(h){return /admin/i.test(h.textContent)})[0];
if(adm){var tb=adm.nextElementSibling,btns=q('.btns');var l=sec('Server');l.style.padding='4px 6px';if(tb)l.appendChild(tb);if(btns)qa('a',btns).forEach(function(a){a.innerHTML=ic(a.id=='d'?'list-checks':'refresh-cw')+'<span>'+(a.id=='d'?'Thread dump':'Reload config and rescan')+'</span>';l.appendChild(a)})}
// more
var more=guest?null:sec('More');if(more)
[['af','history','Recent uploads'],['y','link','Shares you made'],['ag','user','Identity cache'],['wb','lock','Use a secure connection (https)'],['k','rotate-cw','Reset settings on this device']].forEach(function(r){var a=q('#'+r[0]);if(!a)return;var b=mk('a',r[0]=='k'?'danger':'',ic(r[1])+'<span>'+r[2]+'</span><span class="go">'+ic('arrow-right')+'</span>');b.href=a.getAttribute('href');if(r[0]=='k')b.onclick=function(){localStorage.clear();return true};more.appendChild(b)});
var lo=q('#lo');if(lo&&more){lo.value='Sign out on every device';more.appendChild(lo.form)}
var pb=q('#pb');if(pb){var p=mk('div','','');p.id='nagi-pb';p.innerHTML='Nagi skin · '+pb.innerHTML;document.body.appendChild(p)}
// first field focus
setTimeout(function(){var f=q('#lu')||q('#lp');if(f&&guest&&!/Mobi/.test(navigator.userAgent))f.focus()},60);
})();
(function(){var H=document.documentElement;if(H.id!='ht_md'&&H.id!='ht_mde')return;function set(){try{var t=localStorage.nagi_theme;if(!t)return;if(t=='sky'){var h=new Date().getHours();t=h>=17||h<6?'yugure':'paper'}var dk=t=='yugure';H.classList.toggle('z',dk);H.classList.toggle('y',!dk)}catch(e){}}setTimeout(set,0);setTimeout(set,300)})();
(function(){var H=document.documentElement;if((H.id!='ht_md'&&H.id!='ht_mde')||window.top===window)return;var s=document.createElement('style');s.textContent='#mn,#toc,#lightswitch,#navtoggle{display:none!important}#mh{padding:10px 18px!important;position:static!important}#mp,#ml{margin-top:10px!important;box-shadow:none!important;padding:36px 48px 60px!important}';document.head.appendChild(s)})();
