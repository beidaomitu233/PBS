/* PBS AI 管理原型：配置保存在本地，API Key 仅记录末四位。 */
(function () {
  'use strict';

  var AI_STORAGE_KEY = 'pbs_ai_management_v3';
  var LEGACY_AI_STORAGE_KEY = 'pbs_ai_management_v2';
  var OPERATION_LOG_KEY = 'pbs_operation_logs_v1';
  var AI_TABS = ['vendors', 'models', 'params', 'prompts', 'evaluation'];
  var activePrompt = 0;
  var currentReportId = '';
  var pendingPublishPromptKey = '';
  var pendingPublishPromptTitle = '';
  var customDatasetCount = 0;
  var autoSaveTimers = {};
  var evalTimer = null;

  var PROVIDER_PRESETS = {
    qwen: { name: 'Qwen', short: 'QW', color: '#7c6aed', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    deepseek: { name: 'DeepSeek', short: 'DS', color: '#2563eb', url: 'https://api.deepseek.com' },
    kimi: { name: 'Kimi', short: 'KM', color: '#111827', url: 'https://api.moonshot.cn/v1' },
    seed: { name: 'Seed', short: 'SE', color: '#0f766e', url: 'https://ark.cn-beijing.volces.com/api/v3' },
    glm: { name: 'GLM', short: 'GLM', color: '#1d4ed8', url: 'https://open.bigmodel.cn/api/paas/v4' },
    openai_compatible: { name: 'OpenAI 兼容服务', short: 'OA', color: '#475569', url: '' }
  };

  var DEFAULT_PROVIDERS = Object.keys(PROVIDER_PRESETS).map(function (type) {
    var p = PROVIDER_PRESETS[type];
    return { id: type, type: type, name: p.name, defaultUrl: p.url, customUrl: '', hasKey: false, keyLast4: '', enabled: false, status: 'unconfigured', latency: null, auth: 'Bearer Token', header: 'Authorization', timeout: 60, rotate: '到期前 14 天', builtin: true };
  });

  var DEFAULT_MODELS = [
    { id: 'm-qwen', name: 'Qwen 主模型', providerId: 'qwen', modelId: 'qwen-plus', context: 131072, maxOutput: 8192, inputPrice: 0, outputPrice: 0, enabled: true },
    { id: 'm-deepseek', name: 'DeepSeek 次模型', providerId: 'deepseek', modelId: 'deepseek-v4-flash', context: 131072, maxOutput: 65536, inputPrice: 0, outputPrice: 0, enabled: true },
    { id: 'm-kimi', name: 'Kimi 长文本模型', providerId: 'kimi', modelId: 'kimi-k2.6', context: 131072, maxOutput: 32768, inputPrice: 0, outputPrice: 0, enabled: true },
    { id: 'm-seed', name: 'Seed 通用模型', providerId: 'seed', modelId: 'doubao-seed-2-0-lite-260215', context: 131072, maxOutput: 32768, inputPrice: 0, outputPrice: 0, enabled: true },
    { id: 'm-glm', name: 'GLM 通用模型', providerId: 'glm', modelId: 'glm-5.2', context: 131072, maxOutput: 32768, inputPrice: 0, outputPrice: 0, enabled: true }
  ];

  var DEFAULT_PARAMS = { temperature: 0.2, topP: 0.9, maxTokens: 8192, timeout: 60, retry: 1, concurrency: 20, thinking: '自动', stream: true };

  var BASE_PROMPTS = [
    { id: 'asset', module: '学生档案', title: '资产文件 AI 解析', version: 'v1.2.0', vars: ['file_text', 'file_type', 'student_id', 'field_dictionary'], system: '你是留学申请材料结构化专家。仅依据文件内容提取信息，不得补全或猜测。每个字段必须返回原文证据、页码和置信度；敏感信息只标记存在，不输出原值。无法确定时返回 null。', user: '请按字段字典解析 {{file_type}} 文件。\n学生标识：{{student_id}}\n字段字典：{{field_dictionary}}\nOCR 文本：{{file_text}}', schema: '{"document_type":"string","fields":[{"name":"string","value":"string|null","evidence":"string","page":0,"confidence":0.0}],"warnings":["string"]}', metric: '字段 Exact Match、证据定位准确率、缺失字段召回率', threshold: 'Exact Match ≥95%；证据准确率 ≥98%；幻觉率 ≤0.5%' },
    { id: 'editor', module: '文书交付', title: '编辑框 AI 助手', version: 'v1.1.0', vars: ['selected_text', 'instruction', 'student_profile', 'school_prompt', 'word_limit'], system: '你是留学文书协作编辑。保持学生事实与个人声音，只对用户选中文本执行明确指令。禁止虚构经历、成绩、奖项或院校信息；事实不足时先提出澄清问题。', user: '院校题目：{{school_prompt}}\n字数限制：{{word_limit}}\n学生资料：{{student_profile}}\n选中文本：{{selected_text}}\n编辑指令：{{instruction}}', schema: '{"revised_text":"string","changes":[{"type":"string","reason":"string"}],"fact_risks":["string"],"questions":["string"]}', metric: '人工采纳率、事实一致性、风格保持率', threshold: '采纳率 ≥45%；事实错误率 ≤1%；越权改写率 ≤2%' },
    { id: 'suggest', module: '文书交付', title: '右侧 AI 建议', version: 'v1.0.3', vars: ['student_profile', 'draft', 'school_prompt', 'rubric'], system: '你是留学文书教练。基于学生资料、院校题目和当前草稿给出最多 5 条可执行建议。每条建议指出证据位置、问题、改进动作和优先级。', user: '学生资料：{{student_profile}}\n院校题目：{{school_prompt}}\n评价规则：{{rubric}}\n当前草稿：{{draft}}', schema: '{"suggestions":[{"priority":"P0|P1|P2","location":"string","issue":"string","action":"string","evidence":"string"}],"missing_facts":["string"]}', metric: '建议相关性、可执行性、重复率、人工采纳率', threshold: '专家相关性 ≥4.2/5；采纳率 ≥40%；重复率 ≤5%' },
    { id: 'case', module: '文书交付', title: '案例包 AI 解析', version: 'v1.4.0', vars: [], system: '', user: '', schema: '', metric: '字段完整率、证据定位准确率、结构一致性', threshold: '字段完整率 ≥95%；证据准确率 ≥98%；结构一致性 100%' },
    { id: 'review', module: '文书审核', title: 'AI 整体评价', version: 'v2.0.0', vars: ['draft', 'school_prompt', 'student_profile', 'rubric', 'word_limit'], system: '你是留学文书质量审核助手。依据院校题目和 PBS 评分规则进行辅助评价，不替代人工终审。所有事实判断必须与学生档案对照，并列出扣分证据。', user: '院校题目：{{school_prompt}}\n字数限制：{{word_limit}}\n学生资料：{{student_profile}}\n评分规则：{{rubric}}\n文书全文：{{draft}}', schema: '{"overall_score":0,"dimension_scores":{"relevance":0,"logic":0,"evidence":0,"language":0,"voice":0,"compliance":0},"strengths":[{"text":"string","evidence":"string"}],"improvements":[{"text":"string","evidence":"string","priority":"P0|P1|P2"}],"overall_comment":"string","fact_risks":["string"]}', metric: '与人工评分相关性、MAE、维度一致性', threshold: 'Spearman ≥0.75；MAE ≤6；事实错误率 ≤1%' },
    { id: 'classify', module: '监控管理', title: '邮件/页面 AI 分类', version: 'v1.4.0', vars: ['subject', 'sender', 'body', 'attachments', 'school', 'application_id'], system: '你是留学申请通知分类器。结合发件域名、标题、正文和附件完成分类，必须输出证据关键词、置信度和建议状态；不确定时选择 UNKNOWN。', user: '申请：{{application_id}} / {{school}}\n发件人：{{sender}}\n标题：{{subject}}\n正文：{{body}}\n附件：{{attachments}}', schema: '{"category":"OFFER|REJECTION|WAITLIST|INTERVIEW|MISSING_MATERIAL|ACTION_REQUIRED|STATUS_UPDATE|SCHOLARSHIP|NOISE|UNKNOWN","confidence":0.0,"keywords":["string"],"evidence":"string","suggested_status":"string|null","manual_review":true}', metric: 'Macro-F1、关键类别召回率、误更新率', threshold: 'Macro-F1 ≥0.90；关键类别召回 ≥0.95；误更新率 ≤0.2%' },
    { id: 'confidence', module: '监控管理', title: '低置信度异常识别', version: 'v1.0.1', vars: ['classification', 'top2_scores', 'rules_hit', 'message_metadata'], system: '你是 AI 分类质量守门器。根据最高置信度、前两类差值、规则冲突和关键信息缺失判断是否进入人工复核。', user: '分类结果：{{classification}}\nTop2 分数：{{top2_scores}}\n命中规则：{{rules_hit}}\n元数据：{{message_metadata}}', schema: '{"is_abnormal":true,"reason_codes":["LOW_CONFIDENCE|SMALL_MARGIN|RULE_CONFLICT|MISSING_EVIDENCE|HIGH_RISK_CATEGORY"],"route":"AUTO_UPDATE|MANUAL_REVIEW","explanation":"string"}', metric: '异常检出精确率、关键风险召回率', threshold: '关键风险召回 100%；异常精确率 ≥85%' },
    { id: 'school', module: '选校管理', title: 'AI 选校推荐说明', version: 'v1.2.0', vars: ['student_profile', 'school_candidates', 'requirements', 'preferences', 'historical_cases', 'data_date'], system: '你是选校决策辅助顾问。先校验硬性条件，再对候选学校分层。每项推荐必须引用院校要求及数据日期，明确不确定性，不得承诺录取概率。', user: '学生资料：{{student_profile}}\n偏好：{{preferences}}\n候选学校：{{school_candidates}}\n院校要求：{{requirements}}\n历史案例：{{historical_cases}}\n数据日期：{{data_date}}', schema: '{"recommendations":[{"school":"string","program":"string","tier":"REACH|MATCH|SAFETY","reasons":["string"],"risks":["string"],"actions":["string"],"source_refs":["string"],"confidence":0.0}],"hard_constraint_violations":["string"],"disclaimer":"string"}', metric: '硬条件违规率、专家 Top-K 接受率、证据覆盖率', threshold: '硬条件违规率 0%；专家接受率 ≥80%；证据覆盖率 100%' }
  ];

  var CASE_TEMPLATES = [
    { id: 'cv-undergraduate', material: 'CV', stage: '本科', focus: '突出课程基础、竞赛、社团活动、志愿服务与领导力。', fields: ['基本信息', '教育经历', '核心课程', '竞赛与奖项', '活动与领导力', '志愿服务', '技能与语言'] },
    { id: 'cv-master', material: 'CV', stage: '硕士', focus: '突出专业准备、科研项目、实习成果与量化技能。', fields: ['基本信息', '教育经历', '专业课程', '科研项目', '实习经历', '奖项成果', '技能与语言'] },
    { id: 'cv-doctor', material: 'CV', stage: '博士', focus: '突出研究轨迹、论文成果、方法能力与学术影响。', fields: ['基本信息', '教育经历', '研究经历', '论文与出版', '会议与报告', '教学经历', '方法与工具'] },
    { id: 'ps-undergraduate', material: 'PS', stage: '本科', focus: '识别兴趣起点、成长经历、学术潜力与校园贡献。', fields: ['兴趣起点', '关键成长经历', '学术兴趣', '课外活动', '个人品质', '学习目标', '院校匹配'] },
    { id: 'ps-master', material: 'PS', stage: '硕士', focus: '识别学术准备、相关经历、申请动机与职业目标。', fields: ['申请动机', '学术准备', '项目经历', '实习经历', '能力证据', '职业目标', '项目匹配'] },
    { id: 'ps-doctor', material: 'PS', stage: '博士', focus: '识别研究问题、既往研究、方法能力与导师匹配。', fields: ['研究兴趣', '问题来源', '研究经历', '方法能力', '研究成果', '博士目标', '导师与项目匹配'] },
    { id: 'letter-undergraduate', material: '推荐信', stage: '本科', focus: '识别推荐关系、学术表现、品格与成长潜力。', fields: ['推荐人信息', '认识关系', '学术能力', '课堂表现', '活动表现', '品格证据', '综合评价'] },
    { id: 'letter-master', material: '推荐信', stage: '硕士', focus: '识别专业能力、项目贡献、比较排名与深造准备。', fields: ['推荐人信息', '认识关系', '专业能力', '项目贡献', '协作表现', '比较评价', '深造潜力'] },
    { id: 'letter-doctor', material: '推荐信', stage: '博士', focus: '识别研究独立性、原创性、方法能力与学术潜力。', fields: ['推荐人信息', '研究关系', '研究独立性', '原创能力', '方法能力', '学术成果', '博士潜力'] },
    { id: 'plan-undergraduate', material: '研究计划', stage: '本科', focus: '识别研究兴趣、基础问题、可执行方法与学习目标。', fields: ['研究主题', '问题背景', '研究问题', '基础资料', '研究方法', '时间安排', '预期收获'] },
    { id: 'plan-master', material: '研究计划', stage: '硕士', focus: '识别文献缺口、研究问题、方法可行性与预期成果。', fields: ['研究背景', '文献缺口', '研究问题', '理论框架', '研究方法', '可行性', '预期成果'] },
    { id: 'plan-doctor', material: '研究计划', stage: '博士', focus: '识别原创问题、假设、方法设计、学术贡献与风险控制。', fields: ['研究背景', '文献缺口', '核心问题', '研究假设', '方法设计', '原创贡献', '伦理与风险', '时间计划'] }
  ];

  var BASE_EVALS = [
    { id: 'asset', name: '资产文件 AI 解析', metric: '字段 Exact Match', threshold: '≥95%', result: '96.8%', samples: 240, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'editor', name: '编辑框 AI 助手', metric: '采纳率 / 事实错误', threshold: '≥45% / ≤1%', result: '48.2% / 0.6%', samples: 180, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'suggest', name: '右侧 AI 建议', metric: '专家相关性', threshold: '≥4.2/5', result: '4.4/5', samples: 160, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'case', name: '案例包 AI 解析', metric: '结构一致性', threshold: '100%', result: '100%', samples: 120, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'review', name: '文书审核 AI 评价', metric: 'Spearman / MAE', threshold: '≥0.75 / ≤6', result: '0.79 / 5.2', samples: 200, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'classify', name: '监控 AI 分类', metric: 'Macro-F1', threshold: '≥0.90', result: '0.93', samples: 220, status: 'pass', updated: '2026-08-11 18:30' },
    { id: 'confidence', name: '低置信度异常识别', metric: '关键风险召回', threshold: '100%', result: '96.4%', samples: 84, status: 'fail', updated: '2026-08-11 18:30' },
    { id: 'school', name: 'AI 选校推荐', metric: '硬条件违规 / 接受率', threshold: '0% / ≥80%', result: '0% / 83%', samples: 76, status: 'pass', updated: '2026-08-11 18:30' }
  ];

  function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]; }); }
  function plainText(value) { return String(value == null ? '' : value).replace(/[<>]/g, '').trim(); }
  function nowText() {
    var d = new Date();
    function pad(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function defaultAiState() {
    return {
      providers: cloneJson(DEFAULT_PROVIDERS),
      models: cloneJson(DEFAULT_MODELS),
      globalRoute: { primary: 'm-qwen', backup: 'm-deepseek' },
      paramsGlobal: cloneJson(DEFAULT_PARAMS),
      promptOverrides: {},
      promptStatus: {},
      caseTemplateOverrides: {},
      selectedCaseTemplate: 'cv-undergraduate',
      evalResults: {}
    };
  }

  function loadAiState() {
    var state = defaultAiState();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved) {
      try { saved = JSON.parse(localStorage.getItem(LEGACY_AI_STORAGE_KEY) || 'null'); } catch (e2) { saved = null; }
    }
    if (saved && typeof saved === 'object') {
      ['providers', 'models', 'globalRoute', 'promptOverrides', 'promptStatus', 'caseTemplateOverrides', 'selectedCaseTemplate', 'evalResults'].forEach(function (key) {
        if (saved[key] !== undefined) state[key] = saved[key];
      });
      if (saved.paramsGlobal) state.paramsGlobal = saved.paramsGlobal;
    }
    if (!Array.isArray(state.providers)) state.providers = cloneJson(DEFAULT_PROVIDERS);
    DEFAULT_PROVIDERS.forEach(function (preset) {
      if (!state.providers.some(function (p) { return p.id === preset.id; })) state.providers.push(cloneJson(preset));
    });
    if (!Array.isArray(state.models) || !state.models.length) state.models = cloneJson(DEFAULT_MODELS);
    state.models.forEach(function (model) {
      model.context = 131072;
      delete model.capabilities;
      delete model.thinking;
    });
    state.paramsGlobal = Object.assign(cloneJson(DEFAULT_PARAMS), state.paramsGlobal || {}, { stream: true });
    if (!state.promptOverrides || typeof state.promptOverrides !== 'object') state.promptOverrides = {};
    if (!state.promptStatus || typeof state.promptStatus !== 'object') state.promptStatus = {};
    if (!state.caseTemplateOverrides || typeof state.caseTemplateOverrides !== 'object') state.caseTemplateOverrides = {};
    if (!state.evalResults || typeof state.evalResults !== 'object') state.evalResults = {};
    if (!CASE_TEMPLATES.some(function (item) { return item.id === state.selectedCaseTemplate; })) state.selectedCaseTemplate = CASE_TEMPLATES[0].id;
    return state;
  }

  var aiState = loadAiState();

  function saveAiState() { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState)); }

  function sessionInfo() {
    try {
      var session = JSON.parse(localStorage.getItem('pbs_session_v1') || 'null');
      if (session) return { user: session.name || session.account || '演示管理员', org: session.org || 'PBS留学总部' };
    } catch (e) { /* 使用演示身份 */ }
    return { user: '演示管理员', org: 'PBS留学总部' };
  }

  function logAiAction(action, detail) {
    var logs = [];
    try { logs = JSON.parse(localStorage.getItem(OPERATION_LOG_KEY) || '[]'); } catch (e) { logs = []; }
    if (!Array.isArray(logs)) logs = [];
    var session = sessionInfo();
    logs.unshift({ time: nowText(), user: plainText(session.user), organization: plainText(session.org), type: '修改', content: 'AI 管理：' + plainText(action) + '；' + plainText(detail), ip: '当前会话', result: '成功' });
    localStorage.setItem(OPERATION_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  function setAutoSaveState(mode, text) {
    var state = byId('autoSaveState');
    if (!state) return;
    state.className = 'auto-save' + (mode ? ' ' + mode : '');
    byId('autoSaveStatus').textContent = text;
  }

  function commitAutoSave(action, detail, key, immediateLog) {
    saveAiState();
    setAutoSaveState('saving', '正在自动保存…');
    clearTimeout(autoSaveTimers.status);
    autoSaveTimers.status = setTimeout(function () { setAutoSaveState('', '已自动保存'); }, 280);
    var logKey = 'log-' + (key || action);
    clearTimeout(autoSaveTimers[logKey]);
    autoSaveTimers[logKey] = setTimeout(function () { logAiAction(action, typeof detail === 'function' ? detail() : detail); }, immediateLog ? 0 : 850);
  }

  function showToast(message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.aiToastTimer);
    window.aiToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }
  window.showToast = showToast;

  function openModal(id) { byId(id).classList.add('show'); }
  function closeModal(id) { byId(id).classList.remove('show'); }
  window.openModal = openModal;
  window.closeModal = closeModal;

  function initializeDialogs() {
    document.querySelectorAll('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (event) { if (event.target === modal) modal.classList.remove('show'); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') document.querySelectorAll('.modal.show').forEach(function (modal) { modal.classList.remove('show'); });
    });
  }

  function activateAiTab(name) {
    if (AI_TABS.indexOf(name) < 0) return;
    document.querySelectorAll('.tabbar .tab').forEach(function (tab) {
      var active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('.tabs .pane').forEach(function (pane) {
      var active = pane.id === 'pane-' + name;
      pane.classList.toggle('active', active);
      pane.hidden = !active;
    });
  }

  function initializeTabs() {
    var tabbar = document.querySelector('.tabbar');
    tabbar.addEventListener('click', function (event) {
      var tab = event.target.closest('.tab');
      if (tab) activateAiTab(tab.dataset.tab);
    });
    tabbar.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      var current = event.target.closest('.tab');
      if (!current) return;
      var index = AI_TABS.indexOf(current.dataset.tab);
      var next = AI_TABS[(index + (event.key === 'ArrowRight' ? 1 : -1) + AI_TABS.length) % AI_TABS.length];
      activateAiTab(next);
      tabbar.querySelector('[data-tab="' + next + '"]').focus();
      event.preventDefault();
    });
    document.querySelectorAll('.tabbar .tab').forEach(function (tab) { tab.setAttribute('aria-controls', 'pane-' + tab.dataset.tab); });
    document.querySelectorAll('.tabs .pane').forEach(function (pane) { pane.setAttribute('role', 'tabpanel'); });
    activateAiTab('vendors');
  }

  function providerById(id) { return aiState.providers.find(function (p) { return p.id === id; }); }
  function modelById(id) { return aiState.models.find(function (m) { return m.id === id; }); }
  function resolvedProviderUrl(provider) { return (provider.customUrl || '').trim() || (provider.defaultUrl || '').trim(); }
  function providerReady(id) {
    var provider = providerById(id);
    return !!(provider && provider.enabled && provider.hasKey && provider.status === 'connected');
  }
  function maskKey(provider) { return provider.hasKey ? '•••••••• ' + escapeHtml(provider.keyLast4 || '****') : '未填写'; }
  function providerStatus(provider) {
    if (provider.status === 'testing') return '<span class="status-line warn">测试中</span>';
    if (provider.status === 'connected') return '<span class="status-line good">正常' + (provider.latency ? ' · ' + provider.latency + 'ms' : '') + '</span>';
    if (provider.status === 'failed') return '<span class="status-line bad">连接失败</span>';
    return '<span class="status-line subtle">待配置</span>';
  }

  function renderProviders() {
    byId('providerRows').innerHTML = aiState.providers.map(function (provider) {
      var preset = PROVIDER_PRESETS[provider.type] || PROVIDER_PRESETS.openai_compatible;
      var url = resolvedProviderUrl(provider);
      return '<tr><td><div class="provider"><div class="provider-logo" style="background:' + preset.color + '">' + escapeHtml(preset.short) + '</div><b>' + escapeHtml(provider.name) + '</b></div></td>' +
        '<td class="provider-url">' + (url ? escapeHtml(url) : '<span class="danger-text">未设置</span>') + '</td>' +
        '<td><span class="key-mask ' + (provider.hasKey ? '' : 'danger-text') + '">' + maskKey(provider) + '</span></td>' +
        '<td>' + providerStatus(provider) + '</td>' +
        '<td><label class="switch"><input type="checkbox" ' + (provider.enabled ? 'checked' : '') + ' onchange="toggleProvider(\'' + provider.id + '\',this.checked)"><span class="slider"></span></label></td>' +
        '<td><button class="btn sm" onclick="testProviderById(\'' + provider.id + '\',this)">测试连接</button> <button class="btn ghost sm" onclick="openProviderEditor(\'' + provider.id + '\')">编辑</button></td></tr>';
    }).join('');
    updateSummary();
    populateProviderSelect();
  }

  function updateSummary() {
    var configured = aiState.providers.filter(function (p) { return p.hasKey && resolvedProviderUrl(p); }).length;
    var connected = aiState.providers.filter(function (p) { return providerReady(p.id); }).length;
    var availableModels = aiState.models.filter(function (m) { return m.enabled && providerReady(m.providerId); }).length;
    byId('providerCount').textContent = configured + ' / ' + aiState.providers.length;
    byId('providerSummary').textContent = connected ? connected + ' 个连接正常' : '等待填写 API Key 并测试连接';
    byId('providerSummary').className = 'metric-sub ' + (connected ? 'good' : 'warn');
    byId('modelCount').textContent = String(availableModels);
    byId('modelSummary').textContent = availableModels ? '已通过连接校验' : '厂商连接后可用';
  }

  window.openProviderEditor = function (id) {
    var provider = id ? providerById(id) : null;
    window.providerFormTested = false;
    byId('providerEditId').value = provider ? provider.id : '';
    byId('providerModalTitle').textContent = provider ? '编辑模型厂商' : '新增模型厂商';
    byId('providerType').value = provider ? provider.type : 'openai_compatible';
    byId('providerType').disabled = !!(provider && provider.builtin);
    byId('newProviderName').value = provider ? provider.name : '';
    byId('newProviderEndpoint').value = provider ? resolvedProviderUrl(provider) : '';
    byId('providerApiKey').value = '';
    byId('providerApiKey').placeholder = provider && provider.hasKey ? '留空保留已保存密钥（末四位 ' + provider.keyLast4 + '）' : '请输入 API Key';
    byId('providerAuth').value = provider ? provider.auth : 'Bearer Token';
    byId('providerHeader').value = provider ? provider.header : 'Authorization';
    byId('providerTimeout').value = provider ? provider.timeout : 60;
    byId('providerRotate').value = provider ? provider.rotate : '到期前 14 天';
    byId('providerFormError').textContent = '';
    if (!provider) window.applyProviderPreset(true);
    openModal('providerModal');
  };

  window.applyProviderPreset = function (force) {
    var preset = PROVIDER_PRESETS[byId('providerType').value] || PROVIDER_PRESETS.openai_compatible;
    if (force) {
      byId('newProviderName').value = preset.name;
      byId('newProviderEndpoint').value = preset.url;
    }
  };

  window.toggleApiKey = function () {
    var input = byId('providerApiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  function validateProviderForm() {
    var existing = providerById(byId('providerEditId').value);
    var name = byId('newProviderName').value.trim();
    var url = byId('newProviderEndpoint').value.trim();
    var key = byId('providerApiKey').value.trim();
    if (!name) return '请填写厂商名称';
    if (!url || !/^https?:\/\//i.test(url)) return '请填写以 http:// 或 https:// 开头的请求地址';
    if (!key && !(existing && existing.hasKey)) return '请填写 API Key';
    return '';
  }

  window.testProviderForm = function (button) {
    var error = validateProviderForm();
    byId('providerFormError').textContent = error;
    if (error) return;
    var old = button.textContent;
    button.textContent = '测试中…';
    button.disabled = true;
    setTimeout(function () {
      window.providerFormTested = true;
      button.textContent = '连接成功 · 236ms';
      button.disabled = false;
      showToast('连接测试成功');
      setTimeout(function () { button.textContent = old; }, 1000);
    }, 700);
  };

  window.saveProvider = function () {
    var error = validateProviderForm();
    byId('providerFormError').textContent = error;
    if (error) return;
    var provider = providerById(byId('providerEditId').value);
    var type = byId('providerType').value;
    var preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.openai_compatible;
    var rawKey = byId('providerApiKey').value.trim();
    if (!provider) {
      provider = { id: 'custom_' + Date.now(), type: type, builtin: false, status: 'unconfigured', latency: null, hasKey: false, keyLast4: '', enabled: true };
      aiState.providers.push(provider);
    }
    provider.name = byId('newProviderName').value.trim();
    provider.defaultUrl = preset.url;
    var endpoint = byId('newProviderEndpoint').value.trim();
    provider.customUrl = endpoint === preset.url ? '' : endpoint;
    provider.auth = byId('providerAuth').value;
    provider.header = byId('providerHeader').value.trim() || 'Authorization';
    provider.timeout = Number(byId('providerTimeout').value) || 60;
    provider.rotate = byId('providerRotate').value;
    if (rawKey) { provider.hasKey = true; provider.keyLast4 = rawKey.slice(-4); }
    provider.enabled = true;
    if (window.providerFormTested) { provider.status = 'connected'; provider.latency = 236; }
    else if (provider.status !== 'connected') { provider.status = 'unconfigured'; provider.latency = null; }
    commitAutoSave('修改模型厂商', provider.name + '，API Key 已保存为掩码', 'provider-' + provider.id, true);
    closeModal('providerModal');
    renderProviders();
    renderModels();
    populateModelSelectors();
    showToast(provider.name + ' 已自动保存');
  };

  window.toggleProvider = function (id, enabled) {
    var provider = providerById(id);
    if (!provider) return;
    provider.enabled = enabled;
    commitAutoSave(enabled ? '启用模型厂商' : '停用模型厂商', provider.name, 'provider-toggle-' + id, true);
    renderProviders();
    renderModels();
  };

  window.testProviderById = function (id) {
    var provider = providerById(id);
    if (!provider) return;
    if (!provider.hasKey || !resolvedProviderUrl(provider)) { showToast('请先补全厂商配置'); window.openProviderEditor(id); return; }
    provider.status = 'testing';
    renderProviders();
    setTimeout(function () {
      provider.status = 'connected';
      provider.latency = 180 + Math.floor(Math.random() * 120);
      provider.enabled = true;
      commitAutoSave('测试模型厂商连接', provider.name + '，连接成功 ' + provider.latency + 'ms', 'provider-test-' + id, true);
      renderProviders();
      renderModels();
      showToast(provider.name + ' 连接成功');
    }, 700);
  };

  function modelRouteRole(modelId) {
    var roles = [];
    if (aiState.globalRoute.primary === modelId) roles.push('主模型');
    if (aiState.globalRoute.backup === modelId) roles.push('次模型');
    return roles.join(' / ') || '—';
  }

  function renderModels() {
    byId('modelRows').innerHTML = aiState.models.map(function (model) {
      var provider = providerById(model.providerId) || { name: '未选择厂商' };
      var ready = providerReady(model.providerId) && model.enabled;
      return '<tr><td><b>' + escapeHtml(model.name) + '</b><div class="subtle">最大输出 ' + Number(model.maxOutput || 0).toLocaleString() + ' Token</div></td>' +
        '<td>' + escapeHtml(provider.name) + '<br><span class="subtle">' + escapeHtml(model.modelId) + '</span></td>' +
        '<td>' + escapeHtml(modelRouteRole(model.id)) + '</td>' +
        '<td><label class="switch"><input type="checkbox" ' + (model.enabled ? 'checked' : '') + ' onchange="toggleModel(\'' + model.id + '\',this.checked)"><span class="slider"></span></label><div class="help ' + (ready ? 'good' : 'warn') + '">' + (ready ? '可用' : '待厂商连接') + '</div></td>' +
        '<td><button class="btn ghost sm" onclick="openModelEditor(\'' + model.id + '\')">编辑</button></td></tr>';
    }).join('');
    updateSummary();
  }

  function populateProviderSelect() {
    var select = byId('modelProvider');
    if (!select) return;
    var old = select.value;
    select.innerHTML = aiState.providers.map(function (provider) { return '<option value="' + provider.id + '">' + escapeHtml(provider.name) + '</option>'; }).join('');
    if (old && providerById(old)) select.value = old;
  }

  window.openModelEditor = function (id) {
    var model = id ? modelById(id) : null;
    byId('modelEditId').value = model ? model.id : '';
    byId('modelModalTitle').textContent = model ? '编辑模型' : '新增模型';
    populateProviderSelect();
    byId('newModelName').value = model ? model.name : '';
    byId('modelProvider').value = model ? model.providerId : aiState.providers[0].id;
    byId('newModelId').value = model ? model.modelId : '';
    byId('modelMaxOutput').value = model ? model.maxOutput : 8192;
    byId('modelInputPrice').value = model ? model.inputPrice : 0;
    byId('modelOutputPrice').value = model ? model.outputPrice : 0;
    byId('modelFormError').textContent = '';
    openModal('modelModal');
  };

  window.saveModel = function () {
    var name = byId('newModelName').value.trim();
    var modelId = byId('newModelId').value.trim();
    var providerId = byId('modelProvider').value;
    var error = !name ? '请填写模型名称' : (!modelId ? '请填写 Model ID' : (!providerId ? '请选择厂商' : ''));
    byId('modelFormError').textContent = error;
    if (error) return;
    var model = modelById(byId('modelEditId').value);
    if (!model) { model = { id: 'model_' + Date.now(), enabled: true }; aiState.models.push(model); }
    model.name = name;
    model.providerId = providerId;
    model.modelId = modelId;
    model.context = 131072;
    model.maxOutput = Number(byId('modelMaxOutput').value) || 8192;
    model.inputPrice = Number(byId('modelInputPrice').value) || 0;
    model.outputPrice = Number(byId('modelOutputPrice').value) || 0;
    delete model.capabilities;
    delete model.thinking;
    commitAutoSave('修改模型配置', model.name + ' / ' + model.modelId + '，默认上下文 128K', 'model-' + model.id, true);
    closeModal('modelModal');
    renderModels();
    populateModelSelectors();
    showToast(model.name + ' 已自动保存');
  };

  window.toggleModel = function (id, enabled) {
    var model = modelById(id);
    if (!model) return;
    model.enabled = enabled;
    if (!enabled && aiState.globalRoute.primary === id) aiState.globalRoute.primary = '';
    if (!enabled && aiState.globalRoute.backup === id) aiState.globalRoute.backup = '';
    commitAutoSave(enabled ? '启用模型' : '停用模型', model.name, 'model-toggle-' + id, true);
    renderModels();
    populateModelSelectors();
  };

  function modelOptions(selected) {
    return '<option value="">未配置</option>' + aiState.models.filter(function (model) { return model.enabled; }).map(function (model) {
      return '<option value="' + model.id + '"' + (model.id === selected ? ' selected' : '') + '>' + escapeHtml(model.name) + '</option>';
    }).join('');
  }

  function populateModelSelectors() {
    byId('globalPrimary').innerHTML = modelOptions(aiState.globalRoute.primary);
    byId('globalBackup').innerHTML = modelOptions(aiState.globalRoute.backup);
    byId('globalPrimary').value = aiState.globalRoute.primary || '';
    byId('globalBackup').value = aiState.globalRoute.backup || '';
  }

  window.autoSaveGlobalRoute = function () {
    var primary = byId('globalPrimary').value;
    var backup = byId('globalBackup').value;
    if (primary && primary === backup) {
      byId('routeHint').textContent = '主模型与次模型不能相同。';
      byId('routeHint').className = 'help danger-text';
      populateModelSelectors();
      showToast('主模型与次模型不能相同');
      return;
    }
    aiState.globalRoute = { primary: primary, backup: backup };
    byId('routeHint').textContent = '主模型不可用时切换至次模型，两者不能相同。';
    byId('routeHint').className = 'help';
    var primaryName = (modelById(primary) || {}).name || '未配置';
    var backupName = (modelById(backup) || {}).name || '未配置';
    commitAutoSave('修改主次模型', primaryName + ' → ' + backupName, 'global-route');
    renderModels();
  };

  function loadParams() {
    var params = aiState.paramsGlobal;
    byId('temperature').value = params.temperature;
    byId('topP').value = params.topP;
    byId('maxTokens').value = params.maxTokens;
    byId('timeout').value = params.timeout;
    byId('retryCount').value = params.retry;
    byId('concurrency').value = params.concurrency;
    byId('thinkingMode').value = params.thinking;
  }

  function autoSaveParams() {
    var params = {
      temperature: Number(byId('temperature').value),
      topP: Number(byId('topP').value),
      maxTokens: Number(byId('maxTokens').value),
      timeout: Number(byId('timeout').value),
      retry: Number(byId('retryCount').value),
      concurrency: Number(byId('concurrency').value),
      thinking: byId('thinkingMode').value,
      stream: true
    };
    if (params.temperature < 0 || params.temperature > 2 || params.topP < 0 || params.topP > 1 || params.maxTokens <= 0 || params.timeout <= 0 || params.retry < 0 || params.concurrency <= 0) {
      setAutoSaveState('error', '参数有误，尚未保存');
      return;
    }
    aiState.paramsGlobal = params;
    commitAutoSave('修改默认请求参数', 'Temperature ' + params.temperature + '，Top P ' + params.topP + '，最大输出 ' + params.maxTokens + ' Token，流式响应开启', 'request-params');
  }

  window.resetParams = function () {
    aiState.paramsGlobal = cloneJson(DEFAULT_PARAMS);
    loadParams();
    commitAutoSave('恢复默认请求参数', '默认参数已恢复，流式响应开启', 'request-params-reset', true);
    showToast('默认请求参数已恢复');
  };

  function caseTemplateById(id) { return CASE_TEMPLATES.find(function (item) { return item.id === id; }) || CASE_TEMPLATES[0]; }
  function selectedCaseTemplate() { return caseTemplateById(aiState.selectedCaseTemplate); }
  function caseTemplateFor(material, stage) { return CASE_TEMPLATES.find(function (item) { return item.material === material && item.stage === stage; }) || CASE_TEMPLATES[0]; }

  function buildCasePrompt(template) {
    var schema = {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: false,
      properties: {
        template_id: { const: template.id },
        material_type: { const: template.material },
        application_stage: { const: template.stage },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: { document_id: { type: 'string' }, source_pages: { type: 'array', items: { type: 'integer', minimum: 1 } } },
            required: ['document_id', 'source_pages']
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              field: { enum: template.fields },
              value: { type: ['string', 'null'] },
              evidence: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { quote: { type: 'string' }, page: { type: 'integer', minimum: 1 } },
                  required: ['quote', 'page']
                }
              },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['field', 'value', 'evidence', 'confidence']
          }
        },
        missing_fields: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      },
      required: ['template_id', 'material_type', 'application_stage', 'documents', 'sections', 'missing_fields', 'conflicts', 'warnings']
    };
    return {
      id: 'case',
      templateId: template.id,
      module: '文书交付',
      title: '案例包 AI 解析',
      version: 'v1.4.0',
      vars: ['case_documents', 'template_id', 'material_type', 'application_stage'],
      system: '你是留学材料结构化解析专家。必须使用固定模板 ' + template.id + ' 解析，不得改变字段名称或输出层级。材料类型为' + template.material + '，申请阶段为' + template.stage + '。' + template.focus + '每个字段返回值、原文证据、页码与置信度；缺失返回 null，材料冲突单独列出，禁止推测。',
      user: '模板：{{template_id}}\n材料类型：{{material_type}}\n申请阶段：{{application_stage}}\n固定字段：' + template.fields.join('、') + '\n待解析案例包：{{case_documents}}',
      schema: JSON.stringify(schema, null, 2),
      metric: '字段完整率、证据定位准确率、结构一致性',
      threshold: '字段完整率 ≥95%；证据准确率 ≥98%；结构一致性 100%'
    };
  }

  function basePromptWithOverride(base) {
    var prompt = cloneJson(base);
    var override = aiState.promptOverrides[base.id];
    if (override) Object.keys(override).forEach(function (key) { prompt[key] = override[key]; });
    return prompt;
  }

  function selectedCasePrompt() {
    var template = selectedCaseTemplate();
    var prompt = buildCasePrompt(template);
    var override = aiState.caseTemplateOverrides[template.id];
    if (override) Object.keys(override).forEach(function (key) { prompt[key] = override[key]; });
    return prompt;
  }

  function currentPrompt() {
    var base = BASE_PROMPTS[activePrompt];
    if (base.id !== 'case') return basePromptWithOverride(base);
    return selectedCasePrompt();
  }

  function currentPromptStatusKey() {
    var base = BASE_PROMPTS[activePrompt];
    return base.id === 'case' ? 'case:' + aiState.selectedCaseTemplate : base.id;
  }

  function promptStatus(key) { return aiState.promptStatus[key] || '已发布'; }

  function renderPromptList() {
    byId('promptList').innerHTML = BASE_PROMPTS.map(function (base, index) {
      var key = base.id === 'case' ? 'case:' + aiState.selectedCaseTemplate : base.id;
      var version = base.id === 'case' ? selectedCasePrompt().version : basePromptWithOverride(base).version;
      return '<div class="prompt-item ' + (index === activePrompt ? 'active' : '') + '" onclick="selectPrompt(' + index + ')"><div class="prompt-name">' + (index + 1) + '. ' + escapeHtml(base.title) + '</div><div class="prompt-meta"><span>' + escapeHtml(base.module) + ' · ' + escapeHtml(promptStatus(key)) + '</span><span>' + escapeHtml(version) + '</span></div></div>';
    }).join('');
  }

  function renderPromptStatus() {
    var status = promptStatus(currentPromptStatusKey());
    byId('promptStatus').textContent = status;
    byId('promptStatus').className = 'prompt-status' + (status === '已发布' ? '' : ' draft');
  }

  function renderCaseTemplatePanel() {
    var isCase = BASE_PROMPTS[activePrompt].id === 'case';
    byId('caseTemplatePanel').classList.toggle('hidden', !isCase);
    if (!isCase) return;
    var template = selectedCaseTemplate();
    byId('caseMaterial').value = template.material;
    byId('caseStage').value = template.stage;
    byId('caseTemplateName').textContent = template.material + ' · ' + template.stage + '解析模板（' + template.id + '）';
    byId('caseTemplateFocus').textContent = template.focus;
    byId('caseTemplateFields').textContent = '固定字段：' + template.fields.join('、');
  }

  function loadPrompt() {
    var prompt = currentPrompt();
    byId('promptModule').textContent = prompt.module;
    byId('promptTitle').textContent = prompt.title;
    byId('promptVersion').textContent = prompt.version;
    byId('systemPrompt').value = prompt.system;
    byId('userPrompt').value = prompt.user;
    byId('outputSchema').value = prompt.schema;
    byId('promptMetric').value = prompt.metric;
    byId('promptThreshold').value = prompt.threshold;
    byId('promptVariables').innerHTML = prompt.vars.map(function (variable) { return '<button class="chip" type="button" onclick="insertVariable(\'' + variable + '\')">{{' + variable + '}}</button>'; }).join('');
    renderCaseTemplatePanel();
    renderPromptStatus();
  }

  function renderPrompts() { renderPromptList(); loadPrompt(); }

  window.selectPrompt = function (index) {
    activePrompt = index;
    renderPrompts();
  };

  function capturePromptForm(autoSave) {
    var prompt = currentPrompt();
    var saved = {
      system: byId('systemPrompt').value,
      user: byId('userPrompt').value,
      schema: byId('outputSchema').value,
      metric: byId('promptMetric').value,
      threshold: byId('promptThreshold').value,
      version: prompt.version
    };
    if (BASE_PROMPTS[activePrompt].id === 'case') aiState.caseTemplateOverrides[aiState.selectedCaseTemplate] = saved;
    else aiState.promptOverrides[prompt.id] = saved;
    if (autoSave) {
      aiState.promptStatus[currentPromptStatusKey()] = '已修改';
      renderPromptStatus();
      renderPromptList();
      commitAutoSave('自动保存提示词', prompt.title + ' ' + prompt.version, 'prompt-' + currentPromptStatusKey());
    }
    return Object.assign(prompt, saved);
  }

  window.changeCaseTemplate = function () {
    var template = caseTemplateFor(byId('caseMaterial').value, byId('caseStage').value);
    aiState.selectedCaseTemplate = template.id;
    commitAutoSave('切换案例包解析模板', template.material + ' / ' + template.stage + ' / ' + template.id, 'case-template-select');
    renderPrompts();
  };

  window.insertVariable = function (name) {
    var textarea = byId('userPrompt');
    var position = textarea.selectionStart || textarea.value.length;
    textarea.value = textarea.value.slice(0, position) + '{{' + name + '}}' + textarea.value.slice(position);
    textarea.focus();
    capturePromptForm(true);
  };

  window.clonePrompt = function () {
    var prompt = capturePromptForm(false);
    var parts = prompt.version.replace('v', '').split('.');
    while (parts.length < 3) parts.push('0');
    parts[2] = String(Number(parts[2]) + 1);
    var version = 'v' + parts.join('.');
    if (BASE_PROMPTS[activePrompt].id === 'case') aiState.caseTemplateOverrides[aiState.selectedCaseTemplate].version = version;
    else aiState.promptOverrides[prompt.id].version = version;
    aiState.promptStatus[currentPromptStatusKey()] = '草稿';
    commitAutoSave('复制提示词版本', prompt.title + ' → ' + version, 'prompt-clone-' + currentPromptStatusKey(), true);
    renderPrompts();
    showToast('已复制为 ' + version);
  };

  window.validatePrompt = function (silent) {
    var prompt = capturePromptForm(false);
    var error = '';
    try { JSON.parse(prompt.schema); } catch (e) { error = '输出结构不是有效 JSON'; }
    if (!prompt.system.trim() || !prompt.user.trim()) error = '系统提示词和用户模板不能为空';
    var variables = [];
    prompt.user.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_, variable) { variables.push(variable); });
    var unknown = variables.filter(function (variable) { return prompt.vars.indexOf(variable) < 0; });
    if (unknown.length) error = '存在未定义变量：' + unknown.join(', ');
    if (!silent) showToast(error || '模板校验通过');
    return !error;
  };

  window.publishPrompt = function () {
    var prompt = capturePromptForm(false);
    if (!window.validatePrompt(true)) { showToast('模板校验失败，暂不能发布'); return; }
    pendingPublishPromptKey = currentPromptStatusKey();
    pendingPublishPromptTitle = prompt.title;
    aiState.promptStatus[pendingPublishPromptKey] = '待评测';
    saveAiState();
    renderPromptStatus();
    renderPromptList();
    window.openEvaluation(prompt.id, true);
  };

  window.openPromptTest = function () {
    openModal('promptTestModal');
    byId('testOutput').textContent = '点击“运行测试”生成结构化示例结果。';
    byId('testLatency').textContent = '—';
    byId('testTokens').textContent = '—';
    byId('testSchema').textContent = '—';
  };

  window.runPromptTest = function () {
    var prompt = currentPrompt();
    var primary = modelById(aiState.globalRoute.primary);
    var output = byId('testOutput');
    if (!window.validatePrompt(true)) { output.textContent = '模板校验失败，无法运行。'; return; }
    if (!primary) { output.textContent = '尚未配置主模型。'; return; }
    output.textContent = '正在请求主模型 ' + primary.name + '…';
    setTimeout(function () {
      var templateText = prompt.templateId ? '\n解析模板：' + prompt.templateId : '';
      output.innerHTML = '<span class="ok">✓ 调试响应成功</span>\n场景：' + escapeHtml(prompt.title) + templateText + '\n主模型：' + escapeHtml(primary.name) + '\n输出结构校验：通过\n敏感信息检查：通过';
      byId('testLatency').textContent = '1.46s';
      byId('testTokens').textContent = '1,126';
      byId('testSchema').innerHTML = '<span class="good">通过</span>';
      logAiAction('提示词在线调试', prompt.title + ' / ' + primary.name);
    }, 800);
  };

  function mergedEvalItem(base) { return Object.assign({}, base, aiState.evalResults[base.id] || {}); }
  function evalItemById(id) {
    var base = BASE_EVALS.find(function (item) { return item.id === id; });
    return base ? mergedEvalItem(base) : null;
  }

  function renderEvaluationSummary() {
    var items = BASE_EVALS.map(mergedEvalItem);
    var passed = items.filter(function (item) { return item.status === 'pass'; }).length;
    var pending = items.filter(function (item) { return item.status === 'fail' && !item.reviewed; }).length;
    var latest = items.slice().sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); })[0];
    byId('passedCount').textContent = passed + ' / ' + items.length;
    byId('reviewPendingCount').textContent = String(pending);
    byId('lastEvalTime').textContent = latest.updated || '尚未运行';
    byId('latestEvalValue').textContent = passed + ' / ' + items.length;
    byId('latestEvalSummary').textContent = pending ? pending + ' 个场景待复核' : '全部场景已通过';
    byId('latestEvalSummary').className = 'metric-sub ' + (pending ? 'warn' : 'good');
  }

  function evalStatusText(item) {
    if (item.status === 'running') return '<span class="status-line warn">运行中</span>';
    if (item.status === 'pass') return '<span class="status-line good">通过</span>';
    return '<span class="status-line bad">未通过</span>';
  }

  function renderEval() {
    byId('evalRows').innerHTML = BASE_EVALS.map(function (base) {
      var item = mergedEvalItem(base);
      return '<tr><td><b>' + escapeHtml(item.name) + '</b><div class="subtle">' + escapeHtml(item.updated || '尚未运行') + '</div></td>' +
        '<td>' + escapeHtml(item.metric) + '</td><td>' + escapeHtml(item.threshold) + '</td>' +
        '<td><b class="' + (item.status === 'pass' ? 'good' : item.status === 'fail' ? 'bad' : '') + '">' + escapeHtml(item.result || '—') + '</b></td>' +
        '<td>' + escapeHtml(item.samples) + '</td><td>' + evalStatusText(item) + '</td>' +
        '<td><button class="btn ghost sm" data-eval-run="' + item.id + '">评测</button><button class="btn ghost sm" data-eval-report="' + item.id + '">报告</button></td></tr>';
    }).join('');
    renderEvaluationSummary();
  }

  function initializeEvalActions() {
    byId('evalRows').addEventListener('click', function (event) {
      var run = event.target.closest('[data-eval-run]');
      var report = event.target.closest('[data-eval-report]');
      if (run) window.openEvaluation(run.dataset.evalRun);
      if (report) window.openEvalReport(report.dataset.evalReport);
    });
  }

  window.openEvaluation = function (sceneId, publishAfter) {
    byId('evalScenario').innerHTML = BASE_EVALS.map(function (item) { return '<option value="' + item.id + '">' + escapeHtml(item.name) + '</option>'; }).join('');
    if (sceneId && evalItemById(sceneId)) byId('evalScenario').value = sceneId;
    if (!publishAfter) { pendingPublishPromptKey = ''; pendingPublishPromptTitle = ''; }
    byId('evalDataset').value = 'gold';
    byId('evalScope').value = 'quick';
    byId('customDatasetFile').value = '';
    customDatasetCount = 0;
    window.updateEvaluationSetup();
    openModal('evaluationModal');
  };

  window.updateEvaluationSetup = function () {
    var item = evalItemById(byId('evalScenario').value) || mergedEvalItem(BASE_EVALS[0]);
    var dataset = byId('evalDataset').value;
    var full = byId('evalScope').value === 'full';
    var custom = dataset === 'custom';
    byId('customDatasetField').classList.toggle('hidden', !custom);
    var samples = full ? (custom ? customDatasetCount : item.samples) : 20;
    var model = modelById(aiState.globalRoute.primary);
    byId('evalConfigSummary').textContent = '评测指标：' + item.metric + '；上线门槛：' + item.threshold + '；主模型：' + (model ? model.name : '未配置') + '；预计样本：' + (samples || '待上传') + ' 条。';
    byId('startEvalButton').disabled = !model || (custom && !customDatasetCount);
  };

  window.handleCustomDataset = function (input) {
    customDatasetCount = input.files && input.files[0] ? 60 : 0;
    window.updateEvaluationSetup();
    if (customDatasetCount) showToast('已读取自定义评测集：60 条样本');
  };

  window.startEvaluation = function () {
    var item = evalItemById(byId('evalScenario').value);
    var dataset = byId('evalDataset').value;
    var scope = byId('evalScope').value;
    if (!item) return;
    if (!modelById(aiState.globalRoute.primary)) { showToast('请先在模型配置中选择主模型'); return; }
    if (dataset === 'custom' && !customDatasetCount) { showToast('请先上传自定义评测集'); return; }
    var samples = scope === 'quick' ? 20 : (dataset === 'custom' ? customDatasetCount : item.samples);
    var datasetName = dataset === 'gold' ? '发布金标集' : dataset === 'regression' ? '回归问题集' : '自定义评测集';
    aiState.evalResults[item.id] = Object.assign({}, aiState.evalResults[item.id] || {}, { status: 'running', result: '运行中', samples: samples, updated: nowText(), dataset: datasetName, reviewed: false });
    saveAiState();
    closeModal('evaluationModal');
    byId('evalTaskPanel').classList.remove('hidden');
    byId('evalTaskTitle').textContent = item.name + ' · ' + datasetName;
    byId('evalTaskProgress').style.width = '0%';
    byId('evalTaskPercent').textContent = '0%';
    byId('evalTaskDetail').textContent = '正在准备 ' + samples + ' 条评测样本…';
    renderEval();
    clearInterval(evalTimer);
    var steps = [12, 31, 55, 78, 93, 100];
    var index = 0;
    evalTimer = setInterval(function () {
      var value = steps[index++];
      byId('evalTaskProgress').style.width = value + '%';
      byId('evalTaskPercent').textContent = value + '%';
      byId('evalTaskDetail').textContent = value < 55 ? '正在执行模型输出与结构校验…' : value < 100 ? '正在计算指标并整理失败样本…' : '评测完成';
      if (value === 100) {
        clearInterval(evalTimer);
        completeEvaluation(item, samples, datasetName);
      }
    }, 260);
  };

  function completeEvaluation(baseItem, samples, datasetName) {
    var passed = baseItem.id !== 'confidence';
    var result = passed ? baseItem.result : '97.6%';
    aiState.evalResults[baseItem.id] = { status: passed ? 'pass' : 'fail', result: result, samples: samples, updated: nowText(), dataset: datasetName, reviewed: false };
    saveAiState();
    logAiAction('运行 AI 效果评测', baseItem.name + '，' + datasetName + ' ' + samples + ' 条，结果' + (passed ? '通过' : '未通过'));
    if (pendingPublishPromptKey) {
      aiState.promptStatus[pendingPublishPromptKey] = passed ? '已发布' : '待优化';
      saveAiState();
      logAiAction(passed ? '发布提示词版本' : '阻止提示词发布', pendingPublishPromptTitle + '，评测' + (passed ? '通过' : '未通过'));
      pendingPublishPromptKey = '';
      pendingPublishPromptTitle = '';
      renderPromptList();
      if (BASE_PROMPTS[activePrompt].id === baseItem.id) renderPromptStatus();
    }
    renderEval();
    setTimeout(function () { byId('evalTaskPanel').classList.add('hidden'); }, 900);
    window.openEvalReport(baseItem.id);
    showToast('评测完成：' + (passed ? '通过' : '需要人工复核'));
  }

  window.openEvalReport = function (id) {
    var item = evalItemById(id);
    if (!item) return;
    currentReportId = id;
    var model = modelById(aiState.globalRoute.primary);
    byId('reportScenarioModule').textContent = '效果评测';
    byId('reportScenarioTitle').textContent = item.name;
    byId('reportMeta').textContent = (item.dataset || '发布金标集') + ' · ' + (model ? model.name : '未配置模型') + ' · ' + item.updated;
    byId('reportStatus').textContent = item.status === 'pass' ? '评测通过' : item.status === 'running' ? '评测中' : '评测未通过';
    byId('reportStatus').className = 'prompt-status' + (item.status === 'pass' ? '' : ' draft');
    byId('reportResult').textContent = item.result || '—';
    byId('reportThreshold').textContent = item.threshold;
    byId('reportSamples').textContent = String(item.samples);
    byId('reportReview').textContent = item.reviewed ? '已复核' : '待复核';
    byId('reportReviewNote').value = item.reviewNote || '';
    var issues = item.status === 'fail' ? [
      ['CASE-019', '未通过', '录取类低置信度样本未进入人工复核', '提高关键风险召回规则权重'],
      ['CASE-047', '未通过', '前两类分差边界判断错误', '补充边界样本后重新评测']
    ] : [
      ['CASE-028', '通过，建议抽查', '证据页码来自 OCR 合并页', '人工确认原始页码映射']
    ];
    byId('reportIssueRows').innerHTML = issues.map(function (row) { return '<tr><td>' + escapeHtml(row[0]) + '</td><td>' + escapeHtml(row[1]) + '</td><td>' + escapeHtml(row[2]) + '</td><td>' + escapeHtml(row[3]) + '</td></tr>'; }).join('');
    openModal('evaluationReportModal');
  };

  window.markEvaluationReviewed = function () {
    var item = evalItemById(currentReportId);
    if (!item) return;
    aiState.evalResults[currentReportId] = Object.assign({}, aiState.evalResults[currentReportId] || {}, { reviewed: true, reviewNote: byId('reportReviewNote').value.trim(), updated: item.updated });
    commitAutoSave('确认 AI 评测复核', item.name + '，复核结论：' + (byId('reportReviewNote').value.trim() || '已确认'), 'eval-review-' + currentReportId, true);
    renderEval();
    byId('reportReview').textContent = '已复核';
    showToast('复核结论已记录');
  };

  function initializeAutoSaveInputs() {
    document.querySelectorAll('.param-input').forEach(function (input) {
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', autoSaveParams);
    });
    document.querySelectorAll('.prompt-input').forEach(function (input) {
      input.addEventListener('input', function () { capturePromptForm(true); });
    });
  }

  function initialize() {
    initializeTabs();
    initializeDialogs();
    initializeEvalActions();
    renderProviders();
    renderModels();
    populateModelSelectors();
    loadParams();
    renderPrompts();
    renderEval();
    initializeAutoSaveInputs();
    saveAiState();
  }

  initialize();
})();
