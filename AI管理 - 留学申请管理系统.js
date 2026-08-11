/* PBS AI 管理原型交互：仅保存脱敏配置，不保存 API Key 明文。 */
var promptConfigs=[
    {id:'asset',module:'学生档案',title:'资产文件 AI 解析',version:'v1.2.0',vars:['file_text','file_type','student_id','field_dictionary'],system:'你是留学申请材料结构化专家。仅依据文件内容提取信息，不得补全或猜测。每个字段必须返回原文证据、页码和置信度；证件号、账号密码等敏感信息只标记存在，不输出原值。无法确定时返回 null 并说明原因。',user:'请按字段字典解析 {{file_type}} 文件。\\n学生标识：{{student_id}}\\n字段字典：{{field_dictionary}}\\nOCR文本：{{file_text}}',schema:'{"document_type":"string","fields":[{"name":"string","value":"string|null","evidence":"string","page":0,"confidence":0.0}],"warnings":["string"]}',metric:'字段 Exact Match、证据定位准确率、缺失字段召回率',threshold:'Exact Match ≥95%；证据准确率 ≥98%；幻觉率 ≤0.5%'},
    {id:'editor',module:'文书交付',title:'编辑框 AI 助手',version:'v1.1.0',vars:['selected_text','instruction','student_profile','school_prompt','word_limit'],system:'你是留学文书协作编辑。保持学生事实与个人声音，只对用户选中文本执行明确指令。禁止虚构经历、成绩、奖项或院校信息；事实不足时先提出澄清问题。返回修改稿、修改说明和事实风险提示。',user:'院校题目：{{school_prompt}}\\n字数限制：{{word_limit}}\\n学生资料：{{student_profile}}\\n选中文本：{{selected_text}}\\n编辑指令：{{instruction}}',schema:'{"revised_text":"string","changes":[{"type":"string","reason":"string"}],"fact_risks":["string"],"questions":["string"]}',metric:'人工采纳率、事实一致性、风格保持率、越权改写率',threshold:'采纳率 ≥45%；事实错误率 ≤1%；越权改写率 ≤2%'},
    {id:'suggest',module:'文书交付',title:'右侧 AI 建议',version:'v1.0.3',vars:['student_profile','draft','school_prompt','rubric'],system:'你是留学文书教练。基于学生资料、院校题目和当前草稿给出最多 5 条可执行建议。每条建议必须指出草稿证据位置、问题、改进动作和优先级，不直接编造替换内容。',user:'学生资料：{{student_profile}}\\n院校题目：{{school_prompt}}\\n评价规则：{{rubric}}\\n当前草稿：{{draft}}',schema:'{"suggestions":[{"priority":"P0|P1|P2","location":"string","issue":"string","action":"string","evidence":"string"}],"missing_facts":["string"]}',metric:'建议相关性、可执行性、重复率、人工采纳率',threshold:'专家相关性 ≥4.2/5；采纳率 ≥40%；重复率 ≤5%'},
    {id:'case',module:'文书交付',title:'案例包 AI 解析',version:'v1.3.0',vars:['case_documents','template_schema','document_type'],system:'你是文书模板抽象专家。跨多份案例识别共同结构、可变量和可复用写作策略；不得复制大段案例原文。每个结构结论需列出覆盖案例数、证据片段和置信度，低于 0.75 的结论标记人工复核。',user:'文书类型：{{document_type}}\\n目标模板结构：{{template_schema}}\\n案例集合：{{case_documents}}',schema:'{"sections":[{"name":"string","purpose":"string","coverage":0.0,"confidence":0.0,"evidence_refs":["string"]}],"variables":[{"name":"string","description":"string"}],"review_required":["string"]}',metric:'章节边界 F1、变量抽取准确率、模板覆盖率、版权风险',threshold:'章节 F1 ≥0.90；变量准确率 ≥93%；低置信度召回 ≥95%'},
    {id:'review',module:'文书审核',title:'AI 整体评价',version:'v2.0.0',vars:['draft','school_prompt','student_profile','rubric','word_limit'],system:'你是留学文书质量审核助手。依据院校题目和 PBS 评分规则进行辅助评价，不替代人工终审。所有事实判断必须与学生档案对照；输出总分、六维评分、亮点、待改进点和总体评语，并列出扣分证据。',user:'院校题目：{{school_prompt}}\\n字数限制：{{word_limit}}\\n学生资料：{{student_profile}}\\n评分规则：{{rubric}}\\n文书全文：{{draft}}',schema:'{"overall_score":0,"dimension_scores":{"relevance":0,"logic":0,"evidence":0,"language":0,"voice":0,"compliance":0},"strengths":[{"text":"string","evidence":"string"}],"improvements":[{"text":"string","evidence":"string","priority":"P0|P1|P2"}],"overall_comment":"string","fact_risks":["string"]}',metric:'与人工评分相关性、MAE、维度一致性、事实错误率',threshold:'Spearman ≥0.75；MAE ≤6；加权Kappa ≥0.65；事实错误率 ≤1%'},
    {id:'classify',module:'监控管理',title:'邮件/页面 AI 分类',version:'v1.4.0',vars:['subject','sender','body','attachments','school','application_id'],system:'你是留学申请通知分类器。结合发件域名、标题、正文和附件，将消息分类为 OFFER、REJECTION、WAITLIST、INTERVIEW、MISSING_MATERIAL、ACTION_REQUIRED、STATUS_UPDATE、SCHOLARSHIP、NOISE 或 UNKNOWN。必须输出证据关键词、置信度和建议状态变更；不确定时选择 UNKNOWN。',user:'申请：{{application_id}} / {{school}}\\n发件人：{{sender}}\\n标题：{{subject}}\\n正文：{{body}}\\n附件：{{attachments}}',schema:'{"category":"OFFER|REJECTION|WAITLIST|INTERVIEW|MISSING_MATERIAL|ACTION_REQUIRED|STATUS_UPDATE|SCHOLARSHIP|NOISE|UNKNOWN","confidence":0.0,"keywords":["string"],"evidence":"string","suggested_status":"string|null","manual_review":true}',metric:'Macro-F1、关键类别召回率、误更新率、平均延迟',threshold:'Macro-F1 ≥0.90；Offer/拒信/缺材料召回 ≥0.95；误更新率 ≤0.2%'},
    {id:'confidence',module:'监控管理',title:'低置信度异常识别',version:'v1.0.1',vars:['classification','top2_scores','rules_hit','message_metadata'],system:'你是 AI 分类质量守门器。根据最高置信度、前两类差值、规则冲突和关键信息缺失判断是否进入人工复核。任何录取/拒信/缺材料类结果在置信度不足时禁止自动写入业务状态。',user:'分类结果：{{classification}}\\nTop2 分数：{{top2_scores}}\\n命中规则：{{rules_hit}}\\n元数据：{{message_metadata}}',schema:'{"is_abnormal":true,"reason_codes":["LOW_CONFIDENCE|SMALL_MARGIN|RULE_CONFLICT|MISSING_EVIDENCE|HIGH_RISK_CATEGORY"],"route":"AUTO_UPDATE|MANUAL_REVIEW","explanation":"string"}',metric:'异常检出精确率、关键风险召回率、人工复核占比',threshold:'关键风险召回 100%；异常精确率 ≥85%；人工复核占比 ≤20%'},
    {id:'school',module:'选校管理',title:'AI 选校推荐说明',version:'v1.2.0',vars:['student_profile','school_candidates','requirements','preferences','historical_cases','data_date'],system:'你是选校决策辅助顾问。先校验硬性条件，再对候选学校按冲刺/匹配/保底分层。每项推荐必须引用院校要求及数据日期，明确不确定性；不得承诺录取概率。输出推荐理由、风险、补强动作和替代项，最终由顾问确认。',user:'学生资料：{{student_profile}}\\n偏好：{{preferences}}\\n候选学校：{{school_candidates}}\\n院校要求：{{requirements}}\\n历史案例：{{historical_cases}}\\n数据日期：{{data_date}}',schema:'{"recommendations":[{"school":"string","program":"string","tier":"REACH|MATCH|SAFETY","reasons":["string"],"risks":["string"],"actions":["string"],"source_refs":["string"],"confidence":0.0}],"hard_constraint_violations":["string"],"disclaimer":"string"}',metric:'硬条件违规率、专家 Top-K 接受率、NDCG、证据覆盖率',threshold:'硬条件违规率 0%；专家接受率 ≥80%；NDCG@5 ≥0.85；证据覆盖率 100%'}
  ];
  var evalData=[
    ['资产文件 AI 解析','字段 Exact Match','≥95%','96.8%','240','pass'],
    ['编辑框 AI 助手','人工采纳率 / 事实错误','≥45% / ≤1%','48.2% / 0.6%','180','pass'],
    ['右侧 AI 建议','专家相关性','≥4.2/5','4.4/5','160','pass'],
    ['案例包 AI 解析','章节边界 F1','≥0.90','0.92','120','pass'],
    ['文书审核 AI 评价','Spearman / MAE','≥0.75 / ≤6','0.79 / 5.2','200','pass'],
    ['监控 AI 分类','Macro-F1','≥0.90','0.93','220','pass'],
    ['低置信度异常识别','关键风险召回','100%','96.4%','84','fail'],
    ['AI 选校推荐','硬条件违规 / 接受率','0% / ≥80%','0% / 83%','76','pass']
  ];
  var activePrompt=0;

