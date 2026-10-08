const API_BASE = `http://${window.location.hostname}:3000/api`;

const categories = {
  '电子元件': ['电阻', '电容', '电感', '二极管', '三极管', 'IC芯片', 'LED', '开关', '连接器', '晶振', '传感器', '其他'],
  '五金件': ['螺丝', '螺母', '垫片', '铜柱', '卡扣', '弹簧', '轴承', '导轨', '支架', '外壳', '其他']
};

let currentComponents = [];

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  loadComponents();
  loadActivityLog();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('type').addEventListener('change', updateCategoryOptions);
  document.getElementById('typeFilter').addEventListener('change', filterComponents);
  document.getElementById('categoryFilter').addEventListener('change', filterComponents);
  document.getElementById('searchInput').addEventListener('input', debounce(filterComponents, 300));
  document.getElementById('componentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('username').addEventListener('change', saveUsername);

  updateCategoryOptions();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function loadUsername() {
  const saved = localStorage.getItem('username');
  if (saved) {
    document.getElementById('username').value = saved;
  }
}

function saveUsername() {
  const username = document.getElementById('username').value;
  localStorage.setItem('username', username);
}

function getUsername() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    alert('请先输入你的名字');
    document.getElementById('username').focus();
    return null;
  }
  return username;
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const stats = await response.json();

    document.getElementById('totalItems').textContent = stats.total_items || 0;
    document.getElementById('electronicCount').textContent = stats.electronic_count || 0;
    document.getElementById('hardwareCount').textContent = stats.hardware_count || 0;
    document.getElementById('lowStockCount').textContent = stats.low_stock_count || 0;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

async function loadComponents() {
  try {
    const response = await fetch(`${API_BASE}/components`);
    currentComponents = await response.json();
    renderComponents(currentComponents);
    updateCategoryFilter();
  } catch (error) {
    console.error('加载元件列表失败:', error);
  }
}

