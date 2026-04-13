
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
    let currentLicense = "mit";
    
    // Gitignore templates
    const gitignoreTemplates = {
      Node: `node_modules/\ndist/\n.env\n.DS_Store\nnpm-debug.log\ncoverage/`,
      Python: `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.pyc\n.pytest_cache/`,
      Java: `*.class\ntarget/\n*.log\n.settings/\n.project\n.classpath`
    };
    
    // Language colors
    const languageColors = {
      'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
      'Java': '#b07219', 'Go': '#00ADD8', 'Rust': '#dea584', 'default': '#8b949e'
    };
    
    // License Templates - Complete and Professional
    const licenseTemplates = {
      'mit': `MIT License

Copyright (c) {year} {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
      'gpl-3.0': `                    GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU General Public License is a free, copyleft license for
software and other kinds of works.

Copyright (C) {year} {author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
      'apache-2.0': `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (C) {year} {author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
      'bsd-3-clause': `BSD 3-Clause License

Copyright (c) {year}, {author}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
      'isc': `ISC License

Copyright (c) {year}, {author}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
      'cc0-1.0': `Creative Commons Legal Code

CC0 1.0 Universal

CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE
LEGAL SERVICES. DISTRIBUTION OF THIS DOCUMENT DOES NOT CREATE AN
ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS
INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES
REGARDING THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS
PROVIDED HEREUNDER, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM
THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED
HEREUNDER.

Statement of Purpose

The person who associated a work with this deed has dedicated the work to
the public domain by waiving all of his or her rights to the work worldwide
under copyright law, including all related and neighboring rights, to the
extent allowed by law.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission. See Other Information below.

https://creativecommons.org/publicdomain/zero/1.0/`,
      'unlicense': `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

For more information, please refer to <https://unlicense.org>`
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
    
    // License Functions
    function getSelectedLicense() {
      const radios = document.getElementsByName('licenseType');
      for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) return radios[i].value;
      }
      return 'mit';
    }
    
    function generateLicenseContent() {
      const licenseType = getSelectedLicense();
      const author = document.getElementById('authorName')?.value.trim() || gitUsername || "Anonymous";
      const year = new Date().getFullYear();
      let content = licenseTemplates[licenseType] || licenseTemplates.mit;
      content = content.replace(/{year}/g, year).replace(/{author}/g, author);
      return content;
    }
    
    function updateLicenseInfoLink() {
      const licenseType = getSelectedLicense();
      const linkMap = {
        'mit': 'https://opensource.org/licenses/MIT',
        'gpl-3.0': 'https://www.gnu.org/licenses/gpl-3.0.html',
        'apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
        'bsd-3-clause': 'https://opensource.org/licenses/BSD-3-Clause',
        'isc': 'https://opensource.org/licenses/ISC',
        'cc0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'unlicense': 'https://unlicense.org/'
      };
      const link = document.getElementById('licenseInfoLink');
      if (link) link.href = linkMap[licenseType] || '#';
    }
    
    // SIDEBAR FUNCTIONS
    let isCollapsed = false, isMobile = window.innerWidth <= 768;
    function loadSidebarState() { const savedState = localStorage.getItem('sidebarCollapsed'); if (savedState !== null && !isMobile) { isCollapsed = savedState === 'true'; if (isCollapsed) document.getElementById('sidebar').classList.add('collapsed'); else document.getElementById('sidebar').classList.remove('collapsed'); } }
    function saveSidebarState() { if (!isMobile) localStorage.setItem('sidebarCollapsed', isCollapsed); }
    function toggleCollapse() { if (isMobile) return; isCollapsed = !isCollapsed; const sidebar = document.getElementById('sidebar'); if (sidebar) { if (isCollapsed) sidebar.classList.add('collapsed'); else sidebar.classList.remove('collapsed'); } saveSidebarState(); }
    function openMobileDrawer() { const sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay'); if (sidebar) sidebar.classList.add('mobile-open'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeMobileDrawer() { const sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay'); if (sidebar) sidebar.classList.remove('mobile-open'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
    function toggleMobileDrawer() { const sidebar = document.getElementById('sidebar'); if (sidebar && sidebar.classList.contains('mobile-open')) closeMobileDrawer(); else openMobileDrawer(); }
    function handleResize() { const wasMobile = isMobile; isMobile = window.innerWidth <= 768; if (isMobile && !wasMobile) { const sidebar = document.getElementById('sidebar'); if (sidebar) { sidebar.classList.remove('collapsed'); closeMobileDrawer(); isCollapsed = false; } } else if (!isMobile && wasMobile) { closeMobileDrawer(); loadSidebarState(); } }
    
    const collapseToggle = document.getElementById('collapseToggleBtn');
    const menuToggleEl = document.getElementById('menuToggle');
    const sidebarOverlayEl = document.getElementById('sidebarOverlay');
    if (collapseToggle) collapseToggle.addEventListener('click', toggleCollapse);
    if (menuToggleEl) menuToggleEl.addEventListener('click', toggleMobileDrawer);
    if (sidebarOverlayEl) sidebarOverlayEl.addEventListener('click', closeMobileDrawer);
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
    const sidebarProfileBtn = document.getElementById('sidebarProfileBtn');
    if (sidebarProfileBtn) sidebarProfileBtn.addEventListener('click', () => navigateTo('profile'));
    document.querySelectorAll('.quick-action-card').forEach(card => { card.addEventListener('click', () => { const page = card.dataset.page; if (page) navigateTo(page); }); });
    
    // AUTHENTICATION
    async function authenticateAndVerify() {
      const user = document.getElementById('githubUsername')?.value.trim();
      const token = document.getElementById('githubToken')?.value.trim();
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
        
        const userNameSpan = document.getElementById('userName');
        const sidebarNameEl = document.getElementById('sidebarName');
        const sidebarRoleEl = document.getElementById('sidebarRole');
        const showLoginBtnEl = document.getElementById('showLoginBtn');
        const logoutBtnEl = document.getElementById('logoutBtn');
        const statusDotEl = document.getElementById('statusDot');
        const statusTextEl = document.getElementById('statusText');
        
        if (userNameSpan) userNameSpan.textContent = gitUsername;
        if (sidebarNameEl) sidebarNameEl.textContent = gitUsername;
        if (sidebarRoleEl) sidebarRoleEl.textContent = 'Connected to GitHub';
        if (showLoginBtnEl) showLoginBtnEl.style.display = 'none';
        if (logoutBtnEl) logoutBtnEl.style.display = 'flex';
        if (statusDotEl) statusDotEl.classList.add('connected');
        if (statusTextEl) statusTextEl.textContent = 'Connected';
        
        updateUIBasedOnAuth();
        
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const profileAvatar = document.getElementById('profileAvatar');
        if (data.avatar_url) {
          if (sidebarAvatar) sidebarAvatar.src = data.avatar_url;
          if (profileAvatar) profileAvatar.src = data.avatar_url;
        }
        
        const authorNameInput = document.getElementById('authorName');
        const socialGithubInput = document.getElementById('socialGithub');
        if (authorNameInput) authorNameInput.value = gitUsername;
        if (socialGithubInput) socialGithubInput.value = gitUsername;
        
        await loadRepositories();
        navigateTo('home');
        updateHomeStats();
        showToast(`Welcome ${gitUsername}!`, 'success');
      } catch (err) { addSystemLog(`[ERROR] Authentication failed: ${err.message}`, 'error'); showToast(err.message, 'error'); }
    }
    
    function logout() {
      addSystemLog('[SYSTEM] Disconnecting...', 'warning');
      gitUsername = ""; gitToken = ""; isAuthenticated = false; allRepositories = [];
      
      const userNameSpan = document.getElementById('userName');
      const sidebarNameEl = document.getElementById('sidebarName');
      const sidebarRoleEl = document.getElementById('sidebarRole');
      const showLoginBtnEl = document.getElementById('showLoginBtn');
      const logoutBtnEl = document.getElementById('logoutBtn');
      const statusDotEl = document.getElementById('statusDot');
      const statusTextEl = document.getElementById('statusText');
      const sidebarAvatar = document.getElementById('sidebarAvatar');
      const profileAvatar = document.getElementById('profileAvatar');
      
      if (userNameSpan) userNameSpan.textContent = 'Guest';
      if (sidebarNameEl) sidebarNameEl.textContent = 'Guest';
      if (sidebarRoleEl) sidebarRoleEl.textContent = 'Not logged in';
      if (showLoginBtnEl) showLoginBtnEl.style.display = 'flex';
      if (logoutBtnEl) logoutBtnEl.style.display = 'none';
      if (statusDotEl) statusDotEl.classList.remove('connected');
      if (statusTextEl) statusTextEl.textContent = 'Disconnected';
      if (sidebarAvatar) sidebarAvatar.src = 'https://i.ibb.co.com/chGXxvw1/avt.jpg';
      if (profileAvatar) profileAvatar.src = 'https://i.ibb.co.com/chGXxvw1/avt.jpg';
      
      updateUIBasedOnAuth();
      navigateTo('home');
      showToast('Logged out', 'info');
    }
    
    const showLoginBtnEl = document.getElementById('showLoginBtn');
    const closeLoginModalEl = document.getElementById('closeLoginModal');
    const authBtnEl = document.getElementById('authBtn');
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (showLoginBtnEl) showLoginBtnEl.addEventListener('click', () => showModal('loginModal'));
    if (closeLoginModalEl) closeLoginModalEl.addEventListener('click', () => closeModal('loginModal'));
    if (authBtnEl) authBtnEl.addEventListener('click', authenticateAndVerify);
    if (logoutBtnEl) logoutBtnEl.addEventListener('click', logout);
    
    // GITHUB API
    async function githubRequest(endpoint, method = 'GET', body = null) {
      const url = endpoint.startsWith('https') ? endpoint : `https://api.github.com${endpoint}`;
      const res = await fetch(url, { method, headers: { 'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok && res.status !== 204) { const error = await res.json().catch(() => ({ message: res.statusText })); throw new Error(error.message); }
      return res.status === 204 ? { success: true } : await res.json();
    }
    
    // CREATE REPOSITORY
    async function executeCreateRepo() {
      const name = document.getElementById('newRepoName')?.value.trim();
      const desc = document.getElementById('repoDesc')?.value || '';
      const isPrivate = document.getElementById('repoPrivate')?.checked || false;
      const initReadme = document.getElementById('initReadme')?.checked || false;
      const gitignore = document.getElementById('gitignoreTemplate')?.value;
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
        const newRepoName = document.getElementById('newRepoName');
        const repoDesc = document.getElementById('repoDesc');
        if (newRepoName) newRepoName.value = '';
        if (repoDesc) repoDesc.value = '';
        await loadRepositories();
        showToast(`Repository "${name}" created!`, 'success');
      } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showToast(err.message, 'error'); }
    }
    const confirmCreateRepo = document.getElementById('confirmCreateRepo');
    if (confirmCreateRepo) confirmCreateRepo.addEventListener('click', executeCreateRepo);
    
    // DELETE REPOSITORY
    function loadDeleteSelect() { const select = document.getElementById('deleteRepoSelect'); if (select) { select.innerHTML = '<option value="">-- Select repository --</option>' + allRepositories.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join(''); } }
    function showDeleteModal(repoName) { currentDeleteTarget = repoName; const display = document.getElementById('deleteRepoNameDisplay'); if (display) display.textContent = repoName; const input = document.getElementById('deleteConfirmInput'); if (input) input.value = ''; showModal('deleteModal'); }
    async function confirmDeleteFromModal() { const input = document.getElementById('deleteConfirmInput')?.value.trim(); if (input === currentDeleteTarget) { await executeDeleteRepo(currentDeleteTarget); closeModal('deleteModal'); await loadRepositories(); } else { showToast('Repository name does not match!', 'error'); } }
    async function executeDeleteRepo(repoName) { showTerminal(); addSystemLog(`[DANGER] Deleting ${repoName}...`, 'warning'); try { await githubRequest(`/repos/${gitUsername}/${repoName}`, 'DELETE'); addSystemLog(`[SUCCESS] Deleted ${repoName}`, 'success'); await loadRepositories(); showToast(`Deleted ${repoName}`, 'success'); } catch (err) { addSystemLog(`[ERROR] ${err.message}`, 'error'); showToast(err.message, 'error'); } }
    
    const confirmDeleteName = document.getElementById('confirmDeleteName');
    const confirmDeleteRepoBtn = document.getElementById('confirmDeleteRepoBtn');
    const deleteRepoSelect = document.getElementById('deleteRepoSelect');
    if (confirmDeleteName) {
      confirmDeleteName.addEventListener('input', (e) => { if (confirmDeleteRepoBtn && deleteRepoSelect) { confirmDeleteRepoBtn.disabled = !(deleteRepoSelect.value && deleteRepoSelect.value === e.target.value); } });
    }
    if (confirmDeleteRepoBtn) {
      confirmDeleteRepoBtn.addEventListener('click', async () => { if (deleteRepoSelect && deleteRepoSelect.value && confirmDeleteName && deleteRepoSelect.value === confirmDeleteName.value) { await executeDeleteRepo(deleteRepoSelect.value); if (confirmDeleteName) confirmDeleteName.value = ''; if (deleteRepoSelect) deleteRepoSelect.value = '-- Select repository --'; } else { showToast('Repository name does not match!', 'error'); } });
    }
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteModalBtn = document.getElementById('confirmDeleteModalBtn');
    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', () => closeModal('deleteModal'));
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => closeModal('deleteModal'));
    if (confirmDeleteModalBtn) confirmDeleteModalBtn.addEventListener('click', confirmDeleteFromModal);
    
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
      const search = document.getElementById('repoSearchInput')?.value.toLowerCase() || '';
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
    
    const refreshReposBtn = document.getElementById('refreshReposBtn');
    const repoSearchInput = document.getElementById('repoSearchInput');
    if (refreshReposBtn) {
      refreshReposBtn.addEventListener('click', () => { if (!isAuthenticated) { showToast('Please login first', 'warning'); return; } refreshReposBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>'; loadRepositories().finally(() => { refreshReposBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh'; }); });
    }
    if (repoSearchInput) repoSearchInput.addEventListener('input', () => { renderRepositories(); });
    
    // CLONE FUNCTIONALITY
    function showCloneModal(repoName) { const repo = allRepositories.find(r => r.name === repoName); if (repo) { currentCloneTarget = repo; const urlText = document.getElementById('cloneUrlText'); const cmdText = document.getElementById('cloneCommandText'); if (urlText) urlText.textContent = repo.clone_url; if (cmdText) cmdText.textContent = repo.clone_url; showModal('cloneModal'); } }
    function copyCloneUrl() { if (currentCloneTarget) copyToClipboard(currentCloneTarget.clone_url); }
    const closeCloneModalBtn = document.getElementById('closeCloneModalBtn');
    const closeCloneModalFooterBtn = document.getElementById('closeCloneModalFooterBtn');
    const copyCloneUrlBtn = document.getElementById('copyCloneUrlBtn');
    if (closeCloneModalBtn) closeCloneModalBtn.addEventListener('click', () => closeModal('cloneModal'));
    if (closeCloneModalFooterBtn) closeCloneModalFooterBtn.addEventListener('click', () => closeModal('cloneModal'));
    if (copyCloneUrlBtn) copyCloneUrlBtn.addEventListener('click', copyCloneUrl);
    
    // UPLOAD SYSTEM
    function handleFilesSelected(files) { modernFiles = Array.from(files); renderFileList(); const uploadBtn = document.getElementById('startUploadBtn1'); if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none'; }
    function renderFileList() { const container = document.getElementById('fileListModern1'); if (!container) return; if (modernFiles.length === 0) { container.style.display = 'none'; return; } container.style.display = 'block'; container.innerHTML = modernFiles.map((file, idx) => `<div class="file-item"><div><i class="fas fa-file"></i> ${escapeHtml(file.name)} <span style="font-size:11px;color:var(--text-muted);">(${formatFileSize(file.size)})</span></div><button class="remove-file" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button></div>`).join(''); document.querySelectorAll('.remove-file').forEach(btn => { btn.addEventListener('click', () => { modernFiles.splice(parseInt(btn.dataset.idx), 1); renderFileList(); const uploadBtn = document.getElementById('startUploadBtn1'); if (uploadBtn) uploadBtn.style.display = modernFiles.length > 0 ? 'block' : 'none'; }); }); }
    async function startModernUpload() { const repo = document.getElementById('targetRepoName1')?.value.trim(); const branch = document.getElementById('branchName1')?.value.trim() || 'main'; const msg = document.getElementById('commitMsg1')?.value.trim() || 'Upload via RepoFlow'; if (!repo) { showToast('Repository name required', 'error'); return; } if (!modernFiles.length) { showToast('No files selected', 'error'); return; } showTerminal(); addSystemLog(`[UPLOAD] Starting to ${gitUsername}/${repo}`, 'info'); let success = 0, error = 0; for (const file of modernFiles) { addSystemLog(`[UPLOAD] Uploading ${file.name}...`, 'info'); try { let sha = null; try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e) {} const b64 = await new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result.split(',')[1]); fr.readAsDataURL(file); }); await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(file.name)}`, 'PUT', { message: msg, content: b64, branch: branch, sha: sha }); success++; addSystemLog(`[SUCCESS] Uploaded ${file.name}`, 'success'); } catch (err) { error++; addSystemLog(`[ERROR] Failed to upload ${file.name}: ${err.message}`, 'error'); } } if (error === 0) { addSystemLog(`[SUCCESS] Upload complete! ${success} files uploaded`, 'success'); showToast(`Successfully uploaded ${success} files!`, 'success'); modernFiles = []; renderFileList(); const uploadBtn = document.getElementById('startUploadBtn1'); if (uploadBtn) uploadBtn.style.display = 'none'; } else { addSystemLog(`[WARNING] Upload completed with ${error} errors`, 'warning'); showToast(`Uploaded: ${success} success, ${error} failed`, 'warning'); } }
    async function handleZipSelected(files) { if (!files.length || !files[0].name.endsWith('.zip')) { showToast('Only ZIP files supported', 'error'); return; } const zipFile = files[0]; const previewContainer = document.getElementById('zipPreviewContainer'); const uploadBtn = document.getElementById('startUploadBtn2'); if (previewContainer) previewContainer.style.display = 'block'; if (uploadBtn) uploadBtn.style.display = 'block'; try { const zip = await JSZip.loadAsync(zipFile); extractedFiles = []; for (const [path, entry] of Object.entries(zip.files)) { if (!entry.dir) { const content = await entry.async('blob'); const file = new File([content], path.split('/').pop(), { type: content.type }); Object.defineProperty(file, 'webkitRelativePath', { value: path }); extractedFiles.push(file); } } const zipFileList = document.getElementById('zipFileList'); if (zipFileList) { zipFileList.innerHTML = extractedFiles.map(f => `<div class="file-item"><i class="fas fa-file"></i> ${escapeHtml(f.webkitRelativePath || f.name)}</div>`).join(''); } addSystemLog(`[ZIP] Extracted ${extractedFiles.length} files`, 'success'); } catch (e) { showToast('Error extracting ZIP file', 'error'); addSystemLog(`[ERROR] ZIP extraction failed: ${e.message}`, 'error'); } }
    async function startModernZipUpload() { const repo = document.getElementById('targetRepoName2')?.value.trim(); const branch = document.getElementById('branchName2')?.value.trim() || 'main'; const msg = document.getElementById('commitMsg2')?.value.trim() || 'Upload ZIP via RepoFlow'; if (!repo) { showToast('Repository name required', 'error'); return; } if (!extractedFiles.length) { showToast('No ZIP file selected', 'error'); return; } showTerminal(); addSystemLog(`[ZIP UPLOAD] Extracting ${extractedFiles.length} files to ${repo}`, 'info'); let success = 0, error = 0; for (const file of extractedFiles) { const path = file.webkitRelativePath || file.name; addSystemLog(`[UPLOAD] Uploading ${path}...`, 'info'); try { let sha = null; try { const existing = await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, 'GET'); sha = existing.sha; } catch(e) {} const b64 = await new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result.split(',')[1]); fr.readAsDataURL(file); }); await githubRequest(`/repos/${gitUsername}/${repo}/contents/${encodeURIComponent(path)}`, 'PUT', { message: msg, content: b64, branch: branch, sha: sha }); success++; addSystemLog(`[SUCCESS] Uploaded ${path}`, 'success'); } catch (err) { error++; addSystemLog(`[ERROR] Failed to upload ${path}: ${err.message}`, 'error'); } } addSystemLog(`[ZIP UPLOAD] Complete: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning'); showToast(`ZIP upload: ${success} success, ${error} failed`, error === 0 ? 'success' : 'warning'); extractedFiles = []; const previewContainer = document.getElementById('zipPreviewContainer'); if (previewContainer) previewContainer.style.display = 'none'; const uploadBtn = document.getElementById('startUploadBtn2'); if (uploadBtn) uploadBtn.style.display = 'none'; }
    
    const startUploadBtn1 = document.getElementById('startUploadBtn1');
    const startUploadBtn2 = document.getElementById('startUploadBtn2');
    if (startUploadBtn1) startUploadBtn1.addEventListener('click', startModernUpload);
    if (startUploadBtn2) startUploadBtn2.addEventListener('click', startModernZipUpload);
    
    const dropZone1 = document.getElementById('dropZone1');
    const fileInput1 = document.getElementById('fileInputModern1');
    if (dropZone1 && fileInput1) { 
      dropZone1.addEventListener('click', () => fileInput1.click()); 
      dropZone1.addEventListener('dragover', e => { e.preventDefault(); dropZone1.classList.add('drag-over'); }); 
      dropZone1.addEventListener('dragleave', () => dropZone1.classList.remove('drag-over')); 
      dropZone1.addEventListener('drop', e => { e.preventDefault(); dropZone1.classList.remove('drag-over'); handleFilesSelected(Array.from(e.dataTransfer.files)); }); 
      fileInput1.addEventListener('change', e => { handleFilesSelected(Array.from(e.target.files)); fileInput1.value = ''; }); 
    }
    const dropZone2 = document.getElementById('dropZone2');
    const fileInput2 = document.getElementById('fileInputModern2');
    if (dropZone2 && fileInput2) { 
      dropZone2.addEventListener('click', () => fileInput2.click()); 
      dropZone2.addEventListener('dragover', e => { e.preventDefault(); dropZone2.classList.add('drag-over'); }); 
      dropZone2.addEventListener('dragleave', () => dropZone2.classList.remove('drag-over')); 
      dropZone2.addEventListener('drop', e => { e.preventDefault(); dropZone2.classList.remove('drag-over'); handleZipSelected(Array.from(e.dataTransfer.files)); }); 
      fileInput2.addEventListener('change', e => { handleZipSelected(Array.from(e.target.files)); fileInput2.value = ''; }); 
    }
    
    document.querySelectorAll('.tab').forEach(tab => { tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); const mode = tab.dataset.mode; document.querySelectorAll('.mode-container').forEach(c => c.style.display = 'none'); const container = document.getElementById(`${mode}Container`); if (container) container.style.display = 'block'; }); });
    
    // README GENERATOR FUNCTIONS
    function renderFeatures() { const container = document.getElementById('featuresList'); if (!container) return; container.innerHTML = features.map((f, i) => `<div class="list-item"><input type="text" class="form-input" value="${escapeHtml(f)}" data-feature-idx="${i}" placeholder="Feature"><button class="btn btn-secondary" style="padding:6px 12px" data-remove-feature="${i}"><i class="fas fa-trash"></i></button></div>`).join(''); document.querySelectorAll('[data-feature-idx]').forEach(inp => { inp.addEventListener('change', (e) => { features[parseInt(inp.dataset.featureIdx)] = inp.value; updateReadmePreview(); }); }); document.querySelectorAll('[data-remove-feature]').forEach(btn => { btn.addEventListener('click', () => { features.splice(parseInt(btn.dataset.removeFeature), 1); if(features.length===0) features=['']; renderFeatures(); updateReadmePreview(); }); }); }
    
    function renderTechTags() { const container = document.getElementById('techTags'); if (!container) return; container.innerHTML = techStack.map(t => `<span class="tag">${escapeHtml(t)} <span class="tag-remove" data-tech="${escapeHtml(t)}">&times;</span></span>`).join('') + `<input type="text" class="tag-input" id="techInput" placeholder="Add tech...">`; document.querySelectorAll('.tag-remove').forEach(btn => { btn.addEventListener('click', () => { techStack = techStack.filter(t => t !== btn.dataset.tech); renderTechTags(); updateReadmePreview(); }); }); const techInput = document.getElementById('techInput'); if (techInput) { techInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && techInput.value.trim()) { techStack.push(techInput.value.trim()); techInput.value = ''; renderTechTags(); updateReadmePreview(); } }); } }
    
    function generateReadmeContent() {
      const name = document.getElementById('projectName')?.value.trim() || "My Awesome Project";
      const tagline = document.getElementById('projectTagline')?.value.trim() || "⚡ Next-gen Tool ⚡";
      const desc = document.getElementById('projectDesc')?.value.trim() || "";
      const featuresList = features.filter(f => f.trim());
      const tech = techStack;
      const install = document.getElementById('installSteps')?.value.trim() || "";
      const usage = document.getElementById('usageSteps')?.value.trim() || "";
      const author = document.getElementById('authorName')?.value.trim() || gitUsername || "Anonymous";
      const socialGithub = document.getElementById('socialGithub')?.value.trim();
      const socialInstagram = document.getElementById('socialInstagram')?.value.trim();
      const hasLicense = document.getElementById('enableLicense')?.checked || false;
      const licenseType = getSelectedLicense();
      const licenseNameMap = {
        'mit': 'MIT',
        'gpl-3.0': 'GPL-3.0',
        'apache-2.0': 'Apache-2.0',
        'bsd-3-clause': 'BSD-3-Clause',
        'isc': 'ISC',
        'cc0-1.0': 'CC0-1.0',
        'unlicense': 'Unlicense'
      };
      const licenseName = licenseNameMap[licenseType] || 'MIT';
      const year = new Date().getFullYear();
      let markdown = '';
      
      if (currentTemplate === 'cyberpunk') {
        markdown = `<div align="center">\n\n# ⚡ ${name} ⚡\n\n### ${tagline}\n\n`;
        if (desc) markdown += `${desc}\n\n`;
        markdown += `![GitHub stars](https://img.shields.io/github/stars/${socialGithub || 'username'}/${name.replace(/ /g, '-')}?style=for-the-badge&color=cyan)\n`;
        if (hasLicense) markdown += `![License](https://img.shields.io/badge/License-${licenseName}-cyan?style=for-the-badge)\n`;
        markdown += `![Version](https://img.shields.io/badge/version-1.0.0-purple?style=for-the-badge)\n\n---\n\n`;
        if (featuresList.length) { markdown += `## ✨ Features\n\n`; featuresList.forEach(f => markdown += `- ⚡ ${f}\n`); markdown += `\n---\n\n`; }
        if (tech.length) { markdown += `## 🛠️ Tech Stack\n\n`; tech.forEach(t => markdown += `<code>⚡ ${t}</code> `); markdown += `\n\n---\n\n`; }
        if (install) markdown += `## 📦 Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n\n---\n\n`;
        if (usage) markdown += `## 🚀 Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n\n---\n\n`;
        markdown += `## 👨‍💻 Developer\n\n**${author}**\n\n`;
        if (socialGithub) markdown += `[![GitHub](https://img.shields.io/badge/GitHub-${socialGithub}-cyan?style=flat-square&logo=github)](https://github.com/${socialGithub}) `;
        if (socialInstagram) markdown += `[![Instagram](https://img.shields.io/badge/Instagram-${socialInstagram}-purple?style=flat-square&logo=instagram)](https://instagram.com/${socialInstagram}) `;
        markdown += `\n\n---\n\n`;
        markdown += `## 🤝 Contributing\n\nContributions, issues, and feature requests are welcome!\n\n---\n\n`;
        if (hasLicense) markdown += `## 📜 License\n\nCopyright © ${year} ${author}.\nThis project is licensed under the **${licenseName}** license.\n\n[![License](https://img.shields.io/badge/License-${licenseName}-cyan.svg)](https://opensource.org/licenses/${licenseType === 'mit' ? 'MIT' : licenseType === 'gpl-3.0' ? 'GPL-3.0' : licenseType === 'apache-2.0' ? 'Apache-2.0' : licenseType === 'bsd-3-clause' ? 'BSD-3-Clause' : licenseType === 'isc' ? 'ISC' : licenseType === 'cc0-1.0' ? 'CC0-1.0' : 'Unlicense'})\n\n---\n\n`;
        markdown += `<div align="center">\n\n### ⚡ Built with RepoFlow Pro ⚡\n\n</div>`;
      } else if (currentTemplate === 'minimal') {
        markdown = `# ${name}\n\n${tagline}\n\n${desc}\n\n## Features\n\n`;
        featuresList.forEach(f => markdown += `- ${f}\n`);
        if (tech.length) markdown += `\n## Tech Stack\n\n${tech.map(t => `- ${t}`).join('\n')}\n`;
        if (install) markdown += `\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n`;
        if (usage) markdown += `\n## Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n`;
        markdown += `\n## Author\n\n**${author}**\n\n`;
        if (hasLicense) markdown += `\n## License\n\n${licenseName} © ${year} ${author}\n`;
      } else {
        markdown = `# ${name}\n\n> ${tagline}\n\n${desc}\n\n## Features\n\n`;
        featuresList.forEach(f => markdown += `- ${f}\n`);
        if (tech.length) markdown += `\n## Tech Stack\n\n${tech.map(t => `- ${t}`).join('\n')}\n`;
        if (install) markdown += `\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n`;
        if (usage) markdown += `\n## Usage\n\n\`\`\`bash\n${usage}\n\`\`\`\n`;
        markdown += `\n## Author\n\n**${author}**\n\n`;
        if (hasLicense) markdown += `\n## License\n\n${licenseName} © ${year} ${author}\n`;
      }
      return markdown;
    }
    
    function updateReadmePreview() { const md = generateReadmeContent(); const previewDiv = document.getElementById('readmePreview'); if (previewDiv && typeof marked !== 'undefined') { marked.setOptions({ breaks: true, gfm: true }); previewDiv.innerHTML = marked.parse(md); } }
    function copyMarkdownToClipboard() { navigator.clipboard.writeText(generateReadmeContent()); showToast('README markdown copied!', 'success'); }
    function downloadReadmeFile() { const blob = new Blob([generateReadmeContent()], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'README.md'; a.click(); URL.revokeObjectURL(url); showToast('README.md downloaded!', 'success'); }
    
    // README Generator Event Listeners
    const addFeatureBtn = document.getElementById('addFeatureBtn');
    const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
    const downloadReadmeBtn = document.getElementById('downloadReadmeBtn');
    if (addFeatureBtn) addFeatureBtn.addEventListener('click', () => { features.push(''); renderFeatures(); updateReadmePreview(); });
    if (copyMarkdownBtn) copyMarkdownBtn.addEventListener('click', copyMarkdownToClipboard);
    if (downloadReadmeBtn) downloadReadmeBtn.addEventListener('click', downloadReadmeFile);
    
    document.querySelectorAll('.template-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentTemplate = btn.dataset.template; updateReadmePreview(); }); });
    
    const readmeInputs = ['projectName', 'projectTagline', 'projectDesc', 'installSteps', 'usageSteps', 'authorName', 'socialGithub', 'socialInstagram'];
    readmeInputs.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', updateReadmePreview); });
    
    // License Selector Event Listeners
    const enableLicenseCheckbox = document.getElementById('enableLicense');
    const licenseSelector = document.getElementById('licenseSelector');
    if (enableLicenseCheckbox) {
      enableLicenseCheckbox.addEventListener('change', (e) => {
        if (licenseSelector) licenseSelector.style.display = e.target.checked ? 'block' : 'none';
        updateReadmePreview();
      });
    }
    
    const licenseRadios = document.querySelectorAll('input[name="licenseType"]');
    licenseRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        currentLicense = getSelectedLicense();
        updateLicenseInfoLink();
        updateReadmePreview();
      });
    });
    
    const licenseInfoLink = document.getElementById('licenseInfoLink');
    if (licenseInfoLink) licenseInfoLink.addEventListener('click', (e) => { e.preventDefault(); window.open(licenseInfoLink.href, '_blank'); });
    
    // DASHBOARD & STATS
    function updateStats() { const totalRepos = allRepositories.length, publicRepos = allRepositories.filter(r => !r.private).length, privateRepos = allRepositories.filter(r => r.private).length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0); const totalReposEl = document.getElementById('totalRepos'); const publicReposEl = document.getElementById('publicRepos'); const privateReposEl = document.getElementById('privateRepos'); const totalStarsEl = document.getElementById('totalStars'); if (totalReposEl) totalReposEl.textContent = totalRepos; if (publicReposEl) publicReposEl.textContent = publicRepos; if (privateReposEl) privateReposEl.textContent = privateRepos; if (totalStarsEl) totalStarsEl.textContent = totalStars; if (commitChart) commitChart.destroy(); const ctx = document.getElementById('commitChart')?.getContext('2d'); if (ctx) { commitChart = new Chart(ctx, { type: 'line', data: { labels: allRepositories.slice(0,7).map(r=>r.name.substring(0,12)), datasets: [{ label: 'Stars', data: allRepositories.slice(0,7).map(r=>r.stargazers_count), borderColor: '#2f81f7', backgroundColor: 'rgba(47,129,247,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: 'var(--text-secondary)' } } } } }); } }
    function updateDashboard() { const activityDiv = document.getElementById('activityList'); if (activityDiv && activityLog.length) { activityDiv.innerHTML = activityLog.slice(0,5).map(log => `<div class="activity-item"><div class="activity-icon"><i class="fas fa-${log.type === 'success' ? 'check-circle' : log.type === 'error' ? 'times-circle' : 'info-circle'}"></i></div><div class="activity-text">${escapeHtml(log.message.substring(0,80))}</div><div class="activity-time">${new Date(log.time).toLocaleTimeString()}</div></div>`).join(''); } }
    function updateHomeStats() { const totalRepos = allRepositories.length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0), totalForks = allRepositories.reduce((s,r)=>s+r.forks_count,0), totalWatchers = allRepositories.reduce((s,r)=>s+(r.watchers_count||0),0); const homeTotalRepos = document.getElementById('homeTotalRepos'); const homeTotalStars = document.getElementById('homeTotalStars'); const homeTotalForks = document.getElementById('homeTotalForks'); const homeWatchers = document.getElementById('homeWatchers'); if (homeTotalRepos) homeTotalRepos.textContent = totalRepos; if (homeTotalStars) homeTotalStars.textContent = totalStars; if (homeTotalForks) homeTotalForks.textContent = totalForks; if (homeWatchers) homeWatchers.textContent = totalWatchers; }
    function updateProfilePage() { const totalRepos = allRepositories.length, totalStars = allRepositories.reduce((s,r)=>s+r.stargazers_count,0), totalForks = allRepositories.reduce((s,r)=>s+r.forks_count,0); const profileRepos = document.getElementById('profileReposCount'); const profileStars = document.getElementById('profileStarsCount'); const profileForks = document.getElementById('profileForksCount'); const profileName = document.getElementById('profileName'); if (profileRepos) profileRepos.textContent = totalRepos; if (profileStars) profileStars.textContent = totalStars; if (profileForks) profileForks.textContent = totalForks; if (profileName && gitUsername) profileName.textContent = gitUsername; }
    
    // Profile Social Media Copy Functions
    function copyGitHub() { copyToClipboard('https://github.com/cpm_jhon'); }
    function copyInstagram() { copyToClipboard('https://instagram.com/jhon_production'); }
    const copyGithubBtn = document.getElementById('copyGithubBtn');
    const copyInstagramBtn = document.getElementById('copyInstagramBtn');
    if (copyGithubBtn) copyGithubBtn.addEventListener('click', copyGitHub);
    if (copyInstagramBtn) copyInstagramBtn.addEventListener('click', copyInstagram);
    
    // THEME TOGGLE
    function initThemeToggle() { const themeBtn = document.getElementById('themeToggleBtn'), themeIcon = document.getElementById('themeIcon'), themeText = document.getElementById('themeText'), savedTheme = localStorage.getItem('theme'); if (savedTheme === 'light') { document.body.classList.add('light-theme'); if (themeIcon) themeIcon.className = 'fas fa-sun'; if (themeText) themeText.textContent = 'Light Mode'; } if (themeBtn) { themeBtn.addEventListener('click', () => { document.body.classList.toggle('light-theme'); const isLight = document.body.classList.contains('light-theme'); localStorage.setItem('theme', isLight ? 'light' : 'dark'); if (themeIcon) themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon'; if (themeText) themeText.textContent = isLight ? 'Light Mode' : 'Dark Mode'; }); } }
    
    const closeTerminalBtn = document.getElementById('closeTerminalBtn');
    const showTerminalBtnEl = document.getElementById('showTerminalBtn');
    if (closeTerminalBtn) closeTerminalBtn.addEventListener('click', closeTerminal);
    if (showTerminalBtnEl) showTerminalBtnEl.addEventListener('click', showTerminal);
    
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
    
    // Set initial license selector visibility
    if (licenseSelector && enableLicenseCheckbox) {
      licenseSelector.style.display = enableLicenseCheckbox.checked ? 'block' : 'none';
    }
    updateLicenseInfoLink();
    
    setTimeout(() => { const body = document.getElementById('terminalBody'); if (body && body.children.length === 0 && !isAuthenticated) { addSystemLog('[SYSTEM] Welcome to RepoFlow Pro!', 'success'); addSystemLog('[SYSTEM] Please login to manage your GitHub repositories', 'info'); } }, 500);
    
    window.navigateTo = navigateTo;
    window.copyToClipboard = copyToClipboard;
    window.showDeleteModal = showDeleteModal;
    window.showCloneModal = showCloneModal;
    window.loadRepositories = loadRepositories;
 