/* Campusly UI logic. Data lives in data.js; swap all()/saved() for API calls later. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const CATS={Internship:["💼","internships"],Scholarship:["🎓","scholarships"],Hackathon:["💻","hackathons"],MUN:["🌎","muns"],Competition:["🏆","competitions"],Event:["🎤","events"],Workshop:["🧠","workshops"],Volunteering:["🤝","volunteering"]};
const INTERESTS=["Software Engineering","AI","Entrepreneurship","Design","Finance","International Relations"];
const all=()=>[...store.get("cs_posted",[]),...OPPS];
const saved=()=>store.get("cs_saved",[]);
const interests=()=>store.get("cs_interests",INTERESTS.slice(0,3));
const fmt=d=>new Date(d).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const days=d=>Math.ceil((new Date(d)-Date.now())/864e5);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const match=o=>Math.min(99,52+o.tags.filter(t=>interests().includes(t)).length*20+(o.id%9));
const byId=id=>all().find(o=>o.id==id);

/* ---------- shared layout ---------- */
const links=[["index","Home"],["internships","Internships"],["scholarships","Scholarships"],["hackathons","Hackathons"],["muns","MUNs"],["competitions","Competitions"],["events","Events"]];
const here=(location.pathname.split("/").pop()||"index.html").replace(".html","");
const li=([p,t])=>`<a href="${p}.html"${p===here?' aria-current="page"':""}>${t}</a>`;
document.body.insertAdjacentHTML("afterbegin",`<a class="skip" href="#main">Skip to content</a>
<header class="nav"><div class="wrap navin"><a class="logo" href="index.html"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lg)"/><path d="M9 20l7-10 7 10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>Campusly</a>
<button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu">☰</button>
<nav id="menu" aria-label="Main">${links.map(li).join("")}<details class="more"><summary>More</summary><div>${li(["workshops","Workshops"])}${li(["volunteering","Volunteering"])}${li(["dashboard","My Dashboard"])}</div></details></nav>
<div class="navact"><button class="icon" id="sIcon" aria-label="Search">🔍</button><button class="btn ghost" data-open="post">Post Opportunity</button><button class="btn" id="signBtn" data-open="sign">Sign In</button></div></div></header>`);
document.body.insertAdjacentHTML("beforeend",`<footer class="foot"><div class="wrap fgrid"><div><a class="logo" href="index.html">Campusly</a><p>Helping students discover opportunities and build their future.</p><p class="soc"><a href="https://instagram.com" rel="noopener" target="_blank">Instagram</a><a href="https://linkedin.com" rel="noopener" target="_blank">LinkedIn</a><a href="https://x.com" rel="noopener" target="_blank">X</a><a href="https://discord.com" rel="noopener" target="_blank">Discord</a></p></div>
<div><b>Company</b><button data-info="About">About</button><button data-info="Contact">Contact</button><button data-info="Privacy">Privacy</button><button data-info="Terms">Terms</button></div>
<div><b>Explore</b><a href="internships.html">Internships</a><a href="scholarships.html">Scholarships</a><a href="hackathons.html">Hackathons</a><a href="muns.html">MUNs</a></div></div><p class="copy">© 2026 Campusly. All rights reserved.</p></footer>
<dialog id="dlg"><button class="x" data-close aria-label="Close">✕</button><div id="dlgBody"></div></dialog>`);
const dlg=$("#dlg"),show=h=>{$("#dlgBody").innerHTML=h;dlg.showModal()};
$(".burger").onclick=e=>{const o=$("#menu").classList.toggle("open");e.target.setAttribute("aria-expanded",o)};
if(here==="dashboard")$("#sIcon").hidden=false;

/* ---------- cards ---------- */
const card=o=>{const s=saved().includes(o.id);return`<article class="card"><div class="row"><span class="badge">${CATS[o.category][0]} ${o.category}</span><span class="match">${match(o)}% match</span></div><h3>${esc(o.title)}</h3><p class="org">${esc(o.organization)} <em>Demo Opportunity</em></p><p class="meta">${o.type==="Online"?"🌎":"📍"} ${esc(o.location)} &nbsp; ⏰ ${fmt(o.deadline)}</p><p>${esc(o.description)}</p><p class="elig"><b>Eligibility:</b> ${esc(o.eligibility)}</p><div class="row"><button class="btn ghost" data-save="${o.id}" aria-pressed="${s}">${s?"❤️ Saved":"♡ Save"}</button><button class="btn" data-view="${o.id}">View Details →</button></div></article>`};
const grid=(el,list,empty)=>{el.innerHTML=list.length?list.map(card).join(""):`<p class="empty">${empty||"No opportunities found. Try changing your search or filters."}</p>`};
const detail=o=>{const s=saved().includes(o.id);return`<span class="badge">${CATS[o.category][0]} ${o.category}</span><h2>${esc(o.title)}</h2><p class="org">${esc(o.organization)} <em>Demo Opportunity</em></p><p>${esc(o.description)}</p><dl><dt>Location</dt><dd>${esc(o.location)} (${o.type})</dd><dt>Deadline</dt><dd>${fmt(o.deadline)} (${Math.max(0,days(o.deadline))} days left)</dd><dt>Eligibility</dt><dd>${esc(o.eligibility)}</dd><dt>Requirements</dt><dd>${o.requirements?esc(o.requirements):"CV or short profile, a brief statement of interest."}</dd><dt>Duration</dt><dd>${o.duration||"Varies by programme"}</dd><dt>Application process</dt><dd>Submit the online form, then shortlisted applicants are contacted by email.</dd><dt>Important dates</dt><dd>Applications close ${fmt(o.deadline)}; results about 3 weeks later.</dd></dl><p>${o.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</p><div class="row"><button class="btn ghost" data-save="${o.id}" aria-pressed="${s}">${s?"❤️ Saved":"♡ Save"}</button><a class="btn" href="${o.url||"https://example.com/apply/"+o.id}" target="_blank" rel="noopener">Apply Now →</a></div><p class="note">Demo data: this link is a placeholder.</p>`};

