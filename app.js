/* ============================================================
   HerDay AI – app.js
   Vanilla JS SPA with localStorage persistence
   ============================================================ */

// ===== STATE =====
let state = {
  user: null,
  tasks: [],
  habits: [],
  goals: [],
  wellness: [],
  journal: [],
  safetyContacts: [],
  reminders: { water: true, meals: true, medicine: false, exercise: true, meditation: true, sleep: true },
  theme: 'default',
  onboardingData: {}
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme(state.theme);
  if (state.user) {
    launchApp();
  } else {
    showPage('page-landing');
  }
  startReminderEngine();
});

// ===== PERSISTENCE =====
function saveState() {
  localStorage.setItem('herday_state', JSON.stringify(state));
}
function loadState() {
  const saved = localStorage.getItem('herday_state');
  if (saved) {
    try { state = { ...state, ...JSON.parse(saved) }; } catch(e) {}
  }
}

// ===== PAGE NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');
}

// ===== AUTH =====
function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  if (!name || !email || !password) return showToast('Please fill all fields', 'error');
  state.user = { name, email, password, createdAt: Date.now() };
  saveState();
  showToast(`Welcome, ${name}! Let's set up your profile 🌸`);
  initOnboarding();
  showPage('page-onboarding');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!state.user) return showToast('No account found. Please sign up.', 'error');
  if (state.user.email !== email || state.user.password !== password) {
    return showToast('Invalid email or password', 'error');
  }
  showToast(`Welcome back, ${state.user.name}! 💜`);
  launchApp();
}

function handleLogout() {
  showToast('See you soon! 👋');
  setTimeout(() => {
    document.getElementById('main-app').classList.add('hidden');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    showPage('page-landing');
  }, 800);
}

function launchApp() {
  // Seed sample data if first launch
  if (!state.tasks.length) seedSampleData();
  document.getElementById('main-app').classList.remove('hidden');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  updateNavUser();
  switchTab('dashboard');
}

// ===== ONBOARDING =====
let onboardingStep = 0;
const onboardingSteps = [
  {
    title: 'Tell us about yourself',
    subtitle: 'Help us personalize your experience',
    fields: `
      <div class="form-group"><label>Your Name</label><input type="text" id="ob-name" placeholder="What should we call you?" /></div>
      <div class="form-group"><label>I am a...</label>
        <div class="chip-group" id="ob-type-chips">
          <div class="chip" onclick="selectChip(this,'ob-type')">👩‍🎓 Student</div>
          <div class="chip" onclick="selectChip(this,'ob-type')">👩‍💼 Working Woman</div>
          <div class="chip" onclick="selectChip(this,'ob-type')">🏠 Homemaker</div>
          <div class="chip" onclick="selectChip(this,'ob-type')">💻 Freelancer</div>
          <div class="chip" onclick="selectChip(this,'ob-type')">🚀 Entrepreneur</div>
        </div>
        <input type="hidden" id="ob-type" />
      </div>
    `
  },
  {
    title: 'Your daily schedule',
    subtitle: 'We\'ll plan around your natural rhythm',
    fields: `
      <div class="form-row">
        <div class="form-group"><label>Wake-up Time</label><input type="time" id="ob-wake" value="07:00" /></div>
        <div class="form-group"><label>Sleep Time</label><input type="time" id="ob-sleep" value="23:00" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Work/Study Start</label><input type="time" id="ob-work-start" value="09:00" /></div>
        <div class="form-group"><label>Work/Study End</label><input type="time" id="ob-work-end" value="17:00" /></div>
      </div>
    `
  },
  {
    title: 'Health & wellness',
    subtitle: 'Your wellbeing is our priority',
    fields: `
      <div class="form-group"><label>Health preferences</label>
        <div class="chip-group" id="ob-health-chips">
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">🧘 Meditation</div>
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">🏃 Exercise</div>
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">💊 Medicine reminders</div>
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">💧 Water tracking</div>
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">🌙 Sleep tracking</div>
          <div class="chip" onclick="selectChip(this,'ob-health','multi')">🌸 Cycle tracking</div>
        </div>
        <input type="hidden" id="ob-health" />
      </div>
      <div class="form-group"><label>Emergency Contact Number</label><input type="tel" id="ob-safety" placeholder="+1 234 567 8900" /></div>
    `
  },
  {
    title: 'Your goals',
    subtitle: 'What do you want to achieve?',
    fields: `
      <div class="form-group"><label>My main goals are...</label>
        <div class="chip-group" id="ob-goals-chips">
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">📈 Career growth</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">🎓 Learning</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">💪 Health & fitness</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">💰 Financial freedom</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">🧘 Mental wellness</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">👨‍👩‍👧 Family & relationships</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">✈️ Travel</div>
          <div class="chip" onclick="selectChip(this,'ob-goals','multi')">🎨 Creativity</div>
        </div>
        <input type="hidden" id="ob-goals" />
      </div>
    `
  }
];

function initOnboarding() {
  onboardingStep = 0;
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const step = onboardingSteps[onboardingStep];
  const fill = ((onboardingStep + 1) / onboardingSteps.length) * 100;
  document.getElementById('onboarding-progress-fill').style.width = fill + '%';
  document.getElementById('onboarding-step-label').textContent = `Step ${onboardingStep + 1} of ${onboardingSteps.length}`;
  document.getElementById('onboarding-steps').innerHTML = `
    <div class="onboarding-step">
      <h2>${step.title}</h2>
      <p>${step.subtitle}</p>
      ${step.fields}
      <div class="onboarding-nav">
        ${onboardingStep > 0 ? `<button class="btn-ghost" onclick="prevOnboarding()">← Back</button>` : '<div></div>'}
        <button class="btn-primary" onclick="nextOnboarding()">
          ${onboardingStep === onboardingSteps.length - 1 ? 'Get Started ✨' : 'Continue →'}
        </button>
      </div>
    </div>
  `;
  // Restore saved values
  const d = state.onboardingData;
  if (d.name && document.getElementById('ob-name')) document.getElementById('ob-name').value = d.name;
  if (d.wake && document.getElementById('ob-wake')) document.getElementById('ob-wake').value = d.wake;
  if (d.sleep && document.getElementById('ob-sleep')) document.getElementById('ob-sleep').value = d.sleep;
}

function selectChip(el, fieldId, mode) {
  if (mode === 'multi') {
    el.classList.toggle('selected');
    const selected = [...el.closest('.chip-group').querySelectorAll('.chip.selected')].map(c => c.textContent.trim());
    document.getElementById(fieldId).value = selected.join(',');
  } else {
    el.closest('.chip-group').querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById(fieldId).value = el.textContent.trim();
  }
}

function nextOnboarding() {
  // Save current step data
  const d = state.onboardingData;
  if (onboardingStep === 0) {
    d.name = document.getElementById('ob-name')?.value || state.user.name;
    d.type = document.getElementById('ob-type')?.value || 'Working Woman';
    if (d.name) state.user.name = d.name;
  } else if (onboardingStep === 1) {
    d.wake = document.getElementById('ob-wake')?.value || '07:00';
    d.sleep = document.getElementById('ob-sleep')?.value || '23:00';
    d.workStart = document.getElementById('ob-work-start')?.value || '09:00';
    d.workEnd = document.getElementById('ob-work-end')?.value || '17:00';
  } else if (onboardingStep === 2) {
    d.health = document.getElementById('ob-health')?.value || '';
    const safetyNum = document.getElementById('ob-safety')?.value;
    if (safetyNum) {
      state.safetyContacts = [{ name: 'Emergency Contact', phone: safetyNum, id: Date.now() }];
    }
  } else if (onboardingStep === 3) {
    d.goals = document.getElementById('ob-goals')?.value || '';
  }
  saveState();
  if (onboardingStep < onboardingSteps.length - 1) {
    onboardingStep++;
    renderOnboardingStep();
  } else {
    showToast(`You're all set, ${state.user.name}! 🌸`);
    launchApp();
  }
}

function prevOnboarding() {
  if (onboardingStep > 0) { onboardingStep--; renderOnboardingStep(); }
}

// ===== SAMPLE DATA SEED =====
function seedSampleData() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  state.tasks = [
    { id: 1, title: 'Prepare quarterly report', priority: 'high', category: 'work', deadline: today, duration: 90, completed: false, createdAt: Date.now() },
    { id: 2, title: 'Morning yoga session', priority: 'medium', category: 'health', deadline: today, duration: 30, completed: true, createdAt: Date.now() },
    { id: 3, title: 'Review project proposal', priority: 'high', category: 'work', deadline: tomorrow, duration: 60, completed: false, createdAt: Date.now() },
    { id: 4, title: 'Call mom', priority: 'medium', category: 'family', deadline: today, duration: 20, completed: false, createdAt: Date.now() },
    { id: 5, title: 'Read 20 pages', priority: 'low', category: 'personal', deadline: today, duration: 30, completed: false, createdAt: Date.now() },
    { id: 6, title: 'Grocery shopping', priority: 'medium', category: 'home', deadline: tomorrow, duration: 45, completed: false, createdAt: Date.now() },
  ];

  state.habits = [
    { id: 1, name: 'Morning Meditation', icon: '🧘', streak: 7, completedDays: [0,1,2,3,4,5,6], todayDone: false },
    { id: 2, name: 'Exercise', icon: '🏃', streak: 4, completedDays: [0,1,0,1,1,1,0], todayDone: false },
    { id: 3, name: 'Reading', icon: '📚', streak: 12, completedDays: [1,1,1,1,1,1,1], todayDone: true },
    { id: 4, name: 'Journaling', icon: '📓', streak: 3, completedDays: [0,0,0,0,1,1,1], todayDone: false },
    { id: 5, name: 'Skincare', icon: '✨', streak: 21, completedDays: [1,1,1,1,1,1,1], todayDone: true },
    { id: 6, name: 'Save Money', icon: '💰', streak: 5, completedDays: [0,1,1,1,1,1,0], todayDone: false },
  ];

  state.goals = [
    { id: 1, title: 'Launch my online course', category: 'career', deadline: '2026-06-30', description: 'Create and publish a course on digital marketing', progress: 45, milestones: ['Research done', 'Outline created', 'Module 1 recorded'] },
    { id: 2, title: 'Run a 5K', category: 'health', deadline: '2026-05-15', description: 'Train consistently and complete a 5K race', progress: 60, milestones: ['Started training', 'Running 2km', 'Running 3.5km'] },
    { id: 3, title: 'Save $5,000', category: 'finance', deadline: '2026-12-31', description: 'Build emergency fund', progress: 30, milestones: ['Opened savings account', 'Saved $1,500'] },
  ];

  state.wellness = [
    { date: today, mood: '😊', stress: 3, sleep: 7.5, water: 6, selfCare: true },
  ];

  if (!state.safetyContacts.length) {
    state.safetyContacts = [
      { id: 1, name: 'Mom', phone: '+1 555 0101', relation: 'Family' },
      { id: 2, name: 'Best Friend Sara', phone: '+1 555 0202', relation: 'Friend' },
    ];
  }
  saveState();
}

// ===== NAV =====
function updateNavUser() {
  if (!state.user) return;
  const name = state.user.name || 'Her';
  document.getElementById('nav-username').textContent = name;
  document.getElementById('nav-avatar').textContent = name.charAt(0).toUpperCase();
  const role = state.onboardingData?.type || 'HerDay User';
  document.getElementById('nav-role').textContent = role.replace(/[^\w\s]/g, '').trim();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function switchTab(tabName) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabName);
  });
  // Update tab panels
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.classList.add('active');
  // Update topbar title
  const titles = { dashboard:'Dashboard', tasks:'Task Manager', planner:'AI Daily Planner', calendar:'Calendar', wellness:'Wellness Tracker', habits:'Habit Tracker', goals:'Goals Tracker', safety:'Safety Center', chat:'AI Chat', analytics:'Analytics', settings:'Settings', journal:'Daily Journal', pomodoro:'Focus Timer' };
  document.getElementById('topbar-title').textContent = titles[tabName] || tabName;
  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
  // Render tab content
  const renderers = { dashboard: renderDashboard, tasks: renderTasks, planner: renderPlanner, calendar: renderCalendar, wellness: renderWellness, habits: renderHabits, goals: renderGoals, safety: renderSafety, chat: initChat, analytics: renderAnalytics, settings: renderSettings, journal: renderJournal, pomodoro: renderPomodoro };
  if (renderers[tabName]) renderers[tabName]();
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===== MODAL =====
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

