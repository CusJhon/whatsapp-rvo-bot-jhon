// ========================================
// REPOFLOW - COMPLETE APPLICATION
// All original functionality preserved
// ========================================

// =============== STATE MANAGEMENT ===============
let gitUsername = "";
let gitToken = "";
let isAuthenticated = false;
let activityLog = [];
let chartInstance = null;

// Upload State
let modernFiles = [];
let currentView = 'list';
let currentMode = 'mode1';
let extractedZipFiles = [];
let currentZipFile = null;

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
const languageColors = {
  'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
  'Java': '#b07219', 'Go': '#00ADD8', 'default': '#8b949e'
};

// =============== DOM Elements ===============
let sidebar, menuToggle, pagesContainer, terminalContainer, terminalBody;
let progressWrapper, progressFill, progressPercent, progressText;

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
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
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Quick action buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Mode Tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode1Container = document.getElementById('mode1Container');
      const mode2Container = document.getElementById('mode2Container');
      if (mode1Container) mode1Container.style.display = mode === 'mode1' ? 'block' : 'none';
      if (mode2Container) mode2Container.style.display = mode === 'mode2' ? 'block' : 'none';
      currentMode = mode;
    });
  });

  // FAQ Toggle
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      faqItem.classList.toggle('active');
    });
  });

  // Login button
  const showLoginBtn = document.getElementById('showLoginBtn');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      const loginCard = document.getElementById('loginCard');
      if (loginCard) loginCard.classList.add('active');
    });
  }

  // Auth button
  const authBtn = document.getElementById('authBtn');
  if (authBtn) authBtn.addEventListener('click', authenticateAndVerify);

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Create repo button
  const createRepoBtn = document.getElementById('confirmCreateRepo');
  if (createRepoBtn) createRepoBtn.addEventListener('click', executeCreateRepo);

  // Delete repo button
  const deleteRepoBtn = document.getElementById('confirmDeleteRepoBtn');
  if (deleteRepoBtn) deleteRepoBtn.addEventListener('click', executeDeleteFromPage);

  // Setup Upload Handlers
  initUploadHandlers();
  setupMode1UploadHandlers();
  setupMode2UploadHandlers();

  // Setup Repositories
  initRepositoriesHandlers();

  // Close terminal
  const closeTerminalBtn = document.getElementById('closeTerminalBtn');
  if (closeTerminalBtn) {
    closeTerminalBtn.addEventListener('click', () => {
      if (terminalContainer) terminalContainer.style.display = 'none';
    });
  }

  // Theme toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
    });
  }

  // Check saved theme
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
  }

  // Initial terminal welcome
  setTimeout(() => {
    if (terminalBody && terminalBody.children.length === 0) {
      startTerminalWelcome();
    }
  }, 500);
});

// =============== TERMINAL FUNCTIONS ===============
function showTerminal() {
  if (terminalContainer) terminalContainer.style.display = 'block';
  scrollTerminalToBottom();
}

function addTerminalLog(message, type = 'info') {
  if (!terminalBody) return;
  const logDiv = document.createElement('div');
  logDiv.className = `log-line log-${type}`;
  logDiv.innerHTML = message;
  terminalBody.appendChild(logDiv);
  scrollTerminalToBottom();

  activityLog.unshift({ message, type, time: new Date() });
  if (activityLog.length > 20) activityLog.pop();
  updateDashboard();
}

function addSystemLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  addTerminalLog(`[${timestamp}] > ${message}`, type);
}

function scrollTerminalToBottom() {
  if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
}

function updateProgress(percent, text) {
  if (progressFill) progressFill.style.width = percent + '%';
  if (progressPercent) progressPercent.textContent = percent + '%';
  if (progressText) progressText.textContent = text;
}

function showProgress() { if (progressWrapper) progressWrapper.style.display = 'block'; }
function hideProgress() { if (progressWrapper) progressWrapper.style.display = 'none'; updateProgress(0, 'Idle'); }

