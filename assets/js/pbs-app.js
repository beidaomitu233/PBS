/* ============================================================
   PBS留学CRM系统 - 全站共享脚本
   会话管理 / RBAC角色权限 / 动态侧边栏 / 顶栏用户区 / 弹层组件
   ============================================================ */
(function () {
  'use strict';

  var SESSION_KEY = 'pbs_session_v1';
  var PREVIEW_ROLE_KEY = 'pbs_role_preview_v51';

  /* ---------------- 角色定义 ---------------- */
  var ROLES = ['超级管理员', '平台运维人员', '机构管理员', '销售人员管理员', '销售人员', '项目经理',
    '文书人员', '网申人员', '文书审核', '文书机构管理员'];

  /* 权限继承：PM覆盖项目交付团队；机构管理员在自身权限外继承PM全部权限 */
  var ROLE_INHERITANCE = {
    '项目经理': ['文书人员', '网申人员', '文书审核', '文书机构管理员'],
    '机构管理员': ['项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员']
  };
  function roleCanAccess(role, allowedRoles) {
    if (role === '超级管理员') return true;
    if (!allowedRoles || !allowedRoles.length) return false;
    var capabilities = [role].concat(ROLE_INHERITANCE[role] || []);
    return capabilities.some(function (capability) { return allowedRoles.indexOf(capability) >= 0; });
  }

  var ROLE_WORKBENCH = {
    '超级管理员': '管理员工作台 - 留学申请管理系统.html',
    '平台运维人员': '管理员工作台 - 留学申请管理系统.html',
    '机构管理员': '管理员工作台 - 留学申请管理系统.html',
    '销售人员管理员': '选校任务列表页 - 留学申请管理系统.html',
    '销售人员': '选校任务列表页 - 留学申请管理系统.html',
    '项目经理': '项目经理工作台 - 留学申请管理系统.html',
    '文书人员': '任务列表页 - 文书交付系统.html',
    '网申人员': '网申任务列表页 - 留学申请管理系统.html',
    '文书审核': '文书审核列表页 - 留学申请管理系统.html',
    '文书机构管理员': '任务列表页 - 文书交付系统.html'
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
    { key: 'businessflow', label: '业务流程图', icon: 'map', roles: ROLES.slice(), single: true, file: '业务流程图 - 留学申请管理系统.html' },
    { key: 'student', label: '学生档案', icon: 'idcard',
      roles: ['平台运维人员', '机构管理员', '销售人员管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核'],
      children: [{ label: '学生档案列表', file: '学生档案列表页 - 留学申请管理系统.html' }] },
    { key: 'pmo', label: 'PMO监控台', icon: 'folder', roles: ['机构管理员'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html' },
        { label: 'PMO看板', file: 'PMO看板 - 留学申请管理系统.html' }] },
    { key: 'project', label: '项目管理', icon: 'folder', roles: ['项目经理'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html' },
        { label: '我的项目列表', file: '我的项目列表页 - 留学申请管理系统.html' }] },
    { key: 'doc', label: '文书交付', icon: 'doc', roles: ['文书人员', '文书机构管理员'],
      children: [
        { label: '任务列表', file: '任务列表页 - 文书交付系统.html' },
        { label: '模板库', file: '模板库列表 - 文书交付系统.html' },
        { label: '案例库', file: '案例库 - 文书交付系统.html' }] },
    { key: 'apply', label: '网申管理', icon: 'globe', roles: ['网申人员', '项目经理'],
      children: [
        { label: '网申任务列表', file: '网申任务列表页 - 留学申请管理系统.html' },
        { label: '网申模板库', file: '网申模板库 - 留学申请管理系统.html' }
      ] },
    { key: 'monitor', label: '监控管理', icon: 'eye', roles: ['项目经理'],
      children: [{ label: '监控任务列表', file: '监控任务列表 - PBS留学CRM.html' }] },
    { key: 'archive', label: '结项归档', icon: 'archive', roles: ['项目经理', '文书人员', '网申人员'],
      children: [{ label: '结项归档列表', file: '结项归档列表 - PBS留学CRM系统.html' }] },
    { key: 'review', label: '文书审核', icon: 'shield', roles: ['文书审核'],
      children: [{ label: '文书审核列表', file: '文书审核列表页 - 留学申请管理系统.html' }] },
    { key: 'school', label: '选校管理', icon: 'map', roles: ['机构管理员', '销售人员管理员', '销售人员'],
      children: [
        { label: '选校任务列表', file: '选校任务列表页 - 留学申请管理系统.html', roles: ['机构管理员', '销售人员管理员', '销售人员'] },
        { label: '院校列表', file: '选校工作台页 - 留学申请管理系统.html', href: '选校工作台页 - 留学申请管理系统.html?mode=catalog', roles: ['销售人员管理员', '销售人员'] }] },
    { key: 'organization', label: '机构管理', icon: 'users', roles: ['平台运维人员'], single: true, file: '机构管理 - PBS留学CRM系统.html' },
    { key: 'personnel', label: '机构成员管理', icon: 'idcard', roles: ['平台运维人员', '机构管理员'], single: true, file: '人员管理 - PBS留学CRM系统.html' },
    { key: 'usermgmt', label: '系统管理', icon: 'users', roles: ['平台运维人员'],
      children: [
        { label: '角色权限管理', file: '角色权限管理 - 留学申请管理系统.html', roles: ['平台运维人员'] },
        { label: '操作日志审计', file: '操作日志审计 - 留学申请管理系统.html', roles: ['平台运维人员'] }] },
    { key: 'aimanagement', label: 'AI管理', icon: 'ai', roles: ['平台运维人员', '机构管理员'], single: true, file: 'AI管理 - 留学申请管理系统.html' }
  ];

  /* ---------------- 页面级权限（RBAC） ---------------- */
  var PAGE_PERMS = {
    '管理员工作台 - 留学申请管理系统.html': ROLES.slice(),
    '项目经理工作台 - 留学申请管理系统.html': ['项目经理'],
    '学生档案列表页 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '销售人员管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核'],
    '学生档案详情页 - 留学申请管理系统.html': ['平台运维人员', '机构管理员', '销售人员管理员', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核'],
    '项目池列表页 - 留学申请管理系统.html': ['机构管理员', '项目经理'],
    '项目详情页 - 留学申请管理系统.html': ['机构管理员'],
    'PMO看板 - 留学申请管理系统.html': ['机构管理员'],
    '我的项目列表页 - 留学申请管理系统.html': ['项目经理'],
    '我的项目详情页 - 留学申请管理系统.html': ['项目经理'],
    '任务列表页 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '文书编辑器 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '模板库列表 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '模板库编辑 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '案例库 - 文书交付系统.html': ['文书人员', '文书机构管理员'],
    '网申任务列表页 - 留学申请管理系统.html': ['网申人员', '项目经理'],
    '网申任务详情页 - 留学申请管理系统.html': ['网申人员', '项目经理'],
    '网申模板库 - 留学申请管理系统.html': ['网申人员', '项目经理'],
    '监控任务列表 - PBS留学CRM.html': ['项目经理'],
    '监控详情页 - 留学申请管理系统.html': ['项目经理'],
    '结项归档列表 - PBS留学CRM系统.html': ['项目经理', '文书人员', '网申人员'],
    '结项详情页 - 留学申请管理系统.html': ['项目经理', '文书人员', '网申人员'],
    '用户管理 - 留学申请管理系统.html': ['平台运维人员'],
    '机构管理 - PBS留学CRM系统.html': ['平台运维人员'],
    '人员管理 - PBS留学CRM系统.html': ['平台运维人员', '机构管理员'],
    '角色权限管理 - 留学申请管理系统.html': ['平台运维人员'],
    '操作日志审计 - 留学申请管理系统.html': ['平台运维人员'],
    'AI管理 - 留学申请管理系统.html': ['平台运维人员', '机构管理员'],
    '业务流程图 - 留学申请管理系统.html': ROLES.slice(),
    '文书审核列表页 - 留学申请管理系统.html': ['文书审核'],
    '文书审核详情页 - 留学申请管理系统.html': ['文书审核'],
    '选校订单池页 - 留学申请管理系统.html': ['机构管理员', '销售人员管理员', '销售人员'],
    '选校任务列表页 - 留学申请管理系统.html': ['机构管理员', '销售人员管理员', '销售人员'],
    '选校工作台页 - 留学申请管理系统.html': ['销售人员管理员', '销售人员'],
    '选校方案详情页 - 留学申请管理系统.html': ['销售人员', '销售人员管理员', '机构管理员']
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
    var effective = {};
    Object.keys(session || {}).forEach(function (key) { effective[key] = session[key]; });
    effective.previewRole = previewRole;
    effective.previewLabel = previewRole === 'all' ? '全部角色' : previewRole;
    effective.role = previewRole === 'all' ? '超级管理员' : previewRole;
    return effective;
  }
  window.pbsGetSession = function () {
    var session = getSession();
    if (!session || !session.role) {
      session = { account: 'demo_admin', name: '演示管理员', role: '超级管理员', org: 'PBS留学', email: 'demo@pbs.local' };
    }
    return withPreviewRole(session);
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

  function renderSidebar(session, file) {
    var aside = document.getElementById('pbs-sidebar');
    if (!aside) return;
    var role = session.role;
    var workbenchFile = ROLE_WORKBENCH[role];

    var html = '<nav class="p-4 space-y-1 flex-1">';
    MENUS.forEach(function (m) {
      if (!roleCanAccess(role, m.roles)) return;

      if (m.single) { /* 单项直链菜单（工作台首页 / 人员管理） */
        var target = m.file || workbenchFile;
        var active = (file === target);
        html += '<a href="' + encodeURI(target) + '" class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ' +
          (active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50') + '">' +
          svgIcon(ICONS[m.icon], 'w-5 h-5') + '<span>' + m.label + '</span></a>';
        return;
      }

      /* 分组菜单 */
      var children = (m.children || []).filter(function (c) {
        return !c.roles || roleCanAccess(role, c.roles);
      });
      if (!children.length) return;

      var groupActive = children.some(function (c) {
        return c.file === file && (!c.href || new URLSearchParams(location.search).get('mode') === 'catalog');
      });
      html += '<div><div class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium ' +
        (groupActive ? 'text-blue-700' : 'text-gray-700') + '">' +
        svgIcon(ICONS[m.icon], 'w-5 h-5 ' + (groupActive ? 'text-blue-600' : 'text-gray-400')) +
        '<span>' + m.label + '</span></div>';
      html += '<div class="ml-8 mt-1 space-y-1">';
      children.forEach(function (c) {
        var cActive = c.file === file && (!c.href || new URLSearchParams(location.search).get('mode') === 'catalog');
        var childTarget = c.href || c.file;
        html += '<a href="' + encodeURI(childTarget) + '" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ' +
          (cActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800') + '">' +
          '<span class="w-1.5 h-1.5 rounded-full ' + (cActive ? 'bg-blue-600' : 'bg-gray-300') + '"></span>' +
          c.label + '</a>';
      });
      html += '</div></div>';
    });
    html += '</nav>';

    /* 底部角色卡片 */
    html += '<div class="p-4 border-t border-gray-100">' +
      '<div class="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">' +
      '<div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">' +
      '<span class="text-white text-sm font-medium">' + session.name.charAt(0) + '</span></div>' +
      '<div class="min-w-0"><p class="text-sm font-semibold text-gray-800 truncate">' + session.name + '</p>' +
      '<p class="text-xs text-blue-600 truncate">' + (session.previewLabel || session.role) + '</p></div></div></div>';

    aside.innerHTML = html;
    if (aside.className.indexOf('flex') < 0) {
      aside.className += ' flex flex-col';
    }
  }

  /* ---------------- 顶栏用户区 ---------------- */
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
    var options = '<option value="all">全部角色</option>';
    ROLES.forEach(function (role) {
      options += '<option value="' + role + '">' + role + '</option>';
    });
    wrapper.innerHTML = '<span class="pbs-role-switcher-label">角色视角</span>' +
      '<select aria-label="切换角色视角">' + options + '</select>';
    var select = wrapper.querySelector('select');
    select.value = session.previewRole || 'all';
    select.addEventListener('change', function () {
      var role = select.value;
      try { localStorage.setItem(PREVIEW_ROLE_KEY, role); } catch (e) {}
      if (role === 'all') {
        location.href = ROLE_WORKBENCH['超级管理员'];
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
    if (texts[1]) {
      texts[1].textContent = (session.previewLabel || session.role) + (session.org ? ' · ' + session.org : '');
    } else if (texts[0] && !userArea.querySelector('.pbs-role-badge')) {
      /* 无副标题时补角色徽章 */
      var badge = document.createElement('span');
      badge.className = 'pbs-role-badge hidden sm:inline-block text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium';
      badge.textContent = session.previewLabel || session.role;
      userArea.insertBefore(badge, avatarSpan.parentElement);
    }

    /* 用户菜单：已有则更新内容，没有则注入标准菜单 */
    var menu = userArea.querySelector('#userMenu') || document.getElementById('userMenu');
    if (menu) {
      var nameP = menu.querySelector('p.font-semibold');
      if (nameP) nameP.textContent = session.name;
      var mailP = menu.querySelector('p.text-xs.text-gray-500');
      if (mailP) mailP.textContent = session.email || '';
      if (nameP && !menu.querySelector('.pbs-menu-role')) {
        var roleLine = document.createElement('p');
        roleLine.className = 'pbs-menu-role text-xs text-blue-600 mt-0.5';
        roleLine.textContent = (session.previewLabel || session.role) + (session.org ? ' · ' + session.org : '');
        nameP.parentNode.appendChild(roleLine);
      }
      var av = menu.querySelector('.w-10.h-10 span');
      if (av) av.textContent = session.name.charAt(0);
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

  /* 退出登录 / 个人设置（事件委托，兼容所有页面） */
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
    }
  }, true);

  /* 通知按钮兜底：页面无内嵌通知弹窗时，用弹层打开系统消息 */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-dom-id="btn-notification"]');
    if (b && !document.getElementById('notificationModal')) {
      e.preventDefault();
      window.pbsOpenOverlay('系统消息弹窗.html', { width: '560px' });
    }
  });

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

  /* 越权访问提示（非阻塞） */
  function showForbiddenToast(role) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.45);';
    el.innerHTML =
      '<div style="background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:36px 44px;text-align:center;max-width:380px;">' +
      '<div style="width:56px;height:56px;margin:0 auto 16px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
      '<svg style="width:28px;height:28px;color:#EF4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>' +
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
    if (!session || !session.role) { session = { account: 'demo_admin', name: '演示管理员', role: '超级管理员', org: 'PBS留学', email: 'demo@pbs.local' }; }
    session = withPreviewRole(session);
    /* 页面级RBAC（超级管理员放行所有页面） */
    var perms = PAGE_PERMS[file];
    if (perms && !roleCanAccess(session.role, perms)) {
      showForbiddenToast(session.role);
      setTimeout(function () { location.replace(ROLE_WORKBENCH[session.role]); }, 1200);
      return;
    }
    renderSidebar(session, file);
    bindHeader(session);
    var w = PAGE_WIRING[file];
    if (w) { try { w(session); } catch (e) { console.error(e); } }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