// ===== THEME =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'default' ? '' : theme);
  state.theme = theme;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const name = state.user?.name || 'Her';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greeting}, ${name}! 🌸`;
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Top tasks
  const pending = state.tasks.filter(t => !t.completed).sort((a,b) => priorityScore(b) - priorityScore(a)).slice(0,3);
  const taskEl = document.getElementById('dash-top-tasks');
  if (!pending.length) {
    taskEl.innerHTML = '<p style="color:var(--text3);font-size:14px;">All tasks done! 🎉</p>';
  } else {
    taskEl.innerHTML = pending.map(t => `
      <div class="task-item" style="margin-bottom:8px;">
        <div class="task-check ${t.completed?'done':''}" onclick="toggleTask(${t.id})">${t.completed?'✓':''}</div>
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="tag tag-${t.priority}">${t.priority}</span>
            <span class="tag tag-cat">${t.category}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Habits
  const habitsEl = document.getElementById('dash-habits');
  habitsEl.innerHTML = state.habits.slice(0,4).map(h => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="font-size:18px;">${h.icon}</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:var(--text);">${h.name}</div>
        <div style="font-size:11px;color:var(--text3);">🔥 ${h.streak} day streak</div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--primary);">${h.todayDone?'✓ Done':'Pending'}</div>
    </div>
  `).join('');

  // AI Plan preview
  const plan = generateAIPlan();
  const planEl = document.getElementById('dash-ai-plan');
  planEl.innerHTML = plan.slice(0,3).map(p => `
    <div style="display:flex;gap:10px;margin-bottom:8px;align-items:center;">
      <span style="font-size:12px;font-weight:800;color:var(--primary);min-width:60px;">${p.time}</span>
      <span style="font-size:13px;color:var(--text);">${p.title}</span>
    </div>
  `).join('') + `<p style="font-size:12px;color:var(--text3);margin-top:6px;">+${Math.max(0,plan.length-3)} more items</p>`;

  // Progress
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  document.getElementById('dash-progress').innerHTML = `
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-size:36px;font-weight:800;color:var(--primary);">${pct}%</div>
      <div style="font-size:13px;color:var(--text2);">${done} of ${total} tasks done</div>
    </div>
    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
  `;

  // Water tracker
  const today = new Date().toISOString().split('T')[0];
  let todayW = state.wellness.find(w => w.date === today);
  const glasses = todayW?.water || 0;
  const waterEl = document.getElementById('dash-water');
  if (waterEl) {
    waterEl.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
        ${Array.from({length:8},(_,i) => `
          <button onclick="dashAddWater(${i+1})" style="font-size:22px;background:${i<glasses?'var(--primary-light)':'var(--bg3)'};border:2px solid ${i<glasses?'var(--primary)':'var(--border)'};border-radius:8px;padding:4px 6px;cursor:pointer;transition:all 0.15s;">💧</button>
        `).join('')}
      </div>
      <div style="font-size:13px;color:var(--text2);font-weight:600;">${glasses}/8 glasses · ${glasses>=8?'🎉 Goal reached!':glasses>=4?'Halfway there!':'Keep drinking!'}</div>
    `;
  }
}

function quickMood(emoji) {
  document.querySelectorAll('.mood-quick button').forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
  const today = new Date().toISOString().split('T')[0];
  let entry = state.wellness.find(w => w.date === today);
  if (!entry) { entry = { date: today, mood: emoji, stress: 3, sleep: 7, water: 4, selfCare: false }; state.wellness.push(entry); }
  else entry.mood = emoji;
  saveState();
  showToast('Mood logged! 💜');
}

function quickAddTask() {
  const input = document.getElementById('quick-task-input');
  const title = input.value.trim();
  if (!title) return;
  const task = { id: Date.now(), title, priority: 'medium', category: 'personal', deadline: new Date().toISOString().split('T')[0], duration: 30, completed: false, createdAt: Date.now() };
  state.tasks.push(task);
  saveState();
  input.value = '';
  showToast('Task added! ✓');
  renderDashboard();
}

function dashAddWater(count) {
  const today = new Date().toISOString().split('T')[0];
  let entry = state.wellness.find(w => w.date === today);
  if (!entry) { entry = { date: today, mood: '', stress: 5, sleep: 7, water: 0, selfCare: false }; state.wellness.push(entry); }
  entry.water = count;
  saveState();
  renderDashboard();
  if (count === 8) showToast('💧 Hydration goal reached! Amazing! 🎉');
}

// ===== TASKS =====
function priorityScore(task) {
  const p = { high: 3, medium: 2, low: 1 };
  const daysLeft = task.deadline ? Math.max(0, (new Date(task.deadline) - new Date()) / 86400000) : 99;
  return (p[task.priority] || 1) * 10 - daysLeft;
}

function renderTasks() {
  const search = document.getElementById('task-search')?.value.toLowerCase() || '';
  const filterPriority = document.getElementById('task-filter-priority')?.value || '';
  const filterCat = document.getElementById('task-filter-category')?.value || '';
  const filterStatus = document.getElementById('task-filter-status')?.value || '';

  let tasks = [...state.tasks];
  if (search) tasks = tasks.filter(t => t.title.toLowerCase().includes(search));
  if (filterPriority) tasks = tasks.filter(t => t.priority === filterPriority);
  if (filterCat) tasks = tasks.filter(t => t.category === filterCat);
  if (filterStatus === 'completed') tasks = tasks.filter(t => t.completed);
  if (filterStatus === 'pending') tasks = tasks.filter(t => !t.completed);
  tasks.sort((a,b) => priorityScore(b) - priorityScore(a));

  const el = document.getElementById('task-list');
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No tasks found. Add one to get started!</p></div>`;
    return;
  }
  el.innerHTML = tasks.map(t => `
    <div class="task-item ${t.completed ? 'completed' : ''}">
      <div class="task-check ${t.completed ? 'done' : ''}" onclick="toggleTask(${t.id})">${t.completed ? '✓' : ''}</div>
      <div class="task-body">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          <span class="tag tag-${t.priority}">${t.priority}</span>
          <span class="tag tag-cat">${t.category}</span>
          ${t.deadline ? `<span class="tag tag-date">📅 ${t.deadline}</span>` : ''}
          ${t.duration ? `<span class="tag tag-date">⏱ ${t.duration}m</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button onclick="editTask(${t.id})">✏️</button>
        <button onclick="deleteTask(${t.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) { task.completed = !task.completed; saveState(); renderTasks(); renderDashboard(); }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState(); renderTasks();
  showToast('Task deleted');
}

function openTaskModal(id) {
  const task = id ? state.tasks.find(t => t.id === id) : null;
  openModal(`
    <h3>${task ? 'Edit Task' : 'New Task'}</h3>
    <form onsubmit="saveTask(event, ${id || 'null'})">
      <div class="form-group"><label>Task Title</label><input type="text" id="t-title" value="${task?.title || ''}" placeholder="What needs to be done?" required /></div>
      <div class="form-row">
        <div class="form-group"><label>Priority</label>
          <select id="t-priority">
            <option value="high" ${task?.priority==='high'?'selected':''}>High</option>
            <option value="medium" ${task?.priority==='medium'||!task?'selected':''}>Medium</option>
            <option value="low" ${task?.priority==='low'?'selected':''}>Low</option>
          </select>
        </div>
        <div class="form-group"><label>Category</label>
          <select id="t-category">
            ${['work','study','home','family','self-care','health','personal'].map(c => `<option value="${c}" ${task?.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Deadline</label><input type="date" id="t-deadline" value="${task?.deadline || ''}" /></div>
        <div class="form-group"><label>Duration (minutes)</label><input type="number" id="t-duration" value="${task?.duration || 30}" min="5" /></div>
      </div>
      <button type="submit" class="btn-primary full">${task ? 'Update Task' : 'Add Task'}</button>
    </form>
  `);
}

function editTask(id) { openTaskModal(id); }

function saveTask(e, id) {
  e.preventDefault();
  const title = document.getElementById('t-title').value.trim();
  if (!title) return showToast('Please enter a task title', 'error');
  const data = {
    title,
    priority: document.getElementById('t-priority').value,
    category: document.getElementById('t-category').value,
    deadline: document.getElementById('t-deadline').value,
    duration: parseInt(document.getElementById('t-duration').value) || 30,
  };
  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) Object.assign(task, data);
    showToast('Task updated ✓');
  } else {
    state.tasks.push({ id: Date.now(), ...data, completed: false, createdAt: Date.now() });
    showToast('Task added ✓');
  }
  saveState(); closeModal(); renderTasks();
}

// ===== AI PLANNER =====
function generateAIPlan() {
  const d = state.onboardingData;
  const wakeTime = d.wake || '07:00';
  const workStart = d.workStart || '09:00';
  const workEnd = d.workEnd || '17:00';
  const sleepTime = d.sleep || '23:00';

  const pending = state.tasks.filter(t => !t.completed).sort((a,b) => priorityScore(b) - priorityScore(a));
  const plan = [];

  // Morning routine
  plan.push({ time: wakeTime, title: '🌅 Morning Routine', note: 'Wake up, hydrate, stretch', type: 'routine' });
  plan.push({ time: addMinutes(wakeTime, 30), title: '🧘 Meditation & Mindfulness', note: '10 minutes of calm breathing', type: 'wellness' });
  plan.push({ time: addMinutes(wakeTime, 45), title: '🍳 Breakfast', note: 'Nourish your body for the day', type: 'break' });

  let cursor = workStart;
  let taskIdx = 0;

  // Work blocks
  while (cursor < workEnd && taskIdx < pending.length) {
    const task = pending[taskIdx];
    const dur = task.duration || 30;
    plan.push({ time: cursor, title: task.title, note: `${dur} min · ${task.category} · ${task.priority} priority`, type: 'task', taskId: task.id });
    cursor = addMinutes(cursor, dur);
    taskIdx++;
    // Add break every 90 mins
    if (taskIdx % 2 === 0 && cursor < workEnd) {
      plan.push({ time: cursor, title: '☕ Short Break', note: 'Rest your eyes, stretch, hydrate', type: 'break' });
      cursor = addMinutes(cursor, 15);
    }
  }

  // Lunch
  plan.push({ time: '13:00', title: '🥗 Lunch Break', note: 'Step away from work, eat mindfully', type: 'break' });

  // Afternoon remaining tasks
  cursor = '14:00';
  while (cursor < workEnd && taskIdx < pending.length) {
    const task = pending[taskIdx];
    const dur = task.duration || 30;
    plan.push({ time: cursor, title: task.title, note: `${dur} min · ${task.category}`, type: 'task', taskId: task.id });
    cursor = addMinutes(cursor, dur + 15);
    taskIdx++;
  }

  // Evening
  plan.push({ time: workEnd, title: '🌿 Wind Down', note: 'Review your day, plan tomorrow', type: 'wellness' });
  plan.push({ time: addMinutes(workEnd, 30), title: '🏃 Exercise / Walk', note: 'Move your body, clear your mind', type: 'wellness' });
  plan.push({ time: addMinutes(sleepTime, -60), title: '📚 Personal Time', note: 'Reading, journaling, or hobby', type: 'routine' });
  plan.push({ time: addMinutes(sleepTime, -30), title: '🌙 Sleep Prep', note: 'No screens, relax and unwind', type: 'routine' });
  plan.push({ time: sleepTime, title: '😴 Bedtime', note: 'Rest well, you deserve it!', type: 'routine' });

  return plan.sort((a,b) => a.time.localeCompare(b.time));
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
}