var AI_STORAGE_KEY = 'pbs_ai_management_v2';
var AI_SCENES = [
  '学生资产文件 AI 解析', '文书编辑器 AI 助手', '文书右侧 AI 建议', '案例包 AI 解析',
  '文书审核 AI 整体评价', '监控邮件 AI 分类', '低置信度异常识别', 'AI 选校推荐'
];
var PROVIDER_PRESETS = {
  qwen: { name: 'Qwen（通义千问）', code: 'qwen', short: 'QW', color: '#7c6aed', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  deepseek: { name: 'DeepSeek', code: 'deepseek', short: 'DS', color: '#2563eb', url: 'https://api.deepseek.com' },
  kimi: { name: 'Kimi', code: 'kimi', short: 'KM', color: '#111827', url: 'https://api.moonshot.cn/v1' },
  seed: { name: 'Seed（豆包）', code: 'seed', short: 'SE', color: '#0f766e', url: 'https://ark.cn-beijing.volces.com/api/v3' },
  glm: { name: 'GLM（智谱）', code: 'glm', short: 'GLM', color: '#1d4ed8', url: 'https://open.bigmodel.cn/api/paas/v4' },
  openai_compatible: { name: '通用 OpenAI 格式', code: 'openai_compatible', short: 'OA', color: '#475569', url: '' }
};
var DEFAULT_PROVIDERS = Object.keys(PROVIDER_PRESETS).map(function (type) {
  var p = PROVIDER_PRESETS[type];
  return { id: type, type: type, name: p.name, code: p.code, defaultUrl: p.url, customUrl: '', hasKey: false, keyLast4: '', enabled: false, status: 'unconfigured', latency: null, auth: 'Bearer Token', header: 'Authorization', timeout: 60, rotate: '到期前 14 天', builtin: true };
});
var DEFAULT_MODELS = [
  { id: 'm-qwen', name: 'Qwen 主模型', providerId: 'qwen', modelId: 'qwen-plus', context: 131072, maxOutput: 8192, thinking: '自动', capabilities: ['文本', 'JSON Schema', '思考模式'], inputPrice: 0, outputPrice: 0, enabled: true },
  { id: 'm-deepseek', name: 'DeepSeek 次选模型', providerId: 'deepseek', modelId: 'deepseek-v4-flash', context: 1000000, maxOutput: 65536, thinking: '自动', capabilities: ['文本', 'JSON Schema', '思考模式'], inputPrice: 0, outputPrice: 0, enabled: true },
  { id: 'm-kimi', name: 'Kimi 长文本模型', providerId: 'kimi', modelId: 'kimi-k2.6', context: 262144, maxOutput: 32768, thinking: '自动', capabilities: ['文本', '视觉', 'JSON Schema', '思考模式'], inputPrice: 0, outputPrice: 0, enabled: true },
  { id: 'm-seed', name: 'Seed 通用模型', providerId: 'seed', modelId: 'doubao-seed-2-0-lite-260215', context: 256000, maxOutput: 32768, thinking: '自动', capabilities: ['文本', '视觉', 'JSON Schema', '思考模式'], inputPrice: 0, outputPrice: 0, enabled: true },
  { id: 'm-glm', name: 'GLM 通用模型', providerId: 'glm', modelId: 'glm-5.2', context: 200000, maxOutput: 32768, thinking: '自动', capabilities: ['文本', '文件', 'JSON Schema', '思考模式'], inputPrice: 0, outputPrice: 0, enabled: true }
];

function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
function defaultAiState() {
  return {
    providers: cloneJson(DEFAULT_PROVIDERS),
    models: cloneJson(DEFAULT_MODELS),
    globalRoute: { primary: 'm-qwen', backup: 'm-deepseek' },
    routes: {}, params: {}, thinkingDefaults: { parse: '关闭', write: '自动', review: '开启' },
    failover: {}, promptOverrides: {}, promptStatus: {},
    audit: [{ time: '2026-08-11 00:00:00', action: '初始化 AI 管理配置', detail: '内置 6 类厂商与 8 个业务场景；未保存任何 API Key' }]
  };
}
function loadAiState() {
  var state = defaultAiState();
  try {
    var saved = JSON.parse(localStorage.getItem(AI_STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      Object.keys(state).forEach(function (key) { if (saved[key] !== undefined) state[key] = saved[key]; });
    }
  } catch (e) { /* 使用默认配置 */ }
  DEFAULT_PROVIDERS.forEach(function (preset) {
    if (!state.providers.some(function (p) { return p.id === preset.id; })) state.providers.push(cloneJson(preset));
  });
  if (!Array.isArray(state.models)) state.models = cloneJson(DEFAULT_MODELS);
  return state;
}
var aiState = loadAiState();

var AI_TABS = ['vendors', 'models', 'params', 'prompts', 'evaluation', 'failover'];

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

function initializeAiTabs() {
  var tabbar = document.querySelector('.tabbar');
  if (!tabbar || tabbar.dataset.initialized === 'true') return;
  tabbar.dataset.initialized = 'true';
  tabbar.addEventListener('click', function (event) {
    var tab = event.target.closest('.tab');
    if (tab && tabbar.contains(tab)) activateAiTab(tab.dataset.tab);
  });
  tabbar.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var current = event.target.closest('.tab');
    if (!current) return;
    var index = AI_TABS.indexOf(current.dataset.tab);
    var offset = event.key === 'ArrowRight' ? 1 : -1;
    var nextName = AI_TABS[(index + offset + AI_TABS.length) % AI_TABS.length];
    activateAiTab(nextName);
    var nextTab = tabbar.querySelector('[data-tab="' + nextName + '"]');
    if (nextTab) nextTab.focus();
    event.preventDefault();
  });
  document.querySelectorAll('.tabbar .tab').forEach(function (tab) {
    tab.setAttribute('aria-controls', 'pane-' + tab.dataset.tab);
  });
  document.querySelectorAll('.tabs .pane').forEach(function (pane) {
    pane.setAttribute('role', 'tabpanel');
  });
  var initial = tabbar.querySelector('.tab.active');
  activateAiTab(initial ? initial.dataset.tab : AI_TABS[0]);
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function initializeAiDialogs() {
  document.querySelectorAll('.modal').forEach(function (modal) {
    if (modal.dataset.initialized === 'true') return;
    modal.dataset.initialized = 'true';
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.classList.remove('show');
    });
  });
}

