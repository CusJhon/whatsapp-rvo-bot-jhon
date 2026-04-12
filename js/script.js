// ========================================
// REPOFLOW - COMPLETE GITHUB MANAGER
// With README Generator, MIT License, .gitignore
// ========================================

// =============== STATE MANAGEMENT ===============
let gitUsername = "";
let gitToken = "";
let isAuthenticated = false;
let modernFiles = [];
let extractedFiles = [];
let activityLog = [];
let uploadCount = 0;
let commitCount = 0;
let isLoadingRepos = false;
let isTypingActive = false;
let typingTimeout = null;
let currentView = 'list';
let searchQuery = '';
let currentMode = 'mode1';

// Enhanced Repositories State
let allRepositories = [];
let filteredRepositories = [];
let currentFilter = 'all';
let currentSort = 'updated';
let currentPage = 1;
let itemsPerPage = 12;
let pinnedRepos = [];
let currentDeleteTarget = null;
let currentCloneTarget = null;
let isLoadingReposEnhanced = false;
let searchDebounceTimer = null;

// README Generator State
let features = [""];
let techStack = [];
let commitChart = null;

// Blocked extensions
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.aspx', '.jsp', '.env', '.pem', '.key', '.crt'];
const MAX_FILES = 100;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const languageColors = {
  'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
  'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584', 'default': '#8b949e'
};

// Gitignore templates
const gitignoreTemplates = {
  node: `node_modules/\ndist/\n.env\n.DS_Store\nnpm-debug.log\ncoverage/`,
  react: `node_modules/\nbuild/\n.env\n.DS_Store\n*.log\ncoverage/`,
  python: `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.pyc\n.pytest_cache/`,
  java: `*.class\ntarget/\n*.log\n.settings/\n.project\n.classpath`,
  laravel: `/vendor\n.env\n.phpunit.result.cache\nHomestead.json\nnode_modules/`
};

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const pagesContainer = document.getElementById('pagesContainer');
  const terminalContainer = document.getElementById('terminalContainer');
  const terminalBody = document.getElementById('terminalBody');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressText = document.getElementById('progressText');
  
  loadPinnedRepos();
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  });
  
  // Menu Toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  
  // Close sidebar on outside click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
  
  // Quick actions
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
  
  // Mode Tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('mode1Container').style.display = mode === 'mode1' ? 'block' : 'none';
      document.getElementById('mode2Container').style.display = mode === 'mode2' ? 'block' : 'none';
      currentMode = mode;
    });
  });
  
  // FAQ Toggle
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      question.parentElement.classList.toggle('active');
    });
  });
  
  // Login
  const showLoginBtn = document.getElementById('showLoginBtn');
  if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginModal);
  document.getElementById('authBtn')?.addEventListener('click', authenticateAndVerify);
  document.getElementById('closeLoginModal')?.addEventListener('click', () => closeModal('loginModal'));
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  
  // Create repo
  document.getElementById('confirmCreateRepo')?.addEventListener('click', executeCreateRepo);
  document.getElementById('confirmDeleteRepoBtn')?.addEventListener('click', executeDeleteFromPage);
  
  // Upload handlers
  initEnhancedUpload();
  setupMode1UploadHandlers();
  setupMode2UploadHandlers();
  initEnhancedRepositories();
  
  // Refresh repos
  const refreshBtn = document.getElementById('refreshReposBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      if (!isAuthenticated) return addSystemLog('[WARNING] Please login first', 'warning');
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
      await loadRepositoriesEnhanced(true);
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    });
  }
  
  // Close terminal
  document.getElementById('closeTerminalBtn')?.addEventListener('click', () => {
    terminalContainer.style.display = 'none';
    if (typingTimeout) clearTimeout(typingTimeout);
    isTypingActive = false;
  });
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    });
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
  }
  
  // Close modals
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  });
  document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => closeModal('deleteModal'));
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => closeModal('deleteModal'));
  document.getElementById('closeCloneModalBtn')?.addEventListener('click', () => closeModal('cloneModal'));
  document.getElementById('closeCloneModalFooterBtn')?.addEventListener('click', () => closeModal('cloneModal'));
  document.getElementById('copyCloneUrlBtn')?.addEventListener('click', copyCloneUrl);
  document.getElementById('confirmDeleteModalBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('deleteConfirmInput')?.value.trim();
    if (input === currentDeleteTarget) {
      await executeDeleteRepo(currentDeleteTarget);
      closeModal('deleteModal');
      await loadRepositoriesEnhanced(true);
    } else showToast('Repository name does not match!', 'error');
  });
  
  // README Generator Event Listeners
  initReadmeGenerator();
  
  // Terminal welcome
  setTimeout(() => {
    if (terminalBody && terminalBody.children.length === 0 && !isAuthenticated) {
      startTerminalWelcomeTyping();
    }
  }, 500);
});

