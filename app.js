'use strict';

/* ══ STATE ══ */
const S = {
  tasks:[], filter:'all', search:'', sort:'newest',
  activeTag:null, activeCat:null, view:'dashboard',
  delId:null, editId:null, goal:5, streak:0,
  lastDate:null, pomoSessions:0, theme:'dark',
  pomoMode:'work', pomoRunning:false, pomoRemaining:1500,
  pomoTotal:1500, pomoInterval:null, pomoTaskId:null,
  modalSubs:[],
};

/* ══ STORAGE ══ */
function save() {
  localStorage.setItem('tf_tasks',   JSON.stringify(S.tasks));
  localStorage.setItem('tf_goal',    S.goal);
  localStorage.setItem('tf_streak',  S.streak);
  localStorage.setItem('tf_last',    S.lastDate||'');
  localStorage.setItem('tf_pomo',    S.pomoSessions);
  localStorage.setItem('tf_theme',   S.theme);
}
function load() {
  const t = localStorage.getItem('tf_tasks');
  S.tasks        = t ? JSON.parse(t) : [];
  S.goal         = parseInt(localStorage.getItem('tf_goal')||'5',10);
  S.streak       = parseInt(localStorage.getItem('tf_streak')||'0',10);
  S.lastDate     = localStorage.getItem('tf_last')||null;
  S.pomoSessions = parseInt(localStorage.getItem('tf_pomo')||'0',10);
  S.theme        = localStorage.getItem('tf_theme')||'dark';
}

/* ══ UTILS ══ */
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc = s=> String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const today = ()=> new Date().toISOString().split('T')[0];
const pad   = n=> String(n).padStart(2,'0');
function timeAgo(iso){
  const m=Math.floor((Date.now()-new Date(iso))/60000);
  if(m<1)return'just now';if(m<60)return m+'m ago';
  if(m<1440)return Math.floor(m/60)+'h ago';
  return Math.floor(m/1440)+'d ago';
}
function dueInfo(d){
  if(!d)return null;
  const [y,mo,day]=d.split('-').map(Number);
  const due=new Date(y,mo-1,day);
  const now=new Date();now.setHours(0,0,0,0);
  const diff=Math.round((due-now)/86400000);
  if(diff<0) return{label:Math.abs(diff)+'d overdue',cls:'ov'};
  if(diff===0)return{label:'Due today',cls:'td'};
  if(diff<=3) return{label:diff+'d left',cls:'sn'};
  return{label:diff+'d left',cls:''};
}
const parseTags = s=> s.split(',').map(t=>t.trim().toLowerCase()).filter(Boolean);
const CAT = {
  work:    {label:'Work',    color:'#6366f1',emoji:'💼'},
  personal:{label:'Personal',color:'#22d3ee',emoji:'🏠'},
  health:  {label:'Health',  color:'#34d399',emoji:'💪'},
  learning:{label:'Learning',color:'#f59e0b',emoji:'📚'},
  other:   {label:'Other',   color:'#a78bfa',emoji:'✨'},
};
const PMAP = {high:'🔴 High',medium:'🟡 Med',low:'🟢 Low'};

