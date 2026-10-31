// mobile menu
const menu=document.querySelector('.menu'),links=document.getElementById('links');
menu.addEventListener('click',()=>{const o=links.classList.toggle('open');menu.setAttribute('aria-expanded',o)});
links.addEventListener('click',()=>links.classList.remove('open'));
// scroll reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// highlight current section in navbar
const secs=[...document.querySelectorAll('main section')],as=[...links.querySelectorAll('a')];
addEventListener('scroll',()=>{let id='home';secs.forEach(s=>{if(scrollY>=s.offsetTop-160)id=s.id});as.forEach(a=>a.classList.toggle('on',a.hash==='#'+id))});
// footer year
document.getElementById('year').textContent=new Date().getFullYear();

// ===== helpers =====
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ph6=sz=>Array(6).fill(`<div class="slot"><span>📷</span><small>Photo here · ${sz}</small></div>`).join('');
const EXT=['jpg','jpeg','png','webp'];
window.imgErr=el=>{const b=el.dataset.base;if(b){const x=(+el.dataset.x||0)+1;if(x<EXT.length){el.dataset.x=x;el.src=b+'.'+EXT[x];return}}
 const d=document.createElement('div');d.className='slot';d.dataset.path=el.dataset.path||'';d.innerHTML=`<span>📷</span><small>${esc(el.dataset.sz||'Photo here')}</small>`;el.replaceWith(d)};
const slot=(s,sz,a)=>s?`<img loading="lazy" data-path="${esc(s)}" data-base="${esc(s.replace(/\.\w+$/,''))}" data-sz="${esc(sz)}" src="${esc(s)}" alt="${esc(a)}" onerror="imgErr(this)">`:`<div class="slot"><span>📷</span><small>Photo here · ${esc(sz)}</small></div>`;
const slotGrid=(dir,sz,n=12)=>Array.from({length:n},(_,i)=>slot(`${dir}/${i+1}.jpg`,sz,'Photo '+(i+1))).join('');
// typing role
(()=>{const R=ROLES,el=$('#typed');let r=0,c=0,d=0;(function t(){const w=R[r];el.textContent=w.slice(0,d?--c:++c);if(!d&&c===w.length){d=1;return setTimeout(t,1500)}if(d&&!c){d=0;r=(r+1)%R.length}setTimeout(t,d?40:90)})()})();
// particle network
(()=>{const cv=$('#net'),x=cv.getContext('2d');let W,H,P,m={x:-999,y:-999};const rs=()=>{W=cv.width=cv.offsetWidth;H=cv.height=cv.offsetHeight;P=Array.from({length:Math.min(80,W/18)},()=>({x:Math.random()*W,y:Math.random()*H,vx:Math.random()-.5,vy:Math.random()-.5}))};rs();addEventListener('resize',rs);
cv.parentNode.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();m={x:e.clientX-r.left,y:e.clientY-r.top}});
(function f(){x.clearRect(0,0,W,H);P.forEach((p,i)=>{p.x+=p.vx*.5;p.y+=p.vy*.5;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;if(Math.hypot(p.x-m.x,p.y-m.y)<150){p.x+=(m.x-p.x)*.01;p.y+=(m.y-p.y)*.01}x.fillStyle='#14b8a6';x.beginPath();x.arc(p.x,p.y,1.8,0,7);x.fill();for(let j=i+1;j<P.length;j++){const q=P[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<120){x.strokeStyle=`rgba(224,169,109,${.28*(1-d/120)})`;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}});requestAnimationFrame(f)})()})();
// lightbox
const lb=$('#lb');let LB={a:[],i:0};
function openLB(list,i=0){if(!list.length)return;LB={a:list,i};showLB();lb.showModal()}
function showLB(){const it=LB.a[LB.i];lb.querySelector('img').src=it.src;lb.querySelector('img').alt=it.caption||'';lb.querySelector('p').textContent=it.caption||'';lb.querySelector('.pv').style.display=lb.querySelector('.nx').style.display=LB.a.length>1?'':'none'}
lb.querySelector('.x').onclick=()=>lb.close();lb.querySelector('.pv').onclick=()=>{LB.i=(LB.i-1+LB.a.length)%LB.a.length;showLB()};lb.querySelector('.nx').onclick=()=>{LB.i=(LB.i+1)%LB.a.length;showLB()};
lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});
// education
$('#edu').innerHTML=EDU.map((e,n)=>`<article class="edu reveal show"><div class="edu-h"><h3>${esc(e.degree)}</h3><p>${esc(e.school)} · ${esc(e.dates)}</p></div>
 <div class="tabs" role="tablist">${['Overview','Work & Projects','Activities','Memories'].map((t,i)=>`<button role="tab" data-t="${i}" class="${i?'':'on'}">${t}</button>`).join('')}</div>
 <div class="pane on"><div class="kv"><div><small>Result</small><b>${esc(e.result)}</b></div><div><small>Period</small><b>${esc(e.dates)}</b></div></div><p>${esc(e.summary)}</p></div>
 <div class="pane"><ul>${e.work.map(w=>`<li><b>${esc(w.title)}</b><p>${esc(w.note)}</p></li>`).join('')}</ul></div>
 <div class="pane"><ul>${e.activities.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>
 <div class="pane"><div class="gallery" data-m="${n}">${e.memories.map((m,i)=>`<img src="${esc(m.src)}" alt="${esc(m.caption)}" data-i="${i}" loading="lazy">`).join('')||'<p>Add photos in data.js → memories.</p>'}</div></div></article>`).join('');