function startTerminalWelcome() {
  const welcomeLines = [
    "> ╔══════════════════════════════════════════════════════════════╗",
    "> ║     RepoFlow Terminal v2.0 - GitHub Manager Premium        ║",
    "> ║     Live terminal ready | 2 Mode Upload Available          ║",
    "> ║     Created by: JHON PRODUCTION                            ║",
    "> ╚══════════════════════════════════════════════════════════════╝",
    "> [SYSTEM] Ready for operations..."
  ];
  welcomeLines.forEach(line => addTerminalLog(line, 'info'));
}

// =============== NAVIGATION ===============
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) item.classList.add('active');
  });

  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  const pageMap = {
    home: 'homePage', dashboard: 'dashboardPage', create: 'createPage',
    delete: 'deletePage', upload: 'uploadPage', repos: 'reposPage'
  };

  const pageId = pageMap[page];
  if (pageId) {
    const pageElement = document.getElementById(pageId);
    if (pageElement) pageElement.style.display = 'block';
  }

  if (page === 'repos' && isAuthenticated) {
    loadRepositoriesEnhanced();
  }
  if (page === 'dashboard' && isAuthenticated) updateDashboard();
}

function updateDashboard() {
  const activityList = document.getElementById('activityList');
  if (activityList) {
    if (activityLog.length === 0) activityList.innerHTML = '<div class="activity-item">Belum ada aktivitas</div>';
    else {
      activityList.innerHTML = activityLog.slice(0, 5).map(log =>
        `<div class="activity-item">${escapeHtml(log.message.substring(0, 80))}</div>`
      ).join('');
    }
  }
}

// =============== GITHUB API ===============
async function githubRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message);
  }
  return response.status === 204 ? { success: true } : await response.json();
}

// =============== AUTHENTICATION ===============
async function authenticateAndVerify() {
  const user = document.getElementById('githubUsername')?.value.trim();
  const token = document.getElementById('githubToken')?.value.trim();

  if (!user || !token) {
    showAuthStatus('Username and token required!', 'error');
    return;
  }

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

    const loginCard = document.getElementById('loginCard');
    if (loginCard) loginCard.classList.remove('active');
    if (pagesContainer) pagesContainer.style.display = 'block';

    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = gitUsername;

    const showLoginBtn = document.getElementById('showLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (showLoginBtn) showLoginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';

    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.classList.add('connected');
      const span = connectionStatus.querySelector('span');
      if (span) span.textContent = 'Connected';
    }

    await loadRepositoriesEnhanced();
    navigateTo('home');
    addSystemLog('[READY] System online. Select an operation.', 'success');

    // Update chart with sample data
    updateChart();

  } catch (err) {
    addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error');
    showAuthStatus(err.message, 'error');
  }
}

function showAuthStatus(message, type) {
  const statusDiv = document.getElementById('authStatus');
  if (statusDiv) {
    statusDiv.innerHTML = `<div style="color: ${type === 'error' ? '#ef4444' : '#10b981'}">${escapeHtml(message)}</div>`;
    setTimeout(() => { if (statusDiv) statusDiv.innerHTML = ''; }, 3000);
  }
}

function logout() {
  addSystemLog('[SYSTEM] Disconnecting from GitHub...', 'warning');
  gitUsername = "";
  gitToken = "";
  isAuthenticated = false;
  modernFiles = [];

  const loginCard = document.getElementById('loginCard');
  if (loginCard) loginCard.classList.add('active');
  if (pagesContainer) pagesContainer.style.display = 'none';
  if (terminalContainer) terminalContainer.style.display = 'none';

  const userNameSpan = document.getElementById('userName');
  if (userNameSpan) userNameSpan.textContent = 'Guest';

  const showLoginBtn = document.getElementById('showLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  if (showLoginBtn) showLoginBtn.style.display = 'flex';
  if (logoutBtn) logoutBtn.style.display = 'none';

  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.classList.remove('connected');
    const span = connectionStatus.querySelector('span');
    if (span) span.textContent = 'Disconnected';
  }
}