function renderComponents(components) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (components.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-tertiary);">暂无数据</td></tr>';
    return;
  }

  components.forEach(comp => {
    const tr = document.createElement('tr');
    const quantityClass = comp.quantity < 10 ? 'low-stock' : '';
    const lastUpdate = new Date(comp.last_updated).toLocaleString('zh-CN');

    tr.innerHTML = `
      <td>${comp.type}</td>
      <td>${comp.category}</td>
      <td>${comp.name}</td>
      <td>${comp.specification || '-'}</td>
      <td class="${quantityClass}">${comp.quantity}</td>
      <td>${comp.unit}</td>
      <td>${comp.location || '-'}</td>
      <td>${comp.notes || '-'}</td>
      <td><small>${lastUpdate}<br/>${comp.updated_by || ''}</small></td>
      <td>
        <button class="btn btn-edit" onclick="editComponent(${comp.id})">编辑</button>
        <button class="btn btn-danger" onclick="deleteComponent(${comp.id})">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateCategoryOptions() {
  const type = document.getElementById('type').value;
  const categorySelect = document.getElementById('category');
  categorySelect.innerHTML = '<option value="">请选择</option>';

  if (categories[type]) {
    categories[type].forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }
}

function updateCategoryFilter() {
  const allCategories = new Set();
  currentComponents.forEach(comp => allCategories.add(comp.category));

  const filterSelect = document.getElementById('categoryFilter');
  const currentValue = filterSelect.value;
  filterSelect.innerHTML = '<option value="">所有分类</option>';

  Array.from(allCategories).sort().forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filterSelect.appendChild(option);
  });

  filterSelect.value = currentValue;
}

function filterComponents() {
  const type = document.getElementById('typeFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();

  const filtered = currentComponents.filter(comp => {
    const matchType = !type || comp.type === type;
    const matchCategory = !category || comp.category === category;
    const matchSearch = !search ||
      comp.name.toLowerCase().includes(search) ||
      (comp.specification && comp.specification.toLowerCase().includes(search)) ||
      (comp.notes && comp.notes.toLowerCase().includes(search));

    return matchType && matchCategory && matchSearch;
  });

  renderComponents(filtered);
}


function showAddModal() {
  document.getElementById('modalTitle').textContent = '添加元件';
  document.getElementById('componentForm').reset();
  document.getElementById('componentId').value = '';
  updateCategoryOptions();
  document.getElementById('modal').style.display = 'block';
}

async function editComponent(id) {
  try {
    const response = await fetch(`${API_BASE}/components/${id}`);
    const comp = await response.json();

    document.getElementById('modalTitle').textContent = '编辑元件';
    document.getElementById('componentId').value = comp.id;
    document.getElementById('type').value = comp.type;
    updateCategoryOptions();
    document.getElementById('category').value = comp.category;
    document.getElementById('name').value = comp.name;
    document.getElementById('specification').value = comp.specification || '';
    document.getElementById('quantity').value = comp.quantity;
    document.getElementById('unit').value = comp.unit;
    document.getElementById('location').value = comp.location || '';
    document.getElementById('notes').value = comp.notes || '';

    document.getElementById('modal').style.display = 'block';
  } catch (error) {
    console.error('加载元件数据失败:', error);
    alert('加载元件数据失败');
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const username = getUsername();
  if (!username) return;

  const id = document.getElementById('componentId').value;
  const data = {
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    name: document.getElementById('name').value,
    specification: document.getElementById('specification').value,
    quantity: parseInt(document.getElementById('quantity').value),
    unit: document.getElementById('unit').value,
    location: document.getElementById('location').value,
    notes: document.getElementById('notes').value,
    updated_by: username
  };

  try {
    let response;
    if (id) {
      response = await fetch(`${API_BASE}/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch(`${API_BASE}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    const result = await response.json();

    if (response.ok) {
      closeModal();
      loadComponents();
      loadStats();
      loadActivityLog();
    } else {
      alert('操作失败: ' + result.error);
    }
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败');
  }
}

async function deleteComponent(id) {
  if (!confirm('确定要删除这个元件吗？')) return;

  const username = getUsername();
  if (!username) return;

  try {
    const response = await fetch(`${API_BASE}/components/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updated_by: username })
    });

    if (response.ok) {
      loadComponents();
      loadStats();
      loadActivityLog();
    } else {
      alert('删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败');
  }
}

async function loadActivityLog() {
  try {
    const response = await fetch(`${API_BASE}/activity-log?limit=20`);
    const logs = await response.json();

    const logContainer = document.getElementById('activityLog');
    logContainer.innerHTML = '';

    if (logs.length === 0) {
      logContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">暂无活动记录</p>';
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const actionText = getActionText(log.action);
      const quantityText = log.quantity_change ? ` (${log.quantity_change > 0 ? '+' : ''}${log.quantity_change})` : '';
      const timestamp = new Date(log.timestamp).toLocaleString('zh-CN');

      item.innerHTML = `
        <div class="activity-icon">${getActionIcon(log.action)}</div>
        <div class="activity-details">
          <div class="activity-action">${actionText} ${log.component_name || '元件 #' + log.component_id}${quantityText}</div>
          <div class="activity-meta">${log.user} ${log.notes ? '· ' + log.notes : ''}</div>
        </div>
        <div class="activity-time">${timestamp}</div>
      `;

      logContainer.appendChild(item);
    });
  } catch (error) {
    console.error('加载活动日志失败:', error);
  }
}

function getActionText(action) {
  const actions = {
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'add': '入库',
    'remove': '出库',
    'import': '导入'
  };
  return actions[action] || action;
}

function getActionIcon(action) {
  const icons = {
    'create': '+',
    'update': '✎',
    'delete': '×',
    'add': '↑',
    'remove': '↓',
    'import': '⇓'
  };
  return icons[action] || '·';
}