/* ══ TASK LOGIC ══ */
function createTask({title,desc='',priority='medium',category='work',dueDate='',tags=[],subtasks=[],progress=0}){
  return{
    id:uid(),title:title.trim(),desc:desc.trim(),
    priority,category,dueDate,tags,progress,completed:false,
    subtasks:subtasks.map(tx=>({id:uid(),text:tx,done:false})),
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  };
}
function addTask(data){
  const task=createTask(data);
  S.tasks.unshift(task);save();return task;
}
function updateTask(id,changes){
  const i=S.tasks.findIndex(t=>t.id===id);
  if(i<0)return;
  S.tasks[i]={...S.tasks[i],...changes,updatedAt:new Date().toISOString()};
  save();return S.tasks[i];
}
function deleteTask(id){S.tasks=S.tasks.filter(t=>t.id!==id);save();}
function toggleTask(id){
  const t=S.tasks.find(t=>t.id===id);if(!t)return;
  t.completed=!t.completed;
  if(t.completed){t.progress=100;t.subtasks.forEach(s=>s.done=true);recordStreak();}
  t.updatedAt=new Date().toISOString();save();return t;
}
function toggleSub(tid,sid){
  const t=S.tasks.find(t=>t.id===tid);if(!t)return;
  const s=t.subtasks.find(s=>s.id===sid);if(!s)return;
  s.done=!s.done;
  if(t.subtasks.length){
    const done=t.subtasks.filter(s=>s.done).length;
    t.progress=Math.round((done/t.subtasks.length)*100);
    if(t.progress===100)t.completed=true;
  }
  t.updatedAt=new Date().toISOString();save();
}
function clearDone(){
  const n=S.tasks.filter(t=>t.completed).length;
  S.tasks=S.tasks.filter(t=>!t.completed);save();return n;
}
function getStats(){
  const total=S.tasks.length;
  const done=S.tasks.filter(t=>t.completed).length;
  const pending=total-done;
  const td=today();
  const overdue=S.tasks.filter(t=>!t.completed&&t.dueDate&&t.dueDate<td).length;
  const pct=total?Math.round((done/total)*100):0;
  const highT=S.tasks.filter(t=>t.priority==='high').length;
  const highD=S.tasks.filter(t=>t.priority==='high'&&t.completed).length;
  const hScore=highT?(highD/highT)*30:30;
  const oScore=total?Math.max(0,30-(overdue/total)*60):30;
  const score=Math.min(100,Math.round(pct*0.4+hScore+oScore));
  const cats={};
  Object.keys(CAT).forEach(c=>cats[c]=S.tasks.filter(t=>t.category===c).length);
  const todayDone=S.tasks.filter(t=>t.completed&&t.updatedAt.startsWith(td)).length;
  return{total,done,pending,overdue,pct,score,cats,todayDone};
}
function getVisible(){
  let list=[...S.tasks];
  if(S.activeCat)list=list.filter(t=>t.category===S.activeCat);
  const fm={pending:t=>!t.completed,completed:t=>t.completed,
    high:t=>t.priority==='high',medium:t=>t.priority==='medium',low:t=>t.priority==='low'};
  if(fm[S.filter])list=list.filter(fm[S.filter]);
  if(S.activeTag)list=list.filter(t=>t.tags.includes(S.activeTag));
  if(S.search){
    const q=S.search.toLowerCase();
    list=list.filter(t=>t.title.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q)||
      t.tags.some(tg=>tg.includes(q))||t.category.toLowerCase().includes(q));
  }
  const sorters={
    newest:(a,b)=>new Date(b.createdAt)-new Date(a.createdAt),
    oldest:(a,b)=>new Date(a.createdAt)-new Date(b.createdAt),
    priority:(a,b)=>['high','medium','low'].indexOf(a.priority)-['high','medium','low'].indexOf(b.priority),
    dueDate:(a,b)=>{if(!a.dueDate)return 1;if(!b.dueDate)return -1;return a.dueDate.localeCompare(b.dueDate);},
    alpha:(a,b)=>a.title.localeCompare(b.title),
  };
  list.sort(sorters[S.sort]||sorters.newest);
  return list;
}

/* ══ STREAK ══ */
function recordStreak(){
  const td=today();
  const yd=new Date();yd.setDate(yd.getDate()-1);
  const ys=yd.toISOString().split('T')[0];
  if(S.lastDate===td)return;
  S.streak=S.lastDate===ys?S.streak+1:1;
  S.lastDate=td;save();
}
function checkStreak(){
  if(!S.lastDate)return;
  const yd=new Date();yd.setDate(yd.getDate()-1);
  if(S.lastDate<yd.toISOString().split('T')[0]){S.streak=0;save();}
}

