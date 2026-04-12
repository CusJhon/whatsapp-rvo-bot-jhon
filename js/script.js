// ========================================
// REPOFLOW - COMPLETE APPLICATION
// All original functionality preserved + Enhanced Upload
// ========================================

// =============== STATE MANAGEMENT ===============
let gitUsername = "";
let gitToken = "";
let isAuthenticated = false;
let activityLog = [];
let chartInstance = null;

// Upload State
let selectedFiles = [];
let currentReadmeContent = "";
let currentLicenseContent = "";

// Repositories State
let allRepositories = [];
let filteredRepositories = [];
let currentFilter = 'all';
let currentSort = 'updated';
let currentPage = 1;
let itemsPerPage = 12;
let pinnedRepos = JSON.parse(localStorage.getItem('pinnedRepos') || '[]');
let currentDeleteTarget = null;
let currentCloneTarget = null;

// Language colors
const languageColors = { 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5', 'Java': '#b07219', 'Go': '#00ADD8', 'default': '#8b949e' };

// =============== DOM Elements ===============
let sidebar, menuToggle, pagesContainer, terminalContainer, terminalBody;
let progressWrapper, progressFill, progressPercent, progressText;

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', () => {
  sidebar = document.getElementById('sidebar');
  menuToggle = document.getElementById('menuToggle');
  pagesContainer = document.getElementById('pagesContainer');
  terminalContainer = document.getElementById('terminalContainer');
  terminalBody = document.getElementById('terminalBody');
  progressWrapper = document.getElementById('progressWrapper');
  progressFill = document.getElementById('progressFill');
  progressPercent = document.getElementById('progressPercent');
  progressText = document.getElementById('progressText');

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
      if (window.innerWidth <= 768) sidebar.classList.remove('open');
    });
  });

  // Menu Toggle (Responsive)
  if (menuToggle) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Quick action buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Login button
  document.getElementById('showLoginBtn')?.addEventListener('click', () => document.getElementById('loginModal').classList.add('active'));
  document.getElementById('doLoginBtn')?.addEventListener('click', authenticateAndVerify);
  document.getElementById('closeLoginModal')?.addEventListener('click', () => document.getElementById('loginModal').classList.remove('active'));
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  // Create repo button
  document.getElementById('confirmCreateRepo')?.addEventListener('click', executeCreateRepo);
  document.getElementById('confirmDeleteRepoBtn')?.addEventListener('click', executeDeleteFromPage);

  // Setup Repositories Handlers
  initRepositoriesHandlers();
  document.getElementById('refreshReposBtn')?.addEventListener('click', () => loadRepositoriesEnhanced(true));

  // Setup Upload Handlers
  initUploadHandlers();
  document.getElementById('generateReadmeBtn')?.addEventListener('click', generateReadme);
  document.getElementById('aiGenerateBtn')?.addEventListener('click', aiGenerateReadme);
  document.getElementById('addLicenseCheckbox')?.addEventListener('change', updateGeneratedFiles);
  document.getElementById('commitUploadBtn')?.addEventListener('click', commitAndUpload);
  document.getElementById('readmeMarkdown')?.addEventListener('input', renderMarkdown);
  document.getElementById('splitMarkdown')?.addEventListener('input', e => { document.getElementById('readmeMarkdown').value = e.target.value; renderMarkdown(); });

  // Editor tabs
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.editor;
      document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.editor-pane').forEach(p => p.classList.remove('active'));
      if (mode === 'edit') document.getElementById('editPane').classList.add('active');
      else if (mode === 'preview') document.getElementById('previewPane').classList.add('active');
      else if (mode === 'split') document.getElementById('splitPane').classList.add('active');
    });
  });

  // Preview tabs
  document.querySelectorAll('.preview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.preview;
      document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('previewFiles').style.display = target === 'files' ? 'block' : 'none';
      document.getElementById('previewReadme').style.display = target === 'readme' ? 'block' : 'none';
      document.getElementById('previewLicense').style.display = target === 'license' ? 'block' : 'none';
    });
  });

  // Theme toggle
  let dark = true;
  document.getElementById('themeToggle')?.addEventListener('click', () => { dark = !dark; document.body.classList.toggle('light', !dark); });

  // Terminal collapse
  document.getElementById('toggleTerminalBtn')?.addEventListener('click', () => { const body = document.querySelector('.terminal-body'); body?.classList.toggle('collapsed'); document.getElementById('toggleTerminalBtn').innerHTML = body?.classList.contains('collapsed') ? '+' : '−'; });

  // Close terminal button (optional)
  // Not needed as we have collapse

  // Initial terminal welcome
  setTimeout(() => startTerminalWelcome(), 500);
});