document.querySelectorAll('.edu').forEach((el,n)=>{el.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{el.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));el.querySelectorAll('.pane').forEach((p,i)=>p.classList.toggle('on',i==b.dataset.t))});
 el.querySelector('.gallery').onclick=ev=>{if(ev.target.dataset.i!=null)openLB(EDU[n].memories,+ev.target.dataset.i)}});
// ===== travel: Bangladesh (district -> spots) + Other Countries =====
(()=>{const slug=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 const demoOn=typeof SHOW_DEMO!=='undefined'&&SHOW_DEMO;
 const R=[{id:'bd',label:'Bangladesh',icon:'🇧🇩',key:'district',unit:'districts',root:'bangladesh',data:[...TRAVEL_BD,...(demoOn?DEMO_BD:[])]},
          {id:'world',label:'Other Countries',icon:'🌍',key:'country',unit:'countries',root:'world',data:[...TRAVEL_WORLD,...(demoOn?DEMO_WORLD:[])]}];
 let reg=(R[0].data.length||!R[1].data.length)?'bd':'world',grp='';
 const fmt=d=>{const m=String(d||'').match(/^(\d{4})-(\d{2})/);return m?new Date(m[1],m[2]-1).toLocaleString('en',{month:'short',year:'numeric'}):String(d||'')};
 const paths=(r,g,sp)=>{const base=sp.folder||`images/travel/${r.root}/${slug(g[r.key])}/${slug(sp.name)}`;return Array.from({length:Math.max(1,+sp.photos||10)},(_,i)=>`${base}/${i+1}`)};
 const spots=R.reduce((a,r)=>a+r.data.reduce((x,g)=>x+g.spots.length,0),0);
 $('#tvs').innerHTML=[[R[0].data.length,'Districts'],[spots,'Spots'],[R[1].data.length,'Countries']].map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
 function spotHtml(r,g,gi,sp,si){const P=paths(r,g,sp),name=esc(sp.name);
  return `<article class="spot" id="sp-${r.id}-${gi}-${si}" data-r="${r.id}" data-g="${gi}" data-s="${si}"><header class="sph"><div><h4>📍 ${name}${(sp.demo||g.demo)?' <span class="badge">DEMO</span>':''}</h4><p class="spm">${[fmt(sp.date),esc(sp.note)].filter(Boolean).join(' · ')}</p></div><div class="spa"><span class="cnt">📷 ${P.length} photos</span><button class="vb" type="button" data-view>View all ›</button></div></header>
  <div class="thumbs">${P.map((p,i)=>`<figure><img loading="lazy" data-path="${esc(p)}.jpg" data-base="${esc(p)}" data-sz="${esc(p)}.jpg" src="${esc(p)}.jpg" alt="${name} photo ${i+1}" onerror="imgErr(this)"><figcaption>${name}</figcaption></figure>`).join('')}</div></article>`}
 function draw(){const r=R.find(x=>x.id===reg);
  $('#rtabs').innerHTML=R.map(x=>`<button role="tab" aria-selected="${x.id===reg}" class="${x.id===reg?'on':''}" data-r="${x.id}">${x.icon} ${x.label} <small>${x.data.length}</small></button>`).join('');
  $('#gchips').innerHTML=r.data.length>1?[['','All'],...r.data.map((g,i)=>[String(i),g[r.key]])].map(c=>`<button class="${c[0]===grp?'on':''}" data-gc="${c[0]}">${esc(c[1])}</button>`).join(''):'';
  const list=r.data.map((g,i)=>[g,i]).filter(x=>grp===''||String(x[1])===grp);
  $('#tview').innerHTML=list.length?list.map(([g,gi])=>`<section class="tg"><div class="tgh"><h3>${g.flag?g.flag+' ':''}${esc(g[r.key])}</h3><span>${g.spots.length} tourist spot${g.spots.length>1?'s':''}</span></div>${g.spots.map((sp,si)=>spotHtml(r,g,gi,sp,si)).join('')}</section>`).join(''):`<div class="card empty"><div class="body"><h3>No places added yet</h3><p>Add your ${r.id==='bd'?'districts and tourist spots':'countries and spots'} in data.js.</p></div></div>`}
 draw();
 $('#rtabs').onclick=e=>{const b=e.target.closest('[data-r]');if(b){reg=b.dataset.r;grp='';draw()}};
 $('#gchips').onclick=e=>{const b=e.target.closest('[data-gc]');if(b){grp=b.dataset.gc;draw()}};
 $('#tview').onclick=e=>{const sp=e.target.closest('.spot');if(!sp)return;const hit=e.target.closest('figure img'),vb=e.target.closest('[data-view]');if(!hit&&!vb)return;
  const r=R.find(x=>x.id===sp.dataset.r),g=r.data[+sp.dataset.g],name=g.spots[+sp.dataset.s].name,im=[...sp.querySelectorAll('figure img')];
  openLB(im.map((x,i)=>({src:x.currentSrc||x.src,caption:`${name} · ${g[r.key]} · ${i+1}/${im.length}`})),hit?im.indexOf(hit):0)};
 window.goSpot=(rid,gi,si)=>{reg=rid;grp=String(gi);draw();const el=document.getElementById(`sp-${rid}-${gi}-${si}`);el&&el.scrollIntoView({behavior:'smooth',block:'center'})};
 // optional map: only spots that have lat/lng
 const pts=[];R.forEach(r=>r.data.forEach((g,gi)=>g.spots.forEach((sp,si)=>{if(typeof sp.lat==='number'&&typeof sp.lng==='number')pts.push({r,g,gi,sp,si})})));
 if(pts.length&&window.L){const map=L.map('map',{scrollWheelZoom:false}).setView([23.7,90.4],6);L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap contributors © CARTO'}).addTo(map);
  const ms=pts.map((p,n)=>L.marker([p.sp.lat,p.sp.lng],{icon:L.divIcon({className:'',html:`<div class="pin"><b>${n+1}</b></div>`,iconSize:[32,32],iconAnchor:[16,32]})}).addTo(map).bindPopup(`<b>${esc(p.sp.name)}</b><br>${esc(p.g[p.r.key])}<br><button onclick="goSpot('${p.r.id}',${p.gi},${p.si})">View photos</button>`));
  map.fitBounds(L.featureGroup(ms).getBounds().pad(.4),{maxZoom:9})}
 else{$('#tside').remove();$('#tlay').classList.add('nomap')}
})();
// memories
$('#mem').innerHTML=MEMORIES.length?MEMORIES.map((m,i)=>`<article class="card reveal show">${m.photos[0]?`<img src="${esc(m.photos[0])}" alt="${esc(m.title)}">`:''}<div class="body"><time>${esc(m.date)}</time><h3>${esc(m.title)}</h3><p>${esc(m.note)}</p>${m.photos.length?`<div class="acts"><button data-i="${i}">Photos (${m.photos.length})</button></div>`:''}</div></article>`).join(''):'<article class="card empty"><div class="body"><h3>Add a milestone</h3><p>Add events in data.js → MEMORIES.</p></div></article>';
$('#mem').onclick=e=>{const b=e.target.closest('button');if(b)openLB(MEMORIES[b.dataset.i].photos.map(s=>({src:s,caption:MEMORIES[b.dataset.i].title})))};