/* ══ TOAST ══ */
function toast(msg,type='success'){
  const icons={success:'✅',error:'❌',warn:'⚠️',info:'ℹ️'};
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${esc(msg)}</span>`;
  document.getElementById('toasts').appendChild(el);
  const rm=()=>{el.classList.add('out');el.addEventListener('animationend',()=>el.remove(),{once:true});};
  setTimeout(rm,3000);el.addEventListener('click',rm);
}

/* ══ THEME ══ */
function applyTheme(th){
  document.documentElement.setAttribute('data-theme',th);
  const icon=document.getElementById('themeIcon');
  const lbl=document.getElementById('themeLabel');
  if(th==='light'){icon.textContent='🌙';lbl.textContent='Dark Mode';}
  else{icon.textContent='☀️';lbl.textContent='Light Mode';}
}
function toggleTheme(){
  S.theme=S.theme==='dark'?'light':'dark';
  applyTheme(S.theme);save();
}

/* ══ RENDER ══ */
function refresh(){renderAll();renderSidebar();renderDashboard();renderPomoQueue();}

function renderSidebar(){
  const st=getStats();
  document.getElementById('navTotal').textContent=st.total;
  document.getElementById('c-work').textContent=st.cats.work;
  document.getElementById('c-personal').textContent=st.cats.personal;
  document.getElementById('c-health').textContent=st.cats.health;
  document.getElementById('c-learning').textContent=st.cats.learning;
  document.getElementById('c-other').textContent=st.cats.other;
  document.getElementById('streakNum').textContent=S.streak;
  const gd=Math.min(st.todayDone,S.goal);
  document.getElementById('goalFrac').textContent=gd+'/'+S.goal;
  document.getElementById('goalFill').style.width=(S.goal?Math.round((gd/S.goal)*100):0)+'%';
}

function renderDashboard(){
  const st=getStats();
  animNum('s-total',st.total);animNum('s-done',st.done);
  animNum('s-pending',st.pending);animNum('s-overdue',st.overdue);
  document.getElementById('progFill').style.width=st.pct+'%';
  document.getElementById('bigPct').textContent=st.pct+'%';
  animNum('scoreVal',st.score);animNum('ringNum',st.score);
  const offset=314*(1-st.score/100);
  document.getElementById('scoreRing').style.strokeDashoffset=offset;

  // category chips
  const chips=Object.entries(CAT).map(([k,v])=>`
    <span class="cat-chip">
      <span class="cat-chip-dot" style="background:${v.color}"></span>
      ${v.emoji} ${v.label}: ${st.cats[k]}
    </span>`).join('');
  document.getElementById('catChips').innerHTML=chips;

  // category bars
  const bars=Object.entries(CAT).map(([k,v])=>{
    const pct=st.total?Math.round((st.cats[k]/st.total)*100):0;
    return`<div class="cat-bar-row">
      <span class="cat-bar-label">${v.emoji} ${v.label}</span>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${v.color}"></div></div>
      <span class="cat-bar-count">${st.cats[k]}</span>
    </div>`;
  }).join('');
  document.getElementById('catBars').innerHTML=bars;

  // recent tasks
  const recent=S.tasks.slice(0,6);
  document.getElementById('recentList').innerHTML=recent.length
    ?recent.map(t=>`<li class="recent-item">
        <span class="recent-dot" style="background:${CAT[t.category].color}"></span>
        <span class="recent-text${t.completed?' done':''}">${esc(t.title)}</span>
        <span class="recent-meta">${timeAgo(t.createdAt)}</span>
      </li>`).join('')
    :'<li style="font-size:12px;color:var(--txt3);padding:8px 0">No tasks yet!</li>';
}

function animNum(id,target){
  const el=document.getElementById(id);if(!el)return;
  const start=parseInt(el.textContent)||0;
  const diff=target-start;let f=0;
  const tick=()=>{f++;el.textContent=Math.round(start+diff*f/20);if(f<20)requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
}

function renderAll(){
  if(S.view==='tasks')renderTaskList();
}

function renderTaskList(){
  const list=document.getElementById('taskList');
  const empty=document.getElementById('emptyState');
  const footer=document.getElementById('listFooter');
  const footerTxt=document.getElementById('footerText');
  const visible=getVisible();

  list.innerHTML='';
  if(!visible.length){empty.classList.remove('hidden');footer.style.display='none';return;}
  empty.classList.add('hidden');
  footer.style.display='flex';
  const doneCount=S.tasks.filter(t=>t.completed).length;
  footerTxt.textContent=doneCount?`${doneCount} completed`:`${S.tasks.length} tasks`;

  visible.forEach((task,i)=>{
    const card=buildCard(task);
    card.style.animationDelay=i*35+'ms';
    list.appendChild(card);
  });

  // tag filter row
  const allTags=[...new Set(visible.flatMap(t=>t.tags))];
  const tagRow=document.getElementById('tagRow');
  const tagList=document.getElementById('tagRowList');
  if(allTags.length){
    tagRow.classList.remove('hidden');
    tagList.innerHTML=allTags.map(tg=>
      `<span class="tag${S.activeTag===tg?' tag-on':''}" data-tag="${esc(tg)}">#${esc(tg)}</span>`
    ).join('');
    tagList.querySelectorAll('.tag').forEach(el=>{
      el.addEventListener('click',()=>{
        S.activeTag=S.activeTag===el.dataset.tag?null:el.dataset.tag;
        renderTaskList();
      });
    });
  } else {tagRow.classList.add('hidden');tagList.innerHTML='';}
}

