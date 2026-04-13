
    // ========================================
    // REPOFLOW - COMPLETE JAVASCRIPT
    // All Original Functionality Preserved
    // ========================================
    
    // STATE MANAGEMENT
    let gitUsername = "", gitToken = "", isAuthenticated = false;
    let modernFiles = [], extractedFiles = [], activityLog = [], allRepositories = [];
    let currentFilter = 'all', currentPage = 1, itemsPerPage = 10, pinnedRepos = [];
    let currentDeleteTarget = null, currentCloneTarget = null, commitChart = null;
    let currentTemplate = 'cyberpunk';
    let features = [""];
    let techStack = [];
    let previewImages = [""];
    
    const gitignoreTemplates = {
      Node: `node_modules/\ndist/\n.env\n.DS_Store\nnpm-debug.log\ncoverage/`,
      Python: `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.pyc\n.pytest_cache/`,
      Java: `*.class\ntarget/\n*.log\n.settings/\n.project\n.classpath`
    };
    
    const languageColors = {
      'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
      'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584', 'default': '#8b949e'
    };
    
    // Helper Functions
    function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
    function formatFileSize(bytes) { if (bytes === 0) return '0 Bytes'; const k = 1024, sizes = ['Bytes','KB','MB']; const i = Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i]; }
    
    function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i> ${escapeHtml(message)}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000); }
    
    function addSystemLog(message, type = 'info') { const body = document.getElementById('terminalBody'); if (body) { const div = document.createElement('div'); div.className = `log-${type}`; div.style.cssText = `margin-bottom:4px; color:${type === 'success' ? '#2ea043' : type === 'error' ? '#f85149' : type === 'warning' ? '#d29922' : '#79c0ff'}`; div.innerHTML = `[${new Date().toLocaleTimeString()}] > ${escapeHtml(message)}`; body.appendChild(div); body.scrollTop = body.scrollHeight; } activityLog.unshift({ message, type, time: new Date() }); if (activityLog.length > 50) activityLog.pop(); updateDashboard(); }
    
    function showTerminal() { const tc = document.getElementById('terminalContainer'), stb = document.getElementById('showTerminalBtn'); if (tc) tc.style.display = 'block'; if (stb) stb.style.display = 'none'; }
    function closeTerminal() { const tc = document.getElementById('terminalContainer'), stb = document.getElementById('showTerminalBtn'); if (tc) tc.style.display = 'none'; if (stb) stb.style.display = 'flex'; }
    function showModal(modalId) { const el = document.getElementById(modalId); if (el) el.classList.add('active'); }
    function closeModal(modalId) { const el = document.getElementById(modalId); if (el) el.classList.remove('active'); }
    function copyToClipboard(text) { navigator.clipboard.writeText(text); showToast('Copied to clipboard!', 'success'); }
    
    function updateUIBasedOnAuth() { if (isAuthenticated) { document.body.classList.add('logged-in'); const ss = document.getElementById('statsSection'); if (ss) ss.style.display = 'grid'; } else { document.body.classList.remove('logged-in'); const ss = document.getElementById('statsSection'); if (ss) ss.style.display = 'none'; } }
    
    // SIDEBAR FUNCTIONS
    let isCollapsed = false, isMobile = window.innerWidth <= 768;
    function loadSidebarState() { const savedState = localStorage.getItem('sidebarCollapsed'); if (savedState !== null && !isMobile) { isCollapsed = savedState === 'true'; if (isCollapsed) document.getElementById('sidebar').classList.add('collapsed'); else document.getElementById('sidebar').classList.remove('collapsed'); } }
    function saveSidebarState() { if (!isMobile) localStorage.setItem('sidebarCollapsed', isCollapsed); }
    function toggleCollapse() { if (isMobile) return; isCollapsed = !isCollapsed; const sidebar = document.getElementById('sidebar'); if (sidebar) { if (isCollapsed) sidebar.classList.add('collapsed'); else sidebar.classList.remove('collapsed'); } saveSidebarState(); }
    function openMobileDrawer() { const sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay'); if (sidebar) sidebar.classList.add('mobile-open'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeMobileDrawer() { const sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay'); if (sidebar) sidebar.classList.remove('mobile-open'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    function toggleMobileDrawer() { const sidebar = document.getElementById('sidebar'); if (sidebar && sidebar.classList.contains('mobile-open')) closeMobileDrawer(); else openMobileDrawer(); }
    function handleResize() { const wasMobile = isMobile; isMobile = window.innerWidth <= 768; if (isMobile && !wasMobile) { const sidebar = document.getElementById('sidebar'); if (sidebar) { sidebar.classList.remove('collapsed'); closeMobileDrawer(); isCollapsed = false; } } else if (!isMobile && wasMobile) { closeMobileDrawer(); loadSidebarState(); } }
    
    document.getElementById('collapseToggleBtn').addEventListener('click', toggleCollapse);
    document.getElementById('menuToggle').addEventListener('click', toggleMobileDrawer);
    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobileDrawer(); });
    window.addEventListener('resize', handleResize);
    
    document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', () => { if (isMobile) closeMobileDrawer(); }); });
    
    // NAVIGATION
    function navigateTo(page) {
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      const target = document.getElementById(`${page}Page`);
      if (target) target.style.display = 'block';
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const activeNav = [...document.querySelectorAll('.nav-item')].find(n => n.dataset.page === page);
      if (activeNav) activeNav.classList.add('active');
      if (page === 'repos' && isAuthenticated) loadRepositories();
      if (page === 'dashboard') updateDashboard();
      if (page === 'profile') updateProfilePage();
    }
    
    document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const page = item.dataset.page; if (page) navigateTo(page); }); });
    document.getElementById('sidebarProfileBtn').addEventListener('click', () => navigateTo('profile'));
    document.querySelectorAll('.quick-action-card').forEach(card => { card.addEventListener('click', () => { const page = card.dataset.page; if (page) navigateTo(page); }); });
    
    // AUTHENTICATION
    async function authenticateAndVerify() {
      const user = document.getElementById('githubUsername').value.trim();
      const token = document.getElementById('githubToken').value.trim();
      if (!user || !token) { showToast('Username and token required!', 'error'); return; }
      showTerminal();
      addSystemLog('[AUTH] Connecting to GitHub API...', 'info');
      try {
        const response = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Basic ${btoa(user + ':' + token)}` } });
        if (!response.ok) throw new Error('Invalid credentials');
        const data = await response.json();
        if (data.login.toLowerCase() !== user.toLowerCase()) throw new Error('Username mismatch');
        gitUsername = user; gitToken = token; isAuthenticated = true;
        addSystemLog(`[SUCCESS] Authenticated as ${gitUsername}`, 'success');
        closeModal('loginModal');
        document.getElementById('userName').textContent = gitUsername;
        document.getElementById('sidebarName').textContent = gitUsername;
        document.getElementById('sidebarRole').textContent = 'Connected to GitHub';
        document.getElementById('showLoginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'flex';
        document.getElementById('statusDot').classList.add('connected');
        document.getElementById('statusText').textContent = 'Connected';
        updateUIBasedOnAuth();
        if (data.avatar_url) {
          document.getElementById('sidebarAvatar').src = data.avatar_url;
          document.getElementById('profileAvatar').src = data.avatar_url;
          document.getElementById('profilePageAvatar').src = data.avatar_url;
        }
        document.getElementById('authorName').value = gitUsername;
        document.getElementById('socialGithub').value = gitUsername;
        await loadRepositories();
        navigateTo('home');
        updateHomeStats();
        showToast(`Welcome ${gitUsername}!`, 'success');
      } catch (err) { addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error'); showToast(err.message, 'error'); }
    }
    
    function logout() {
      addSystemLog('[SYSTEM] Disconnecting...', 'warning');
      gitUsername = ""; gitToken = ""; isAuthenticated = false; allRepositories = [];
      document.getElementById('userName').textContent = 'Guest';
      document.getElementById('sidebarName').textContent = 'Guest';
      document.getElementById('sidebarRole').textContent = 'Not logged in';
      document.getElementById('showLoginBtn').style.display = 'flex';
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('statusDot').classList.remove('connected');
      document.getElementById('statusText').textContent = 'Disconnected';
      updateUIBasedOnAuth();
      document.getElementById('sidebarAvatar').src = 'https://i.ibb.co.com/chGXxvw1/avt.jpg';
      document.getElementById('profileAvatar').src = 'https://i.ibb.co.com/chGXxvw1/avt.jpg';
      navigateTo('home');
      showToast('Logged out', 'info');
    }
    
    document.getElementById('showLoginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('closeLoginModal').addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('authBtn').addEventListener('click', authenticateAndVerify);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // GITHUB API
    async function githubRequest(endpoint, method = 'GET', body = null) {
      const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
      const res = await fetch(url, { method, headers: { 'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok && res.status !== 204) { const error = await res.json().catch(() => ({ message: res.statusText })); throw new Error(error.message); }
      return res.status === 204 ? { success: true } : await res.json();
    }
    
    // CREATE REPOSITORY
    async function executeCreateRepo() {
      const name = document.getElementById('newRepoName').value.trim();
      const desc = document.getElementById('repoDesc').value || '';
      const isPrivate = document.getElementById('repoPrivate').checked || false;
      const initReadme = document.getElementById('initReadme').checked || false;
      const gitignore = document.getElementById('gitignoreTemplate').value;
      if (!name) { showToast('Repository name required!', 'error'); return; }
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { showToast('Invalid repository name!', 'error'); return; }
      showTerminal();
      addSystemLog(`[GITHUB] Creating repository "${name}"...`, 'info');
      try {
        await githubRequest('/user/repos', 'POST', { name, description: desc, private: isPrivate, auto_init: initReadme });
        if (gitignore && gitignoreTemplates[gitignore]) {
          try { const content = btoa(unescape(encodeURIComponent(gitignoreTemplates[gitignore]))); await githubRequest(`/repos/${gitUsername}/${name}/contents/.gitignore`, 'PUT', { message: 'Add .gitignore', content: content, branch: 'main' }); addSystemLog(`[SUCCESS] Added .gitignore for ${gitignore}`, 'success'); } catch (err) { addSystemLog(`[WARNING] Could not add .gitignore: ${err.message}`, 'warning'); }
        }
        addSystemLog(`[SUCCESS] Repository "${name}" created!`, 'success');
        document.getElementById('newRepoName').value = '';
        document.getElementById('repoDesc').value = '';
        await loadRepositories();
        showToast(`Repository "${name}" created!`, 'success');
      } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showToast(err.message, 'error'); }
    }
    document.getElementById('confirmCreateRepo').addEventListener('click', executeCreateRepo);
    
    // DELETE REPOSITORY
    function loadDeleteSelect() { const select = document.getElementById('deleteRepoSelect'); if (select) { select.innerHTML = '<option value="">-- Select repository --</option>' + allRepositories.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join(''); } }
    function showDeleteModal(repoName) { currentDeleteTarget = repoName; document.getElementById('deleteRepoNameDisplay').textContent = repoName; document.getElementById('deleteConfirmInput').value = ''; showModal('deleteModal'); }
    async function confirmDeleteFromModal() { const input = document.getElementById('deleteConfirmInput').value.trim(); if (input === currentDeleteTarget) { await executeDeleteRepo(currentDeleteTarget); closeModal('deleteModal'); await loadRepositories(); } else { showToast('Repository name does not match!', 'error'); } }
    async function executeDeleteRepo(repoName) { showTerminal(); addSystemLog(`[DANGER] Deleting ${repoName}...`, 'warning'); try { await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE'); addSystemLog(`[SUCCESS] Deleted ${repoName}`, 'success'); await loadRepositories(); showToast(`Deleted ${repoName}`, 'success'); } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showToast(err.message, 'error'); } }
    
    document.getElementById('confirmDeleteName').addEventListener('input', (e) => { const btn = document.getElementById('confirmDeleteRepoBtn'); const select = document.getElementById('deleteRepoSelect'); if (btn && select) { btn.disabled = !(select.value && select.value === e.target.value); } });
    document.getElementById('confirmDeleteRepoBtn').addEventListener('click', async () => { const select = document.getElementById('deleteRepoSelect'); const confirm = document.getElementById('confirmDeleteName'); if (select && select.value && confirm && select.value === confirm.value) { await executeDeleteRepo(select.value); confirm.value = ''; select.value = '-- Select repository --'; } else { showToast('Repository name does not match!', 'error'); } });
    document.getElementById('closeDeleteModalBtn').addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('confirmDeleteModalBtn').addEventListener('click', confirmDeleteFromModal);
    
    // REPOSITORIES MANAGEMENT
    async function loadRepositories() {
      if (!isAuthenticated) return;
      addSystemLog('[SYSTEM] Fetching repositories...', 'info');
      try {
        let allRepos = [], page = 1;
        while (page <= 10) { const repos = await githubRequest(`/user/repos?per_page=100&page=${page}&sort=updated`); if (repos && repos.length) { allRepos = allRepos.concat(repos); page++; if (repos.length < 100) break; } else break; }
        allRepositories = allRepos;
        renderRepositories();
        updateStats();
        updateHomeStats();
        updateProfilePage();
        updateDashboard();
        loadDeleteSelect();
        addSystemLog(`[SUCCESS] Loaded ${allRepositories.length} repositories`, 'success');
      } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); const container = document.getElementById('repoListContainerEnhanced'); if (container) { container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load: ${escapeHtml(err.message)}</p><button class="btn btn-primary mt-16" onclick="loadRepositories()">Retry</button></div>`; } }
    }
    
    function renderRepositories() {
      const container = document.getElementById('repoListContainerEnhanced');
      if (!container) return;
      const search = document.getElementById('repoSearchInput').value.toLowerCase() || '';
      let filtered = allRepositories.filter(r => r.name.toLowerCase().includes(search) || (r.description && r.description.toLowerCase().includes(search)));
      if (currentFilter === 'public') filtered = filtered.filter(r => !r.private);
      if (currentFilter === 'private') filtered = filtered.filter(r => r.private);
      filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const start = (currentPage - 1) * itemsPerPage;
      const paged = filtered.slice(start, start + itemsPerPage);
      if (!paged.length && filtered.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No repositories found</p></div>'; return; }
      container.innerHTML = paged.map(repo => `<div class="card"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div class="pin-badge" data-repo="${escapeHtml(repo.name)}" style="cursor:pointer;color:${pinnedRepos.includes(repo.name) ? 'var(--accent-warning)' : 'var(--text-muted)'}"><i class="fas ${pinnedRepos.includes(repo.name) ? 'fa-star' : 'fa-star-o'}"></i></div><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${repo.private ? 'rgba(248,81,73,0.1)' : 'rgba(46,160,67,0.1)'};color:${repo.private ? '#f85149' : '#2ea043'}">${repo.private ? 'Private' : 'Public'}</span></div><div style="margin-bottom:12px;"><strong style="font-size:16px;"><i class="fab fa-github"></i> ${escapeHtml(repo.name)}</strong></div><p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">${escapeHtml(repo.description || 'No description')}</p><div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);margin-bottom:16px;"><span><span class="language-color" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${languageColors[repo.language] || languageColors.default};margin-right:4px;"></span> ${repo.language || 'N/A'}</span><span><i class="fas fa-star"></i> ${repo.stargazers_count}</span><span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span><span>🕒 ${new Date(repo.updated_at).toLocaleDateString()}</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="copyToClipboard('${repo.clone_url}')"><i class="fas fa-copy"></i> Copy URL</button><button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="showCloneModal('${escapeHtml(repo.name)}')"><i class="fas fa-code-branch"></i> Clone</button><button class="btn btn-danger" style="padding:6px 12px;font-size:12px;" onclick="showDeleteModal('${escapeHtml(repo.name)}')"><i class="fas fa-trash-alt"></i> Delete</button></div></div></div>`).join('');
      document.querySelectorAll('.pin-badge').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); togglePinRepo(el.dataset.repo); }); });
    }
    
    function togglePinRepo(name) { if (pinnedRepos.includes(name)) { pinnedRepos = pinnedRepos.filter(p => p !== name); } else { pinnedRepos.push(name); } localStorage.setItem('pinnedRepos', JSON.stringify(pinnedRepos)); renderRepositories(); }
    function loadPinnedRepos() { const saved = localStorage.getItem('pinnedRepos'); if (saved) { try { pinnedRepos = JSON.parse(saved); } catch(e) {} } }
    
    document.getElementById('refreshReposBtn').addEventListener('click', () => { if (!isAuthenticated) { showToast('Please login first', 'warning'); return; } const btn = document.getElementById('refreshReposBtn'); btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>'; loadRepositories().finally(() => { btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh'; }); });
    document.getElementById('repoSearchInput').addEventListener('input', () => { renderRepositories(); });
    
    // CLONE FUNCTIONALITY
    function showCloneModal(repoName) { const repo = allRepositories.find(r => r.name === repoName); if (repo) { currentCloneTarget = repo; document.getElementById('cloneUrlText').textContent = repo.clone_url; document.getElementById('cloneCommandText').textContent = repo.clone_url; showModal('cloneModal'); } }
    function copyCloneUrl() { if (currentCloneTarget) copyToClipboard(currentCloneTarget.clone_url); }
    document.getElementById('closeCloneModalBtn').addEventListener('click', () => closeModal('cloneModal'));
    document.getElementById('closeCloneModalFooterBtn').addEventListener('click', () => closeModal('cloneModal'));
    document.getElementById('copyCloneUrlBtn').addEventListener('click', copyCloneUrl);
    
    // UPLOAD SYSTEM
    function handleFilesSelected(files) { modernFiles = Array.from(files); renderFileList(); const uploadBtn = document.getElementById('startUploadBtn1'); if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none'; }
    function renderFileList() { const container = document.getElementById('fileListModern1'); if (!container) return; if (modernFiles.length === 0) { container.style.display = 'none'; return; } container.style.display = 'block'; container.innerHTML = modernFiles.map((file, idx) => `<div class="file-item"><div><i class="fas fa-file"></i> ${escapeHtml(file.name)} <span style="font-size:11px;color:var(--text-muted);">(${formatFileSize(file.size)})</span></div><button class="remove-file" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></div>`).join(''); document.querySelectorAll('.remove-file').forEach(btn => { btn.addEventListener('click', () => { modernFiles.splice(parseInt(btn.dataset.idx), 1); renderFileList(); const uploadBtn = document.getElementById('startUploadBtn1'); if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none'; }); }); }
    async function startModernUpload() { const repo = document.getElementById('targetRepoName1').value.trim(); const branch = document.getElementById('branchName1').value.trim() || 'main'; const msg = document.getElementById('commitMsg1').value.trim() || 'Upload via RepoFlow'; if (!repo) { showToast('Repository name required', 'error'); return; } if (!modernFiles.length) { showToast('No files selected', 'error'); return; } showTerminal(); addSystemLog(`[UPLOAD] Starting to ${gitUsername}/${repo}`, 'info'); let success = 0, error = 0; for (const file of modernFiles) { addSystemLog(`[UPLOAD] Uploading ${file.name}...`, 'info'); try { let sha = null; try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e) {} const b64 = await new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result.split(',')[1]); fr.readAsDataURL(file); }); await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}`, 'PUT', { message: msg, content: b64, branch: branch, sha: sha }); success++; addSystemLog(`[SUCCESS] Uploaded ${file.name}`, 'success'); } catch (err) { error++; addSystemLog(`[ERROR] Failed to upload ${file.name}: ${err.message}`, 'error'); } } if (error === 0) { addSystemLog(`[SUCCESS] Upload complete! ${success} files uploaded`, 'success'); showToast(`Successfully uploaded ${success} files!`, 'success'); modernFiles = []; renderFileList(); document.getElementById('startUploadBtn1').style.display = 'none'; } else { addSystemLog(`[WARNING] Upload completed with ${error} errors`, 'warning'); showToast(`Uploaded: ${success} success, ${error} failed`, 'warning'); } }
    async function handleZipSelected(files) { if (!files.length || !files[0].name.endsWith('.zip')) { showToast('Only ZIP files supported', 'error'); return; } const zipFile = files[0]; const previewContainer = document.getElementById('zipPreviewContainer'); const uploadBtn = document.getElementById('startUploadBtn2'); if (previewContainer) previewContainer.style.display = 'block'; if (uploadBtn) uploadBtn.style.display = 'block'; try { const zip = await JSZip.loadAsync(zipFile); extractedFiles = []; for (const [path, entry] of Object.entries(zip.files)) { if (!entry.dir) { const content = await entry.async('blob'); const file = new File([content], path.split('/').pop(), { type: content.type }); Object.defineProperty(file, 'webkitRelativePath', { value: path }); extractedFiles.push(file); } } const zipFileList = document.getElementById('zipFileList'); if (zipFileList) { zipFileList.innerHTML = extractedFiles.map(f => `<div class="file-item"><i class="fas fa-file"></i> ${escapeHtml(f.webkitRelativePath || f.name)}</div>`).join(''); } addSystemLog(`[ZIP] Extracted ${extractedFiles.length} files`, 'success'); } catch (e) { showToast('Error extracting ZIP file', 'error'); addSystemLog(`[ERROR] ZIP extraction failed: ${e.message}`, 'error'); } }
    async function startModernZipUpload() { const repo = document.getElementById('targetRepoName2').value.trim(); const branch = document.getElementById('branchName2').value.trim() || 'main'; const msg = document.getElementById('commitMsg2').value.trim() || 'Upload ZIP via RepoFlow'; if (!repo) { showToast('Repository name required', 'error'); return; } if (!extractedFiles.length) { showToast('No ZIP file selected', 'error'); return; } showTerminal(); addSystemLog(`[ZIP UPLOAD] Extracting ${extractedFiles.length} files to ${repo}`, 'info'); let success = 0, error = 0; for (const file of extractedFiles) { const path = file.webkitRelativePath || file.name; addSystemLog(`[UPLOAD] Uploading ${path}...`, 'info'); try { let sha = null; try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e) {} const b64 = await new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result.split(',')[1]); fr.readAsDataURL(file); }); await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', { message: msg, content: b64, branch: branch, sha: sha }); success++; addSystemLog(`[SUCCESS] Uploaded ${path}`, 'success'); } catch (err) { error++; addSystemLog(`[ERROR] Failed to upload ${path}: ${err.message}`, 'error'); } } addSystemLog(`[ZIP UPLOAD] Complete: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning'); showToast(`ZIP upload: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning'); extractedFiles = []; document.getElementById('zipPreviewContainer').style.display = 'none'; document.getElementById('startUploadBtn2').style.display = 'none'; }
    
    document.getElementById('startUploadBtn1').addEventListener('click', startModernUpload);
    document.getElementById('startUploadBtn2').addEventListener('click', startModernZipUpload);
    
    const dropZone1 = document.getElementById('dropZone1'), fileInput1 = document.getElementById('fileInputModern1');
    if (dropZone1 && fileInput1) { dropZone1.addEventListener('click', () => fileInput1.click()); dropZone1.addEventListener('dragover', e => { e.preventDefault(); dropZone1.classList.add('drag-over'); }); dropZone1.addEventListener('dragleave', () => dropZone1.classList.remove('drag-over')); dropZone1.addEventListener('drop', e => { e.preventDefault(); dropZone1.classList.remove('drag-over'); handleFilesSelected(Array.from(e.dataTransfer.files)); }); fileInput1.addEventListener('change', e => { handleFilesSelected(Array.from(e.target.files)); fileInput1.value = ''; }); }
    const dropZone2 = document.getElementById('dropZone2'), fileInput2 = document.getElementById('fileInputModern2');
    if (dropZone2 && fileInput2) { dropZone2.addEventListener('click', () => fileInput2.click()); dropZone2.addEventListener('dragover', e => { e.preventDefault(); dropZone2.classList.add('drag-over'); }); dropZone2.addEventListener('dragleave', () => dropZone2.classList.remove('drag-over')); dropZone2.addEventListener('drop', e => { e.preventDefault(); dropZone2.classList.remove('drag-over'); handleZipSelected(Array.from(e.dataTransfer.files)); }); fileInput2.addEventListener('change', e => { handleZipSelected(Array.from(e.target.files)); fileInput2.value = ''; }); }
    
    document.querySelectorAll('.tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); const mode = tab.dataset.mode; document.querySelectorAll('.mode-container').forEach(c => c.style.display = 'none'); document.getElementById(`${mode}Container`).style.display = 'block'; }); });
    
    // README GENERATOR FUNCTIONS
    function renderFeatures() { const container = document.getElementById('featuresList'); if (!container) return; container.innerHTML = features.map((f, i) => `<div class="list-item"><input type="text" class="form-input" value="${escapeHtml(f)}" data-feature-idx="${i}" placeholder="Feature"><button class="btn btn-secondary" style="padding:6px 12px" data-remove-feature="${i}"><i class="fas fa-trash"></i></button></div>`).join(''); document.querySelectorAll('[data-feature-idx]').forEach(inp => { inp.addEventListener('change', (e) => { features[parseInt(inp.dataset.featureIdx)] = inp.value; updateReadmePreview(); }); }); document.querySelectorAll('[data-remove-feature]').forEach(btn => { btn.addEventListener('click', () => { features.splice(parseInt(btn.dataset.removeFeature), 1); if(features.length===0) features=['']; renderFeatures(); updateReadmePreview(); }); }); }
    function renderTechTags() { const container = document.getElementById('techTags'); if (!container) return; container.innerHTML = techStack.map(t => `<span class="tag">${escapeHtml(t)} <span class="tag-remove" data-tech="${escapeHtml(t)}">&times;</span></span>`).join('') + `<input type="text" class="tag-input" id="techInput" placeholder="Add tech...">`; document.querySelectorAll('.tag-remove').forEach(btn => { btn.addEventListener('click', () => { techStack = techStack.filter(t => t !== btn.dataset.tech); renderTechTags(); updateReadmePreview(); }); }); const techInput = document.getElementById('techInput'); if (techInput) { techInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && techInput.value.trim()) { techStack.push(techInput.value.trim()); techInput.value = ''; renderTechTags(); updateReadmePreview(); } }); } }
    function generateReadmeContent() {
      const name = document.getElementById('projectName').value.trim() || "My Awesome Project";
      const tagline = document.getElementById('projectTagline').value.trim() || "⚡ Next-gen Tool ⚡";
      const desc = document.getElementById('projectDesc').value.trim() || "";
      const featuresList = features.filter(f => f.trim());
      const tech = techStack;
      const install = document.getElementById('installSteps').value.trim() || "";
      const usage = document.getElementById('usageSteps').value.trim() || "";
      const author = document.getElementById('authorName').value.trim() || gitUsername || "Anonymous";
      const socialGithub = document.getElementById('socialGithub').value.trim();
      const socialInstagram = document.getElementById('socialInstagram').value.trim();
      const hasLicense = document.getElementById('enableLicense').checked || false;
      const year = new Date().getFullYear();
      let markdown = '';
      if (currentTemplate === 'cyberpunk') {
        markdown = `<div align="center">\n\n# ⚡ ${name} ⚡\n\n### ${tagline}\n\n`;
        if (desc) markdown += `${desc}\n\n`;
        markdown += `![GitHub stars](https://img.shields.io/github/stars/${socialGithub || 'username'}/${name.replace(/ /g, '-')}?style=for-the-badge&color=cyan)\n`;
        markdown += `![License](https://img.shields.io/badge/License-MIT-cyan?style=for-the-badge)\n\n---\n\n`;
        if (featuresList.length) { markdown += `## ✨ Features\n\n`; featuresList.forEach(f => markdown += `- ⚡ ${f}\n`); markdown += `\n---\n\n`; }
        if (tech.length) { markdown += `## 🛠️ Tech Stack\n\n`; tech.forEach(t => markdown += `<code>⚡ ${t}</code> `); markdown += `\n\n---\n\n`; }
        if (install) markdown += `## 📦 Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n\n---\n\n`;
        if (usage) markdown += `## 🚀 Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n\n---\n\n`;
        markdown += `## 👨‍💻 Developer\n\n**${author}**\n\n`;
        if (socialGithub) markdown += `[![GitHub](https://img.shields.io/badge/GitHub-${socialGithub}-cyan?style=flat-square&logo=github)](https://github.com/${socialGithub}) `;
        if (socialInstagram) markdown += `[![Instagram](https://img.shields.io/badge/Instagram-${socialInstagram}-purple?style=flat-square&logo=instagram)](https://instagram.com/${socialInstagram}) `;
        markdown += `\n\n---\n\n`;
        if (hasLicense) markdown += `## 📜 License\n\nMIT License © ${year} ${author}\n\n---\n\n`;
        markdown += `<div align="center">\n\n### ⚡ Built with RepoFlow Pro ⚡\n\n</div>`;
      } else if (currentTemplate === 'minimal') {
        markdown = `# ${name}\n\n${tagline}\n\n${desc}\n\n## Features\n\n`;
        featuresList.forEach(f => markdown += `- ${f}\n`);
        if (install) markdown += `\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n`;
        if (usage) markdown += `\n## Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n`;
        if (hasLicense) markdown += `\n## License\n\nMIT © ${year} ${author}\n`;
      } else {
        markdown = `# ${name}\n\n> ${tagline}\n\n${desc}\n\n## Features\n\n`;
        featuresList.forEach(f => markdown += `- ${f}\n`);
        if (tech.length) { markdown += `\n## Tech Stack\n\n`; tech.forEach(t => markdown += `- ${t}\n`); }
        if (install) markdown += `\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n`;
        if (usage) markdown += `\n## Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n`;
        markdown += `\n## Author\n\n**${author}**\n\n`;
        if (hasLicense) markdown += `\n## License\n\nMIT © ${year} ${author}\n`;
      }
      return markdown;
    }
    function updateReadmePreview() { const md = generateReadmeContent(); const previewDiv = document.getElementById('readmePreview'); if (previewDiv && typeof marked !== 'undefined') { marked.setOptions({ breaks: true, gfm: true }); previewDiv.innerHTML = marked.parse(md); } }
    function copyMarkdownToClipboard() { navigator.clipboard.writeText(generateReadmeContent()); showToast('README markdown copied!', 'success'); }
    function downloadReadmeFile() { const blob = new Blob([generateReadmeContent()], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'README.md'; a.click(); URL.revokeObjectURL(url); showToast('README.md downloaded!', 'success'); }
    
    document.getElementById('addFeatureBtn').addEventListener('click', () => { features.push(''); renderFeatures(); updateReadmePreview(); });
    document.getElementById('copyMarkdownBtn').addEventListener('click', copyMarkdownToClipboard);
    document.getElementById('downloadReadmeBtn').addEventListener('click', downloadReadmeFile);
    document.querySelectorAll('.template-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentTemplate = btn.dataset.template; updateReadmePreview(); }); });
    const readmeInputs = ['projectName', 'projectTagline', 'projectDesc', 'installSteps', 'usageSteps', 'authorName', 'socialGithub', 'socialInstagram'];
    readmeInputs.forEach(id => { document.getElementById(id)?.addEventListener('input', updateReadmePreview); });
    document.getElementById('enableLicense')?.addEventListener('change', updateReadmePreview);
    
    // DASHBOARD & STATS
    function updateStats() { const totalRepos = allRepositories.length, publicRepos = allRepositories.filter(r => !r.private).length, privateRepos = allRepositories.filter(r => r.private).length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0); document.getElementById('totalRepos').textContent = totalRepos; document.getElementById('publicRepos').textContent = publicRepos; document.getElementById('privateRepos').textContent = privateRepos; document.getElementById('totalStars').textContent = totalStars; if (commitChart) commitChart.destroy(); const ctx = document.getElementById('commitChart')?.getContext('2d'); if (ctx) { commitChart = new Chart(ctx, { type: 'line', data: { labels: allRepositories.slice(0,7).map(r=>r.name.substring(0,12)), datasets: [{ label: 'Stars', data: allRepositories.slice(0,7).map(r=>r.stargazers_count), borderColor: '#2f81f7', backgroundColor: 'rgba(47,129,247,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: 'var(--text-secondary)' } } } } }); } }
    function updateDashboard() { const activityDiv = document.getElementById('activityList'); if (activityDiv && activityLog.length) { activityDiv.innerHTML = activityLog.slice(0,5).map(log => `<div class="activity-item"><div class="activity-icon"><i class="fas fa-${log.type === 'success' ? 'check-circle' : log.type === 'error' ? 'times-circle' : 'info-circle'}"></i></div><div class="activity-text">${escapeHtml(log.message.substring(0,80))}</div><div class="activity-time">${new Date(log.time).toLocaleTimeString()}</div></div>`).join(''); } }
    function updateHomeStats() { const totalRepos = allRepositories.length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0), totalForks = allRepositories.reduce((s,r)=>s+r.forks_count,0), totalWatchers = allRepositories.reduce((s,r)=>s+(r.watchers_count||0),0); document.getElementById('homeTotalRepos').textContent = totalRepos; document.getElementById('homeTotalStars').textContent = totalStars; document.getElementById('homeTotalForks').textContent = totalForks; document.getElementById('homeWatchers').textContent = totalWatchers; }
    function updateProfilePage() { const totalRepos = allRepositories.length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0), totalForks = allRepositories.reduce((s,r)=>s+r.forks_count,0); document.getElementById('profileReposCount').textContent = totalRepos; document.getElementById('profileStarsCount').textContent = totalStars; document.getElementById('profileForksCount').textContent = totalForks; if (gitUsername) document.getElementById('profileName').textContent = gitUsername; }
    
    // Profile Social Media Copy Functions
    function copyGitHub() { copyToClipboard('https://github.com/cpm_jhon'); }
    function copyInstagram() { copyToClipboard('https://instagram.com/jhon_production'); }
    document.getElementById('copyGithubBtn')?.addEventListener('click', copyGitHub);
    document.getElementById('copyInstagramBtn')?.addEventListener('click', copyInstagram);
    
    // THEME TOGGLE
    function initThemeToggle() { const themeBtn = document.getElementById('themeToggleBtn'), themeIcon = document.getElementById('themeIcon'), themeText = document.getElementById('themeText'), savedTheme = localStorage.getItem('theme'); if (savedTheme === 'light') { document.body.classList.add('light-theme'); if (themeIcon) themeIcon.className = 'fas fa-sun'; if (themeText) themeText.textContent = 'Light Mode'; } if (themeBtn) { themeBtn.addEventListener('click', () => { document.body.classList.toggle('light-theme'); const isLight = document.body.classList.contains('light-theme'); localStorage.setItem('theme', isLight ? 'light' : 'dark'); if (themeIcon) themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon'; if (themeText) themeText.textContent = isLight ? 'Light Mode' : 'Dark Mode'; }); } }
    
    document.getElementById('closeTerminalBtn').addEventListener('click', closeTerminal);
    document.getElementById('showTerminalBtn').addEventListener('click', showTerminal);
    
    // INITIALIZATION
    loadPinnedRepos();
    loadSidebarState();
    handleResize();
    initThemeToggle();
    updateUIBasedOnAuth();
    navigateTo('home');
    renderFeatures();
    renderTechTags();
    updateReadmePreview();
    
    setTimeout(() => { const body = document.getElementById('terminalBody'); if (body && body.children.length === 0 && !isAuthenticated) { addSystemLog('[SYSTEM] Welcome to RepoFlow Pro!', 'success'); addSystemLog('[SYSTEM] Please login to manage your GitHub repositories', 'info'); } }, 500);
    
    window.navigateTo = navigateTo;
    window.copyToClipboard = copyToClipboard;
    window.showDeleteModal = showDeleteModal;
    window.showCloneModal = showCloneModal;
    window.loadRepositories = loadRepositories;