function insertVariable(name) {
  var textarea = document.getElementById('userPrompt');
  var position = textarea.selectionStart || textarea.value.length;
  textarea.value = textarea.value.slice(0, position) + '{{' + name + '}}' + textarea.value.slice(position);
  textarea.focus();
}

function openPromptTest() {
  openModal('promptTestModal');
  document.getElementById('testOutput').textContent = '点击“运行测试”生成结构化示例结果。';
  document.getElementById('testLatency').textContent = '—';
  document.getElementById('testTokens').textContent = '—';
  document.getElementById('testSchema').textContent = '—';
}

function renderEval() {
  var rows = document.getElementById('evalRows');
  if (!rows) return;
  rows.innerHTML = evalData.map(function (item) {
    var passed = item[5] === 'pass';
    return '<tr><td><b>' + escapeHtml(item[0]) + '</b></td><td>' + escapeHtml(item[1]) + '</td><td>' + escapeHtml(item[2]) + '</td>' +
      '<td><span class="score ' + (passed ? 'good' : 'bad') + '">' + escapeHtml(item[3]) + '</span></td><td>' + escapeHtml(item[4]) + '</td>' +
      '<td><span class="badge ' + (passed ? 'green' : 'amber') + '">' + (passed ? '通过' : '待优化') + '</span></td>' +
      '<td><button class="btn ghost sm" type="button" data-eval-name="' + escapeHtml(item[0]) + '">查看报告</button></td></tr>';
  }).join('');
  if (rows.dataset.initialized !== 'true') {
    rows.dataset.initialized = 'true';
    rows.addEventListener('click', function (event) {
      var button = event.target.closest('[data-eval-name]');
      if (button && rows.contains(button)) showToast(button.dataset.evalName + '评测详情已打开');
    });
  }
}

function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
}