function renderPlanner() {
  const plan = generateAIPlan();
  const el = document.getElementById('planner-content');
  const pending = state.tasks.filter(t => !t.completed).length;
  el.innerHTML = `
    <div class="plan-why">
      <strong>✨ Why this plan?</strong> Based on your schedule (${state.onboardingData.wake||'07:00'} – ${state.onboardingData.sleep||'23:00'}),
      I've prioritized your ${pending} pending tasks by urgency and deadline, added breaks every 90 minutes,
      and protected time for wellness and personal growth. High-priority tasks are scheduled during your peak hours.
    </div>
    ${plan.map(p => `
      <div class="plan-block ${p.type === 'break' || p.type === 'wellness' ? 'plan-break' : ''}">
        <div class="plan-time">${p.time}</div>
        <div class="plan-body">
          <div class="plan-title">${p.title}</div>
          <div class="plan-note">${p.note}</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ===== CALENDAR =====
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderCalendar() {
  const el = document.getElementById('calendar-container');
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  // Get dates with tasks
  const taskDates = new Set(state.tasks.map(t => t.deadline));

  let html = `
    <div class="calendar-nav">
      <button onclick="changeMonth(-1)">‹</button>
      <h3>${monthNames[calMonth]} ${calYear}</h3>
      <button onclick="changeMonth(1)">›</button>
    </div>
    <div class="calendar-grid">
      ${days.map(d => `<div class="cal-header">${d}</div>`).join('')}
  `;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const hasEvent = taskDates.has(dateStr);
    html += `<div class="cal-day ${isToday?'today':''} ${hasEvent?'has-event':''}" onclick="showCalDay('${dateStr}')">${d}</div>`;
  }
  html += '</div>';
  el.innerHTML = html;
  showCalDay(new Date().toISOString().split('T')[0]);
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function showCalDay(dateStr) {
  const tasks = state.tasks.filter(t => t.deadline === dateStr);
  const el = document.getElementById('calendar-events');
  const label = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  if (!tasks.length) {
    el.innerHTML = `<div class="calendar-events-list"><h4 style="color:var(--text2);font-size:14px;margin-bottom:10px;">${label}</h4><div class="empty-state" style="padding:24px;"><div class="empty-icon">📅</div><p>No tasks on this day</p></div></div>`;
    return;
  }
  el.innerHTML = `
    <div class="calendar-events-list">
      <h4 style="color:var(--text2);font-size:14px;margin-bottom:10px;">${label} · ${tasks.length} task${tasks.length>1?'s':''}</h4>
      ${tasks.map(t => `
        <div class="event-item">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);">${t.title}</div>
            <div style="font-size:12px;color:var(--text3);">${t.category} · ${t.duration}m</div>
          </div>
          <span class="tag tag-${t.priority}">${t.priority}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== WELLNESS =====
function renderWellness() {
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = state.wellness.find(w => w.date === today) || {};
  const last7 = getLast7Days().map(d => state.wellness.find(w => w.date === d) || { date: d });

  document.getElementById('wellness-content').innerHTML = `
    <div class="wellness-grid">
      <div class="wellness-card">
        <div class="w-icon">😊</div>
        <div class="w-label">Today's Mood</div>
        <div class="w-value">${todayEntry.mood || '—'}</div>
        <div class="w-sub">How you're feeling</div>
      </div>
      <div class="wellness-card">
        <div class="w-icon">😴</div>
        <div class="w-label">Sleep</div>
        <div class="w-value">${todayEntry.sleep || '—'}<span style="font-size:14px;">h</span></div>
        <div class="w-sub">Hours last night</div>
      </div>
      <div class="wellness-card">
        <div class="w-icon">💧</div>
        <div class="w-label">Water</div>
        <div class="w-value">${todayEntry.water || 0}<span style="font-size:14px;">/8</span></div>
        <div class="w-sub">Glasses today</div>
      </div>
      <div class="wellness-card">
        <div class="w-icon">🧘</div>
        <div class="w-label">Stress Level</div>
        <div class="w-value">${todayEntry.stress || '—'}<span style="font-size:14px;">/10</span></div>
        <div class="w-sub">Lower is better</div>
      </div>
    </div>

    <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);margin-bottom:16px;">
      <h4 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;">7-Day Sleep Trend</h4>
      <div class="bar-chart">
        ${last7.map(d => {
          const h = d.sleep || 0;
          const pct = Math.min(100, (h / 10) * 100);
          const label = d.date ? d.date.slice(5) : '';
          return `<div class="bar-item"><div class="bar" style="height:${pct}%"></div><div class="bar-label">${label}</div></div>`;
        }).join('')}
      </div>
    </div>

    <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);margin-bottom:16px;">
      <h4 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;">7-Day Mood Log</h4>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${last7.map(d => `
          <div style="text-align:center;">
            <div style="font-size:22px;">${d.mood || '⬜'}</div>
            <div style="font-size:11px;color:var(--text3);">${d.date ? d.date.slice(5) : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);margin-bottom:16px;">
      <h4 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;">7-Day Water Intake</h4>
      <div class="bar-chart">
        ${last7.map(d => {
          const g = d.water || 0;
          const pct = Math.min(100, (g / 8) * 100);
          return `<div class="bar-item"><div class="bar" style="height:${pct}%;background:linear-gradient(180deg,#38bdf8,#0284c7);"></div><div class="bar-label">${d.date ? d.date.slice(5) : ''}</div></div>`;
        }).join('')}
      </div>
    </div>

    <div class="cycle-section">
      <h4>🌸 Cycle Tracker</h4>
      <div class="form-row">
        <div class="form-group"><label>Last Period Start</label><input type="date" id="cycle-start" value="${state.wellness.find(w=>w.cycleStart)?.cycleStart||''}" onchange="saveCycle()" /></div>
        <div class="form-group"><label>Cycle Length (days)</label><input type="number" id="cycle-len" value="${state.cycleLength||28}" min="21" max="35" onchange="saveCycle()" /></div>
      </div>
      <div id="cycle-prediction" style="font-size:14px;color:var(--text2);margin-top:8px;"></div>
    </div>
  `;
  updateCyclePrediction();
}

function saveCycle() {
  const start = document.getElementById('cycle-start')?.value;
  const len = parseInt(document.getElementById('cycle-len')?.value) || 28;
  state.cycleLength = len;
  if (start) {
    const today = new Date().toISOString().split('T')[0];
    let entry = state.wellness.find(w => w.date === today);
    if (!entry) { entry = { date: today }; state.wellness.push(entry); }
    entry.cycleStart = start;
  }
  saveState();
  updateCyclePrediction();
}

function updateCyclePrediction() {
  const el = document.getElementById('cycle-prediction');
  if (!el) return;
  const start = document.getElementById('cycle-start')?.value;
  if (!start) { el.textContent = 'Enter your last period start date for predictions.'; return; }
  const len = parseInt(document.getElementById('cycle-len')?.value) || 28;
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + len);
  const ovulationDate = new Date(start);
  ovulationDate.setDate(ovulationDate.getDate() + Math.round(len / 2) - 2);
  el.innerHTML = `🔮 Next period: <strong>${nextDate.toLocaleDateString()}</strong> &nbsp;|&nbsp; Estimated ovulation: <strong>${ovulationDate.toLocaleDateString()}</strong>`;
}

function getLast7Days() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toISOString().split('T')[0];
  });
}

function openWellnessModal() {
  const today = new Date().toISOString().split('T')[0];
  const entry = state.wellness.find(w => w.date === today) || {};
  openModal(`
    <h3>Log Today's Wellness</h3>
    <form onsubmit="saveWellness(event)">
      <div class="form-group"><label>Mood</label>
        <div class="chip-group" id="w-mood-chips">
          ${['😊','😐','😔','😤','😴','🤩','😰'].map(m => `<div class="chip ${entry.mood===m?'selected':''}" onclick="selectChip(this,'w-mood')">${m}</div>`).join('')}
        </div>
        <input type="hidden" id="w-mood" value="${entry.mood||''}" />
      </div>
      <div class="form-row">
        <div class="form-group"><label>Sleep Hours</label><input type="number" id="w-sleep" value="${entry.sleep||7}" min="0" max="24" step="0.5" /></div>
        <div class="form-group"><label>Water Glasses</label><input type="number" id="w-water" value="${entry.water||0}" min="0" max="20" /></div>
      </div>
      <div class="form-group"><label>Stress Level (1-10)</label><input type="range" id="w-stress" min="1" max="10" value="${entry.stress||5}" oninput="document.getElementById('w-stress-val').textContent=this.value" /></div>
      <div style="text-align:center;font-size:18px;font-weight:800;color:var(--primary);margin-bottom:12px;" id="w-stress-val">${entry.stress||5}</div>
      <div class="form-group"><label>Self-Care Done Today?</label>
        <div class="chip-group">
          <div class="chip ${entry.selfCare?'selected':''}" onclick="selectChip(this,'w-selfcare')">✓ Yes</div>
          <div class="chip ${!entry.selfCare?'selected':''}" onclick="selectChip(this,'w-selfcare')">✗ Not yet</div>
        </div>
        <input type="hidden" id="w-selfcare" value="${entry.selfCare?'yes':'no'}" />
      </div>
      <button type="submit" class="btn-primary full">Save Wellness Log</button>
    </form>
  `);
}

function saveWellness(e) {
  e.preventDefault();
  const today = new Date().toISOString().split('T')[0];
  const data = {
    date: today,
    mood: document.getElementById('w-mood').value,
    sleep: parseFloat(document.getElementById('w-sleep').value),
    water: parseInt(document.getElementById('w-water').value),
    stress: parseInt(document.getElementById('w-stress').value),
    selfCare: document.getElementById('w-selfcare').value === 'yes',
  };
  const idx = state.wellness.findIndex(w => w.date === today);
  if (idx >= 0) state.wellness[idx] = { ...state.wellness[idx], ...data };
  else state.wellness.push(data);
  saveState(); closeModal(); renderWellness();
  showToast('Wellness logged! 🌿');
}

// ===== HABITS =====
function renderHabits() {
  const el = document.getElementById('habits-content');
  if (!state.habits.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔥</div><p>No habits yet. Add one to start building streaks!</p></div>`;
    return;
  }
  el.innerHTML = state.habits.map(h => {
    const dots = h.completedDays.slice(-7).map(d => `<div class="habit-dot ${d?'done':''}"></div>`).join('');
    const rate = h.completedDays.length ? Math.round((h.completedDays.filter(Boolean).length / h.completedDays.length) * 100) : 0;
    return `
      <div class="habit-item">
        <div class="habit-icon">${h.icon}</div>
        <div class="habit-body">
          <div class="habit-name">${h.name}</div>
          <div class="habit-streak">🔥 ${h.streak} day streak · ${rate}% completion rate</div>
          <div class="habit-dots">${dots}</div>
        </div>
        <button class="habit-check-btn ${h.todayDone?'checked':''}" onclick="toggleHabit(${h.id})">${h.todayDone?'✓':'○'}</button>
        <button onclick="deleteHabit(${h.id})" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--text3);">🗑️</button>
      </div>
    `;
  }).join('');
}

function toggleHabit(id) {
  const habit = state.habits.find(h => h.id === id);
  if (!habit) return;
  habit.todayDone = !habit.todayDone;
  if (habit.todayDone) {
    habit.streak++;
    habit.completedDays.push(1);
    showToast(`${habit.icon} ${habit.name} – streak: ${habit.streak} days! 🔥`);
  } else {
    habit.streak = Math.max(0, habit.streak - 1);
    habit.completedDays.push(0);
    showToast(`${habit.name} unchecked`);
  }
  saveState(); renderHabits();
}

function deleteHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  saveState(); renderHabits();
  showToast('Habit removed');
}

function openHabitModal() {
  const icons = ['🧘','🏃','📚','📓','✨','💰','🎨','🎵','🥗','💊','🌿','🏋️'];
  openModal(`
    <h3>New Habit</h3>
    <form onsubmit="saveHabit(event)">
      <div class="form-group"><label>Habit Name</label><input type="text" id="h-name" placeholder="e.g. Morning Meditation" required /></div>
      <div class="form-group"><label>Choose Icon</label>
        <div class="chip-group" id="h-icon-chips">
          ${icons.map(i => `<div class="chip" onclick="selectChip(this,'h-icon')" style="font-size:20px;">${i}</div>`).join('')}
        </div>
        <input type="hidden" id="h-icon" value="🌟" />
      </div>
      <button type="submit" class="btn-primary full">Add Habit</button>
    </form>
  `);
}

function saveHabit(e) {
  e.preventDefault();
  const name = document.getElementById('h-name').value.trim();
  if (!name) return showToast('Please enter a habit name', 'error');
  state.habits.push({ id: Date.now(), name, icon: document.getElementById('h-icon').value || '🌟', streak: 0, completedDays: [], todayDone: false });
  saveState(); closeModal(); renderHabits();
  showToast('Habit added! Start your streak today 🔥');
}