/* ---------- global click handling ---------- */
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-save],[data-view],[data-open],[data-info],[data-close],#sIcon");if(!t)return;
 if(t.dataset.save){const id=+t.dataset.save;let s=saved();s=s.includes(id)?s.filter(x=>x!==id):[...s,id];store.set("cs_saved",s);$$(`[data-save="${id}"]`).forEach(b=>{const on=s.includes(id);b.setAttribute("aria-pressed",on);b.textContent=on?"❤️ Saved":"♡ Save"});if(here==="dashboard")dash()}
 else if(t.dataset.view){const o=byId(t.dataset.view);const v=new Set(store.get("cs_viewed",[]));v.add(o.id);store.set("cs_viewed",[...v]);streak();show(detail(o))}
 else if(t.dataset.open==="post")postForm();
 else if(t.dataset.open==="sign")signIn();
 else if(t.dataset.info){const T={About:"Campusly is a demo student opportunity platform built with HTML, CSS and JavaScript.",Contact:"Demo site: no messages are sent. Connect a backend or email service to enable contact.",Privacy:"This demo stores saves, interests and posts only in your browser (localStorage).",Terms:"Demo terms: all opportunities are fictional placeholders."};show(`<h2>${t.dataset.info}</h2><p>${T[t.dataset.info]}</p>`)}
 else if(t.hasAttribute("data-close"))dlg.close();
 else if(t.id==="sIcon"){const q=$("#q");q?(q.scrollIntoView({behavior:"smooth",block:"center"}),q.focus()):location.href="index.html"}
});
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});

/* ---------- forms ---------- */
const field=(id,l,type="text",req=1)=>`<label for="${id}">${l}</label><input id="${id}" name="${id}" type="${type}" ${req?"required":""}>`;
function postForm(){show(`<h2>Post an opportunity</h2><p class="note">Demo frontend feature: submissions are saved only in this browser.</p><form id="pf">${field("pt","Opportunity title")}${field("po","Organization")}<label for="pc">Category</label><select id="pc">${Object.keys(CATS).map(c=>`<option>${c}</option>`).join("")}</select><label for="pd">Description</label><textarea id="pd" required rows="3"></textarea>${field("pl","Location (write Online for remote)")}${field("pdl","Deadline","date")}${field("pe","Eligibility")}${field("pu","Application URL","url")}${field("pm","Contact email","email")}<button class="btn">Submit Opportunity</button></form>`);
 $("#pf").onsubmit=e=>{e.preventDefault();const c=$("#pc").value,l=$("#pl").value,p=store.get("cs_posted",[]);p.unshift({id:Date.now(),category:c,title:$("#pt").value,organization:$("#po").value,location:l,type:/online|remote/i.test(l)?"Online":"In-person",deadline:$("#pdl").value,description:$("#pd").value,eligibility:$("#pe").value,tags:[c],url:$("#pu").value,demo:false});store.set("cs_posted",p);$("#dlgBody").innerHTML=`<h2>✅ Opportunity submitted</h2><p>It now appears in its category page (demo, saved locally).</p><button class="btn" data-close>Done</button>`}}
function signIn(){const u=store.get("cs_user");if(u){show(`<h2>Hi, ${esc(u)}</h2><button class="btn" id="out">Sign out</button>`);$("#out").onclick=()=>{localStorage.removeItem("cs_user");dlg.close();user()};return}
 show(`<h2>Sign in</h2><p class="note">Demo only: no account is created.</p><form id="sf">${field("sn","Your name")}<button class="btn">Continue</button></form>`);$("#sf").onsubmit=e=>{e.preventDefault();store.set("cs_user",$("#sn").value);dlg.close();user()}}
const user=()=>{const u=store.get("cs_user");$("#signBtn").textContent=u?u.split(" ")[0]:"Sign In"};user();