function buildCard(task){
  const li=document.createElement('li');
  li.className='task-card'+(task.completed?' is-done':'');
  li.setAttribute('data-id',task.id);
  li.setAttribute('data-p',task.priority);

  const cat=CAT[task.category];
  const due=dueInfo(task.dueDate);
  const sdone=task.subtasks.filter(s=>s.done).length;

  const tagsHTML=task.tags.length
    ?`<div class="tag-row">${task.tags.map(tg=>`<span class="tag${S.activeTag===tg?' tag-on':''}" data-tag="${esc(tg)}">#${esc(tg)}</span>`).join('')}</div>`:'';

  const subsHTML=task.subtasks.length
    ?`<div class="sub-preview">${task.subtasks.map(s=>`
        <div class="sub-item">
          <div class="sub-tick${s.done?' chk':''}" data-tid="${task.id}" data-sid="${s.id}"></div>
          <span class="${s.done?'sub-done':''}">${esc(s.text)}</span>
        </div>`).join('')}</div>`:'';

  const progHTML=(task.subtasks.length||task.progress>0)
    ?`<div class="tc-prog-wrap">
        <div class="tc-prog-track"><div class="tc-prog-fill" style="width:${task.progress}%"></div></div>
        <div class="tc-prog-label">${task.progress}%</div>
      </div>`:'';

  li.innerHTML=`
    <div class="tc-box${task.completed?' chk':''}" data-action="toggle" data-id="${task.id}" tabindex="0" role="checkbox" aria-checked="${task.completed}"></div>
    <div class="tc-body">
      <div class="tc-title${task.completed?' done':''}">${esc(task.title)}</div>
      ${task.desc?`<div class="tc-desc">${esc(task.desc)}</div>`:''}
      <div class="tc-meta">
        <span class="badge b-${task.priority}">${PMAP[task.priority]}</span>
        <span class="b-cat" style="background:${cat.color}18;color:${cat.color};border-color:${cat.color}44">${cat.emoji} ${cat.label}</span>
        ${due?`<span class="b-due ${due.cls}">📅 ${due.label}</span>`:''}
        ${task.subtasks.length?`<span style="font-size:10px;color:var(--txt3)">☑ ${sdone}/${task.subtasks.length}</span>`:''}
        <span class="tc-time">${timeAgo(task.createdAt)}</span>
      </div>
      ${tagsHTML}${subsHTML}${progHTML}
    </div>
    <div class="tc-actions">
      <button class="tc-btn pomo" data-action="pomo" data-id="${task.id}" title="Focus">🍅</button>
      <button class="tc-btn" data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
      <button class="tc-btn del" data-action="del" data-id="${task.id}" title="Delete">🗑</button>
    </div>`;

  // events
  li.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');
    if(!btn)return;
    const id=btn.dataset.id;
    if(btn.dataset.action==='toggle'){
      li.classList.add('pop');
      li.addEventListener('animationend',()=>li.classList.remove('pop'),{once:true});
      const t=toggleTask(id);
      toast(t.completed?'Task done! 🎉':'Marked pending.','success');
      refresh();
    }
    if(btn.dataset.action==='edit')openModal(id);
    if(btn.dataset.action==='del')openDelModal(id);
    if(btn.dataset.action==='pomo'){
      S.pomoTaskId=id;switchView('pomodoro');
      renderPomoQueue();toast('Task selected for focus 🍅','info');
    }
  });

  li.querySelectorAll('.sub-tick').forEach(el=>{
    el.addEventListener('click',e=>{
      e.stopPropagation();
      toggleSub(el.dataset.tid,el.dataset.sid);
      refresh();
    });
  });

  li.querySelectorAll('.tag').forEach(el=>{
    el.addEventListener('click',e=>{
      e.stopPropagation();
      S.activeTag=S.activeTag===el.dataset.tag?null:el.dataset.tag;
      if(S.view!=='tasks')switchView('tasks');
      renderTaskList();
    });
  });

  li.querySelector('[data-action="toggle"]').addEventListener('keydown',e=>{
    if(e.key===' '||e.key==='Enter'){e.preventDefault();e.target.click();}
  });

  return li;
}