// ===== GOALS =====
function renderGoals() {
  const el = document.getElementById('goals-content');
  if (!state.goals.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>No goals yet. Set your first goal!</p></div>`;
    return;
  }
  el.innerHTML = state.goals.map(g => `
    <div class="goal-item">
      <div class="goal-header">
        <div class="goal-title">🎯 ${g.title}</div>
        <div class="goal-deadline">📅 ${g.deadline}</div>
      </div>
      <div class="goal-desc">${g.description}</div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${g.progress}%"></div></div>
      <div class="goal-progress-label">${g.progress}% complete</div>
      ${g.milestones?.length ? `
        <div style="margin-top:10px;">
          <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:6px;">MILESTONES</div>
          ${g.milestones.map(m => `<div style="font-size:13px;color:var(--text2);margin-bottom:3px;">✓ ${m}</div>`).join('')}
        </div>
      ` : ''}
      <div class="goal-actions">
        <button class="btn-sm" onclick="updateGoalProgress(${g.id})">Update Progress</button>
        <button class="btn-danger" onclick="deleteGoal(${g.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openGoalModal() {
  openModal(`
    <h3>New Goal</h3>
    <form onsubmit="saveGoal(event)">
      <div class="form-group"><label>Goal Title</label><input type="text" id="g-title" placeholder="What do you want to achieve?" required /></div>
      <div class="form-group"><label>Description</label><textarea id="g-desc" rows="2" placeholder="Describe your goal..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Category</label>
          <select id="g-cat">
            <option value="career">Career</option><option value="health">Health</option>
            <option value="finance">Finance</option><option value="personal">Personal</option>
            <option value="education">Education</option><option value="relationships">Relationships</option>
          </select>
        </div>
        <div class="form-group"><label>Deadline</label><input type="date" id="g-deadline" required /></div>
      </div>
      <div class="form-group"><label>First Milestone</label><input type="text" id="g-milestone" placeholder="First step..." /></div>
      <button type="submit" class="btn-primary full">Add Goal</button>
    </form>
  `);
}

function saveGoal(e) {
  e.preventDefault();
  const title = document.getElementById('g-title').value.trim();
  if (!title) return showToast('Please enter a goal title', 'error');
  const milestone = document.getElementById('g-milestone').value.trim();
  state.goals.push({
    id: Date.now(), title,
    description: document.getElementById('g-desc').value,
    category: document.getElementById('g-cat').value,
    deadline: document.getElementById('g-deadline').value,
    progress: 0,
    milestones: milestone ? [milestone] : []
  });
  saveState(); closeModal(); renderGoals();
  showToast('Goal added! You\'ve got this 🎯');
}

function updateGoalProgress(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  openModal(`
    <h3>Update Progress</h3>
    <p style="color:var(--text2);margin-bottom:16px;">${goal.title}</p>
    <div class="form-group"><label>Progress: <span id="prog-val">${goal.progress}</span>%</label>
      <input type="range" id="prog-slider" min="0" max="100" value="${goal.progress}" oninput="document.getElementById('prog-val').textContent=this.value" />
    </div>
    <div class="form-group"><label>Add Milestone</label><input type="text" id="prog-milestone" placeholder="What did you accomplish?" /></div>
    <button class="btn-primary full" onclick="saveGoalProgress(${id})">Save Progress</button>
  `);
}

function saveGoalProgress(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  goal.progress = parseInt(document.getElementById('prog-slider').value);
  const ms = document.getElementById('prog-milestone').value.trim();
  if (ms) goal.milestones.push(ms);
  saveState(); closeModal(); renderGoals();
  showToast(goal.progress === 100 ? '🎉 Goal completed! Amazing work!' : 'Progress updated!');
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveState(); renderGoals();
  showToast('Goal removed');
}

// ===== SAFETY =====
function renderSafety() {
  const el = document.getElementById('safety-content');
  el.innerHTML = `
    <button class="sos-btn" style="width:100%;padding:24px;font-size:20px;font-weight:800;border-radius:var(--radius);margin-bottom:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(239,68,68,0.4);" onclick="triggerSOS()">
      🆘 EMERGENCY SOS – Tap to Alert Contacts
    </button>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <button onclick="shareLocationOnly()" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;border:none;border-radius:var(--radius-sm);padding:14px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(59,130,246,0.35);">
        📍 Share My Location
      </button>
      <button onclick="triggerFakeCall()" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;border:none;border-radius:var(--radius-sm);padding:14px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(139,92,246,0.35);">
        📲 Fake Call (Escape)
      </button>
    </div>

    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--radius-sm);padding:14px;margin-bottom:20px;font-size:13px;color:#991b1b;line-height:1.6;">
      <strong>📱 How SOS works:</strong> Tapping SOS opens your native SMS app and WhatsApp pre-filled with an emergency message for each contact — one tap to send. Works best on mobile.
    </div>

    <div class="safety-contacts">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h4 style="font-size:15px;font-weight:700;color:var(--text);">Emergency Contacts</h4>
        <button class="btn-sm" onclick="openContactModal()">+ Add Contact</button>
      </div>
      ${state.safetyContacts.length ? state.safetyContacts.map(c => {
        const phone = c.phone.replace(/\s+/g,'').replace(/[^\d+]/g,'');
        const sosMsg = encodeURIComponent(`🆘 EMERGENCY SOS from ${state.user?.name||'me'}! I need help urgently. Please contact me immediately.`);
        return `
        <div class="contact-item">
          <div>
            <div class="contact-name">${c.name}</div>
            <div class="contact-phone">${c.phone} ${c.relation ? '· '+c.relation : ''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="tel:${phone}" class="btn-sm">📞 Call</a>
            <a href="sms:${phone}?body=${sosMsg}" class="btn-sm" style="background:#fee2e2;color:#dc2626;">📱 SMS</a>
            <a href="https://wa.me/${phone.replace('+','')}?text=${sosMsg}" target="_blank" rel="noopener" class="btn-sm" style="background:#dcfce7;color:#16a34a;">💬 WA</a>
            <button class="btn-danger" onclick="deleteContact(${c.id})">Remove</button>
          </div>
        </div>
      `}).join('') : '<p style="color:var(--text3);font-size:14px;">No contacts added yet.</p>'}
    </div>

    <div class="helplines">
      <div class="helpline-card"><div class="h-name">Emergency</div><div class="h-num"><a href="tel:911" style="color:var(--primary);text-decoration:none;">911</a></div><div class="h-desc">Police / Fire / Medical</div></div>
      <div class="helpline-card"><div class="h-name">Women's Helpline</div><div class="h-num" style="font-size:13px;"><a href="tel:18007997233" style="color:var(--primary);text-decoration:none;">1-800-799-7233</a></div><div class="h-desc">Domestic Violence Hotline</div></div>
      <div class="helpline-card"><div class="h-name">Crisis Text Line</div><div class="h-num" style="font-size:13px;"><a href="sms:741741?body=HOME" style="color:var(--primary);text-decoration:none;">Text HOME → 741741</a></div><div class="h-desc">24/7 Crisis Support</div></div>
      <div class="helpline-card"><div class="h-name">RAINN Hotline</div><div class="h-num" style="font-size:13px;"><a href="tel:18006564673" style="color:var(--primary);text-decoration:none;">1-800-656-4673</a></div><div class="h-desc">Sexual Assault Support</div></div>
    </div>

    <div class="safety-tips">
      <h4>🛡️ Safety Tips</h4>
      <ul style="list-style:none;padding:0;">
        <li>📍 Share your live location with a trusted contact when traveling alone</li>
        <li>🔋 Keep your phone charged when going out</li>
        <li>👥 Let someone know your plans and expected return time</li>
        <li>🚗 Trust your instincts – if something feels wrong, leave</li>
        <li>📱 Save emergency numbers in your phone's favorites</li>
        <li>🏠 Have a code word with family/friends for emergencies</li>
        <li>💪 Consider taking a self-defense class</li>
      </ul>
    </div>
  `;
}

function triggerSOS() {
  const contacts = state.safetyContacts;
  if (!contacts.length) {
    showToast('⚠️ No emergency contacts set. Go to Safety Center to add contacts.', 'warning');
    switchTab('safety');
    return;
  }
  startSOSCountdown(contacts);
}

// ── SOS COUNTDOWN ──
let sosCountdownInterval = null;

function startSOSCountdown(contacts) {
  let count = 5;
  openModal(`
    <div style="text-align:center;padding:16px;" id="sos-countdown-screen">
      <div style="font-size:52px;margin-bottom:8px;">🆘</div>
      <h3 style="color:#dc2626;font-size:20px;margin-bottom:6px;">SOS Activating…</h3>
      <p style="color:var(--text2);font-size:14px;margin-bottom:20px;">Getting your location and alerting contacts</p>
      <div id="sos-count-num" style="font-size:72px;font-weight:900;color:#dc2626;line-height:1;margin-bottom:20px;">${count}</div>
      <div style="background:#fee2e2;border-radius:10px;height:8px;margin-bottom:20px;">
        <div id="sos-count-bar" style="height:100%;border-radius:10px;background:linear-gradient(90deg,#ef4444,#dc2626);width:100%;transition:width 1s linear;"></div>
      </div>
      <button class="btn-ghost full" onclick="cancelSOS()" style="border-color:#dc2626;color:#dc2626;">✕ Cancel SOS</button>
    </div>
  `);

  sosCountdownInterval = setInterval(() => {
    count--;
    const numEl = document.getElementById('sos-count-num');
    const barEl = document.getElementById('sos-count-bar');
    if (numEl) numEl.textContent = count;
    if (barEl) barEl.style.width = (count / 5 * 100) + '%';
    if (count <= 0) {
      clearInterval(sosCountdownInterval);
      sosCountdownInterval = null;
      activateSOS(contacts);
    }
  }, 1000);
}

function cancelSOS() {
  if (sosCountdownInterval) { clearInterval(sosCountdownInterval); sosCountdownInterval = null; }
  closeModal();
  showToast('SOS cancelled ✓');
}

// ── ACTIVATE SOS (with location) ──
function activateSOS(contacts) {
  playSirenSound();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => showSOSModal(contacts, pos.coords.latitude, pos.coords.longitude),
      ()  => showSOSModal(contacts, null, null),
      { timeout: 6000 }
    );
  } else {
    showSOSModal(contacts, null, null);
  }
}

function showSOSModal(contacts, lat, lng) {
  const userName = state.user?.name || 'me';
  const now = new Date().toLocaleString();
  const locationLine = lat
    ? `📍 My location: https://maps.google.com/?q=${lat},${lng}`
    : '📍 Location unavailable';
  const fullMsg = encodeURIComponent(
    `🆘 EMERGENCY SOS from ${userName}!\n\nI need help urgently. Please contact me immediately.\n\n${locationLine}\n\nSent at: ${now}\n– HerDay AI`
  );

  openModal(`
    <div style="text-align:center;padding:8px;">
      <div style="font-size:52px;margin-bottom:8px;animation:pulse 1s infinite;">🆘</div>
      <h3 style="color:#dc2626;margin-bottom:6px;font-size:20px;">SOS Active</h3>

      ${lat ? `
        <div style="background:#dcfce7;border:1px solid #86efac;border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;font-size:13px;color:#166534;font-weight:600;">
          📍 Location captured: <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="color:#16a34a;">View on Maps</a>
        </div>
      ` : `
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;font-size:13px;color:#92400e;">
          ⚠️ Location unavailable — allow location access for better SOS
        </div>
      `}

      <p style="color:var(--text2);font-size:13px;margin-bottom:16px;">Tap a contact to send your emergency message ${lat ? 'with live location' : ''}:</p>

      ${contacts.map(c => {
        const phone = c.phone.replace(/\s+/g,'').replace(/[^\d+]/g,'');
        return `
          <div style="background:#fff5f5;border:2px solid #fca5a5;border-radius:var(--radius-sm);padding:14px;margin-bottom:10px;text-align:left;">
            <div style="font-weight:800;color:#dc2626;font-size:15px;">${c.name}</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">${c.phone}${c.relation?' · '+c.relation:''}</div>
            <div style="display:flex;gap:8px;">
              <a href="sms:${phone}?body=${fullMsg}" class="btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:10px;font-size:13px;background:linear-gradient(135deg,#ef4444,#dc2626);">📱 SMS</a>
              <a href="https://wa.me/${phone.replace('+','')}?text=${fullMsg}" target="_blank" rel="noopener" class="btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:10px;font-size:13px;background:linear-gradient(135deg,#25d366,#128c7e);">💬 WhatsApp</a>
              <a href="tel:${phone}" class="btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:10px;font-size:13px;background:linear-gradient(135deg,#6366f1,#4f46e5);">📞 Call</a>
            </div>
          </div>
        `;
      }).join('')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;margin-bottom:12px;">
        <a href="tel:911" style="display:block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border-radius:var(--radius-sm);padding:12px;font-weight:800;font-size:14px;text-decoration:none;">
          📞 Call 911
        </a>
        <button onclick="triggerFakeCall()" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;border:none;border-radius:var(--radius-sm);padding:12px;font-weight:800;font-size:14px;cursor:pointer;">
          📲 Fake Call
        </button>
      </div>

      <div style="background:#fef2f2;border-radius:var(--radius-sm);padding:10px 14px;font-size:12px;color:#991b1b;line-height:1.6;margin-bottom:12px;text-align:left;">
        <strong>Message includes:</strong> Your name, timestamp${lat?', live Google Maps location':''}.
      </div>

      <button class="btn-ghost full" onclick="stopSirenAndClose()" style="border-color:#dc2626;color:#dc2626;">✓ I'm Safe Now</button>
    </div>
  `);
}

// ── SIREN ──
let sirenOscillators = [];
let sirenCtx = null;

function playSirenSound() {
  try {
    sirenCtx = new (window.AudioContext || window.webkitAudioContext)();
    let t = sirenCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = sirenCtx.createOscillator();
      const gain = sirenCtx.createGain();
      osc.connect(gain); gain.connect(sirenCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t + i * 0.6);
      osc.frequency.linearRampToValueAtTime(440, t + i * 0.6 + 0.3);
      osc.frequency.linearRampToValueAtTime(880, t + i * 0.6 + 0.6);
      gain.gain.setValueAtTime(0.3, t + i * 0.6);
      gain.gain.linearRampToValueAtTime(0, t + i * 0.6 + 0.55);
      osc.start(t + i * 0.6);
      osc.stop(t + i * 0.6 + 0.6);
      sirenOscillators.push(osc);
    }
  } catch(e) {}
}

function stopSirenAndClose() {
  try { if (sirenCtx) { sirenCtx.close(); sirenCtx = null; } } catch(e) {}
  sirenOscillators = [];
  closeModal();
}