/* ---------- list: search + filters + sort ---------- */
function initList(){
 const bar=$("#filters"),g=$("#grid");if(!bar)return;const cat=document.body.dataset.cat||"",home=here==="index";
 const pool=all().filter(o=>!cat||o.category===cat),uniq=a=>[...new Set(a)].sort(),opt=a=>a.map(x=>`<option>${x}</option>`).join("");
 const sel=(id,l,o)=>`<label>${l}<select id="${id}"><option value="">All</option>${opt(o)}</select></label>`;
 bar.innerHTML=`<form class="filters" role="search"><div class="srow"><label class="sr" for="q">Search opportunities</label><input id="q" type="search" placeholder="What are you looking for?"><button class="btn">Search</button></div><div class="sels">${home?sel("fc","Category",Object.keys(CATS)):""}${sel("fl","Location",uniq(pool.map(o=>o.location)))}${sel("ft","Field / tag",uniq(pool.flatMap(o=>o.tags)))}${sel("fy","Online / In-person",["Online","In-person","Hybrid"])}<label>Deadline<select id="fd"><option value="">Any</option><option value="30">Next 30 days</option><option value="60">Next 60 days</option></select></label><label>Sort by<select id="fs"><option value="r">Recommended</option><option value="n">Newest</option><option value="d">Deadline Soon</option><option value="a">Recently Added</option></select></label></div></form>`;
 const v=id=>($("#"+id)||{}).value||"";
 const run=()=>{const q=v("q").toLowerCase().split(/\s+/).filter(Boolean);
  let l=pool.filter(o=>days(o.deadline)>=0).filter(o=>{const h=[o.title,o.description,o.category,o.organization,o.location,o.tags.join(" ")].join(" ").toLowerCase();return q.every(w=>h.includes(w))&&(!v("fc")||o.category===v("fc"))&&(!v("fl")||o.location===v("fl"))&&(!v("ft")||o.tags.includes(v("ft")))&&(!v("fy")||o.type===v("fy"))&&(!v("fd")||days(o.deadline)<=+v("fd"))});
  const s=v("fs");l.sort(s==="d"?(a,b)=>a.deadline.localeCompare(b.deadline):s==="n"?(a,b)=>b.id-a.id:s==="a"?(a,b)=>(b.demo===false)-(a.demo===false)||b.id-a.id:(a,b)=>match(b)-match(a));
  const filtered=q.length||$$("select",bar).some(x=>x.id!=="fs"&&x.value);if(home&&!filtered)l=l.slice(0,6);
  grid(g,l);const c=$("#count");if(c)c.textContent=`${l.length} opportunit${l.length===1?"y":"ies"}`};
 g.innerHTML='<div class="card sk"></div>'.repeat(3);setTimeout(run,300);
 bar.addEventListener("input",run);$("form",bar).onsubmit=e=>{e.preventDefault();run();g.scrollIntoView({behavior:"smooth"})};
 const p=new URLSearchParams(location.search).get("q");if(p)$("#q").value=p;
}

/* ---------- streak, dashboard ---------- */
function streak(){const n=store.get("cs_viewed",[]).length;$$(".streak").forEach(e=>e.innerHTML=`🔥 <b>You've explored ${n} opportunit${n===1?"y":"ies"}.</b> Keep going!`)}
function dash(){
 const s=saved(),a=all();grid($("#savedGrid"),a.filter(o=>s.includes(o.id)),"Nothing saved yet. Tap ♡ Save on any card.");
 grid($("#deadGrid"),a.filter(o=>days(o.deadline)>=0).sort((x,y)=>x.deadline.localeCompare(y.deadline)).slice(0,3));
 grid($("#recGrid"),a.filter(o=>days(o.deadline)>=0).sort((x,y)=>match(y)-match(x)).slice(0,3));
 const done=Math.min(100,20+interests().length*15+(store.get("cs_user")?20:0)+(s.length?15:0));$("#prog").style.width=done+"%";$("#progT").textContent=done+"%";}
function initDash(){const b=$("#interests");if(!b)return;
 b.innerHTML=INTERESTS.map(i=>`<label class="chk"><input type="checkbox" value="${i}" ${interests().includes(i)?"checked":""}> ${i}</label>`).join("");
 b.onchange=()=>{store.set("cs_interests",$$("input:checked",b).map(x=>x.value));dash()};dash()}

/* ---------- home category cards ---------- */
const cg=$("#cats");if(cg)cg.innerHTML=Object.entries(CATS).map(([k,[i,s]])=>`<a class="cat" href="${s}.html"><span class="ci">${i}</span><b>${k==="MUN"?"MUNs":k+"s"}</b><small>${all().filter(o=>o.category===k).length} open</small></a>`).join("");

initList();initDash();streak();
const io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting&&(x.target.classList.add("in"),io.unobserve(x.target))));$$(".reveal").forEach(e=>io.observe(e));
})();