/* ══ VIEW ROUTER ══ */
const TITLES={dashboard:'Dashboard',tasks:'All Tasks',pomodoro:'Pomodoro'};
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('view-'+v);
  if(el)el.classList.add('active');
  S.view=v;
  document.getElementById('pageTitle').textContent=TITLES[v]||v;
  document.querySelectorAll('.nav-link[data-view]').forEach(a=>
    a.classList.toggle('active',a.dataset.view===v));
  if(v==='tasks')renderTaskList();
  if(v==='dashboard'){S.activeCat=null;renderDashboard();}
  if(v==='pomodoro')renderPomoQueue();
  renderSidebar();
}

/* ══ TASK MODAL ══ */
function openModal(id=null){
  S.editId=id;S.modalSubs=[];
  const isEdit=!!id;
  document.getElementById('modalTitle').textContent=isEdit?'Edit Task':'New Task';

  if(isEdit){
    const t=S.tasks.find(t=>t.id===id);if(!t)return;
    document.getElementById('fTitle').value=t.title;
    document.getElementById('fDesc').value=t.desc;
    document.getElementById('fPriority').value=t.priority;
    document.getElementById('fCategory').value=t.category;
    document.getElementById('fDue').value=t.dueDate;
    document.getElementById('fTags').value=t.tags.join(', ');
    document.getElementById('fProgress').value=t.progress;
    document.getElementById('progLabel').textContent=t.progress+'%';
    S.modalSubs=t.subtasks.map(s=>({...s}));
  } else {
    document.getElementById('fTitle').value='';
    document.getElementById('fDesc').value='';
    document.getElementById('fPriority').value='medium';
    document.getElementById('fCategory').value='work';
    document.getElementById('fDue').value='';
    document.getElementById('fTags').value='';
    document.getElementById('fProgress').value=0;
    document.getElementById('progLabel').textContent='0%';
  }
  renderTagPreview();renderSubList();
  document.getElementById('taskModal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('fTitle').focus(),80);
}
function closeModal(){
  document.getElementById('taskModal').classList.add('hidden');
  S.editId=null;S.modalSubs=[];
}
function saveModal(){
  const title=document.getElementById('fTitle').value.trim();
  if(!title){
    document.getElementById('fTitle').style.borderColor='var(--rose)';
    toast('Title is required!','error');
    setTimeout(()=>document.getElementById('fTitle').style.borderColor='',1500);
    return;
  }
  const data={
    title,
    desc:document.getElementById('fDesc').value.trim(),
    priority:document.getElementById('fPriority').value,
    category:document.getElementById('fCategory').value,
    dueDate:document.getElementById('fDue').value,
    tags:parseTags(document.getElementById('fTags').value),
    progress:parseInt(document.getElementById('fProgress').value,10),
  };
  if(S.editId){
    data.subtasks=S.modalSubs;
    if(data.progress===100)data.completed=true;
    updateTask(S.editId,data);
    toast('Task updated ✓','success');
  } else {
    data.subtasks=S.modalSubs.map(s=>s.text);
    addTask(data);
    toast('Task added! 🎉','success');
  }
  closeModal();refresh();
}
function renderTagPreview(){
  const tags=parseTags(document.getElementById('fTags').value);
  document.getElementById('tagPreview').innerHTML=tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('');
}
function addModalSub(){
  const inp=document.getElementById('fSub');
  const txt=inp.value.trim();if(!txt)return;
  S.modalSubs.push({id:uid(),text:txt,done:false});
  inp.value='';renderSubList();inp.focus();
}
function renderSubList(){
  const ul=document.getElementById('subList');
  ul.innerHTML=S.modalSubs.map(s=>`
    <li class="sub-list-item" data-sid="${s.id}">
      <span>${esc(s.text)}</span>
      <button class="sub-del" data-sid="${s.id}">✕</button>
    </li>`).join('');
  ul.querySelectorAll('.sub-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      S.modalSubs=S.modalSubs.filter(s=>s.id!==btn.dataset.sid);
      renderSubList();
    });
  });
}