// =============== TERMINAL FUNCTIONS ===============
function showTerminal() { if (terminalContainer) terminalContainer.style.display = 'block'; scrollTerminalToBottom(); }
function addTerminalLog(message, type = 'info') { if (!terminalBody) return; const logDiv = document.createElement('div'); logDiv.className = `log-${type}`; logDiv.innerHTML = message; terminalBody.appendChild(logDiv); scrollTerminalToBottom(); activityLog.unshift({ message, type, time: new Date() }); if (activityLog.length > 20) activityLog.pop(); updateDashboard(); }
function addSystemLog(message, type = 'info') { const timestamp = new Date().toLocaleTimeString(); addTerminalLog(`[${timestamp}] > ${message}`, type); }
function scrollTerminalToBottom() { if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight; }
function updateProgress(percent, text) { if (progressFill) progressFill.style.width = percent + '%'; if (progressPercent) progressPercent.textContent = percent + '%'; if (progressText) progressText.textContent = text; }
function showProgress() { if (progressWrapper) progressWrapper.style.display = 'block'; }
function hideProgress() { if (progressWrapper) progressWrapper.style.display = 'none'; updateProgress(0, 'Idle'); }

function startTerminalWelcome() {
  const welcomeLines = ["> ╔══════════════════════════════════════════════════════════════╗", "> ║     RepoFlow Terminal v3.0 - GitHub Manager Premium          ║", "> ║     Live terminal ready | Advanced Upload with README/LICENSE║", "> ║     Created by: JHON PRODUCTION                            ║", "> ╚══════════════════════════════════════════════════════════════╝", "> [SYSTEM] Ready for operations..."];
  welcomeLines.forEach(line => addTerminalLog(line, 'info'));
}

// =============== NAVIGATION ===============
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(item => { item.classList.remove('active'); if (item.dataset.page === page) item.classList.add('active'); });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageMap = { dashboard: 'dashboardPage', repos: 'reposPage', create: 'createPage', delete: 'deletePage', upload: 'uploadPage' };
  const pageId = pageMap[page];
  if (pageId) document.getElementById(pageId).classList.add('active');
  if (page === 'repos' && isAuthenticated) loadRepositoriesEnhanced();
  if (page === 'dashboard') updateDashboard();
}

function updateDashboard() {
  const activityList = document.getElementById('activityList');
  if (activityList) { if (activityLog.length === 0) activityList.innerHTML = '<div class="activity-item">Belum ada aktivitas</div>'; else activityList.innerHTML = activityLog.slice(0, 5).map(log => `<div class="activity-item">${escapeHtml(log.message.substring(0, 80))}</div>`).join(''); }
}