// =============== README GENERATOR ===============
function initReadmeGenerator() {
  const enableCheckbox = document.getElementById('enableReadmeGenerator');
  const section = document.getElementById('readmeGeneratorSection');
  if (enableCheckbox) {
    enableCheckbox.addEventListener('change', () => {
      section.style.display = enableCheckbox.checked ? 'block' : 'none';
      updateFileTreePreview();
      updateReadmePreview();
    });
  }
  
  document.getElementById('addFeatureBtn')?.addEventListener('click', () => { features.push(''); renderFeatures(); updateReadmePreview(); });
  document.getElementById('projectName')?.addEventListener('input', updateReadmePreview);
  document.getElementById('projectDesc')?.addEventListener('input', updateReadmePreview);
  document.getElementById('installSteps')?.addEventListener('input', updateReadmePreview);
  document.getElementById('usageSteps')?.addEventListener('input', updateReadmePreview);
  document.getElementById('screenshotUrl')?.addEventListener('input', updateReadmePreview);
  document.getElementById('authorName')?.addEventListener('input', updateReadmePreview);
  
  // License toggle
  document.getElementById('enableLicense')?.addEventListener('change', () => {
    const preview = document.getElementById('licensePreview');
    if (document.getElementById('enableLicense').checked) {
      const author = document.getElementById('authorName').value.trim() || gitUsername || "Anonymous";
      const year = new Date().getFullYear();
      preview.innerHTML = `<strong>MIT License Preview:</strong><pre style="margin-top:8px; white-space:pre-wrap">MIT License\n\nCopyright (c) ${year} ${author}\n\nPermission is hereby granted...</pre>`;
      preview.style.display = 'block';
    } else preview.style.display = 'none';
    updateFileTreePreview();
  });
  
  // Gitignore toggle
  document.getElementById('enableGitignore')?.addEventListener('change', () => {
    const section = document.getElementById('gitignoreSection');
    section.style.display = document.getElementById('enableGitignore').checked ? 'block' : 'none';
    updateFileTreePreview();
  });
  document.getElementById('gitignoreTemplateSelect')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && gitignoreTemplates[val]) {
      document.getElementById('gitignoreContent').value = gitignoreTemplates[val];
      updateFileTreePreview();
    }
  });
  document.getElementById('gitignoreContent')?.addEventListener('input', updateFileTreePreview);
  
  renderFeatures();
  renderTechTags();
}