// ===== footer: contact + social =====
(()=>{const C=CONTACT,dg=v=>String(v||'').replace(/\D/g,''),ok=u=>/^(https?:\/\/|mailto:)/.test(u||'');
 const SL=[['Facebook',C.facebook,'#1877f2'],['Instagram',C.instagram,'#e4405f'],['LinkedIn',C.linkedin,'#0a66c2'],['Gmail',C.email&&'mailto:'+C.email,'#ea4335'],['WhatsApp',dg(C.whatsapp)&&'https://wa.me/'+dg(C.whatsapp),'#25d366'],['TikTok',C.tiktok,'#ff0050'],['YouTube',C.youtube,'#ff0000'],['X / Twitter',C.twitter,'#1d9bf0'],['GitHub',C.github,'#8b949e'],['Behance',C.behance,'#1769ff']].filter(l=>ok(l[1]));
 $('#soc').innerHTML=SL.map(l=>`<a class="sp" style="--c:${l[2]}" href="${esc(l[1])}" target="_blank" rel="noopener"><i></i>${l[0]}</a>`).join('');
 const rows=[];if(C.email)rows.push(`<a href="mailto:${esc(C.email)}">✉ ${esc(C.email)}</a>`);if(C.phone)rows.push(`<a href="tel:+${dg(C.phone)}">☎ ${esc(C.phone)}</a>`);if(dg(C.whatsapp))rows.push(`<a href="https://wa.me/${dg(C.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp ${esc(C.whatsapp)}</a>`);
 $('#fc').innerHTML=rows.map(r=>`<li>${r}</li>`).join('')||'<li>Add email/phone in data.js</li>';
 if(C.email){const b=$('#mailbtn');b.hidden=false;b.href='mailto:'+C.email}})();