// ── FAKE CALL ──
function triggerFakeCall() {
  closeModal();
  const callerName = 'Mom 💜';
  const overlay = document.createElement('div');
  overlay.id = 'fake-call-overlay';
  overlay.innerHTML = `
    <div style="position:fixed;inset:0;background:linear-gradient(180deg,#1a0a2e,#2d1b4e);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:60px 40px 80px;color:#fff;font-family:'Nunito',sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:14px;opacity:0.7;margin-bottom:8px;letter-spacing:1px;">INCOMING CALL</div>
        <div style="font-size:48px;margin-bottom:12px;">👩</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:6px;">${callerName}</div>
        <div style="font-size:14px;opacity:0.6;">Mobile · HerDay AI</div>
      </div>
      <div style="display:flex;gap:60px;align-items:center;">
        <div style="text-align:center;">
          <button onclick="endFakeCall()" style="width:64px;height:64px;border-radius:50%;background:#ef4444;border:none;font-size:26px;cursor:pointer;color:#fff;box-shadow:0 4px 20px rgba(239,68,68,0.5);">📵</button>
          <div style="font-size:12px;margin-top:8px;opacity:0.7;">Decline</div>
        </div>
        <div style="text-align:center;">
          <button onclick="endFakeCall()" style="width:64px;height:64px;border-radius:50%;background:#22c55e;border:none;font-size:26px;cursor:pointer;color:#fff;box-shadow:0 4px 20px rgba(34,197,94,0.5);">📞</button>
          <div style="font-size:12px;margin-top:8px;opacity:0.7;">Accept</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Vibrate if supported
  if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
}

function endFakeCall() {
  document.getElementById('fake-call-overlay')?.remove();
}

// ── SHARE LOCATION ONLY ──
function shareLocationOnly() {
  const contacts = state.safetyContacts;
  if (!contacts.length) {
    showToast('⚠️ Add emergency contacts first', 'warning');
    return;
  }
  if (!navigator.geolocation) {
    showToast('⚠️ Geolocation not supported on this device', 'warning');
    return;
  }
  showToast('📍 Getting your location…');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const msg = encodeURIComponent(`📍 ${state.user?.name || 'I'} is sharing their live location with you.\n\nView here: ${mapsUrl}\n\nSent via HerDay AI`);
    openModal(`
      <div style="text-align:center;padding:8px;">
        <div style="font-size:40px;margin-bottom:10px;">📍</div>
        <h3 style="margin-bottom:6px;">Location Captured</h3>
        <a href="${mapsUrl}" target="_blank" style="display:block;background:var(--primary-light);border-radius:var(--radius-sm);padding:10px;color:var(--primary-dark);font-weight:700;font-size:13px;text-decoration:none;margin-bottom:16px;">
          🗺️ ${lat.toFixed(5)}, ${lng.toFixed(5)} — View on Maps
        </a>
        <p style="font-size:13px;color:var(--text2);margin-bottom:14px;">Send your location to:</p>
        ${contacts.map(c => {
          const phone = c.phone.replace(/\s+/g,'').replace(/[^\d+]/g,'');
          return `
            <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;text-align:left;">
              <div style="font-weight:700;color:var(--text);margin-bottom:8px;">${c.name} · ${c.phone}</div>
              <div style="display:flex;gap:8px;">
                <a href="sms:${phone}?body=${msg}" class="btn-sm" style="flex:1;text-align:center;text-decoration:none;">📱 SMS</a>
                <a href="https://wa.me/${phone.replace('+','')}?text=${msg}" target="_blank" class="btn-sm" style="flex:1;text-align:center;text-decoration:none;background:#dcfce7;color:#16a34a;">💬 WhatsApp</a>
              </div>
            </div>
          `;
        }).join('')}
        <button class="btn-ghost full" style="margin-top:8px;" onclick="closeModal()">Done</button>
      </div>
    `);
  }, () => {
    showToast('⚠️ Could not get location. Please allow location access.', 'warning');
  }, { timeout: 8000 });
}

function openContactModal() {
  openModal(`
    <h3>Add Emergency Contact</h3>
    <form onsubmit="saveContact(event)">
      <div class="form-group"><label>Name</label><input type="text" id="c-name" placeholder="Contact name" required /></div>
      <div class="form-group"><label>Phone Number</label><input type="tel" id="c-phone" placeholder="+1 234 567 8900" required /></div>
      <div class="form-group"><label>Relationship</label><input type="text" id="c-relation" placeholder="e.g. Mom, Friend, Partner" /></div>
      <button type="submit" class="btn-primary full">Add Contact</button>
    </form>
  `);
}

function saveContact(e) {
  e.preventDefault();
  state.safetyContacts.push({
    id: Date.now(),
    name: document.getElementById('c-name').value.trim(),
    phone: document.getElementById('c-phone').value.trim(),
    relation: document.getElementById('c-relation').value.trim()
  });
  saveState(); closeModal(); renderSafety();
  showToast('Contact added 💜');
}

function deleteContact(id) {
  state.safetyContacts = state.safetyContacts.filter(c => c.id !== id);
  saveState(); renderSafety();
  showToast('Contact removed');
}

// ===== AI CHAT =====
const chatResponses = {
  'plan my day': () => {
    const plan = generateAIPlan().slice(0,5);
    return `Here's your personalized plan for today! 🌸\n\n${plan.map(p => `**${p.time}** – ${p.title}`).join('\n')}\n\nWant me to adjust anything?`;
  },
  'what should i do first': () => {
    const top = state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b)-priorityScore(a))[0];
    return top ? `Your top priority right now is: **"${top.title}"** 📋\n\nIt's marked as ${top.priority} priority${top.deadline ? ` and due on ${top.deadline}` : ''}. You've got this! 💪` : `You have no pending tasks! 🎉 Time to add new goals or take a well-deserved break.`;
  },
  'pending tasks': () => {
    const pending = state.tasks.filter(t=>!t.completed);
    return pending.length ? `You have **${pending.length} pending tasks**:\n\n${pending.slice(0,5).map(t=>`• ${t.title} (${t.priority})`).join('\n')}${pending.length>5?`\n...and ${pending.length-5} more`:''}` : `All tasks are done! 🎉 You're crushing it today!`;
  },
  'work and self-care': () => `Balancing work and self-care is so important! 🌿\n\nHere's my suggestion:\n• Block 30 min in the morning for yourself before work\n• Take a proper lunch break – no screens!\n• Schedule one self-care activity daily (even 10 min counts)\n• Set a hard stop time for work\n• Your wellbeing is not a luxury, it's a necessity 💜`,
  'habits': () => {
    const done = state.habits.filter(h=>h.todayDone).length;
    return `Today's habit progress: **${done}/${state.habits.length}** completed 🔥\n\n${state.habits.map(h=>`${h.todayDone?'✅':'⬜'} ${h.icon} ${h.name} (${h.streak} day streak)`).join('\n')}`;
  },
  'wellness': () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = state.wellness.find(w=>w.date===today);
    return entry ? `Today's wellness snapshot 🌿\n\nMood: ${entry.mood||'Not logged'}\nSleep: ${entry.sleep||'—'}h\nWater: ${entry.water||0}/8 glasses\nStress: ${entry.stress||'—'}/10\n\n${entry.stress>7?'Your stress seems high today. Try a 5-minute breathing exercise 🧘':'You\'re doing great! Keep it up 💜'}` : `You haven't logged your wellness today yet. Head to the Wellness tab to check in! 🌿`;
  },
  'goals': () => {
    return state.goals.length ? `Your goals progress 🎯\n\n${state.goals.map(g=>`• ${g.title}: ${g.progress}% complete`).join('\n')}\n\nKeep going – every step counts! 💪` : `No goals set yet. Head to the Goals tab to set your first goal! 🎯`;
  },
  'motivate': () => {
    const quotes = [
      'You are capable of amazing things. One step at a time. 💜',
      'Progress, not perfection. You\'re doing better than you think! 🌸',
      'Every expert was once a beginner. Keep going! ✨',
      'Your only competition is who you were yesterday. 🌟',
      'Small consistent actions create massive results. Trust the process! 🔥'
    ];
    return quotes[Math.floor(Math.random()*quotes.length)];
  },
  'hello': () => `Hello! I'm Hera, your AI assistant 🌸 I'm here to help you plan your day, track your progress, and support your wellbeing. What can I help you with today?`,
  'hi': () => `Hi there! 💜 How can I help you today? You can ask me to plan your day, check your tasks, or give you a wellness update!`,
  'help': () => `Here's what I can help with:\n\n• "Plan my day" – get a smart daily schedule\n• "What should I do first?" – top priority task\n• "Pending tasks" – see what's left\n• "Work and self-care" – balance tips\n• "Habits" – today's habit progress\n• "Wellness" – your wellness snapshot\n• "Goals" – goals progress\n• "Motivate me" – get inspired 💜`,
};

function initChat() {
  const messagesEl = document.getElementById('chat-messages');
  if (messagesEl.children.length === 0) {
    addChatMessage('hera', `Hi ${state.user?.name||'there'}! I'm Hera, your AI assistant 🌸 I'm here to help you plan your day, stay on track, and support your wellbeing. What can I help you with today?`);
  }
  renderChatSuggestions();
}

function renderChatSuggestions() {
  const suggestions = ['Plan my day', 'What should I do first?', 'Pending tasks', 'Motivate me', 'Wellness check'];
  document.getElementById('chat-suggestions').innerHTML = suggestions.map(s =>
    `<button class="chat-suggestion" onclick="sendChatMessage('${s}')">${s}</button>`
  ).join('');
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  sendChatMessage(msg);
}

function sendChatMessage(msg) {
  addChatMessage('user', msg);
  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  const messagesEl = document.getElementById('chat-messages');
  messagesEl.innerHTML += `<div id="${typingId}" class="chat-msg"><div class="chat-msg-avatar">✦</div><div class="chat-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  setTimeout(() => {
    document.getElementById(typingId)?.remove();
    const response = getAIResponse(msg.toLowerCase());
    addChatMessage('hera', response);
  }, 800 + Math.random() * 600);
}

function getAIResponse(msg) {
  for (const [key, fn] of Object.entries(chatResponses)) {
    if (msg.includes(key)) return fn();
  }
  // Fallback
  if (msg.includes('stress') || msg.includes('anxious') || msg.includes('overwhelm')) {
    return `I hear you 💜 Feeling overwhelmed is completely normal. Try this: take 3 deep breaths, write down your top 3 priorities, and tackle just one thing at a time. You don't have to do everything at once. I'm here for you! 🌸`;
  }
  if (msg.includes('tired') || msg.includes('sleep')) {
    return `Rest is productive too! 😴 Make sure you're getting 7-9 hours of sleep. Try to wind down 30 minutes before bed – no screens, maybe some light reading or journaling. Your body and mind will thank you! 💜`;
  }
  if (msg.includes('thank')) {
    return `You're so welcome! 🌸 That's what I'm here for. Keep being amazing! 💜`;
  }
  return `That's a great question! 💜 I'm still learning, but I can help you with planning your day, checking tasks, tracking habits, wellness updates, and motivation. Try asking "help" to see what I can do! 🌸`;
}