/* ══ DELETE MODAL ══ */
function openDelModal(id){
  S.delId=id;
  document.getElementById('delModal').classList.remove('hidden');
}
function closeDelModal(){
  document.getElementById('delModal').classList.add('hidden');
  S.delId=null;
}
function confirmDel(){
  if(!S.delId)return;
  const card=document.querySelector(`.task-card[data-id="${S.delId}"]`);
  const doDelete=()=>{deleteTask(S.delId);refresh();toast('Task deleted.','info');};
  if(card){
    card.classList.add('bye');
    card.addEventListener('animationend',doDelete,{once:true});
  } else doDelete();
  closeDelModal();
}

/* ══ POMODORO ══ */
const POMO_MODES={
  work: {label:'Focus Time',  mins:25,color:'#22d3ee'},
  short:{label:'Short Break', mins:5, color:'#34d399'},
  long: {label:'Long Break',  mins:15,color:'#a78bfa'},
};
const POMO_CIRC=553;

function pomoSetMode(mode){
  if(S.pomoRunning)pomoStop();
  S.pomoMode=mode;
  const cfg=POMO_MODES[mode];
  S.pomoTotal=cfg.mins*60;
  S.pomoRemaining=S.pomoTotal;
  document.getElementById('pomoMode').textContent=cfg.label;
  document.getElementById('pomoArc').style.stroke=cfg.color;
  document.querySelectorAll('.ptab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  pomoRender();
}
function pomoStart(){
  S.pomoRunning=true;
  document.getElementById('pomoPlay').textContent='⏸ Pause';
  S.pomoInterval=setInterval(()=>{
    S.pomoRemaining--;
    if(S.pomoRemaining<=0){S.pomoRemaining=0;pomoRender();pomoDone();return;}
    pomoRender();
  },1000);
}
function pomoStop(){
  S.pomoRunning=false;
  clearInterval(S.pomoInterval);
  document.getElementById('pomoPlay').textContent='▶ Start';
}
function pomoToggle(){S.pomoRunning?pomoStop():pomoStart();}
function pomoReset(){pomoStop();S.pomoRemaining=S.pomoTotal;pomoRender();}
function pomoSkip(){pomoStop();pomoDone();}
function pomoDone(){
  if(S.pomoMode==='work'){
    S.pomoSessions++;save();renderPomoDots();
    toast('🍅 Focus done! Take a break.','success');
    pomoBeep();
  } else toast('Break over! Back to work 💪','info');
  pomoStop();
  pomoSetMode(S.pomoMode==='work'?'short':'work');
}
function pomoBeep(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.frequency.value=528;
    g.gain.setValueAtTime(0.18,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.9);
    o.start();o.stop(ctx.currentTime+0.9);
  }catch(_){}
}
function pomoRender(){
  const m=Math.floor(S.pomoRemaining/60),sec=S.pomoRemaining%60;
  document.getElementById('pomoTime').textContent=pad(m)+':'+pad(sec);
  const ratio=S.pomoRemaining/S.pomoTotal;
  document.getElementById('pomoArc').style.strokeDashoffset=POMO_CIRC*(1-ratio);
  document.title=S.pomoRunning?pad(m)+':'+pad(sec)+' — TaskFlow':'TaskFlow';
}
function renderPomoDots(){
  const n=Math.min(S.pomoSessions,8);
  document.getElementById('pomoDots').innerHTML=
    Array.from({length:8},(_,i)=>`<span class="pomo-dot${i<n?' lit':''}"></span>`).join('');
}
function renderPomoQueue(){
  const pending=S.tasks.filter(t=>!t.completed).slice(0,12);
  const ul=document.getElementById('pomoQueue');
  if(!pending.length){ul.innerHTML='<li style="font-size:11.5px;color:var(--txt3);padding:8px 0">No pending tasks</li>';return;}
  ul.innerHTML=pending.map(t=>`
    <li class="pomo-q-item${t.id===S.pomoTaskId?' sel':''}" data-id="${t.id}">
      <span>${{high:'🔴',medium:'🟡',low:'🟢'}[t.priority]}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.title)}</span>
    </li>`).join('');
  ul.querySelectorAll('.pomo-q-item').forEach(el=>{
    el.addEventListener('click',()=>{
      S.pomoTaskId=el.dataset.id;
      renderPomoQueue();
      const task=S.tasks.find(t=>t.id===S.pomoTaskId);
      if(task)document.getElementById('pomoFocus').innerHTML=`
        <div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:4px">${esc(task.title)}</div>
        <div style="font-size:11px;color:var(--txt3)">${task.desc?esc(task.desc):'No description'}</div>`;
    });
  });
}