// ===== premium extras: theme, progress, card spotlight =====
(()=>{const r=document.documentElement,sv=()=>{try{return localStorage.getItem('th')}catch{return null}};if(sv()==='dark')r.dataset.theme='dark';
 document.querySelector('.theme').onclick=()=>{const d=r.dataset.theme==='dark';r.dataset.theme=d?'light':'dark';try{localStorage.setItem('th',r.dataset.theme)}catch{}};
 addEventListener('scroll',()=>{$('#prog').style.width=scrollY/(document.documentElement.scrollHeight-innerHeight)*100+'%'});
 document.addEventListener('mousemove',e=>{const c=e.target.closest&&e.target.closest('.card,.jc');if(c){const b=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-b.left+'px');c.style.setProperty('--my',e.clientY-b.top+'px')}})})();

// ===== profile sections =====
$('#abt').textContent=ABOUT.intro;$('#abph').innerHTML=slot(ABOUT.photo,'900×1100 portrait','Sheak Fahad');
$('#love').innerHTML=ABOUT.loves.map(l=>`<div class="lv"><span>${l[0]}</span><b>${esc(l[1])}</b><p>${esc(l[2])}</p></div>`).join('');
$('#cos').innerHTML=EXPERIENCE.map(x=>`<a href="#career" class="co-p"><b>${esc(x.company)}</b><small>${esc(x.role)}</small></a>`).join('');
$('#rolechips').innerHTML=ROLES.map(r=>`<span class="chip big">${esc(r)}</span>`).join('');
$('#exp').innerHTML=EXPERIENCE.map((x,i)=>`<article class="xc reveal"><div class="xp">${slot(x.photo,'800×600',x.company)}</div><div class="xb"><span class="no">0${i+1}</span><span class="rb">${esc(x.role)}</span><h3>${esc(x.company)}</h3><time>${esc(x.dates)}</time><ul>${x.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div></article>`).join('');
$('#sch').innerHTML=SCHOOLS.map(s=>`<article class="sc reveal"><div class="sp2">${slot(s.photo,'800×600',s.school)}</div><div><span class="lv2">${esc(s.level)}</span><h3>${esc(s.school)}</h3><p>${esc(s.year)} · ${esc(s.group)} · ${esc(s.result)}</p></div></article>`).join('');
const um=(EDU[0]&&EDU[0].memories)||[];$('#umem').innerHTML=um.length?um.map((m,i)=>`<img data-path="${esc(m.src)}" src="${esc(m.src)}" alt="${esc(m.caption)}" loading="lazy">`).join(''):slotGrid('images/uni','1200×800');
$('#umem').onclick=e=>{if(e.target.tagName==='IMG'){const im=[...$('#umem').querySelectorAll('img')];openLB(im.map(i=>({src:i.src,caption:i.alt})),im.indexOf(e.target))}};
$('#pg').innerHTML=PROJECTS.map((p,i)=>`<article class="pj reveal"><div class="pc ${p.image?'':'g'+(i%5)}"${p.image?` data-path="${esc(p.image)}"`:''}>${p.image?`<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.title)}" onerror="this.remove()">`:''}<span>0${i+1}</span><em>${esc(p.type)}</em></div><div class="pb"><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="did"><small>What I did</small>${p.did.map(d=>`<span class="chip">${esc(d)}</span>`).join('')}</div>${p.link?`<a class="more" href="${esc(p.link)}" target="_blank" rel="noopener">View project →</a>`:''}</div></article>`).join('');
$('#pmore').innerHTML=[['Behance',CONTACT.behance],['Facebook',CONTACT.facebook],['LinkedIn',CONTACT.linkedin]].filter(l=>/^https?:/.test(l[1])).map(l=>`<a class="btn dark" href="${esc(l[1])}" target="_blank" rel="noopener">See more on ${l[0]} ↗</a>`).join('');
$('#res').innerHTML=`<article class="rs reveal"><div class="rl"><span class="rb">${esc(RESEARCH.status)}</span><h3>${esc(RESEARCH.title)}</h3><p>${esc(RESEARCH.abstract)}</p><div>${RESEARCH.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>${/^https?:/.test(RESEARCH.link)?`<p style="margin-top:14px"><a href="${esc(RESEARCH.link)}" target="_blank" rel="noopener">Read the paper →</a></p>`:''}</div><div class="rr"><div class="fact"><small>Domain</small><b>${esc(RESEARCH.domain)}</b></div><div class="fact"><small>Approach</small><b>${esc(RESEARCH.method)}</b></div><div class="fact"><small>Institution</small><b>Green University of Bangladesh</b></div></div></article>`;
$('#skg').innerHTML=SKILLS.map(g=>`<article class="sg reveal"><div class="si">${g.icon}</div><h3>${esc(g.title)}</h3><div>${g.items.map(i=>`<span class="chip big">${esc(i)}</span>`).join('')}</div></article>`).join('');
const al=SKILLS.flatMap(g=>g.items);$('#marq').innerHTML=[...al,...al].map(x=>`<span>${esc(x)}</span>`).join('');
$('#ach').innerHTML=ACHIEVEMENTS.map(a=>`<article class="card empty"><div class="body"><h3>🏆 ${esc(a.title)}</h3><p>${esc(a.note)}</p></div></article>`).join('');
$('#hw').innerHTML=[...HOBBY_WORDS,...HOBBY_WORDS].map(w=>`<span>${esc(w)}</span>`).join('');
$('#bento').innerHTML=HOBBIES.map(h=>`<article class="bt b${h.span||1} reveal"><span class="bi">${h.icon}</span><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p>${(h.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</article>`).join('');
document.querySelectorAll('.reveal:not(.show)').forEach(el=>io.observe(el));
// ===== cursor graphic =====
(()=>{if(!matchMedia('(pointer:fine)').matches)return;const g=document.createElement('div'),r=document.createElement('div'),d=document.createElement('div');g.className='cg';r.className='cr';d.className='cd';document.body.append(g,r,d);
 let mx=innerWidth/2,my=innerHeight/2,gx=mx,gy=my,rx=mx,ry=my,hov=false;
 addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;d.style.transform=`translate(${mx}px,${my}px)`;if(Math.random()<.35){const s=document.createElement('i');s.className='sk';s.style.cssText=`left:${mx}px;top:${my}px;--dx:${(Math.random()-.5)*50}px;--dy:${Math.random()*40+10}px;background:${Math.random()>.5?'#14b8a6':'#e0a96d'}`;document.body.appendChild(s);setTimeout(()=>s.remove(),800)}});
 document.addEventListener('mouseover',e=>{hov=!!(e.target.closest&&e.target.closest('a,button,.jc,.pj,[tabindex]'))});
 (function f(){gx+=(mx-gx)*.07;gy+=(my-gy)*.07;rx+=(mx-rx)*.2;ry+=(my-ry)*.2;g.style.transform=`translate(${gx}px,${gy}px)`;r.style.transform=`translate(${rx}px,${ry}px) scale(${hov?1.7:1})`;requestAnimationFrame(f)})()})();