function saveAiState() { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiState)); }
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]; });
}
function nowText() {
  var d = new Date();
  function pad(n) { return String(n).padStart(2, '0'); }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
function logAiAction(action, detail) {
  aiState.audit.unshift({ time: nowText(), action: action, detail: detail });
  aiState.audit = aiState.audit.slice(0, 50);
  saveAiState();
  renderAudit();
}
function providerById(id) { return aiState.providers.find(function (p) { return p.id === id; }); }
function modelById(id) { return aiState.models.find(function (m) { return m.id === id; }); }
function resolvedProviderUrl(p) { return (p.customUrl || '').trim() || (p.defaultUrl || '').trim(); }
function providerReady(id) {
  var p = providerById(id);
  return !!(p && p.enabled && p.hasKey && p.status === 'connected');
}
function statusBadge(p) {
  if (p.status === 'testing') return '<span class="badge amber">测试中…</span>';
  if (p.status === 'connected') return '<span class="badge green"><i class="status-dot"></i>正常' + (p.latency ? ' · ' + p.latency + 'ms' : '') + '</span>';
  if (p.status === 'failed') return '<span class="badge amber">连接失败</span>';
  return '<span class="badge gray">待配置</span>';
}
function maskKey(p) { return p.hasKey ? '•••••••••• ' + escapeHtml(p.keyLast4 || '****') : '未填写'; }

function renderProviders() {
  var tbody = document.getElementById('providerRows');
  if (!tbody) return;
  tbody.innerHTML = aiState.providers.map(function (p) {
    var preset = PROVIDER_PRESETS[p.type] || PROVIDER_PRESETS.openai_compatible;
    var url = resolvedProviderUrl(p);
    var source = p.customUrl ? '<span class="badge purple">自定义</span>' : '<span class="badge gray">厂商默认</span>';
    if (!url) source = '<span class="badge amber">必须填写</span>';
    return '<tr><td><div class="provider"><div class="provider-logo" style="background:' + preset.color + '">' + escapeHtml(preset.short) + '</div><div><b>' + escapeHtml(p.name) + '</b><div class="subtle">' + escapeHtml(p.code) + '</div></div></div></td>' +
      '<td class="provider-url"><div>' + (url ? escapeHtml(url) : '<span class="danger-text">未设置请求 URL</span>') + '</div><div style="margin-top:5px">' + source + '</div></td>' +
      '<td><div class="key-state"><span class="' + (p.hasKey ? 'good' : 'danger-text') + '">' + maskKey(p) + '</span></div></td>' +
      '<td>' + statusBadge(p) + '</td>' +
      '<td><label class="switch"><input type="checkbox" ' + (p.enabled ? 'checked' : '') + ' onchange="toggleProvider(\'' + p.id + '\',this.checked)"><span class="slider"></span></label></td>' +
      '<td><button class="btn sm" onclick="testProviderById(\'' + p.id + '\',this)">测试连接</button> <button class="btn ghost sm" onclick="openProviderEditor(\'' + p.id + '\')">编辑</button></td></tr>';
  }).join('');
  updateSummary();
  populateProviderSelect();
}
function updateSummary() {
  var configured = aiState.providers.filter(function (p) { return p.hasKey && resolvedProviderUrl(p); }).length;
  var connected = aiState.providers.filter(function (p) { return providerReady(p.id); }).length;
  var availableModels = aiState.models.filter(function (m) { return m.enabled && providerReady(m.providerId); }).length;
  var providerCount = document.getElementById('providerCount');
  var providerSummary = document.getElementById('providerSummary');
  var modelCount = document.getElementById('modelCount');
  var modelSummary = document.getElementById('modelSummary');
  if (providerCount) providerCount.textContent = configured + ' / ' + aiState.providers.length;
  if (providerSummary) { providerSummary.textContent = connected ? connected + ' 个连接正常' : '等待填写 API Key 并测试连接'; providerSummary.className = 'metric-sub ' + (connected ? 'good' : 'warn'); }
  if (modelCount) modelCount.textContent = String(availableModels);
  if (modelSummary) modelSummary.textContent = availableModels ? '已通过厂商连接校验' : '模型已预置，厂商连接后可用';
}
function openProviderEditor(id) {
  var p = id ? providerById(id) : null;
  window.providerFormTested = false;
  document.getElementById('providerEditId').value = p ? p.id : '';
  document.getElementById('providerModalTitle').textContent = p ? '编辑模型厂商' : '新增 OpenAI 兼容厂商';
  document.getElementById('providerType').value = p ? p.type : 'openai_compatible';
  document.getElementById('newProviderName').value = p ? p.name : '自定义 OpenAI 兼容服务';
  document.getElementById('newProviderEndpoint').value = p ? p.customUrl : '';
  document.getElementById('providerApiKey').value = '';
  document.getElementById('providerApiKey').placeholder = p && p.hasKey ? '留空保留已保存密钥（末四位 ' + p.keyLast4 + '）' : '请输入 API Key；保存后不再回显';
  document.getElementById('providerAuth').value = p ? p.auth : 'Bearer Token';
  document.getElementById('providerHeader').value = p ? p.header : 'Authorization';
  document.getElementById('providerTimeout').value = p ? p.timeout : 60;
  document.getElementById('providerRotate').value = p ? p.rotate : '到期前 14 天';
  document.getElementById('providerFormError').textContent = '';
  document.getElementById('providerType').disabled = !!(p && p.builtin);
  applyProviderPreset(p && p.defaultUrl);
  openModal('providerModal');
}
function applyProviderPreset(existingDefault) {
  var type = document.getElementById('providerType').value;
  var preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.openai_compatible;
  var editId = document.getElementById('providerEditId').value;
  if (!editId && document.activeElement === document.getElementById('providerType')) document.getElementById('newProviderName').value = preset.name;
  document.getElementById('providerDefaultUrl').value = existingDefault || preset.url || '无默认地址，必须填写自定义 URL';
  updateResolvedProviderUrl();
}
function updateResolvedProviderUrl() {
  var type = document.getElementById('providerType').value;
  var preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.openai_compatible;
  var custom = document.getElementById('newProviderEndpoint').value.trim();
  var actual = custom || preset.url;
  document.getElementById('providerResolvedUrl').textContent = '实际请求地址：' + (actual || '未设置');
}
function toggleApiKey() {
  var input = document.getElementById('providerApiKey');
  input.type = input.type === 'password' ? 'text' : 'password';
}
function validateProviderForm() {
  var edit = providerById(document.getElementById('providerEditId').value);
  var type = document.getElementById('providerType').value;
  var preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.openai_compatible;
  var name = document.getElementById('newProviderName').value.trim();
  var customUrl = document.getElementById('newProviderEndpoint').value.trim();
  var actualUrl = customUrl || preset.url;
  var key = document.getElementById('providerApiKey').value.trim();
  if (!name) return '请填写厂商显示名称';
  if (!actualUrl) return '通用 OpenAI 格式必须填写自定义请求 URL';
  if (!/^https?:\/\//i.test(actualUrl)) return '请求 URL 必须以 http:// 或 https:// 开头';
  if (!key && !(edit && edit.hasKey)) return '请填写 API Key';
  return '';
}
function testProviderForm(btn) {
  var error = validateProviderForm();
  document.getElementById('providerFormError').textContent = error;
  if (error) return;
  var old = btn.textContent; btn.textContent = '测试中…'; btn.disabled = true;
  setTimeout(function () { window.providerFormTested = true; btn.textContent = '连接成功 · 236ms'; btn.disabled = false; showToast('连接测试成功；生产环境将由后端模型网关执行'); setTimeout(function () { btn.textContent = old; }, 1200); }, 850);
}
function saveProvider() {
  var error = validateProviderForm();
  document.getElementById('providerFormError').textContent = error;
  if (error) return;
  var editId = document.getElementById('providerEditId').value;
  var p = providerById(editId);
  var type = document.getElementById('providerType').value;
  var preset = PROVIDER_PRESETS[type] || PROVIDER_PRESETS.openai_compatible;
  var rawKey = document.getElementById('providerApiKey').value.trim();
  if (!p) {
    p = { id: 'custom_' + Date.now(), type: type, code: 'openai_compatible_' + (aiState.providers.length + 1), builtin: false, status: 'unconfigured', latency: null, hasKey: false, keyLast4: '', enabled: true };
    aiState.providers.push(p);
  }
  p.name = document.getElementById('newProviderName').value.trim();
  p.defaultUrl = preset.url; p.customUrl = document.getElementById('newProviderEndpoint').value.trim();
  p.auth = document.getElementById('providerAuth').value; p.header = document.getElementById('providerHeader').value.trim() || 'Authorization';
  p.timeout = Number(document.getElementById('providerTimeout').value) || 60; p.rotate = document.getElementById('providerRotate').value;
  if (rawKey) { p.hasKey = true; p.keyLast4 = rawKey.slice(-4); document.getElementById('providerApiKey').value = ''; }
  p.enabled = true;
  if (window.providerFormTested) { p.status = 'connected'; p.latency = 236; } else if (p.status !== 'connected') { p.status = 'unconfigured'; }
  logAiAction('保存模型厂商', p.name + '；' + (p.customUrl ? '使用自定义 URL' : '使用厂商默认 URL') + '；API Key 仅保存掩码');
  closeModal('providerModal'); renderProviders(); renderModels(); populateAllModelSelectors();
  showToast(p.name + ' 已保存');
}
function toggleProvider(id, enabled) {
  var p = providerById(id); if (!p) return; p.enabled = enabled;
  logAiAction(enabled ? '启用模型厂商' : '停用模型厂商', p.name);
  renderProviders(); renderModels();
}
function testProviderById(id, btn) {
  var p = providerById(id); if (!p) return;
  if (!p.hasKey) { showToast('请先编辑 ' + p.name + ' 并填写 API Key'); openProviderEditor(id); return; }
  if (!resolvedProviderUrl(p)) { showToast('请先设置请求 URL'); openProviderEditor(id); return; }
  p.status = 'testing'; renderProviders();
  setTimeout(function () { p.status = 'connected'; p.latency = 180 + Math.floor(Math.random() * 160); p.enabled = true; logAiAction('测试厂商连接', p.name + ' 连接成功，' + p.latency + 'ms'); renderProviders(); renderModels(); showToast(p.name + ' 连接成功'); }, 850);
}

function renderModels() {
  var tbody = document.getElementById('modelRows'); if (!tbody) return;
  tbody.innerHTML = aiState.models.map(function (m) {
    var p = providerById(m.providerId) || { name: '未选择厂商' };
    var ready = providerReady(m.providerId) && m.enabled;
    return '<tr><td><b>' + escapeHtml(m.name) + '</b><div class="subtle">最大输出 ' + Number(m.maxOutput || 0).toLocaleString() + ' Token</div></td>' +
      '<td>' + escapeHtml(p.name) + '<br><span class="subtle">' + escapeHtml(m.modelId) + '</span></td>' +
      '<td>' + Number(m.context || 0).toLocaleString() + '</td>' +
      '<td><div class="chips">' + (m.capabilities || []).map(function (c) { return '<span class="badge purple">' + escapeHtml(c) + '</span>'; }).join('') + '</div><div class="help">思考：' + escapeHtml(m.thinking) + '</div></td>' +
      '<td><label class="switch"><input type="checkbox" ' + (m.enabled ? 'checked' : '') + ' onchange="toggleModel(\'' + m.id + '\',this.checked)"><span class="slider"></span></label><div class="help ' + (ready ? 'good' : 'warn') + '">' + (ready ? '可用' : '待厂商连接') + '</div></td>' +
      '<td><button class="btn ghost sm" onclick="openModelEditor(\'' + m.id + '\')">编辑</button></td></tr>';
  }).join('');
  updateSummary();
}
function populateProviderSelect() {
  var select = document.getElementById('modelProvider'); if (!select) return;
  var old = select.value;
  select.innerHTML = aiState.providers.map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.name) + (p.hasKey ? '' : '（待填 Key）') + '</option>'; }).join('');
  if (old && providerById(old)) select.value = old;
}
function openModelEditor(id) {
  var m = id ? modelById(id) : null;
  document.getElementById('modelEditId').value = m ? m.id : '';
  document.getElementById('modelModalTitle').textContent = m ? '编辑模型' : '新增模型';
  populateProviderSelect();
  document.getElementById('newModelName').value = m ? m.name : '';
  document.getElementById('modelProvider').value = m ? m.providerId : aiState.providers[0].id;
  document.getElementById('newModelId').value = m ? m.modelId : '';
  document.getElementById('modelContext').value = m ? m.context : 128000;
  document.getElementById('modelMaxOutput').value = m ? m.maxOutput : 8192;
  document.getElementById('modelThinking').value = m ? m.thinking : '自动';
  document.getElementById('modelInputPrice').value = m ? m.inputPrice : 0;
  document.getElementById('modelOutputPrice').value = m ? m.outputPrice : 0;
  document.querySelectorAll('.model-capability').forEach(function (c) { c.checked = m ? (m.capabilities || []).indexOf(c.value) >= 0 : (c.value === '文本' || c.value === 'JSON Schema'); });
  document.getElementById('modelFormError').textContent = '';
  openModal('modelModal');
}
function saveModel() {
  var name = document.getElementById('newModelName').value.trim();
  var modelId = document.getElementById('newModelId').value.trim();
  var providerId = document.getElementById('modelProvider').value;
  var error = !name ? '请填写模型显示名称' : (!modelId ? '请填写真实 Model ID' : (!providerId ? '请选择厂商' : ''));
  document.getElementById('modelFormError').textContent = error; if (error) return;
  var m = modelById(document.getElementById('modelEditId').value);
  if (!m) { m = { id: 'model_' + Date.now(), enabled: true }; aiState.models.push(m); }
  m.name = name; m.providerId = providerId; m.modelId = modelId;
  m.context = Number(document.getElementById('modelContext').value) || 0; m.maxOutput = Number(document.getElementById('modelMaxOutput').value) || 0;
  m.thinking = document.getElementById('modelThinking').value; m.inputPrice = Number(document.getElementById('modelInputPrice').value) || 0; m.outputPrice = Number(document.getElementById('modelOutputPrice').value) || 0;
  m.capabilities = Array.prototype.slice.call(document.querySelectorAll('.model-capability:checked')).map(function (c) { return c.value; });
  logAiAction('保存模型', m.name + ' / ' + m.modelId + ' / ' + (providerById(providerId) || {}).name);
  closeModal('modelModal'); renderModels(); populateAllModelSelectors(); showToast(m.name + ' 已保存');
}
function toggleModel(id, enabled) { var m = modelById(id); if (!m) return; m.enabled = enabled; logAiAction(enabled ? '启用模型' : '停用模型', m.name); renderModels(); populateAllModelSelectors(); }

