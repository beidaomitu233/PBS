/* ============================================================
   PBS留学CRM系统 - 全站共享脚本
   会话管理 / RBAC角色权限 / 动态侧边栏 / 顶栏用户区 / 弹层组件
   ============================================================ */
(function () {
  'use strict';

  var SESSION_KEY = 'pbs_session_v1';
  var PREVIEW_ROLE_KEY = 'pbs_role_preview_v51';

  /* ---------------- 角色定义 ---------------- */
  var ROLES = ['超级管理员', '平台运维人员', '机构管理员', '销售人员', '项目经理',
    '文书人员', '网申人员', '文书审核', '文书机构管理员'];

  /* 权限继承：PM覆盖项目交付团队；机构管理员在自身权限外继承PM全部权限；文书机构管理员继承文书交付与审核团队 */
  var ROLE_INHERITANCE = {
    '项目经理': ['文书人员', '网申人员', '文书审核'],
    '机构管理员': ['项目经理', '文书人员', '网申人员', '文书审核'],
    '文书机构管理员': ['文书人员', '文书审核']
  };
  function roleCanAccess(role, allowedRoles) {
    if (role === '超级管理员') return true;
    if (!allowedRoles || !allowedRoles.length) return false;
    var capabilities = [role].concat(ROLE_INHERITANCE[role] || []);
    return capabilities.some(function (capability) { return allowedRoles.indexOf(capability) >= 0; });
  }

  /* 用户真实角色列表（登录写入 session.roles；超级管理员拥有全部角色视角） */
  function getUserRoles(session) {
    var roles = [];
    if (session && session.roles && session.roles.length) roles = session.roles.slice();
    else if (session && session.role) roles = [session.role];
    if (roles.indexOf('超级管理员') >= 0) return ROLES.slice();
    return roles;
  }
  /* 角色继承展开：机构管理员/项目经理可同时看到被继承角色的工作台 */
  function expandRoles(roles) {
    var out = [];
    (roles || []).forEach(function (r) {
      if (!r || out.indexOf(r) >= 0) return;
      out.push(r);
      (ROLE_INHERITANCE[r] || []).forEach(function (sub) { if (out.indexOf(sub) < 0) out.push(sub); });
    });
    return out;
  }

  var ROLE_WORKBENCH = {
    '超级管理员': '管理员工作台 - 留学申请管理系统.html',
    '平台运维人员': '平台运维工作台 - PBS留学CRM系统.html',
    '机构管理员': '机构管理员工作台 - 留学申请管理系统.html',
    '销售人员': '选校任务列表页 - 留学申请管理系统.html?view=workbench',
    '项目经理': '项目经理工作台 - 留学申请管理系统.html',
    '文书人员': '任务列表页 - 文书交付系统.html?view=workbench',
    '网申人员': '网申任务列表页 - 留学申请管理系统.html?view=workbench',
    '文书审核': '文书审核列表页 - 留学申请管理系统.html?view=workbench',
    '文书机构管理员': '任务列表页 - 文书交付系统.html?view=workbench'
  };

  /* 每一种工作台都是独立权限；同一角色可按需获得多个工作台视角。 */
  var WORKBENCH_ROLE_PERMISSION = {
    '平台运维人员': 'workbench_platform',
    '机构管理员': 'workbench_org_admin',
    '销售人员': 'workbench_sales',
    '项目经理': 'workbench_pm',
    '文书人员': 'workbench_writer',
    '网申人员': 'workbench_apply',
    '文书审核': 'workbench_audit',
    '文书机构管理员': 'workbench_docadmin'
  };
  var WORKBENCH_KEY_PERMISSION = {
    pm: 'workbench_pm', writer: 'workbench_writer',
    sales: 'workbench_sales', apply: 'workbench_apply', audit: 'workbench_audit',
    platform: 'workbench_platform', orgadmin: 'workbench_org_admin',
    docadmin: 'workbench_docadmin'
  };

  /* 组件页（弹窗/抽屉，用于iframe弹层，不做权限校验与侧边栏渲染） */
  var COMPONENT_PAGES = ['新增用户弹窗.html', '新增人员弹窗.html', '新增角色弹窗.html',
    '系统消息弹窗.html', '用户菜单弹窗.html', '分发台抽屉.html', '更换台抽屉.html',
    '分配PM抽屉.html', '更换PM抽屉.html'];

  /* ---------------- 图标库 ---------------- */
  var ICONS = {
    home: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10',
    users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    globe: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ai: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    idcard: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2'
  };

  function svgIcon(path, cls) {
    return '<svg class="' + cls + '" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + path + '"></path></svg>';
  }

  /* ---------------- 菜单定义（RBAC） ---------------- */
  var MENUS = [
    { key: 'workbench', label: '工作台首页', icon: 'home', roles: ROLES.slice(), single: true },
    { key: 'student', label: '学生档案', icon: 'idcard',
      roles: ['平台运维人员', '机构管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核'],
      children: [{ label: '学生档案列表', file: '学生档案列表页 - 留学申请管理系统.html' }] },
    { key: 'pmo', label: 'PMO监控台', icon: 'folder', roles: ['机构管理员'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html' }] },
    { key: 'project', label: '项目管理', icon: 'folder', roles: ['项目经理'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html', roles: ['机构管理员'] },
        { label: '我的项目列表', file: '我的项目列表页 - 留学申请管理系统.html' }] },
    { key: 'doc', label: '文书交付', icon: 'doc', roles: ['文书人员', '平台运维人员'],
      children: [
        { label: '任务列表', file: '任务列表页 - 文书交付系统.html', roles: ['文书人员'] },
        { label: '模板库', file: '模板库列表 - 文书交付系统.html', roles: ['文书人员', '平台运维人员'] },
        { label: '案例库', file: '案例库 - 文书交付系统.html', roles: ['文书人员', '平台运维人员'] }] },
    { key: 'apply', label: '网申管理', icon: 'globe', roles: ['网申人员', '项目经理', '平台运维人员'],
      children: [
        { label: '网申任务列表', file: '网申任务列表页 - 留学申请管理系统.html', roles: ['网申人员', '项目经理'] },
        { label: '网申模板库', file: '网申模板库 - 留学申请管理系统.html', roles: ['网申人员', '项目经理', '平台运维人员'] }
      ] },
    { key: 'monitor', label: '监控管理', icon: 'eye', roles: ['项目经理'],
      children: [{ label: '监控任务列表', file: '监控任务列表 - PBS留学CRM.html' }] },
    { key: 'archive', label: '结项归档', icon: 'archive', roles: ['项目经理', '文书人员', '网申人员'],
      children: [{ label: '结项归档列表', file: '结项归档列表 - PBS留学CRM系统.html' }] },
    { key: 'review', label: '文书审核', icon: 'shield', roles: ['文书审核'],
      children: [{ label: '文书审核列表', file: '文书审核列表页 - 留学申请管理系统.html' }] },
    { key: 'school', label: '选校管理', icon: 'map', roles: ['机构管理员', '销售人员'],
      children: [
        { label: '选校任务列表', file: '选校任务列表页 - 留学申请管理系统.html', roles: ['机构管理员', '销售人员'] },
        { label: '院校列表', file: '选校工作台页 - 留学申请管理系统.html', href: '选校工作台页 - 留学申请管理系统.html?mode=catalog', roles: ['销售人员'] }] },
    { key: 'organization', label: '机构管理', icon: 'users', roles: ['平台运维人员'], single: true, file: '机构管理 - PBS留学CRM系统.html' },
    { key: 'personnel', label: '机构成员管理', icon: 'idcard', roles: ['平台运维人员', '机构管理员', '文书机构管理员'], single: true, file: '人员管理 - PBS留学CRM系统.html' },
    { key: 'usermgmt', label: '系统管理', icon: 'users', roles: ['平台运维人员', '机构管理员', '文书机构管理员'],
      children: [
        { label: '角色权限管理', file: '角色权限管理 - 留学申请管理系统.html', roles: ['平台运维人员', '机构管理员', '文书机构管理员'] },
        { label: '操作日志审计', file: '操作日志审计 - 留学申请管理系统.html', roles: ['平台运维人员', '机构管理员', '文书机构管理员'] },
        { label: 'AI管理', file: 'AI管理 - 留学申请管理系统.html', roles: ['平台运维人员', '机构管理员', '文书机构管理员'] },
        { label: '视频管理', file: '视频管理 - 留学申请管理系统.html', roles: ['平台运维人员', '机构管理员', '文书机构管理员'] }] }
  ];

  /* ---------------- 页面级权限（RBAC） ---------------- */
  var PAGE_PERMS = {
    '管理员工作台 - 留学申请管理系统.html': ROLES.slice(),
    '平台运维工作台 - PBS留学CRM系统.html': ['平台运维人员'],
    '机构管理员工作台 - 留学申请管理系统.html': ['机构管理员'],
    '项目经理工作台 - 留学申请管理系统.html': ['项目经理'],
    '学生档案列表页 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员'],
    '学生档案详情页 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员'],
    '项目池列表页 - 留学申请管理系统.html': ['机构管理员'],
    '项目详情页 - 留学申请管理系统.html': ['机构管理员'],
    'PMO看板 - 留学申请管理系统.html': ['机构管理员'],
    '我的项目列表页 - 留学申请管理系统.html': ['项目经理'],
    '我的项目详情页 - 留学申请管理系统.html': ['项目经理'],
    '任务列表页 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '文书编辑器 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '模板库列表 - 文书交付系统.html': ['文书人员', '平台运维人员', '文书机构管理员'],
    '模板库编辑 - 文书交付系统.html': ['文书人员', '平台运维人员', '文书机构管理员'],
    '案例库 - 文书交付系统.html': ['文书人员', '平台运维人员', '文书机构管理员'],
    '网申任务列表页 - 留学申请管理系统.html': ['网申人员', '项目经理'],
    '网申任务详情页 - 留学申请管理系统.html': ['网申人员', '项目经理'],
    '网申模板库 - 留学申请管理系统.html': ['网申人员', '项目经理', '平台运维人员'],
    '网申模板编辑 - 留学申请管理系统.html': ['网申人员', '项目经理', '平台运维人员'],
    '监控任务列表 - PBS留学CRM.html': ['项目经理'],
    '监控详情页 - 留学申请管理系统.html': ['项目经理'],
    '结项归档列表 - PBS留学CRM系统.html': ['项目经理', '文书人员', '网申人员'],
    '结项详情页 - 留学申请管理系统.html': ['项目经理', '文书人员', '网申人员'],
    '用户管理 - 留学申请管理系统.html': ['平台运维人员'],
    '机构管理 - PBS留学CRM系统.html': ['平台运维人员'],
    '人员管理 - PBS留学CRM系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    '角色权限管理 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    '操作日志审计 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    'AI管理 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    '视频管理 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    '文书审核列表页 - 留学申请管理系统.html': ['文书审核', '文书机构管理员'],
    '文书审核详情页 - 留学申请管理系统.html': ['文书审核', '文书机构管理员'],
    '选校订单池页 - 留学申请管理系统.html': ['机构管理员', '销售人员'],
    '选校任务列表页 - 留学申请管理系统.html': ['机构管理员', '销售人员'],
    '选校工作台页 - 留学申请管理系统.html': ['销售人员'],
    '选校方案详情页 - 留学申请管理系统.html': ['销售人员', '机构管理员']
  };

  /* ---------------- 会话 ---------------- */
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function getPreviewRole() {
    try {
      var role = localStorage.getItem(PREVIEW_ROLE_KEY) || 'all';
      return role === 'all' || ROLES.indexOf(role) >= 0 ? role : 'all';
    } catch (e) { return 'all'; }
  }
  function withPreviewRole(session) {
    var previewRole = getPreviewRole();
    var userRoles = getUserRoles(session);
    /* 预览角色必须在用户拥有的角色范围内（超管不限）；越权预览回退为本人视角 */
    if (previewRole !== 'all' && userRoles.indexOf(previewRole) < 0) previewRole = 'all';
    var effective = {};
    Object.keys(session || {}).forEach(function (key) { effective[key] = session[key]; });
    effective.previewRole = previewRole;
    effective.userRoles = userRoles;
    if (previewRole === 'all') {
      /* 本人视角：多角色的人保留全部角色（含继承），可在工作台间切换 */
      effective.previewLabel = userRoles.length > 1 ? '全部角色' : (userRoles[0] || session.role);
      effective.role = userRoles.indexOf('超级管理员') >= 0 ? '超级管理员' : (userRoles[0] || session.role);
      effective.roles = expandRoles(userRoles);
    } else {
      /* 单角色预览：只看被切换到的角色（含其继承角色的工作台视角） */
      effective.previewLabel = previewRole;
      effective.role = previewRole;
      effective.roles = expandRoles([previewRole]);
    }
    return effective;
  }
  window.pbsGetSession = function () {
    var session = getSession();
    if (!session || !session.role) {
      session = { account: 'demo_admin', name: '演示管理员', role: '超级管理员', roles: ['超级管理员'], org: 'PBS留学', email: 'demo@pbs.local' };
    }
    return withPreviewRole(session);
  };
  window.pbsRecordOperation = function (module, type, content, result) {
    try {
      var session = window.pbsGetSession();
      var logs = JSON.parse(localStorage.getItem('pbs_operation_logs_v1') || '[]');
      if (!Array.isArray(logs)) logs = [];
      logs.unshift({
        time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        user: session.name || session.account || '当前用户',
        organization: session.org || '当前机构',
        module: module || '系统管理',
        type: type || '修改',
        content: content || '系统操作',
        ip: '当前会话',
        result: result || '成功'
      });
      localStorage.setItem('pbs_operation_logs_v1', JSON.stringify(logs.slice(0, 500)));
    } catch (e) {}
  };
  window.pbsLogout = function () {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PREVIEW_ROLE_KEY);
    location.href = '登录 - PBS留学申请管理平台.html';
  };

  function currentFile() {
    var f = location.pathname.split('/').pop() || 'index.html';
    try { f = decodeURIComponent(f); } catch (e) {}
    return f;
  }

  var FLOW_MENU_ORDER = ['pmo', 'project', 'doc', 'review', 'apply', 'monitor', 'archive', 'school', 'organization', 'personnel', 'usermgmt'];
  var NAV_ACTIVE_FILES = {
    '学生档案列表页 - 留学申请管理系统.html': ['学生档案列表页 - 留学申请管理系统.html', '学生档案详情页 - 留学申请管理系统.html'],
    '项目池列表页 - 留学申请管理系统.html': ['项目池列表页 - 留学申请管理系统.html', '项目详情页 - 留学申请管理系统.html'],
    '我的项目列表页 - 留学申请管理系统.html': ['我的项目列表页 - 留学申请管理系统.html', '我的项目详情页 - 留学申请管理系统.html'],
    '任务列表页 - 文书交付系统.html': ['任务列表页 - 文书交付系统.html', '文书编辑器 - 文书交付系统.html'],
    '模板库列表 - 文书交付系统.html': ['模板库列表 - 文书交付系统.html', '模板库编辑 - 文书交付系统.html'],
    '文书审核列表页 - 留学申请管理系统.html': ['文书审核列表页 - 留学申请管理系统.html', '文书审核详情页 - 留学申请管理系统.html'],
    '网申任务列表页 - 留学申请管理系统.html': ['网申任务列表页 - 留学申请管理系统.html', '网申任务详情页 - 留学申请管理系统.html'],
    '网申模板库 - 留学申请管理系统.html': ['网申模板库 - 留学申请管理系统.html', '网申模板编辑 - 留学申请管理系统.html'],
    '监控任务列表 - PBS留学CRM.html': ['监控任务列表 - PBS留学CRM.html', '监控详情页 - 留学申请管理系统.html'],
    '结项归档列表 - PBS留学CRM系统.html': ['结项归档列表 - PBS留学CRM系统.html', '结项详情页 - 留学申请管理系统.html'],
    '选校任务列表页 - 留学申请管理系统.html': ['选校任务列表页 - 留学申请管理系统.html', '选校方案详情页 - 留学申请管理系统.html']
  };

  function hrefFile(href) {
    return (href || '').split('?')[0];
  }

  function renderRoleNavigation(role, file, workbenchHref, showWorkbench) {
    var menuMap = {};
    MENUS.forEach(function(menu) { menuMap[menu.key] = menu; });
    var workbenchTarget = hrefFile(workbenchHref);
    var workbenchView = new URLSearchParams(location.search).get('view') === 'workbench';
    var workbenchActive = file === workbenchTarget && (workbenchHref.indexOf('?view=workbench') < 0 || workbenchView);
    var html = '<nav class="p-4 flex-1 pbs-pm-navigation">';
    if (showWorkbench !== false) {
      html += '<a href="' + encodeURI(workbenchHref) + '" class="pbs-pm-primary-link ' + (workbenchActive ? 'is-active' : '') + '">' + svgIcon(ICONS.home, 'w-5 h-5') + '<span>工作台</span></a>';
    }

    var studentMenu = menuMap.student;
    if (studentMenu && roleCanAccess(role, studentMenu.roles)) {
      var studentTarget = studentMenu.children[0].file;
      var studentActive = !workbenchView && NAV_ACTIVE_FILES[studentTarget].indexOf(file) >= 0;
      html += '<a href="' + encodeURI(studentTarget) + '" class="pbs-pm-primary-link ' + (studentActive ? 'is-active' : '') + '">' + svgIcon(ICONS.idcard, 'w-5 h-5') + '<span>学生档案</span></a>';
    }

    html += '<p class="pbs-pm-flow-caption">业务功能流程</p><div class="pbs-pm-flow">';
    var stepNumber = 0;
    FLOW_MENU_ORDER.forEach(function(key) {
      var menu = menuMap[key];
      if (!menu || !roleCanAccess(role, menu.roles)) return;
      var target = menu.file || '';
      var children = (menu.children || []).filter(function(child) {
        if (key === 'project' && child.file === '项目池列表页 - 留学申请管理系统.html') return false;
        return !child.roles || roleCanAccess(role, child.roles);
      });
      if (!menu.single && !children.length) return;

      stepNumber += 1;
      if (menu.single) {
        var singleActive = !workbenchView && file === hrefFile(target);
        html += '<div class="pbs-pm-flow-step ' + (singleActive ? 'is-active' : '') + '">' +
          '<a href="' + encodeURI(target) + '" class="pbs-pm-flow-heading"><span class="pbs-pm-flow-number">' + stepNumber + '</span><span>' + menu.label + '</span></a></div>';
        return;
      }

      var childStates = children.map(function(child) {
        var childTarget = child.href || child.file;
        var activeFiles = NAV_ACTIVE_FILES[child.file] || [child.file];
        var active = !workbenchView && activeFiles.indexOf(file) >= 0;
        if (child.href && child.href.indexOf('?mode=catalog') >= 0) {
          active = active && new URLSearchParams(location.search).get('mode') === 'catalog';
        }
        return { child: child, target: childTarget, active: active };
      });
      var groupActive = childStates.some(function(state) { return state.active; });
      html += '<div class="pbs-pm-flow-step ' + (groupActive ? 'is-active' : '') + '">' +
        '<div class="pbs-pm-flow-heading"><span class="pbs-pm-flow-number">' + stepNumber + '</span><span>' + menu.label + '</span></div>' +
        '<div class="pbs-pm-flow-children">';
      childStates.forEach(function(state) {
        html += '<a href="' + encodeURI(state.target) + '" class="pbs-pm-flow-link ' + (state.active ? 'is-active' : '') + '">' + state.child.label + '</a>';
      });
      html += '</div></div>';
    });
    return html + '</div></nav>';
  }

  function renderSidebar(session, file) {
    var aside = document.getElementById('pbs-sidebar');
    if (!aside) return;
    var role = session.role;
    var workbenchFile = ROLE_WORKBENCH[role];

    var html = renderRoleNavigation(role, file, workbenchFile, workbenchVisible(session));
    html += '<div class="p-4 border-t border-gray-100">' +
      '<div class="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">' +
      '<div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">' +
      '<span class="text-white text-sm font-medium">' + session.name.charAt(0) + '</span></div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 truncate">' + session.name + '</p>' +
      '<p class="text-xs text-blue-600 truncate">' + (session.previewLabel || session.role) + '</p></div></div></div>';
    aside.innerHTML = html;
    if (aside.className.indexOf('flex') < 0) { aside.className += ' flex flex-col'; }
  }

  /* ---------------- 顶栏用户区 ---------------- */
  var ROLE_BADGE_STYLES = {
    '超级管理员': 'bg-amber-50 text-amber-700',
    '平台运维人员': 'bg-slate-100 text-slate-700',
    '机构管理员': 'bg-blue-50 text-blue-700',
    '销售人员': 'bg-pink-50 text-pink-700',
    '项目经理': 'bg-emerald-50 text-emerald-700',
    '文书人员': 'bg-orange-50 text-orange-700',
    '网申人员': 'bg-lime-50 text-lime-700',
    '文书审核': 'bg-red-50 text-red-700',
    '文书机构管理员': 'bg-violet-50 text-violet-700'
  };
  function renderRoleSwitcher(header, session) {
    if (document.getElementById('pbsRoleSwitcher')) return;
    var headerRow = header.querySelector('.h-16.flex.items-center.justify-between') ||
      header.querySelector('.h-14.flex.items-center.justify-between') ||
      header.querySelector('.h-full.flex.items-center.justify-between') ||
      header.querySelector('.topbar-inner');
    if (!headerRow) return;
    var rightArea = headerRow.lastElementChild;
    if (!rightArea) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'pbsRoleSwitcher';
    wrapper.className = 'pbs-role-switcher';
    /* 只有多角色的人（或超管）才能切换多个工作台视角；单角色仅显示本人角色 */
    var userRoles = (session.userRoles && session.userRoles.length) ? session.userRoles : [session.role];
    var isSuper = userRoles.indexOf('超级管理员') >= 0;
    var switchable = (isSuper ? ROLES.slice() : userRoles.slice()).filter(function (r) { return r !== '超级管理员'; });
    var options = '';
    if (isSuper || userRoles.length > 1) options += '<option value="all">全部角色</option>';
    switchable.forEach(function (role) {
      options += '<option value="' + role + '">' + role + '</option>';
    });
    wrapper.innerHTML = '<span class="pbs-role-switcher-label">角色视角</span>' +
      '<select aria-label="切换角色视角">' + options + '</select>';
    var select = wrapper.querySelector('select');
    var hasAll = isSuper || userRoles.length > 1;
    var current = session.previewRole || 'all';
    if (current === 'all' && !hasAll) current = session.role;
    select.value = current;
    select.addEventListener('change', function () {
      var role = select.value;
      try { localStorage.setItem(PREVIEW_ROLE_KEY, role); } catch (e) {}
      if (role === 'all') {
        var home = isSuper ? '超级管理员' : userRoles[0];
        location.href = ROLE_WORKBENCH[home] || ROLE_WORKBENCH['超级管理员'];
      } else {
        location.href = ROLE_WORKBENCH[role] || ROLE_WORKBENCH['超级管理员'];
      }
    });
    rightArea.insertBefore(wrapper, rightArea.firstChild);
  }

  function bindHeader(session) {
    var header = document.querySelector('header');
    if (!header) return;
    renderRoleSwitcher(header, session);

    /* 用户头像（header内最后一个不在用户菜单里的.rounded-full span） */
    var avatarSpans = header.querySelectorAll('.rounded-full span');
    var avatarSpan = null;
    for (var i = avatarSpans.length - 1; i >= 0; i--) {
      if (!avatarSpans[i].closest('#userMenu')) { avatarSpan = avatarSpans[i]; break; }
    }
    if (!avatarSpan) return;
    avatarSpan.textContent = session.name.charAt(0);

    /* 用户区容器 = 头像的祖父元素 */
    var userArea = avatarSpan.parentElement && avatarSpan.parentElement.parentElement;
    if (!userArea) return;

    /* 用户区文本行（排除头像字母、用户菜单内容、徽章） */
    var texts = [];
    userArea.querySelectorAll('p, span').forEach(function (el) {
      if (el.children.length) return;
      if (el === avatarSpan) return;
      if (el.closest('#userMenu')) return;
      if (el.classList.contains('pbs-role-badge')) return;
      if (!el.textContent.trim()) return;
      texts.push(el);
    });
    /* 第一行显示姓名，第二行显示 角色 · 机构 */
    if (texts[0]) texts[0].textContent = session.name;
    var roleLabel = session.previewLabel || session.role;
    var subTitle = roleLabel + (session.org ? ' · ' + session.org : '');
    if (texts[1]) {
      texts[1].textContent = subTitle;
    }

    /* 始终渲染/更新角色徽标 */
    var badge = userArea.querySelector('.pbs-role-badge');
    var badgeStyle = ROLE_BADGE_STYLES[roleLabel] || 'bg-blue-50 text-blue-700';
    if (!badge) {
      badge = document.createElement('span');
      userArea.insertBefore(badge, avatarSpan.parentElement);
    }

    badge.className = 'pbs-role-badge hidden sm:inline-block text-xs px-2.5 py-1 rounded-full font-medium ' + badgeStyle;
    badge.textContent = roleLabel;

    /* 用户菜单：已有则更新内容，没有则注入标准菜单 */
    var menu = userArea.querySelector('#userMenu') || document.getElementById('userMenu');
    if (menu) {
      var nameP = menu.querySelector('p.font-semibold');
      if (nameP) nameP.textContent = session.name;
      var mailP = menu.querySelector('p.text-xs.text-gray-500');
      if (mailP) mailP.textContent = session.email || '';
      var roleLine = menu.querySelector('.pbs-menu-role');
      if (!roleLine && nameP) {
        roleLine = document.createElement('p');
        roleLine.className = 'pbs-menu-role text-xs mt-0.5';
        roleLine.textContent = subTitle;
        nameP.parentNode.appendChild(roleLine);
      }
      if (roleLine) {
        roleLine.className = 'pbs-menu-role text-xs mt-0.5 ' + (ROLE_BADGE_STYLES[roleLabel] || 'bg-blue-50 text-blue-700').replace(/bg-(\w+)-50/, 'text-$1');
        roleLine.textContent = subTitle;
      }
      var av = menu.querySelector('.w-10.h-10 span');
      if (av) av.textContent = session.name.charAt(0);
      ensureSystemSettingsMenuItem(menu);
    } else {
      injectUserMenu(userArea, session);
    }
  }

  /* 注入标准用户菜单（下拉） */
  function injectUserMenu(userArea, session) {
    userArea.style.position = 'relative';
    userArea.style.cursor = 'pointer';
    var menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'absolute top-12 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-3 hidden z-50';
    menu.innerHTML =
      '<div class="px-5 py-3 border-b border-gray-100"><div class="flex items-center gap-3">' +
      '<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">' +
      '<span class="text-white text-base font-medium">' + session.name.charAt(0) + '</span></div>' +
      '<div><p class="text-sm font-semibold text-gray-900">' + session.name + '</p>' +
      '<p class="text-xs text-blue-600 mt-0.5">' + (session.previewLabel || session.role) + (session.org ? ' · ' + session.org : '') + '</p>' +
      '<p class="text-xs text-gray-500">' + (session.email || '') + '</p></div></div></div>' +
      '<div class="py-1">' +
      '<a href="#" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>个人设置</a>' +
      '<a href="#" data-pbs-system-settings class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + ICONS.cog + '"></path></svg>系统设置</a>' +
      '<a href="#" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>退出登录</a></div>' +
      '<div class="px-5 py-2 border-t border-gray-100"><p class="text-xs text-gray-400">PBS留学CRM v2.5</p></div>';
    userArea.appendChild(menu);
    userArea.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', function () { menu.classList.add('hidden'); });
  }

  function ensureSystemSettingsMenuItem(menu) {
    if (!menu || menu.querySelector('[data-pbs-system-settings]')) return;
    var actionGroup = menu.querySelector('.py-1');
    if (!actionGroup) return;
    var item = document.createElement('a');
    item.href = '#';
    item.setAttribute('data-pbs-system-settings', 'true');
    item.className = 'flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors';
    item.innerHTML = '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + ICONS.cog + '"></path></svg>系统设置';
    var links = actionGroup.querySelectorAll('a');
    var logout = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].textContent.replace(/\s/g, '') === '退出登录') { logout = links[i]; break; }
    }
    actionGroup.insertBefore(item, logout || null);
  }

  /* ---------------- 首次进入系统介绍视频 ---------------- */
  var INTRO_SEEN_PREFIX = 'pbs_intro_video_seen_v1_';
  var INTRO_POLICY_KEY = 'pbs_intro_video_policy_v1';
  var INTRO_META_KEY = 'pbs_intro_video_meta_v1';
  var INTRO_VIDEO_DB_NAME = 'pbs_video_assets_v1';
  var INTRO_VIDEO_STORE_NAME = 'assets';
  var INTRO_VIDEO_ASSET_KEY = 'intro-video';
  var INTRO_DURATION = 32;
  var introAccount = 'guest';
  var introTimer = null;
  var introCurrentTime = 0;
  var introPlaying = false;
  var introUsingNativeVideo = false;
  var introVideoObjectUrl = '';
  var introLoadToken = 0;

  function introSeenKey() { return INTRO_SEEN_PREFIX + introAccount; }
  function getIntroVideoPolicy() {
    var policy = { enabled: true, autoPlayFirstVisit: true, allowClose: true };
    try {
      var saved = JSON.parse(localStorage.getItem(INTRO_POLICY_KEY) || '{}');
      Object.keys(saved || {}).forEach(function (key) { policy[key] = saved[key]; });
    } catch (e) {}
    return policy;
  }
  function getIntroVideoMeta() {
    var meta = { kicker: 'WELCOME TO PBS', title: 'PBS 系统介绍视频', subtitle: '用 32 秒了解角色工作台与申请交付主流程', duration: 32 };
    try {
      var saved = JSON.parse(localStorage.getItem(INTRO_META_KEY) || '{}');
      Object.keys(saved || {}).forEach(function (key) { meta[key] = saved[key]; });
      if (!saved.subtitle && saved.description) meta.subtitle = saved.description;
    } catch (e) {}
    meta.duration = Math.max(1, Number(meta.duration) || 32);
    return meta;
  }
  function formatIntroTime(seconds) {
    var value = Math.max(0, Math.min(INTRO_DURATION, Math.floor(seconds || 0)));
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }
  function ensureIntroExperience() {
    if (document.getElementById('pbsIntroLayer')) return;
    var style = document.createElement('style');
    style.id = 'pbs-intro-experience-style';
    style.textContent =
      '.pbs-intro-hidden{display:none!important}.pbs-intro-layer{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:24px}' +
      '.pbs-intro-mask{position:absolute;inset:0;background:rgba(15,23,42,.72);backdrop-filter:blur(7px)}' +
      '.pbs-intro-dialog{position:relative;width:min(920px,100%);max-height:calc(100vh - 48px);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 30px 90px rgba(15,23,42,.34)}' +
      '.pbs-intro-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:20px 24px;border-bottom:1px solid #eef2f7}' +
      '.pbs-intro-kicker{font-size:12px;font-weight:700;color:#6B829A;letter-spacing:.08em}.pbs-intro-title{font-size:20px;font-weight:700;color:#0f172a;margin-top:3px}.pbs-intro-sub{font-size:13px;color:#94a3b8;margin-top:4px}' +
      '.pbs-intro-close{width:36px;height:36px;border:0;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:22px;cursor:pointer}.pbs-intro-body{padding:22px 24px}' +
      '.pbs-intro-player{overflow:hidden;border-radius:18px;background:#090d1a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}' +
      '.pbs-intro-stage{position:relative;aspect-ratio:16/8.6;min-height:320px;overflow:hidden;color:#fff}.pbs-intro-scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:40px;opacity:0;transform:scale(1.025);transition:opacity .5s ease,transform .7s ease;pointer-events:none}.pbs-intro-scene.is-active{opacity:1;transform:scale(1)}' +
      '.pbs-intro-native-video{position:absolute;inset:0;z-index:5;display:none;width:100%;height:100%;object-fit:contain;background:#000}.pbs-intro-player.is-native .pbs-intro-native-video{display:block}.pbs-intro-player.is-native .pbs-intro-scene,.pbs-intro-player.is-native .pbs-intro-center-control,.pbs-intro-player.is-native .pbs-intro-controls{display:none}' +
      '.pbs-intro-scene-one{background:radial-gradient(circle at 78% 20%,rgba(129,140,248,.45),transparent 32%),linear-gradient(135deg,#10182f,#312e81 55%,#2563eb)}' +
      '.pbs-intro-scene-two{background:radial-gradient(circle at 18% 12%,rgba(56,189,248,.32),transparent 28%),linear-gradient(135deg,#0f172a,#172554)}' +
      '.pbs-intro-scene-three{background:radial-gradient(circle at 85% 85%,rgba(16,185,129,.25),transparent 30%),linear-gradient(135deg,#111827,#0f3d3e)}' +
      '.pbs-intro-scene-four{background:radial-gradient(circle at 15% 15%,rgba(168,85,247,.28),transparent 30%),linear-gradient(135deg,#18112d,#312e81)}' +
      '.pbs-intro-logo{width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;border:1px solid rgba(255,255,255,.22);box-shadow:0 18px 45px rgba(15,23,42,.25)}' +
      '.pbs-intro-copy{text-align:center;max-width:620px}.pbs-intro-copy h3{font-size:30px;line-height:1.25;font-weight:750;margin:18px 0 10px}.pbs-intro-copy p{font-size:15px;color:rgba(255,255,255,.75);line-height:1.7}' +
      '.pbs-intro-dashboard{width:min(680px,100%)}.pbs-intro-dashboard h3,.pbs-intro-flow h3,.pbs-intro-plugin h3{font-size:25px;font-weight:700;margin:0 0 18px;text-align:center}.pbs-intro-mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.pbs-intro-mini-card{padding:16px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.09);backdrop-filter:blur(8px)}.pbs-intro-mini-card b{display:block;font-size:24px;margin-top:7px}.pbs-intro-mini-card span{font-size:12px;color:rgba(255,255,255,.68)}' +
      '.pbs-intro-flow{width:min(720px,100%)}.pbs-intro-flow-row{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}.pbs-intro-flow-step{min-width:122px;padding:14px 12px;border-radius:13px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);text-align:center;font-size:13px}.pbs-intro-flow-step strong{display:block;font-size:18px;margin-bottom:5px}.pbs-intro-flow-arrow{color:#5eead4;font-size:20px}' +
      '.pbs-intro-plugin{width:min(680px,100%)}.pbs-intro-field-table{overflow:hidden;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(255,255,255,.08)}.pbs-intro-field-head,.pbs-intro-field-row{display:grid;grid-template-columns:1.5fr .8fr .7fr;gap:12px;padding:11px 16px;text-align:left}.pbs-intro-field-head{font-size:11px;color:#C8D3DC;background:rgba(255,255,255,.07)}.pbs-intro-field-row{font-size:13px;border-top:1px solid rgba(255,255,255,.08)}' +
      '.pbs-intro-center-control{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px;height:70px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(15,23,42,.62);color:#fff;font-size:25px;cursor:pointer;opacity:0;transition:opacity .2s}.pbs-intro-stage:hover .pbs-intro-center-control,.pbs-intro-center-control.is-paused{opacity:1}' +
      '.pbs-intro-controls{display:grid;grid-template-columns:40px minmax(0,1fr) 86px;gap:12px;align-items:center;padding:13px 16px;background:#0f172a}.pbs-intro-control-btn{border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer}.pbs-intro-seek{width:100%;accent-color:#8DA4B2}.pbs-intro-time{font-size:12px;color:#cbd5e1;text-align:right;font-variant-numeric:tabular-nums}' +
      '.pbs-intro-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 24px;border-top:1px solid #eef2f7}.pbs-intro-foot p{font-size:13px;color:#64748b}.pbs-intro-primary{height:40px;padding:0 18px;border:0;border-radius:10px;background:#6B829A;color:#fff;font-size:14px;font-weight:600;cursor:pointer}' +
      '.pbs-settings-dialog{position:relative;width:min(640px,100%);background:#fff;border-radius:22px;box-shadow:0 30px 90px rgba(15,23,42,.3)}.pbs-settings-body{padding:22px 24px}.pbs-settings-card{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px;border:1px solid #e2e8f0;border-radius:15px;background:#f8fafc}.pbs-settings-icon{width:46px;height:46px;border-radius:13px;background:#ECEFF3;color:#6B829A;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0}.pbs-settings-copy{flex:1;min-width:0}.pbs-settings-copy h3{font-size:15px;font-weight:650;color:#0f172a}.pbs-settings-copy p{font-size:12px;color:#64748b;margin-top:4px;line-height:1.5}.pbs-settings-replay{height:38px;padding:0 14px;border:1px solid #CDDAE4;border-radius:10px;background:#fff;color:#6B829A;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}' +
      '@media(max-width:680px){.pbs-intro-layer{padding:10px}.pbs-intro-dialog{max-height:calc(100vh - 20px);border-radius:18px}.pbs-intro-head,.pbs-intro-body,.pbs-intro-foot{padding-left:16px;padding-right:16px}.pbs-intro-stage{min-height:300px}.pbs-intro-scene{padding:24px 18px}.pbs-intro-copy h3{font-size:24px}.pbs-intro-mini-grid{grid-template-columns:1fr}.pbs-intro-mini-card:nth-child(n+3){display:none}.pbs-intro-flow-arrow{display:none}.pbs-intro-field-row:nth-child(n+4){display:none}.pbs-settings-card{align-items:flex-start;flex-wrap:wrap}.pbs-settings-replay{margin-left:58px}}';
    document.head.appendChild(style);

    var shell = document.createElement('div');
    shell.id = 'pbsIntroExperience';
    shell.innerHTML =
      '<div id="pbsIntroLayer" class="pbs-intro-layer pbs-intro-hidden" role="dialog" aria-modal="true" aria-labelledby="pbsIntroTitle">' +
      '<div id="pbsIntroMask" class="pbs-intro-mask"></div><section class="pbs-intro-dialog">' +
      '<header class="pbs-intro-head"><div><div id="pbsIntroKicker" class="pbs-intro-kicker">WELCOME TO PBS</div><h2 id="pbsIntroTitle" class="pbs-intro-title">PBS 系统介绍视频</h2><p id="pbsIntroSubtitle" class="pbs-intro-sub">用 32 秒了解角色工作台与申请交付主流程</p></div><button id="pbsIntroClose" class="pbs-intro-close" aria-label="关闭介绍视频">×</button></header>' +
      '<div class="pbs-intro-body"><div id="pbsIntroPlayer" class="pbs-intro-player"><div class="pbs-intro-stage"><video id="pbsIntroNativeVideo" class="pbs-intro-native-video" controls playsinline preload="metadata"></video>' +
      '<article class="pbs-intro-scene pbs-intro-scene-one is-active"><div class="pbs-intro-copy"><div class="pbs-intro-logo" style="margin:0 auto">P</div><h3>一套平台，协同完成留学申请交付</h3><p>集中管理学生、项目、文书、网申、监控与结项，让每个角色都清楚下一步该做什么。</p></div></article>' +
      '<article class="pbs-intro-scene pbs-intro-scene-two"><div class="pbs-intro-dashboard"><h3>每个角色拥有专属工作台</h3><div class="pbs-intro-mini-grid"><div class="pbs-intro-mini-card"><span>今日待办</span><b>7</b><span>优先处理临期与卡点</span></div><div class="pbs-intro-mini-card"><span>在管项目</span><b>42</b><span>项目进度集中追踪</span></div><div class="pbs-intro-mini-card"><span>风险提醒</span><b style="color:#DDB7B3">3</b><span>及时介入异常事项</span></div></div></div></article>' +
      '<article class="pbs-intro-scene pbs-intro-scene-three"><div class="pbs-intro-flow"><h3>围绕项目推进完整业务流程</h3><div class="pbs-intro-flow-row"><div class="pbs-intro-flow-step"><strong>01</strong>学生建档</div><span class="pbs-intro-flow-arrow">→</span><div class="pbs-intro-flow-step"><strong>02</strong>项目分配</div><span class="pbs-intro-flow-arrow">→</span><div class="pbs-intro-flow-step"><strong>03</strong>文书与网申</div><span class="pbs-intro-flow-arrow">→</span><div class="pbs-intro-flow-step"><strong>04</strong>监控与结项</div></div></div></article>' +
      '<article class="pbs-intro-scene pbs-intro-scene-four"><div class="pbs-intro-plugin"><h3>PBS 插件识别官网字段并同步模板</h3><div class="pbs-intro-field-table"><div class="pbs-intro-field-head"><span>字段名</span><span>填写类型</span><span>是否必填</span></div><div class="pbs-intro-field-row"><span>First Name</span><span>文本</span><span>必填</span></div><div class="pbs-intro-field-row"><span>Date of Birth</span><span>日期</span><span>必填</span></div><div class="pbs-intro-field-row"><span>Phone</span><span>电话</span><span>选填</span></div></div></div></article>' +
      '<button id="pbsIntroCenterControl" class="pbs-intro-center-control" aria-label="播放或暂停">▶</button></div>' +
      '<div class="pbs-intro-controls"><button id="pbsIntroPlay" class="pbs-intro-control-btn" aria-label="播放或暂停">▶</button><input id="pbsIntroSeek" class="pbs-intro-seek" type="range" min="0" max="32" value="0" step="0.25" aria-label="视频进度"><span id="pbsIntroTime" class="pbs-intro-time">00:00 / 00:32</span></div></div></div>' +
      '<footer class="pbs-intro-foot"><p>关闭后不会再次自动弹出，可在“系统设置”中再次播放。</p><button id="pbsIntroDone" class="pbs-intro-primary">开始使用</button></footer></section></div>' +
      '<div id="pbsSettingsLayer" class="pbs-intro-layer pbs-intro-hidden" role="dialog" aria-modal="true" aria-labelledby="pbsSettingsTitle">' +
      '<div id="pbsSettingsMask" class="pbs-intro-mask"></div><section class="pbs-settings-dialog"><header class="pbs-intro-head"><div><div class="pbs-intro-kicker">SETTINGS</div><h2 id="pbsSettingsTitle" class="pbs-intro-title">系统设置</h2><p class="pbs-intro-sub">管理系统辅助功能与使用引导</p></div><button id="pbsSettingsClose" class="pbs-intro-close" aria-label="关闭系统设置">×</button></header>' +
      '<div class="pbs-settings-body"><div class="pbs-settings-card"><div class="pbs-settings-icon">▶</div><div class="pbs-settings-copy"><h3 id="pbsSettingsVideoTitle">PBS 系统介绍视频</h3><p id="pbsIntroViewedState">首次进入系统时自动播放一次</p></div><button id="pbsSettingsReplay" class="pbs-settings-replay">再次播放</button></div></div></section></div>';
    document.body.appendChild(shell);

    document.getElementById('pbsIntroClose').addEventListener('click', closeIntroVideo);
    document.getElementById('pbsIntroDone').addEventListener('click', closeIntroVideo);
    document.getElementById('pbsIntroPlay').addEventListener('click', toggleIntroPlayback);
    document.getElementById('pbsIntroCenterControl').addEventListener('click', toggleIntroPlayback);
    document.getElementById('pbsIntroSeek').addEventListener('input', function () {
      introCurrentTime = Number(this.value) || 0;
      renderIntroPlayback();
    });
    document.getElementById('pbsIntroNativeVideo').addEventListener('loadedmetadata', function () {
      if (!introUsingNativeVideo || !isFinite(this.duration) || this.duration <= 0) return;
      INTRO_DURATION = this.duration;
      introCurrentTime = this.currentTime || 0;
      document.getElementById('pbsIntroSeek').max = String(this.duration);
      try {
        var meta = getIntroVideoMeta();
        meta.duration = Number(this.duration.toFixed(2));
        localStorage.setItem(INTRO_META_KEY, JSON.stringify(meta));
      } catch (e) {}
      renderIntroPlayback();
    });
    document.getElementById('pbsIntroNativeVideo').addEventListener('timeupdate', function () { if (introUsingNativeVideo) { introCurrentTime = this.currentTime || 0; renderIntroPlayback(); } });
    document.getElementById('pbsIntroNativeVideo').addEventListener('play', function () { if (introUsingNativeVideo) { introPlaying = true; renderIntroPlayback(); } });
    document.getElementById('pbsIntroNativeVideo').addEventListener('pause', function () { if (introUsingNativeVideo) { introPlaying = false; renderIntroPlayback(); } });
    document.getElementById('pbsIntroNativeVideo').addEventListener('ended', function () { if (introUsingNativeVideo) { introPlaying = false; introCurrentTime = INTRO_DURATION; renderIntroPlayback(); } });
    document.getElementById('pbsIntroMask').addEventListener('click', closeIntroVideo);
    document.getElementById('pbsSettingsClose').addEventListener('click', closeSystemSettings);
    document.getElementById('pbsSettingsMask').addEventListener('click', closeSystemSettings);
    document.getElementById('pbsSettingsReplay').addEventListener('click', function () {
      closeSystemSettings();
      openIntroVideo(true);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!document.getElementById('pbsIntroLayer').classList.contains('pbs-intro-hidden')) closeIntroVideo();
      else closeSystemSettings();
    });
  }

  function renderIntroPlayback() {
    var sceneIndex = Math.min(3, Math.floor(introCurrentTime / (INTRO_DURATION / 4)));
    var scenes = document.querySelectorAll('.pbs-intro-scene');
    scenes.forEach(function (scene, index) { scene.classList.toggle('is-active', index === sceneIndex); });
    var seek = document.getElementById('pbsIntroSeek');
    if (seek) seek.value = String(introCurrentTime);
    var time = document.getElementById('pbsIntroTime');
    if (time) time.textContent = formatIntroTime(introCurrentTime) + ' / ' + formatIntroTime(INTRO_DURATION);
    var icon = introPlaying ? '❚❚' : (introCurrentTime >= INTRO_DURATION ? '↻' : '▶');
    var play = document.getElementById('pbsIntroPlay');
    var center = document.getElementById('pbsIntroCenterControl');
    if (play) play.textContent = icon;
    if (center) {
      center.textContent = icon;
      center.classList.toggle('is-paused', !introPlaying);
    }
  }
  function pauseIntroPlayback() {
    introPlaying = false;
    if (introTimer) window.clearInterval(introTimer);
    introTimer = null;
    if (introUsingNativeVideo) {
      var nativeVideo = document.getElementById('pbsIntroNativeVideo');
      if (nativeVideo && !nativeVideo.paused) nativeVideo.pause();
    }
    renderIntroPlayback();
  }
  function playIntroPlayback() {
    if (introUsingNativeVideo) {
      var nativeVideo = document.getElementById('pbsIntroNativeVideo');
      if (!nativeVideo) return;
      if (nativeVideo.ended || nativeVideo.currentTime >= nativeVideo.duration) nativeVideo.currentTime = 0;
      var playResult = nativeVideo.play();
      if (playResult && playResult.catch) playResult.catch(function () { introPlaying = false; renderIntroPlayback(); });
      return;
    }
    if (introCurrentTime >= INTRO_DURATION) introCurrentTime = 0;
    introPlaying = true;
    if (introTimer) window.clearInterval(introTimer);
    introTimer = window.setInterval(function () {
      introCurrentTime = Math.min(INTRO_DURATION, introCurrentTime + 0.25);
      if (introCurrentTime >= INTRO_DURATION) pauseIntroPlayback();
      else renderIntroPlayback();
    }, 250);
    renderIntroPlayback();
  }
  function toggleIntroPlayback() { if (introPlaying) pauseIntroPlayback(); else playIntroPlayback(); }
  function openIntroVideoDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('视频存储不可用')); return; }
      var request = window.indexedDB.open(INTRO_VIDEO_DB_NAME, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(INTRO_VIDEO_STORE_NAME)) db.createObjectStore(INTRO_VIDEO_STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('视频读取失败')); };
    });
  }
  function readStoredIntroVideo() {
    return openIntroVideoDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(INTRO_VIDEO_STORE_NAME, 'readonly').objectStore(INTRO_VIDEO_STORE_NAME).get(INTRO_VIDEO_ASSET_KEY);
        request.onsuccess = function () { db.close(); resolve(request.result || null); };
        request.onerror = function () { db.close(); reject(request.error || new Error('视频读取失败')); };
      });
    });
  }
  function useAnimatedIntro() {
    introUsingNativeVideo = false;
    var player = document.getElementById('pbsIntroPlayer');
    if (player) player.classList.remove('is-native');
  }
  function loadUploadedIntro(meta, restart, token) {
    var player = document.getElementById('pbsIntroPlayer');
    var nativeVideo = document.getElementById('pbsIntroNativeVideo');
    introUsingNativeVideo = true;
    if (player) player.classList.add('is-native');
    if (introTimer) window.clearInterval(introTimer);
    introTimer = null;
    readStoredIntroVideo().then(function (asset) {
      if (token !== introLoadToken) return;
      if (!asset || !asset.blob) throw new Error('未找到已上传视频');
      if (introVideoObjectUrl) URL.revokeObjectURL(introVideoObjectUrl);
      introVideoObjectUrl = URL.createObjectURL(asset.blob);
      nativeVideo.src = introVideoObjectUrl;
      nativeVideo.muted = true;
      if (restart !== false) nativeVideo.currentTime = 0;
      nativeVideo.load();
      var result = nativeVideo.play();
      if (result && result.catch) result.catch(function () { introPlaying = false; renderIntroPlayback(); });
    }).catch(function () {
      if (token !== introLoadToken) return;
      useAnimatedIntro();
      INTRO_DURATION = meta.duration;
      document.getElementById('pbsIntroSeek').max = String(meta.duration);
      playIntroPlayback();
    });
  }
  function openIntroVideo(restart) {
    ensureIntroExperience();
    var meta = getIntroVideoMeta();
    var loadToken = ++introLoadToken;
    INTRO_DURATION = meta.duration;
    document.getElementById('pbsIntroKicker').textContent = meta.kicker;
    document.getElementById('pbsIntroTitle').textContent = meta.title;
    document.getElementById('pbsIntroSubtitle').textContent = meta.subtitle;
    document.getElementById('pbsIntroSeek').max = String(meta.duration);
    if (restart !== false) introCurrentTime = 0;
    document.getElementById('pbsIntroLayer').classList.remove('pbs-intro-hidden');
    document.body.style.overflow = 'hidden';
    try { localStorage.setItem(introSeenKey(), new Date().toLocaleString('zh-CN', { hour12: false })); } catch (e) {}
    if (meta.hasCustomVideo) loadUploadedIntro(meta, restart, loadToken);
    else { useAnimatedIntro(); playIntroPlayback(); }
  }
  function closeIntroVideo() {
    introLoadToken++;
    var layer = document.getElementById('pbsIntroLayer');
    if (layer) layer.classList.add('pbs-intro-hidden');
    document.body.style.overflow = '';
    pauseIntroPlayback();
  }
  function openSystemSettings() {
    ensureIntroExperience();
    var lastViewed = '';
    var policy = getIntroVideoPolicy();
    var meta = getIntroVideoMeta();
    try { lastViewed = localStorage.getItem(introSeenKey()) || ''; } catch (e) {}
    document.getElementById('pbsSettingsVideoTitle').textContent = meta.title;
    document.getElementById('pbsIntroViewedState').textContent = (policy.enabled && policy.autoPlayFirstVisit ? '首次进入自动播放一次' : '首次进入自动播放已关闭') + (lastViewed ? (' · 最近播放：' + lastViewed) : '');
    document.getElementById('pbsSettingsLayer').classList.remove('pbs-intro-hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeSystemSettings() {
    var layer = document.getElementById('pbsSettingsLayer');
    if (layer) layer.classList.add('pbs-intro-hidden');
    document.body.style.overflow = '';
  }
  function initSystemIntroduction(session) {
    introAccount = (session && (session.account || session.email || session.name)) || 'guest';
    ensureIntroExperience();
    var policy = getIntroVideoPolicy();
    if (!policy.enabled || !policy.autoPlayFirstVisit) return;
    var seen = false;
    try { seen = !!localStorage.getItem(introSeenKey()); } catch (e) {}
    if (!seen) setTimeout(function () { openIntroVideo(true); }, 420);
  }
  window.pbsOpenIntroVideo = function () { openIntroVideo(true); };
  window.pbsOpenSystemSettings = openSystemSettings;
  window.pbsGetIntroVideoPolicy = getIntroVideoPolicy;
  window.pbsGetIntroVideoMeta = getIntroVideoMeta;

  /* 退出登录 / 个人设置 / 系统设置（事件委托，兼容所有页面） */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('a,button');
    if (!t) return;
    var txt = t.textContent.replace(/\s/g, '');
    if (txt === '退出登录') {
      e.preventDefault();
      e.stopPropagation();
      window.pbsLogout();
    } else if (txt === '个人设置') {
      e.preventDefault();
      alert('个人设置功能将在后续版本开放');
    } else if (t.hasAttribute('data-pbs-system-settings') || txt === '系统设置') {
      e.preventDefault();
      e.stopPropagation();
      openSystemSettings();
    }
  }, true);

  /* ---------------- 通知消息：按当前角色、所属机构和接收人过滤 ---------------- */
  var NOTIFICATION_STORE_KEY = 'pbs_notifications_v2';
  var NOTIFICATION_READ_KEY = 'pbs_notification_read_v3';
  var NOTIFICATION_SEEDS = [
    { id: 'order-created-prj-m-2607-0000', kind: 'order_created', type: '新项目待分配', title: '新项目进入项目池，等待分配', business: 'PRJ-M-2607-0000 · 周海宁 / 周妍', detail: '线上订单创建成功，请为项目分配项目经理。', time: '10 分钟前', triggeredAt: '2026-08-21 10:30:00', level: 'warning', recipientRoles: ['机构管理员'], organization: 'PBS留学总部', href: '项目池列表页 - 留学申请管理系统.html' },
    { id: 'task-assigned-writer-cmu-ps', kind: 'task_assigned', type: '任务派发提醒', title: '新的 PS 文书任务已分配给你', business: '李雪 · 卡内基梅隆大学 · PS 个人陈述', detail: '项目经理王强已完成任务派发，请查看任务要求与交付 DDL。', time: '18 分钟前', triggeredAt: '2026-08-21 10:22:00', level: 'primary', recipientRoles: ['文书人员'], organization: 'PBS留学总部', href: '任务列表页 - 文书交付系统.html' },
    { id: 'task-assigned-review-cmu-ps', kind: 'task_assigned', type: '任务派发提醒', title: '新的文书审核任务已分配给你', business: '李雪 · 卡内基梅隆大学 · PS 个人陈述', detail: '请在文书交付人员提交后完成审核。', time: '22 分钟前', triggeredAt: '2026-08-21 10:18:00', level: 'primary', recipientRoles: ['文书审核'], organization: 'PBS留学总部', href: '文书审核列表页 - 留学申请管理系统.html' },
    { id: 'task-assigned-apply-cmu', kind: 'task_assigned', type: '任务派发提醒', title: '新的网申任务已分配给你', business: '李雪 · 卡内基梅隆大学 · 网申提交', detail: '请预扫描申请官网，并核对字段与申请材料。', time: '25 分钟前', triggeredAt: '2026-08-21 10:15:00', level: 'primary', recipientRoles: ['网申人员'], organization: 'PBS留学总部', href: '网申任务列表页 - 留学申请管理系统.html' },
    { id: 'task-urge-apply-cmu-material', kind: 'task_urge', type: '任务催办提醒', title: 'CMU 官网预扫描任务收到催办', business: '李雪 · 卡内基梅隆大学 · 申请材料准备', detail: '项目经理王强发起催办，请尽快完成官网字段与材料清单预扫描。', reminderBy: '王强（项目经理）', reminderNote: '材料清单尚未生成，已影响后续网申准备。', time: '30 分钟前', triggeredAt: '2026-08-21 10:10:00', level: 'danger', recipientRoles: ['网申人员'], organization: 'PBS留学总部', href: '网申任务详情页 - 留学申请管理系统.html' },
    { id: 'task-urge-writer-stanford-cv', kind: 'task_urge', type: '任务催办提醒', title: 'Stanford CV 文书任务收到催办', business: '李雪 · 斯坦福大学 · CV 简历', detail: '项目经理王强发起催办，请确认任务并按 DDL 推进。', reminderBy: '王强（项目经理）', reminderNote: '请今天完成任务接收并反馈预计交付时间。', time: '45 分钟前', triggeredAt: '2026-08-21 09:55:00', level: 'danger', recipientRoles: ['文书人员'], organization: 'PBS留学总部', href: '任务列表页 - 文书交付系统.html' }
  ];

  var lastNotificationTrigger = null;
  function notificationEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function notificationCustomItems() {
    try {
      var items = JSON.parse(localStorage.getItem(NOTIFICATION_STORE_KEY) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (e) { return []; }
  }
  function notificationRolesFor(session) {
    if (session.previewRole && session.previewRole !== 'all') return [session.role];
    if ((session.userRoles || []).indexOf('超级管理员') >= 0) return ROLES.slice();
    return session.userRoles && session.userRoles.length ? session.userRoles.slice() : [session.role];
  }
  function notificationScope(session) {
    var role = session.previewRole && session.previewRole !== 'all' ? session.role : 'all';
    return [session.account || session.email || session.name || 'guest', role, session.org || ''].join('::');
  }
  function notificationReadIds(session) {
    try {
      var state = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '{}');
      return Array.isArray(state[notificationScope(session)]) ? state[notificationScope(session)] : [];
    } catch (e) { return []; }
  }
  function saveNotificationReadIds(session, ids) {
    var state = {};
    try { state = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '{}') || {}; } catch (e) { state = {}; }
    state[notificationScope(session)] = ids;
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(state));
  }
  function notificationItemsFor(session) {
    var roles = notificationRolesFor(session);
    var isSuperAll = session.previewRole === 'all' && roles.indexOf('超级管理员') >= 0;
    return NOTIFICATION_SEEDS.concat(notificationCustomItems()).filter(function (item) {
      if (item.result && item.result !== '成功') return false;
      if (!isSuperAll && item.organization && item.organization !== session.org) return false;
      if (item.recipientAccount && item.recipientAccount !== session.account && item.recipientAccount !== session.email) return false;
      if (item.recipientName && item.recipientName !== session.name) return false;
      var receivers = item.recipientRoles || [];
      return receivers.some(function (role) { return roles.indexOf(role) >= 0; });
    }).sort(function (a, b) { return String(b.triggeredAt || '').localeCompare(String(a.triggeredAt || '')); });
  }
  function unreadNotificationItems(session) {
    var read = notificationReadIds(session);
    return notificationItemsFor(session).filter(function (item) { return read.indexOf(item.id) < 0; });
  }
  function markNotificationRead(session, id) {
    var read = notificationReadIds(session);
    if (read.indexOf(id) < 0) { read.push(id); saveNotificationReadIds(session, read); }
  }
  function updateNotificationBell() {
    var session = window.pbsGetSession();
    var unread = unreadNotificationItems(session).length;
    document.querySelectorAll('[data-dom-id="btn-notification"]').forEach(function (button) {
      var badge = button.querySelector('[data-pbs-notification-badge]') || button.querySelector('span.absolute.bg-red-500');
      if (!badge) { badge = document.createElement('span'); button.appendChild(badge); }
      badge.setAttribute('data-pbs-notification-badge', '');
      badge.className = 'pbs-notification-badge' + (unread ? '' : ' is-empty');
      badge.hidden = !unread;
      badge.style.display = unread ? 'inline-flex' : 'none';
      badge.textContent = unread ? (unread > 99 ? '99+' : String(unread)) : '';
      button.setAttribute('aria-label', unread ? '消息提醒，' + unread + ' 条未读' : '消息提醒，无未读消息');
      if (!button.hasAttribute('data-pbs-notification-bound')) {
        button.setAttribute('data-pbs-notification-bound', '');
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.pbsOpenNotifications(button);
        });
      }
    });
  }
  window.pbsCreateNotification = function (item) {
    if (!item || item.result === '失败' || item.successful === false) return null;
    var custom = notificationCustomItems();
    var created = Object.assign({
      id: 'notification-' + Date.now(),
      triggeredAt: new Date().toISOString(),
      time: '刚刚',
      level: 'primary',
      result: '成功'
    }, item);
    custom.unshift(created);
    localStorage.setItem(NOTIFICATION_STORE_KEY, JSON.stringify(custom.slice(0, 200)));
    updateNotificationBell();
    if (document.getElementById('pbsNotificationCenter') && document.getElementById('pbsNotificationCenter').classList.contains('is-open')) window.pbsOpenNotifications(lastNotificationTrigger);
    return created.id;
  };
  window.pbsRefreshNotifications = updateNotificationBell;
  function ensureNotificationCenter() {
    var layer = document.getElementById('pbsNotificationCenter');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'pbsNotificationCenter';
    layer.className = 'pbs-notification-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML =
      '<button type="button" class="pbs-notification-backdrop" data-pbs-notification-close aria-label="关闭消息提醒"></button>' +
      '<section class="pbs-notification-dialog" role="dialog" aria-modal="true" aria-labelledby="pbsNotificationTitle">' +
      '<header class="pbs-notification-header"><div><div class="pbs-notification-heading"><h2 id="pbsNotificationTitle">消息提醒</h2><span id="pbsNotificationRole"></span></div><p>查看当前角色需要关注的最新事项</p></div>' +
      '<button type="button" class="pbs-notification-close" data-pbs-notification-close aria-label="关闭">×</button></header>' +
      '<div id="pbsNotificationList" class="pbs-notification-list"></div>' +
      '<footer class="pbs-notification-footer"><span id="pbsNotificationCount"></span><div><button type="button" class="pbs-notification-confirm" data-pbs-notification-close>关闭</button></div></footer>' +
      '</section>';
    layer.addEventListener('click', function (e) {
      if (e.target.closest('[data-pbs-notification-close]')) { window.pbsCloseNotifications(); return; }
      var card = e.target.closest('[data-pbs-notification-id]');
      if (!card) return;
      var session = window.pbsGetSession();
      var id = card.getAttribute('data-pbs-notification-id');
      var item = notificationItemsFor(session).filter(function (notification) { return notification.id === id; })[0];
      markNotificationRead(session, id);
      updateNotificationBell();
      if (item && item.href) location.href = item.href;
      else window.pbsOpenNotifications(lastNotificationTrigger);
    });
    layer.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('[data-pbs-notification-id]');
      if (card) { e.preventDefault(); card.click(); }
    });
    document.body.appendChild(layer);
    return layer;
  }
  window.pbsOpenNotifications = function (trigger) {
    var session = window.pbsGetSession();
    var items = notificationItemsFor(session);
    var layer = ensureNotificationCenter();
    var role = layer.querySelector('#pbsNotificationRole');
    var list = layer.querySelector('#pbsNotificationList');
    var count = layer.querySelector('#pbsNotificationCount');
    var read = notificationReadIds(session);
    var unread = items.filter(function (item) { return read.indexOf(item.id) < 0; }).length;
    lastNotificationTrigger = trigger || document.activeElement;
    role.textContent = session.previewLabel || session.role;
    list.innerHTML = items.length ? items.map(function (item) {
      var isUnread = read.indexOf(item.id) < 0;
      var reminder = item.kind === 'task_urge'
        ? '<div class="pbs-notification-reminder"><span>催办人：' + notificationEscape(item.reminderBy || '—') + '</span><span>催办说明：' + notificationEscape(item.reminderNote || '—') + '</span></div>' : '';
      return '<article tabindex="0" class="pbs-notification-item is-' + notificationEscape(item.level || 'primary') + (isUnread ? ' is-unread' : '') + '" data-pbs-notification-id="' + notificationEscape(item.id) + '"><span class="pbs-notification-dot"></span><div><div class="pbs-notification-meta"><span>' + notificationEscape(item.type) + '</span><div><em>' + (isUnread ? '未读' : '已读') + '</em><time>' + notificationEscape(item.time) + '</time></div></div><h3>' + notificationEscape(item.title) + '</h3><p class="pbs-notification-business">' + notificationEscape(item.business || '') + '</p><p>' + notificationEscape(item.detail) + '</p>' + reminder + '<button type="button" class="pbs-notification-action">立即处理</button></div></article>';
    }).join('') : '<div class="pbs-notification-empty"><span>✓</span><h3>暂无通知消息</h3><p>当前角色暂无需要处理的新项目、任务派发或催办消息。</p></div>';
    count.textContent = items.length + ' 条消息 · ' + unread + ' 条未读';
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeButton = layer.querySelector('.pbs-notification-close');
    if (closeButton) closeButton.focus();
  };
  window.pbsCloseNotifications = function () {
    var layer = document.getElementById('pbsNotificationCenter');
    if (!layer) return;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastNotificationTrigger && typeof lastNotificationTrigger.focus === 'function') lastNotificationTrigger.focus();
  };
  document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-dom-id="btn-notification"]');
    if (!button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.pbsOpenNotifications(button);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('pbsNotificationCenter')) window.pbsCloseNotifications();
  });
  window.addEventListener('storage', function (e) {
    if (e.key === NOTIFICATION_STORE_KEY || e.key === NOTIFICATION_READ_KEY || e.key === PREVIEW_ROLE_KEY) updateNotificationBell();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateNotificationBell);
  else setTimeout(updateNotificationBell, 0);

  /* ---------------- 弹层（iframe方式加载组件页） ---------------- */
  var overlayEl = null;
  window.pbsOpenOverlay = function (url, opts) {
    window.pbsCloseOverlay();
    opts = opts || {};
    var w = opts.width || '640px';
    overlayEl = document.createElement('div');
    overlayEl.id = 'pbs-overlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;';
    overlayEl.innerHTML =
      '<div style="position:absolute;inset:0;background:rgba(17,24,39,.45);backdrop-filter:blur(2px);" onclick="pbsCloseOverlay()"></div>' +
      '<iframe src="' + encodeURI(url) + '" style="position:relative;width:min(' + w + ',94vw);height:88vh;border:0;border-radius:16px;background:transparent;" allowtransparency="true"></iframe>';
    document.body.appendChild(overlayEl);
    document.body.style.overflow = 'hidden';
  };
  window.pbsCloseOverlay = function () {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; document.body.style.overflow = ''; }
  };
  window.addEventListener('message', function (e) {
    if (e.data === 'pbs:close') window.pbsCloseOverlay();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.pbsCloseOverlay();
  });

  /* ---------------- 页面级接线 ---------------- */
  function bindClick(selector, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); fn(el, e); });
    });
  }

  var PAGE_WIRING = {
    '项目详情页 - 留学申请管理系统.html': function () {
      bindClick('[data-dom-id="btn-assign"]', function () {
        if (typeof window.openAssignDrawer === 'function') window.openAssignDrawer();
      });
      bindClick('[data-dom-id="btn-change-pm"]', function () {
        if (typeof window.openChangePMDrawer === 'function') window.openChangePMDrawer();
      });
    },
    /* 客户详情页：仅项目经理可编辑档案，其余角色隐藏"编辑档案"按钮 */
    '学生档案详情页 - 留学申请管理系统.html': function (session) {
      if (session && !roleCanAccess(session.role, ['项目经理'])) {
        document.querySelectorAll('button, a').forEach(function (el) {
          if (el.textContent.replace(/\s/g, '') === '编辑档案') el.style.display = 'none';
        });
      }
    },
    /* 批注：模板库"编辑/新建模板"跳转模板库编辑页 */
    '模板库列表 - 文书交付系统.html': function () {
      bindClick('[data-dom-id^="btn-edit-template-"]', function (el) {
        var id = el.getAttribute('data-dom-id').replace('btn-edit-template-', '');
        location.href = '模板库编辑 - 文书交付系统.html?id=' + id;
      });
      bindClick('[data-dom-id="btn-create-template"]', function () {
        location.href = '模板库编辑 - 文书交付系统.html';
      });
    },
    /* 批注：交付人员没有上传材料的功能 */
    '网申任务详情页 - 留学申请管理系统.html': function (session) {
      if (session && session.role === '交付人员') {
        document.querySelectorAll('[data-dom-id^="btn-upload-doc-"]').forEach(function (el) {
          el.style.display = 'none';
        });
        document.querySelectorAll('span').forEach(function (el) {
          if (el.textContent.trim() === '从插件里导入') el.style.display = 'none';
        });
      }
    },
    /* 批注：官网监控类型详情页（含申请系统快照） */
    '监控详情页 - 留学申请管理系统.html': function () {
      var type = '';
      try { type = new URLSearchParams(location.search).get('type') || '邮箱'; } catch (e) {}
      if (decodeURIComponent(type).indexOf('官网') < 0) return;

      /* 隐藏邮箱面板，显示官网面板+申请系统快照 */
      var mailPanel = document.querySelector('[data-section="monitor-panel"]');
      if (mailPanel) mailPanel.classList.add('hidden');
      ['officialPanel', 'snapshotSection'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
      });

      /* 基础信息卡文案切换为官网监控 */
      document.querySelectorAll('[data-section="basic-info"] .flex.items-center.justify-between').forEach(function (row) {
        var label = row.querySelector('span.text-sm.text-gray-500');
        if (!label) return;
        var val = row.querySelector('.text-gray-900');
        var t = label.textContent.trim();
        if (t === '监控类型' && val) val.textContent = '官网监控';
        else if (t === '邮箱URL') { label.textContent = '申请系统URL'; if (val) val.textContent = 'https://apply.cmu.edu'; }
        else if (t === '邮箱账号') { label.textContent = '申请账号'; if (val) val.textContent = 'zhangming_cmu'; }
        else if (t === '邮箱密码') { label.textContent = '申请密码'; }
      });
    }
  };

  /* ---------------- 角色工作台（多角色视角 × 工作台可见权限） ---------------- */
  /* 工作台宿主页：always=独立工作台页；param=列表页以 ?view=workbench 承载工作台视角 */
  var WORKBENCH_HOSTS = {
    '管理员工作台 - 留学申请管理系统.html': { always: true, keys: ['pm', 'writer', 'sales', 'apply', 'audit', 'platform', 'orgadmin'] },
    '平台运维工作台 - PBS留学CRM系统.html': { always: true, keys: ['platform'], permission: 'workbench_platform' },
    '机构管理员工作台 - 留学申请管理系统.html': { always: true, keys: ['orgadmin'], permission: 'workbench_org_admin' },
    '项目经理工作台 - 留学申请管理系统.html': { always: true, keys: ['pm'] },
    '任务列表页 - 文书交付系统.html': { param: true, keys: ['writer', 'docadmin'] },
    '选校任务列表页 - 留学申请管理系统.html': { param: true, keys: ['sales'] },
    '网申任务列表页 - 留学申请管理系统.html': { param: true, keys: ['apply'] },
    '文书审核列表页 - 留学申请管理系统.html': { param: true, keys: ['audit'] }
  };

  /* 各工作台独立权限：角色权限管理页保存到 localStorage；未配置时仅默认开放角色本人的工作台。 */
  var ROLE_PERMS_KEY = 'pbs_role_perms_v1';
  function savedRolePerms() {
    try { return JSON.parse(localStorage.getItem(ROLE_PERMS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function workbenchPermissionVisible(session, permissionId) {
    if (!permissionId) return false;
    var checkRoles = (session.previewRole && session.previewRole !== 'all')
      ? [session.previewRole]
      : (session.userRoles && session.userRoles.length ? session.userRoles : [session.role]);
    if (checkRoles.indexOf('超级管理员') >= 0) return true;
    var perms = savedRolePerms();
    return checkRoles.some(function (r) {
      var p = perms[r];
      var configured = p && Array.isArray(p.workbench) ? p.workbench : null;
      if (!configured) return WORKBENCH_ROLE_PERMISSION[r] === permissionId;
      if (configured.indexOf(permissionId) >= 0) return true;
      /* 兼容旧版通用 workbench_view：只折算为该角色自己的工作台。 */
      return configured.indexOf('workbench_view') >= 0 && WORKBENCH_ROLE_PERMISSION[r] === permissionId;
    });
  }
  function workbenchVisible(session) {
    return session.role === '超级管理员' || workbenchPermissionVisible(session, WORKBENCH_ROLE_PERMISSION[session.role]);
  }

  /* 无「工作台可见」权限时的空态提示 */
  function renderWorkbenchForbidden(main) {
    var notice = document.createElement('div');
    notice.className = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center';
    notice.innerHTML =
      '<div class="w-14 h-14 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">' +
      '<svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.823-.72 1.596-1.307 2.294M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18"></path></svg></div>' +
      '<h2 class="text-lg font-semibold text-gray-800">工作台暂不可见</h2>' +
      '<p class="text-sm text-gray-500 mt-2">当前角色未被授予对应工作台的可见权限，请联系平台运维人员在「角色权限管理」中开启。</p>';
    while (main.firstChild) main.removeChild(main.firstChild);
    main.appendChild(notice);
  }

  /* 在当前页面挂载角色工作台：多角色的人可切换多个工作台，单角色仅显示本人工作台 */
  function mountRoleWorkbench(session, file) {
    var host = WORKBENCH_HOSTS[file];
    if (!host) return;
    var isWorkbenchView = host.always || new URLSearchParams(location.search).get('view') === 'workbench';
    if (!isWorkbenchView) return;

    /* 独立静态工作台也按各自权限校验。 */
    if (host.permission && !workbenchPermissionVisible(session, host.permission)) {
      if (host.always) {
        var mainEl = document.querySelector('main');
        if (mainEl) renderWorkbenchForbidden(mainEl);
      }
      return;
    }
    if (host.static || !window.pbsWorkbench) return;

    /* 当前用户可见的工作台视角 = 用户角色（含继承）∩ 本页承载的视角 */
    var myKeys = [];
    (session.roles && session.roles.length ? session.roles : [session.role]).forEach(function (r) {
      var k = window.pbsWorkbench.ROLE_KEY[r];
      if (k && myKeys.indexOf(k) < 0) myKeys.push(k);
    });
    var keys = window.pbsWorkbench.KEY_ORDER.filter(function (k) {
      return host.keys.indexOf(k) >= 0 && myKeys.indexOf(k) >= 0 &&
        workbenchPermissionVisible(session, WORKBENCH_KEY_PERMISSION[k]);
    });
    if (!keys.length) {
      /* 列表页无对应权限时保持原列表；独立工作台页显示无权限提示。 */
      if (host.always) {
        var mainNoView = document.querySelector('main');
        if (mainNoView) renderWorkbenchForbidden(mainNoView);
      }
      return;
    }

    var main = document.querySelector('main');
    if (!main) return;
    var mount = document.getElementById('pbs-workbench-mount');
    if (!mount) {
      /* 隐藏页面原内容，插入工作台挂载点 */
      var orig = document.createElement('div');
      orig.id = 'pbs-page-original';
      orig.className = 'hidden';
      while (main.firstChild) orig.appendChild(main.firstChild);
      mount = document.createElement('div');
      mount.id = 'pbs-workbench-mount';
      main.appendChild(mount);
      main.appendChild(orig);
    }
    window.pbsWorkbench.mount(mount, keys, { active: keys[0] });
  }

  /* 越权访问提示（非阻塞） */
  function showForbiddenToast(role) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.45);';
    el.innerHTML =
      '<div style="background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:36px 44px;text-align:center;max-width:380px;">' +
      '<div style="width:56px;height:56px;margin:0 auto 16px;background:#F3DDD9;border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
      '<svg style="width:28px;height:28px;color:#B36B64;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>' +
      '<h3 style="font-size:17px;font-weight:600;color:#1F2937;margin:0 0 8px;">无权访问该页面</h3>' +
      '<p style="font-size:14px;color:#6B7280;margin:0 0 6px;">当前角色【' + role + '】没有该模块的访问权限</p>' +
      '<p style="font-size:13px;color:#9CA3AF;margin:0;">正在返回您的工作台…</p></div>';
    (document.body || document.documentElement).appendChild(el);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    var file = currentFile();
    if (file === '登录 - PBS留学申请管理平台.html' || file === 'index.html' || file === '') return;
    if (COMPONENT_PAGES.indexOf(file) >= 0) return; /* 组件页不校验 */
    if (file === '选校订单池页 - 留学申请管理系统.html') {
      location.replace('选校任务列表页 - 留学申请管理系统.html');
      return;
    }
    if (file === '用户管理 - 留学申请管理系统.html') {
      location.replace('人员管理 - PBS留学CRM系统.html');
      return;
    }

    var session = getSession();
    if (!session || !session.role) { session = { account: 'demo_admin', name: '演示管理员', role: '超级管理员', roles: ['超级管理员'], org: 'PBS留学', email: 'demo@pbs.local' }; }
    session = withPreviewRole(session);
    if (file === '业务流程图 - 留学申请管理系统.html') {
      location.replace(ROLE_WORKBENCH[session.role] || ROLE_WORKBENCH['超级管理员']);
      return;
    }
    /* 页面级RBAC（超级管理员放行所有页面） */
    var perms = PAGE_PERMS[file];
    if (perms && !roleCanAccess(session.role, perms)) {
      showForbiddenToast(session.role);
      setTimeout(function () { location.replace(ROLE_WORKBENCH[session.role]); }, 1200);
      return;
    }
    renderSidebar(session, file);
    bindHeader(session);
    mountRoleWorkbench(session, file);
    var w = PAGE_WIRING[file];
    if (w) { try { w(session); } catch (e) { console.error(e); } }
    initSystemIntroduction(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
