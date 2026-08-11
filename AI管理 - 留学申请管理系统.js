(function () {
  'use strict';

  var STORE_KEY = 'pbs_ai_admin_v2';
  var defaultState = {
    models: [
      { id: 'qwen', name: 'Qwen 主模型', provider: 'Qwen', endpoint: 'dashscope.aliyuncs.com', modelId: 'qwen3-max', context: 262144, enabled: true },
      { id: 'deepseek', name: 'DeepSeek 次选模型', provider: 'DeepSeek', endpoint: 'api.deepseek.com', modelId: 'deepseek-chat', context: 128000, enabled: true },
      { id: 'kimi', name: 'Kimi 长文本模型', provider: 'Kimi', endpoint: 'api.moonshot.cn', modelId: 'kimi-k2', context: 262144, enabled: false }
    ],
    primary: 'qwen',
    backup: 'deepseek',
    prompts: [],
    audit: [
      { time: '2026-08-12 09:32', action: '更新模型路由', detail: 'Qwen 主模型 → DeepSeek 次选模型' },
      { time: '2026-08-11 17:06', action: '发布提示词', detail: '硕士 / PS / v2.4' }
    ]
  };

  function createPrompts() {
    var levels = ['本科', '硕士', '博士'];
    var types = ['CV', 'PS', '推荐信', '研究计划'];
    var list = [];
    levels.forEach(function (level, li) {
      types.forEach(function (type, ti) {
        var draft = (li === 2 && ti > 1);
        list.push({
          id: level + '-' + type,
          level: level,
          type: type,
          version: draft ? 'v1.0' : 'v2.' + (li + ti + 1),
          score: draft ? '待评测' : String(86 + li * 2 + ti) + '.0',
          updated: draft ? '2026-08-10' : '2026-08-' + String(12 - li - ti).padStart(2, '0'),
          status: draft ? '草稿' : '已发布',
          primary: 'qwen',
          backup: 'deepseek',
          system: '你是 PBS 留学文书助手。根据申请层次与文书类型生成准确、具体且符合学生口吻的内容。',
          user: '请根据 {{student_profile}}、{{target_program}} 和 {{requirements}} 生成' + level + type + '初稿。',
          schema: '{\n  "content": "string",\n  "review_notes": []\n}'
        });
      });
    });
    return list;
  }

  function loadState() {
    var loaded = null;
    try { loaded = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { loaded = null; }
    var state = loaded || JSON.parse(JSON.stringify(defaultState));
    if (!state.prompts || !state.prompts.length) state.prompts = createPrompts();
    return state;
  }

  var state = loadState();
  var session = null;
  try { session = JSON.parse(localStorage.getItem('pbs_session_v1')); } catch (e) { session = null; }
  var canManageModels = !session || session.role === '超级管理员' || session.role === '平台运维人员';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function byId(id) { return document.getElementById(id); }
  function modelById(id) { return state.models.find(function (item) { return item.id === id; }); }
  function promptById(id) { return state.prompts.find(function (item) { return item.id === id; }); }

  window.showToast = function (message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.aiToastTimer);
    window.aiToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  };

  function addAudit(action, detail) {
    state.audit.unshift({ time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'), action: action, detail: detail });
    state.audit = state.audit.slice(0, 30);
    renderAudit();
  }

  function renderModels() {
    var rows = byId('modelRows');
    rows.innerHTML = state.models.map(function (model) {
      var position = model.id === state.primary ? '主模型' : (model.id === state.backup ? '次选模型' : '候选');
      var statusClass = model.enabled ? 'ok' : 'off';
      var statusText = model.enabled ? '可用' : '已停用';
      return '<tr>' +
        '<td><div class="model-name">' + escapeHtml(model.name) + '</div><div class="subtext">上下文 ' + Number(model.context).toLocaleString() + '</div></td>' +
        '<td><div>' + escapeHtml(model.provider) + '</div><div class="subtext">' + escapeHtml(model.endpoint) + '</div></td>' +
        '<td>' + escapeHtml(model.modelId) + '</td>' +
        '<td>' + position + '</td>' +
        '<td><span class="status ' + statusClass + '">' + statusText + '</span></td>' +
        '<td><div class="row-actions"><button onclick="openModelEditor(\'' + model.id + '\')">编辑</button><button onclick="toggleModel(\'' + model.id + '\')">' + (model.enabled ? '停用' : '启用') + '</button></div></td>' +
        '</tr>';
    }).join('');
    byId('modelCount').textContent = state.models.length;
    populateModelSelectors();
  }

  function populateSelect(select, selected, allowEmpty) {
    var options = allowEmpty ? '<option value="">不配置</option>' : '';
    options += state.models.filter(function (m) { return m.enabled; }).map(function (m) {
      return '<option value="' + escapeHtml(m.id) + '"' + (m.id === selected ? ' selected' : '') + '>' + escapeHtml(m.name) + '</option>';
    }).join('');
    select.innerHTML = options;
  }

  function populateModelSelectors() {
    populateSelect(byId('primaryModel'), state.primary, false);
    populateSelect(byId('backupModel'), state.backup, true);
    var editId = byId('promptEditId').value;
    var prompt = promptById(editId);
    populateSelect(byId('promptPrimary'), prompt ? prompt.primary : state.primary, false);
    populateSelect(byId('promptBackup'), prompt ? prompt.backup : state.backup, true);
  }

  window.openModelEditor = function (id) {
    var model = id ? modelById(id) : null;
    byId('modelModalTitle').textContent = model ? '编辑模型' : '新增模型';
    byId('modelEditId').value = model ? model.id : '';
    byId('modelName').value = model ? model.name : '';
    byId('providerName').value = model ? model.provider : 'Qwen';
    byId('endpoint').value = model ? model.endpoint : '';
    byId('apiKey').value = '';
    byId('modelId').value = model ? model.modelId : '';
    byId('contextLength').value = model ? model.context : 128000;
    byId('modelModal').classList.add('show');
  };

  window.closeModal = function (id) { byId(id).classList.remove('show'); };

  window.testConnection = function (button) {
    if (!byId('endpoint').value.trim() || !byId('modelId').value.trim()) { showToast('请先填写 API 地址和 Model ID'); return; }
    var old = button.textContent;
    button.disabled = true;
    button.textContent = '连接中…';
    setTimeout(function () { button.disabled = false; button.textContent = old; showToast('连接成功，耗时 236ms'); }, 700);
  };

  window.saveModel = function () {
    var name = byId('modelName').value.trim();
    var endpoint = byId('endpoint').value.trim();
    var modelId = byId('modelId').value.trim();
    if (!name || !endpoint || !modelId) { showToast('请完整填写模型名称、API 地址和 Model ID'); return; }
    var id = byId('modelEditId').value;
    var model = id ? modelById(id) : null;
    if (!model) {
      model = { id: 'model-' + Date.now(), enabled: true };
      state.models.push(model);
    }
    model.name = name;
    model.provider = byId('providerName').value;
    model.endpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    model.modelId = modelId;
    model.context = Number(byId('contextLength').value) || 128000;
    addAudit(id ? '编辑模型' : '新增模型', model.name + ' / ' + model.modelId);
    renderModels();
    closeModal('modelModal');
    showToast('模型配置已保存');
  };

  window.toggleModel = function (id) {
    var model = modelById(id);
    if (!model) return;
    if (model.enabled && (id === state.primary || id === state.backup)) { showToast('主备路由中的模型不能直接停用'); return; }
    model.enabled = !model.enabled;
    addAudit(model.enabled ? '启用模型' : '停用模型', model.name);
    renderModels();
  };

  window.saveModelPolicy = function () {
    var primary = byId('primaryModel').value;
    var backup = byId('backupModel').value;
    if (primary && primary === backup) { showToast('主模型与次选模型不能相同'); return; }
    state.primary = primary;
    state.backup = backup;
    addAudit('更新模型策略', (modelById(primary) || {}).name + ' → ' + ((modelById(backup) || {}).name || '未配置'));
    renderModels();
    saveState();
    showToast('模型策略已保存');
  };

  window.renderPrompts = function () {
    var level = byId('levelFilter').value;
    var type = byId('typeFilter').value;
    var list = state.prompts.filter(function (p) { return (level === '全部' || p.level === level) && (type === '全部' || p.type === type); });
    byId('promptRows').innerHTML = list.map(function (p) {
      var passed = p.status === '已发布';
      return '<tr><td><div class="prompt-title">' + escapeHtml(p.level + ' · ' + p.type) + '<small>' + escapeHtml(byId('scopeFilter').value) + '</small></div></td>' +
        '<td>' + escapeHtml(p.version) + '</td>' +
        '<td class="score ' + (passed ? 'good' : 'warn') + '">' + escapeHtml(p.score) + '</td>' +
        '<td>' + escapeHtml(p.updated) + '</td>' +
        '<td><span class="status ' + (passed ? 'ok' : 'warn') + '">' + escapeHtml(p.status) + '</span></td>' +
        '<td><div class="row-actions"><button onclick="openPromptEditor(\'' + escapeHtml(p.id) + '\')">编辑</button></div></td></tr>';
    }).join('');
    var published = state.prompts.filter(function (p) { return p.status === '已发布'; }).length;
    byId('publishedCount').textContent = published + ' / ' + state.prompts.length;
  };

  byId('scopeFilter').addEventListener('change', renderPrompts);

  window.openPromptEditor = function (id) {
    var prompt = promptById(id);
    if (!prompt) return;
    byId('promptEditId').value = prompt.id;
    byId('promptModalTitle').textContent = '编辑提示词 · ' + prompt.level + ' ' + prompt.type;
    byId('promptLevel').value = prompt.level;
    byId('promptType').value = prompt.type;
    byId('systemPrompt').value = prompt.system;
    byId('userPrompt').value = prompt.user;
    byId('outputSchema').value = prompt.schema;
    populateSelect(byId('promptPrimary'), prompt.primary, false);
    populateSelect(byId('promptBackup'), prompt.backup, true);
    byId('promptModal').classList.add('show');
  };

  function capturePrompt() {
    var prompt = promptById(byId('promptEditId').value);
    if (!prompt) return null;
    prompt.level = byId('promptLevel').value;
    prompt.type = byId('promptType').value;
    prompt.primary = byId('promptPrimary').value;
    prompt.backup = byId('promptBackup').value;
    prompt.system = byId('systemPrompt').value.trim();
    prompt.user = byId('userPrompt').value.trim();
    prompt.schema = byId('outputSchema').value.trim();
    prompt.updated = new Date().toISOString().slice(0, 10);
    return prompt;
  }

  function promptValid(prompt) {
    if (!prompt || !prompt.system || !prompt.user || !prompt.schema) { showToast('提示词与输出结构不能为空'); return false; }
    if (prompt.primary && prompt.primary === prompt.backup) { showToast('主模型与次选模型不能相同'); return false; }
    try { JSON.parse(prompt.schema); } catch (e) { showToast('输出结构不是有效 JSON'); return false; }
    return true;
  }

  window.testPrompt = function (button) {
    var prompt = capturePrompt();
    if (!promptValid(prompt)) return;
    var old = button.textContent;
    button.disabled = true;
    button.textContent = '测试中…';
    setTimeout(function () { button.disabled = false; button.textContent = old; showToast('测试通过，输出结构有效'); }, 800);
  };

  window.savePrompt = function () {
    var prompt = capturePrompt();
    if (!promptValid(prompt)) return;
    prompt.status = '草稿';
    prompt.score = '待评测';
    addAudit('保存提示词草稿', prompt.level + ' / ' + prompt.type + ' / ' + prompt.version);
    renderPrompts();
    saveState();
    closeModal('promptModal');
    showToast('提示词草稿已保存');
  };

  window.publishPrompt = function () {
    var prompt = capturePrompt();
    if (!promptValid(prompt)) return;
    showToast('正在运行发布前评测…');
    setTimeout(function () {
      prompt.status = '已发布';
      prompt.score = '88.0';
      var parts = prompt.version.replace('v', '').split('.');
      parts[parts.length - 1] = String((Number(parts[parts.length - 1]) || 0) + 1);
      prompt.version = 'v' + parts.join('.');
      addAudit('发布提示词', prompt.level + ' / ' + prompt.type + ' / ' + prompt.version);
      renderPrompts();
      saveState();
      closeModal('promptModal');
      showToast('评测通过，版本已发布');
    }, 1000);
  };

  window.runEvaluation = function (button) {
    var old = button.textContent;
    button.disabled = true;
    button.textContent = '评测中…';
    setTimeout(function () {
      button.disabled = false;
      button.textContent = old;
      byId('passRate').textContent = '83%';
      byId('passBar').style.width = '83%';
      addAudit('运行全量评测', '12 个提示词版本，10 个达到发布门槛');
      showToast('评测完成：10 个版本通过，2 个待优化');
    }, 1200);
  };

  function renderAudit() {
    byId('auditList').innerHTML = state.audit.map(function (item) {
      return '<div class="audit-item"><time>' + escapeHtml(item.time) + '</time><b>' + escapeHtml(item.action) + '</b><p>' + escapeHtml(item.detail) + '</p></div>';
    }).join('');
  }

  window.toggleAudit = function (show) { byId('auditDrawer').classList.toggle('show', !!show); };

  function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  window.saveAll = function () {
    if (canManageModels) saveModelPolicy();
    saveState();
    showToast('AI 配置已保存');
  };

  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (event) { if (event.target === modal) closeModal(modal.id); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(function (modal) { closeModal(modal.id); });
      toggleAudit(false);
    }
  });

  if (!canManageModels) {
    byId('modelSection').style.display = 'none';
    byId('modelMetric').style.display = 'none';
    byId('failoverMetric').style.display = 'none';
    document.querySelector('.summary').style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
    byId('scopeFilter').value = '当前 SaaS 租户';
    byId('scopeFilter').querySelector('option:first-child').disabled = true;
  }
  renderModels();
  renderPrompts();
  renderAudit();
})();
