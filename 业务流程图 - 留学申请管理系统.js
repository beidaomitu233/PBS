(function () {
  'use strict';

  var flowViews = [
    {
      id: 'main', group: '业务全景', label: '主业务流程', description: '申请服务与选校咨询两类订单的完整链路', meta: '业务全景',
      lanes: [
        { title: '申请服务订单', note: '先付款，后服务', steps: [
          ['订单创建', '线上同步或线下录入'], ['项目分配', '机构管理员分配 PM'], ['档案与选校', '补充档案并确认目标'], ['文书交付', '撰写、审核与定稿'], ['网申提交', '扫描、填报与官网提交'], ['录取跟进', '监控邮箱与官网'], ['阶段反馈', '同步进展与结果'], ['结项归档', '完成交付并归档', 'done']
        ] },
        { title: '选校咨询订单', note: '独立交付流程', steps: [
          ['订单创建', '线上同步或线下录入'], ['任务分配', '销售管理员分配顾问'], ['方案制作', '筛选院校与专业'], ['客户确认', 'H5 查看并确认', 'decision'], ['结单或导入', '结单或导入申请项目', 'done']
        ] }
      ]
    },
    {
      id: 'platform', group: '角色流程', label: '平台超级管理员', description: '平台级机构、权限与 AI 配置流程', meta: '平台管理',
      steps: [['机构管理', '维护租户信息'], ['用户与角色', '配置账号及权限'], ['AI 配置', '维护模型与提示词'], ['效果评测', '通过后发布', 'decision'], ['操作审计', '查看关键操作记录', 'done']],
      responsibilities: [['管理范围', '全部 SaaS 租户'], ['关键控制', '权限、AI 发布与审计']],
      links: [['用户管理', '用户管理 - 留学申请管理系统.html'], ['角色权限管理', '角色权限管理 - 留学申请管理系统.html'], ['AI 管理', 'AI管理 - 留学申请管理系统.html'], ['操作日志审计', '操作日志审计 - 留学申请管理系统.html']]
    },
    {
      id: 'org-admin', group: '角色流程', label: '机构管理员', description: '项目分配、人员配置与申请项目监控', meta: '本租户数据',
      steps: [['接收订单', '查看待分配项目'], ['分配项目', '指定项目经理'], ['配置人员', '维护人员业务属性'], ['设置支付节点', '控制阶段启动'], ['项目监控', '查看进度与风险'], ['完成归档', '确认项目结项', 'done']],
      responsibilities: [['管理范围', '本机构项目与人员'], ['关键控制', '分配、支付节点、进度']],
      links: [['项目池列表', '项目池列表页 - 留学申请管理系统.html'], ['PMO 看板', 'PMO看板 - 留学申请管理系统.html'], ['人员管理', '人员管理 - PBS留学CRM系统.html']]
    },
    {
      id: 'sales-admin', group: '角色流程', label: '销售人员管理员', description: '选校订单分配与销售进度监控', meta: '选校管理',
      steps: [['查看订单池', '筛选待分配订单'], ['分配销售', '指定选校顾问'], ['跟踪任务', '查看方案进度'], ['处理异常', '更换人员或调整 DDL'], ['确认结单', '核对客户确认结果', 'done']],
      responsibilities: [['管理范围', '本机构选校订单'], ['关键控制', '分配与进度监控']],
      links: [['选校订单池', '选校订单池页 - 留学申请管理系统.html'], ['选校方案详情', '选校方案详情页 - 留学申请管理系统.html']]
    },
    {
      id: 'sales', group: '角色流程', label: '销售人员', description: '选校任务接收、方案制作与客户确认', meta: '选校交付',
      steps: [['接收任务', '确认学生与订单'], ['分析档案', '明确申请方向'], ['制作方案', '筛选院校与专业'], ['分享客户', '发送 H5 方案'], ['客户确认', '记录确认结果', 'decision'], ['结单或导入', '结束咨询或转申请项目', 'done']],
      responsibilities: [['交付物', '选校方案'], ['关键节点', '客户确认']],
      links: [['选校任务列表', '选校任务列表页 - 留学申请管理系统.html'], ['选校工作台', '选校工作台页 - 留学申请管理系统.html']]
    },
    {
      id: 'pm', group: '角色流程', label: '项目经理', description: '申请服务项目从接收到结项的主流程', meta: '申请服务主流程',
      steps: [['接收项目', '核对订单与付款'], ['补充档案', '完善学生信息'], ['确认院校目标', '建立交付计划'], ['分发任务', '文书、网申与材料'], ['阶段反馈', '同步进度与结果'], ['监控申请', '邮箱与官网状态'], ['结项归档', '确认交付完成', 'done']],
      responsibilities: [['管理范围', '本人负责项目'], ['关键控制', '任务 DDL、阶段反馈、结项']],
      links: [['我的项目', '我的项目列表页 - 留学申请管理系统.html'], ['监控任务', '监控任务列表 - PBS留学CRM.html'], ['结项归档', '结项归档列表 - PBS留学CRM系统.html']]
    },
    {
      id: 'writer', group: '角色流程', label: '文书交付人员', description: '文书任务接收、撰写与审核闭环', meta: '文书交付',
      steps: [['接收任务', '查看文书类型与 DDL'], ['准备素材', '核对档案与要求'], ['撰写文书', '在线编辑并保存版本'], ['提交审核', '进入审核队列'], ['处理结果', '通过或按意见修改', 'decision'], ['交付定稿', '完成当前文书任务', 'done']],
      responsibilities: [['交付物', 'CV、PS、推荐信、研究计划'], ['关键控制', '版本与审核状态']],
      links: [['文书任务列表', '任务列表页 - 文书交付系统.html'], ['文书编辑器', '文书编辑器 - 文书交付系统.html']]
    },
    {
      id: 'reviewer', group: '角色流程', label: '文书审核人员', description: '审核任务接收、审核与退回修改', meta: '文书审核',
      steps: [['接收审核', '查看待审核文书'], ['阅读全文', '核对要求与内容'], ['给出意见', '批注并形成结论'], ['审核判断', '通过或驳回', 'decision'], ['完成审核', '更新任务状态', 'done']],
      responsibilities: [['审核依据', '题目要求与内部标准'], ['关键控制', '通过或驳回']],
      links: [['审核任务列表', '文书审核列表页 - 留学申请管理系统.html'], ['审核详情', '文书审核详情页 - 留学申请管理系统.html']]
    },
    {
      id: 'application', group: '角色流程', label: '网申人员', description: '网申模板生成、填报与官网提交', meta: '网申交付',
      steps: [['接收任务', '查看账号与申请 URL'], ['插件扫描', '识别字段与材料'], ['核对模板', '修订后同步 PBS'], ['人工填报', '对照档案填写官网'], ['官网提交', '确认提交结果', 'decision'], ['更新状态', '回写 PBS 并留痕', 'done']],
      responsibilities: [['交付物', '完整网申提交'], ['关键控制', '字段核对与提交确认']],
      links: [['网申任务列表', '网申任务列表页 - 留学申请管理系统.html'], ['网申任务详情', '网申任务详情页 - 留学申请管理系统.html']]
    },
    {
      id: 'writing-admin', group: '角色流程', label: '文书机构管理员', description: '外包文书任务分配、进度跟踪与交付', meta: '文书机构视图',
      steps: [['接收外包任务', '确认任务范围'], ['分配文书人员', '匹配人员与 DDL'], ['跟踪进度', '查看撰写与审核状态'], ['处理异常', '调整人员或计划'], ['汇总交付', '确认全部文书完成', 'done']],
      responsibilities: [['管理范围', '本机构外包文书'], ['关键控制', '人员分配与交付进度']],
      links: [['文书任务列表', '任务列表页 - 文书交付系统.html'], ['模板库', '模板库列表 - 文书交付系统.html']]
    }
  ];

  var session = null;
  try { session = JSON.parse(localStorage.getItem('pbs_session_v1')); } catch (e) { session = null; }
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
  var visibleViews = allowedIds ? flowViews.filter(function (view) { return allowedIds.indexOf(view.id) >= 0; }) : flowViews;
  var activeId = 'main';
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  window.showToast = function (message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.flowToastTimer);
    window.flowToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1700);
  };

  function stepHtml(step, index) {
    return '<div class="step ' + escapeHtml(step[2] || '') + '"><div class="step-number">' + (index + 1) + '</div><h4>' + escapeHtml(step[0]) + '</h4><p>' + escapeHtml(step[1]) + '</p></div>';
  }

  function renderNavigation() {
    var html = '';
    var currentGroup = '';
    visibleViews.forEach(function (view) {
      if (view.group !== currentGroup) { currentGroup = view.group; html += '<div class="view-group">' + escapeHtml(currentGroup) + '</div>'; }
      html += '<button class="view-btn ' + (view.id === activeId ? 'active' : '') + '" data-view="' + escapeHtml(view.id) + '">' + escapeHtml(view.label) + '</button>';
    });
    byId('viewList').innerHTML = html;
  }

  function renderMain(view) {
    return view.lanes.map(function (lane) {
      return '<section class="lane"><div class="lane-title"><h3>' + escapeHtml(lane.title) + '</h3><span>' + escapeHtml(lane.note) + '</span></div><div class="steps">' + lane.steps.map(stepHtml).join('') + '</div></section>';
    }).join('');
  }

  function renderRole(view) {
    var responsibilities = view.responsibilities.map(function (item) { return '<div class="info-row"><b>' + escapeHtml(item[0]) + '</b><span>' + escapeHtml(item[1]) + '</span></div>'; }).join('');
    var links = view.links.map(function (item) { return '<a class="page-link" href="' + encodeURI(item[1]) + '">' + escapeHtml(item[0]) + '</a>'; }).join('');
    return '<div class="role-flow"><div class="role-main"><div class="steps">' + view.steps.map(stepHtml).join('') + '</div><div class="hint">流程仅展示该角色的关键动作；跨角色协作会在对应任务状态变化后自动衔接。</div></div><aside class="side-info"><div class="info-card"><h3>角色边界</h3>' + responsibilities + '</div><div class="info-card"><h3>关联页面</h3>' + links + '</div></aside></div>';
  }

  function renderView(id) {
    var view = visibleViews.find(function (item) { return item.id === id; }) || visibleViews[0];
    activeId = view.id;
    byId('flowTitle').textContent = view.label;
    byId('flowDescription').textContent = view.description;
    byId('flowMeta').textContent = view.meta;
    byId('flowBody').innerHTML = view.lanes ? renderMain(view) : renderRole(view);
    renderNavigation();
  }

  byId('viewList').addEventListener('click', function (event) {
    var button = event.target.closest('[data-view]');
    if (button) renderView(button.dataset.view);
  });

  renderView('main');
})();