// =============== CREATE REPOSITORY ===============
async function executeCreateRepo() {
  const name = document.getElementById('newRepoName')?.value.trim();
  const desc = document.getElementById('repoDesc')?.value || '';
  const isPrivate = document.getElementById('repoPrivate')?.checked || false;

  if (!name) {
    addSystemLog('[ERROR] Repository name required!', 'error');
    return;
  }

  showTerminal();
  addSystemLog('[GITHUB] Creating new repository...', 'info');
  showProgress();
  updateProgress(30, 'Creating repository...');

  try {
    await githubRequest('/user/repos', 'POST', {
      name, description: desc, private: isPrivate, auto_init: false
    });
    addSystemLog(`[SUCCESS] Repository "${name}" created successfully!`, 'success');

    document.getElementById('newRepoName').value = '';
    document.getElementById('repoDesc').value = '';
    document.getElementById('repoPrivate').checked = false;

    await loadRepositoriesEnhanced(true);
    updateProgress(100, 'Complete!');
    setTimeout(() => hideProgress(), 1500);
  } catch (err) {
    addSystemLog(`[ERROR] Failed: ${err.message}`, 'error');
    hideProgress();
  }
}

// =============== DELETE REPOSITORY ===============
async function deleteRepository(repoName) {
  return await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE');
}

async function executeDeleteFromPage() {
  const repoName = document.getElementById('deleteRepoName')?.value.trim();
  const confirmName = document.getElementById('confirmDeleteName')?.value.trim();

  if (!repoName) { addSystemLog('[ERROR] Repository name required!', 'error'); return; }
  if (repoName !== confirmName) { addSystemLog('[ERROR] Repository name confirmation mismatch!', 'error'); return; }

  await executeDeleteRepo(repoName);
  document.getElementById('deleteRepoName').value = '';
  document.getElementById('confirmDeleteName').value = '';
}

async function executeDeleteRepo(repoName) {
  showTerminal();
  addSystemLog('[DANGER] Initiating repository deletion sequence...', 'warning');
  addSystemLog(`[TARGET] Repository: ${repoName}`, 'info');
  showProgress();
  updateProgress(50, 'Deleting repository...');

  try {
    await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE');
    addSystemLog(`[SUCCESS] Repository "${repoName}" has been permanently deleted!`, 'success');
    updateProgress(100, 'Complete!');
    hideProgress();
    await loadRepositoriesEnhanced(true);
    addSystemLog('[SYSTEM] Repository list updated', 'success');
  } catch (err) {
    addSystemLog(`[ERROR] Deletion failed: ${err.message}`, 'error');
    hideProgress();
  }
}

// =============== ENHANCED REPOSITORIES SYSTEM ===============
function initRepositoriesHandlers() {
  const searchInput = document.getElementById('repoSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      applyFiltersAndSort();
    }, 300));
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFiltersAndSort();
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndSort();
    });
  }

  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function loadRepositoriesEnhanced(forceRefresh = false) {
  if (!isAuthenticated) return;

  addSystemLog('[SYSTEM] Fetching repositories from GitHub API...', 'info');

  try {
    let allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const repos = await githubRequest(`/user/repos?per_page=100&page=${page}&sort=updated&direction=desc`, 'GET');
      if (repos && repos.length > 0) {
        allRepos = allRepos.concat(repos);
        page++;
        if (repos.length < 100) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    if (allRepos.length === 0) {
      showEmptyStateRepos();
      return;
    }

    allRepositories = allRepos;
    addSystemLog(`[SYSTEM] Loaded ${allRepos.length} repositories`, 'success');
    applyFiltersAndSort();
    updateStatsRepos();
    updateChart();

  } catch (err) {
    addSystemLog(`[ERROR] Failed to load repositories: ${err.message}`, 'error');
    showErrorStateRepos(err.message);
  }
}

function updateChart() {
  const ctx = document.getElementById('commitChart');
  if (!ctx) return;

  if (chartInstance) chartInstance.destroy();

  const labels = allRepositories.slice(0, 7).map(r => r.name.substring(0, 12));
  const starsData = allRepositories.slice(0, 7).map(r => r.stargazers_count);

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Stars',
        data: starsData,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: 'var(--text-primary)' } } }
    }
  });
}