function renderFeatures() {
  const container = document.getElementById('featuresList');
  if (!container) return;
  container.innerHTML = features.map((f, i) => `
    <div class="list-item">
      <input type="text" class="modern-input" value="${escapeHtml(f)}" data-feature-idx="${i}" placeholder="Feature">
      <button class="btn-secondary" style="padding:6px 12px" data-remove-feature="${i}"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
  document.querySelectorAll('[data-feature-idx]').forEach(inp => {
    inp.addEventListener('change', (e) => { features[parseInt(inp.dataset.featureIdx)] = inp.value; updateReadmePreview(); });
  });
  document.querySelectorAll('[data-remove-feature]').forEach(btn => {
    btn.addEventListener('click', () => { features.splice(parseInt(btn.dataset.removeFeature), 1); if(features.length===0) features=['']; renderFeatures(); updateReadmePreview(); });
  });
}

function renderTechTags() {
  const container = document.getElementById('techTags');
  if (!container) return;
  container.innerHTML = techStack.map(t => `<span class="tag">${escapeHtml(t)} <span class="tag-remove" data-tech="${escapeHtml(t)}">&times;</span></span>`).join('') + `<input type="text" class="tag-input" id="techInput" placeholder="Add tech...">`;
  document.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => { techStack = techStack.filter(t => t !== btn.dataset.tech); renderTechTags(); updateReadmePreview(); });
  });
  const techInput = document.getElementById('techInput');
  if (techInput) {
    techInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && techInput.value.trim()) {
        techStack.push(techInput.value.trim());
        techInput.value = '';
        renderTechTags();
        updateReadmePreview();
      }
    });
  }
}

function generateReadme() {
  const name = document.getElementById('projectName')?.value.trim() || "Project Name";
  const desc = document.getElementById('projectDesc')?.value.trim();
  const featuresList = features.filter(f => f.trim());
  const tech = techStack;
  const install = document.getElementById('installSteps')?.value.trim();
  const usage = document.getElementById('usageSteps')?.value.trim();
  const screenshot = document.getElementById('screenshotUrl')?.value.trim();
  const author = document.getElementById('authorName')?.value.trim() || gitUsername || "Anonymous";
  const year = new Date().getFullYear();
  
  let markdown = `# ${name}\n\n`;
  if (desc) markdown += `## 📖 Description\n\n${desc}\n\n`;
  if (featuresList.length) { markdown += `## ✨ Features\n\n`; featuresList.forEach(f => markdown += `* ${f}\n`); markdown += `\n`; }
  if (tech.length) { markdown += `## 🛠️ Tech Stack\n\n`; tech.forEach(t => markdown += `* ${t}\n`); markdown += `\n`; }
  if (install) { markdown += `## 📦 Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n\n`; }
  if (usage) { markdown += `## 🚀 Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n\n`; }
  if (screenshot) markdown += `## 📸 Screenshots\n\n![Screenshot](${screenshot})\n\n`;
  markdown += `## 🤝 Contributing\n\nPull requests are welcome.\n\n## 📜 License\n\nMIT License © ${year} ${author}\n`;
  return markdown;
}

function updateReadmePreview() {
  const md = generateReadme();
  const previewDiv = document.getElementById('readmePreview');
  if (previewDiv && typeof marked !== 'undefined') {
    previewDiv.innerHTML = marked.parse(md);
  }
  updateFileTreePreview();
}

function generateLicenseContent() {
  const author = document.getElementById('authorName')?.value.trim() || gitUsername || "Anonymous";
  const year = new Date().getFullYear();
  return `MIT License\n\nCopyright (c) ${year} ${author}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
}

function updateFileTreePreview() {
  const container = document.getElementById('fileTreePreview');
  if (!container) return;
  let html = '<div class="tree-item tree-folder" onclick="toggleFolder(this)"><i class="fas fa-folder"></i> 📁 project-root</div><div class="folder-children">';
  if (document.getElementById('enableReadmeGenerator')?.checked) html += `<div class="tree-item tree-file"><i class="fas fa-file-alt"></i> README.md</div>`;
  if (document.getElementById('enableLicense')?.checked) html += `<div class="tree-item tree-file"><i class="fas fa-file-contract"></i> LICENSE</div>`;
  if (document.getElementById('enableGitignore')?.checked && document.getElementById('gitignoreContent')?.value.trim()) html += `<div class="tree-item tree-file"><i class="fas fa-ban"></i> .gitignore</div>`;
  modernFiles.forEach(f => html += `<div class="tree-item tree-file"><i class="fas fa-file"></i> ${escapeHtml(f.file.name)}</div>`);
  html += `</div>`;
  container.innerHTML = html;
}

window.toggleFolder = function(el) {
  const children = el.nextElementSibling;
  if (children) children.classList.toggle('open');
};

// =============== AUTHENTICATION ===============
function showLoginModal() { document.getElementById('loginModal').classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('active'); }

async function authenticateAndVerify() {
  const user = document.getElementById('githubUsername')?.value.trim();
  const token = document.getElementById('githubToken')?.value.trim();
  if (!user || !token) return showAuthStatus('Username and token required!', 'error');
  
  showTerminal();
  addSystemLog('[AUTH] Connecting to GitHub API...', 'info');
  
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Basic ${btoa(user + ':' + token)}` }
    });
    if (!response.ok) throw new Error('Invalid credentials');
    const data = await response.json();
    if (data.login.toLowerCase() !== user.toLowerCase()) throw new Error('Username mismatch');
    
    gitUsername = user;
    gitToken = token;
    isAuthenticated = true;
    
    addSystemLog(`[SUCCESS] Authenticated as ${gitUsername}`, 'success');
    closeModal('loginModal');
    document.getElementById('pagesContainer').style.display = 'block';
    document.getElementById('userName').textContent = gitUsername;
    document.getElementById('showLoginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('connectionStatus').classList.add('connected');
    document.getElementById('connectionStatus').querySelector('span').textContent = 'Connected';
    
    await loadRepositoriesEnhanced();
    navigateTo('home');
    addSystemLog('[READY] System online.', 'success');
    showToast(`Welcome ${gitUsername}!`, 'success');
    
    // Auto-fill author name
    if (document.getElementById('authorName') && !document.getElementById('authorName').value) {
      document.getElementById('authorName').value = gitUsername;
      updateReadmePreview();
    }
  } catch (err) {
    addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error');
    showAuthStatus(err.message, 'error');
  }
}

function showAuthStatus(message, type) {
  const div = document.getElementById('authStatus');
  if (div) { div.innerHTML = `<div style="color:${type==='error'?'#ef4444':'#10b981'}">${escapeHtml(message)}</div>`; setTimeout(() => div.innerHTML = '', 3000); }
}

function logout() {
  addSystemLog('[SYSTEM] Disconnecting...', 'warning');
  gitUsername = ""; gitToken = ""; isAuthenticated = false;
  modernFiles = []; allRepositories = [];
  document.getElementById('pagesContainer').style.display = 'none';
  document.getElementById('terminalContainer').style.display = 'none';
  document.getElementById('userName').textContent = 'Guest';
  document.getElementById('showLoginBtn').style.display = 'flex';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('connectionStatus').classList.remove('connected');
  document.getElementById('connectionStatus').querySelector('span').textContent = 'Disconnected';
  showLoginModal();
  showToast('Logged out', 'info');
}

