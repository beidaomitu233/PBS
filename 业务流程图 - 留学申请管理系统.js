(function () {
  'use strict';

  var STORE_KEY = 'pbs_business_flow_v2';
  var PAGE_OPTIONS = [
    ['管理员工作台', '管理员工作台 - 留学申请管理系统.html'],
    ['项目池列表', '项目池列表页 - 留学申请管理系统.html'],
    ['PMO 看板', 'PMO看板 - 留学申请管理系统.html'],
    ['人员管理', '人员管理 - PBS留学CRM系统.html'],
    ['用户管理', '用户管理 - 留学申请管理系统.html'],
    ['角色权限管理', '角色权限管理 - 留学申请管理系统.html'],
    ['操作日志审计', '操作日志审计 - 留学申请管理系统.html'],
    ['AI 管理', 'AI管理 - 留学申请管理系统.html'],
    ['学生档案列表', '学生档案列表页 - 留学申请管理系统.html'],
    ['学生档案详情', '学生档案详情页 - 留学申请管理系统.html'],
    ['我的项目列表', '我的项目列表页 - 留学申请管理系统.html'],
    ['我的项目详情', '我的项目详情页 - 留学申请管理系统.html'],
    ['项目详情', '项目详情页 - 留学申请管理系统.html'],
    ['院校目标详情', '院校目标详情页 - 留学申请管理系统.html'],
    ['文书任务列表', '任务列表页 - 文书交付系统.html'],
    ['文书编辑器', '文书编辑器 - 文书交付系统.html'],
    ['模板库', '模板库列表 - 文书交付系统.html'],
    ['文书审核列表', '文书审核列表页 - 留学申请管理系统.html'],
    ['文书审核详情', '文书审核详情页 - 留学申请管理系统.html'],
    ['网申任务列表', '网申任务列表页 - 留学申请管理系统.html'],
    ['网申任务详情', '网申任务详情页 - 留学申请管理系统.html'],
    ['监控任务列表', '监控任务列表 - PBS留学CRM.html'],
    ['结项归档列表', '结项归档列表 - PBS留学CRM系统.html'],
    ['结项详情', '结项详情页 - 留学申请管理系统.html'],
    ['选校订单池', '选校订单池页 - 留学申请管理系统.html'],
    ['选校任务列表', '选校任务列表页 - 留学申请管理系统.html'],
    ['选校工作台', '选校工作台页 - 留学申请管理系统.html'],
    ['选校方案详情', '选校方案详情页 - 留学申请管理系统.html']
  ];

  var defaultViews = [
    {
      id: 'main', label: '主业务流程', description: '申请服务与选校咨询两类订单的完整链路',
      lanes: [
        { title: '申请服务订单', note: '先付款，后服务', steps: [
          { title: '订单创建', note: '线上同步或线下录入', page: '项目池列表页 - 留学申请管理系统.html' },
          { title: '项目分配', note: '机构管理员分配 PM', page: '项目池列表页 - 留学申请管理系统.html' },
          { title: '档案与选校', note: '补充档案并确认目标', page: '学生档案详情页 - 留学申请管理系统.html' },
          { title: '文书交付', note: '撰写、审核与定稿', page: '任务列表页 - 文书交付系统.html' },
          { title: '网申提交', note: '扫描、填报与官网提交', page: '网申任务列表页 - 留学申请管理系统.html' },
          { title: '录取跟进', note: '监控邮箱与官网', page: '监控任务列表 - PBS留学CRM.html' },
          { title: '阶段反馈', note: '同步进展与结果', page: '我的项目详情页 - 留学申请管理系统.html' },
          { title: '结项归档', note: '完成交付并归档', page: '结项归档列表 - PBS留学CRM系统.html', type: 'done' }
        ]},
        { title: '选校咨询订单', note: '独立交付流程', steps: [
          { title: '订单创建', note: '线上同步或线下录入', page: '选校任务列表页 - 留学申请管理系统.html' },
          { title: '任务分配', note: '销售管理员分配顾问', page: '选校订单池页 - 留学申请管理系统.html' },
          { title: '方案制作', note: '筛选院校与专业', page: '选校工作台页 - 留学申请管理系统.html' },
          { title: '客户确认', note: 'H5 查看并确认', page: '选校方案详情页 - 留学申请管理系统.html', type: 'decision' },
          { title: '结单或导入', note: '结单或导入申请项目', page: '选校方案详情页 - 留学申请管理系统.html', type: 'done' }
        ]}
      ]
    },
    {
      id: 'platform', label: '平台超级管理员', description: '平台级机构、权限与 AI 配置流程',
      lanes: [{ title: '', note: '', steps: [
        { title: '机构与用户', note: '维护租户和平台账号', page: '用户管理 - 留学申请管理系统.html' },
        { title: '角色权限', note: '配置功能和数据权限', page: '角色权限管理 - 留学申请管理系统.html' },
        { title: 'AI 配置', note: '维护模型、参数和提示词', page: 'AI管理 - 留学申请管理系统.html' },
        { title: '效果评测', note: '通过门槛后发布', page: 'AI管理 - 留学申请管理系统.html', type: 'decision' },
        { title: '操作审计', note: '追踪平台关键操作', page: '操作日志审计 - 留学申请管理系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'org-admin', label: '机构管理员', description: '项目分配、人员配置与申请项目监控',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收订单', note: '查看待分配项目', page: '项目池列表页 - 留学申请管理系统.html' },
        { title: '分配项目', note: '指定项目经理', page: '项目池列表页 - 留学申请管理系统.html' },
        { title: '配置人员', note: '维护人员业务属性', page: '人员管理 - PBS留学CRM系统.html' },
        { title: '设置支付节点', note: '控制阶段服务启动', page: '项目详情页 - 留学申请管理系统.html' },
        { title: '项目监控', note: '查看进度与风险', page: 'PMO看板 - 留学申请管理系统.html' },
        { title: '完成归档', note: '确认项目结项', page: '结项归档列表 - PBS留学CRM系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'sales-admin', label: '销售人员管理员', description: '选校订单分配与销售进度监控',
      lanes: [{ title: '', note: '', steps: [
        { title: '查看订单池', note: '筛选待跟进订单', page: '选校订单池页 - 留学申请管理系统.html' },
        { title: '分配销售', note: '指定选校顾问', page: '选校订单池页 - 留学申请管理系统.html' },
        { title: '跟踪任务', note: '查看方案进度', page: '选校任务列表页 - 留学申请管理系统.html' },
        { title: '处理异常', note: '调整人员或 DDL', page: '选校任务列表页 - 留学申请管理系统.html', type: 'decision' },
        { title: '确认结单', note: '核对客户确认结果', page: '选校方案详情页 - 留学申请管理系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'sales', label: '销售人员', description: '选校任务接收、方案制作与客户确认',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收任务', note: '确认学生与订单', page: '选校任务列表页 - 留学申请管理系统.html' },
        { title: '分析档案', note: '明确申请方向', page: '学生档案详情页 - 留学申请管理系统.html' },
        { title: '制作方案', note: '筛选院校与专业', page: '选校工作台页 - 留学申请管理系统.html' },
        { title: '分享客户', note: '发送 H5 方案', page: '选校方案详情页 - 留学申请管理系统.html' },
        { title: '客户确认', note: '记录确认结果', page: '选校方案详情页 - 留学申请管理系统.html', type: 'decision' },
        { title: '结单或导入', note: '结束咨询或转申请项目', page: '选校方案详情页 - 留学申请管理系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'pm', label: '项目经理', description: '申请服务项目从接收到结项的主流程',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收项目', note: '核对订单与付款', page: '我的项目列表页 - 留学申请管理系统.html' },
        { title: '补充档案', note: '完善学生信息', page: '学生档案详情页 - 留学申请管理系统.html' },
        { title: '确认院校目标', note: '建立交付计划', page: '院校目标详情页 - 留学申请管理系统.html' },
        { title: '分发任务', note: '文书、网申与审核', page: '院校目标详情页 - 留学申请管理系统.html' },
        { title: '阶段反馈', note: '同步进度与结果', page: '我的项目详情页 - 留学申请管理系统.html' },
        { title: '监控申请', note: '邮箱与官网状态', page: '监控任务列表 - PBS留学CRM.html' },
        { title: '结项归档', note: '确认交付完成', page: '结项归档列表 - PBS留学CRM系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'writer', label: '文书交付人员', description: '文书任务接收、撰写与审核闭环',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收任务', note: '查看文书类型与 DDL', page: '任务列表页 - 文书交付系统.html' },
        { title: '准备素材', note: '核对档案与要求', page: '学生档案详情页 - 留学申请管理系统.html' },
        { title: '撰写文书', note: '在线编辑并保存版本', page: '文书编辑器 - 文书交付系统.html' },
        { title: '提交审核', note: '进入审核队列', page: '文书编辑器 - 文书交付系统.html' },
        { title: '处理结果', note: '通过或按意见修改', page: '文书编辑器 - 文书交付系统.html', type: 'decision' },
        { title: '交付定稿', note: '完成当前文书任务', page: '任务列表页 - 文书交付系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'reviewer', label: '文书审核人员', description: '审核任务接收、审核与退回修改',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收审核', note: '查看待审核文书', page: '文书审核列表页 - 留学申请管理系统.html' },
        { title: '阅读全文', note: '核对要求与内容', page: '文书审核详情页 - 留学申请管理系统.html' },
        { title: '给出意见', note: '批注并形成结论', page: '文书审核详情页 - 留学申请管理系统.html' },
        { title: '审核判断', note: '通过或驳回', page: '文书审核详情页 - 留学申请管理系统.html', type: 'decision' },
        { title: '完成审核', note: '更新任务状态', page: '文书审核列表页 - 留学申请管理系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'application', label: '网申人员', description: '网申模板生成、填报与官网提交',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收任务', note: '查看账号与申请 URL', page: '网申任务列表页 - 留学申请管理系统.html' },
        { title: '插件扫描', note: '识别字段与材料', page: '网申任务详情页 - 留学申请管理系统.html' },
        { title: '核对模板', note: '修订后同步 PBS', page: '网申任务详情页 - 留学申请管理系统.html' },
        { title: '人工填报', note: '对照档案填写官网', page: '网申任务详情页 - 留学申请管理系统.html' },
        { title: '官网提交', note: '确认提交结果', page: '网申任务详情页 - 留学申请管理系统.html', type: 'decision' },
        { title: '更新状态', note: '回写 PBS 并留痕', page: '网申任务列表页 - 留学申请管理系统.html', type: 'done' }
      ]}]
    },
    {
      id: 'writing-admin', label: '文书机构管理员', description: '外包文书任务分配、进度跟踪与交付',
      lanes: [{ title: '', note: '', steps: [
        { title: '接收外包任务', note: '确认任务范围', page: '任务列表页 - 文书交付系统.html' },
        { title: '分配文书人员', note: '匹配人员与 DDL', page: '任务列表页 - 文书交付系统.html' },
        { title: '跟踪进度', note: '查看撰写与审核状态', page: '任务列表页 - 文书交付系统.html' },
        { title: '处理异常', note: '调整人员或计划', page: '任务列表页 - 文书交付系统.html', type: 'decision' },
        { title: '汇总交付', note: '确认全部文书完成', page: '任务列表页 - 文书交付系统.html', type: 'done' }
      ]}]
    }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]; }); }
  function loadViews() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (Array.isArray(saved) && saved.length === defaultViews.length) return saved;
    } catch (e) {}
    return clone(defaultViews);
  }

  var views = loadViews();
  var session = null;
  try { session = JSON.parse(localStorage.getItem('pbs_session_v1')); } catch (e) { session = null; }
  var canEdit = !session || ['超级管理员', '平台运维人员', '平台运营人员'].indexOf(session.role) >= 0;
  var roleViews = {
    '机构管理员': ['main', 'org-admin', 'sales-admin', 'sales', 'pm', 'writer', 'reviewer', 'application', 'writing-admin'],
    '销售人员管理员': ['main', 'sales-admin', 'sales'],
    '销售人员': ['main', 'sales'],
    '项目经理': ['main', 'pm'],
    '文书人员': ['main', 'writer'],
    '文书审核': ['main', 'reviewer'],
    '网申人员': ['main', 'application'],
    '文书机构管理员': ['main', 'writing-admin', 'writer', 'reviewer']
  };
  var allowedIds = session && roleViews[session.role] ? roleViews[session.role] : null;
  var activeId = 'main';
  var editorDraft = null;

  function visibleViews() { return allowedIds ? views.filter(function (view) { return allowedIds.indexOf(view.id) >= 0; }) : views; }
  function currentView() { return views.find(function (view) { return view.id === activeId; }) || views[0]; }

  window.showToast = function (message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.flowToastTimer);
    window.flowToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1700);
  };

  function renderTabs() {
    byId('viewTabs').innerHTML = visibleViews().map(function (view) {
      var active = view.id === activeId;
      return '<button class="flow-tab ' + (active ? 'active' : '') + '" role="tab" aria-selected="' + active + '" tabindex="' + (active ? '0' : '-1') + '" data-view="' + escapeHtml(view.id) + '">' + escapeHtml(view.label) + '</button>';
    }).join('');
  }

  function stepHtml(step, index) {
    return '<a class="step ' + escapeHtml(step.type || '') + '" href="' + encodeURI(step.page) + '" aria-label="进入' + escapeHtml(step.title) + '对应页面">' +
      '<div class="step-number">' + (index + 1) + '</div><h4>' + escapeHtml(step.title) + '</h4><p>' + escapeHtml(step.note) + '</p><span class="step-link">进入页面 →</span></a>';
  }

  function renderFlow(view) {
    return view.lanes.map(function (lane) {
      var single = view.lanes.length === 1;
      var header = single ? '' : '<div class="lane-title"><h3>' + escapeHtml(lane.title) + '</h3><span>' + escapeHtml(lane.note) + '</span></div>';
      return '<section class="lane ' + (single ? 'single' : '') + '">' + header + '<div class="steps">' + lane.steps.map(stepHtml).join('') + '</div></section>';
    }).join('');
  }

  function renderView(id) {
    var view = visibleViews().find(function (item) { return item.id === id; }) || visibleViews()[0];
    activeId = view.id;
    byId('flowTitle').textContent = view.label;
    byId('flowDescription').textContent = view.description;
    byId('flowBody').innerHTML = renderFlow(view);
    byId('editFlowButton').classList.toggle('hidden', !canEdit);
    renderTabs();
  }

  function pageOptions(selected) {
    return PAGE_OPTIONS.map(function (item) { return '<option value="' + escapeHtml(item[1]) + '"' + (item[1] === selected ? ' selected' : '') + '>' + escapeHtml(item[0]) + '</option>'; }).join('');
  }

  function typeOptions(selected) {
    return [['', '普通'], ['decision', '判断'], ['done', '完成']].map(function (item) { return '<option value="' + item[0] + '"' + (item[0] === (selected || '') ? ' selected' : '') + '>' + item[1] + '</option>'; }).join('');
  }

  function renderEditor() {
    byId('editorLanes').innerHTML = editorDraft.lanes.map(function (lane, laneIndex) {
      var rows = lane.steps.map(function (step, stepIndex) {
        return '<div class="editor-row" data-lane="' + laneIndex + '" data-step="' + stepIndex + '">' +
          '<div class="row-index">' + (stepIndex + 1) + '</div>' +
          '<input class="input title-input" value="' + escapeHtml(step.title) + '" aria-label="卡片标题">' +
          '<input class="input note-input" value="' + escapeHtml(step.note) + '" aria-label="卡片说明">' +
          '<select class="select page-select" aria-label="跳转页面">' + pageOptions(step.page) + '</select>' +
          '<select class="select type-select" aria-label="节点类型">' + typeOptions(step.type) + '</select>' +
          '<div class="row-controls"><button onclick="moveEditorStep(' + laneIndex + ',' + stepIndex + ',-1)" aria-label="上移">↑</button><button onclick="moveEditorStep(' + laneIndex + ',' + stepIndex + ',1)" aria-label="下移">↓</button><button class="remove" onclick="removeEditorStep(' + laneIndex + ',' + stepIndex + ')" aria-label="删除">×</button></div>' +
          '</div>';
      }).join('');
      return '<section class="editor-lane"><div class="editor-lane-head"><h4>' + escapeHtml(lane.title || editorDraft.label) + '</h4><button class="btn sm" onclick="addEditorStep(' + laneIndex + ')">添加卡片</button></div><div class="editor-rows">' + rows + '</div></section>';
    }).join('');
  }

  function syncEditorInputs() {
    byId('editorLanes').querySelectorAll('.editor-row').forEach(function (row) {
      var laneIndex = Number(row.dataset.lane);
      var stepIndex = Number(row.dataset.step);
      var step = editorDraft.lanes[laneIndex].steps[stepIndex];
      if (!step) return;
      step.title = row.querySelector('.title-input').value.trim();
      step.note = row.querySelector('.note-input').value.trim();
      step.page = row.querySelector('.page-select').value;
      step.type = row.querySelector('.type-select').value;
    });
  }

  window.openFlowEditor = function () {
    if (!canEdit) return;
    editorDraft = clone(currentView());
    byId('flowEditorTitle').textContent = '编辑流程卡片 · ' + editorDraft.label;
    renderEditor();
    byId('flowEditorModal').classList.add('show');
  };

  window.closeFlowEditor = function () { byId('flowEditorModal').classList.remove('show'); editorDraft = null; };
  window.addEditorStep = function (laneIndex) {
    syncEditorInputs();
    editorDraft.lanes[laneIndex].steps.push({ title: '新流程卡片', note: '填写步骤说明', page: PAGE_OPTIONS[0][1], type: '' });
    renderEditor();
  };
  window.removeEditorStep = function (laneIndex, stepIndex) {
    syncEditorInputs();
    if (editorDraft.lanes[laneIndex].steps.length <= 1) { showToast('每个流程至少保留一张卡片'); return; }
    editorDraft.lanes[laneIndex].steps.splice(stepIndex, 1);
    renderEditor();
  };
  window.moveEditorStep = function (laneIndex, stepIndex, offset) {
    syncEditorInputs();
    var steps = editorDraft.lanes[laneIndex].steps;
    var target = stepIndex + offset;
    if (target < 0 || target >= steps.length) return;
    var moved = steps.splice(stepIndex, 1)[0];
    steps.splice(target, 0, moved);
    renderEditor();
  };

  window.saveFlowEditor = function () {
    syncEditorInputs();
    var invalid = editorDraft.lanes.some(function (lane) { return lane.steps.some(function (step) { return !step.title || !step.note || !step.page; }); });
    if (invalid) { showToast('请完整填写卡片标题、说明和跳转页面'); return; }
    var index = views.findIndex(function (view) { return view.id === editorDraft.id; });
    views[index] = clone(editorDraft);
    localStorage.setItem(STORE_KEY, JSON.stringify(views));
    closeFlowEditor();
    renderView(activeId);
    showToast('流程卡片已保存');
  };

  window.resetCurrentFlow = function () {
    var original = defaultViews.find(function (view) { return view.id === activeId; });
    if (!original) return;
    var index = views.findIndex(function (view) { return view.id === activeId; });
    views[index] = clone(original);
    localStorage.setItem(STORE_KEY, JSON.stringify(views));
    editorDraft = clone(original);
    renderView(activeId);
    renderEditor();
    showToast('已恢复当前流程默认卡片');
  };

  byId('viewTabs').addEventListener('click', function (event) {
    var button = event.target.closest('[data-view]');
    if (button) renderView(button.dataset.view);
  });
  byId('viewTabs').addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var tabs = Array.from(byId('viewTabs').querySelectorAll('[data-view]'));
    var current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    var next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    renderView(tabs[next].dataset.view);
  });
  byId('flowEditorModal').addEventListener('click', function (event) { if (event.target === byId('flowEditorModal')) closeFlowEditor(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && byId('flowEditorModal').classList.contains('show')) closeFlowEditor(); });

  renderView('main');
})();