function applyFiltersAndSort() {
  let filtered = [...allRepositories];

  if (currentFilter === 'public') {
    filtered = filtered.filter(repo => !repo.private);
  } else if (currentFilter === 'private') {
    filtered = filtered.filter(repo => repo.private);
  }

  const searchTerm = document.getElementById('repoSearchInput')?.value.toLowerCase() || '';
  if (searchTerm) {
    filtered = filtered.filter(repo =>
      repo.name.toLowerCase().includes(searchTerm) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm))
    );
  }

  filtered.sort((a, b) => {
    switch (currentSort) {
      case 'name': return a.name.localeCompare(b.name);
      case 'stars': return b.stargazers_count - a.stargazers_count;
      case 'updated':
      default: return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });

  const pinned = filtered.filter(repo => pinnedRepos.includes(repo.name));
  const unpinned = filtered.filter(repo => !pinnedRepos.includes(repo.name));
  filteredRepositories = [...pinned, ...unpinned];

  updatePagination();
  renderRepositories();
}

function updateStatsRepos() {
  const statsHeader = document.getElementById('repoStatsHeader');
  if (statsHeader) statsHeader.style.display = 'flex';

  const totalRepos = document.getElementById('totalReposCount');
  const totalStars = document.getElementById('totalStarsCount');
  const totalForks = document.getElementById('totalForksCount');

  if (totalRepos) totalRepos.textContent = allRepositories.length;
  if (totalStars) totalStars.textContent = allRepositories.reduce((sum, r) => sum + r.stargazers_count, 0);
  if (totalForks) totalForks.textContent = allRepositories.reduce((sum, r) => sum + r.forks_count, 0);
}

function renderRepositories() {
  const container = document.getElementById('repoListContainerEnhanced');
  if (!container) return;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageRepos = filteredRepositories.slice(startIdx, endIdx);

  if (pageRepos.length === 0 && filteredRepositories.length === 0) {
    showEmptyStateRepos();
    return;
  }

  container.innerHTML = pageRepos.map(repo => createRepoCard(repo)).join('');
  attachRepoEventListeners();
}

function createRepoCard(repo) {
  const isPinned = pinnedRepos.includes(repo.name);
  const lastUpdated = getRelativeTime(repo.updated_at);
  const sizeMB = (repo.size / 1024).toFixed(1);
  const language = repo.language || 'Unknown';
  const languageColor = languageColors[language] || languageColors.default;

  return `
    <div class="repo-card-enhanced" data-repo-name="${escapeHtml(repo.name)}">
      <div class="pin-badge" data-repo="${escapeHtml(repo.name)}">
        <i class="fas ${isPinned ? 'fa-star' : 'fa-star-o'}"></i>
      </div>
      <div class="repo-header-enhanced">
        <div class="repo-name-enhanced">
          <i class="fas fa-book"></i>
          <a href="${repo.html_url}" target="_blank">${escapeHtml(repo.name)}</a>
        </div>
        <div class="visibility-badge ${repo.private ? 'private' : 'public'}">
          ${repo.private ? 'Private' : 'Public'}
        </div>
      </div>
      <div class="repo-desc-enhanced">
        ${escapeHtml(repo.description || 'No description provided')}
      </div>
      <div class="repo-meta-enhanced">
        ${language !== 'Unknown' ? `<div class="language-indicator"><span class="language-color" style="background: ${languageColor};"></span><span>${escapeHtml(language)}</span></div>` : ''}
        <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
        <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
        <span><i class="fas fa-clock"></i> ${lastUpdated}</span>
        <span><i class="fas fa-database"></i> ${sizeMB} MB</span>
      </div>
      <div class="repo-actions-enhanced">
        <button class="repo-action-btn" data-action="open" data-url="${repo.html_url}"><i class="fab fa-github"></i> Open</button>
        <button class="repo-action-btn" data-action="clone" data-repo="${escapeHtml(repo.name)}" data-url="${repo.clone_url}"><i class="fas fa-code-branch"></i> Clone</button>
        <button class="repo-action-btn" data-action="copy" data-url="${repo.clone_url}"><i class="fas fa-copy"></i> Copy URL</button>
        <button class="repo-action-btn danger" data-action="delete" data-repo="${escapeHtml(repo.name)}"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
    </div>
  `;
}