// =============== TERMINAL ===============
function showTerminal() { document.getElementById('terminalContainer').style.display = 'block'; }
function addTerminalLog(message, type = 'info') {
  const body = document.getElementById('terminalBody');
  if (!body) return;
  stopTypingEffect();
  const div = document.createElement('div');
  div.className = `log-line log-${type}`;
  div.innerHTML = message;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  activityLog.unshift({ message, type, time: new Date() });
  if (activityLog.length > 20) activityLog.pop();
  updateDashboard();
}
function addSystemLog(message, type) { addTerminalLog(`[${new Date().toLocaleTimeString()}] > ${message}`, type); }
function scrollTerminalToBottom() { const b = document.getElementById('terminalBody'); if(b) b.scrollTop = b.scrollHeight; }
function updateProgress(percent, text) {
  const fill = document.getElementById('progressFill');
  const percentSpan = document.getElementById('progressPercent');
  const textSpan = document.getElementById('progressText');
  if (fill) fill.style.width = percent + '%';
  if (percentSpan) percentSpan.textContent = percent + '%';
  if (textSpan) textSpan.textContent = text;
}
function showProgress() { document.getElementById('progressWrapper').style.display = 'block'; }
function hideProgress() { document.getElementById('progressWrapper').style.display = 'none'; updateProgress(0, 'Idle'); }
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':'fa-info-circle'}"></i><span>${escapeHtml(message)}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

let typingTimeoutGlobal;
function stopTypingEffect() { if (typingTimeoutGlobal) clearTimeout(typingTimeoutGlobal); isTypingActive = false; }
function startTerminalWelcomeTyping() { /* kept for compatibility */ }

// =============== GITHUB API ===============
async function githubRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method, headers: { 'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(()=>({message:res.statusText}))).message);
  return res.status === 204 ? { success: true } : await res.json();
}

// =============== CREATE / DELETE REPO ===============
async function executeCreateRepo() {
  const name = document.getElementById('newRepoName')?.value.trim();
  const desc = document.getElementById('repoDesc')?.value || '';
  const isPrivate = document.getElementById('repoPrivate')?.checked || false;
  const initReadme = document.getElementById('initReadme')?.checked || false;
  if (!name) return addSystemLog('[ERROR] Repository name required!', 'error');
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) return addSystemLog('[ERROR] Invalid repository name', 'error');
  
  showTerminal();
  addSystemLog('[GITHUB] Creating repository...', 'info');
  showProgress(); updateProgress(30, 'Creating...');
  try {
    await githubRequest('/user/repos', 'POST', { name, description: desc, private: isPrivate, auto_init: initReadme });
    addSystemLog(`[SUCCESS] Repository "${name}" created!`, 'success');
    document.getElementById('newRepoName').value = '';
    document.getElementById('repoDesc').value = '';
    await loadRepositoriesEnhanced(true);
    updateProgress(100, 'Complete!');
    setTimeout(hideProgress, 1500);
    showToast(`Repository "${name}" created!`, 'success');
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); hideProgress(); }
}

async function executeDeleteFromPage() {
  const select = document.getElementById('deleteRepoSelect');
  const repoName = select?.value;
  const confirmName = document.getElementById('confirmDeleteName')?.value.trim();
  if (!repoName || repoName === '-- Select repository --') return addSystemLog('[ERROR] Select a repository', 'error');
  if (repoName !== confirmName) return addSystemLog('[ERROR] Name confirmation mismatch', 'error');
  await executeDeleteRepo(repoName);
  document.getElementById('confirmDeleteName').value = '';
  select.value = '-- Select repository --';
}

async function executeDeleteRepo(repoName) {
  showTerminal();
  addSystemLog(`[DANGER] Deleting ${repoName}...`, 'warning');
  showProgress(); updateProgress(50, 'Deleting...');
  try {
    await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE');
    addSystemLog(`[SUCCESS] Deleted ${repoName}`, 'success');
    updateProgress(100, 'Complete!');
    setTimeout(hideProgress, 1000);
    await loadRepositoriesEnhanced(true);
    showToast(`Deleted ${repoName}`, 'success');
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); hideProgress(); }
}

// =============== REPOSITORIES MANAGEMENT ===============
function initEnhancedRepositories() {
  loadPinnedRepos();
  document.getElementById('repoSearchInput')?.addEventListener('input', (e) => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => { currentPage = 1; applyFiltersAndSort(); }, 300);
  });
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      applyFiltersAndSort();
    });
  });
  document.getElementById('sortSelect')?.addEventListener('change', (e) => { currentSort = e.target.value; applyFiltersAndSort(); });
  document.getElementById('prevPageBtn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextPageBtn')?.addEventListener('click', () => changePage(1));
}