function modelOptions(selected, allowEmpty) {
  var html = allowEmpty ? '<option value="">未配置</option>' : '';
  return html + aiState.models.filter(function (m) { return m.enabled; }).map(function (m) {
    var p = providerById(m.providerId); return '<option value="' + m.id + '" ' + (m.id === selected ? 'selected' : '') + '>' + escapeHtml(m.name) + ' · ' + escapeHtml(p ? p.name : '') + '</option>';
  }).join('');
}
function populateAllModelSelectors() {
  var gp = document.getElementById('globalPrimary'), gb = document.getElementById('globalBackup');
  if (gp) gp.innerHTML = modelOptions(aiState.globalRoute.primary, true);
  if (gb) gb.innerHTML = modelOptions(aiState.globalRoute.backup, true);
  var pm = document.getElementById('paramModel');
  if (pm) { var previous = pm.value || aiState.globalRoute.primary; pm.innerHTML = modelOptions(previous, true); if (modelById(previous)) pm.value = previous; }
  populatePromptRouteSelectors(); syncFlow();
}
function validateRoute() {
  var p = document.getElementById('globalPrimary').value, b = document.getElementById('globalBackup').value;
  if (p && p === b) { showToast('主 AI 与次选 AI 不能相同'); return false; }
  return true;
}
function saveGlobalRoute() {
  if (!validateRoute()) return;
  aiState.globalRoute.primary = document.getElementById('globalPrimary').value; aiState.globalRoute.backup = document.getElementById('globalBackup').value;
  logAiAction('保存全局主备', (modelById(aiState.globalRoute.primary) || {}).name + ' → ' + (modelById(aiState.globalRoute.backup) || {}).name); syncFlow(); showToast('全局主备关系已保存');
}

