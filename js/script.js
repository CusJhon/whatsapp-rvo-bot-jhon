
    // ========================================
    // REPOFLOW - COMPLETE JAVASCRIPT
    // All Original Functionality Preserved
    // ========================================
    
    // =============== STATE MANAGEMENT ===============
    let gitUsername = "";
    let gitToken = "";
    let isAuthenticated = false;
    let modernFiles = [];
    let extractedFiles = [];
    let activityLog = [];
    let allRepositories = [];
    let currentFilter = 'all';
    let currentPage = 1;
    let itemsPerPage = 10;
    let pinnedRepos = [];
    let currentDeleteTarget = null;
    let currentCloneTarget = null;
    let commitChart = null;
    
    // Gitignore templates
    const gitignoreTemplates = {
      Node: `node_modules/\ndist/\n.env\n.DS_Store\nnpm-debug.log\ncoverage/`,
      Python: `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.pyc\n.pytest_cache/`,
      Java: `*.class\ntarget/\n*.log\n.settings/\n.project\n.classpath`
    };
    
    // Language colors for repository display
    const languageColors = {
      'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
      'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584', 'default': '#8b949e'
    };
    
    // =============== DOM ELEMENTS ===============
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    const collapseToggleBtn = document.getElementById('collapseToggleBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const authBtn = document.getElementById('authBtn');
    const githubUsername = document.getElementById('githubUsername');
    const githubToken = document.getElementById('githubToken');
    const userNameSpan = document.getElementById('userName');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarRole = document.getElementById('sidebarRole');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statsSection = document.getElementById('statsSection');
    const terminalContainer = document.getElementById('terminalContainer');
    const showTerminalBtn = document.getElementById('showTerminalBtn');
    const closeTerminalBtn = document.getElementById('closeTerminalBtn');
    
    // =============== HELPER FUNCTIONS ===============
    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    }
    
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i> ${escapeHtml(message)}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
    
    function addSystemLog(message, type = 'info') {
      const body = document.getElementById('terminalBody');
      if (body) {
        const div = document.createElement('div');
        div.className = `log-${type}`;
        div.style.cssText = `margin-bottom:4px; color:${type === 'success' ? '#2ea043' : type === 'error' ? '#f85149' : type === 'warning' ? '#d29922' : '#79c0ff'}`;
        div.innerHTML = `[${new Date().toLocaleTimeString()}] > ${escapeHtml(message)}`;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
      }
      activityLog.unshift({ message, type, time: new Date() });
      if (activityLog.length > 50) activityLog.pop();
      updateDashboard();
    }
    
    function showTerminal() {
      if (terminalContainer) terminalContainer.style.display = 'block';
      if (showTerminalBtn) showTerminalBtn.style.display = 'none';
    }
    
    function closeTerminal() {
      if (terminalContainer) terminalContainer.style.display = 'none';
      if (showTerminalBtn) showTerminalBtn.style.display = 'flex';
    }
    
    function showModal(modalId) {
      document.getElementById(modalId)?.classList.add('active');
    }
    
    function closeModal(modalId) {
      document.getElementById(modalId)?.classList.remove('active');
    }
    
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    }
    
    // =============== SIDEBAR FUNCTIONS ===============
    let isCollapsed = false;
    let isMobile = window.innerWidth <= 768;
    
    function loadSidebarState() {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null && !isMobile && sidebar) {
        isCollapsed = savedState === 'true';
        if (isCollapsed) sidebar.classList.add('collapsed');
        else sidebar.classList.remove('collapsed');
      }
    }
    
    function saveSidebarState() {
      if (!isMobile) localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
    
    function toggleCollapse() {
      if (isMobile || !sidebar) return;
      isCollapsed = !isCollapsed;
      if (isCollapsed) sidebar.classList.add('collapsed');
      else sidebar.classList.remove('collapsed');
      saveSidebarState();
    }
    
    function openMobileDrawer() {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    
    function closeMobileDrawer() {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    function toggleMobileDrawer() {
      if (sidebar && sidebar.classList.contains('mobile-open')) closeMobileDrawer();
      else openMobileDrawer();
    }
    
    function handleResize() {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 768;
      
      if (isMobile && !wasMobile && sidebar) {
        sidebar.classList.remove('collapsed');
        closeMobileDrawer();
        isCollapsed = false;
      } else if (!isMobile && wasMobile && sidebar) {
        closeMobileDrawer();
        loadSidebarState();
      }
    }
    
    // Sidebar event listeners
    if (collapseToggleBtn) collapseToggleBtn.addEventListener('click', toggleCollapse);
    if (menuToggle) menuToggle.addEventListener('click', toggleMobileDrawer);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileDrawer(); });
    window.addEventListener('resize', handleResize);
    
    // Close mobile drawer when clicking on nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (isMobile) closeMobileDrawer();
      });
    });
    
    // =============== NAVIGATION ===============
    function navigateTo(page) {
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      const targetPage = document.getElementById(`${page}Page`);
      if (targetPage) targetPage.style.display = 'block';
      
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const activeNav = [...document.querySelectorAll('.nav-item')].find(n => n.dataset.page === page);
      if (activeNav) activeNav.classList.add('active');
      
      if (page === 'repos' && isAuthenticated) loadRepositories();
      if (page === 'dashboard') updateDashboard();
      if (page === 'profile') updateProfilePage();
    }
    
    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) navigateTo(page);
      });
    });
    
    document.getElementById('sidebarProfileBtn')?.addEventListener('click', () => navigateTo('profile'));
    document.querySelectorAll('.quick-action-card').forEach(card => {
      card.addEventListener('click', () => {
        const page = card.dataset.page;
        if (page) navigateTo(page);
      });
    });
    
    // =============== AUTHENTICATION ===============
    async function authenticateAndVerify() {
      const user = githubUsername?.value.trim();
      const token = githubToken?.value.trim();
      if (!user || !token) {
        showToast('Username and token required!', 'error');
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
        closeModal('loginModal');
        
        // Update UI
        if (userNameSpan) userNameSpan.textContent = gitUsername;
        if (sidebarName) sidebarName.textContent = gitUsername;
        if (sidebarRole) sidebarRole.textContent = 'Connected to GitHub';
        if (showLoginBtn) showLoginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (statsSection) statsSection.style.display = 'grid';
        if (statusDot) statusDot.classList.add('connected');
        if (statusText) statusText.textContent = 'Connected';
        
        // Update avatar
        if (data.avatar_url) {
          const sidebarAvatar = document.getElementById('sidebarAvatar');
          if (sidebarAvatar) sidebarAvatar.src = data.avatar_url;
        }
        
        await loadRepositories();
        navigateTo('home');
        updateHomeStats();
        showToast(`Welcome ${gitUsername}!`, 'success');
      } catch (err) {
        addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error');
        showToast(err.message, 'error');
      }
    }
    
    function logout() {
      addSystemLog('[SYSTEM] Disconnecting...', 'warning');
      gitUsername = "";
      gitToken = "";
      isAuthenticated = false;
      allRepositories = [];
      
      if (userNameSpan) userNameSpan.textContent = 'Guest';
      if (sidebarName) sidebarName.textContent = 'Guest';
      if (sidebarRole) sidebarRole.textContent = 'Not logged in';
      if (showLoginBtn) showLoginBtn.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (statsSection) statsSection.style.display = 'none';
      if (statusDot) statusDot.classList.remove('connected');
      if (statusText) statusText.textContent = 'Disconnected';
      
      const sidebarAvatar = document.getElementById('sidebarAvatar');
      if (sidebarAvatar) sidebarAvatar.src = 'https://i.ibb.co.com/chGXxvw1/avt.jpg';
      
      navigateTo('home');
      showToast('Logged out', 'info');
    }
    
    // Auth event listeners
    if (showLoginBtn) showLoginBtn.addEventListener('click', () => showModal('loginModal'));
    if (closeLoginModal) closeLoginModal.addEventListener('click', () => closeModal('loginModal'));
    if (authBtn) authBtn.addEventListener('click', authenticateAndVerify);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // =============== GITHUB API ===============
    async function githubRequest(endpoint, method = 'GET', body = null) {
      const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok && res.status !== 204) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message);
      }
      return res.status === 204 ? { success: true } : await res.json();
    }
    
    // =============== CREATE REPOSITORY ===============
    async function executeCreateRepo() {
      const name = document.getElementById('newRepoName')?.value.trim();
      const desc = document.getElementById('repoDesc')?.value || '';
      const isPrivate = document.getElementById('repoPrivate')?.checked || false;
      const initReadme = document.getElementById('initReadme')?.checked || false;
      const gitignore = document.getElementById('gitignoreTemplate')?.value;
      
      if (!name) {
        showToast('Repository name required!', 'error');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
        showToast('Invalid repository name! Use letters, numbers, dots, hyphens, and underscores only.', 'error');
        return;
      }
      
      showTerminal();
      addSystemLog(`[GITHUB] Creating repository "${name}"...`, 'info');
      
      try {
        await githubRequest('/user/repos', 'POST', {
          name, description: desc, private: isPrivate, auto_init: initReadme
        });
        
        // Add .gitignore if selected
        if (gitignore && gitignoreTemplates[gitignore]) {
          try {
            const content = btoa(unescape(encodeURIComponent(gitignoreTemplates[gitignore])));
            await githubRequest(`/repos/${gitUsername}/${name}/contents/.gitignore`, 'PUT', {
              message: 'Add .gitignore',
              content: content,
              branch: 'main'
            });
            addSystemLog(`[SUCCESS] Added .gitignore for ${gitignore}`, 'success');
          } catch (err) {
            addSystemLog(`[WARNING] Could not add .gitignore: ${err.message}`, 'warning');
          }
        }
        
        addSystemLog(`[SUCCESS] Repository "${name}" created!`, 'success');
        document.getElementById('newRepoName').value = '';
        document.getElementById('repoDesc').value = '';
        await loadRepositories();
        showToast(`Repository "${name}" created!`, 'success');
      } catch (err) {
        addSystemLog(`[ERROR] ${err.message}`, 'error');
        showToast(err.message, 'error');
      }
    }
    
    document.getElementById('confirmCreateRepo')?.addEventListener('click', executeCreateRepo);
    
    // =============== DELETE REPOSITORY ===============
    function loadDeleteSelect() {
      const select = document.getElementById('deleteRepoSelect');
      if (select) {
        select.innerHTML = '<option value="">-- Select repository --</option>' + 
          allRepositories.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join('');
      }
    }
    
    function showDeleteModal(repoName) {
      currentDeleteTarget = repoName;
      document.getElementById('deleteRepoNameDisplay').textContent = repoName;
      document.getElementById('deleteConfirmInput').value = '';
      showModal('deleteModal');
    }
    
    async function confirmDeleteFromModal() {
      const input = document.getElementById('deleteConfirmInput')?.value.trim();
      if (input === currentDeleteTarget) {
        await executeDeleteRepo(currentDeleteTarget);
        closeModal('deleteModal');
        await loadRepositories();
      } else {
        showToast('Repository name does not match!', 'error');
      }
    }
    
    async function executeDeleteRepo(repoName) {
      showTerminal();
      addSystemLog(`[DANGER] Deleting ${repoName}...`, 'warning');
      try {
        await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE');
        addSystemLog(`[SUCCESS] Deleted ${repoName}`, 'success');
        await loadRepositories();
        showToast(`Deleted ${repoName}`, 'success');
      } catch (err) {
        addSystemLog(`[ERROR] ${err.message}`, 'error');
        showToast(err.message, 'error');
      }
    }
    
    // Delete page event listeners
    document.getElementById('confirmDeleteName')?.addEventListener('input', (e) => {
      const btn = document.getElementById('confirmDeleteRepoBtn');
      const select = document.getElementById('deleteRepoSelect');
      if (btn && select) {
        btn.disabled = !(select.value && select.value === e.target.value);
      }
    });
    
    document.getElementById('confirmDeleteRepoBtn')?.addEventListener('click', async () => {
      const select = document.getElementById('deleteRepoSelect');
      const confirm = document.getElementById('confirmDeleteName');
      if (select && select.value && confirm && select.value === confirm.value) {
        await executeDeleteRepo(select.value);
        confirm.value = '';
        select.value = '-- Select repository --';
      } else {
        showToast('Repository name does not match!', 'error');
      }
    });
    
    // Modal delete event listeners
    document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('confirmDeleteModalBtn')?.addEventListener('click', confirmDeleteFromModal);
    
    // =============== REPOSITORIES MANAGEMENT ===============
    async function loadRepositories() {
      if (!isAuthenticated) return;
      addSystemLog('[SYSTEM] Fetching repositories...', 'info');
      try {
        let allRepos = [];
        let page = 1;
        while (page <= 10) {
          const repos = await githubRequest(`/user/repos?per_page=100&page=${page}&sort=updated`);
          if (repos && repos.length) {
            allRepos = allRepos.concat(repos);
            page++;
            if (repos.length < 100) break;
          } else break;
        }
        allRepositories = allRepos;
        renderRepositories();
        updateStats();
        updateHomeStats();
        updateProfilePage();
        updateDashboard();
        loadDeleteSelect();
        addSystemLog(`[SUCCESS] Loaded ${allRepositories.length} repositories`, 'success');
      } catch (err) {
        addSystemLog(`[ERROR] ${err.message}`, 'error');
        showEmptyStateRepos(err.message);
      }
    }
    
    function renderRepositories() {
      const container = document.getElementById('repoListContainerEnhanced');
      if (!container) return;
      
      const search = document.getElementById('repoSearchInput')?.value.toLowerCase() || '';
      let filtered = allRepositories.filter(r => r.name.toLowerCase().includes(search) || 
        (r.description && r.description.toLowerCase().includes(search)));
      
      if (currentFilter === 'public') filtered = filtered.filter(r => !r.private);
      if (currentFilter === 'private') filtered = filtered.filter(r => r.private);
      
      filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      const start = (currentPage - 1) * itemsPerPage;
      const paged = filtered.slice(start, start + itemsPerPage);
      
      if (!paged.length && filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No repositories found</p></div>';
        return;
      }
      
      container.innerHTML = paged.map(repo => `
        <div class="card">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div class="pin-badge" data-repo="${escapeHtml(repo.name)}" style="cursor:pointer; color:${pinnedRepos.includes(repo.name) ? 'var(--accent-warning)' : 'var(--text-muted)'}">
                <i class="fas ${pinnedRepos.includes(repo.name) ? 'fa-star' : 'fa-star-o'}"></i>
              </div>
              <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${repo.private ? 'rgba(248,81,73,0.1)' : 'rgba(46,160,67,0.1)'};color:${repo.private ? '#f85149' : '#2ea043'}">
                ${repo.private ? 'Private' : 'Public'}
              </span>
            </div>
            <div style="margin-bottom:12px;">
              <strong style="font-size:16px;"><i class="fab fa-github"></i> ${escapeHtml(repo.name)}</strong>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
              ${escapeHtml(repo.description || 'No description')}
            </p>
            <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);margin-bottom:16px;">
              <span><span class="language-color" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${languageColors[repo.language] || languageColors.default};margin-right:4px;"></span> ${repo.language || 'N/A'}</span>
              <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
              <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
              <span>🕒 ${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="copyToClipboard('${repo.clone_url}')"><i class="fas fa-copy"></i> Copy URL</button>
              <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="showCloneModal('${escapeHtml(repo.name)}')"><i class="fas fa-code-branch"></i> Clone</button>
              <button class="btn btn-danger" style="padding:6px 12px;font-size:12px;" onclick="showDeleteModal('${escapeHtml(repo.name)}')"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
          </div>
        </div>
      `).join('');
      
      document.querySelectorAll('.pin-badge').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePinRepo(el.dataset.repo);
        });
      });
    }
    
    function togglePinRepo(name) {
      if (pinnedRepos.includes(name)) {
        pinnedRepos = pinnedRepos.filter(p => p !== name);
      } else {
        pinnedRepos.push(name);
      }
      localStorage.setItem('pinnedRepos', JSON.stringify(pinnedRepos));
      renderRepositories();
    }
    
    function loadPinnedRepos() {
      const saved = localStorage.getItem('pinnedRepos');
      if (saved) {
        try {
          pinnedRepos = JSON.parse(saved);
        } catch(e) {}
      }
    }
    
    function showEmptyStateRepos(msg) {
      const container = document.getElementById('repoListContainerEnhanced');
      if (container) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load: ${escapeHtml(msg)}</p><button class="btn btn-primary mt-16" onclick="loadRepositories()">Retry</button></div>`;
      }
    }
    
    // Repositories event listeners
    document.getElementById('refreshReposBtn')?.addEventListener('click', () => {
      if (!isAuthenticated) {
        showToast('Please login first', 'warning');
        return;
      }
      const btn = document.getElementById('refreshReposBtn');
      btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
      loadRepositories().finally(() => {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      });
    });
    
    document.getElementById('repoSearchInput')?.addEventListener('input', () => {
      renderRepositories();
    });
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => {
          b.style.background = 'var(--bg-tertiary)';
          b.style.color = 'var(--text-secondary)';
        });
        btn.style.background = 'var(--accent-primary)';
        btn.style.color = 'white';
        currentFilter = btn.dataset.filter;
        renderRepositories();
      });
    });
    
    // =============== CLONE FUNCTIONALITY ===============
    function showCloneModal(repoName) {
      const repo = allRepositories.find(r => r.name === repoName);
      if (repo) {
        currentCloneTarget = repo;
        document.getElementById('cloneUrlText').textContent = repo.clone_url;
        document.getElementById('cloneCommandText').textContent = repo.clone_url;
        showModal('cloneModal');
      }
    }
    
    function copyCloneUrl() {
      if (currentCloneTarget) copyToClipboard(currentCloneTarget.clone_url);
    }
    
    document.getElementById('closeCloneModalBtn')?.addEventListener('click', () => closeModal('cloneModal'));
    document.getElementById('closeCloneModalFooterBtn')?.addEventListener('click', () => closeModal('cloneModal'));
    document.getElementById('copyCloneUrlBtn')?.addEventListener('click', copyCloneUrl);
    
    // =============== UPLOAD SYSTEM ===============
    function handleFilesSelected(files) {
      modernFiles = Array.from(files);
      renderFileList();
      const uploadBtn = document.getElementById('startUploadBtn1');
      if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none';
    }
    
    function renderFileList() {
      const container = document.getElementById('fileListModern1');
      if (!container) return;
      
      if (modernFiles.length === 0) {
        container.style.display = 'none';
        return;
      }
      
      container.style.display = 'block';
      container.innerHTML = modernFiles.map((file, idx) => `
        <div class="file-item">
          <div><i class="fas fa-file"></i> ${escapeHtml(file.name)} <span style="font-size:11px;color:var(--text-muted);">(${formatFileSize(file.size)})</span></div>
          <button class="remove-file" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button>
        </div>
      `).join('');
      
      document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', () => {
          modernFiles.splice(parseInt(btn.dataset.idx), 1);
          renderFileList();
          const uploadBtn = document.getElementById('startUploadBtn1');
          if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none';
        });
      });
    }
    
    async function startModernUpload() {
      const repo = document.getElementById('targetRepoName1')?.value.trim();
      const branch = document.getElementById('branchName1')?.value.trim() || 'main';
      const msg = document.getElementById('commitMsg1')?.value.trim() || 'Upload via RepoFlow';
      
      if (!repo) {
        showToast('Repository name required', 'error');
        return;
      }
      if (!modernFiles.length) {
        showToast('No files selected', 'error');
        return;
      }
      
      showTerminal();
      addSystemLog(`[UPLOAD] Starting to ${gitUsername}/${repo}`, 'info');
      let success = 0, error = 0;
      
      for (const file of modernFiles) {
        addSystemLog(`[UPLOAD] Uploading ${file.name}...`, 'info');
        try {
          let sha = null;
          try {
            const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}?ref=${branch}`, 'GET');
            sha = existing.sha;
          } catch(e) {}
          
          const b64 = await new Promise(resolve => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result.split(',')[1]);
            fr.readAsDataURL(file);
          });
          
          await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}`, 'PUT', {
            message: msg,
            content: b64,
            branch: branch,
            sha: sha
          });
          
          success++;
          addSystemLog(`[SUCCESS] Uploaded ${file.name}`, 'success');
        } catch (err) {
          error++;
          addSystemLog(`[ERROR] Failed to upload ${file.name}: ${err.message}`, 'error');
        }
      }
      
      if (error === 0) {
        addSystemLog(`[SUCCESS] Upload complete! ${success} files uploaded`, 'success');
        showToast(`Successfully uploaded ${success} files!`, 'success');
        modernFiles = [];
        renderFileList();
        document.getElementById('startUploadBtn1').style.display = 'none';
      } else {
        addSystemLog(`[WARNING] Upload completed with ${error} errors`, 'warning');
        showToast(`Uploaded: ${success} success, ${error} failed`, 'warning');
      }
    }
    
    async function handleZipSelected(files) {
      if (!files.length || !files[0].name.endsWith('.zip')) {
        showToast('Only ZIP files supported', 'error');
        return;
      }
      
      const zipFile = files[0];
      const previewContainer = document.getElementById('zipPreviewContainer');
      const uploadBtn = document.getElementById('startUploadBtn2');
      
      if (previewContainer) previewContainer.style.display = 'block';
      if (uploadBtn) uploadBtn.style.display = 'block';
      
      try {
        const zip = await JSZip.loadAsync(zipFile);
        extractedFiles = [];
        
        for (const [path, entry] of Object.entries(zip.files)) {
          if (!entry.dir) {
            const content = await entry.async('blob');
            const file = new File([content], path.split('/').pop(), { type: content.type });
            Object.defineProperty(file, 'webkitRelativePath', { value: path });
            extractedFiles.push(file);
          }
        }
        
        const zipFileList = document.getElementById('zipFileList');
        if (zipFileList) {
          zipFileList.innerHTML = extractedFiles.map(f => 
            `<div class="file-item"><i class="fas fa-file"></i> ${escapeHtml(f.webkitRelativePath || f.name)}</div>`
          ).join('');
        }
        
        addSystemLog(`[ZIP] Extracted ${extractedFiles.length} files`, 'success');
      } catch (e) {
        showToast('Error extracting ZIP file', 'error');
        addSystemLog(`[ERROR] ZIP extraction failed: ${e.message}`, 'error');
      }
    }
    
    async function startModernZipUpload() {
      const repo = document.getElementById('targetRepoName2')?.value.trim();
      const branch = document.getElementById('branchName2')?.value.trim() || 'main';
      const msg = document.getElementById('commitMsg2')?.value.trim() || 'Upload ZIP via RepoFlow';
      
      if (!repo) {
        showToast('Repository name required', 'error');
        return;
      }
      if (!extractedFiles.length) {
        showToast('No ZIP file selected', 'error');
        return;
      }
      
      showTerminal();
      addSystemLog(`[ZIP UPLOAD] Extracting ${extractedFiles.length} files to ${repo}`, 'info');
      let success = 0, error = 0;
      
      for (const file of extractedFiles) {
        const path = file.webkitRelativePath || file.name;
        addSystemLog(`[UPLOAD] Uploading ${path}...`, 'info');
        
        try {
          let sha = null;
          try {
            const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, 'GET');
            sha = existing.sha;
          } catch(e) {}
          
          const b64 = await new Promise(resolve => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result.split(',')[1]);
            fr.readAsDataURL(file);
          });
          
          await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', {
            message: msg,
            content: b64,
            branch: branch,
            sha: sha
          });
          
          success++;
          addSystemLog(`[SUCCESS] Uploaded ${path}`, 'success');
        } catch (err) {
          error++;
          addSystemLog(`[ERROR] Failed to upload ${path}: ${err.message}`, 'error');
        }
      }
      
      addSystemLog(`[ZIP UPLOAD] Complete: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning');
      showToast(`ZIP upload: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning');
      extractedFiles = [];
      document.getElementById('zipPreviewContainer').style.display = 'none';
      document.getElementById('startUploadBtn2').style.display = 'none';
    }
    
    // Upload event listeners
    document.getElementById('startUploadBtn1')?.addEventListener('click', startModernUpload);
    document.getElementById('startUploadBtn2')?.addEventListener('click', startModernZipUpload);
    
    // Dropzone setup
    const dropZone1 = document.getElementById('dropZone1');
    const fileInput1 = document.getElementById('fileInputModern1');
    if (dropZone1 && fileInput1) {
      dropZone1.addEventListener('click', () => fileInput1.click());
      dropZone1.addEventListener('dragover', e => { e.preventDefault(); dropZone1.classList.add('drag-over'); });
      dropZone1.addEventListener('dragleave', () => dropZone1.classList.remove('drag-over'));
      dropZone1.addEventListener('drop', e => { 
        e.preventDefault(); 
        dropZone1.classList.remove('drag-over'); 
        handleFilesSelected(Array.from(e.dataTransfer.files)); 
      });
      fileInput1.addEventListener('change', e => { 
        handleFilesSelected(Array.from(e.target.files)); 
        fileInput1.value = ''; 
      });
    }
    
    const dropZone2 = document.getElementById('dropZone2');
    const fileInput2 = document.getElementById('fileInputModern2');
    if (dropZone2 && fileInput2) {
      dropZone2.addEventListener('click', () => fileInput2.click());
      dropZone2.addEventListener('dragover', e => { e.preventDefault(); dropZone2.classList.add('drag-over'); });
      dropZone2.addEventListener('dragleave', () => dropZone2.classList.remove('drag-over'));
      dropZone2.addEventListener('drop', e => { 
        e.preventDefault(); 
        dropZone2.classList.remove('drag-over'); 
        handleZipSelected(Array.from(e.dataTransfer.files)); 
      });
      fileInput2.addEventListener('change', e => { 
        handleZipSelected(Array.from(e.target.files)); 
        fileInput2.value = ''; 
      });
    }
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        document.querySelectorAll('.mode-container').forEach(c => c.style.display = 'none');
        document.getElementById(`${mode}Container`).style.display = 'block';
      });
    });
    
    // =============== DASHBOARD & STATS ===============
    function updateStats() {
      const totalRepos = allRepositories.length;
      const publicRepos = allRepositories.filter(r => !r.private).length;
      const privateRepos = allRepositories.filter(r => r.private).length;
      const totalStars = allRepositories.reduce((s, r) => s + r.stargazers_count, 0);
      
      document.getElementById('totalRepos').textContent = totalRepos;
      document.getElementById('publicRepos').textContent = publicRepos;
      document.getElementById('privateRepos').textContent = privateRepos;
      document.getElementById('totalStars').textContent = totalStars;
      
      if (commitChart) commitChart.destroy();
      const ctx = document.getElementById('commitChart')?.getContext('2d');
      if (ctx) {
        commitChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: allRepositories.slice(0, 7).map(r => r.name.substring(0, 12)),
            datasets: [{
              label: 'Stars',
              data: allRepositories.slice(0, 7).map(r => r.stargazers_count),
              borderColor: '#2f81f7',
              backgroundColor: 'rgba(47, 129, 247, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { labels: { color: 'var(--text-secondary)' } }
            }
          }
        });
      }
    }
    
    function updateDashboard() {
      const activityDiv = document.getElementById('activityList');
      if (activityDiv && activityLog.length) {
        activityDiv.innerHTML = activityLog.slice(0, 5).map(log => `
          <div class="activity-item">
            <div class="activity-icon"><i class="fas fa-${log.type === 'success' ? 'check-circle' : log.type === 'error' ? 'times-circle' : 'info-circle'}"></i></div>
            <div class="activity-text">${escapeHtml(log.message.substring(0, 80))}</div>
            <div class="activity-time">${new Date(log.time).toLocaleTimeString()}</div>
          </div>
        `).join('');
      }
    }
    
    function updateHomeStats() {
      const totalRepos = allRepositories.length;
      const totalStars = allRepositories.reduce((s, r) => s + r.stargazers_count, 0);
      const totalForks = allRepositories.reduce((s, r) => s + r.forks_count, 0);
      const totalWatchers = allRepositories.reduce((s, r) => s + (r.watchers_count || 0), 0);
      
      document.getElementById('homeTotalRepos').textContent = totalRepos;
      document.getElementById('homeTotalStars').textContent = totalStars;
      document.getElementById('homeTotalForks').textContent = totalForks;
      document.getElementById('homeWatchers').textContent = totalWatchers;
    }
    
    function updateProfilePage() {
      const totalRepos = allRepositories.length;
      const totalStars = allRepositories.reduce((s, r) => s + r.stargazers_count, 0);
      const totalForks = allRepositories.reduce((s, r) => s + r.forks_count, 0);
      
      document.getElementById('profileReposCount').textContent = totalRepos;
      document.getElementById('profileStarsCount').textContent = totalStars;
      document.getElementById('profileForksCount').textContent = totalForks;
      
      if (gitUsername) {
        document.getElementById('profilePageName').textContent = gitUsername;
      }
    }
    
    // =============== THEME TOGGLE ===============
    function initThemeToggle() {
      const themeBtn = document.getElementById('themeToggleBtn');
      const themeIcon = document.getElementById('themeIcon');
      const themeText = document.getElementById('themeText');
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Light Mode';
      }
      
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          document.body.classList.toggle('light-theme');
          const isLight = document.body.classList.contains('light-theme');
          localStorage.setItem('theme', isLight ? 'light' : 'dark');
          if (themeIcon) themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
          if (themeText) themeText.textContent = isLight ? 'Light Mode' : 'Dark Mode';
        });
      }
    }
    
    // =============== TERMINAL EVENT LISTENERS ===============
    if (closeTerminalBtn) closeTerminalBtn.addEventListener('click', closeTerminal);
    if (showTerminalBtn) showTerminalBtn.addEventListener('click', showTerminal);
    
    // =============== INITIALIZATION ===============
    loadPinnedRepos();
    loadSidebarState();
    handleResize();
    initThemeToggle();
    navigateTo('home');
    
    // Add welcome message to terminal
    setTimeout(() => {
      if (document.getElementById('terminalBody')?.children.length === 0 && !isAuthenticated) {
        addSystemLog('[SYSTEM] Welcome to RepoFlow Pro!', 'success');
        addSystemLog('[SYSTEM] Please login to manage your GitHub repositories', 'info');
      }
    }, 500);
    
    // Make functions global for onclick handlers
    window.navigateTo = navigateTo;
    window.copyToClipboard = copyToClipboard;
    window.showDeleteModal = showDeleteModal;
    window.showCloneModal = showCloneModal;
    window.loadRepositories = loadRepositories;
  