async function loadRepositoriesEnhanced(force = false) {
  if (!isAuthenticated || isLoadingReposEnhanced) return;
  isLoadingReposEnhanced = true;
  showSkeletonLoader();
  const cacheKey = `repos_${gitUsername}`;
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  if (!force && cacheTime && (Date.now() - parseInt(cacheTime) < 300000) && cached) {
    allRepositories = JSON.parse(cached);
    processRepositories();
    isLoadingReposEnhanced = false;
    updateDashboard();
    return;
  }
  addSystemLog('[SYSTEM] Fetching repositories...', 'info');
  try {
    let allRepos = [];
    let page = 1;
    while (page <= 10) {
      const repos = await githubRequest(`/user/repos?per_page=100&page=${page}&sort=updated`);
      if (repos && repos.length) { allRepos = allRepos.concat(repos); page++; if (repos.length < 100) break; }
      else break;
    }
    allRepositories = allRepos;
    localStorage.setItem(cacheKey, JSON.stringify(allRepos));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    processRepositories();
    updateDashboard();
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showErrorStateRepos(err.message); }
  isLoadingReposEnhanced = false;
}

function processRepositories() {
  applyFiltersAndSort();
  updateStatsRepos();
  const deleteSelect = document.getElementById('deleteRepoSelect');
  if (deleteSelect) deleteSelect.innerHTML = '<option value="">-- Select repository --</option>' + allRepositories.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join('');
}

function applyFiltersAndSort() {
  let filtered = [...allRepositories];
  const search = document.getElementById('repoSearchInput')?.value.toLowerCase() || '';
  if (search) filtered = filtered.filter(r => r.name.toLowerCase().includes(search) || (r.description && r.description.toLowerCase().includes(search)));
  if (currentFilter === 'public') filtered = filtered.filter(r => !r.private);
  if (currentFilter === 'private') filtered = filtered.filter(r => r.private);
  filtered.sort((a,b) => { if(currentSort==='name') return a.name.localeCompare(b.name); if(currentSort==='stars') return b.stargazers_count - a.stargazers_count; if(currentSort==='size') return b.size - a.size; return new Date(b.updated_at) - new Date(a.updated_at); });
  const pinned = filtered.filter(r => pinnedRepos.includes(r.name));
  const unpinned = filtered.filter(r => !pinnedRepos.includes(r.name));
  filteredRepositories = [...pinned, ...unpinned];
  updatePaginationRepos();
  renderRepositories();
}

function renderRepositories() {
  const container = document.getElementById('repoListContainerEnhanced');
  if (!container) return;
  const start = (currentPage-1)*itemsPerPage;
  const paged = filteredRepositories.slice(start, start+itemsPerPage);
  if (!paged.length && !filteredRepositories.length) return showEmptyStateRepos();
  container.innerHTML = paged.map(repo => `
    <div class="repo-card-enhanced"><div class="pin-badge" data-repo="${escapeHtml(repo.name)}"><i class="fas ${pinnedRepos.includes(repo.name)?'fa-star':'fa-star-o'}"></i></div>
    <div class="repo-header-enhanced"><div class="repo-name-enhanced"><i class="fab fa-github"></i><a href="${repo.html_url}" target="_blank">${escapeHtml(repo.name)}</a></div><div class="visibility-badge ${repo.private?'private':'public'}">${repo.private?'Private':'Public'}</div></div>
    <div class="repo-desc-enhanced">${escapeHtml(repo.description || 'No description')}</div>
    <div class="repo-meta-enhanced"><span><span class="language-color" style="background:${languageColors[repo.language]||languageColors.default}"></span> ${repo.language||'N/A'}</span><span><i class="fas fa-star"></i> ${repo.stargazers_count}</span><span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span><span>🕒 ${new Date(repo.updated_at).toLocaleDateString()}</span></div>
    <div class="repo-actions-enhanced"><button class="repo-action-btn" data-action="copy" data-url="${repo.clone_url}">Copy URL</button><button class="repo-action-btn" data-action="clone" data-repo="${escapeHtml(repo.name)}" data-url="${repo.clone_url}">Clone</button><button class="repo-action-btn danger" data-action="delete" data-repo="${escapeHtml(repo.name)}">Delete</button></div></div>
  `).join('');
  document.querySelectorAll('.pin-badge').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); togglePinRepo(el.dataset.repo); }));
  document.querySelectorAll('.repo-action-btn').forEach(btn => btn.addEventListener('click', (e) => { const a=btn.dataset.action, repo=btn.dataset.repo, url=btn.dataset.url; if(a==='copy') copyToClipboard(url); if(a==='clone') showCloneModal(repo); if(a==='delete') showDeleteModal(repo); }));
}

function updateStatsRepos() {
  document.getElementById('repoStatsHeader').style.display = 'flex';
  document.getElementById('totalReposCount').textContent = allRepositories.length;
  document.getElementById('totalStarsCount').textContent = allRepositories.reduce((s,r)=>s+r.stargazers_count,0);
  document.getElementById('totalForksCount').textContent = allRepositories.reduce((s,r)=>s+r.forks_count,0);
  document.getElementById('totalSizeCount').textContent = (allRepositories.reduce((s,r)=>s+(r.size||0),0)/1024).toFixed(1);
}