/* ══ EXPORT / IMPORT ══ */
function exportTasks(){
  const data={version:'1.0',exportedAt:new Date().toISOString(),tasks:S.tasks,goal:S.goal,streak:S.streak};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:'taskflow-'+today()+'.json'});
  a.click();URL.revokeObjectURL(url);
  toast('Exported successfully!','success');
}
function importTasks(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      if(!Array.isArray(d.tasks))throw new Error();
      const ids=new Set(S.tasks.map(t=>t.id));
      const added=d.tasks.filter(t=>!ids.has(t.id));
      S.tasks=[...added,...S.tasks];
      if(d.goal)S.goal=d.goal;
      if(d.streak)S.streak=d.streak;
      save();refresh();
      toast('Imported '+added.length+' tasks!','success');
    }catch{toast('Invalid file format.','error');}
  };
  r.readAsText(file);
}

/* ══ SEED DATA ══ */
function seed(){
  if(S.tasks.length)return;
  [
    {title:'Complete internship onboarding',desc:'Set up dev environment and meet the team',priority:'high',category:'work',dueDate:today(),tags:['onboarding','hr'],subtasks:['Setup GitHub','Install tools','Meet team'],progress:60},
    {title:'Review Pull Request #42',desc:'Check the new auth module',priority:'high',category:'work',tags:['code-review'],dueDate:'',subtasks:[],progress:0},
    {title:'Read Clean Code — Ch.5',priority:'medium',category:'learning',tags:['books'],dueDate:'',subtasks:['Read chapter','Take notes'],progress:0},
    {title:'30-min morning run',priority:'low',category:'health',tags:['fitness'],dueDate:today(),subtasks:[],progress:0},
    {title:'Plan weekend trip',desc:'Research and book hotels',priority:'low',category:'personal',tags:['travel'],dueDate:'',subtasks:[],progress:20},
  ].forEach(d=>addTask(d));
  toggleTask(S.tasks[S.tasks.length-1].id);
}