function paramDefaults(index) {
  var presets = [[0.1, .9, 4096, '关闭'], [.6, .95, 4096, '自动'], [.4, .9, 3072, '自动'], [.2, .9, 8192, '自动'], [.2, .9, 6144, '开启'], [0, .8, 1024, '关闭'], [0, .8, 1024, '关闭'], [.3, .9, 4096, '开启']];
  var p = presets[index] || presets[0]; return { temperature: p[0], topP: p[1], maxTokens: p[2], timeout: 60, retry: 1, concurrency: 20, thinking: p[3], json: index !== 1, stream: index === 1, log: true };
}
function paramKey() { return document.getElementById('paramScene').selectedIndex + '::' + (document.getElementById('paramModel').value || 'default'); }
function loadParamProfile() {
  var profile = aiState.params[paramKey()] || paramDefaults(document.getElementById('paramScene').selectedIndex);
  document.getElementById('temperature').value = profile.temperature; document.getElementById('topP').value = profile.topP; document.getElementById('maxTokens').value = profile.maxTokens;
  document.getElementById('timeout').value = profile.timeout; document.getElementById('retryCount').value = profile.retry; document.getElementById('concurrency').value = profile.concurrency;
  document.getElementById('thinkingMode').value = profile.thinking; document.getElementById('jsonOutput').checked = !!profile.json; document.getElementById('streamOutput').checked = !!profile.stream; document.getElementById('saveRequestLog').checked = !!profile.log;
  var model = modelById(document.getElementById('paramModel').value); document.getElementById('thinkingHint').textContent = model && (model.capabilities || []).indexOf('思考模式') >= 0 ? '当前模型支持思考模式。' : '当前模型未声明支持，保存时会保留配置但请求时不下发。';
}
function saveParams() {
  var temperature = Number(document.getElementById('temperature').value), topP = Number(document.getElementById('topP').value), maxTokens = Number(document.getElementById('maxTokens').value);
  if (temperature < 0 || temperature > 2 || topP < 0 || topP > 1 || maxTokens <= 0) { showToast('参数范围不合法，请检查 Temperature、Top P 和 Token'); return; }
  aiState.params[paramKey()] = { temperature: temperature, topP: topP, maxTokens: maxTokens, timeout: Number(document.getElementById('timeout').value), retry: Number(document.getElementById('retryCount').value), concurrency: Number(document.getElementById('concurrency').value), thinking: document.getElementById('thinkingMode').value, json: document.getElementById('jsonOutput').checked, stream: document.getElementById('streamOutput').checked, log: document.getElementById('saveRequestLog').checked };
  logAiAction('保存请求参数', AI_SCENES[document.getElementById('paramScene').selectedIndex] + ' / ' + ((modelById(document.getElementById('paramModel').value) || {}).name || '默认模型')); showToast('当前场景请求参数已保存');
}
function resetParams() { aiState.params[paramKey()] = paramDefaults(document.getElementById('paramScene').selectedIndex); loadParamProfile(); showToast('已恢复该场景建议参数'); }
function loadParamPreset() { loadParamProfile(); }

