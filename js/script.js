
// ========================================
// REPOFLOW - COMPLETE JAVASCRIPT
// All original functionality preserved + Enhanced Upload
// ========================================

// ========== STATE ==========
let gitUsername = "", gitToken = "", isAuthenticated = false;
let activityLog = [];
let chartInstance = null;
let selectedFiles = [];
let currentReadmeContent = "", currentLicenseContent = "";
let allRepositories = [], filteredRepositories = [];
let currentFilter = 'all', currentSort = 'updated', currentPage = 1, itemsPerPage = 12;
let pinnedRepos = JSON.parse(localStorage.getItem('pinnedRepos') || '[]');
let currentDeleteTarget = null, currentCloneTarget = null;

// Language colors for repo cards
const languageColors = { 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5', 'Java': '#b07219', 'Go': '#00ADD8', 'default': '#8b949e' };

// ========== DOM Elements ==========
const terminalBody = document.getElementById('terminalBody');
const progressWrapper = document.getElementById('progressWrapper');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const progressText = document.getElementById('progressText');

// ========== Helper Functions ==========
function addLog(msg, type = 'info') { 
  if (!terminalBody) return; 
  const div = document.createElement('div'); 
  div.className = `log-${type}`; 
  div.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`; 
  terminalBody.appendChild(div); 
  terminalBody.scrollTop = terminalBody.scrollHeight; 
  activityLog.unshift({ msg, type }); 
  if (activityLog.length > 20) activityLog.pop(); 
  updateDashboard(); 
}
function addSystemLog(msg, type) { addLog(msg, type); }
function showToast(msg, type = 'success') { 
  const toast = document.createElement('div'); 
  toast.className = 'toast'; 
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${msg}`; 
  document.body.appendChild(toast); 
  setTimeout(() => toast.remove(), 3000); 
}
function showProgress() { if (progressWrapper) progressWrapper.style.display = 'block'; }
function hideProgress() { if (progressWrapper) progressWrapper.style.display = 'none'; if (progressFill) progressFill.style.width = '0%'; }
function updateProgress(percent, text) { if (progressFill) progressFill.style.width = percent + '%'; if (progressPercent) progressPercent.textContent = percent + '%'; if (progressText) progressText.textContent = text; }
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function updateDashboard() { 
  const activityDiv = document.getElementById('activityList'); 
  if (activityDiv && activityLog.length) 
    activityDiv.innerHTML = activityLog.slice(0,5).map(l => `<div class="activity-item">${escapeHtml(l.msg.substring(0,80))}</div>`).join(''); 
}
function getRelativeTime(dateString) { 
  const date = new Date(dateString); 
  const now = new Date(); 
  const diffDays = Math.floor((now - date) / 86400000); 
  if (diffDays < 1) return 'today'; 
  if (diffDays < 30) return `${diffDays} days ago`; 
  return date.toLocaleDateString(); 
}

// ========== GitHub API ==========
async function githubRequest(endpoint, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com${endpoint}`, { 
    method, 
    headers: { 'Authorization': `Basic ${btoa(gitUsername + ':' + gitToken)}`, 'Accept': 'application/vnd.github.v3+json' }, 
    body: body ? JSON.stringify(body) : undefined 
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
  return res.status === 204 ? {} : await res.json();
}

// ========== Authentication ==========
async function authenticateAndVerify() {
  const user = document.getElementById('loginUsername')?.value.trim();
  const token = document.getElementById('loginToken')?.value.trim();
  if (!user || !token) { document.getElementById('loginError').innerText = 'Username and token required!'; return; }
  try {
    const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': `Basic ${btoa(user + ':' + token)}` } });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    if (data.login.toLowerCase() !== user.toLowerCase()) throw new Error('Username mismatch');
    gitUsername = user; gitToken = token; isAuthenticated = true;
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('pagesContainer').style.display = 'block';
    document.getElementById('userName').textContent = gitUsername;
    document.getElementById('showLoginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-circle" style="color:#2da44e"></i><span>Connected</span>';
    addSystemLog(`Authenticated as ${gitUsername}`, 'success');
    await loadRepositoriesEnhanced();
    navigateTo('dashboard');
  } catch (err) { document.getElementById('loginError').innerText = err.message; addSystemLog(`Auth failed: ${err.message}`, 'error'); }
}
function logout() { 
  isAuthenticated = false; gitUsername = ""; gitToken = ""; 
  document.getElementById('pagesContainer').style.display = 'none'; 
  document.getElementById('userName').textContent = 'Guest'; 
  document.getElementById('showLoginBtn').style.display = 'flex'; 
  document.getElementById('logoutBtn').style.display = 'none'; 
  document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>'; 
  addSystemLog('Logged out', 'info'); 
}

// ========== Navigation ==========
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => { n.classList.remove('active'); if (n.dataset.page === page) n.classList.add('active'); });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pages = { home: 'homePage', dashboard: 'dashboardPage', repos: 'reposPage', upload: 'uploadPage', create: 'createPage', delete: 'deletePage' };
  document.getElementById(pages[page]).classList.add('active');
  if (page === 'repos' && isAuthenticated) loadRepositoriesEnhanced();
  if (page === 'dashboard' && chartInstance) updateDashboard();
}

// ========== Repositories ==========
async function loadRepositoriesEnhanced() {
  if (!isAuthenticated) return; 
  addSystemLog('Fetching repositories...', 'info');
  try { 
    let repos = []; 
    let p = 1; 
    while (p <= 5) { 
      const r = await githubRequest(`/user/repos?per_page=100&page=${p}`); 
      if (r.length) repos.push(...r); 
      else break; 
      p++; 
    } 
    allRepositories = repos; 
    applyFiltersAndSort(); 
    updateStatsRepos(); 
    updateChart(); 
    addSystemLog(`Loaded ${repos.length} repos`, 'success'); 
  } catch(e) { addSystemLog(`Error: ${e.message}`, 'error'); }
}
function updateChart() { 
  const ctx = document.getElementById('commitChart'); 
  if (!ctx) return; 
  if (chartInstance) chartInstance.destroy(); 
  const labels = allRepositories.slice(0,7).map(r=>r.name.substring(0,12)); 
  const data = allRepositories.slice(0,7).map(r=>r.stargazers_count); 
  chartInstance = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Stars', data, borderColor: '#2f81f7', tension: 0.3 }] }, options: { responsive: true } }); 
}
function updateStatsRepos() { 
  document.getElementById('repoStatsHeader').style.display = 'flex'; 
  document.getElementById('totalReposCount').textContent = allRepositories.length; 
  document.getElementById('totalStarsCount').textContent = allRepositories.reduce((a,b)=>a+b.stargazers_count,0); 
  document.getElementById('totalForksCount').textContent = allRepositories.reduce((a,b)=>a+b.forks_count,0); 
}
function applyFiltersAndSort() { 
  let filtered = [...allRepositories]; 
  if (currentFilter === 'public') filtered = filtered.filter(r=>!r.private); 
  if (currentFilter === 'private') filtered = filtered.filter(r=>r.private); 
  const search = document.getElementById('repoSearchInput')?.value.toLowerCase() || ''; 
  if (search) filtered = filtered.filter(r=>r.name.toLowerCase().includes(search)||(r.description||'').toLowerCase().includes(search)); 
  if (currentSort === 'name') filtered.sort((a,b)=>a.name.localeCompare(b.name)); 
  else if (currentSort === 'stars') filtered.sort((a,b)=>b.stargazers_count - a.stargazers_count); 
  else filtered.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)); 
  const pinned = filtered.filter(r=>pinnedRepos.includes(r.name)); 
  const unpinned = filtered.filter(r=>!pinnedRepos.includes(r.name)); 
  filteredRepositories = [...pinned, ...unpinned]; 
  renderRepositories(); 
}
function renderRepositories() { 
  const container = document.getElementById('repoListContainerEnhanced'); 
  if (!container) return; 
  const start = (currentPage-1)*itemsPerPage; 
  const pageRepos = filteredRepositories.slice(start, start+itemsPerPage); 
  if (!pageRepos.length && filteredRepositories.length) { currentPage = 1; renderRepositories(); return; } 
  container.innerHTML = pageRepos.map(repo => `<div class="repo-card-enhanced"><div class="pin-badge" data-repo="${repo.name}"><i class="fas ${pinnedRepos.includes(repo.name) ? 'fa-star' : 'fa-star-o'}"></i></div><div class="repo-header-enhanced"><div class="repo-name-enhanced"><i class="fas fa-book"></i><a href="${repo.html_url}" target="_blank">${escapeHtml(repo.name)}</a></div><div class="visibility-badge ${repo.private?'private':'public'}">${repo.private?'Private':'Public'}</div></div><div class="repo-desc-enhanced">${escapeHtml(repo.description || 'No description')}</div><div class="repo-meta-enhanced"><span><i class="fas fa-star"></i> ${repo.stargazers_count}</span><span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span><span>🕒 ${getRelativeTime(repo.updated_at)}</span></div><div class="repo-actions-enhanced"><button class="repo-action-btn" data-action="open" data-url="${repo.html_url}"><i class="fab fa-github"></i> Open</button><button class="repo-action-btn" data-action="clone" data-repo="${repo.name}" data-url="${repo.clone_url}"><i class="fas fa-code-branch"></i> Clone</button><button class="repo-action-btn" data-action="copy" data-url="${repo.clone_url}"><i class="fas fa-copy"></i> Copy</button><button class="repo-action-btn danger" data-action="delete" data-repo="${repo.name}"><i class="fas fa-trash-alt"></i> Delete</button></div></div>`).join(''); 
  attachRepoEvents(); 
  updatePagination(); 
}
function attachRepoEvents() { 
  document.querySelectorAll('.pin-badge').forEach(b=>b.addEventListener('click',(e)=>{ e.stopPropagation(); const name=b.dataset.repo; if(pinnedRepos.includes(name)) pinnedRepos=pinnedRepos.filter(p=>p!==name); else pinnedRepos.push(name); localStorage.setItem('pinnedRepos',JSON.stringify(pinnedRepos)); applyFiltersAndSort(); })); 
  document.querySelectorAll('.repo-action-btn').forEach(b=>b.addEventListener('click',()=>{ const action=b.dataset.action; if(action==='open') window.open(b.dataset.url,'_blank'); if(action==='clone') showCloneModal(b.dataset.repo); if(action==='copy') navigator.clipboard.writeText(b.dataset.url).then(()=>showToast('Copied!')); if(action==='delete') showDeleteModal(b.dataset.repo); })); 
}
function showCloneModal(repoName) { 
  const repo = allRepositories.find(r=>r.name===repoName); 
  if(repo){ currentCloneTarget=repo; document.getElementById('cloneUrlText').textContent=repo.clone_url; document.getElementById('cloneCommandText').textContent=repo.clone_url; document.getElementById('cloneModal').classList.add('active'); } 
}
function showDeleteModal(repoName) { 
  currentDeleteTarget=repoName; 
  document.getElementById('deleteRepoNameDisplay').textContent=repoName; 
  document.getElementById('deleteConfirmInput').value=''; 
  document.getElementById('deleteModal').classList.add('active'); 
  document.getElementById('confirmDeleteModalBtn').onclick=async()=>{ 
    if(document.getElementById('deleteConfirmInput').value===currentDeleteTarget){ 
      await githubRequest(`/repos/${gitUsername}/${currentDeleteTarget}`,'DELETE'); 
      showToast(`Deleted ${currentDeleteTarget}`); 
      await loadRepositoriesEnhanced(); 
      closeModal('deleteModal'); 
    } else showToast('Name mismatch','error'); 
  }; 
}
function updatePagination() { 
  const total=Math.ceil(filteredRepositories.length/itemsPerPage); 
  const container=document.getElementById('paginationContainer'); 
  if(total<=1){ container.style.display='none'; return; } 
  container.style.display='flex'; 
  document.getElementById('pageInfo').textContent=`Page ${currentPage} of ${total}`; 
  document.getElementById('prevPageBtn').disabled=currentPage===1; 
  document.getElementById('nextPageBtn').disabled=currentPage===total; 
  document.getElementById('prevPageBtn').onclick=()=>{ if(currentPage>1){currentPage--;renderRepositories();}}; 
  document.getElementById('nextPageBtn').onclick=()=>{ if(currentPage<total){currentPage++;renderRepositories();}}; 
}
function closeModal(id){ document.getElementById(id).classList.remove('active'); currentDeleteTarget=null; currentCloneTarget=null; }
window.closeModal = closeModal; 
window.copyCloneUrl = () => { if(currentCloneTarget) navigator.clipboard.writeText(currentCloneTarget.clone_url).then(()=>showToast('Copied!')); };

// ========== Create/Delete Repo ==========
document.getElementById('confirmCreateRepo')?.addEventListener('click', async () => { 
  const name=document.getElementById('newRepoName').value.trim(); 
  if(!name) return; 
  await githubRequest('/user/repos','POST',{name,description:document.getElementById('repoDesc').value,private:document.getElementById('repoPrivate').checked}); 
  showToast(`Created ${name}`); 
  await loadRepositoriesEnhanced(); 
});
document.getElementById('confirmDeleteRepoBtn')?.addEventListener('click', async () => { 
  const name=document.getElementById('deleteRepoName').value.trim(); 
  const confirm=document.getElementById('confirmDeleteName').value.trim(); 
  if(name && name===confirm){ 
    await githubRequest(`/repos/${gitUsername}/${name}`,'DELETE'); 
    showToast(`Deleted ${name}`); 
    await loadRepositoriesEnhanced(); 
    document.getElementById('deleteRepoName').value=''; 
    document.getElementById('confirmDeleteName').value=''; 
  } else showToast('Name mismatch','error'); 
});

// ========== Upload System ==========
function buildFileTree(files) { 
  const tree={}; 
  files.forEach(f=>{ 
    const path=f.webkitRelativePath||f.name; 
    const parts=path.split('/'); 
    let cur=tree; 
    for(let i=0;i<parts.length;i++){ 
      const p=parts[i]; 
      if(i===parts.length-1){ 
        if(!cur[p]) cur[p]={type:'file',name:p,file:f}; 
      } else { 
        if(!cur[p]) cur[p]={type:'folder',name:p,children:{}}; 
        cur=cur[p].children; 
      } 
    } 
  }); 
  return tree; 
}
function renderTreeHTML(tree,level=0){ 
  let html=''; 
  for(const[name,node] of Object.entries(tree)){ 
    const indent=level*20; 
    if(node.type==='folder'){ 
      html+=`<div class="tree-item tree-folder" style="padding-left:${indent}px" onclick="toggleFolder(this)"><i class="fas fa-folder"></i> ${escapeHtml(name)}</div><div class="folder-children">${renderTreeHTML(node.children,level+1)}</div>`; 
    }else{ 
      const isGenerated = name === 'README.md' || name === 'LICENSE';
      html+=`<div class="tree-item tree-file ${isGenerated ? 'generated' : ''}" style="padding-left:${indent}px"><i class="fas fa-file"></i> ${escapeHtml(name)}</div>`; 
    } 
  } 
  return html; 
}
window.toggleFolder=function(el){ const children=el.nextElementSibling; if(children) children.classList.toggle('open'); };
function updateFileTree(){ 
  const filesWithGen=[...selectedFiles]; 
  if(currentReadmeContent) filesWithGen.push({webkitRelativePath:'README.md'}); 
  if(currentLicenseContent) filesWithGen.push({webkitRelativePath:'LICENSE'}); 
  const tree=buildFileTree(filesWithGen); 
  document.getElementById('fileTreeContainer').innerHTML=renderTreeHTML(tree,0); 
  document.querySelector('.preview-tab[data-preview="files"]').innerHTML=`📄 Files (${filesWithGen.length})`; 
  document.getElementById('previewFiles').innerHTML=renderTreeHTML(tree,0); 
}
function generateReadme(){ 
  const project=document.getElementById('readmeProjectName').value||'My Project'; 
  const desc=document.getElementById('readmeDesc').value||'Description'; 
  const features=document.getElementById('readmeFeatures').value.split(',').map(f=>f.trim()).filter(f=>f); 
  const install=document.getElementById('readmeInstall').value||'```bash\nnpm install\n```'; 
  const usage=document.getElementById('readmeUsage').value||'```bash\nnpm start\n```'; 
  const author=document.getElementById('readmeAuthor').value||gitUsername||'user'; 
  let md=`# ${project}\n\n${desc}\n\n## ✨ Features\n`; 
  features.forEach(f=>md+=`- ${f}\n`); 
  md+=`\n## 📦 Installation\n\n${install}\n\n## 🚀 Usage\n\n${usage}\n\n## 👤 Author\n\n${author}\n\n## 📄 License\n\n${document.getElementById('addLicenseCheckbox').checked?'MIT License':'None'}`; 
  document.getElementById('readmeMarkdown').value=md; 
  document.getElementById('splitMarkdown').value=md; 
  renderMarkdown(); 
  updateGeneratedFiles(); 
}
function renderMarkdown(){ 
  const md=document.getElementById('readmeMarkdown').value; 
  currentReadmeContent=md; 
  const html=marked.parse(md); 
  document.getElementById('markdownPreview').innerHTML=html; 
  document.getElementById('splitPreview').innerHTML=html; 
  document.getElementById('readmePreviewRender').innerHTML=html; 
  updateFileTree(); 
}
function generateLicense(){ 
  const year=new Date().getFullYear(); 
  const name=gitUsername||'user'; 
  currentLicenseContent=`MIT License\n\nCopyright (c) ${year} ${name}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...`; 
  document.getElementById('licensePreviewText').innerText=currentLicenseContent; 
  updateFileTree(); 
}
function updateGeneratedFiles(){ 
  if(document.getElementById('addLicenseCheckbox').checked) generateLicense(); 
  else currentLicenseContent=''; 
  renderMarkdown(); 
  updateFileTree(); 
}
async function commitAndUpload(){ 
  const repo=document.getElementById('uploadRepo').value.trim(); 
  const branch=document.getElementById('branchName').value.trim(); 
  const msg=document.getElementById('commitMsg').value.trim(); 
  if(!repo||(!selectedFiles.length&&!currentReadmeContent)){ showToast('Select files or generate README','error'); return; } 
  showProgress(); 
  addSystemLog(`Uploading to ${repo}:${branch}`,'info'); 
  const allFiles=[...selectedFiles]; 
  if(currentReadmeContent) allFiles.push({name:'README.md',content:currentReadmeContent,webkitRelativePath:'README.md'}); 
  if(currentLicenseContent) allFiles.push({name:'LICENSE',content:currentLicenseContent,webkitRelativePath:'LICENSE'}); 
  let success=0; 
  for(let i=0;i<allFiles.length;i++){ 
    const f=allFiles[i]; 
    const path=f.webkitRelativePath||f.name; 
    updateProgress((i/allFiles.length)*100,`${i+1}/${allFiles.length} - ${path.substring(0,40)}`); 
    try{ 
      const content=f.content||await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result.split(',')[1]); fr.readAsDataURL(f);}); 
      await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(path)}`,'PUT',{message:msg,content:content,branch:branch}); 
      addSystemLog(`✓ ${path}`,'success'); 
      success++; 
    }catch(e){ addSystemLog(`✗ ${path}: ${e.message}`,'error'); } 
  } 
  updateProgress(100,'Complete!'); 
  addSystemLog(`Uploaded ${success}/${allFiles.length} files`,success===allFiles.length?'success':'warning'); 
  hideProgress(); 
  showToast('Upload completed!'); 
  selectedFiles=[]; 
  updateFileTree(); 
}

// ========== Event Listeners ==========
document.getElementById('showLoginBtn')?.addEventListener('click',()=>document.getElementById('loginModal').classList.add('active'));
document.getElementById('doLoginBtn')?.addEventListener('click',authenticateAndVerify);
document.getElementById('closeLoginModal')?.addEventListener('click',()=>document.getElementById('loginModal').classList.remove('active'));
document.getElementById('logoutBtn')?.addEventListener('click',logout);
document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',()=>navigateTo(n.dataset.page)));
document.querySelectorAll('.quick-btn').forEach(b=>b.addEventListener('click',()=>navigateTo(b.dataset.page)));
document.getElementById('refreshReposBtn')?.addEventListener('click',()=>loadRepositoriesEnhanced(true));
document.getElementById('repoSearchInput')?.addEventListener('input',()=>{currentPage=1;applyFiltersAndSort();});
document.querySelectorAll('.filter-btn').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(f=>f.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;currentPage=1;applyFiltersAndSort();}));
document.getElementById('sortSelect')?.addEventListener('change',e=>{currentSort=e.target.value;applyFiltersAndSort();});
document.getElementById('generateReadmeBtn')?.addEventListener('click',generateReadme);
document.getElementById('aiGenerateBtn')?.addEventListener('click',()=>{generateReadme();addSystemLog('AI README generated','success');});
document.getElementById('addLicenseCheckbox')?.addEventListener('change',updateGeneratedFiles);
document.getElementById('commitUploadBtn')?.addEventListener('click',commitAndUpload);
document.getElementById('readmeMarkdown')?.addEventListener('input',renderMarkdown);
document.getElementById('splitMarkdown')?.addEventListener('input',e=>{document.getElementById('readmeMarkdown').value=e.target.value;renderMarkdown();});
document.querySelectorAll('.editor-tab').forEach(t=>t.addEventListener('click',()=>{const mode=t.dataset.editor;document.querySelectorAll('.editor-tab').forEach(et=>et.classList.remove('active'));t.classList.add('active');document.querySelectorAll('.editor-pane').forEach(p=>p.classList.remove('active'));document.getElementById(mode+'Pane').classList.add('active');}));
document.querySelectorAll('.preview-tab').forEach(t=>t.addEventListener('click',()=>{const target=t.dataset.preview;document.querySelectorAll('.preview-tab').forEach(pt=>pt.classList.remove('active'));t.classList.add('active');document.getElementById('previewFiles').style.display=target==='files'?'block':'none';document.getElementById('previewReadme').style.display=target==='readme'?'block':'none';document.getElementById('previewLicense').style.display=target==='license'?'block':'none';}));
document.getElementById('themeToggle')?.addEventListener('click',()=>document.body.classList.toggle('light'));
document.getElementById('menuToggle')?.addEventListener('click',()=>{document.getElementById('sidebar').classList.toggle('open');document.getElementById('mainContent').classList.toggle('sidebar-closed');});
document.getElementById('toggleTerminalBtn')?.addEventListener('click',()=>{const body=document.querySelector('.terminal-body');body.classList.toggle('collapsed');document.getElementById('toggleTerminalBtn').innerHTML=body.classList.contains('collapsed')?'+':'−';});

// ========== Drop Zone ==========
const dropZone=document.getElementById('dropZone'); 
const fileInput=document.getElementById('fileInput');
dropZone.addEventListener('click',()=>fileInput.click());
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop',async e=>{e.preventDefault();dropZone.classList.remove('drag-over');const items=e.dataTransfer.items;let files=[];const traverse=async(entry,path='')=>{if(entry.isFile){const f=await new Promise(r=>entry.file(r));Object.defineProperty(f,'webkitRelativePath',{value:path+f.name});files.push(f);}else if(entry.isDirectory){const reader=entry.createReader();await new Promise(res=>reader.readEntries(async entries=>{for(let ent of entries)await traverse(ent,path+entry.name+'/');res();}));}};for(let i=0;i<items.length;i++){const entry=items[i].webkitGetAsEntry();if(entry)await traverse(entry);}selectedFiles=files;updateFileTree();addSystemLog(`${files.length} files selected`,'success');});
fileInput.addEventListener('change',()=>{selectedFiles=Array.from(fileInput.files);updateFileTree();});

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(q=>{q.addEventListener('click',()=>{const item=q.parentElement;item.classList.toggle('active');const ans=item.querySelector('.faq-answer');if(ans)ans.style.display=item.classList.contains('active')?'block':'none';});});

// Terminal Welcome
addSystemLog('RepoFlow v3.0 Ready - Premium GitHub Manager', 'success');
addSystemLog('Login with your GitHub credentials to start', 'info');