function updatePaginationRepos() {
  const total = Math.ceil(filteredRepositories.length / itemsPerPage);
  const container = document.getElementById('paginationContainer');
  if (total <= 1) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${total}`;
  document.getElementById('prevPageBtn').disabled = currentPage === 1;
  document.getElementById('nextPageBtn').disabled = currentPage === total;
}
function changePage(delta) { const total = Math.ceil(filteredRepositories.length / itemsPerPage); const np = currentPage + delta; if(np>=1 && np<=total) { currentPage = np; renderRepositories(); updatePaginationRepos(); } }
function togglePinRepo(name) { if(pinnedRepos.includes(name)) pinnedRepos = pinnedRepos.filter(p=>p!==name); else pinnedRepos.push(name); localStorage.setItem('pinnedRepos', JSON.stringify(pinnedRepos)); applyFiltersAndSort(); }
function loadPinnedRepos() { const saved = localStorage.getItem('pinnedRepos'); if(saved) try { pinnedRepos = JSON.parse(saved); } catch(e){} }
function showDeleteModal(name) { currentDeleteTarget = name; document.getElementById('deleteRepoNameDisplay').textContent = name; document.getElementById('deleteConfirmInput').value = ''; document.getElementById('deleteModal').classList.add('active'); }
function showCloneModal(name) { const repo = allRepositories.find(r=>r.name===name); if(repo){ currentCloneTarget = repo; document.getElementById('cloneUrlText').textContent = repo.clone_url; document.getElementById('cloneCommandText').textContent = repo.clone_url; document.getElementById('cloneModal').classList.add('active'); } }
function copyCloneUrl() { if(currentCloneTarget) copyToClipboard(currentCloneTarget.clone_url); }
function copyToClipboard(text) { navigator.clipboard.writeText(text).then(()=>showToast('Copied!','success')).catch(()=>showToast('Failed','error')); }
function showSkeletonLoader() { document.getElementById('repoListContainerEnhanced').innerHTML = '<div class="skeleton-grid">'+Array(6).fill(0).map(()=>'<div class="skeleton-card"><div class="skeleton-title"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>').join('')+'</div>'; }
function showEmptyStateRepos() { document.getElementById('repoListContainerEnhanced').innerHTML = '<div class="empty-state-enhanced"><i class="fas fa-inbox"></i><h3>No repositories found</h3><button class="btn-primary" onclick="navigateTo(\'create\')">Create Repository</button></div>'; }
function showErrorStateRepos(msg) { document.getElementById('repoListContainerEnhanced').innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load: ${escapeHtml(msg)}</p><button class="btn-primary" onclick="loadRepositoriesEnhanced(true)">Retry</button></div>`; }

// =============== UPLOAD SYSTEM ===============
function initEnhancedUpload() {
  const dropZone1 = document.getElementById('dropZone1'), fileInput1 = document.getElementById('fileInputModern1');
  const dropZone2 = document.getElementById('dropZone2'), fileInput2 = document.getElementById('fileInputModern2');
  document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentView = btn.dataset.view; renderFileList(); }));
  document.getElementById('searchFiles')?.addEventListener('input', (e) => { searchQuery = e.target.value.toLowerCase(); renderFileList(); });
  if(dropZone1 && fileInput1) setupDropZone(dropZone1, fileInput1, handleFilesSelected);
  if(dropZone2 && fileInput2) setupDropZone(dropZone2, fileInput2, handleZipSelected);
}

function setupDropZone(zone, input, onSelect) {
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); onSelect(Array.from(e.dataTransfer.files)); });
  input.addEventListener('change', e => { onSelect(Array.from(e.target.files)); input.value = ''; });
}

function handleFilesSelected(files) {
  const existing = new Set(modernFiles.map(f=>f.file.name));
  for(const file of files) {
    const ext = '.'+file.name.split('.').pop()?.toLowerCase();
    if(BLOCKED_EXTENSIONS.includes(ext)) { showToast(`Blocked: ${file.name}`, 'error'); continue; }
    if(file.size > MAX_FILE_SIZE) { showToast(`Too large: ${file.name}`, 'error'); continue; }
    if(!existing.has(file.name)) modernFiles.push({ file, preview: null, status:'pending', progress:0, textPreview:null });
  }
  generatePreviews();
  updateUI();
  updateFileTreePreview();
}

async function generatePreviews() {
  for(let item of modernFiles) {
    if(item.preview !== null) continue;
    const file = item.file;
    const ext = '.'+file.name.split('.').pop()?.toLowerCase();
    if(['.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) {
      item.preview = await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(file);});
    } else if(['.js','.html','.css','.json','.txt','.md'].includes(ext)) {
      item.textPreview = await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result.substring(0,200)); fr.readAsText(file);});
    }
  }
  renderFileList();
}