function restorePromptOverrides() {
  promptConfigs.forEach(function (p) { var o = aiState.promptOverrides[p.id]; if (o) Object.keys(o).forEach(function (k) { if (k !== 'route') p[k] = o[k]; }); });
}
function routeForPrompt(p) {
  if (!aiState.routes[p.id]) aiState.routes[p.id] = { primary: aiState.globalRoute.primary, backup: aiState.globalRoute.backup, thinking: p.id === 'classify' || p.id === 'confidence' ? '关闭' : '自动' };
  return aiState.routes[p.id];
}
function populatePromptRouteSelectors() {
  var p = promptConfigs[activePrompt]; if (!p) return; var route = routeForPrompt(p);
  var primary = document.getElementById('promptPrimary'), backup = document.getElementById('promptBackup');
  if (primary) primary.innerHTML = modelOptions(route.primary, true); if (backup) backup.innerHTML = modelOptions(route.backup, true);
  if (primary) primary.value = route.primary || ''; if (backup) backup.value = route.backup || '';
  var thinking = document.getElementById('promptThinking'); if (thinking) thinking.value = route.thinking || '自动';
}
function renderPrompts() {
  var list = document.getElementById('promptList');
  list.innerHTML = promptConfigs.map(function (p, i) { var status = aiState.promptStatus[p.id] || '已发布'; return '<div class="prompt-item ' + (i === activePrompt ? 'active' : '') + '" onclick="selectPrompt(' + i + ')"><div class="prompt-name">' + (i + 1) + '. ' + escapeHtml(p.title) + '</div><div class="prompt-meta"><span>' + escapeHtml(p.module) + ' · ' + status + '</span><span>' + escapeHtml(p.version) + '</span></div></div>'; }).join('');
  loadPrompt();
}
function selectPrompt(i) { activePrompt = i; renderPrompts(); }
function loadPrompt() {
  var p = promptConfigs[activePrompt];
  document.getElementById('promptModule').textContent = p.module; document.getElementById('promptTitle').textContent = p.title; document.getElementById('promptVersion').textContent = p.version;
  document.getElementById('systemPrompt').value = p.system; document.getElementById('userPrompt').value = p.user; document.getElementById('outputSchema').value = p.schema; document.getElementById('promptMetric').value = p.metric; document.getElementById('promptThreshold').value = p.threshold;
  document.getElementById('promptVariables').innerHTML = p.vars.map(function (v) { return '<span class="chip" onclick="insertVariable(\'' + v + '\')">{{' + v + '}}</span>'; }).join('');
  var status = aiState.promptStatus[p.id] || '已发布', badge = document.getElementById('promptStatus'); badge.textContent = status; badge.className = 'badge ' + (status === '已发布' ? 'green' : 'amber');
  populatePromptRouteSelectors();
}
function capturePromptForm() {
  var p = promptConfigs[activePrompt]; p.system = document.getElementById('systemPrompt').value; p.user = document.getElementById('userPrompt').value; p.schema = document.getElementById('outputSchema').value; p.metric = document.getElementById('promptMetric').value; p.threshold = document.getElementById('promptThreshold').value;
  aiState.promptOverrides[p.id] = { system: p.system, user: p.user, schema: p.schema, metric: p.metric, threshold: p.threshold, version: p.version };
  return p;
}
function savePromptRoutingDraft() {
  var p = promptConfigs[activePrompt], primary = document.getElementById('promptPrimary').value, backup = document.getElementById('promptBackup').value;
  if (primary && primary === backup) { showToast('该场景主 AI 与次选 AI 不能相同'); return false; }
  aiState.routes[p.id] = { primary: primary, backup: backup, thinking: document.getElementById('promptThinking').value }; saveAiState(); loadFailoverRoute(); return true;
}
function savePrompt() {
  var p = capturePromptForm(); if (!savePromptRoutingDraft()) return;
  aiState.promptStatus[p.id] = '草稿'; logAiAction('保存提示词草稿', p.title + ' ' + p.version); renderPrompts(); showToast(p.title + ' 草稿已保存');
}
function clonePrompt() {
  var p = capturePromptForm(), parts = p.version.replace('v', '').split('.'); while (parts.length < 3) parts.push('0'); parts[2] = String(Number(parts[2]) + 1); p.version = 'v' + parts.join('.');
  aiState.promptStatus[p.id] = '草稿'; aiState.promptOverrides[p.id].version = p.version; logAiAction('复制提示词版本', p.title + ' → ' + p.version); renderPrompts(); showToast('已复制为 ' + p.version + ' 草稿');
}
function validatePrompt(silent) {
  var p = capturePromptForm(), error = '';
  try { JSON.parse(p.schema); } catch (e) { error = '输出 Schema 不是有效 JSON'; }
  if (!p.system.trim() || !p.user.trim()) error = '系统提示词和用户模板不能为空';
  var vars = []; p.user.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_, v) { vars.push(v); });
  var unknown = vars.filter(function (v) { return p.vars.indexOf(v) < 0; }); if (unknown.length) error = '存在未定义变量：' + unknown.join(', ');
  if (!silent) showToast(error || '校验通过：提示词变量与 JSON 结构均有效'); return !error;
}
function publishPrompt() {
  var p = capturePromptForm(); if (!validatePrompt(true) || !savePromptRoutingDraft()) { showToast('发布前校验失败，请检查提示词、变量、Schema 和主备模型'); return; }
  if (!aiState.routes[p.id].primary) { showToast('必须为该场景选择主模型'); return; }
  aiState.promptStatus[p.id] = '评测中'; renderPrompts(); showToast('正在使用金标集运行发布前评测…');
  setTimeout(function () { aiState.promptStatus[p.id] = '已发布'; logAiAction('发布提示词版本', p.title + ' ' + p.version + '；评测通过'); renderPrompts(); showToast(p.title + ' 已通过评测并发布'); }, 1400);
}
function runPromptTest() {
  var p = promptConfigs[activePrompt], route = routeForPrompt(p), primary = modelById(route.primary), output = document.getElementById('testOutput');
  if (!validatePrompt(true)) { output.textContent = '提示词或 Schema 校验失败，无法运行。'; return; }
  if (!primary) { output.textContent = '尚未配置主模型。'; return; }
  output.textContent = '正在请求主模型 ' + primary.name + '…';
  setTimeout(function () { output.innerHTML = '<span class="ok">✓ 原型调试响应成功</span>\n场景：' + escapeHtml(p.title) + '\n主模型：' + escapeHtml(primary.name) + '\n输出已通过 JSON Schema 校验\n质量预检：通过；未发现敏感信息或明显事实冲突'; document.getElementById('testLatency').textContent = '1.46s'; document.getElementById('testTokens').textContent = '1,126'; document.getElementById('testSchema').innerHTML = '<span class="good">通过</span>'; logAiAction('提示词在线调试', p.title + ' / ' + primary.name); }, 900);
}