// ===== upload your photo (hero circle) =====
(()=>{const ph=document.querySelector('.photo');if(!ph)return;const KEY='sf_photo';
 const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.hidden=true;
 const b=document.createElement('button');b.type='button';b.className='upb';b.textContent='📷 Add your photo';ph.parentNode.append(b,inp);
 const sync=()=>{b.hidden=!(ph.classList.contains('noimg')||/[?&]edit/.test(location.search));b.textContent=ph.classList.contains('noimg')?'📷 Add your photo':'📷 Change photo'};
 const apply=u=>{ph.querySelectorAll('img').forEach(i=>i.remove());const im=new Image();im.alt='Portrait of Sheak Fahad';im.src=u;ph.prepend(im);ph.classList.remove('noimg');
  document.querySelectorAll('.av').forEach(a=>{a.querySelectorAll('img').forEach(i=>i.remove());const i2=new Image();i2.alt='';i2.src=u;a.prepend(i2);a.classList.remove('noimg')});sync()};
 const open=()=>inp.click();b.onclick=open;ph.addEventListener('click',()=>{if(ph.classList.contains('noimg'))open()});
 inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const m=700,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/jpeg',.88);apply(u);try{localStorage.setItem(KEY,u)}catch{}window.dlFile&&dlFile(u,'profile.jpg')};im.src=r.result};r.readAsDataURL(f)};
 addEventListener('load',()=>setTimeout(()=>{let u=null;try{u=localStorage.getItem(KEY)}catch{}if(ph.classList.contains('noimg')&&u)apply(u);sync()},600));
})();
// ===== contact form =====
(()=>{const f=$('#cform'),st=$('#cst'),C=CONTACT,dg=v=>String(v||'').replace(/\D/g,'');
 $('#cquick').innerHTML=[C.email&&`<a href="mailto:${esc(C.email)}">✉ ${esc(C.email)}</a>`,dg(C.whatsapp)&&`<a href="https://wa.me/${dg(C.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp</a>`,C.phone&&`<a href="tel:+${dg(C.phone)}">☎ ${esc(C.phone)}</a>`].filter(Boolean).join('')||'<a href="#contact">Add email/WhatsApp in data.js</a>';
 const body=d=>`${d.message}\n\n— ${d.name} (${d.email})`;
 f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));
  if(FORM_ENDPOINT){try{const r=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(d)});st.textContent=r.ok?'Thanks! Your message was sent.':'Could not send. Please try email or WhatsApp.';if(r.ok)f.reset()}catch{st.textContent='Network error. Please try again.'}return}
  if(!C.email){st.textContent='Email is not set yet. Add it in data.js → CONTACT.';return}
  location.href=`mailto:${C.email}?subject=${encodeURIComponent(d.subject||'Message from your website')}&body=${encodeURIComponent(body(d))}`;st.textContent='Opening your email app…'};
 $('#cwa').onclick=()=>{if(!f.reportValidity())return;if(!dg(C.whatsapp)){st.textContent='WhatsApp number is not set yet. Add it in data.js → CONTACT.';return}const d=Object.fromEntries(new FormData(f));open(`https://wa.me/${dg(C.whatsapp)}?text=${encodeURIComponent((d.subject?d.subject+'\n':'')+body(d))}`,'_blank','noopener')};
})();