function attachRepoEventListeners() {
  document.querySelectorAll('.pin-badge').forEach(btn => {
    btn.removeEventListener('click', handlePinClick);
    btn.addEventListener('click', handlePinClick);
  });

  document.querySelectorAll('.repo-action-btn').forEach(btn => {
    btn.removeEventListener('click', handleActionClick);
    btn.addEventListener('click', handleActionClick);
  });
}

function handlePinClick(e) {
  e.stopPropagation();
  const repoName = this.dataset.repo;
  if (pinnedRepos.includes(repoName)) {
    pinnedRepos = pinnedRepos.filter(p => p !== repoName);
  } else {
    pinnedRepos.push(repoName);
  }
  localStorage.setItem('pinnedRepos', JSON.stringify(pinnedRepos));
  applyFiltersAndSort();
  showToast(`${pinnedRepos.includes(repoName) ? 'Pinned' : 'Unpinned'} ${repoName}`, 'success');
}

function handleActionClick(e) {
  const action = this.dataset.action;
  const repoName = this.dataset.repo;
  const url = this.dataset.url;

  switch (action) {
    case 'open': if (url) window.open(url, '_blank'); break;
    case 'clone': if (repoName) showCloneModal(repoName); break;
    case 'copy': if (url) copyToClipboard(url); break;
    case 'delete': if (repoName) showDeleteModal(repoName); break;
  }
}

function showDeleteModal(repoName) {
  currentDeleteTarget = repoName;
  const modal = document.getElementById('deleteModal');
  const displaySpan = document.getElementById('deleteRepoNameDisplay');
  const confirmInput = document.getElementById('deleteConfirmInput');

  if (displaySpan) displaySpan.textContent = repoName;
  if (confirmInput) confirmInput.value = '';

  if (modal) modal.classList.add('active');

  const confirmBtn = document.getElementById('confirmDeleteModalBtn');
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', async () => {
      const inputValue = document.getElementById('deleteConfirmInput')?.value.trim();
      if (inputValue === currentDeleteTarget) {
        await executeDeleteRepo(currentDeleteTarget);
        closeModal('deleteModal');
        await loadRepositoriesEnhanced(true);
      } else {
        showToast('Repository name does not match!', 'error');
      }
    });
  }
}

function showCloneModal(repoName) {
  const repo = allRepositories.find(r => r.name === repoName);
  if (!repo) return;

  currentCloneTarget = repo;
  const modal = document.getElementById('cloneModal');
  const urlText = document.getElementById('cloneUrlText');
  const commandText = document.getElementById('cloneCommandText');

  if (urlText) urlText.textContent = repo.clone_url;
  if (commandText) commandText.textContent = repo.clone_url;

  if (modal) modal.classList.add('active');
}