function renderFileList() {
  const container = document.getElementById('fileListModern1');
  const header = document.getElementById('fileListHeader');
  const search = document.getElementById('fileSearch');
  const commitPreview = document.getElementById('commitPreview');
  const uploadBtn = document.getElementById('startUploadBtn1');
  if(!container) return;
  if(modernFiles.length===0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada file yang dipilih</p></div>';
    if(header) header.style.display = 'none';
    if(search) search.style.display = 'none';
    if(commitPreview) commitPreview.style.display = 'none';
    if(uploadBtn) uploadBtn.style.display = 'none';
    return;
  }
  if(header) header.style.display = 'flex';
  if(search) search.style.display = 'block';
  if(commitPreview) commitPreview.style.display = 'block';
  if(uploadBtn) uploadBtn.style.display = 'block';
  document.getElementById('fileCount').textContent = modernFiles.length;
  const totalBytes = modernFiles.reduce((s,f)=>s+f.file.size,0);
  document.getElementById('totalSize').textContent = formatFileSize(totalBytes);
  document.getElementById('commitFileList').innerHTML = modernFiles.map(f=>`<div><i class="fas fa-file"></i> ${escapeHtml(f.file.name)} (${formatFileSize(f.file.size)})</div>`).join('');
  container.className = `file-list-container ${currentView}-view`;
  container.innerHTML = modernFiles.map((item,idx)=>`<div class="file-item ${currentView}-view"><div class="file-preview">${item.preview?`<img src="${item.preview}">`:`<i class="${getFileIcon(item.file)}"></i>`}</div><div class="file-info"><div class="file-name">${escapeHtml(item.file.name)}</div><div class="file-size">${formatFileSize(item.file.size)}</div>${item.textPreview?`<div class="text-preview">${escapeHtml(item.textPreview)}...</div>`:''}${item.status==='uploading'?`<div class="upload-progress"><div class="progress-bar-item"><div class="progress-fill-item" style="width:${item.progress}%"></div></div></div>`:''}</div><div class="file-actions"><button class="remove-file" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></div></div>`).join('');
  document.querySelectorAll('.remove-file').forEach(btn => btn.addEventListener('click',()=>{ modernFiles.splice(parseInt(btn.dataset.idx),1); renderFileList(); updateFileTreePreview(); }));
}
function getFileIcon(file) { return 'fas fa-file'; }
function formatFileSize(bytes) { if(bytes===0) return '0 Bytes'; const k=1024, sizes=['Bytes','KB','MB']; const i=Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i]; }

async function handleZipSelected(files) {
  if(!files.length || !files[0].name.endsWith('.zip')) return showToast('Only ZIP files supported','error');
  const zipFile = files[0];
  document.getElementById('zipPreviewContainer').style.display = 'block';
  document.getElementById('startUploadBtn2').style.display = 'block';
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const structure = {};
    for(const [path, entry] of Object.entries(zip.files)) {
      if(!entry.dir) {
        const parts = path.split('/');
        let curr = structure;
        for(let i=0;i<parts.length-1;i++) { if(!curr[parts[i]]) curr[parts[i]]={}; curr=curr[parts[i]]; }
        curr[parts[parts.length-1]] = true;
      }
    }
    document.getElementById('zipFileCount').textContent = Object.keys(zip.files).filter(p=>!zip.files[p].dir).length;
    document.getElementById('zipTreeView').innerHTML = renderZipTree(structure);
    window.extractedZipFiles = [];
    for(const [path, entry] of Object.entries(zip.files)) {
      if(!entry.dir) {
        const content = await entry.async('blob');
        const file = new File([content], path.split('/').pop(), {type:content.type});
        Object.defineProperty(file,'webkitRelativePath',{value:path});
        window.extractedZipFiles.push(file);
      }
    }
  } catch(e) { showToast('Error extracting ZIP','error'); }
}
function renderZipTree(obj, level=0) { let html=''; for(const [name, children] of Object.entries(obj)) { if(children===true) html+=`<div class="tree-item tree-file" style="padding-left:${level*20}px"><i class="fas fa-file"></i> ${escapeHtml(name)}</div>`; else html+=`<div class="tree-item tree-folder" style="padding-left:${level*20}px" onclick="toggleFolder(this)"><i class="fas fa-folder"></i> ${escapeHtml(name)}</div><div class="folder-children">${renderZipTree(children, level+1)}</div>`; } return html; }