// ===== edit any photo: open index.html?edit (or press Ctrl+Shift+E) =====
(()=>{const toast=t=>{let e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';document.body.appendChild(e)}e.textContent=t;e.className='show';clearTimeout(e._t);e._t=setTimeout(()=>e.className='',6000)};
 window.dlFile=(u,name,path)=>{const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();toast(path?`Downloaded ${name}. Save it as: ${path}`:`Saved here and downloaded as ${name}. Put that file in the images folder (same name) so everyone sees it.`)};
 const set=on=>{document.body.classList.toggle('edit',on);let b=document.getElementById('editbar');if(on&&!b){b=document.createElement('div');b.id='editbar';b.innerHTML='✎ Edit mode — click any dashed photo to change it · <a href="#" id="exitedit">Exit</a>';document.body.appendChild(b);document.getElementById('exitedit').onclick=e=>{e.preventDefault();set(false)}}if(!on&&b)b.remove()};
 if(/[?&]edit/.test(location.search))set(true);
 addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();set(!document.body.classList.contains('edit'))}});
 const key=p=>'img:'+p;
 const put=(el,u)=>{if(el.classList.contains('slot')){const n=new Image();n.alt='';n.dataset.path=el.dataset.path;n.src=u;el.replaceWith(n);return n}
  if(el.tagName==='IMG'){el.src=u;return el}let im=el.querySelector('img');if(!im){im=new Image();im.alt='';im.style.cssText='width:100%;height:100%;object-fit:cover;position:absolute;inset:0';el.prepend(im)}im.src=u;return im};
 const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.hidden=true;document.body.appendChild(inp);let tgt=null;
 document.addEventListener('click',e=>{if(!document.body.classList.contains('edit'))return;const t=e.target.closest('[data-path]');if(!t)return;e.preventDefault();e.stopPropagation();tgt=t;inp.value='';inp.click()},true);
 inp.onchange=()=>{const f=inp.files[0];if(!f||!tgt)return;const p=tgt.dataset.path,r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/jpeg',.85);tgt=put(tgt,u);try{localStorage.setItem(key(p),u)}catch{toast('Too big to remember in this browser, but it was downloaded.')}dlFile(u,p.split('/').pop().replace(/\.\w+$/,'')+'.jpg',p)};im.src=r.result};r.readAsDataURL(f)};
 addEventListener('load',()=>setTimeout(()=>{document.querySelectorAll('[data-path]').forEach(el=>{let u=null;try{u=localStorage.getItem(key(el.dataset.path))}catch{}if(u&&(el.classList.contains('slot')||(el.classList.contains('pc')&&!el.querySelector('img'))))put(el,u)})},900));
})();