function copyCloneUrl() {
  if (currentCloneTarget) {
    copyToClipboard(currentCloneTarget.clone_url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  currentDeleteTarget = null;
  currentCloneTarget = null;
}

function updatePagination() {
  const totalPages = Math.ceil(filteredRepositories.length / itemsPerPage);
  const container = document.getElementById('paginationContainer');

  if (totalPages <= 1) {
    if (container) container.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'flex';

  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function changePage(delta) {
  const totalPages = Math.ceil(filteredRepositories.length / itemsPerPage);
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderRepositories();
    updatePagination();
  }
}

function showEmptyStateRepos() {
  const container = document.getElementById('repoListContainerEnhanced');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state-enhanced" style="text-align:center; padding:60px">
      <i class="fas fa-inbox" style="font-size:48px"></i>
      <h3>No repositories found</h3>
      <p>Create your first repository to get started</p>
      <button class="btn-primary" onclick="navigateTo('create')"><i class="fas fa-plus-circle"></i> Create Repository</button>
    </div>
  `;
}

function showErrorStateRepos(message) {
  const container = document.getElementById('repoListContainerEnhanced');
  if (!container) return;

  container.innerHTML = `
    <div class="error-state" style="text-align:center; padding:60px">
      <i class="fas fa-exclamation-triangle" style="font-size:48px; color:var(--accent-red)"></i>
      <p>Failed to load repositories</p>
      <p style="font-size:12px">${escapeHtml(message)}</p>
      <button class="btn-primary" onclick="loadRepositoriesEnhanced(true)"><i class="fas fa-sync-alt"></i> Retry</button>
    </div>
  `;
}

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i><span>${escapeHtml(message)}</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// =============== ENHANCED UPLOAD SYSTEM ===============
function initUploadHandlers() {
  const dropZone1 = document.getElementById('dropZone1');
  const fileInput1 = document.getElementById('fileInputModern1');
  const dropZone2 = document.getElementById('dropZone2');
  const fileInput2 = document.getElementById('fileInputModern2');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderFileList();
    });
  });

  if (dropZone1 && fileInput1) {
    setupDropZone(dropZone1, fileInput1, handleFilesSelected);
  }

  if (dropZone2 && fileInput2) {
    setupDropZone(dropZone2, fileInput2, handleZipSelected);
  }
}

function setupDropZone(dropZone, fileInput, onFilesSelect) {
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    onFilesSelect(files);
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    onFilesSelect(files);
    fileInput.value = '';
  });
}

function handleFilesSelected(files) {
  const existingNames = new Set(modernFiles.map(f => f.file.name));

  for (const file of files) {
    if (!existingNames.has(file.name)) {
      modernFiles.push({
        file: file,
        preview: null,
        status: 'pending',
        progress: 0
      });
    }
  }

  generatePreviews();
  updateUIFiles();
}

async function generatePreviews() {
  for (let i = 0; i < modernFiles.length; i++) {
    const item = modernFiles[i];
    if (item.preview !== null) continue;

    const file = item.file;
    if (file.type.startsWith('image/')) {
      item.preview = await generateImagePreview(file);
    } else {
      item.preview = getFileIcon(file);
    }
  }
  renderFileList();
}

function generateImagePreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(getFileIcon(file));
    reader.readAsDataURL(file);
  });
}

function getFileIcon(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const iconMap = {
    '.pdf': 'fas fa-file-pdf', '.zip': 'fas fa-file-archive',
    '.mp3': 'fas fa-file-audio', '.mp4': 'fas fa-file-video'
  };
  return iconMap[ext] || 'fas fa-file';
}

function renderFileList() {
  const container = document.getElementById('fileListModern1');
  const header = document.getElementById('fileListHeader');
  const commitPreview = document.getElementById('commitPreview');
  const uploadBtn = document.getElementById('startUploadBtn1');

  if (!container) return;

  if (modernFiles.length === 0) {
    container.innerHTML = `<div class="empty-state" style="text-align:center; padding:40px"><i class="fas fa-inbox"></i><p>Belum ada file yang dipilih</p></div>`;
    if (header) header.style.display = 'none';
    if (commitPreview) commitPreview.style.display = 'none';
    if (uploadBtn) uploadBtn.style.display = 'none';
    return;
  }

  if (header) header.style.display = 'flex';
  if (commitPreview) commitPreview.style.display = 'block';
  if (uploadBtn) uploadBtn.style.display = 'block';

  document.getElementById('fileCount').textContent = modernFiles.length;
  const totalBytes = modernFiles.reduce((sum, f) => sum + f.file.size, 0);
  document.getElementById('totalSize').textContent = formatFileSize(totalBytes);

  const commitFileList = document.getElementById('commitFileList');
  if (commitFileList) {
    commitFileList.innerHTML = modernFiles.map(f =>
      `<div><i class="fas fa-file"></i> ${escapeHtml(f.file.name)} (${formatFileSize(f.file.size)})</div>`
    ).join('');
  }

  container.className = `file-list-container ${currentView}-view`;

  container.innerHTML = modernFiles.map((item, idx) => {
    const file = item.file;
    let previewHtml = '';
    if (item.preview && item.preview.startsWith('data:')) {
      previewHtml = `<img src="${item.preview}" style="width:100%;height:100%;object-fit:cover">`;
    } else {
      previewHtml = `<i class="${item.preview || 'fas fa-file'}"></i>`;
    }

    let progressHtml = '';
    if (item.status === 'uploading') {
      progressHtml = `<div class="upload-progress"><div class="progress-bar-item"><div class="progress-fill-item" style="width:${item.progress}%"></div></div><div class="upload-status">Uploading... ${item.progress}%</div></div>`;
    }

    return `
      <div class="file-item ${currentView}-view">
        <div class="file-preview">${previewHtml}</div>
        <div class="file-info"><div class="file-name">${escapeHtml(file.name)}</div><div class="file-size">${formatFileSize(file.size)}</div>${progressHtml}</div>
        <div class="file-actions"><button class="remove-file" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.idx);
      if (!isNaN(idx)) {
        modernFiles.splice(idx, 1);
        renderFileList();
      }
    });
  });
}