function addChatMessage(sender, text) {
  const messagesEl = document.getElementById('chat-messages');
  const isUser = sender === 'user';
  // Convert **bold** to <strong>
  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  messagesEl.innerHTML += `
    <div class="chat-msg ${isUser?'user':''}">
      ${!isUser ? '<div class="chat-msg-avatar">✦</div>' : ''}
      <div class="chat-bubble">${formatted}</div>
      ${isUser ? '<div class="chat-msg-avatar" style="background:linear-gradient(135deg,var(--accent),var(--primary));">'+((state.user?.name||'U').charAt(0))+'</div>' : ''}
    </div>
  `;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ===== ANALYTICS =====
function renderAnalytics() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.completed).length;
  const pending = total - done;
  const pct = total ? Math.round((done/total)*100) : 0;
  const habitsDoneToday = state.habits.filter(h => h.todayDone).length;
  const avgStreak = state.habits.length ? Math.round(state.habits.reduce((s,h)=>s+h.streak,0)/state.habits.length) : 0;
  const avgGoalProgress = state.goals.length ? Math.round(state.goals.reduce((s,g)=>s+g.progress,0)/state.goals.length) : 0;
  const last7 = getLast7Days();
  const weeklyWellness = last7.map(d => state.wellness.find(w=>w.date===d));
  const avgSleep = weeklyWellness.filter(w=>w?.sleep).reduce((s,w,_,a)=>s+(w.sleep/a.filter(x=>x?.sleep).length||0),0);

  document.getElementById('analytics-content').innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${done}</div>
        <div class="stat-label">Tasks Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">Tasks Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">${pct}%</div>
        <div class="stat-label">Productivity Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">${avgStreak}</div>
        <div class="stat-label">Avg Habit Streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${avgGoalProgress}%</div>
        <div class="stat-label">Goals Progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">😴</div>
        <div class="stat-value">${avgSleep ? avgSleep.toFixed(1) : '—'}</div>
        <div class="stat-label">Avg Sleep (hrs)</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="analytics-charts">
      <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);">
        <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:16px;">Task Completion</h4>
        <div style="display:flex;justify-content:center;">
          <div class="donut-chart">
            <svg class="donut-svg" width="100" height="100" viewBox="0 0 100 100">
              <circle class="donut-bg" cx="50" cy="50" r="40"/>
              <circle class="donut-fill" cx="50" cy="50" r="40"
                stroke-dasharray="${pct * 2.51} ${(100-pct)*2.51}"
                stroke-dashoffset="0"/>
            </svg>
            <div class="donut-label">${pct}%</div>
          </div>
        </div>
        <p style="text-align:center;font-size:13px;color:var(--text2);margin-top:8px;">${done} done · ${pending} pending</p>
      </div>

      <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);">
        <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:16px;">Habits Today</h4>
        <div style="display:flex;justify-content:center;">
          <div class="donut-chart">
            <svg class="donut-svg" width="100" height="100" viewBox="0 0 100 100">
              <circle class="donut-bg" cx="50" cy="50" r="40"/>
              <circle class="donut-fill" cx="50" cy="50" r="40"
                stroke="${'#f9a8d4'}"
                stroke-dasharray="${state.habits.length ? (habitsDoneToday/state.habits.length)*251 : 0} ${state.habits.length ? (1-habitsDoneToday/state.habits.length)*251 : 251}"
                stroke-dashoffset="0"/>
            </svg>
            <div class="donut-label">${habitsDoneToday}</div>
          </div>
        </div>
        <p style="text-align:center;font-size:13px;color:var(--text2);margin-top:8px;">${habitsDoneToday} of ${state.habits.length} habits done</p>
      </div>
    </div>

    <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);margin-bottom:16px;">
      <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:16px;">Weekly Activity (Tasks by Category)</h4>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${['work','study','home','family','self-care','health','personal'].map(cat => {
          const count = state.tasks.filter(t=>t.category===cat).length;
          return count ? `<div style="background:var(--primary-light);border-radius:20px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--primary-dark);">${cat}: ${count}</div>` : '';
        }).join('')}
      </div>
    </div>

    <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);">
      <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:16px;">Goals Overview</h4>
      ${state.goals.map(g => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:700;color:var(--text);">${g.title}</span>
            <span style="font-size:13px;color:var(--text2);">${g.progress}%</span>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${g.progress}%"></div></div>
        </div>
      `).join('') || '<p style="color:var(--text3);font-size:14px;">No goals set yet.</p>'}
    </div>
  `;
}

// ===== SETTINGS =====
function renderSettings() {
  const user = state.user || {};
  document.getElementById('settings-content').innerHTML = `
    <div class="settings-section">
      <h4>Profile</h4>
      <div class="form-group"><label>Name</label><input type="text" id="s-name" value="${user.name||''}" /></div>
      <div class="form-group"><label>Email</label><input type="email" id="s-email" value="${user.email||''}" /></div>
      <div class="form-group"><label>Role</label><input type="text" id="s-role" value="${state.onboardingData?.type||''}" /></div>
      <button class="btn-primary" onclick="saveProfile()">Save Profile</button>
    </div>

    <div class="settings-section">
      <h4>Theme</h4>
      <div class="theme-swatches">
        <div class="theme-swatch ${state.theme==='default'?'active':''}" style="background:linear-gradient(135deg,#c084fc,#f9a8d4);" onclick="applyTheme('default');saveState();renderSettings();" title="Purple (Default)"></div>
        <div class="theme-swatch ${state.theme==='rose'?'active':''}" style="background:linear-gradient(135deg,#fb7185,#fda4af);" onclick="applyTheme('rose');saveState();renderSettings();" title="Rose"></div>
        <div class="theme-swatch ${state.theme==='sage'?'active':''}" style="background:linear-gradient(135deg,#4ade80,#86efac);" onclick="applyTheme('sage');saveState();renderSettings();" title="Sage"></div>
        <div class="theme-swatch ${state.theme==='sky'?'active':''}" style="background:linear-gradient(135deg,#38bdf8,#7dd3fc);" onclick="applyTheme('sky');saveState();renderSettings();" title="Sky"></div>
        <div class="theme-swatch ${state.theme==='dark'?'active':''}" style="background:linear-gradient(135deg,#2d1b4e,#4c2a7a);" onclick="applyTheme('dark');saveState();renderSettings();" title="Dark"></div>
      </div>
    </div>

    <div class="settings-section">
      <h4>Reminders</h4>
      ${Object.entries(state.reminders).map(([key, val]) => `
        <div class="setting-row">
          <div><div class="setting-label">${key.charAt(0).toUpperCase()+key.slice(1)} Reminder</div></div>
          <button class="toggle ${val?'on':''}" onclick="toggleReminder('${key}')"></button>
        </div>
      `).join('')}
    </div>

    <div class="settings-section">
      <h4>Schedule</h4>
      <div class="form-row">
        <div class="form-group"><label>Wake-up Time</label><input type="time" id="s-wake" value="${state.onboardingData?.wake||'07:00'}" /></div>
        <div class="form-group"><label>Sleep Time</label><input type="time" id="s-sleep" value="${state.onboardingData?.sleep||'23:00'}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Work Start</label><input type="time" id="s-wstart" value="${state.onboardingData?.workStart||'09:00'}" /></div>
        <div class="form-group"><label>Work End</label><input type="time" id="s-wend" value="${state.onboardingData?.workEnd||'17:00'}" /></div>
      </div>
      <button class="btn-primary" onclick="saveSchedule()">Save Schedule</button>
    </div>

    <div class="settings-section">
      <h4>Privacy & Data</h4>
      <div class="setting-row">
        <div><div class="setting-label">All data is stored locally</div><div class="setting-desc">Your data never leaves your device</div></div>
        <span style="font-size:20px;">🔒</span>
      </div>
      <button class="btn-danger" style="margin-top:12px;width:100%;padding:12px;" onclick="clearAllData()">Clear All App Data</button>
    </div>
  `;
}

function saveProfile() {
  state.user.name = document.getElementById('s-name').value.trim() || state.user.name;
  state.user.email = document.getElementById('s-email').value.trim() || state.user.email;
  state.onboardingData.type = document.getElementById('s-role').value.trim();
  saveState(); updateNavUser();
  showToast('Profile saved ✓');
}

function saveSchedule() {
  state.onboardingData.wake = document.getElementById('s-wake').value;
  state.onboardingData.sleep = document.getElementById('s-sleep').value;
  state.onboardingData.workStart = document.getElementById('s-wstart').value;
  state.onboardingData.workEnd = document.getElementById('s-wend').value;
  saveState();
  showToast('Schedule saved ✓');
}

function toggleReminder(key) {
  state.reminders[key] = !state.reminders[key];
  saveState(); renderSettings();
}

function clearAllData() {
  if (!confirm('Are you sure? This will delete all your data and cannot be undone.')) return;
  localStorage.removeItem('herday_state');
  location.reload();
}

// ===== REMINDER ENGINE =====
function startReminderEngine() {
  // Check reminders every minute
  setInterval(checkReminders, 60000);
}

function checkReminders() {
  if (!state.user) return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const d = state.onboardingData;

  // Water reminder every 2 hours during waking hours
  if (state.reminders.water && now.getMinutes() === 0 && now.getHours() % 2 === 0) {
    showToast('💧 Time to drink some water! Stay hydrated 🌊');
  }
  // Sleep reminder
  if (state.reminders.sleep && d.sleep && timeStr === addMinutes(d.sleep, -30)) {
    showToast('🌙 Bedtime in 30 minutes. Start winding down!');
  }
  // Exercise reminder
  if (state.reminders.exercise && timeStr === '18:00') {
    showToast('🏃 Time for your evening exercise! Move that body 💪');
  }
  // Meditation reminder
  if (state.reminders.meditation && d.wake && timeStr === addMinutes(d.wake, 15)) {
    showToast('🧘 Good morning! Time for your meditation session 🌸');
  }
}

// ===== GENERATE PLAN BUTTON =====
function generatePlan() {
  renderPlanner();
  showToast('✨ Your AI plan has been generated!');
}

/* ============================================================
   FLOATING ASSISTANT WIDGET – Hera (always-on)
   Full knowledge base about every feature in HerDay AI
   ============================================================ */

let fabOpen = false;
let fabInitialized = false;

function toggleFAB() {
  fabOpen = !fabOpen;
  const panel = document.getElementById('fab-panel');
  const btn   = document.getElementById('fab-btn');
  const badge = document.getElementById('fab-badge');

  panel.classList.toggle('hidden', !fabOpen);
  btn.classList.toggle('open', fabOpen);
  badge.classList.add('hidden');

  if (fabOpen && !fabInitialized) {
    fabInitialized = true;
    fabWelcome();
    renderFABQuickBtns();
  }
  if (fabOpen) {
    setTimeout(() => document.getElementById('fab-input')?.focus(), 200);
  }
}

function fabWelcome() {
  const name = state.user?.name ? `, ${state.user.name}` : '';
  fabAddMsg('bot', `Hi${name}! 🌸 I'm Hera, your HerDay AI assistant. I know everything about this app — ask me how any feature works, what you can do here, or anything about your data!`);
}

function renderFABQuickBtns() {
  const qs = [
    'What can I do here?',
    'How do tasks work?',
    'Explain AI Planner',
    'How to track habits?',
    'What is Safety Center?',
    'How does wellness work?',
    'Show my stats',
    'How to set goals?',
  ];
  document.getElementById('fab-quick-btns').innerHTML =
    qs.map(q => `<button class="fab-quick" onclick="sendFABMsg('${q}')">${q}</button>`).join('');
}

function sendFAB() {
  const input = document.getElementById('fab-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  sendFABMsg(msg);
}

function sendFABMsg(msg) {
  fabAddMsg('user', msg);
  // Show typing
  const tid = 'fab-typing-' + Date.now();
  const el = document.getElementById('fab-messages');
  el.innerHTML += `<div id="${tid}" class="fab-msg"><div class="fab-msg-av">✦</div><div class="fab-bubble"><div class="fab-typing"><div class="fab-dot"></div><div class="fab-dot"></div><div class="fab-dot"></div></div></div></div>`;
  el.scrollTop = el.scrollHeight;

  const delay = 500 + Math.random() * 500;
  setTimeout(() => {
    document.getElementById(tid)?.remove();
    const reply = getFABResponse(msg.toLowerCase().trim());
    fabAddMsg('bot', reply);
  }, delay);
}

function fabAddMsg(sender, text) {
  const el = document.getElementById('fab-messages');
  if (!el) return;
  const isUser = sender === 'user';
  const initials = isUser ? (state.user?.name?.charAt(0) || 'U') : '✦';
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  el.innerHTML += `
    <div class="fab-msg ${isUser ? 'fab-user' : ''}">
      <div class="fab-msg-av">${initials}</div>
      <div class="fab-bubble">${formatted}</div>
    </div>`;
  el.scrollTop = el.scrollHeight;

  // Show badge if panel is closed
  if (!fabOpen && !isUser) {
    const badge = document.getElementById('fab-badge');
    if (badge) badge.classList.remove('hidden');
  }
}

/* ── KNOWLEDGE BASE ── */
function getFABResponse(q) {

  // ── APP OVERVIEW ──
  if (match(q, ['what can i do', 'what is herday', 'about this app', 'features', 'overview', 'what does this app do'])) {
    return `**HerDay AI** is your all-in-one daily productivity companion built for women 🌸\n\nHere's everything you can do:\n\n📋 **Tasks** – Add, edit, prioritize & track tasks\n🤖 **AI Planner** – Auto-generate a smart daily schedule\n📅 **Calendar** – View tasks by date\n🌿 **Wellness** – Log mood, sleep, water & cycle\n🔥 **Habits** – Build streaks for daily habits\n🎯 **Goals** – Set & track personal/professional goals\n🛡️ **Safety** – SOS button & emergency contacts\n💬 **AI Chat** – Ask Hera anything\n📊 **Analytics** – See your productivity insights\n⚙️ **Settings** – Themes, reminders, profile\n\nWhat would you like to explore?`;
  }

  // ── NAVIGATION ──
  if (match(q, ['how to navigate', 'how to switch', 'menu', 'sidebar', 'tabs', 'how to go to'])) {
    return `**Navigation is easy!** 🗺️\n\n• On **desktop** – use the left sidebar to switch between sections\n• On **mobile** – tap the ☰ menu button in the top-left to open the sidebar\n• The **topbar** always shows your current section\n• The **SOS button** is always visible in the top-right for quick access\n\nJust tap any section name in the sidebar to jump there instantly!`;
  }

  // ── TASKS ──
  if (match(q, ['task', 'tasks', 'add task', 'how to add', 'edit task', 'delete task', 'complete task', 'priority', 'deadline', 'category'])) {
    return `**Task Manager** 📋\n\nHere's how tasks work:\n\n➕ **Add** – Click "+ New Task" or use the Quick Add on the Dashboard\n✏️ **Edit** – Click the ✏️ icon on any task\n🗑️ **Delete** – Click the 🗑️ icon\n✅ **Complete** – Click the circle on the left of a task\n\n**Each task has:**\n• Priority: High / Medium / Low\n• Category: Work, Study, Home, Family, Self-Care, Health, Personal\n• Deadline date\n• Estimated duration (minutes)\n\n**Filters** – Search by name, filter by priority, category, or status (pending/completed)\n\nTasks are auto-sorted by priority + deadline urgency!`;
  }

  // ── AI PLANNER ──
  if (match(q, ['ai planner', 'daily plan', 'generate plan', 'smart plan', 'schedule', 'time slot', 'plan my day', 'why this plan', 'how does planner work'])) {
    return `**AI Daily Planner** 🤖✨\n\nThe planner creates a personalized time-blocked schedule for your day:\n\n**How it works:**\n1. It reads your wake-up, work start/end & sleep times from Settings\n2. Sorts your pending tasks by priority + deadline urgency\n3. Assigns time slots during your work hours\n4. Adds 15-min breaks every 2 tasks\n5. Protects time for meals, exercise & wind-down\n\n**Click "✨ Generate Plan"** to refresh it anytime.\n\nThe **"Why this plan?"** section explains the reasoning behind the schedule.\n\nYou can update your schedule in ⚙️ Settings → Schedule.`;
  }

  // ── CALENDAR ──
  if (match(q, ['calendar', 'schedule view', 'month', 'date', 'events', 'how to use calendar'])) {
    return `**Calendar** 📅\n\nThe calendar shows all your tasks by their deadline date:\n\n• **Navigate months** using the ‹ › arrows\n• **Today** is highlighted in purple\n• **Dots** under a date mean tasks are due that day\n• **Click any date** to see the tasks due on that day\n\nTasks are added to the calendar automatically when you set a deadline in the Task Manager.`;
  }

  // ── WELLNESS ──
  if (match(q, ['wellness', 'mood', 'sleep', 'water', 'stress', 'self-care', 'log wellness', 'how to track wellness', 'cycle', 'period', 'menstrual'])) {
    return `**Wellness Tracker** 🌿\n\nTrack your daily wellbeing in one place:\n\n😊 **Mood** – Log how you're feeling (7 emoji options)\n😴 **Sleep** – Hours slept last night\n💧 **Water** – Glasses of water today (goal: 8)\n🧘 **Stress** – Level from 1–10\n✨ **Self-Care** – Did you do something for yourself today?\n\n**Click "+ Log Today"** to open the wellness form.\n\n📊 **Charts** show your 7-day sleep trend and mood history.\n\n🌸 **Cycle Tracker** – Enter your last period start date and cycle length to get predictions for your next period and ovulation window.\n\nYou can also do a quick mood check-in from the **Dashboard**!`;
  }

  // ── HABITS ──
  if (match(q, ['habit', 'habits', 'streak', 'how to add habit', 'habit tracker', 'daily habit', 'completion rate'])) {
    return `**Habit Tracker** 🔥\n\nBuild powerful daily habits with streak tracking:\n\n➕ **Add a habit** – Click "+ New Habit", give it a name and pick an emoji icon\n✅ **Check off** – Tap the circle button on the right to mark today as done\n🔥 **Streak** – Counts consecutive days you've completed the habit\n📊 **7-day dots** – Visual history of the last 7 days (purple = done)\n\n**Pre-loaded habits include:** Meditation, Exercise, Reading, Journaling, Skincare, Saving Money\n\nYour streak resets if you miss a day, so try to check in daily! The Dashboard shows your top habit streaks at a glance.`;
  }

  // ── GOALS ──
  if (match(q, ['goal', 'goals', 'how to set goal', 'progress', 'milestone', 'track goal', 'goal tracker'])) {
    return `**Goals Tracker** 🎯\n\nSet and track your personal & professional goals:\n\n➕ **Add a goal** – Click "+ New Goal"\n• Give it a title, description, category & deadline\n• Add your first milestone to get started\n\n📊 **Progress bar** – Shows % completion (0–100%)\n🏆 **Milestones** – Small wins that build toward the big goal\n\n**Update progress** – Click "Update Progress" on any goal, drag the slider, and optionally add a new milestone.\n\nWhen you hit 100%, you'll get a celebration message! 🎉\n\nGoal categories: Career, Health, Finance, Personal, Education, Relationships`;
  }

  // ── SAFETY ──
  if (match(q, ['safety', 'sos', 'emergency', 'contact', 'helpline', 'safety center', 'alert', 'danger', 'help number'])) {
    return `**Safety Center** 🛡️\n\nYour personal safety hub:\n\n🆘 **SOS Button** – The big red button sends an alert to all your emergency contacts. Also accessible from the top-right of every screen.\n\n👥 **Emergency Contacts** – Add trusted people (name, phone, relationship). Click "+ Add Contact" to add more.\n\n📞 **Helplines** – Quick access to:\n• Emergency: 911\n• Women's Helpline: 1-800-799-7233\n• Crisis Text Line: Text HOME to 741741\n• RAINN: 1-800-656-4673\n\n🛡️ **Safety Tips** – Practical advice for staying safe.\n\nAll data stays on your device — nothing is shared without your action.`;
  }

  // ── AI CHAT (main tab) ──
  if (match(q, ['ai chat', 'hera', 'chat tab', 'chat assistant', 'how to use chat', 'what can hera do'])) {
    return `**AI Chat (Hera)** 💬\n\nThe Chat tab has a full conversation with Hera, your AI assistant.\n\nHera can help you with:\n• **"Plan my day"** – Get today's smart schedule\n• **"What should I do first?"** – Top priority task\n• **"Pending tasks"** – See what's left\n• **"Work and self-care"** – Balance tips\n• **"Habits"** – Today's habit progress\n• **"Wellness"** – Your wellness snapshot\n• **"Goals"** – Goals progress overview\n• **"Motivate me"** – Get an inspiring quote\n\nYou can also type freely — Hera understands stress, tiredness, and general questions too! 💜`;
  }

  // ── ANALYTICS ──
  if (match(q, ['analytics', 'insights', 'stats', 'statistics', 'productivity score', 'report', 'overview', 'show my stats', 'my progress'])) {
    const total = state.tasks.length;
    const done  = state.tasks.filter(t => t.completed).length;
    const pct   = total ? Math.round((done/total)*100) : 0;
    const avgStreak = state.habits.length ? Math.round(state.habits.reduce((s,h)=>s+h.streak,0)/state.habits.length) : 0;
    const avgGoal   = state.goals.length  ? Math.round(state.goals.reduce((s,g)=>s+g.progress,0)/state.goals.length) : 0;
    return `**Your Analytics Snapshot** 📊\n\n✅ Tasks completed: **${done}/${total}** (${pct}% productivity score)\n🔥 Avg habit streak: **${avgStreak} days**\n🎯 Avg goal progress: **${avgGoal}%**\n💜 Habits today: **${state.habits.filter(h=>h.todayDone).length}/${state.habits.length}** done\n\nHead to the **Analytics tab** for full charts, donut graphs, and a weekly activity breakdown!`;
  }

  // ── SETTINGS ──
  if (match(q, ['settings', 'theme', 'dark mode', 'change color', 'profile', 'reminder', 'notification', 'clear data', 'privacy', 'schedule setting'])) {
    return `**Settings** ⚙️\n\nCustomize HerDay AI to fit you:\n\n👤 **Profile** – Update your name, email, and role\n🎨 **Theme** – Choose from 5 color themes:\n  • 💜 Purple (default)\n  • 🌹 Rose\n  • 🌿 Sage (green)\n  • 🩵 Sky (blue)\n  • 🌑 Dark mode\n\n⏰ **Reminders** – Toggle on/off: water, meals, medicine, exercise, meditation, sleep, safety check-in\n\n🕐 **Schedule** – Update your wake-up, sleep, work start/end times (used by the AI Planner)\n\n🔒 **Privacy** – All data is stored locally on your device. You can clear all app data here.\n\nChanges save instantly!`;
  }

  // ── REMINDERS ──
  if (match(q, ['reminder', 'notification', 'alert', 'water reminder', 'sleep reminder', 'how reminders work'])) {
    return `**Reminders** ⏰\n\nHerDay AI has a built-in reminder engine that fires **toast notifications** inside the app:\n\n💧 **Water** – Every 2 hours during the day\n🌙 **Sleep** – 30 minutes before your set bedtime\n🏃 **Exercise** – At 6:00 PM daily\n🧘 **Meditation** – 15 minutes after your wake-up time\n\nYou can **toggle each reminder on/off** in ⚙️ Settings → Reminders.\n\nNote: Reminders only fire while the app is open in your browser.`;
  }

  // ── ONBOARDING ──
  if (match(q, ['onboarding', 'setup', 'first time', 'profile setup', 'how to start'])) {
    return `**Onboarding** 🌸\n\nWhen you first sign up, HerDay AI walks you through a 4-step setup:\n\n1️⃣ **About you** – Name and role (student, working woman, homemaker, freelancer, entrepreneur)\n2️⃣ **Daily schedule** – Wake-up, sleep, work start/end times\n3️⃣ **Health preferences** – What you want to track (meditation, exercise, water, cycle, etc.)\n4️⃣ **Goals** – What you want to achieve\n\nThis data personalizes your AI Planner, reminders, and dashboard. You can update it anytime in ⚙️ Settings.`;
  }

  // ── DASHBOARD ──
  if (match(q, ['dashboard', 'home', 'main screen', 'what is on dashboard', 'quick add'])) {
    return `**Dashboard** 🏠\n\nYour daily command center! Here's what you'll find:\n\n👋 **Welcome banner** – Greeting with today's date\n📋 **Today's Focus** – Top 3 pending tasks by priority\n😊 **Wellness Check-in** – Quick mood tap (5 emoji options)\n🔥 **Habit Streaks** – Your top 4 habits at a glance\n🤖 **AI Daily Plan** – Preview of today's schedule\n📊 **Progress** – % of tasks completed today\n➕ **Quick Add** – Add a task instantly without opening the Task Manager\n\nThe dashboard refreshes every time you navigate to it.`;
  }

  // ── DATA / STORAGE ──
  if (match(q, ['data', 'storage', 'localstorage', 'where is my data', 'saved', 'offline', 'backend', 'server'])) {
    return `**Data & Storage** 🔒\n\nHerDay AI is **100% offline** — no backend, no server, no account cloud sync.\n\nAll your data is stored in your browser's **localStorage**:\n• Tasks, habits, goals, wellness logs\n• Safety contacts\n• Settings and preferences\n• Onboarding profile\n\n✅ Your data **never leaves your device**\n✅ Works without internet (after first load)\n⚠️ Clearing browser data or using a different browser will reset the app\n\nYou can manually clear all data in ⚙️ Settings → Clear All App Data.`;
  }

  // ── LOGIN / SIGNUP ──
  if (match(q, ['login', 'sign in', 'signup', 'sign up', 'account', 'password', 'register', 'forgot password'])) {
    return `**Account & Login** 🔐\n\n**Sign Up** – Enter your name, email, and a password (min 6 characters). This creates a local account stored in your browser.\n\n**Sign In** – Use the same email and password you signed up with.\n\n⚠️ Since there's no backend, passwords are stored locally. Don't use a sensitive password.\n\n**Forgot password?** – There's no password reset (no server). If locked out, you can clear localStorage in your browser's DevTools and start fresh.\n\nYour session persists until you click "Sign Out".`;
  }

  // ── CYCLE TRACKER ──
  if (match(q, ['cycle', 'period', 'menstrual', 'ovulation', 'cycle tracker', 'next period'])) {
    return `**Cycle Tracker** 🌸\n\nFound inside the **Wellness tab**:\n\n📅 Enter your **last period start date**\n🔢 Set your **cycle length** (default: 28 days, range: 21–35)\n\nHerDay AI will calculate:\n• 📅 **Next period date**\n• 🌸 **Estimated ovulation window**\n\nYou can also log **symptoms** alongside your daily wellness entry.\n\nAll cycle data is private and stored only on your device.`;
  }

  // ── PRODUCTIVITY SCORE ──
  if (match(q, ['productivity score', 'score', 'how is score calculated', 'productivity'])) {
    const total = state.tasks.length;
    const done  = state.tasks.filter(t => t.completed).length;
    const pct   = total ? Math.round((done/total)*100) : 0;
    return `**Productivity Score** ⚡\n\nYour current score is **${pct}%**\n\nIt's calculated as:\n> (Completed tasks ÷ Total tasks) × 100\n\nRight now: ${done} completed out of ${total} total tasks.\n\nTo improve your score:\n✅ Complete more tasks\n🎯 Focus on high-priority items first\n🤖 Use the AI Planner to stay on schedule\n\nYour full score breakdown is in the **Analytics tab**.`;
  }

  // ── HOW TO USE / HELP ──
  if (match(q, ['help', 'how to use', 'guide', 'tutorial', 'get started', 'instructions'])) {
    return `**Getting Started with HerDay AI** 🌸\n\nHere's a quick guide:\n\n1️⃣ **Sign up** and complete the 4-step onboarding\n2️⃣ **Add your tasks** in the Task Manager\n3️⃣ **Generate your AI Plan** for a smart daily schedule\n4️⃣ **Check off habits** daily to build streaks\n5️⃣ **Log wellness** each day (mood, sleep, water)\n6️⃣ **Set goals** and track your progress\n7️⃣ **Add emergency contacts** in the Safety Center\n8️⃣ **Customize** your theme and reminders in Settings\n\nAsk me about any specific feature and I'll explain it in detail! 💜`;
  }

  // ── GREETINGS ──
  if (match(q, ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'])) {
    const greet = ['Hi there! 🌸', 'Hello! 💜', 'Hey! 🌟', 'Hi! So glad you\'re here 🌸'][Math.floor(Math.random()*4)];
    return `${greet} I'm Hera, your HerDay AI assistant. I can answer any question about this app — features, how-tos, your data, anything!\n\nTry asking:\n• "What can I do here?"\n• "How do tasks work?"\n• "Show my stats"\n• "How does the AI Planner work?"`;
  }

  // ── THANKS ──
  if (match(q, ['thank', 'thanks', 'thank you', 'awesome', 'great', 'perfect', 'nice'])) {
    return `You're so welcome! 💜 That's what I'm here for. Is there anything else you'd like to know about HerDay AI? 🌸`;
  }

  // ── LIVE DATA QUERIES ──
  if (match(q, ['how many tasks', 'my tasks', 'task count'])) {
    const total = state.tasks.length;
    const done  = state.tasks.filter(t=>t.completed).length;
    return `You have **${total} tasks** total — **${done} completed** and **${total-done} pending**. Head to the Tasks tab to manage them! 📋`;
  }

  if (match(q, ['my habits', 'habit count', 'how many habits'])) {
    return `You have **${state.habits.length} habits** tracked. Today you've completed **${state.habits.filter(h=>h.todayDone).length}** of them. 🔥 Keep the streak alive!`;
  }

  if (match(q, ['my goals', 'goal count', 'how many goals'])) {
    const avg = state.goals.length ? Math.round(state.goals.reduce((s,g)=>s+g.progress,0)/state.goals.length) : 0;
    return `You have **${state.goals.length} goals** set with an average progress of **${avg}%**. 🎯 Check the Goals tab to update your milestones!`;
  }

  if (match(q, ['today', 'today\'s plan', 'what today', 'what should i do today'])) {
    const pending = state.tasks.filter(t=>!t.completed).sort((a,b)=>priorityScore(b)-priorityScore(a));
    if (!pending.length) return `You have no pending tasks today! 🎉 Time to relax or add new goals. You're crushing it! 💜`;
    const top = pending.slice(0,3);
    return `Here's your focus for today 🌸\n\n${top.map((t,i)=>`${i+1}. **${t.title}** (${t.priority} priority)`).join('\n')}${pending.length>3?`\n...and ${pending.length-3} more tasks`:''}.\n\nHead to the **AI Planner** for a full time-blocked schedule! 🤖`;
  }

  // ── FALLBACK ──
  return `Hmm, I'm not sure about that specific question, but I know everything about HerDay AI! 💜\n\nTry asking me:\n• "What can I do here?" – full feature overview\n• "How do tasks work?"\n• "Explain the AI Planner"\n• "How to track habits?"\n• "What is the Safety Center?"\n• "Show my stats"\n• "How does wellness tracking work?"\n\nOr just describe what you're trying to do and I'll point you in the right direction! 🌸`;
}

/** Simple multi-keyword matcher */
function match(query, keywords) {
  return keywords.some(k => query.includes(k));
}

// ===== JOURNAL =====
const journalPrompts = [
  "What are 3 things you're grateful for today?",
  "What's one win you had today, big or small?",
  "What's on your mind right now?",
  "What would make tomorrow even better?",
  "How did you take care of yourself today?",
  "What's one thing you learned today?",
  "What are you looking forward to this week?",
];

function renderJournal() {
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = state.journal.find(j => j.date === today) || { date: today, text: '', mood: '' };
  const past = [...state.journal].filter(j => j.date !== today).sort((a,b) => b.date.localeCompare(a.date));
  const prompt = journalPrompts[new Date().getDay() % journalPrompts.length];

  document.getElementById('journal-content').innerHTML = `
    <div style="background:var(--bg2);border-radius:var(--radius);padding:24px;border:1px solid var(--border);margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h4 style="font-size:15px;font-weight:700;color:var(--text);">Today – ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h4>
        <span style="font-size:12px;color:var(--text3);">${todayEntry.text.length} chars</span>
      </div>
      <p style="font-size:13px;color:var(--primary-dark);font-style:italic;margin-bottom:14px;">💭 ${prompt}</p>
      <textarea id="journal-text" rows="7" placeholder="Write freely… this is your safe space 🌸"
        style="width:100%;padding:14px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:'Nunito',sans-serif;font-size:14px;background:var(--bg);color:var(--text);resize:vertical;outline:none;line-height:1.7;transition:border-color 0.2s;"
        onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'"
      >${todayEntry.text}</textarea>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:13px;color:var(--text2);font-weight:600;">Mood:</span>
        <div class="chip-group" id="journal-mood-chips" style="margin:0;">
          ${['😊','😐','😔','😤','😴','🤩','😰'].map(m => `<div class="chip ${todayEntry.mood===m?'selected':''}" onclick="selectChip(this,'journal-mood-val')" style="padding:4px 10px;">${m}</div>`).join('')}
        </div>
        <input type="hidden" id="journal-mood-val" value="${todayEntry.mood||''}" />
      </div>
    </div>

    ${past.length ? `
      <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Past Entries</h4>
      ${past.slice(0,10).map(j => `
        <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:16px;margin-bottom:10px;border:1px solid var(--border);cursor:pointer;" onclick="expandJournalEntry(this)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:700;color:var(--text);">${new Date(j.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
            <span style="font-size:18px;">${j.mood||'📓'}</span>
          </div>
          <div class="journal-preview" style="font-size:13px;color:var(--text2);line-height:1.5;overflow:hidden;max-height:40px;transition:max-height 0.3s;">${j.text.replace(/\n/g,'<br>')}</div>
        </div>
      `).join('')}
    ` : ''}
  `;
}

function saveJournalEntry() {
  const text = document.getElementById('journal-text')?.value.trim();
  if (!text) return showToast('Write something first 📓', 'error');
  const today = new Date().toISOString().split('T')[0];
  const mood = document.getElementById('journal-mood-val')?.value || '';
  const idx = state.journal.findIndex(j => j.date === today);
  if (idx >= 0) state.journal[idx] = { date: today, text, mood };
  else state.journal.push({ date: today, text, mood });
  saveState();
  showToast('Journal saved 📓 Keep writing!');
  renderJournal();
}

function expandJournalEntry(el) {
  const preview = el.querySelector('.journal-preview');
  const isExpanded = preview.style.maxHeight === 'none';
  preview.style.maxHeight = isExpanded ? '40px' : 'none';
}

// ===== POMODORO TIMER =====
let pomState = { running: false, mode: 'focus', elapsed: 0, interval: null, taskId: null, sessions: 0 };
const pomDurations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

function renderPomodoro() {
  const pending = state.tasks.filter(t => !t.completed);
  document.getElementById('pomodoro-content').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:24px;">

      <div style="background:var(--bg2);border-radius:var(--radius);padding:32px 40px;border:1px solid var(--border);text-align:center;width:100%;max-width:420px;box-shadow:var(--shadow);">
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">
          <button class="pom-mode-btn ${pomState.mode==='focus'?'active':''}" onclick="setPomMode('focus')">🍅 Focus 25m</button>
          <button class="pom-mode-btn ${pomState.mode==='short'?'active':''}" onclick="setPomMode('short')">☕ Short 5m</button>
          <button class="pom-mode-btn ${pomState.mode==='long'?'active':''}" onclick="setPomMode('long')">🌿 Long 15m</button>
        </div>

        <div id="pom-ring" style="position:relative;width:180px;height:180px;margin:0 auto 20px;">
          <svg width="180" height="180" viewBox="0 0 180 180" style="transform:rotate(-90deg);">
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle id="pom-arc" cx="90" cy="90" r="80" fill="none" stroke="var(--primary)" stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="${2 * Math.PI * 80}"
              stroke-dashoffset="${getPomOffset()}"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div id="pom-time" style="font-size:42px;font-weight:800;color:var(--text);font-family:'Nunito',sans-serif;">${formatPomTime()}</div>
            <div id="pom-label" style="font-size:13px;color:var(--text2);font-weight:600;">${pomState.mode==='focus'?'Focus Time':pomState.mode==='short'?'Short Break':'Long Break'}</div>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;">
          <button class="btn-primary" onclick="togglePomodoro()" id="pom-start-btn" style="min-width:100px;">
            ${pomState.running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button class="btn-ghost" onclick="resetPomodoro()">↺ Reset</button>
        </div>

        <div style="font-size:13px;color:var(--text2);">🍅 Sessions today: <strong>${pomState.sessions}</strong></div>
      </div>

      <div style="background:var(--bg2);border-radius:var(--radius);padding:20px;border:1px solid var(--border);width:100%;max-width:420px;">
        <h4 style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Focus on a Task</h4>
        ${pending.length ? `
          <select id="pom-task-select" onchange="pomState.taskId=this.value?parseInt(this.value):null"
            style="width:100%;padding:10px 14px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:'Nunito',sans-serif;font-size:14px;background:var(--bg2);color:var(--text);outline:none;">
            <option value="">— No specific task —</option>
            ${pending.map(t => `<option value="${t.id}" ${pomState.taskId===t.id?'selected':''}>${t.title} (${t.priority})</option>`).join('')}
          </select>
        ` : '<p style="font-size:13px;color:var(--text3);">No pending tasks. Add some in the Tasks tab!</p>'}
      </div>

      <div style="background:var(--primary-light);border-radius:var(--radius);padding:16px 20px;border:1px solid var(--border);width:100%;max-width:420px;">
        <h4 style="font-size:13px;font-weight:700;color:var(--primary-dark);margin-bottom:8px;">🍅 How Pomodoro Works</h4>
        <p style="font-size:13px;color:var(--text2);line-height:1.6;">Work for <strong>25 minutes</strong>, then take a <strong>5-minute break</strong>. After 4 sessions, take a <strong>15-minute long break</strong>. This technique boosts focus and prevents burnout!</p>
      </div>
    </div>
  `;
}

function getPomOffset() {
  const total = pomDurations[pomState.mode];
  const remaining = total - pomState.elapsed;
  const circumference = 2 * Math.PI * 80;
  return circumference * (1 - remaining / total);
}

function formatPomTime() {
  const remaining = pomDurations[pomState.mode] - pomState.elapsed;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function setPomMode(mode) {
  if (pomState.running) { clearInterval(pomState.interval); pomState.running = false; }
  pomState.mode = mode;
  pomState.elapsed = 0;
  renderPomodoro();
}

function togglePomodoro() {
  if (pomState.running) {
    clearInterval(pomState.interval);
    pomState.running = false;
  } else {
    pomState.running = true;
    pomState.interval = setInterval(() => {
      pomState.elapsed++;
      const total = pomDurations[pomState.mode];
      if (pomState.elapsed >= total) {
        clearInterval(pomState.interval);
        pomState.running = false;
        if (pomState.mode === 'focus') {
          pomState.sessions++;
          showToast('🍅 Focus session complete! Take a break 🌿');
          if (pomState.taskId) {
            const task = state.tasks.find(t => t.id === pomState.taskId);
            if (task) showToast(`Great work on "${task.title}"! ✓`);
          }
        } else {
          showToast('☕ Break over! Ready to focus again? 🍅');
        }
        pomState.elapsed = 0;
        renderPomodoro();
        return;
      }
      // Update display without full re-render
      const timeEl = document.getElementById('pom-time');
      const arcEl = document.getElementById('pom-arc');
      if (timeEl) timeEl.textContent = formatPomTime();
      if (arcEl) arcEl.setAttribute('stroke-dashoffset', getPomOffset());
    }, 1000);
  }
  const btn = document.getElementById('pom-start-btn');
  if (btn) btn.textContent = pomState.running ? '⏸ Pause' : '▶ Start';
}

function resetPomodoro() {
  clearInterval(pomState.interval);
  pomState.running = false;
  pomState.elapsed = 0;
  renderPomodoro();
}