/* ══ EVENT WIRING ══ */
function wireEvents(){
  // Sidebar nav
  document.querySelectorAll('.nav-link[data-view]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      switchView(a.dataset.view);
      document.getElementById('sidebar').classList.remove('open');
    });
  });
  document.querySelectorAll('.nav-cat[data-category]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      S.activeCat=a.dataset.category;
      S.filter='all';
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      document.querySelector('.chip[data-filter="all"]').classList.add('active');
      switchView('tasks');
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Hamburger
  document.getElementById('hamburger').addEventListener('click',()=>{
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('sidebarClose').addEventListener('click',()=>{
    document.getElementById('sidebar').classList.remove('open');
  });
  document.getElementById('app').addEventListener('click',e=>{
    const sb=document.getElementById('sidebar');
    if(sb.classList.contains('open')&&!sb.contains(e.target)&&e.target.id!=='hamburger'){
      sb.classList.remove('open');
    }
  });

  // Search
  document.getElementById('globalSearch').addEventListener('input',e=>{
    S.search=e.target.value.trim();
    if(S.view!=='tasks')switchView('tasks');
    else renderTaskList();
  });
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key==='k'){
      e.preventDefault();document.getElementById('globalSearch').focus();
    }
    if(e.key==='Escape'){
      document.getElementById('taskModal').classList.add('hidden');
      document.getElementById('delModal').classList.add('hidden');
      document.getElementById('goalModal').classList.add('hidden');
    }
  });

  // Filter chips
  document.getElementById('filterChips').addEventListener('click',e=>{
    const chip=e.target.closest('.chip');if(!chip)return;
    S.filter=chip.dataset.filter;S.activeCat=null;
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');renderTaskList();
  });

  // Sort
  document.getElementById('sortBy').addEventListener('change',e=>{
    S.sort=e.target.value;renderTaskList();
  });

  // Add task button
  document.getElementById('openModal').addEventListener('click',()=>openModal());

  // Task modal
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('modalCancel').addEventListener('click',closeModal);
  document.getElementById('saveBtn').addEventListener('click',saveModal);
  document.getElementById('taskModal').addEventListener('click',e=>{
    if(e.target===document.getElementById('taskModal'))closeModal();
  });
  document.getElementById('fTags').addEventListener('input',renderTagPreview);
  document.getElementById('subAddBtn').addEventListener('click',addModalSub);
  document.getElementById('fSub').addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();addModalSub();}
  });
  document.getElementById('fProgress').addEventListener('input',e=>{
    document.getElementById('progLabel').textContent=e.target.value+'%';
  });

  // Delete modal
  document.getElementById('delCancel').addEventListener('click',closeDelModal);
  document.getElementById('delConfirm').addEventListener('click',confirmDel);
  document.getElementById('delModal').addEventListener('click',e=>{
    if(e.target===document.getElementById('delModal'))closeDelModal();
  });

  // Clear done
  document.getElementById('clearDone').addEventListener('click',()=>{
    const n=clearDone();
    if(n)toast('Cleared '+n+' task'+(n>1?'s':'')+'.','info');
    else toast('No completed tasks.','warn');
    refresh();
  });

  // Theme
  document.getElementById('themeBtn').addEventListener('click',toggleTheme);

  // Goal
  document.getElementById('goalFrac').addEventListener('click',()=>{
    document.getElementById('goalInput').value=S.goal;
    document.getElementById('goalModal').classList.remove('hidden');
  });
  document.getElementById('goalSave').addEventListener('click',()=>{
    const v=parseInt(document.getElementById('goalInput').value,10);
    if(v>0&&v<=99){S.goal=v;save();renderSidebar();toast('Goal set to '+v+' tasks!','success');}
    document.getElementById('goalModal').classList.add('hidden');
  });
  document.getElementById('goalClose').addEventListener('click',()=>{
    document.getElementById('goalModal').classList.add('hidden');
  });

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click',exportTasks);
  document.getElementById('importFile').addEventListener('change',e=>{
    importTasks(e.target.files[0]);e.target.value='';
  });

  // Pomodoro
  document.getElementById('pomoTabs').addEventListener('click',e=>{
    const btn=e.target.closest('.ptab');if(btn)pomoSetMode(btn.dataset.mode);
  });
  document.getElementById('pomoPlay').addEventListener('click',pomoToggle);
  document.getElementById('pomoReset').addEventListener('click',pomoReset);
  document.getElementById('pomoSkip').addEventListener('click',pomoSkip);

  // Dashboard card link
  document.querySelectorAll('.card-link[data-view]').forEach(a=>{
    a.addEventListener('click',e=>{e.preventDefault();switchView(a.dataset.view);});
  });
}

/* ══ INIT ══ */
function init(){
  load();
  checkStreak();
  applyTheme(S.theme);
  wireEvents();
  seed();
  pomoSetMode('work');
  renderPomoDots();
  switchView('dashboard');
  refresh();
  setTimeout(()=>{
    const h=new Date().getHours();
    const g=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
    toast(g+'! '+(S.streak>1?'🔥 '+S.streak+'-day streak!':'Ready to crush it? 💪'),'info');
  },700);
}

document.addEventListener('DOMContentLoaded',init);