function updateUIFiles() {
  renderFileList();
}

async function handleZipSelected(files) {
  if (files.length === 0) return;

  const zipFile = files[0];
  if (!zipFile.name.toLowerCase().endsWith('.zip')) {
    showToast('Only ZIP files are supported', 'error');
    return;
  }

  const container = document.getElementById('zipPreviewContainer');
  const uploadBtn = document.getElementById('startUploadBtn2');

  if (container) container.style.display = 'block';
  if (uploadBtn) uploadBtn.style.display = 'block';

  currentZipFile = zipFile;
  await extractAndShowZipTree(zipFile);
}

async function extractAndShowZipTree(zipFile) {
  const treeContainer = document.getElementById('zipTreeView');
  const fileCountSpan = document.getElementById('zipFileCount');

  if (!treeContainer) return;

  treeContainer.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-pulse"></i> Extracting ZIP...</div>';

  try {
    const zip = await JSZip.loadAsync(zipFile);
    const files = [];
    const structure = {};

    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        files.push(path);
        const parts = path.split('/');
        let current = structure;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            current[part] = { type: 'file', name: part };
          } else {
            if (!current[part]) current[part] = { type: 'folder', name: part, children: {} };
            current = current[part].children;
          }
        }
      }
    }

    if (fileCountSpan) fileCountSpan.textContent = files.length;
    treeContainer.innerHTML = renderTree(structure);

    extractedZipFiles = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const content = await entry.async('blob');
        const file = new File([content], path.split('/').pop(), { type: content.type });
        Object.defineProperty(file, 'webkitRelativePath', { value: path });
        extractedZipFiles.push(file);
      }
    }

  } catch (err) {
    treeContainer.innerHTML = `<div style="color:var(--accent-red)">Error: ${err.message}</div>`;
  }
}

function renderTree(structure, level = 0) {
  let html = '';
  const indent = level * 20;

  for (const [name, item] of Object.entries(structure)) {
    const style = `padding-left: ${indent}px;`;
    if (item.type === 'folder') {
      html += `<div class="tree-item tree-folder" style="${style}"><i class="fas fa-folder"></i> ${escapeHtml(name)}</div>`;
      html += renderTree(item.children, level + 1);
    } else {
      html += `<div class="tree-item tree-file" style="${style}"><i class="fas fa-file"></i> ${escapeHtml(name)}</div>`;
    }
  }
  return html;
}

