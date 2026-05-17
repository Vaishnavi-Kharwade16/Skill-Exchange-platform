/* script.js - frontend-only interactive prototype
   Replace localStorage parts with API calls when backend is available.
*/

const LS_USERS = 'ss_users';
const LS_SESSION = 'ss_session';
const LS_PROJECTS = 'ss_projects';
const LS_POSTS = 'ss_posts';
const LS_STATS = 'ss_stats';

/* ---------- Storage helpers ---------- */
function read(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
function write(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function genId(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

/* ---------- Seed demo data if needed ---------- */
if(!read(LS_USERS, null)){
  const demo = [
    { id: genId('u'), name:'Anita Sharma', email:'anita@demo.com', password:'pass123', offers:['Web Development','HTML/CSS'], wants:['Guitar'], since: new Date().toISOString(), swapsRequested:0, swapsOffered:0 },
    { id: genId('u'), name:'Ravi Kumar', email:'ravi@demo.com', password:'pass123', offers:['Graphic Design','Figma'], wants:['Cooking'], since: new Date().toISOString(), swapsRequested:0, swapsOffered:0 },
    { id: genId('u'), name:'Sneha Patel', email:'sneha@demo.com', password:'pass123', offers:['Photography'], wants:['Spanish'], since: new Date().toISOString(), swapsRequested:0, swapsOffered:0 }
  ];
  write(LS_USERS, demo);
}
if(!read(LS_PROJECTS, null)){
  write(LS_PROJECTS, [
    { id:genId('p'), title:'Campus Event App', tags:['Flutter','Firebase'], desc:'Build an app to manage college events', repo:'', author:'Anita Sharma', ts:new Date().toISOString()},
    { id:genId('p'), title:'OpenArt Gallery', tags:['React','Design'], desc:'Community-driven art website', repo:'', author:'Ravi Kumar', ts:new Date().toISOString()}
  ]);
}
if(!read(LS_POSTS, null)){
  write(LS_POSTS, [
    { id:genId('po'), title:'Swapped guitar lessons!', body:'Had a 2-hour jam session with Raj, learned basics!', author:'Anita Sharma', ts:new Date().toISOString() }
  ]);
}
if(!read(LS_STATS, null)){
  write(LS_STATS, { swaps: 3 });
}

/* ---------- On DOM load ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Stats on index
  const users = read(LS_USERS, []);
  const statUsers = document.getElementById('statUsers');
  const statSkills = document.getElementById('statSkills');
  const statSwaps = document.getElementById('statSwaps');
  if(statUsers) statUsers.textContent = users.length;
  if(statSkills) {
    const skills = Array.from(new Set(users.flatMap(u => (u.offers||[]).concat(u.wants||[]))));
    statSkills.textContent = skills.length;
  }
  if(statSwaps){
    const st = read(LS_STATS, {swaps:0});
    statSwaps.textContent = st.swaps;
  }

  // Popular chips
  const popularChips = document.getElementById('popular-chips');
  if(popularChips){
    const arr = ['Web Dev','Guitar','Photography','Design','Python','Spanish','Cooking'];
    popularChips.innerHTML = arr.map(s => `<span class="tag">${s}</span>`).join(' ');
  }

  // Discover page render
  if(document.getElementById('discoverGrid')) renderDiscover();

  // Collaboration projects render
  if(document.getElementById('projectsGrid')) renderProjects();

  // Community posts render
  if(document.getElementById('postsList')) renderPosts();

  // SkillSwap page
  if(document.getElementById('offersArea')) renderProfileSkills();

  // Login/Register page event attach
  const loginForm = document.getElementById('loginPageForm');
  if(loginForm) loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPwd').value.trim();
    const users = read(LS_USERS, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pwd);
    if(user){ write(LS_SESSION, user.id); alert('Logged in'); window.location.href='profile.html'; }
    else alert('Invalid credentials (use seeded demo accounts)');
  });

  const regForm = document.getElementById('registerPageForm');
  if(regForm) regForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pwd = document.getElementById('regPwd').value.trim();
    if(!name||!email||!pwd){ alert('Complete all fields'); return; }
    let users = read(LS_USERS, []);
    if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) { alert('Email already registered'); return; }
    const newUser = { id: genId('u'), name, email, password:pwd, offers:[], wants:[], since:new Date().toISOString(), swapsRequested:0, swapsOffered:0 };
    users.push(newUser); write(LS_USERS, users); write(LS_SESSION, newUser.id); alert('Registered'); window.location.href='profile.html';
  });

  // Community post submit
  const commForm = document.getElementById('communityForm');
  if(commForm) commForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    if(!title||!content) { alert('Enter title and content'); return; }
    const posts = read(LS_POSTS, []);
    const session = read(LS_SESSION, null);
    const user = (read(LS_USERS, []).find(u => u.id === session) || {name:'Anonymous'});
    posts.unshift({id:genId('po'), title, body:content, author:user.name, ts:new Date().toISOString()});
    write(LS_POSTS, posts);
    document.getElementById('postTitle').value=''; document.getElementById('postContent').value='';
    renderPosts();
  });

  // Project modal
  const projectModalEl = document.getElementById('projectModal');
  if(projectModalEl){
    const projectModal = new bootstrap.Modal(projectModalEl);
    document.getElementById('openProjectModal').addEventListener('click', ()=> projectModal.show());
    document.getElementById('projectForm').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('projTitle').value.trim();
      const tags = document.getElementById('projTags').value.split(',').map(s=>s.trim()).filter(Boolean);
      const desc = document.getElementById('projDesc').value.trim();
      const repo = document.getElementById('projRepo').value.trim();
      if(!title || tags.length===0 || !desc) { alert('fill all'); return; }
      const projects = read(LS_PROJECTS, []);
      const session = read(LS_SESSION,null);
      const author = (read(LS_USERS,[]).find(u=>u.id===session) || {name:'Anonymous'}).name;
      projects.unshift({ id: genId('p'), title, tags, desc, repo, author, ts:new Date().toISOString() });
      write(LS_PROJECTS, projects);
      projectModal.hide();
      renderProjects();
    });
  }

  // Skill swap add/remove handlers (profile)
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=> { localStorage.removeItem(LS_SESSION); window.location.href='index.html'; });

  const addOfferBtn = document.getElementById('addOfferBtnPage');
  if(addOfferBtn) addOfferBtn.addEventListener('click', () => {
    const val = document.getElementById('addOffer').value.trim();
    if(!val) return;
    const session = read(LS_SESSION,null);
    if(!session){ alert('Login to add skills'); window.location.href='login.html'; return; }
    const users = read(LS_USERS,[]);
    const me = users.find(u=>u.id===session);
    me.offers = Array.from(new Set([...(me.offers||[]), val]));
    write(LS_USERS, users);
    document.getElementById('addOffer').value='';
    renderProfileSkills();
  });

  const addWantBtn = document.getElementById('addWantBtnPage');
  if(addWantBtn) addWantBtn.addEventListener('click', () => {
    const val = document.getElementById('addWant').value.trim();
    if(!val) return;
    const session = read(LS_SESSION,null);
    if(!session){ alert('Login to add skills'); window.location.href='login.html'; return; }
    const users = read(LS_USERS,[]);
    const me = users.find(u=>u.id===session);
    me.wants = Array.from(new Set([...(me.wants||[]), val]));
    write(LS_USERS, users);
    document.getElementById('addWant').value='';
    renderProfileSkills();
  });

  // page-specific attach for skillswap page add buttons
  const addOfferBtnSS = document.getElementById('addOfferBtn');
  if(addOfferBtnSS){
    addOfferBtnSS.addEventListener('click', ()=> {
      const v = document.getElementById('offerInput').value.trim();
      if(!v) return alert('enter skill');
      const session = read(LS_SESSION,null);
      if(!session) { alert('Login to add'); window.location.href='login.html'; return; }
      const users = read(LS_USERS, []);
      const me = users.find(u=>u.id===session);
      me.offers = Array.from(new Set([...(me.offers||[]), v]));
      write(LS_USERS, users);
      document.getElementById('offerInput').value='';
      showToast('Added to offers');
    });
  }
  const addWantBtnSS = document.getElementById('addWantBtn');
  if(addWantBtnSS){
    addWantBtnSS.addEventListener('click', ()=> {
      const v = document.getElementById('wantInput').value.trim();
      if(!v) return alert('enter skill');
      const session = read(LS_SESSION,null);
      if(!session) { alert('Login to add'); window.location.href='login.html'; return; }
      const users = read(LS_USERS, []);
      const me = users.find(u=>u.id===session);
      me.wants = Array.from(new Set([...(me.wants||[]), v]));
      write(LS_USERS, users);
      document.getElementById('wantInput').value='';
      showToast('Added to wants');
    });
  }

  /* update navbar visibility for profile link if session exists */
  const sess = read(LS_SESSION, null);
  if(sess){
    document.querySelectorAll('.btn-outline-primary').forEach(b=>b.classList.add('d-none'));
    document.querySelectorAll('.btn-primary').forEach(b=>b.classList.remove('d-none'));
  }
});

/* ---------- Renders ---------- */
function renderDiscover(){
  const users = read(LS_USERS, []);
  const grid = document.getElementById('discoverGrid');
  if(!grid) return;
  const cards = [];
  users.forEach(u=>{
    (u.offers||[]).forEach(s=>{
      cards.push({ skill:s, user:u, type:'offer'});
    });
    (u.wants||[]).forEach(s=>{
      cards.push({ skill:s, user:u, type:'want'});
    });
  });

  // apply filter/search if present
  const q = (document.getElementById('discoverSearch')?.value || '').toLowerCase();
  const f = (document.getElementById('discoverFilter')?.value || '').toLowerCase();
  let filtered = cards.filter(c => {
    if(q && !(`${c.skill} ${c.user.name}`.toLowerCase().includes(q))) return false;
    if(f && !c.skill.toLowerCase().includes(f) && !(c.user.offers||[]).some(x=>x.toLowerCase().includes(f))) return false;
    return true;
  });

  if(filtered.length===0) grid.innerHTML = `<div class="col-12"><div class="alert alert-info">No matches yet — try different keywords.</div></div>`;
  else grid.innerHTML = filtered.map(c => {
    return `<div class="col-md-4">
      <div class="skill-card p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">${escapeHTML(c.skill)}</h5>
            <p class="small text-muted mb-1">By ${escapeHTML(c.user.name)}</p>
            <div class="d-inline-block">${(c.user.offers||[]).slice(0,3).map(t=>`<span class="tag me-1">${escapeHTML(t)}</span>`).join('')}</div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="requestSwap('${c.user.id}','${escapeJS(c.skill)}')">${c.type==='offer'?'Request Swap':'Offer to Teach'}</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* render projects */
function renderProjects(){
  const projects = read(LS_PROJECTS, []);
  const container = document.getElementById('projectsGrid');
  if(!container) return;
  if(projects.length===0) container.innerHTML = '<div class="col-12"><div class="alert alert-info">No projects yet</div></div>';
  else container.innerHTML = projects.map(p => {
    return `<div class="col-md-6">
      <div class="card p-3">
        <div class="d-flex justify-content-between">
          <h5>${escapeHTML(p.title)}</h5>
          <small class="text-muted">${new Date(p.ts).toLocaleDateString()}</small>
        </div>
        <p class="text-muted">${escapeHTML(p.desc)}</p>
        <div class="mb-2">${(p.tags||[]).map(t=>`<span class="tag me-1">${escapeHTML(t)}</span>`).join(' ')}</div>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">by ${escapeHTML(p.author)}</small>
          <div>
            <a class="btn btn-sm btn-outline-primary me-2" href="${escapeHTML(p.repo||'#')}" target="_blank">Repo</a>
            <button class="btn btn-sm btn-primary" onclick="joinProject('${p.id}')">Join</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* render posts */
function renderPosts(){
  const posts = read(LS_POSTS, []);
  const container = document.getElementById('postsList');
  if(!container) return;
  if(posts.length===0) container.innerHTML = '<div class="alert alert-info">No posts yet</div>';
  else container.innerHTML = posts.map(p => {
    return `<div class="col-12"><div class="card p-3"><h5>${escapeHTML(p.title)}</h5><p class="text-muted">${escapeHTML(p.body)}</p><small class="text-muted">by ${escapeHTML(p.author)} • ${new Date(p.ts).toLocaleString()}</small></div></div>`;
  }).join('');
}

/* render profile skills on profile page */
function renderProfileSkills(){
  const session = read(LS_SESSION, null);
  const users = read(LS_USERS, []);
  const me = users.find(u=>u.id===session);
  if(!me) return;
  const offersArea = document.getElementById('offersArea') || document.getElementById('offerTags');
  const wantsArea = document.getElementById('wantsArea') || document.getElementById('wantTags');
  if(offersArea) offersArea.innerHTML = (me.offers||[]).map(s => `<span class="tag">${escapeHTML(s)}</span>`).join(' ');
  if(wantsArea) wantsArea.innerHTML = (me.wants||[]).map(s => `<span class="tag">${escapeHTML(s)}</span>`).join(' ');

  // profile text fields
  const pfName = document.getElementById('pfName');
  const pfEmail = document.getElementById('pfEmail');
  const pfSince = document.getElementById('pfSince');
  const pfReq = document.getElementById('pfReq');
  const pfOff = document.getElementById('pfOff');
  if(pfName) pfName.textContent = me.name;
  if(pfEmail) pfEmail.textContent = me.email;
  if(pfSince) pfSince.textContent = new Date(me.since).toLocaleDateString();
  if(pfReq) pfReq.textContent = me.swapsRequested || 0;
  if(pfOff) pfOff.textContent = me.swapsOffered || 0;
}

/* ---------- Actions ---------- */
function requestSwap(userId, skill){
  const session = read(LS_SESSION, null);
  if(!session){ alert('Please login to request a swap'); window.location.href='login.html'; return; }
  const users = read(LS_USERS, []);
  const target = users.find(u=>u.id===userId);
  const me = users.find(u=>u.id===session);
  if(!target || !me) return alert('User not found');
  me.swapsRequested = (me.swapsRequested||0) + 1;
  target.swapsOffered = (target.swapsOffered||0) + 1;
  write(LS_USERS, users);
  const st = read(LS_STATS, {swaps:0});
  st.swaps = (st.swaps||0) + 1;
  write(LS_STATS, st);
  showToast(`Requested swap with ${target.name} (${skill})`);
  // update UI
  renderDiscover();
  renderProfileSkills();
}

function joinProject(projectId){
  const projects = read(LS_PROJECTS, []);
  const p = projects.find(x=>x.id===projectId);
  if(!p) return;
  const session = read(LS_SESSION, null);
  const author = (read(LS_USERS,[]).find(u=>u.id===session) || {name:'Anonymous'}).name;
  showToast(`You expressed interest to join ${p.title}. Message ${p.author} to collaborate.`);
}

/* ---------- Helpers ---------- */
function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }
function escapeJS(s){ return (s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }
function showToast(msg, type='info'){
  const t = document.createElement('div');
  t.className = 'toast-notice';
  t.style.position='fixed';
  t.style.right='18px';
  t.style.bottom='18px';
  t.style.padding='10px 14px';
  t.style.borderRadius='10px';
  t.style.background = type==='error'? '#ffe8e8' : '#e8fff4';
  t.style.boxShadow='0 10px 30px rgba(2,8,23,0.12)';
  t.style.zIndex=9999;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2400);
}