function runEvaluation() {
  showToast('全量评测任务已创建，覆盖 8 个场景'); document.getElementById('passedCount').textContent = '评测中…';
  setTimeout(function () { document.getElementById('passedCount').textContent = '7 / 8'; logAiAction('运行全量效果评测', '7 个场景通过；低置信度异常识别待优化'); showToast('评测完成：7 个场景通过，1 个待优化'); }, 1500);
}
function currentScenePrompt() { return promptConfigs[document.getElementById('failoverScene').selectedIndex] || promptConfigs[0]; }
function loadFailoverRoute() {
  var p = currentScenePrompt(); if (!p) return; var route = routeForPrompt(p), primary = modelById(route.primary), backup = modelById(route.backup), policy = aiState.failover[p.id] || { mode: '按错误码 + 超时 + 熔断自动切换', timeout: 60, breaker: 5, cooldown: 120 };
  document.getElementById('flowPrimary').textContent = primary ? primary.name : '未配置'; document.getElementById('flowBackup').textContent = backup ? backup.name : '未配置';
  document.getElementById('flowPrimaryState').textContent = primary && providerReady(primary.providerId) ? '健康 · 厂商连接正常' : '待厂商连接测试'; document.getElementById('flowBackupState').textContent = backup && providerReady(backup.providerId) ? '待命 · 厂商连接正常' : '待配置/连接';
  document.getElementById('failoverMode').value = policy.mode; document.getElementById('failoverTimeout').value = policy.timeout; document.getElementById('breakerCount').value = policy.breaker; document.getElementById('cooldownSeconds').value = policy.cooldown;
}
function syncFlow() { loadFailoverRoute(); }
function saveFailoverPolicy() {
  var p = currentScenePrompt(); aiState.failover[p.id] = { mode: document.getElementById('failoverMode').value, timeout: Number(document.getElementById('failoverTimeout').value), breaker: Number(document.getElementById('breakerCount').value), cooldown: Number(document.getElementById('cooldownSeconds').value) };
  logAiAction('保存容灾策略', p.title + '；超时 ' + aiState.failover[p.id].timeout + ' 秒；连续失败 ' + aiState.failover[p.id].breaker + ' 次熔断'); showToast('当前场景容灾策略已保存');
}
function simulateFailover() {
  var p = currentScenePrompt(), route = routeForPrompt(p), primary = modelById(route.primary), backup = modelById(route.backup), log = document.getElementById('failoverLog');
  if (!primary || !backup || primary.id === backup.id) { showToast('请先为当前场景配置不同的主 AI 和次选 AI'); return; }
  var requestId = 'DRILL-' + Date.now(); log.textContent = '[10:00:00] 场景：' + p.title + '\n[10:00:00] 发送演练请求 → ' + primary.name;
  setTimeout(function () { log.innerHTML += '\n<span class="fail">[10:00:01] 主模型返回 503 Service Unavailable</span>\n[10:00:01] 命中容灾规则：503；request_id=' + requestId + '\n[10:00:01] 切换次选模型 → ' + escapeHtml(backup.name); }, 550);
  setTimeout(function () { log.innerHTML += '\n<span class="ok">[10:00:03] 次选模型响应成功，Schema 校验通过</span>\n[10:00:03] 演练结束：未写入真实业务，告警与切换事件已记录'; logAiAction('主备切换演练', p.title + '；' + primary.name + ' → ' + backup.name + '；503；' + requestId); showToast('容灾演练成功，主备切换耗时 2.1 秒'); }, 1250);
}

function renderAudit() {
  var list = document.getElementById('auditList'); if (!list) return;
  list.innerHTML = aiState.audit.map(function (x) { return '<div class="audit-item"><b>' + escapeHtml(x.action) + '</b><div>' + escapeHtml(x.detail) + '</div><div class="subtle">' + escapeHtml(x.time) + ' · 演示管理员</div></div>'; }).join('') || '<div class="empty-note">暂无变更记录</div>';
}
function toggleAudit(show) { document.getElementById('auditDrawer').classList.toggle('show', !!show); renderAudit(); }
function saveAll() {
  document.querySelectorAll('.thinking-default').forEach(function (s) { aiState.thinkingDefaults[s.dataset.key] = s.value; });
  saveAiState(); logAiAction('保存全部 AI 配置', '厂商、模型、请求参数、思考模式、提示词与主备路由已写入原型本地配置'); showToast('全部配置已保存并写入变更记录');
}

function initializeAiManagement() {
  initializeAiTabs();
  initializeAiDialogs();
  restorePromptOverrides();
  document.getElementById('newProviderEndpoint').addEventListener('input', updateResolvedProviderUrl);
  document.querySelectorAll('.thinking-default').forEach(function (s) { if (aiState.thinkingDefaults[s.dataset.key]) s.value = aiState.thinkingDefaults[s.dataset.key]; });
  renderProviders(); renderModels(); populateAllModelSelectors(); renderPrompts(); renderEval(); renderAudit(); loadParamProfile(); loadFailoverRoute();
}
initializeAiManagement();