async function startModernUpload() {
  const repo = document.getElementById('targetRepoName1')?.value.trim();
  const branch = document.getElementById('branchName1')?.value.trim() || "main";
  const msg = document.getElementById('commitMsg1')?.value.trim() || "Upload via RepoFlow";
  if(!repo) return addSystemLog('[ERROR] Repository required','error');
  if(!modernFiles.length && !document.getElementById('enableReadmeGenerator')?.checked && !document.getElementById('enableLicense')?.checked && !document.getElementById('enableGitignore')?.checked) return addSystemLog('[ERROR] No files or generated content','error');
  
  showTerminal(); addSystemLog(`[UPLOAD] Starting to ${gitUsername}/${repo}`, 'info'); showProgress();
  const allUploads = [...modernFiles];
  if(document.getElementById('enableReadmeGenerator')?.checked) allUploads.push({file:new File([generateReadme()],'README.md',{type:'text/markdown'}), name:'README.md'});
  if(document.getElementById('enableLicense')?.checked) allUploads.push({file:new File([generateLicenseContent()],'LICENSE',{type:'text/plain'}), name:'LICENSE'});
  if(document.getElementById('enableGitignore')?.checked && document.getElementById('gitignoreContent')?.value.trim()) allUploads.push({file:new File([document.getElementById('gitignoreContent').value],'.gitignore',{type:'text/plain'}), name:'.gitignore'});
  
  let success=0, error=0;
  for(let i=0;i<allUploads.length;i++) {
    const item = allUploads[i];
    const file = item.file;
    const path = item.name || file.name;
    updateProgress((i/allUploads.length)*100, `Uploading ${path}`);
    addSystemLog(`[UPLOAD] ${path}`, 'info');
    try {
      let sha = null;
      try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e){}
      const b64 = await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result.split(',')[1]); fr.readAsDataURL(file);});
      await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', { message: msg, content: b64, branch, sha });
      success++;
      addSystemLog(`[SUCCESS] ${path}`, 'success');
    } catch(err) { error++; addSystemLog(`[ERROR] ${path}: ${err.message}`, 'error'); }
  }
  updateProgress(100, 'Complete!');
  if(error===0) { addSystemLog(`[SUCCESS] Uploaded ${success} files!`, 'success'); modernFiles = []; renderFileList(); updateFileTreePreview(); showToast(`Successfully uploaded ${success} files!`, 'success'); }
  else showToast(`Uploaded: ${success} success, ${error} failed`, 'warning');
  setTimeout(hideProgress, 2000);
}

async function startModernZipUpload() {
  const repo = document.getElementById('targetRepoName2')?.value.trim();
  const branch = document.getElementById('branchName2')?.value.trim() || "main";
  const msg = document.getElementById('commitMsg2')?.value.trim() || "Upload ZIP via RepoFlow";
  if(!repo || !window.extractedZipFiles?.length) return addSystemLog('[ERROR] Repository or ZIP required','error');
  showTerminal(); addSystemLog(`[ZIP UPLOAD] Extracting ${window.extractedZipFiles.length} files to ${repo}`, 'info'); showProgress();
  let success=0, error=0;
  for(let i=0;i<window.extractedZipFiles.length;i++) {
    const file = window.extractedZipFiles[i];
    const path = file.webkitRelativePath || file.name;
    updateProgress((i/window.extractedZipFiles.length)*100, path);
    try {
      let sha = null;
      try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e){}
      const b64 = await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result.split(',')[1]); fr.readAsDataURL(file);});
      await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', { message: msg, content: b64, branch, sha });
      success++;
    } catch(err) { error++; addSystemLog(`[ERROR] ${path}: ${err.message}`, 'error'); }
  }
  updateProgress(100,'Complete');
  showToast(`ZIP upload: ${success} success, ${error} failed`, success===error?'warning':'success');
  setTimeout(hideProgress,2000);
}

function updateUI() { renderFileList(); updateFileTreePreview(); }
function resetMode1State() { modernFiles = []; renderFileList(); updateFileTreePreview(); }
function setupMode1UploadHandlers() { document.getElementById('startUploadBtn1')?.addEventListener('click', startModernUpload); }
function setupMode2UploadHandlers() { document.getElementById('startUploadBtn2')?.addEventListener('click', startModernZipUpload); }

// =============== DASHBOARD ===============
function updateDashboard() {
  document.getElementById('totalRepos').textContent = allRepositories.length;
  document.getElementById('publicRepos').textContent = allRepositories.filter(r=>!r.private).length;
  document.getElementById('privateRepos').textContent = allRepositories.filter(r=>r.private).length;
  document.getElementById('totalStars').textContent = allRepositories.reduce((s,r)=>s+r.stargazers_count,0);
  const activityDiv = document.getElementById('activityList');
  if(activityDiv) activityDiv.innerHTML = activityLog.slice(0,5).map(log=>`<div class="activity-item">${escapeHtml(log.message.substring(0,80))}</div>`).join('');
  if(document.getElementById('commitChart')) {
    const ctx = document.getElementById('commitChart').getContext('2d');
    if(commitChart) commitChart.destroy();
    commitChart = new Chart(ctx, { type:'line', data:{ labels:allRepositories.slice(0,7).map(r=>r.name.substring(0,15)), datasets:[{ label:'Stars', data:allRepositories.slice(0,7).map(r=>r.stargazers_count), borderColor:'#00d4ff', fill:true }] }, options:{ responsive:true, maintainAspectRatio:true } });
  }
}

// =============== NAVIGATION & HELPERS ===============
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById(`${page}Page`).style.display='block';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  [...document.querySelectorAll('.nav-item')].find(n=>n.dataset.page===page)?.classList.add('active');
  if(page==='repos' && isAuthenticated) loadRepositoriesEnhanced();
  if(page==='dashboard' && isAuthenticated) updateDashboard();
}
function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){ if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }
window.navigateTo = navigateTo;
window.loadRepositoriesEnhanced = loadRepositoriesEnhanced;
window.toggleFolder = toggleFolder;