// =============== GITHUB API ===============
async function githubRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
  const response = await fetch(url, { method, headers: { 'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok && response.status !== 204) { const err = await response.json().catch(() => ({ message: response.statusText })); throw new Error(err.message); }
  return response.status === 204 ? { success: true } : await response.json();
}

// =============== AUTHENTICATION ===============
async function authenticateAndVerify() {
  const user = document.getElementById('loginUsername')?.value.trim();
  const token = document.getElementById('loginToken')?.value.trim();
  if (!user || !token) { document.getElementById('loginError').innerText = 'Username and token required!'; return; }
  showTerminal(); addSystemLog('[AUTH] Connecting to GitHub API...', 'info');
  try {
    const response = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Basic ${btoa(user + ':' + token)}` } });
    if (!response.ok) throw new Error('Invalid credentials');
    const data = await response.json();
    if (data.login.toLowerCase() !== user.toLowerCase()) throw new Error('Username mismatch');
    gitUsername = user; gitToken = token; isAuthenticated = true;
    addSystemLog(`[SUCCESS] Authenticated as ${gitUsername}`, 'success');
    document.getElementById('loginModal').classList.remove('active');
    pagesContainer.style.display = 'block';
    document.getElementById('userName').textContent = gitUsername;
    document.getElementById('showLoginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) { connectionStatus.innerHTML = '<i class="fas fa-circle" style="color:var(--accent-green)"></i><span>Connected</span>'; }
    await loadRepositoriesEnhanced();
    navigateTo('dashboard');
    addSystemLog('[READY] System online. Select an operation.', 'success');
  } catch (err) { addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error'); document.getElementById('loginError').innerText = err.message; }
}

function logout() {
  addSystemLog('[SYSTEM] Disconnecting...', 'warning');
  gitUsername = ""; gitToken = ""; isAuthenticated = false; selectedFiles = [];
  pagesContainer.style.display = 'none';
  document.getElementById('userName').textContent = 'Guest';
  document.getElementById('showLoginBtn').style.display = 'flex';
  document.getElementById('logoutBtn').style.display = 'none';
  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) connectionStatus.innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>';
}

// =============== CREATE REPOSITORY ===============
async function executeCreateRepo() {
  const name = document.getElementById('newRepoName')?.value.trim();
  const desc = document.getElementById('repoDesc')?.value || '';
  const isPrivate = document.getElementById('repoPrivate')?.checked || false;
  if (!name) { addSystemLog('[ERROR] Repository name required!', 'error'); return; }
  showTerminal(); addSystemLog('[GITHUB] Creating repository...', 'info'); showProgress(); updateProgress(30, 'Creating...');
  try {
    await githubRequest('/user/repos', 'POST', { name, description: desc, private: isPrivate, auto_init: false });
    addSystemLog(`[SUCCESS] Repository "${name}" created!`, 'success');
    document.getElementById('newRepoName').value = ''; document.getElementById('repoDesc').value = ''; document.getElementById('repoPrivate').checked = false;
    await loadRepositoriesEnhanced(true); updateProgress(100, 'Complete!'); setTimeout(() => hideProgress(), 1500);
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); hideProgress(); }
}

// =============== DELETE REPOSITORY ===============
async function executeDeleteFromPage() {
  const repoName = document.getElementById('deleteRepoName')?.value.trim();
  const confirmName = document.getElementById('confirmDeleteName')?.value.trim();
  if (!repoName) { addSystemLog('[ERROR] Repository name required!', 'error'); return; }
  if (repoName !== confirmName) { addSystemLog('[ERROR] Confirmation mismatch!', 'error'); return; }
  await executeDeleteRepo(repoName);
  document.getElementById('deleteRepoName').value = ''; document.getElementById('confirmDeleteName').value = '';
}
async function executeDeleteRepo(repoName) {
  showTerminal(); addSystemLog('[DANGER] Deleting repository...', 'warning'); showProgress(); updateProgress(50, 'Deleting...');
  try {
    await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE');
    addSystemLog(`[SUCCESS] Repository "${repoName}" deleted!`, 'success'); updateProgress(100, 'Complete!'); hideProgress();
    await loadRepositoriesEnhanced(true);
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); hideProgress(); }
}

// =============== ENHANCED REPOSITORIES SYSTEM ===============
function initRepositoriesHandlers() {
  document.getElementById('repoSearchInput')?.addEventListener('input', debounce(() => { applyFiltersAndSort(); }, 300));
  document.querySelectorAll('.filter-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentFilter = btn.dataset.filter; applyFiltersAndSort(); }); });
  document.getElementById('sortSelect')?.addEventListener('change', (e) => { currentSort = e.target.value; applyFiltersAndSort(); });
  document.getElementById('prevPageBtn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextPageBtn')?.addEventListener('click', () => changePage(1));
}
function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; }
async function loadRepositoriesEnhanced(forceRefresh = false) {
  if (!isAuthenticated) return; addSystemLog('[SYSTEM] Fetching repositories...', 'info');
  try {
    let allRepos = []; let page = 1; let hasMore = true;
    while (hasMore && page <= 10) { const repos = await githubRequest(`/user/repos?per_page=100&page=${page}&sort=updated&direction=desc`); if (repos && repos.length > 0) { allRepos = allRepos.concat(repos); page++; if (repos.length < 100) hasMore = false; } else hasMore = false; }
    if (allRepos.length === 0) { showEmptyStateRepos(); return; }
    allRepositories = allRepos; addSystemLog(`[SYSTEM] Loaded ${allRepos.length} repositories`, 'success'); applyFiltersAndSort(); updateStatsRepos(); updateChart();
  } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showErrorStateRepos(err.message); }
}
function updateChart() { const ctx = document.getElementById('commitChart'); if (!ctx) return; if (chartInstance) chartInstance.destroy(); const labels = allRepositories.slice(0, 7).map(r => r.name.substring(0, 12)); const starsData = allRepositories.slice(0, 7).map(r => r.stargazers_count); chartInstance = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Stars', data: starsData, borderColor: '#2f81f7', backgroundColor: 'rgba(47,129,247,0.1)', tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: 'var(--text-primary)' } } } } }); }
function applyFiltersAndSort() {
  let filtered = [...allRepositories];
  if (currentFilter === 'public') filtered = filtered.filter(repo => !repo.private);
  else if (currentFilter === 'private') filtered = filtered.filter(repo => repo.private);
  const searchTerm = document.getElementById('repoSearchInput')?.value.toLowerCase() || '';
  if (searchTerm) filtered = filtered.filter(repo => repo.name.toLowerCase().includes(searchTerm) || (repo.description && repo.description.toLowerCase().includes(searchTerm)));
  filtered.sort((a, b) => { if (currentSort === 'name') return a.name.localeCompare(b.name); if (currentSort === 'stars') return b.stargazers_count - a.stargazers_count; return new Date(b.updated_at) - new Date(a.updated_at); });
  const pinned = filtered.filter(repo => pinnedRepos.includes(repo.name)); const unpinned = filtered.filter(repo => !pinnedRepos.includes(repo.name));
  filteredRepositories = [...pinned, ...unpinned]; updatePagination(); renderRepositories();
}
function updateStatsRepos() { const statsHeader = document.getElementById('repoStatsHeader'); if (statsHeader) statsHeader.style.display = 'flex'; document.getElementById('totalReposCount').textContent = allRepositories.length; document.getElementById('totalStarsCount').textContent = allRepositories.reduce((sum, r) => sum + r.stargazers_count, 0); document.getElementById('totalForksCount').textContent = allRepositories.reduce((sum, r) => sum + r.forks_count, 0); }
function renderRepositories() { const container = document.getElementById('repoListContainerEnhanced'); if (!container) return; const startIdx = (currentPage - 1) * itemsPerPage; const pageRepos = filteredRepositories.slice(startIdx, startIdx + itemsPerPage); if (pageRepos.length === 0 && filteredRepositories.length === 0) { showEmptyStateRepos(); return; } container.innerHTML = pageRepos.map(repo => createRepoCard(repo)).join(''); attachRepoEventListeners(); }
function createRepoCard(repo) { const isPinned = pinnedRepos.includes(repo.name); const lastUpdated = getRelativeTime(repo.updated_at); const sizeMB = (repo.size / 1024).toFixed(1); const language = repo.language || 'Unknown'; const languageColor = languageColors[language] || languageColors.default; return `<div class="repo-card-enhanced"><div class="pin-badge" data-repo="${escapeHtml(repo.name)}"><i class="fas ${isPinned ? 'fa-star' : 'fa-star-o'}"></i></div><div class="repo-header-enhanced"><div class="repo-name-enhanced"><i class="fas fa-book"></i><a href="${repo.html_url}" target="_blank">${escapeHtml(repo.name)}</a></div><div class="visibility-badge ${repo.private ? 'private' : 'public'}">${repo.private ? 'Private' : 'Public'}</div></div><div class="repo-desc-enhanced">${escapeHtml(repo.description || 'No description')}</div><div class="repo-meta-enhanced"><div><span class="language-color" style="background:${languageColor}; display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:4px;"></span> ${escapeHtml(language)}</div><span><i class="fas fa-star"></i> ${repo.stargazers_count}</span><span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span><span><i class="fas fa-clock"></i> ${lastUpdated}</span><span><i class="fas fa-database"></i> ${sizeMB} MB</span></div><div class="repo-actions-enhanced"><button class="repo-action-btn" data-action="open" data-url="${repo.html_url}"><i class="fab fa-github"></i> Open</button><button class="repo-action-btn" data-action="clone" data-repo="${escapeHtml(repo.name)}" data-url="${repo.clone_url}"><i class="fas fa-code-branch"></i> Clone</button><button class="repo-action-btn" data-action="copy" data-url="${repo.clone_url}"><i class="fas fa-copy"></i> Copy URL</button><button class="repo-action-btn danger" data-action="delete" data-repo="${escapeHtml(repo.name)}"><i class="fas fa-trash-alt"></i> Delete</button></div></div>`; }
function attachRepoEventListeners() { document.querySelectorAll('.pin-badge').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); const repoName = btn.dataset.repo; if (pinnedRepos.includes(repoName)) pinnedRepos = pinnedRepos.filter(p => p !== repoName); else pinnedRepos.push(repoName); localStorage.setItem('pinnedRepos', JSON.stringify(pinnedRepos)); applyFiltersAndSort(); showToast(`${pinnedRepos.includes(repoName) ? 'Pinned' : 'Unpinned'} ${repoName}`); }); }); document.querySelectorAll('.repo-action-btn').forEach(btn => { btn.addEventListener('click', () => { const action = btn.dataset.action; const repoName = btn.dataset.repo; const url = btn.dataset.url; if (action === 'open') window.open(url, '_blank'); else if (action === 'clone') showCloneModal(repoName); else if (action === 'copy') copyToClipboard(url); else if (action === 'delete') showDeleteModal(repoName); }); }); }
function showDeleteModal(repoName) { currentDeleteTarget = repoName; const modal = document.getElementById('deleteModal'); document.getElementById('deleteRepoNameDisplay').textContent = repoName; document.getElementById('deleteConfirmInput').value = ''; modal.classList.add('active'); const confirmBtn = document.getElementById('confirmDeleteModalBtn'); const newBtn = confirmBtn.cloneNode(true); confirmBtn.parentNode.replaceChild(newBtn, confirmBtn); newBtn.addEventListener('click', async () => { if (document.getElementById('deleteConfirmInput').value.trim() === currentDeleteTarget) { await executeDeleteRepo(currentDeleteTarget); closeModal('deleteModal'); await loadRepositoriesEnhanced(true); } else showToast('Repository name does not match!', 'error'); }); }
function showCloneModal(repoName) { const repo = allRepositories.find(r => r.name === repoName); if (!repo) return; currentCloneTarget = repo; document.getElementById('cloneUrlText').textContent = repo.clone_url; document.getElementById('cloneCommandText').textContent = repo.clone_url; document.getElementById('cloneModal').classList.add('active'); }
function copyCloneUrl() { if (currentCloneTarget) copyToClipboard(currentCloneTarget.clone_url); }
function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'success')).catch(() => showToast('Failed to copy', 'error')); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); currentDeleteTarget = null; currentCloneTarget = null; }
function updatePagination() { const totalPages = Math.ceil(filteredRepositories.length / itemsPerPage); const container = document.getElementById('paginationContainer'); if (totalPages <= 1) { if (container) container.style.display = 'none'; return; } if (container) container.style.display = 'flex'; document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`; document.getElementById('prevPageBtn').disabled = currentPage === 1; document.getElementById('nextPageBtn').disabled = currentPage === totalPages; }
function changePage(delta) { const totalPages = Math.ceil(filteredRepositories.length / itemsPerPage); const newPage = currentPage + delta; if (newPage >= 1 && newPage <= totalPages) { currentPage = newPage; renderRepositories(); updatePagination(); } }
function showEmptyStateRepos() { const container = document.getElementById('repoListContainerEnhanced'); if (container) container.innerHTML = `<div style="text-align:center; padding:60px"><i class="fas fa-inbox" style="font-size:48px"></i><h3>No repositories found</h3><button class="btn-primary" onclick="navigateTo('create')">Create Repository</button></div>`; }
function showErrorStateRepos(message) { const container = document.getElementById('repoListContainerEnhanced'); if (container) container.innerHTML = `<div style="text-align:center; padding:60px"><i class="fas fa-exclamation-triangle" style="font-size:48px; color:var(--accent-red)"></i><p>${escapeHtml(message)}</p><button class="btn-primary" onclick="loadRepositoriesEnhanced(true)">Retry</button></div>`; }
function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = 'toast'; toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i><span>${escapeHtml(message)}</span>`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000); }
function getRelativeTime(dateString) { const date = new Date(dateString); const now = new Date(); const diffDays = Math.floor((now - date) / 86400000); if (diffDays < 1) return 'today'; if (diffDays < 30) return `${diffDays} days ago`; return date.toLocaleDateString(); }

// =============== ENHANCED UPLOAD SYSTEM ===============
function initUploadHandlers() {
  const dropZone = document.getElementById('dropZone'); const fileInput = document.getElementById('fileInput');
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', async e => { e.preventDefault(); dropZone.classList.remove('drag-over'); const items = e.dataTransfer.items; let files = []; const traverse = async (entry, path = '') => { if (entry.isFile) { const file = await new Promise(r => entry.file(r)); Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name }); files.push(file); } else if (entry.isDirectory) { const reader = entry.createReader(); await new Promise(res => reader.readEntries(async entries => { for (let ent of entries) await traverse(ent, path + entry.name + '/'); res(); })); } }; for (let i = 0; i < items.length; i++) { const entry = items[i].webkitGetAsEntry(); if (entry) await traverse(entry); } selectedFiles = files; updateFileTree(); addSystemLog(`${files.length} files selected`, 'success'); });
  fileInput.addEventListener('change', () => { selectedFiles = Array.from(fileInput.files); updateFileTree(); });
}
function buildFileTree(files) { const tree = {}; files.forEach(file => { const path = file.webkitRelativePath || file.name; const parts = path.split('/'); let current = tree; for (let i = 0; i < parts.length; i++) { const part = parts[i]; if (i === parts.length - 1) { if (!current[part]) current[part] = { type: 'file', name: part, file: file }; } else { if (!current[part]) current[part] = { type: 'folder', name: part, children: {} }; current = current[part].children; } } }); return tree; }
function renderTree(tree, level = 0) { let html = ''; for (const [name, node] of Object.entries(tree)) { const indent = level * 20; if (node.type === 'folder') { html += `<div class="tree-item tree-folder" style="padding-left:${indent}px" onclick="toggleFolder(this)"><i class="fas fa-folder"></i> ${escapeHtml(name)}</div><div class="folder-children" style="padding-left:${indent+20}px">${renderTree(node.children, level + 1)}</div>`; } else { const isGenerated = name === 'README.md' || name === 'LICENSE'; html += `<div class="tree-item tree-file ${isGenerated ? 'generated' : ''}" style="padding-left:${indent}px"><i class="fas fa-file"></i> ${escapeHtml(name)}</div>`; } } return html; }
window.toggleFolder = function(el) { const children = el.nextElementSibling; if (children) children.classList.toggle('open'); };
function updateFileTree() { const container = document.getElementById('fileTreeContainer'); const filesWithGenerated = [...selectedFiles]; if (currentReadmeContent) filesWithGenerated.push({ name: 'README.md', webkitRelativePath: 'README.md' }); if (currentLicenseContent) filesWithGenerated.push({ name: 'LICENSE', webkitRelativePath: 'LICENSE' }); const tree = buildFileTree(filesWithGenerated); container.innerHTML = renderTree(tree, 0); document.querySelector('.preview-tab[data-preview="files"]').innerHTML = `📄 Files (${filesWithGenerated.length})`; document.getElementById('previewFiles').innerHTML = renderTree(tree, 0); }
function generateReadme() { const projectName = document.getElementById('readmeProjectName').value || 'My Project'; const desc = document.getElementById('readmeDesc').value || 'A brief description'; const features = document.getElementById('readmeFeatures').value.split(',').map(f => f.trim()).filter(f => f); const install = document.getElementById('readmeInstall').value || '```bash\nnpm install\n```'; const usage = document.getElementById('readmeUsage').value || '```bash\nnpm start\n```'; const author = document.getElementById('readmeAuthor').value || gitUsername || 'your-username'; let md = `# ${projectName}\n\n${desc}\n\n## ✨ Features\n`; features.forEach(f => md += `- ${f}\n`); md += `\n## 📦 Installation\n\n${install}\n\n## 🚀 Usage\n\n${usage}\n\n## 👤 Author\n\n${author}\n\n## 📄 License\n\n${document.getElementById('addLicenseCheckbox').checked ? 'MIT License' : 'None'}\n`; document.getElementById('readmeMarkdown').value = md; document.getElementById('splitMarkdown').value = md; renderMarkdown(); updateGeneratedFiles(); }
function aiGenerateReadme() { const project = document.getElementById('readmeProjectName').value || 'Project'; generateReadme(); addSystemLog('AI README generated with enhanced template', 'success'); }
function renderMarkdown() { const md = document.getElementById('readmeMarkdown').value; currentReadmeContent = md; const html = marked.parse(md); document.getElementById('markdownPreview').innerHTML = html; document.getElementById('splitPreview').innerHTML = html; document.getElementById('readmePreviewRender').innerHTML = html; updateFileTree(); }
function generateLicense() { const year = new Date().getFullYear(); const name = gitUsername || 'your-username'; currentLicenseContent = `MIT License\n\nCopyright (c) ${year} ${name}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...`; document.getElementById('licensePreviewText').innerText = currentLicenseContent; updateFileTree(); }
function updateGeneratedFiles() { if (document.getElementById('addLicenseCheckbox').checked) generateLicense(); else currentLicenseContent = ''; renderMarkdown(); updateFileTree(); }
async function commitAndUpload() { const repo = document.getElementById('uploadRepo').value.trim(); const branch = document.getElementById('branchName').value.trim(); const msg = document.getElementById('commitMsg').value.trim(); if (!repo) { showToast('Repository required', 'error'); return; } if (!isAuthenticated) { showToast('Please login first', 'error'); return; } showTerminal(); addSystemLog(`Starting upload to ${repo}:${branch}`, 'info'); showProgress(); const allFiles = [...selectedFiles]; if (currentReadmeContent) allFiles.push({ name: 'README.md', content: currentReadmeContent, webkitRelativePath: 'README.md' }); if (currentLicenseContent) allFiles.push({ name: 'LICENSE', content: currentLicenseContent, webkitRelativePath: 'LICENSE' }); let success = 0; for (let i = 0; i < allFiles.length; i++) { const file = allFiles[i]; const path = file.webkitRelativePath || file.name; const percent = ((i / allFiles.length) * 100).toFixed(0); updateProgress(percent, `${i+1}/${allFiles.length} - ${path.substring(0, 40)}`); try { const content = file.content || await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(file); }); await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', { message: msg, content: content, branch: branch }); addSystemLog(`✓ ${path} uploaded`, 'success'); success++; } catch(e) { addSystemLog(`✗ ${path}: ${e.message}`, 'error'); } } updateProgress(100, 'Complete!'); addSystemLog(`Upload completed: ${success}/${allFiles.length} files`, success === allFiles.length ? 'success' : 'warning'); hideProgress(); selectedFiles = []; updateFileTree(); showToast('Upload completed!'); }

// =============== HELPER FUNCTIONS ===============
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// Make functions globally available
window.navigateTo = navigateTo; window.closeModal = closeModal; window.copyCloneUrl = copyCloneUrl; window.toggleFolder = toggleFolder;