async function exportData() {
  try {
    const response = await fetch(`${API_BASE}/export`);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `库存数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
}

function showImportModal() {
  document.getElementById('importModal').style.display = 'block';
  document.getElementById('importFile').value = '';
  document.getElementById('importMode').value = 'merge';
}

function closeImportModal() {
  document.getElementById('importModal').style.display = 'none';
}

async function processImport() {
  const fileInput = document.getElementById('importFile');
  const mode = document.getElementById('importMode').value;

  if (!fileInput.files || !fileInput.files[0]) {
    alert('请先选择文件');
    return;
  }

  const username = getUsername();
  if (!username) return;

  const file = fileInput.files[0];

  if (mode === 'replace' && !confirm('⚠️ 警告：替换模式会删除所有现有数据！\n\n确定要继续吗？')) {
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.components || !Array.isArray(data.components)) {
      alert('文件格式错误：缺少 components 数组');
      return;
    }

    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        components: data.components,
        mode: mode,
        updated_by: username
      })
    });

    const result = await response.json();

    if (response.ok) {
      closeImportModal();
      loadComponents();
      loadStats();
      loadActivityLog();
      alert(`导入完成！\n成功: ${result.success} 条\n失败: ${result.error} 条`);
    } else {
      alert('导入失败: ' + result.error);
    }
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败: ' + error.message);
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('modal');
  const importModal = document.getElementById('importModal');
  const gitModal = document.getElementById('gitModal');

  if (event.target === modal) {
    closeModal();
  }

  if (event.target === importModal) {
    closeImportModal();
  }

  if (event.target === gitModal) {
    closeGitModal();
  }
};

// Git同步功能
async function showGitModal() {
  document.getElementById('gitModal').style.display = 'block';
  await loadGitConfig();
}

function closeGitModal() {
  document.getElementById('gitModal').style.display = 'none';
}

async function loadGitConfig() {
  try {
    const response = await fetch(`${API_BASE}/git/config`);
    const config = await response.json();

    if (config.configured) {
      document.getElementById('gitRepoUrl').value = config.repoUrl || '';
      document.getElementById('gitBranch').value = config.branch || 'main';
      document.getElementById('gitUsername').value = config.username || '';
      document.getElementById('gitEmail').value = config.email || '';
      document.getElementById('gitRepoInfo').textContent = `仓库: ${config.repoUrl} (${config.branch})`;

      document.getElementById('gitConfigSection').style.display = 'none';
      document.getElementById('gitSyncSection').style.display = 'block';
    } else {
      document.getElementById('gitConfigSection').style.display = 'block';
      document.getElementById('gitSyncSection').style.display = 'none';
    }
  } catch (error) {
    console.error('加载Git配置失败:', error);
    // 如果Git功能不可用，显示错误提示
    document.getElementById('gitConfigSection').innerHTML = `
      <div style="padding: 20px; text-align: center; color: #e74c3c;">
        <p>⚠️ Git功能不可用</p>
        <p style="font-size: 14px; margin-top: 10px;">可能原因：</p>
        <ul style="text-align: left; display: inline-block; font-size: 14px;">
          <li>Git未安装或未配置SSH密钥</li>
          <li>没有仓库访问权限</li>
          <li>网络连接问题</li>
        </ul>
        <p style="font-size: 14px; margin-top: 15px; color: #95a5a6;">
          如需使用Git同步功能，请联系管理员配置
        </p>
      </div>
    `;
    document.getElementById('gitSyncSection').style.display = 'none';
  }
}

function showGitConfig() {
  document.getElementById('gitConfigSection').style.display = 'block';
  document.getElementById('gitSyncSection').style.display = 'none';
}

async function saveGitConfig() {
  const repoUrl = document.getElementById('gitRepoUrl').value.trim();
  const branch = document.getElementById('gitBranch').value.trim() || 'main';
  const username = document.getElementById('gitUsername').value.trim() || 'Lab User';
  const email = document.getElementById('gitEmail').value.trim() || 'lab@example.com';

  if (!repoUrl) {
    alert('请输入仓库地址');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/git/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, branch, username, email })
    });

    const result = await response.json();

    if (response.ok) {
      alert('Git配置保存成功！');
      await loadGitConfig();
    } else {
      alert('保存失败: ' + result.error);
    }
  } catch (error) {
    console.error('保存Git配置失败:', error);
    alert('保存失败: ' + error.message);
  }
}

async function gitPush() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    alert('请先输入你的名字');
    return;
  }

  const message = document.getElementById('gitCommitMsg').value.trim();

  if (!confirm('确定要推送当前数据到Git仓库吗？\n这会导出当前所有数据并提交到远程仓库。')) {
    return;
  }

  try {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '推送中...';

    const response = await fetch(`${API_BASE}/git/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, username })
    });

    const result = await response.json();

    btn.disabled = false;
    btn.textContent = '⬆️ 推送到Git';

    if (response.ok) {
      alert('✅ 推送成功！\n\n' + result.message);
      document.getElementById('gitCommitMsg').value = '';
      loadActivityLog();
    } else {
      // 友好的错误提示
      let errorMsg = '❌ Git推送失败\n\n';
      if (result.error && result.error.includes('Host key verification failed')) {
        errorMsg += '原因：SSH密钥未配置或无访问权限\n\n';
        errorMsg += '解决方法：\n';
        errorMsg += '1. 请联系管理员获取仓库访问权限\n';
        errorMsg += '2. 或使用"导出数据"功能手动备份';
      } else if (result.error && result.error.includes('Could not read from remote repository')) {
        errorMsg += '原因：没有仓库访问权限\n\n';
        errorMsg += '建议：使用"导出数据"功能进行本地备份';
      } else {
        errorMsg += result.error + '\n\n';
        if (result.details) errorMsg += '详情: ' + result.details;
      }
      alert(errorMsg);
    }
  } catch (error) {
    console.error('推送失败:', error);
    alert('❌ 推送失败\n\n建议使用"导出数据"功能进行本地备份\n\n错误: ' + error.message);
    event.target.disabled = false;
    event.target.textContent = '⬆️ 推送到Git';
  }
}