// ===== luxury layer =====
(()=>{document.querySelectorAll('main section:not(#home)').forEach(x=>{const h=x.querySelector('h2');if(h)x.dataset.w=h.textContent.split('&')[0].trim().slice(0,14)});
 const hp=document.querySelector('.hero-pic');if(hp)hp.insertAdjacentHTML('afterbegin','<i class="ob ob1"></i>');
 const bn=document.getElementById('band');if(bn){const w=[...ROLES,'Travel','Village','Football'];bn.innerHTML=[...w,...w,...w].map(x=>`<span>${esc(x)}</span><b>✦</b>`).join('')}
 const t=document.createElement('button');t.id='top';t.setAttribute('aria-label','Back to top');t.textContent='↑';document.body.appendChild(t);t.onclick=()=>scrollTo({top:0,behavior:'smooth'});addEventListener('scroll',()=>t.classList.toggle('show',scrollY>600));
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){const Q='.pj,.sg,.bt,.xc';
  document.addEventListener('mousemove',e=>{const c=e.target.closest&&e.target.closest(Q);if(c){const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.style.transform=`perspective(900px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateY(-6px)`}});
  document.addEventListener('mouseout',e=>{const c=e.target.closest&&e.target.closest(Q);if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
  document.querySelectorAll('.btn').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.3}px)`});b.addEventListener('mouseleave',()=>b.style.transform='')})}
})();