async function startModernUpload() {
  const repo = document.getElementById('targetRepoName1')?.value.trim();
  const msg = document.getElementById('commitMsg1')?.value.trim() || "Upload files via RepoFlow";

  if (!repo) { addSystemLog('[ERROR] Target repository required!', 'error'); return; }
  if (modernFiles.length === 0) { addSystemLog('[ERROR] No files selected!', 'error'); return; }

  showTerminal();
  addSystemLog('[UPLOAD] Starting upload...', 'info');
  addSystemLog(`[TARGET] ${gitUsername}/${repo}`, 'info');
  addSystemLog(`[FILES] Total: ${modernFiles.length} files`, 'info');
  showProgress();

  let success = 0;
  let error = 0;

  for (let i = 0; i < modernFiles.length; i++) {
    const item = modernFiles[i];
    const file = item.file;

    item.status = 'uploading';
    item.progress = 0;
    renderFileList();

    const percent = ((i / modernFiles.length) * 100).toFixed(1);
    updateProgress(percent, `${i+1}/${modernFiles.length} - ${file.name}`);

    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) { progress += 10; item.progress = progress; renderFileList(); }
    }, 100);

    try {
      const base64 = await fileToBase64(file);
      await uploadSingleFile(repo, file.name, base64, `${msg} (${i+1}/${modernFiles.length})`);
      success++;
      item.status = 'success';
      addSystemLog(`[SUCCESS] Uploaded: ${file.name}`, 'success');
    } catch (err) {
      error++;
      item.status = 'error';
      addSystemLog(`[ERROR] Failed: ${file.name} - ${err.message}`, 'error');
    }

    clearInterval(progressInterval);
    renderFileList();
    await new Promise(r => setTimeout(r, 200));
  }

  updateProgress(100, 'Complete!');
  addSystemLog(`[SUCCESS] Upload completed: ${success} success, ${error} failed`, success === modernFiles.length ? 'success' : 'warning');

  modernFiles = [];
  renderFileList();
  setTimeout(() => hideProgress(), 2000);
}

async function startModernZipUpload() {
  const repo = document.getElementById('targetRepoName2')?.value.trim();
  const msg = document.getElementById('commitMsg2')?.value.trim() || "Upload archive via RepoFlow";

  if (!repo) { addSystemLog('[ERROR] Target repository required!', 'error'); return; }
  if (!extractedZipFiles || extractedZipFiles.length === 0) { addSystemLog('[ERROR] No ZIP file loaded!', 'error'); return; }

  showTerminal();
  addSystemLog('[UPLOAD MODE 2] Starting archive upload...', 'info');
  addSystemLog(`[TARGET] ${gitUsername}/${repo}`, 'info');
  addSystemLog(`[ARCHIVE] ${extractedZipFiles.length} files`, 'info');
  showProgress();

  let success = 0;
  let error = 0;

  for (let i = 0; i < extractedZipFiles.length; i++) {
    const file = extractedZipFiles[i];
    const filePath = file.webkitRelativePath || file.name;
    const percent = ((i / extractedZipFiles.length) * 100).toFixed(1);
    updateProgress(percent, `${i+1}/${extractedZipFiles.length} - ${filePath.substring(0, 40)}`);

    try {
      const base64 = await fileToBase64(file);
      await uploadSingleFile(repo, filePath, base64, `${msg} (${i+1}/${extractedZipFiles.length})`);
      success++;
      addSystemLog(`[SUCCESS] Uploaded: ${filePath}`, 'success');
    } catch (err) {
      error++;
      addSystemLog(`[ERROR] Failed: ${filePath} - ${err.message}`, 'error');
    }
    await new Promise(r => setTimeout(r, 100));
  }

  updateProgress(100, 'Complete!');
  addSystemLog(`[SUCCESS] Archive upload completed: ${success} success, ${error} failed`, 'success');
  extractedZipFiles = [];
  document.getElementById('zipPreviewContainer').style.display = 'none';
  document.getElementById('startUploadBtn2').style.display = 'none';
  setTimeout(() => hideProgress(), 2000);
}

function setupMode1UploadHandlers() {
  const startBtn = document.getElementById('startUploadBtn1');
  if (startBtn) {
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    newBtn.addEventListener('click', startModernUpload);
  }
}

function setupMode2UploadHandlers() {
  const startBtn = document.getElementById('startUploadBtn2');
  if (startBtn) {
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    newBtn.addEventListener('click', startModernZipUpload);
  }
}

async function uploadSingleFile(repo, filePath, content, msg) {
  const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodedPath}`, 'PUT', {
    message: msg, content: content, branch: "main"
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

// =============== HELPER FUNCTIONS ===============
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available
window.navigateTo = navigateTo;
window.loadRepositoriesEnhanced = loadRepositoriesEnhanced;
window.executeDeleteRepo = executeDeleteRepo;
window.closeModal = closeModal;
window.copyCloneUrl = copyCloneUrl;