async function gitPull() {
  const username = document.getElementById('username').value.trim() || 'Git用户';

  if (!confirm('确定要从Git仓库拉取数据吗？\n⚠️ 这会替换当前所有本地数据！\n\n建议先导出备份当前数据。')) {
    return;
  }

  try {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '拉取中...';

    const response = await fetch(`${API_BASE}/git/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const result = await response.json();

    btn.disabled = false;
    btn.textContent = '⬇️ 从Git拉取';

    if (response.ok) {
      await loadComponents();
      await loadStats();
      await loadActivityLog();
      alert(`✅ 拉取并导入成功！\n\n成功导入: ${result.success} 条\n数据来源: ${result.exportBy || '未知'}\n导出时间: ${result.exportTime || '未知'}`);
    } else {
      // 友好的错误提示
      let errorMsg = '❌ Git拉取失败\n\n';
      if (result.error && result.error.includes('Host key verification failed')) {
        errorMsg += '原因：SSH密钥未配置或无访问权限\n\n';
        errorMsg += '解决方法：\n';
        errorMsg += '1. 请联系管理员获取仓库访问权限\n';
        errorMsg += '2. 或让其他用户通过"导出数据"发送给你';
      } else if (result.error && result.error.includes('Could not read from remote repository')) {
        errorMsg += '原因：没有仓库访问权限\n\n';
        errorMsg += '建议：请其他用户导出数据后发送给你导入';
      } else {
        errorMsg += result.error + '\n\n';
        if (result.details) errorMsg += '详情: ' + result.details;
      }
      alert(errorMsg);
    }
  } catch (error) {
    console.error('拉取失败:', error);
    alert('❌ 拉取失败\n\n建议使用"导入数据"功能获取其他用户的数据\n\n错误: ' + error.message);
    event.target.disabled = false;
    event.target.textContent = '⬇️ 从Git拉取';
  }
}

