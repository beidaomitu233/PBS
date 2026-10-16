/* ============================================================
   PBS留学CRM系统 - 全站共享脚本
   会话管理 / RBAC角色权限 / 动态侧边栏 / 顶栏用户区 / 弹层组件
   ============================================================ */
(function () {
  'use strict';

  var SESSION_KEY = 'pbs_session_v1';
  var PREVIEW_ROLE_KEY = 'pbs_role_preview_v51';

  /* ---------------- 角色定义 ---------------- */
  var ROLES = ['超级管理员', '平台运维人员', '机构管理员', 'PMO', '销售人员管理员', '销售人员', '项目经理',
    '文书人员', '网申人员', '文书审核', '文书机构管理员'];

  /* 角色严格隔离：多角色账号按实际被授予的角色取权限并集，不再通过管理岗位自动继承执行岗位。 */
  var ROLE_INHERITANCE = {};
  function roleCanAccess(role, allowedRoles) {
    var roles = Array.isArray(role) ? role : [role];
    if (roles.indexOf('超级管理员') >= 0) return true;
    if (!allowedRoles || !allowedRoles.length) return false;
    return roles.some(function (candidate) { return allowedRoles.indexOf(candidate) >= 0; });
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
    'PMO': 'PMO工作台 - 留学申请管理系统.html',
    '销售人员管理员': '选校任务列表页 - 留学申请管理系统.html#workbench',
    '销售人员': '选校任务列表页 - 留学申请管理系统.html#workbench',
    '项目经理': '项目经理工作台 - 留学申请管理系统.html',
    '文书人员': '任务列表页 - 文书交付系统.html#workbench',
    '网申人员': '网申任务列表页 - 留学申请管理系统.html#workbench',
    '文书审核': '文书审核列表页 - 留学申请管理系统.html#workbench',
    '文书机构管理员': '任务列表页 - 文书交付系统.html#workbench'
  };

  /* 每一种工作台都是独立权限；同一角色可按需获得多个工作台视角。 */
  var WORKBENCH_ROLE_PERMISSION = {
    '平台运维人员': 'workbench_platform',
    '机构管理员': 'workbench_org_admin',
    'PMO': 'workbench_pmo',
    '销售人员管理员': 'workbench_sales_manager',
    '销售人员': 'workbench_sales',
    '项目经理': 'workbench_pm',
    '文书人员': 'workbench_writer',
    '网申人员': 'workbench_apply',
    '文书审核': 'workbench_audit',
    '文书机构管理员': 'workbench_docadmin'
  };
  var WORKBENCH_KEY_PERMISSION = {
    pmo: 'workbench_pmo', pm: 'workbench_pm', writer: 'workbench_writer',
    salesmanager: 'workbench_sales_manager', sales: 'workbench_sales', apply: 'workbench_apply', audit: 'workbench_audit',
    platform: 'workbench_platform', orgadmin: 'workbench_org_admin',
    docadmin: 'workbench_docadmin'
  };

  /* ============================================================
     权限模型：按「页面 → 权限项」组织
     - 每个业务页面独立成组，组 id 即权限存储的键
     - 每组第一项恒为「列表展示」，其余为该页面上真实存在的操作
     - 纯展示控件（搜索/重置/分页/关闭弹窗）不做权限项，避免无意义的配置噪音
     - 权限项 id 全局唯一；跨页面同名操作按页面拆分为独立 id，便于逐页精细授权
     ============================================================ */
  var PERMISSION_TREE = [];
  function definePermissionPage(module, id, name, file, items) {
    PERMISSION_TREE.push({ module: module, id: id, name: name, file: file || '', items: items });
  }

  /* 历史默认授权快照已移除；旧配置统一通过下方权限别名迁移。 */

  definePermissionPage('工作台', 'wb_home', '工作台首页', '', [
    { id: 'workbench_platform', label: '平台运维工作台', desc: '可见平台运维视角' },
    { id: 'workbench_pmo', label: 'PMO工作台', desc: '订单目标统筹与结项核验' },
    { id: 'workbench_org_admin', label: '机构管理员工作台', desc: '可见机构运营视角' },
    { id: 'workbench_sales_manager', label: '销售人员管理员工作台', desc: '可见选校团队管理视角' },
    { id: 'workbench_pm', label: '项目经理工作台', desc: '可见项目经理视角' },
    { id: 'workbench_sales', label: '销售人员工作台', desc: '可见销售视角' },
    { id: 'workbench_writer', label: '文书人员工作台', desc: '可见文书交付视角' },
    { id: 'workbench_apply', label: '网申人员工作台', desc: '可见网申视角' },
    { id: 'workbench_audit', label: '文书审核工作台', desc: '可见审核视角' },
    { id: 'workbench_docadmin', label: '文书机构管理员工作台', desc: '可见文书管理视角' }
  ]);

  definePermissionPage('学生档案', 'student_list', '学生档案列表页', '学生档案列表页 - 留学申请管理系统.html', [
    { id: 'customer_view', label: '列表展示' },
    { id: 'customer_manage', label: '管理学生档案' },
    { id: 'customer_export', label: '导出档案数据' }
  ]);
  definePermissionPage('学生档案', 'student_detail', '学生档案详情页', '学生档案详情页 - 留学申请管理系统.html', [
    { id: 'customer_view_detail', label: '列表展示' },
    { id: 'customer_edit', label: '维护档案详情' }
  ]);

  /* ToB SaaS 边界：角色权限 / 操作日志 / AI / 视频只属于平台运维侧。
     所有机构业务角色均不得持有这些页面的权限项，也看不到对应菜单与页面。 */
  var PLATFORM_ONLY_SYSTEM_ROLES = [
    '机构管理员', 'PMO', '销售人员管理员', '销售人员', '项目经理', '文书人员',
    '网申人员', '文书审核', '文书机构管理员'
  ];
  var PLATFORM_ONLY_PAGE_GROUPS = ['role_perm', 'op_log', 'ai_admin', 'video_admin'];

  definePermissionPage('PMO监控台', 'project_pool', '项目池列表页', '项目池列表页 - 留学申请管理系统.html', [
    { id: 'project_view', label: '列表展示' },
    { id: 'order_assign_pmo', label: '分配订单 PMO' },
    { id: 'project_create', label: '新建线下项目', desc: '创建线下项目档案及购买服务' }
  ]);
  definePermissionPage('PMO监控台', 'project_detail', '项目详情页', '项目详情页 - 留学申请管理系统.html', [
    { id: 'project_view_detail', label: '列表展示' },
    { id: 'project_team_manage', label: '管理团队' },
    { id:'order_view', label:'查看订单目标' }, { id:'order_assign_pm', label:'分配院校目标项目经理' }
  ]);
  definePermissionPage('PMO监控台', 'goal_detail', '院校目标详情页', '院校目标详情页 - 留学申请管理系统.html', [
    { id: 'goal_view', label: '列表展示' },
    { id: 'goal_team_manage', label: '管理目标任务分配' },
    { id: 'goal_complete', label: '确认完成任务' }
  ]);

  definePermissionPage('项目管理', 'my_project_list', '我的项目列表页', '我的项目列表页 - 留学申请管理系统.html', [
    { id: 'my_project_view', label: '列表展示' },
    { id: 'my_project_handle', label: '处理项目接收' }
  ]);
  definePermissionPage('项目管理', 'my_project_detail', '我的项目详情页', '我的项目详情页 - 留学申请管理系统.html', [
    { id: 'my_project_view_detail', label: '列表展示' },
    { id: 'my_project_team_manage', label: '管理项目成员' },
    { id: 'my_project_complete', label: '完成任务' }
  ]);

  definePermissionPage('文书交付', 'doc_task_list', '任务列表页', '任务列表页 - 文书交付系统.html', [
    { id: 'doc_view', label: '列表展示' },
    { id: 'doc_task_handle', label: '处理文书任务' }
  ]);
  definePermissionPage('文书交付', 'doc_editor', '文书编辑器', '文书编辑器 - 文书交付系统.html', [
    { id: 'doc_editor_view', label: '列表展示' },
    { id: 'doc_edit', label: '编辑文书' },
    { id: 'doc_download', label: '导出与下载文书' },
    { id: 'doc_submit', label: '提交文书任务' }
  ]);
  definePermissionPage('文书交付', 'doc_template_list', '模板库列表', '模板库列表 - 文书交付系统.html', [
    { id: 'library_view', label: '列表展示' },
    { id: 'library_manage', label: '管理模板' },
    { id: 'library_export', label: '导出与下载模板' }
  ]);
  definePermissionPage('文书交付', 'doc_template_edit', '模板库编辑', '模板库编辑 - 文书交付系统.html', [
    { id: 'doc_template_edit_view', label: '列表展示' },
    { id: 'doc_template_save', label: '编辑并保存模板' }
  ]);
  definePermissionPage('文书交付', 'doc_case_list', '案例库', '案例库 - 文书交付系统.html', [
    { id: 'case_view', label: '列表展示' },
    { id: 'case_manage', label: '管理案例' },
    { id: 'case_export', label: '导出与下载案例' }
  ]);

  definePermissionPage('文书审核', 'doc_review_list', '文书审核列表页', '文书审核列表页 - 留学申请管理系统.html', [
    { id: 'doc_review', label: '列表展示' },
    { id: 'review_task_handle', label: '处理审核任务' }
  ]);
  definePermissionPage('文书审核', 'doc_review_detail', '文书审核详情页', '文书审核详情页 - 留学申请管理系统.html', [
    { id: 'review_view_detail', label: '列表展示' },
    { id: 'review_score', label: '评审文书' },
    { id: 'review_decide', label: '提交审核结论' },
    { id: 'review_download', label: '下载与导出文书' }
  ]);

  definePermissionPage('网申管理', 'app_task_list', '网申任务列表页', '网申任务列表页 - 留学申请管理系统.html', [
    { id: 'app_view', label: '列表展示' },
    { id: 'app_task_handle', label: '处理网申任务' }
  ]);
  definePermissionPage('网申管理', 'app_task_detail', '网申任务详情页', '网申任务详情页 - 留学申请管理系统.html', [
    { id: 'app_view_detail', label: '列表展示' },
    { id: 'app_fill', label: '维护网申内容' },
    { id: 'app_submit', label: '提交申请与更新结果' }
  ]);
  definePermissionPage('网申管理', 'app_template_list', '网申模板库', '网申模板库 - 留学申请管理系统.html', [
    { id: 'app_library_view', label: '列表展示' },
    { id: 'app_library_manage', label: '管理网申模板' },
    { id: 'app_library_export', label: '导出与下载模板' }
  ]);
  definePermissionPage('网申管理', 'app_template_publish', '网申模板发布中心', '网申模板发布中心 - 留学申请管理系统.html', [{ id:'app_template_publish', label:'维护与发布平台模板' }]);
  definePermissionPage('网申管理', 'app_template_edit', '网申模板编辑', '网申模板编辑 - 留学申请管理系统.html', [
    { id: 'app_template_edit_view', label: '列表展示' },
    { id: 'app_template_save', label: '编辑并保存模板' }
  ]);

  definePermissionPage('监控管理', 'monitor_list', '监控任务列表', '监控任务列表 - PBS留学CRM.html', [
    { id: 'monitor_view', label: '列表展示' },
    { id: 'monitor_track', label: '手动触发监控' }
  ]);
  definePermissionPage('监控管理', 'monitor_detail', '监控详情页', '监控详情页 - 留学申请管理系统.html', [
    { id: 'monitor_detail_view', label: '列表展示' }
  ]);
  definePermissionPage('监控管理', 'monitor_detail_site', '监控详情页（官网）', '监控详情页（官网） - 留学申请管理系统.html', [
    { id: 'monitor_site_view', label: '列表展示' },
    { id: 'monitor_site_manage', label: '维护官网监控' }
  ]);
  definePermissionPage('监控管理', 'monitor_detail_mail', '监控详情页（邮件）', '监控详情页（邮件） - 留学申请管理系统.html', [
    { id: 'monitor_mail_view', label: '列表展示' },
    { id: 'monitor_mail_manage', label: '维护邮件监控' }
  ]);

  definePermissionPage('结项归档', 'archive_list', '结项归档列表', '结项归档列表 - PBS留学CRM系统.html', [
    { id: 'archive_view', label: '列表展示' }
  ]);
  definePermissionPage('结项归档', 'archive_detail', '结项详情页', '结项详情页 - 留学申请管理系统.html', [
    { id: 'archive_view_detail', label: '列表展示' },
    { id: 'archive_create', label: '编制结项材料' },
    { id: 'archive_submit', label: '提交结项材料' },
    { id: 'archive_approve', label: '确认结项' }
  ]);

  definePermissionPage('选校管理', 'school_task_list', '选校任务列表页', '选校任务列表页 - 留学申请管理系统.html', [
    { id: 'school_task', label: '列表展示' },
    { id: 'school_task_manage', label: '管理选校任务' }
  ]);
  definePermissionPage('选校管理', 'school_workspace', '选校工作台页', '选校工作台页 - 留学申请管理系统.html', [
    { id: 'school_plan', label: '列表展示' },
    { id: 'school_plan_manage', label: '维护选校方案' },
    { id: 'school_plan_share', label: '分享方案给客户' }
  ]);
  definePermissionPage('选校管理', 'school_plan_empty', '选校方案未生成', '选校方案未生成 - 留学申请管理系统.html', [
    { id: 'school_plan_empty_view', label: '列表展示' }
  ]);
  definePermissionPage('选校管理', 'school_share_h5', '选校方案分享H5', '选校方案分享H5 - PBS留学.html', [
    { id: 'school_share_view', label: '列表展示', desc: '客户端方案预览' }
  ]);

  definePermissionPage('机构与成员', 'org_list', '机构管理', '机构管理 - PBS留学CRM系统.html', [
    { id: 'sys_org', label: '列表展示' }
  ]);
  definePermissionPage('机构与成员', 'personnel_list', '人员管理', '人员管理 - PBS留学CRM系统.html', [
    { id: 'personnel_view', label: '列表展示' },
    { id: 'personnel_manage', label: '管理成员' },
    { id: 'personnel_assign_roles', label: '配置成员角色', desc: '控制新增或编辑成员时可选择的角色' }
  ]);

  definePermissionPage('系统管理', 'role_perm', '角色权限管理', '角色权限管理 - 留学申请管理系统.html', [
    { id: 'sys_role', label: '列表展示' },
    { id: 'sys_role_manage', label: '管理角色与授权' }
  ]);
  definePermissionPage('系统管理', 'op_log', '操作日志审计', '操作日志审计 - 留学申请管理系统.html', [
    { id: 'sys_log', label: '列表展示' },
    { id: 'sys_log_export', label: '导出日志' }
  ]);
  definePermissionPage('系统管理', 'ai_admin', 'AI管理', 'AI管理 - 留学申请管理系统.html', [
    { id: 'ai_view', label: '列表展示' },
    { id: 'ai_manage', label: '管理 AI 配置' }
  ]);
  definePermissionPage('系统管理', 'video_admin', '视频管理', '视频管理 - 留学申请管理系统.html', [
    { id: 'video_view', label: '列表展示' },
    { id: 'video_manage', label: '管理视频' }
  ]);

  /* ---------- 权限树派生索引 ---------- */
  var PERMISSION_GROUP_OF = {};   /* 权限项 id → 所属页面分组 id */
  var PERMISSION_GROUP_IDS = [];  /* 全部页面分组 id */
  var PAGE_VIEW_PERMISSION = {};  /* 页面文件名 → 该页「列表展示」权限项 id */
  PERMISSION_TREE.forEach(function (group) {
    PERMISSION_GROUP_IDS.push(group.id);
    group.items.forEach(function (item) { PERMISSION_GROUP_OF[item.id] = group.id; });
    if (group.file && group.items.length) PAGE_VIEW_PERMISSION[group.file] = group.items[0].id;
  });
  function permissionGroupIds(ids) {
    /* 把扁平的权限项 id 列表还原成 { 页面分组: [id...] } 的存储结构 */
    var out = {};
    PERMISSION_GROUP_IDS.forEach(function (groupId) { out[groupId] = []; });
    (ids || []).forEach(function (id) {
      var groupId = PERMISSION_GROUP_OF[id];
      if (groupId && out[groupId].indexOf(id) < 0) out[groupId].push(id);
    });
    return out;
  }

  /* ---------- 内置角色的默认授权（扁平权限项列表） ----------
     语义与旧版一一对应；机构侧角色一律不含系统管理类页面。 */
  var ROLE_DEFAULT_GRANTS = {
    '平台运维人员': [
      'workbench_platform', 'app_template_publish',
      'library_view', 'library_manage', 'library_export', 'doc_template_edit_view', 'doc_template_save',
      'case_view', 'case_manage', 'case_export',
      'app_library_view', 'app_library_manage', 'app_library_export', 'app_template_edit_view', 'app_template_save',
      'sys_org',
      'personnel_view', 'personnel_manage', 'personnel_assign_roles',
      'sys_role', 'sys_role_manage', 'sys_log', 'sys_log_export',
      'ai_view', 'ai_manage', 'video_view', 'video_manage'
    ],
    '机构管理员': [
      'workbench_org_admin',
      'customer_view', 'customer_view_detail',
      'project_view', 'project_create', 'project_view_detail', 'project_team_manage', 'order_assign_pmo', 'order_view',
      'goal_view', 'goal_team_manage',
      'doc_view', 'doc_editor_view',
      'library_view', 'doc_template_edit_view', 'case_view',
      'app_view', 'app_view_detail', 'app_library_view', 'app_template_edit_view',
      'monitor_view', 'monitor_track', 'monitor_detail_view',
      'monitor_site_view', 'monitor_site_manage', 'monitor_mail_view', 'monitor_mail_manage',
      'school_task', 'school_task_manage', 'school_plan_empty_view',
      'archive_view', 'archive_view_detail',
      'personnel_view', 'personnel_manage', 'personnel_assign_roles'
    ],
    '销售人员管理员': [
      'workbench_sales_manager',
      'school_task', 'school_task_manage', 'school_plan_empty_view'
    ],
    '销售人员': [
      'workbench_sales',
      'customer_view', 'customer_manage', 'customer_view_detail', 'customer_edit',
      'school_task', 'school_task_manage',
      'school_plan', 'school_plan_manage', 'school_plan_share', 'school_plan_empty_view', 'school_share_view'
    ],
    '项目经理': [
      'workbench_pm',
      'customer_view', 'customer_manage', 'customer_view_detail', 'customer_edit',
      'my_project_view', 'my_project_handle', 'my_project_view_detail', 'my_project_team_manage', 'my_project_complete',
      'goal_view', 'goal_team_manage', 'goal_complete',
      'doc_view', 'doc_editor_view',
      'app_view', 'app_view_detail', 'app_library_view', 'app_template_edit_view',
      'monitor_view', 'monitor_track', 'monitor_detail_view',
      'monitor_site_view', 'monitor_site_manage', 'monitor_mail_view', 'monitor_mail_manage',
      'archive_view', 'archive_view_detail', 'archive_create', 'archive_submit'
    ],
    '文书人员': [
      'workbench_writer',
      'customer_view', 'customer_view_detail',
      'doc_view', 'doc_task_handle',
      'doc_editor_view', 'doc_edit', 'doc_download', 'doc_submit',
      'library_view', 'library_manage', 'library_export', 'doc_template_edit_view', 'doc_template_save',
      'case_view', 'case_manage', 'case_export',
      'archive_view', 'archive_view_detail'
    ],
    '网申人员': [
      'workbench_apply',
      'customer_view', 'customer_view_detail', 'customer_edit',
      'app_view', 'app_task_handle', 'app_view_detail', 'app_fill', 'app_submit',
      'app_library_view', 'app_library_manage', 'app_library_export', 'app_template_edit_view', 'app_template_save',
      'archive_view', 'archive_view_detail'
    ],
    '文书审核': [
      'workbench_audit',
      'customer_view', 'customer_view_detail',
      'doc_review', 'review_task_handle',
      'review_view_detail', 'review_score', 'review_decide', 'review_download'
    ],
    '文书机构管理员': [
      'workbench_docadmin',
      'customer_view', 'customer_view_detail',
      'doc_view',
      'doc_editor_view', 'doc_edit', 'doc_download', 'doc_submit',
      'library_view', 'library_manage', 'library_export', 'doc_template_edit_view', 'doc_template_save',
      'case_view', 'case_manage', 'case_export',
      'doc_review', 'review_view_detail', 'review_score', 'review_decide', 'review_download',
      'personnel_view', 'personnel_manage', 'personnel_assign_roles'
    ]
  };

  /* 角色权限页尚未保存配置时使用的默认权限；保存后完全以页面配置为准。 */
  ROLE_DEFAULT_GRANTS.PMO = ROLE_DEFAULT_GRANTS['机构管理员'].filter(function(id) { return id !== 'workbench_org_admin' && id !== 'order_assign_pmo'; }).concat(['workbench_pmo','order_assign_pm','customer_edit','archive_create','archive_approve','my_project_view','my_project_view_detail','my_project_team_manage']);
  var DEFAULT_ROLE_PERMISSIONS = {};
  Object.keys(ROLE_DEFAULT_GRANTS).forEach(function (role) {
    DEFAULT_ROLE_PERMISSIONS[role] = permissionGroupIds(ROLE_DEFAULT_GRANTS[role]);
  });

  var PLATFORM_FORBIDDEN_PERMISSIONS = ['monitor_view', 'monitor_track', 'monitor_detail_view', 'monitor_site_view', 'monitor_site_manage', 'monitor_mail_view', 'monitor_mail_manage'];
  var REQUIRED_ROLE_PERMISSIONS = {
    '机构管理员': ['customer_view', 'project_view', 'order_assign_pmo', 'order_view', 'doc_view', 'doc_editor_view', 'library_view', 'doc_template_edit_view', 'case_view', 'app_view', 'app_view_detail', 'app_library_view', 'app_template_edit_view', 'monitor_view', 'archive_view', 'archive_view_detail'],
    '项目经理': ['my_project_view', 'doc_view', 'doc_editor_view', 'app_view', 'app_view_detail', 'monitor_view', 'archive_view', 'archive_view_detail', 'archive_submit']
  };

  /* 旧权限项 id → 新权限项 id：用于迁移 localStorage 中已保存的历史配置，
     保证升级后各角色的实际可操作范围不变。 */
  var LEGACY_PERMISSION_ALIASES = {
    wb_urge: [],
    wb_message: [],
    customer_view: ['customer_view', 'customer_view_detail'],
    customer_add: ['customer_manage'],
    customer_import: ['customer_manage'],
    customer_delete: ['customer_manage'],
    customer_edit: ['customer_edit'],
    customer_field: ['customer_edit'],
    customer_experience: ['customer_edit'],
    customer_credential: ['customer_edit'],
    customer_upload: ['customer_edit'],
    customer_item_delete: ['customer_edit'],
    project_view: ['project_view', 'my_project_view'],
    project_view_detail: ['project_view_detail', 'my_project_view_detail', 'goal_view'],
    project_assign_pm: ['project_team_manage'],
    project_detail_assign_pm: ['project_team_manage'],
    project_change_pm: ['project_team_manage'],
    project_assign_member: ['project_team_manage', 'my_project_team_manage', 'goal_team_manage'],
    project_change_member: ['project_team_manage', 'my_project_team_manage', 'goal_team_manage'],
    project_assign: ['project_team_manage', 'my_project_team_manage', 'goal_team_manage'],
    task_receive: ['my_project_handle', 'doc_task_handle', 'review_task_handle', 'app_task_handle'],
    task_reject: ['my_project_handle', 'doc_task_handle', 'review_task_handle', 'app_task_handle'],
    task_urge: [],
    task_complete: ['goal_complete', 'my_project_complete', 'doc_submit', 'review_decide'],
    project_pool_urge: [],
    goal_urge: [],
    my_project_urge: [],
    my_project_detail_urge: [],
    doc_task_urge: [],
    review_urge: [],
    app_urge: [],
    doc_view: ['doc_view', 'doc_editor_view'],
    doc_task_open_editor: ['doc_editor_view'],
    doc_upload: ['doc_edit'],
    doc_edit: ['doc_editor_view', 'doc_edit'],
    doc_ai: ['doc_edit'],
    doc_apply_template: ['doc_edit'],
    doc_review: ['doc_review', 'review_view_detail', 'review_score'],
    doc_download: ['doc_download', 'review_download'],
    library_view: ['library_view', 'doc_template_edit_view', 'case_view', 'app_library_view', 'app_template_edit_view'],
    library_create: ['library_manage', 'case_manage', 'app_library_manage'],
    library_edit: ['doc_template_edit_view', 'doc_template_save'],
    library_delete: ['library_manage', 'case_manage', 'app_library_manage'],
    library_import: ['library_manage', 'case_manage', 'app_library_manage'],
    library_export: ['library_export', 'case_export', 'app_library_export'],
    case_upload: ['case_manage'],
    case_parse: ['case_manage'],
    case_to_template: ['case_manage'],
    case_delete: ['case_manage'],
    review_ai: ['review_score'],
    review_receive: ['review_task_handle'],
    review_reject: ['review_task_handle'],
    review_pass: ['review_decide'],
    review_return: ['review_decide'],
    app_view: ['app_view', 'app_view_detail'],
    app_receive: ['app_task_handle'],
    app_reject: ['app_task_handle'],
    app_fill: ['app_fill'],
    app_ev_import: ['app_fill'],
    app_upload: ['app_fill'],
    app_create: ['app_fill'],
    app_library_create: ['app_library_manage'],
    app_library_delete: ['app_library_manage'],
    app_library_import: ['app_library_manage'],
    app_library_edit: ['app_template_edit_view', 'app_template_save'],
    monitor_view: ['monitor_view', 'monitor_detail_view', 'monitor_site_view', 'monitor_mail_view'],
    monitor_track: ['monitor_track', 'monitor_site_manage', 'monitor_mail_manage'],
    monitor_alert: ['monitor_site_manage', 'monitor_mail_manage'],
    monitor_report: ['monitor_detail_view'],
    monitor_detail_track: ['monitor_track'],
    monitor_site_track: ['monitor_track'],
    monitor_mail_track: ['monitor_track'],
    monitor_site_alert: [],
    monitor_mail_alert: [],
    monitor_site_config: ['monitor_site_manage'],
    monitor_site_upload: ['monitor_site_manage'],
    monitor_mail_config: ['monitor_mail_manage'],
    monitor_mail_upload: ['monitor_mail_manage'],
    archive_view: ['archive_view', 'archive_view_detail'],
    archive_create: ['archive_create'],
    archive_report: ['archive_create'],
    school_task: ['school_task', 'school_plan_empty_view'],
    school_task_create: ['school_task_manage'],
    school_task_status: ['school_task_manage'],
    school_task_open: ['school_plan'],
    school_plan: ['school_plan', 'school_plan_manage'],
    school_catalog: ['school_plan'],
    school_plan_edit: ['school_plan_manage'],
    school_plan_save: ['school_plan_manage'],
    school_communication: ['school_plan_manage'],
    school_plan_share: ['school_plan_share', 'school_share_view'],
    personnel_add: ['personnel_manage'],
    personnel_edit: ['personnel_manage'],
    personnel_status: ['personnel_manage'],
    personnel_account: ['personnel_manage'],
    org_view_members: ['personnel_view'],
    sys_user: ['personnel_view', 'personnel_manage'],
    sys_org: ['sys_org', 'personnel_view'],
    sys_role: ['sys_role', 'sys_role_manage'],
    sys_role_create: ['sys_role_manage'],
    sys_role_delete: ['sys_role_manage'],
    sys_role_save: ['sys_role_manage'],
    sys_log: ['sys_log', 'sys_log_export'],
    sys_log_detail: ['sys_log'],
    sys_personnel: ['personnel_view', 'personnel_manage', 'personnel_assign_roles'],
    ai_model: ['ai_manage'],
    ai_key: ['ai_manage'],
    ai_prompt: ['ai_manage'],
    ai_monitor: ['ai_view'],
    sys_ai: ['ai_view', 'ai_manage'],
    video_upload: ['video_manage'],
    video_policy: ['video_manage'],
    video_reset_first_play: ['video_manage'],
    sys_video: ['video_view', 'video_manage'],
    sys_config: ['ai_view', 'ai_manage', 'video_view', 'video_manage']
  };
  /* 当前页面结构中已移除或合并的权限项：读取旧保存数据时迁移到保留能力。 */
  var REMOVED_PERMISSION_ALIASES = {
    wb_urge: [],
    wb_message: [],
    customer_add: ['customer_manage'],
    customer_import: ['customer_manage'],
    customer_delete: ['customer_manage'],
    customer_credential: ['customer_edit'],
    customer_upload: ['customer_edit'],
    customer_item_delete: ['customer_edit'],
    customer_field: ['customer_edit'],
    customer_experience: ['customer_edit'],
    project_assign_pm: ['project_team_manage'],
    project_detail_assign_pm: ['project_team_manage'],
    project_pool_urge: [],
    project_change_pm: ['project_team_manage'],
    project_assign_member: ['project_team_manage'],
    project_change_member: ['project_team_manage'],
    goal_assign_member: ['goal_team_manage'],
    goal_change_member: ['goal_team_manage'],
    goal_urge: [],
    my_project_receive: ['my_project_handle'],
    my_project_reject: ['my_project_handle'],
    my_project_urge: [],
    my_project_assign_member: ['my_project_team_manage'],
    my_project_change_member: ['my_project_team_manage'],
    my_project_detail_urge: [],
    doc_task_receive: ['doc_task_handle'],
    doc_task_reject: ['doc_task_handle'],
    doc_task_urge: [],
    doc_task_open_editor: ['doc_editor_view'],
    doc_upload: ['doc_edit'],
    doc_ai: ['doc_edit'],
    doc_apply_template: ['doc_edit'],
    library_create: ['library_manage'],
    library_delete: ['library_manage'],
    library_import: ['library_manage'],
    library_edit: ['doc_template_edit_view', 'doc_template_save'],
    case_upload: ['case_manage'],
    case_parse: ['case_manage'],
    case_to_template: ['case_manage'],
    case_delete: ['case_manage'],
    review_receive: ['review_task_handle'],
    review_reject: ['review_task_handle'],
    review_urge: [],
    review_pass: ['review_decide'],
    review_return: ['review_decide'],
    review_ai: ['review_score'],
    app_receive: ['app_task_handle'],
    app_reject: ['app_task_handle'],
    app_urge: [],
    app_ev_import: ['app_fill'],
    app_upload: ['app_fill'],
    app_create: ['app_fill'],
    app_library_create: ['app_library_manage'],
    app_library_delete: ['app_library_manage'],
    app_library_import: ['app_library_manage'],
    app_library_edit: ['app_template_edit_view', 'app_template_save'],
    monitor_report: ['monitor_detail_view'],
    monitor_detail_track: ['monitor_track'],
    monitor_site_track: ['monitor_track'],
    monitor_mail_track: ['monitor_track'],
    monitor_detail_alert: [],
    monitor_site_alert: [],
    monitor_mail_alert: [],
    monitor_site_config: ['monitor_site_manage'],
    monitor_site_upload: ['monitor_site_manage'],
    monitor_mail_config: ['monitor_mail_manage'],
    monitor_mail_upload: ['monitor_mail_manage'],
    archive_report: ['archive_create'],
    school_task_create: ['school_task_manage'],
    school_task_status: ['school_task_manage'],
    school_task_open: ['school_plan'],
    school_catalog: ['school_plan'],
    school_plan_edit: ['school_plan_manage'],
    school_plan_save: ['school_plan_manage'],
    school_communication: ['school_plan_manage'],
    personnel_add: ['personnel_manage'],
    personnel_edit: ['personnel_manage'],
    personnel_status: ['personnel_manage'],
    personnel_account: ['personnel_manage'],
    org_view_members: ['personnel_view'],
    sys_user: ['personnel_view', 'personnel_manage'],
    sys_role_create: ['sys_role_manage'],
    sys_role_delete: ['sys_role_manage'],
    sys_role_save: ['sys_role_manage'],
    sys_log_detail: ['sys_log'],
    ai_model: ['ai_manage'],
    ai_key: ['ai_manage'],
    ai_prompt: ['ai_manage'],
    ai_monitor: ['ai_view'],
    video_upload: ['video_manage'],
    video_policy: ['video_manage'],
    video_reset_first_play: ['video_manage']
  };
  /* 旧版按业务模块保存时用的分组键；用它判断一份已保存配置是旧结构还是新结构。
     新结构的分组 id（wb_home / student_list / ...）与这些键不重名，判断可靠。 */
  var LEGACY_MODULE_KEYS = ['workbench', 'customer', 'project', 'personnel', 'task', 'document',
    'library', 'application', 'monitor', 'archive', 'school', 'system', 'ai', 'video'];
  function isLegacyPermissionShape(source) {
    return Object.keys(source || {}).some(function (key) { return LEGACY_MODULE_KEYS.indexOf(key) >= 0; });
  }
  /* 旧 id 展开成新 id。注意：只能对「旧结构」的配置做展开——
     新结构下用户可能故意只勾了 project_view 而不勾 my_project_view，
     若无条件展开会在每次读取时把用户取消掉的权限又加回来。 */
  function expandLegacyPermissionIds(ids) {
    var out = [];
    function push(id) { if (PERMISSION_GROUP_OF[id] && out.indexOf(id) < 0) out.push(id); }
    (ids || []).forEach(function (id) {
      var alias = LEGACY_PERMISSION_ALIASES[id];
      if (alias) alias.forEach(push);
      else push(id);
    });
    return out;
  }
  function normalizePermissionIds(ids, legacy) {
    if (legacy) return expandLegacyPermissionIds(ids);
    var out = [];
    function push(id) { if (PERMISSION_GROUP_OF[id] && out.indexOf(id) < 0) out.push(id); }
    (ids || []).forEach(function (id) {
      if (PERMISSION_GROUP_OF[id]) push(id);
      else if (REMOVED_PERMISSION_ALIASES[id]) REMOVED_PERMISSION_ALIASES[id].forEach(push);
      else expandLegacyPermissionIds([id]).forEach(push);
    });
    return out;
  }

  window.pbsPermissionTree = PERMISSION_TREE;
  window.pbsPermissionGroupOf = PERMISSION_GROUP_OF;
  window.pbsDefaultRolePermissions = DEFAULT_ROLE_PERMISSIONS;
  window.pbsPlatformOnlyPageGroups = PLATFORM_ONLY_PAGE_GROUPS;
  window.pbsPlatformOnlySystemRoles = PLATFORM_ONLY_SYSTEM_ROLES;
  window.pbsExpandLegacyPermissionIds = expandLegacyPermissionIds;
  window.pbsNormalizePermissionIds = normalizePermissionIds;
  window.pbsIsLegacyPermissionShape = isLegacyPermissionShape;
  window.pbsPermissionGroupIds = permissionGroupIds;

  /* 组件页（弹窗/抽屉，用于iframe弹层，不做权限校验与侧边栏渲染） */
  var COMPONENT_PAGES = ['新增用户弹窗.html', '新增人员弹窗.html', '新增角色弹窗.html', '系统消息弹窗.html'];

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
    { key: 'student', label: '学生档案', icon: 'idcard', permission: 'customer_view',
      roles: ['机构管理员', 'PMO', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员'],
      children: [{ label: '学生档案列表', file: '学生档案列表页 - 留学申请管理系统.html' }] },
    { key: 'pmo', label: 'PMO监控台', icon: 'folder', permission: 'project_view', roles: ['机构管理员', 'PMO'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html' }] },
    { key: 'project', label: '项目管理', icon: 'folder', permission: 'my_project_view', roles: ['项目经理'],
      children: [
        { label: '项目池列表', file: '项目池列表页 - 留学申请管理系统.html', permission: 'project_view', roles: ['机构管理员', 'PMO'] },
        { label: '我的项目列表', file: '我的项目列表页 - 留学申请管理系统.html', permission: 'my_project_view' }] },
    { key: 'doc', label: '文书交付', icon: 'doc', roles: ['机构管理员', 'PMO', '项目经理', '文书人员', '平台运维人员', '文书机构管理员'],
      children: [
        { label: '任务列表', file: '任务列表页 - 文书交付系统.html', permission: 'doc_view', roles: ['机构管理员', 'PMO', '项目经理', '文书人员', '文书机构管理员'] },
        { label: '模板库', file: '模板库列表 - 文书交付系统.html', permission: 'library_view', roles: ['机构管理员', 'PMO', '文书人员', '平台运维人员', '文书机构管理员'] },
        { label: '案例库', file: '案例库 - 文书交付系统.html', permission: 'case_view', roles: ['机构管理员', 'PMO', '文书人员', '平台运维人员', '文书机构管理员'] }] },
    { key: 'apply', label: '网申管理', icon: 'globe', roles: ['机构管理员', 'PMO', '网申人员', '项目经理', '平台运维人员'],
      children: [
        { label: '网申任务列表', file: '网申任务列表页 - 留学申请管理系统.html', permission: 'app_view', roles: ['机构管理员', 'PMO', '网申人员', '项目经理'] },
        { label: '网申模板发布中心', file: '网申模板发布中心 - 留学申请管理系统.html', permission:'app_template_publish', roles:['平台运维人员'] },
        { label: '网申模板库', file: '网申模板库 - 留学申请管理系统.html', permission: 'app_library_view', roles: ['机构管理员', 'PMO', '网申人员', '项目经理', '平台运维人员'] }
      ] },
    { key: 'monitor', label: '监控管理', icon: 'eye', permission: 'monitor_view', roles: ['机构管理员', 'PMO', '项目经理'],
      children: [{ label: '监控任务列表', file: '监控任务列表 - PBS留学CRM.html' }] },
    { key: 'archive', label: '结项归档', icon: 'archive', permission: 'archive_view', roles: ['机构管理员', 'PMO', '项目经理', '文书人员', '网申人员'],
      children: [{ label: '结项归档列表', file: '结项归档列表 - PBS留学CRM系统.html' }] },
    { key: 'review', label: '文书审核', icon: 'shield', permission: 'doc_review', roles: ['文书审核', '文书机构管理员'],
      children: [{ label: '文书审核列表', file: '文书审核列表页 - 留学申请管理系统.html' }] },
    { key: 'school', label: '选校管理', icon: 'map', permission: ['school_task','school_plan'], roles: ['机构管理员', 'PMO', '销售人员管理员', '销售人员'],
      children: [
        { label: '选校任务列表', file: '选校任务列表页 - 留学申请管理系统.html', permission: 'school_task', roles: ['机构管理员', 'PMO', '销售人员管理员', '销售人员'] },
        { label: '院校列表', file: '选校工作台页 - 留学申请管理系统.html', href: '选校工作台页 - 留学申请管理系统.html?mode=catalog', permission: 'school_plan', roles: ['销售人员'] }] },
    { key: 'organization', label: '机构管理', icon: 'users', permission: 'sys_org', roles: ['平台运维人员'], single: true, file: '机构管理 - PBS留学CRM系统.html' },
    { key: 'personnel', label: '机构成员管理', icon: 'idcard', permission: 'personnel_view', roles: ['机构管理员', 'PMO', '文书机构管理员'], single: true, file: '人员管理 - PBS留学CRM系统.html' },
    /* 系统管理属于 SaaS 平台侧职责：仅平台运维人员可见，机构侧角色（含机构管理员）一律不暴露。 */
    { key: 'usermgmt', label: '系统管理', icon: 'users', roles: ['平台运维人员'],
      children: [
        { label: '角色权限管理', file: '角色权限管理 - 留学申请管理系统.html', permission: 'sys_role', roles: ['平台运维人员'] },
        { label: '操作日志审计', file: '操作日志审计 - 留学申请管理系统.html', permission: 'sys_log', roles: ['平台运维人员'] },
        { label: 'AI管理', file: 'AI管理 - 留学申请管理系统.html', permission: 'ai_view', roles: ['平台运维人员'] },
        { label: '视频管理', file: '视频管理 - 留学申请管理系统.html', permission: 'video_view', roles: ['平台运维人员'] }] }
  ];

  /* ---------------- 页面级权限（RBAC） ---------------- */
  var PAGE_PERMS = {
    '管理员工作台 - 留学申请管理系统.html': ROLES.slice(),
    '平台运维工作台 - PBS留学CRM系统.html': ['平台运维人员'],
    '机构管理员工作台 - 留学申请管理系统.html': ['机构管理员'],
    'PMO工作台 - 留学申请管理系统.html': ['PMO'],
    '项目经理工作台 - 留学申请管理系统.html': ['项目经理'],
    '学生档案列表页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员'],
    '学生档案详情页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '销售人员', '项目经理', '文书人员', '网申人员', '文书审核', '文书机构管理员'],
    '项目池列表页 - 留学申请管理系统.html': ['机构管理员', 'PMO'],
    '项目详情页 - 留学申请管理系统.html': ['机构管理员', 'PMO'],
    'PMO看板 - 留学申请管理系统.html': ['机构管理员', 'PMO'],
    '我的项目列表页 - 留学申请管理系统.html': ['项目经理'],
    '我的项目详情页 - 留学申请管理系统.html': ['项目经理'],
    '任务列表页 - 文书交付系统.html': ['机构管理员', 'PMO', '项目经理', '文书人员', '文书机构管理员'],
    '文书编辑器 - 文书交付系统.html': ['机构管理员', 'PMO', '项目经理', '文书人员', '文书机构管理员'],
    '模板库列表 - 文书交付系统.html': ['机构管理员', 'PMO', '文书人员', '平台运维人员', '文书机构管理员'],
    '模板库编辑 - 文书交付系统.html': ['机构管理员', 'PMO', '文书人员', '平台运维人员', '文书机构管理员'],
    '案例库 - 文书交付系统.html': ['机构管理员', 'PMO', '文书人员', '平台运维人员', '文书机构管理员'],
    '网申任务列表页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '网申人员', '项目经理'],
    '网申任务详情页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '网申人员', '项目经理'],
    '网申模板发布中心 - 留学申请管理系统.html': ['平台运维人员'],
    '网申模板库 - 留学申请管理系统.html': ['机构管理员', 'PMO', '网申人员', '项目经理', '平台运维人员'],
    '网申模板编辑 - 留学申请管理系统.html': ['机构管理员', 'PMO', '网申人员', '项目经理', '平台运维人员'],
    '监控任务列表 - PBS留学CRM.html': ['机构管理员', 'PMO', '项目经理'],
    '监控详情页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '项目经理'],
    '监控详情页（官网） - 留学申请管理系统.html': ['机构管理员', 'PMO', '项目经理'],
    '监控详情页（邮件） - 留学申请管理系统.html': ['机构管理员', 'PMO', '项目经理'],
    '结项归档列表 - PBS留学CRM系统.html': ['机构管理员', 'PMO', '项目经理', '文书人员', '网申人员'],
    '结项详情页 - 留学申请管理系统.html': ['机构管理员', 'PMO', '项目经理', '文书人员', '网申人员'],
    '用户管理 - 留学申请管理系统.html': ['平台运维人员'],
    '机构管理 - PBS留学CRM系统.html': ['平台运维人员'],
    '人员管理 - PBS留学CRM系统.html': ['平台运维人员', '机构管理员', '文书机构管理员'],
    /* 系统管理类页面仅平台运维人员可访问 */
    '角色权限管理 - 留学申请管理系统.html': ['平台运维人员'],
    '操作日志审计 - 留学申请管理系统.html': ['平台运维人员'],
    'AI管理 - 留学申请管理系统.html': ['平台运维人员'],
    '视频管理 - 留学申请管理系统.html': ['平台运维人员'],
    '文书审核列表页 - 留学申请管理系统.html': ['文书审核', '文书机构管理员'],
    '文书审核详情页 - 留学申请管理系统.html': ['文书审核', '文书机构管理员'],
    '选校订单池页 - 留学申请管理系统.html': ['机构管理员', '销售人员管理员', '销售人员'],
    '选校任务列表页 - 留学申请管理系统.html': ['机构管理员', '销售人员管理员', '销售人员'],
    '选校工作台页 - 留学申请管理系统.html': ['销售人员'],
    '选校方案未生成 - 留学申请管理系统.html': ['销售人员', '机构管理员'],
    '院校目标详情页 - 留学申请管理系统.html': ['项目经理', '机构管理员']
  };

  Object.keys(PAGE_PERMS).forEach(function(file) { if (file !== '机构管理员工作台 - 留学申请管理系统.html' && PAGE_PERMS[file].indexOf('机构管理员') >= 0 && PAGE_PERMS[file].indexOf('PMO') < 0) PAGE_PERMS[file].push('PMO'); });
  PAGE_PERMS['我的项目列表页 - 留学申请管理系统.html'].push('PMO');
  PAGE_PERMS['我的项目详情页 - 留学申请管理系统.html'].push('PMO');


  /* 页面 → 权限点映射：角色权限管理页保存的配置通过此表驱动页面访问。
     未配置权限的角色按 PAGE_PERMS 默认角色放行；一旦在角色权限页保存过该角色的配置，
     则以「权限点」为准（project_view 等真正控制页面可达）。 */
  /* 直接由权限树派生：每个页面的可达性由该页「列表展示」权限项决定，
     新增页面只需在 PERMISSION_TREE 里声明，无需再手工维护这张表。 */
  var PAGE_PERM_KEYS = {};
  Object.keys(PAGE_VIEW_PERMISSION).forEach(function (file) {
    PAGE_PERM_KEYS[file] = [PAGE_VIEW_PERMISSION[file]];
  });
  /* 重定向页：boot() 会先跳转，这里保留兜底权限点 */
  PAGE_PERM_KEYS['用户管理 - 留学申请管理系统.html'] = ['personnel_view'];
  PAGE_PERM_KEYS['选校订单池页 - 留学申请管理系统.html'] = ['school_task'];

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
      try { localStorage.setItem('pbs_operation_logs_stamp_v1', String(Date.now())); } catch (e) {}
    } catch (e) {}
  };
  window.pbsLogout = function () {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PREVIEW_ROLE_KEY);
    location.href = '登录 - PBS留学申请管理平台.html';
  };

  /* 顶栏头像菜单开关：页面内联 onclick="toggleUserMenu()" 的统一实现。
     无论页面是否自带 #userMenu，都保证可展开/收起（修复 21 个页面菜单点不开的问题）。 */
  window.toggleUserMenu = function () {
    var menu = document.getElementById('userMenu');
    if (!menu) {
      /* 页面没有标准菜单时，找顶栏最后一个用户区容器注入标准菜单 */
      var header = document.querySelector('header');
      if (header) bindHeader(window.pbsGetSession());
      menu = document.getElementById('userMenu');
    }
    if (menu) menu.classList.toggle('hidden');
  };

  /* ============================================================
     共享数据层：项目 / 账号 / 角色权限 / 通知 / 日志
     原型阶段以 localStorage 模拟后端；所有页面统一经此读写，
     保证「分配 → 接收 → 执行」状态跨页面闭环。
     ============================================================ */
  var PROJECT_STORE_KEY = 'pbs_projects_v1';
  var PROJECT_NUMBERS = { PRJ20260701001: 'PRJ-M-2607-0001', PRJ20260701002: 'PRJ-M-2607-0002', PRJ20260701005: 'PRJ-O-2607-0008', PRJ20260701008: 'PRJ-M-2607-0007', PRJ20260701012: 'PRJ-M-2607-0009', PRJ20260701018: 'PRJ-M-2607-0010' };
  var ACCOUNT_STORE_KEY = 'pbs_managed_accounts_v2';
  var ROLE_PERMS_KEY = 'pbs_role_perms_v1';

  /* 系统内置角色：不可删除/改名，权限可配置但保留默认兜底 */
  var SYSTEM_ROLES = ['超级管理员', '平台运维人员', '机构管理员', 'PMO', '文书机构管理员'];

  function readStore(key, fallback) {
    try {
      var raw = JSON.parse(localStorage.getItem(key) || 'null');
      return raw == null ? fallback : raw;
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---------- 项目共享存储 ----------
     项目记录：{ projectNo, customer, student, level, source, sourceChannel,
                 packages[], serviceStages[], projectManager, pmAccepted,
                 status, createdAt, assignedAt, acceptedAt, org } */
  window.pbsProjects = {
    canonicalNo: function (value) { return PROJECT_NUMBERS[value] || value; },
    legacyNo: function (value) { return Object.keys(PROJECT_NUMBERS).filter(function(key) { return PROJECT_NUMBERS[key] === value; })[0] || value; },
    all: function () { return readStore(PROJECT_STORE_KEY, []); },
    save: function (list) { writeStore(PROJECT_STORE_KEY, list); },
    /* 把已修改的单条记录合并回存储（避免 save(this.all()) 重读旧数据把改动冲掉） */
    saveOne: function (record) {
      var list = this.all();
      for (var i = 0; i < list.length; i++) {
        if (list[i].projectNo === record.projectNo) { list[i] = record; break; }
      }
      this.save(list);
    },
    find: function (projectNo) {
      projectNo = this.canonicalNo(projectNo);
      return this.all().filter(function (p) { return p.projectNo === projectNo; })[0] || null;
    },
    upsert: function (record) {
      if (record.manualCreated || /^PRJ-O-/.test(record.projectNo) || record.source === '线下') record.orderNo = '';
      if (window.pbsStudents) window.pbsStudents.attachProject(record);
      var list = this.all();
      var idx = -1;
      for (var i = 0; i < list.length; i++) { if (list[i].projectNo === record.projectNo) { idx = i; break; } }
      if (idx >= 0) list[idx] = Object.assign({}, list[idx], record);
      else list.unshift(record);
      this.save(list);
      return record;
    },
    update: function (projectNo, patch) {
      var p = this.find(projectNo);
      if (!p) return null;
      return this.upsert(Object.assign({}, p, patch));
    },
    getAssignment: function(projectNo) {
      var project = this.find(projectNo) || {};
      var stored = readStore('pbs_project_assignment_v3_' + (project.projectNo || projectNo), {});
      var goals = project.goalAssignments;
      if (!goals) {
        goals = Object.assign({}, stored.goalAssignments || {});
        var pm = readStore('pbs_pm_staff_assignment_v3_' + project.projectNo, readStore('pbs_pm_staff_assignment_v3_' + this.legacyNo(project.projectNo), {}));
        Object.keys(pm).forEach(function(id) {
          var item = pm[id], docs = {}, reviewers = {};
          Object.keys(item.docs || {}).forEach(function(key) { docs[key] = { person: item.docs[key].owner, ddl: item.docs[key].ddl }; reviewers[key] = item.docs[key].reviewer; });
          goals[id] = { docs: docs, reviewers: reviewers, network: item.networkOwner, networkMatDdl: item.materialDdl, networkDdl: item.applyDdl, assignedBy: '项目经理', locked: false };
        });
      }
      return { projectManager: project.projectManager || '', taskNote: project.assignmentNote !== undefined ? project.assignmentNote : stored.taskNote || '', goalAssignments: goals };
    },
    goalAssignmentComplete: function(goal, requiredDocs) {
      if (!goal) return false;
      var keys = requiredDocs || goal.requiredDocs || ['CV', 'PS', 'RL', 'RP', 'TCX'];
      return !!(keys.length && keys.every(function(key) {
        var doc = (goal.docs || {})[key];
        return doc && doc.person && doc.ddl && (goal.reviewers || {})[key];
      }) && goal.network && goal.networkMatDdl && goal.networkDdl);
    },
    assignmentComplete: function(project) {
      if (typeof project === 'string') project = this.find(project);
      if (!project || !project.projectManager || !(project.packages || []).length) return false;
      var goals = project.goalAssignments || this.getAssignment(project.projectNo).goalAssignments, self = this;
      return project.packages.every(function(item, index) { return self.goalAssignmentComplete(goals[item.id || 'goal-' + index]); });
    },
    saveAssignment: function(projectNo, goals, note) {
      var project = this.find(projectNo);
      if (!project) return null;
      project.goalAssignments = goals;
      project.assignmentNote = note;
      project.remark = note;
      project.assignedAt = new Date().toISOString();
      project.allStaffAssigned = this.assignmentComplete(project);
      return this.upsert(project);
    }
  };

  /* ---------- 账号共享存储（登录页与人员管理页共用同一份） ---------- */
  /* 演示项目种子（幂等 + 缺失补种）：存储中已存在的项目保留真实状态，只补充缺失的演示项目 */
  (function seedSharedProjects() {
    var existing = readStore(PROJECT_STORE_KEY, []);
    if (!Array.isArray(existing)) existing = [];
    var have = {};
    existing.forEach(function (p) { if (p && p.projectNo) have[p.projectNo] = true; });
    var seeds = [
      { projectNo: 'PRJ-M-2607-0000', customer: '周海宁', student: '周妍', level: '硕士申请', source: '线上', projectManager: '', pmAccepted: false, status: '待分配', org: 'PBS留学总部', createdAt: '2026-07-01 10:00' },
      { projectNo: 'PRJ-M-2607-0001', customer: '张建国', student: '张明', level: '本科申请', source: '线上', projectManager: '', pmAccepted: false, status: '待接收', org: 'PBS留学总部', createdAt: '2026-07-03 14:30' },
      { projectNo: 'PRJ-M-2607-0002', customer: '李慧敏', student: '李雪', level: '硕士申请', source: '线上', projectManager: '张老师', pmAccepted: true, status: '进行中', org: 'PBS留学总部', createdAt: '2026-07-05 09:20' },
      { projectNo: 'PRJ-O-2607-0003', customer: '王建军', student: '王伟', level: '博士申请', source: '线下', projectManager: '李老师', pmAccepted: true, status: '已结项', org: 'PBS留学总部', createdAt: '2026-06-12 16:40' },
      { projectNo: 'PRJ-M-2607-0004', customer: '赵文华', student: '赵婷', level: '硕士申请', source: '线上', projectManager: '王老师', pmAccepted: true, status: '进行中', org: 'PBS留学总部', createdAt: '2026-06-28 11:15' },
      { projectNo: 'PRJ-O-2607-0005', customer: '陈国平', student: '陈晓', level: '本科申请', source: '线下', projectManager: '', pmAccepted: false, status: '待分配', org: 'PBS留学总部', createdAt: '2026-07-08 15:05' }
    ];
    seeds.push(
      { projectNo: 'PRJ-M-2607-0006', customer: '李慧敏', student: '李雪', level: '硕士申请', source: '线上', projectManager: '张老师', pmAccepted: true, status: '进行中', org: 'PBS留学总部', createdAt: '2026-07-05 09:20' },
      { projectNo: 'PRJ-M-2607-0007', customer: '陈晨', student: '陈雨桐', level: '硕士申请', source: '线上', projectManager: '张老师', pmAccepted: false, status: '待接收', org: 'PBS留学总部', createdAt: '2026-07-15 14:00' },
      { projectNo: 'PRJ-O-2607-0008', customer: '刘洋', student: '刘晓', level: '本科申请', source: '线下', projectManager: '张老师', pmAccepted: true, status: '进行中', org: 'PBS留学总部', createdAt: '2026-07-17 11:20' },
      { projectNo: 'PRJ-M-2607-0009', customer: '王磊', student: '王梓豪', level: '博士申请', source: '线上', projectManager: '李老师', pmAccepted: true, status: '进行中', org: 'PBS留学总部', createdAt: '2026-07-16 10:15' },
      { projectNo: 'PRJ-M-2607-0010', customer: '赵敏', student: '赵欣怡', level: '本科申请', source: '线上', projectManager: '张老师', pmAccepted: true, status: '已结项', org: 'PBS留学总部', createdAt: '2026-07-10 08:00' }
    );
    var added = false;
    seeds.forEach(function (seed) {
      if (!have[seed.projectNo]) { existing.push(seed); added = true; }
    });
    var serviceNames = ['CV','PS','RP','RL','套磁信','网申提交证明','网申结果','结项报告'];
    existing.forEach(function(project) {
      if (project.manualCreated || /^PRJ-O-/.test(project.projectNo) || project.source === '线下') {
        if (project.orderNo !== '') { project.orderNo = ''; added = true; }
      } else if (!project.orderNo) { project.orderNo = '202607' + project.projectNo.slice(-4); added = true; }
      if (!project.manualCreated && project.source !== '线下' && (project.projectNo === 'PRJ-M-2607-0002' || project.projectNo === 'PRJ-M-2607-0006')) { if (project.orderNo !== '20260705002') { project.orderNo = '20260705002'; added = true; } }
      if (!project.subOrderNo) { project.subOrderNo = 'SUB-' + project.projectNo; added = true; }
      if (!project.packages || !project.packages.length) {
        var second = ['PRJ-M-2607-0006','PRJ-O-2607-0008','PRJ-O-2607-0003'].indexOf(project.projectNo) >= 0;
        project.packages = [{ id: second ? 'stanford' : 'cmu', school: second ? '斯坦福大学' : '卡内基梅隆大学', major: second ? '计算机科学' : '人工智能', name: second ? '院校申请套餐' : '尊享申请套餐', services: serviceNames.map(function(name) { return { name: name, price: 0 }; }) }];
        added = true;
      }
      if (project.assignedAt === undefined) { project.assignedAt = project.projectManager ? project.createdAt : ''; added = true; }
      if (project.projectNo === 'PRJ-M-2607-0002' && !project.goalAssignments && !readStore('pbs_project_assignment_v3_' + project.projectNo, null) && !readStore('pbs_pm_staff_assignment_v3_' + project.projectNo, null) && !readStore('pbs_pm_staff_assignment_v3_' + window.pbsProjects.legacyNo(project.projectNo), null)) {
        var docs = {}, reviewers = {}, dates = { CV: '2026-10-08', PS: '2026-10-15', RL: '2026-10-12', RP: '2026-10-20', TCX: '2026-11-01' };
        Object.keys(dates).forEach(function(key) { docs[key] = { person: key === 'RL' ? '陈老师' : '刘老师', ddl: dates[key] }; reviewers[key] = key === 'RL' || key === 'RP' ? '周老师' : '孙老师'; });
        project.goalAssignments = { cmu: { docs: docs, reviewers: reviewers, network: '吴老师', networkMatDdl: '2026-09-25', networkDdl: '2026-11-01', assignedBy: '机构管理员', locked: true } };
        added = true;
      }
      if (project.projectNo === 'PRJ-M-2607-0002') {
        if (project.allStaffAssigned === undefined) { project.allStaffAssigned = true; added = true; }
        if (!project.direction) project.direction = '计算机科学 · 人工智能';
      }
    });
    if (added || !existing.length) writeStore(PROJECT_STORE_KEY, existing);
  })();

  window.pbsAccounts = {
    key: ACCOUNT_STORE_KEY,
    all: function () { return readStore(ACCOUNT_STORE_KEY, []); },
    save: function (list) { writeStore(ACCOUNT_STORE_KEY, list); },
    find: function (account) {
      var lower = String(account || '').toLowerCase();
      return this.all().filter(function (a) { return String(a.u || '').toLowerCase() === lower; })[0] || null;
    },
    upsert: function (record) {
      var list = this.all();
      var lower = String(record.u || '').toLowerCase();
      var idx = -1;
      for (var i = 0; i < list.length; i++) { if (String(list[i].u || '').toLowerCase() === lower) { idx = i; break; } }
      if (idx >= 0) list[idx] = Object.assign({}, list[idx], record);
      else list.push(record);
      this.save(list);
      return record;
    },
    remove: function (account) {
      var lower = String(account || '').toLowerCase();
      this.save(this.all().filter(function (a) { return String(a.u || '').toLowerCase() !== lower; }));
    },
    /* 密码散列：原型用确定性摘要模拟后端不可逆存储，登录只比较散列 */
    hashPassword: function (password) {
      var input = 'pbs::' + String(password == null ? '' : password);
      var h1 = 0x811c9dc5, h2 = 0x01000193;
      for (var i = 0; i < input.length; i++) {
        h1 = ((h1 ^ input.charCodeAt(i)) * 16777619) >>> 0;
        h2 = ((h2 * 31) + input.charCodeAt(i) * (i + 7)) >>> 0;
      }
      var h3 = 0;
      for (var j = input.length - 1; j >= 0; j--) { h3 = ((h3 << 5) - h3 + input.charCodeAt(j)) >>> 0; }
      return 'pbs1$' + h1.toString(36) + h2.toString(36) + h3.toString(36);
    },
    /* 兼容历史明文记录：首次校验时自动升级为散列 */
    verifyPassword: function (account, password) {
      var rec = this.find(account);
      if (!rec) return false;
      if (rec.phash) return rec.phash === this.hashPassword(password);
      if (rec.p === password) {
        rec.phash = this.hashPassword(rec.p);
        delete rec.p;
        this.saveOne(p);
        return true;
      }
      return false;
    },
    setPassword: function (account, newPassword) {
      var rec = this.find(account);
      if (!rec) return false;
      delete rec.p;
      rec.phash = this.hashPassword(newPassword);
      this.saveOne(p);
      return true;
    },
    /* 账号有效期校验：过期返回 false */
    isExpired: function (rec) {
      var expiry = rec && rec.accountExpiry;
      if (!expiry || expiry === '长期有效') return false;
      var dateValue = Date.parse(expiry);
      if (isNaN(dateValue)) return false;
      return dateValue < Date.now();
    }
  };

  (function initializeOrderManagement() {
    var key = 'pbs_order_management_v1', projects = window.pbsProjects;
    function session() { return window.pbsGetSession(); }
    function org(value) { return value === 'PBS留学' ? 'PBS留学总部' : value; }
    function sameOrg(project) { return session().role === '超级管理员' || org(session().org) === org(project.org); }
    function name(role) {
      var current = session();
      if (current.account !== 'demo_admin' && current.account !== 'test') return current.name;
      return role === 'PMO' ? '林老师' : '张老师';
    }
    function orderKey(project) { return org(project.org || 'PBS留学总部') + '::' + (project.orderNo ? 'ORDER:' + project.orderNo : 'PROJECT:' + project.projectNo); }
    function state(project) { return readStore(key, {})[orderKey(project)] || {}; }
    function members(project) { var id = orderKey(project); return projects.all().filter(function(item) { return orderKey(item) === id; }); }
    function manager(project, goalId) {
      var saved = project.goalManagers && project.goalManagers[goalId];
      return saved || { name:project.projectManager || '', accepted:!!project.pmAccepted, assignedAt:project.assignedAt || '', rejectReason:project.rejectReason || '', returnedAt:project.rejectedAt || '', returnedBy:project.rejectedBy || '', returnedAccount:project.rejectedAccount || '' };
    }
    function canManage(project) { var owner = state(project), preview = ['demo_admin','test'].indexOf(session().account) >= 0; return sameOrg(project) && session().role === 'PMO' && !!owner.pmoName && (owner.pmoAccount ? owner.pmoAccount === session().account || preview && owner.pmoName === name('PMO') : owner.pmoName === name('PMO')); }
    function canAssignOwner(project) { return sameOrg(project) && ['机构管理员','超级管理员'].indexOf(session().role) >= 0 && window.pbsHasPermission('order_assign_pmo'); }
    function canHandleGoal(project, goalId, accepted) { var pm = manager(project, goalId), preview = ['demo_admin','test'].indexOf(session().account) >= 0; return sameOrg(project) && session().role === '项目经理' && (pm.account ? pm.account === session().account || preview && pm.name === name('项目经理') : pm.name === name('项目经理')) && (!accepted || pm.accepted); }
    function canReadGoal(project,goalId) {
      if (!sameOrg(project)) return false;
      if (canAssignOwner(project) || canManage(project) || canHandleGoal(project,goalId)) return true;
      var assignment = projects.getAssignment(project.projectNo).goalAssignments[goalId] || {}, role = session().role, person = session().name;
      if (role === '网申人员') return assignment.network === person;
      if (role === '文书人员') return Object.keys(assignment.docs || {}).some(function(id) { return assignment.docs[id].person === person; });
      if (role === '文书审核') return Object.keys(assignment.reviewers || {}).some(function(id) { return assignment.reviewers[id] === person; });
      return false;
    }
    function canView(project) { return sameOrg(project) && (canAssignOwner(project) || canManage(project) || (project.packages || []).some(function(goal) { return canReadGoal(project, goal.id); })); }
    function taskTarget(item) {
      var matches = [];
      projects.all().forEach(function(project) {
        if (org(project.org) !== org(item.organization) || item.projectNo && project.projectNo !== item.projectNo || !item.projectNo && project.student !== item.student) return;
        (project.packages || []).forEach(function(goal) {
          if (item.goalId ? goal.id === item.goalId : goal.school === item.school || goal.school + ' · ' + goal.major === item.school) matches.push({project:project,goal:goal});
        });
      });
      return matches.length === 1 ? matches[0] : null;
    }
    function returnRecords(project) {
      var records = (project.returnHistory || []).map(function(item) { return Object.assign({},item); });
      (project.packages || []).forEach(function(goal) {
        var pm = manager(project,goal.id), submission = (project.goalSubmissions || {})[goal.id];
        if (pm.rejectReason && pm.returnedAt && !records.some(function(item) { return item.kind === 'manager' && item.goalId === goal.id && item.returnedAt === pm.returnedAt; })) {
          var previous = (state(project).events || []).find(function(item) { return item.type === '退回院校目标' && item.detail.indexOf(project.projectNo) >= 0 && item.detail.indexOf(goal.school) >= 0; }) || {};
          records.push({id:'manager-' + goal.id + '-' + pm.returnedAt,kind:'manager',goalId:goal.id,reason:pm.rejectReason,returnedBy:pm.returnedBy || previous.actor || '—',returnedAccount:pm.returnedAccount || previous.actorAccount || '',returnedAt:pm.returnedAt,handledAt:pm.name ? pm.assignedAt : '',handledBy:pm.name ? pm.assignedBy : '',handlingAction:pm.name ? '重新分配项目经理' : ''});
        }
        if (submission && submission.status === '退回补充' && !records.some(function(item) { return item.kind === 'closure' && item.goalId === goal.id && !item.handledAt; })) records.push({id:'closure-' + goal.id + '-' + submission.reviewedAt,kind:'closure',goalId:goal.id,reason:submission.reviewNote,returnedBy:submission.reviewedBy,returnedAt:submission.reviewedAt});
      });
      readStore('pbs_task_returns_v1',[]).forEach(function(item) {
        var target = taskTarget(item); if (!target || target.project.projectNo !== project.projectNo) return;
        records.push(Object.assign({},item,{goalId:target.goal.id,handledAt:item.status !== 'returned' ? item.assignedAt || item.acceptedAt || item.returnedAt : '',handledBy:item.assignedBy || '',handlingAction:item.status !== 'returned' ? '重新分配任务' : ''}));
      });
      return records.map(function(item) {
        var goal = (project.packages || []).find(function(goal) { return goal.id === item.goalId; });
        return Object.assign({},item,{projectNo:project.projectNo,school:goal ? goal.school : item.school || '',major:goal ? goal.major : '',pending:project.status !== '已结项' && !item.handledAt});
      }).sort(function(a,b) { return Number(b.pending) - Number(a.pending) || String(b.returnedAt).localeCompare(String(a.returnedAt)); });
    }
    function recordReturn(project,kind,goalId,reason,at) {
      project.returnHistory = (project.returnHistory || []).concat({id:'RET-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),kind:kind,goalId:goalId,reason:reason,returnedBy:name(session().role),returnedAccount:session().account,returnedAt:at});
    }
    function resolveReturns(project,kind,goalId,action) {
      var records = returnRecords(project).filter(function(item) { return item.kind === kind && item.goalId === goalId; });
      project.returnHistory = project.returnHistory || [];
      records.forEach(function(item) {
        var record = project.returnHistory.find(function(saved) { return saved.id === item.id; });
        if (!record) { record = Object.assign({},item); project.returnHistory.push(record); }
        if (!record.handledAt) Object.assign(record,{handledAt:new Date().toISOString(),handledBy:session().name,handlingAction:action});
      });
    }
    function event(project, type, detail) {
      var all = readStore(key, {}), id = orderKey(project), record = all[id] || {};
      record.events = record.events || []; record.events.unshift({ id:'EVT-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), type:type, detail:detail, actor:session().name, actorAccount:session().account, at:new Date().toISOString() });
      all[id] = record; writeStore(key, all);
      if (window.pbsRecordOperation) window.pbsRecordOperation('订单管理', type, detail);
      window.dispatchEvent(new CustomEvent('pbs-order-updated', { detail:id }));
    }
    function sync(project) {
      var names = [], allAccepted = true;
      (project.packages || []).forEach(function(goal) { var pm = manager(project, goal.id); if (pm.name && names.indexOf(pm.name) < 0) names.push(pm.name); if (!pm.name || !pm.accepted) allAccepted = false; });
      project.projectManager = names.join('、'); project.pmAccepted = allAccepted;
      if (project.status !== '已结项') project.status = status(project);
      projects.upsert(project); return project;
    }
    function status(project) {
      if (!project || project.status === '已结项') return project ? project.status : '待分配';
      var goals = project.packages || [], assigned = goals.map(function(goal) { return manager(project, goal.id); });
      if (assigned.some(function(pm) { return pm.name && pm.accepted; })) return '进行中';
      return assigned.some(function(pm) { return pm.name; }) ? '待接收' : '待分配';
    }
    function candidates(role, project) { return window.pbsAccounts.all().filter(function(account) { return (account.roles || [account.role]).indexOf(role) >= 0 && org(account.org) === org(project.org) && account.status !== '停用' && account.status !== '停职' && account.accountStatus !== '停用' && account.accountStatus !== '禁用'; }); }
    function assignOwner(projectNo, accountId) {
      var project = projects.find(projectNo); if (!project || !canAssignOwner(project)) return { error:'仅机构管理员可分配 PMO' };
      if (members(project).every(function(item) { return item.status === '已结项'; })) return { error:'订单已结项' };
      var account = candidates('PMO', project).find(function(item) { return item.u === accountId; }); if (!account) return { error:'请选择本机构在职 PMO' };
      var all = readStore(key, {}), record = all[orderKey(project)] || {};
      Object.assign(record, { pmoAccount:account.u, pmoName:account.name, assignedAt:new Date().toISOString(), assignedBy:session().name }); all[orderKey(project)] = record; writeStore(key, all);
      event(project,'分配 PMO',(project.orderNo || project.projectNo) + ' → ' + account.name);
      window.pbsCreateNotification({kind:'task_assigned',type:'订单分配提醒',title:project.student + '的订单已分配给你',business:project.orderNo || project.projectNo,recipientName:account.name,recipientRoles:['PMO'],organization:project.org,href:'项目详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(projectNo)});
      return record;
    }
    function assignGoal(projectNo, goalId, accountId) {
      var project = projects.find(projectNo), goal = project && (project.packages || []).find(function(item) { return item.id === goalId; });
      if (!goal || !canManage(project) || !window.pbsHasPermission('order_assign_pm')) return { error:'仅订单 PMO 可分配院校目标项目经理' };
      if (project.status === '已结项') return { error:'项目已结项' };
      var account = candidates('项目经理',project).find(function(item) { return item.u === accountId || item.name === accountId; }); if (!account) return { error:'请选择本机构在职项目经理' };
      var previous = manager(project, goalId); if (previous.account ? previous.account === account.u : previous.name === account.name) return project;
      resolveReturns(project,'manager',goalId,'重新分配项目经理');
      project.goalManagers = Object.assign({},project.goalManagers || {});
      (project.packages || []).forEach(function(item) { if (!project.goalManagers[item.id]) project.goalManagers[item.id] = manager(project,item.id); });
      project.goalManagers[goalId] = { account:account.u, name:account.name, accepted:false, assignedAt:new Date().toISOString(), assignedBy:session().name };
      if (project.goalSubmissions && project.goalSubmissions[goalId]) project.goalSubmissions[goalId].status = '待提交';
      project.assignedAt = new Date().toISOString(); sync(project);
      event(project,'分配项目经理',project.projectNo + ' · ' + goal.school + ' → ' + account.name);
      window.pbsCreateNotification({kind:'task_assigned',type:'院校目标待接收',title:project.student + ' · ' + goal.school + '已分配给你',business:project.projectNo,recipientName:account.name,recipientRoles:['项目经理'],organization:project.org,detail:'PMO 已分配院校目标，请接收后维护档案并分配交付任务。',href:'我的项目列表页 - 留学申请管理系统.html'});
      return project;
    }
    function handleGoal(projectNo, goalId, reason) {
      var project = projects.find(projectNo); if (!project || project.status === '已结项') return null;
      var goals = (project.packages || []).filter(function(goal) { return (!goalId || goal.id === goalId) && canHandleGoal(project,goal.id); }); if (!goals.length) return null;
      if (reason !== undefined && !String(reason).trim()) return null;
      project.goalManagers = Object.assign({},project.goalManagers || {});
      (project.packages || []).forEach(function(goal) { if (!project.goalManagers[goal.id]) project.goalManagers[goal.id] = manager(project,goal.id); });
      goals.forEach(function(goal) { var pm = project.goalManagers[goal.id]; if (reason !== undefined) { var at = new Date().toISOString(); recordReturn(project,'manager',goal.id,reason,at); Object.assign(pm,{ name:'',account:'',accepted:false,rejectReason:reason,returnedAt:at,returnedBy:name('项目经理'),returnedAccount:session().account }); } else { pm.accepted = true; pm.acceptedAt = new Date().toISOString(); } });
      sync(project); event(project,reason === undefined ? '接收院校目标' : '退回院校目标',projectNo + ' · ' + goals.map(function(goal) { return goal.school; }).join('、') + (reason ? ' · ' + reason : ''));
      if (reason !== undefined) {
        var notice = {kind:'task_return',type:'院校目标退回',title:project.student + '的院校目标被退回',business:projectNo,detail:reason,level:'danger',organization:project.org,href:'项目池列表页 - 留学申请管理系统.html?returns=1'};
        window.pbsCreateNotification(Object.assign({},notice,{recipientName:state(project).pmoName,recipientRoles:['PMO']}));
        window.pbsCreateNotification(Object.assign({},notice,{recipientRoles:['机构管理员']}));
      }
      return project;
    }
    function submit(projectNo, goalId, payload) {
      var project = projects.find(projectNo); if (!project || !(project.packages || []).some(function(goal) { return goal.id === goalId; }) || !canHandleGoal(project,goalId,true) || !window.pbsHasPermission('archive_submit') || project.status === '已结项') return { error:'仅已接收该院校目标的项目经理可提交材料' };
      if (!state(project).pmoName) return { error:'请先由机构管理员分配 PMO' };
      if (!payload.deliveryConfirmed) return { error:'请先确认院校目标交付完整' };
      var closure = readStore('pbs_closure_' + projectNo + '_' + goalId,readStore('pbs_closure_' + projectNo,{}));
      if (!(closure.confirmed || {})[goalId]) return { error:'请先核对并确认院校结果' };
      if (!payload.note && !(payload.attachments || []).length && !Object.keys(readStore('pbs_closure_reports_' + projectNo + '_' + goalId,{})).length) return { error:'请填写结项说明或提供结项材料' };
      var previous = (project.goalSubmissions || {})[goalId]; if (previous && ['待审核','已通过'].indexOf(previous.status) >= 0) return { error:'该院校目标已提交核验' };
      resolveReturns(project,'closure',goalId,'补充并重新提交结项材料');
      if (payload.result && payload.result !== '待录入') { project.goalResults = Object.assign({},project.goalResults || {}); project.goalResults[goalId] = {result:payload.result,note:payload.resultNote || '',image:payload.resultImage || ''}; }
      project.goalSubmissions = Object.assign({},project.goalSubmissions || {}); project.goalSubmissions[goalId] = Object.assign({},payload,{ status:'待审核',submittedBy:session().name,submittedAt:new Date().toISOString() }); projects.upsert(project);
      event(project,'提交结项材料',projectNo + ' · ' + project.packages.find(function(goal) { return goal.id === goalId; }).school);
      window.pbsCreateNotification({kind:'closure_review',type:'结项材料待核验',title:project.student + '的结项材料待核验',business:project.orderNo || projectNo,recipientName:state(project).pmoName,recipientRoles:['PMO'],organization:project.org,href:'结项详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(projectNo) + '&orderReport=1'});
      return project.goalSubmissions[goalId];
    }
    function review(projectNo, goalId, approve, note) {
      var project = projects.find(projectNo); if (!project || !canManage(project) || !window.pbsHasPermission('archive_approve')) return { error:'仅订单 PMO 可核验结项材料' };
      var submission = (project.goalSubmissions || {})[goalId]; if (!submission || submission.status !== '待审核') return { error:'没有待核验的材料' };
      if (!approve && !String(note || '').trim()) return { error:'请填写退回原因' };
      Object.assign(submission,{status:approve ? '已通过' : '退回补充',reviewNote:note || '',reviewedBy:session().name,reviewedAt:new Date().toISOString()});
      if (!approve) recordReturn(project,'closure',goalId,note,submission.reviewedAt);
      projects.upsert(project);
      event(project,approve ? '核验通过' : '退回补充',projectNo + ' · ' + project.packages.find(function(goal) { return goal.id === goalId; }).school + (note ? ' · ' + note : ''));
      window.pbsCreateNotification({kind:'closure_review',type:approve ? '材料核验通过' : '结项材料退回',title:project.student + '的结项材料' + (approve ? '核验通过' : '需补充'),business:projectNo,detail:note || '',recipientName:manager(project,goalId).name,recipientRoles:['项目经理'],organization:project.org,href:'结项详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(projectNo) + '&school=' + encodeURIComponent(goalId)});
      return submission;
    }
    function close(projectNo, note) {
      var project = projects.find(projectNo); if (!project || !canManage(project) || !window.pbsHasPermission('archive_approve')) return { error:'仅订单 PMO 可确认结项' };
      var list = members(project), targets = list.flatMap(function(item) { return (item.packages || []).map(function(goal) { return {project:item,goal:goal}; }); });
      if (!targets.length || targets.some(function(item) { return item.project.status !== '已结项' && ((item.project.goalSubmissions || {})[item.goal.id] || {}).status !== '已通过'; })) return { error:'请先完成订单全部院校目标的材料核验' };
      if (list.every(function(item) { return item.status === '已结项'; })) return { error:'订单已结项' };
      var at = new Date().toISOString(), all = readStore(key,{}), record = state(project);
      Object.assign(record,{closureStatus:'已结项',closureNote:note || '',closedAt:at,closedBy:session().name}); all[orderKey(project)] = record; writeStore(key,all);
      list.forEach(function(item) { item.goalClosures = Object.assign({},item.goalClosures || {}); (item.packages || []).forEach(function(goal) { item.goalClosures[goal.id] = {closureNote:note || '',closureAt:at,closedBy:session().name}; }); Object.assign(item,{status:'已结项',closureConfirmed:true,closureAt:at,closureNote:note || ''}); projects.upsert(item); });
      event(project,'确认结项',(project.orderNo || projectNo) + (note ? ' · ' + note : '')); return record;
    }
    function all() {
      var groups = {};
      projects.all().forEach(function(project) { var id = orderKey(project); if (!groups[id]) groups[id] = {id:id,project:project,projects:[],owner:state(project)}; groups[id].projects.push(project); });
      return Object.keys(groups).map(function(id) { var order = groups[id]; order.targets = order.projects.flatMap(function(project) { return (project.packages || []).map(function(goal) { return {project:project,goal:goal,manager:manager(project,goal.id),submission:(project.goalSubmissions || {})[goal.id] || {status:'待提交'}}; }); }); order.status = order.projects.every(function(project) { return project.status === '已结项'; }) ? '已结项' : !order.owner.pmoName ? '待分配 PMO' : order.targets.some(function(target) { return !target.manager.name; }) ? '待分配经理' : order.targets.some(function(target) { return !target.manager.accepted; }) ? '待接收' : order.targets.some(function(target) { return target.submission.status === '待审核'; }) ? '待核验' : order.targets.length && order.targets.every(function(target) { return target.submission.status === '已通过'; }) ? '待结项' : order.targets.some(function(target) { return target.submission.status === '退回补充'; }) ? '待补充材料' : '进行中'; return order; });
    }
    window.pbsOrders = {key:orderKey,state:state,members:members,manager:manager,name:name,canManage:canManage,canAssignOwner:canAssignOwner,canHandleGoal:canHandleGoal,canReadGoal:canReadGoal,canView:canView,candidates:candidates,assignOwner:assignOwner,assignGoal:assignGoal,submit:submit,review:review,close:close,all:all,returns:returnRecords,taskTarget:taskTarget};
    projects.statusOf = status;
    projects.assignPM = function(projectNo, pmName, operatorOrg, goalId) { var project = this.find(projectNo); if (!project || !canManage(project)) return null; var goals = (project.packages || []).filter(function(goal) { return !goalId || goal.id === goalId; }); var result; goals.forEach(function(goal) { result = assignGoal(projectNo,goal.id,pmName); }); return result && !result.error ? this.find(projectNo) : null; };
    projects.acceptPM = function(projectNo,goalId) { return handleGoal(projectNo,goalId); };
    projects.rejectPM = function(projectNo,reason,goalId) { return handleGoal(projectNo,goalId,reason); };
    var saveAssignment = projects.saveAssignment;
    projects.saveAssignment = function(projectNo,goals,note) { var project = this.find(projectNo); if (!project || project.status === '已结项') return null; var allowed = (project.packages || []).filter(function(goal) { return manager(project,goal.id).accepted && (canManage(project) || canHandleGoal(project,goal.id,true)); }); if (!allowed.length) return null; var merged = Object.assign({},this.getAssignment(projectNo).goalAssignments), changed = {}; allowed.forEach(function(goal) { if (goals[goal.id]) { merged[goal.id] = goals[goal.id]; changed[goal.id] = goals[goal.id]; } }); var result = saveAssignment.call(this,projectNo,merged,note); if (result && window.pbsTaskReturn) pbsTaskReturn.resolveProject(result,changed); return result; };
    [{u:'pmo',name:'林老师',role:'PMO',phone:'13800000005'},{u:'pm',name:'张老师',role:'项目经理',phone:'13800000006'},{u:'pm_wang',name:'王老师',role:'项目经理',phone:'13800000007'},{u:'pm_li',name:'李老师',role:'项目经理',phone:'13800000008'}].forEach(function(account) { if (!window.pbsAccounts.find(account.u)) window.pbsAccounts.upsert(Object.assign({},account,{roles:[account.role],org:'PBS留学总部',status:'正常',accountStatus:'启用',accountExpiry:'长期有效',phash:window.pbsAccounts.hashPassword('pbs123456')})); });
    var seeded = readStore(key,{}), changed = false;
    projects.all().forEach(function(project) { var id = orderKey(project); if (seeded[id] || project.manualCreated || !/^PRJ-[MO]-2607-/.test(project.projectNo)) return; seeded[id] = {events:[]}; if (['PRJ-M-2607-0000','PRJ-O-2607-0005'].indexOf(project.projectNo) < 0) Object.assign(seeded[id],{pmoAccount:'pmo',pmoName:'林老师',assignedBy:'王志强',assignedAt:'2026-10-15T01:00:00.000Z'}); changed = true; });
    if (changed) writeStore(key,seeded);
  })();

  function currentFile() {
    var f = location.pathname.split('/').pop() || 'index.html';
    try { f = decodeURIComponent(f); } catch (e) {}
    return f;
  }

  var NAV_MENU_ORDER = ['student', 'pmo', 'project', 'doc', 'review', 'apply', 'monitor', 'archive', 'school', 'organization', 'personnel', 'usermgmt'];
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
    '选校任务列表页 - 留学申请管理系统.html': ['选校任务列表页 - 留学申请管理系统.html', '选校方案未生成 - 留学申请管理系统.html']
  };

  function hrefFile(href) {
    return (href || '').split(/[?#]/)[0];
  }
  function isWorkbenchRequest() {
    return new URLSearchParams(location.search).get('view') === 'workbench' || location.hash === '#workbench';
  }

  function navChildState(child, file, workbenchView) {
    var target = child.href || child.file;
    var activeFiles = NAV_ACTIVE_FILES[child.file] || [child.file];
    var active = !workbenchView && activeFiles.indexOf(file) >= 0;
    if (child.href && child.href.indexOf('?mode=catalog') >= 0) {
      active = active && new URLSearchParams(location.search).get('mode') === 'catalog';
    }
    return { child: child, target: target, active: active };
  }

  function renderPrimaryNavLink(target, label, icon, active) {
    return '<a href="' + encodeURI(target) + '" class="pbs-nav-item ' + (active ? 'is-active' : '') + '">' +
      svgIcon(ICONS[icon], 'pbs-nav-icon') + '<span>' + label + '</span></a>';
  }

  function renderRoleNavigation(session, file, workbenchHref, showWorkbench) {
    var role = session.role;
    var accessRoles = session.previewRole && session.previewRole !== 'all'
      ? [session.previewRole]
      : (session.userRoles && session.userRoles.length ? session.userRoles : [session.role]);
    var menuMap = {};
    MENUS.forEach(function(menu) { menuMap[menu.key] = menu; });
    var workbenchTarget = hrefFile(workbenchHref);
    var workbenchView = isWorkbenchRequest();
    var workbenchActive = file === workbenchTarget && (workbenchHref.indexOf('workbench') < 0 || workbenchView);
    var html = '<nav class="pbs-nav" aria-label="主导航">';
    if (showWorkbench !== false) {
      html += renderPrimaryNavLink(workbenchHref, '工作台', 'home', workbenchActive);
    }

    NAV_MENU_ORDER.forEach(function(key) {
      var menu = menuMap[key];
      if (!menu || !roleCanAccess(accessRoles, menu.roles) || !sessionHasPermission(session, menu.permission)) return;
      var target = menu.file || '';
      var children = (menu.children || []).filter(function(child) {
        if (key === 'project' && child.file === '项目池列表页 - 留学申请管理系统.html') return false;
        return (!child.roles || roleCanAccess(accessRoles, child.roles)) && sessionHasPermission(session, child.permission);
      });
      if (!menu.single && !children.length) return;

      if (menu.single) {
        var singleActive = !workbenchView && file === hrefFile(target);
        html += renderPrimaryNavLink(target, menu.label, menu.icon, singleActive);
        return;
      }

      var childStates = children.map(function(child) {
        return navChildState(child, file, workbenchView);
      });

      /* 当前角色仅能看到一个子菜单时，直接提升为一级入口。 */
      if (childStates.length === 1) {
        html += renderPrimaryNavLink(childStates[0].target, childStates[0].child.label, menu.icon, childStates[0].active);
        return;
      }

      var groupActive = childStates.some(function(state) { return state.active; });
      var panelId = 'pbs-nav-children-' + menu.key;
      html += '<div class="pbs-nav-group ' + (groupActive ? 'is-open is-active' : '') + '">' +
        '<button type="button" class="pbs-nav-group-trigger" aria-expanded="' + (groupActive ? 'true' : 'false') + '" aria-controls="' + panelId + '">' +
          svgIcon(ICONS[menu.icon], 'pbs-nav-icon') + '<span>' + menu.label + '</span>' +
          svgIcon('M19 9l-7 7-7-7', 'pbs-nav-chevron') + '</button>' +
        '<div id="' + panelId + '" class="pbs-nav-children"' + (groupActive ? '' : ' hidden') + '>';
      childStates.forEach(function(state) {
        html += '<a href="' + encodeURI(state.target) + '" class="pbs-nav-child ' + (state.active ? 'is-active' : '') + '">' + state.child.label + '</a>';
      });
      html += '</div></div>';
    });
    return html + '</nav>';
  }

  function initSidebarNavigation(aside) {
    var triggers = aside.querySelectorAll('.pbs-nav-group-trigger');
    Array.prototype.forEach.call(triggers, function(trigger) {
      trigger.addEventListener('click', function() {
        var willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        Array.prototype.forEach.call(triggers, function(item) {
          var group = item.parentNode;
          var panel = document.getElementById(item.getAttribute('aria-controls'));
          var open = item === trigger && willOpen;
          item.setAttribute('aria-expanded', open ? 'true' : 'false');
          group.classList.toggle('is-open', open);
          if (panel) panel.hidden = !open;
        });
      });
    });
  }

  function renderSidebar(session, file) {
    var aside = document.getElementById('pbs-sidebar');
    if (!aside) return;
    var role = session.role;
    var workbenchFile = ROLE_WORKBENCH[role];

    var html = renderRoleNavigation(session, file, workbenchFile, workbenchVisible(session));
    html += '<div class="p-4 border-t border-gray-100">' +
      '<div class="pbs-sidebar-account"><p class="text-sm font-semibold text-gray-800 truncate">' + session.name + '</p>' +
      '<p class="text-xs text-gray-500 truncate mt-1">' + (session.previewLabel || session.role) + '</p></div></div>';
    aside.innerHTML = html;
    if (aside.className.indexOf('flex') < 0) { aside.className += ' flex flex-col'; }
    initSidebarNavigation(aside);
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

    /* 优先使用标准用户区；兼容旧页面时通过原头像定位容器并移除头像。 */
    var userArea = document.getElementById('userMenuContainer');
    var avatarSpans = header.querySelectorAll('.rounded-full span');
    var avatarSpan = null;
    for (var i = avatarSpans.length - 1; i >= 0; i--) {
      if (!avatarSpans[i].closest('#userMenu')) { avatarSpan = avatarSpans[i]; break; }
    }
    if (!userArea && avatarSpan) userArea = avatarSpan.parentElement && avatarSpan.parentElement.parentElement;
    if (!userArea) return;
    if (avatarSpan && avatarSpan.parentElement) avatarSpan.parentElement.remove();
    userArea.classList.add('pbs-user-area');

    /* 用户区文本行（排除头像字母、用户菜单内容、徽章） */
    var texts = [];
    userArea.querySelectorAll('p, span').forEach(function (el) {
      if (el.children.length) return;
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
      userArea.insertBefore(badge, userArea.firstChild);
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
      var menuAvatar = menu.querySelector('.w-10.h-10.rounded-full');
      if (menuAvatar) menuAvatar.remove();
      ensureSystemSettingsMenuItem(menu);
    } else {
      injectUserMenu(userArea, session);
    }
    bindUserMenuToggle(userArea);
  }

  /* 注入标准用户菜单（下拉） */
  function injectUserMenu(userArea, session) {
    userArea.style.position = 'relative';
    userArea.style.cursor = 'pointer';
    var menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'absolute top-12 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-3 hidden z-50';
    menu.innerHTML =
      '<div class="px-5 py-3 border-b border-gray-100"><div><p class="text-sm font-semibold text-gray-900">' + session.name + '</p>' +
      '<p class="text-xs text-blue-600 mt-0.5">' + (session.previewLabel || session.role) + (session.org ? ' · ' + session.org : '') + '</p>' +
      '<p class="text-xs text-gray-500">' + (session.email || '') + '</p></div></div>' +
      '<div class="py-1">' +
      '<a href="#" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>个人设置</a>' +
      '<a href="#" data-pbs-change-password class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 2a8 8 0 11-16 0 8 8 0 0116 0zm-4 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>修改密码</a>' +
      '<a href="#" data-pbs-system-settings class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' + ICONS.cog + '"></path></svg>系统设置</a>' +
      '<a href="#" class="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">' +
      '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>退出登录</a></div>' +
      '<div class="px-5 py-2 border-t border-gray-100"><p class="text-xs text-gray-400">PBS留学CRM v2.5</p></div>';
    userArea.appendChild(menu);
  }

  function bindUserMenuToggle(userArea) {
    if (!userArea || userArea.dataset.pbsUserMenuBound === 'true') return;
    var menu = userArea.querySelector('#userMenu') || document.getElementById('userMenu');
    if (!menu) return;
    userArea.dataset.pbsUserMenuBound = 'true';
    userArea.style.position = 'relative';
    userArea.style.cursor = 'pointer';
    userArea.addEventListener('click', function (e) {
      if (e.target.closest('#userMenu a, #userMenu button')) return;
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
      /* 介绍视频保留声音：先尝试有声播放，被浏览器自动播放策略拦截时降级为静音并提示 */
      nativeVideo.muted = false;
      nativeVideo.volume = 1;
      if (restart !== false) nativeVideo.currentTime = 0;
      nativeVideo.load();
      var result = nativeVideo.play();
      if (result && result.catch) result.catch(function () {
        nativeVideo.muted = true;
        var retry = nativeVideo.play();
        if (retry && retry.catch) retry.catch(function () { introPlaying = false; renderIntroPlayback(); });
      });
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

  /* 退出登录 / 个人设置 / 系统设置 / 修改密码（事件委托，兼容所有页面） */
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
    } else if (t.hasAttribute('data-pbs-change-password') || txt === '修改密码') {
      e.preventDefault();
      e.stopPropagation();
      openChangePasswordDialog();
    } else if (t.hasAttribute('data-pbs-system-settings') || txt === '系统设置') {
      e.preventDefault();
      e.stopPropagation();
      openSystemSettings();
    }
  }, true);

  /* ---------------- 首次登录/主动修改密码 ---------------- */
  function openChangePasswordDialog(force) {
    var session = window.pbsGetSession();
    var oldLayer = document.getElementById('pbsChangePwdLayer');
    if (oldLayer) oldLayer.remove();
    var layer = document.createElement('div');
    layer.id = 'pbsChangePwdLayer';
    layer.style.cssText = 'position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.5);backdrop-filter:blur(2px);';
    layer.innerHTML =
      '<div style="background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.25);width:min(420px,92vw);overflow:hidden;">' +
      '<div style="padding:20px 24px;border-bottom:1px solid #EDEFF2;"><h3 style="margin:0;font-size:17px;font-weight:700;color:#1F2937;">' + (force ? '首次登录，请修改初始密码' : '修改密码') + '</h3>' +
      '<p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;">密码需 8 位以上，同时包含字母与数字；修改后请使用新密码重新登录。</p></div>' +
      '<div style="padding:20px 24px;display:grid;gap:12px;">' +
      '<label style="display:grid;gap:6px;font-size:13px;color:#4B5563;">当前密码<input id="pbsPwdOld" type="password" autocomplete="current-password" style="height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;"></label>' +
      '<label style="display:grid;gap:6px;font-size:13px;color:#4B5563;">新密码<input id="pbsPwdNew" type="password" autocomplete="new-password" style="height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;"></label>' +
      '<label style="display:grid;gap:6px;font-size:13px;color:#4B5563;">确认新密码<input id="pbsPwdNew2" type="password" autocomplete="new-password" style="height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;"></label>' +
      '<p id="pbsPwdError" style="margin:0;font-size:12px;color:#DC2626;min-height:16px;"></p></div>' +
      '<div style="padding:14px 24px;border-top:1px solid #EDEFF2;display:flex;justify-content:flex-end;gap:10px;">' +
      (force ? '' : '<button id="pbsPwdCancel" style="height:36px;padding:0 14px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;color:#4B5563;font-size:13px;cursor:pointer;">取消</button>') +
      '<button id="pbsPwdSubmit" style="height:36px;padding:0 18px;border:0;border-radius:8px;background:#2563EB;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">确认修改</button></div></div>';
    document.body.appendChild(layer);
    document.body.style.overflow = 'hidden';
    function close() { layer.remove(); document.body.style.overflow = ''; }
    var cancelBtn = layer.querySelector('#pbsPwdCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    layer.querySelector('#pbsPwdSubmit').addEventListener('click', function () {
      var oldPwd = layer.querySelector('#pbsPwdOld').value;
      var newPwd = layer.querySelector('#pbsPwdNew').value;
      var newPwd2 = layer.querySelector('#pbsPwdNew2').value;
      var err = layer.querySelector('#pbsPwdError');
      err.textContent = '';
      if (!window.pbsAccounts.verifyPassword(session.account || session.email, oldPwd)) { err.textContent = '当前密码不正确'; return; }
      if (newPwd.length < 8 || !/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) { err.textContent = '密码需为 8 位以上，并同时包含字母与数字'; return; }
      if (newPwd !== newPwd2) { err.textContent = '两次输入的新密码不一致'; return; }
      window.pbsAccounts.setPassword(session.account || session.email, newPwd);
      try {
        var accounts = window.pbsAccounts.all();
        var rec = window.pbsAccounts.find(session.account || session.email);
        if (rec) rec.mustChangePassword = false;
        localStorage.setItem(window.pbsAccounts.key, JSON.stringify(accounts));
      } catch (e) {}
      window.pbsRecordOperation('账号与权限', '修改', '用户 ' + session.name + ' 修改了登录密码');
      close();
      alert('密码修改成功，请使用新密码重新登录');
      window.pbsLogout();
    });
  }
  window.pbsOpenChangePassword = function () { openChangePasswordDialog(false); };

  window.pbsShowUrgeSuccess = function () {
    var previous = document.getElementById('pbsUrgeSuccessToast');
    if (previous) previous.remove();
    var toast = document.createElement('div');
    toast.id = 'pbsUrgeSuccessToast';
    toast.textContent = '已通过短信和系统通知催办';
    toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:10080;padding:11px 18px;border-radius:10px;background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;font-size:14px;font-weight:700;box-shadow:0 12px 32px rgba(127,29,29,.16)';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2600);
  };

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
      if (item.recipientName) {
        /* 按姓名匹配：同时兼容「演示姓名」与登录账号名；账号库中能对上当前用户即视为接收人 */
        var nameMatches = item.recipientName === session.name;
        if (!nameMatches && window.pbsAccounts) {
          var rec = window.pbsAccounts.find(session.account || session.email || '');
          nameMatches = !!rec && (rec.name === item.recipientName);
        }
        /* 种子演示通知（张老师/王强等无对应账号）仅作为角色级示例，不因姓名不符而屏蔽单角色用户 */
        var hasDemoName = ['张老师', '王老师', '李老师', '赵老师', '刘老师', '陈老师', '杨老师', '孙老师', '周老师', '吴老师', '郑老师', '王强'].indexOf(item.recipientName) >= 0;
        if (!nameMatches && !hasDemoName) return false;
      }
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
    if (!Array.isArray(created.channels)) created.channels = created.kind === 'task_urge' ? ['系统通知', '短信通知'] : ['系统通知'];
    custom.unshift(created);
    localStorage.setItem(NOTIFICATION_STORE_KEY, JSON.stringify(custom.slice(0, 200)));
    updateNotificationBell();
    if (document.getElementById('pbsNotificationCenter') && document.getElementById('pbsNotificationCenter').classList.contains('is-open')) window.pbsOpenNotifications(lastNotificationTrigger);
    return created.id;
  };
  window.pbsSendUrgeNotification = function (options) {
    options = options || {};
    var roleMap = { '审核人员': '文书审核', '文书审核': '文书审核', '文书人员': '文书人员', '文书交付人员': '文书人员', '网申人员': '网申人员', '项目经理': '项目经理', '学生': '项目经理' };
    var recipientRole = roleMap[options.role] || options.role || '项目经理';
    var session = window.pbsGetSession ? window.pbsGetSession() : { org: 'PBS留学总部', name: '当前用户' };
    return window.pbsCreateNotification({
      kind: 'task_urge',
      type: '任务催办提醒',
      title: (options.task || '当前任务') + '收到催办',
      business: options.business || options.task || '业务任务',
      detail: '催办已同时通过系统通知与短信发送，请尽快处理并反馈进度。',
      reminderBy: (session.name || '当前用户') + '（' + (session.role || '业务人员') + '）',
      reminderNote: options.note || '请优先处理该任务，完成后及时反馈进度。',
      recipientRoles: [recipientRole],
      recipientName: options.target || '',
      organization: session.org || 'PBS留学总部',
      href: options.href || '',
      channels: ['系统通知', '短信通知'],
      level: 'danger'
    });
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
      var channels = Array.isArray(item.channels) ? item.channels : (item.kind === 'task_urge' ? ['系统通知', '短信通知'] : ['系统通知']);
      var channelHtml = '<div class="pbs-notification-channels">' + channels.map(function(channel) { return '<span class="' + (channel === '短信通知' ? 'is-sms' : '') + '">' + notificationEscape(channel) + '</span>'; }).join('') + '</div>';
      var reminder = item.kind === 'task_urge'
        ? '<div class="pbs-notification-reminder"><span>催办人：' + notificationEscape(item.reminderBy || '—') + '</span><span>催办说明：' + notificationEscape(item.reminderNote || '—') + '</span></div>' : '';
      return '<article tabindex="0" class="pbs-notification-item is-' + notificationEscape(item.level || 'primary') + (isUnread ? ' is-unread' : '') + '" data-pbs-notification-id="' + notificationEscape(item.id) + '"><span class="pbs-notification-dot"></span><div><div class="pbs-notification-meta"><span>' + notificationEscape(item.type) + '</span><div><em>' + (isUnread ? '未读' : '已读') + '</em><time>' + notificationEscape(item.time) + '</time></div></div>' + channelHtml + '<h3>' + notificationEscape(item.title) + '</h3><p class="pbs-notification-business">' + notificationEscape(item.business || '') + '</p><p>' + notificationEscape(item.detail) + '</p>' + reminder + '<button type="button" class="pbs-notification-action">立即处理</button></div></article>';
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
      /* 分配/更换抽屉由页面内脚本自行绑定（openAssignDrawer/openChangePMDrawer 为页面闭包函数），此处不重复绑定 */
    },
    /* 学生档案：是否可编辑由 customer_edit 权限决定。 */
    '学生档案详情页 - 留学申请管理系统.html': function (session) {
      if (session && !sessionHasPermission(session, 'customer_edit')) {
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
  /* 工作台宿主页：always=独立工作台页；param=列表页以 #workbench（兼容 ?view=workbench）承载工作台视角 */
  var WORKBENCH_HOSTS = {
    '管理员工作台 - 留学申请管理系统.html': { always: true, keys: ['platform', 'orgadmin', 'pmo', 'salesmanager', 'sales', 'pm', 'writer', 'audit', 'apply', 'docadmin'] },
    '平台运维工作台 - PBS留学CRM系统.html': { always: true, keys: ['platform'], permission: 'workbench_platform' },
    '机构管理员工作台 - 留学申请管理系统.html': { always: true, keys: ['orgadmin'], permission: 'workbench_org_admin' },
    'PMO工作台 - 留学申请管理系统.html': { always:true, keys:['pmo'], permission:'workbench_pmo' },
    '项目经理工作台 - 留学申请管理系统.html': { always: true, keys: ['pm'] },
    '任务列表页 - 文书交付系统.html': { param: true, keys: ['writer', 'docadmin'] },
    '选校任务列表页 - 留学申请管理系统.html': { param: true, keys: ['salesmanager', 'sales'] },
    '网申任务列表页 - 留学申请管理系统.html': { param: true, keys: ['apply'] },
    '文书审核列表页 - 留学申请管理系统.html': { param: true, keys: ['audit'] }
  };

  /* 把任意版本（旧按模块 / 新按页面）的已保存配置统一归一化成
     { 页面分组 id: [权限项 id] } 的新结构；旧 id 经 LEGACY_PERMISSION_ALIASES 展开。 */
  function migrateSavedRolePermissions(role, source) {
    var flat = [];
    Object.keys(source || {}).forEach(function (groupId) {
      var ids = source[groupId];
      if (!Array.isArray(ids)) return;
      ids.forEach(function (id) { if (flat.indexOf(id) < 0) flat.push(id); });
    });
    /* 兼容最早期的通用工作台权限：只转换成该角色自己的工作台视角。 */
    if (flat.indexOf('workbench_view') >= 0) {
      var ownWorkbench = WORKBENCH_ROLE_PERMISSION[role];
      if (ownWorkbench && flat.indexOf(ownWorkbench) < 0) flat.push(ownWorkbench);
    }
    var value = permissionGroupIds(normalizePermissionIds(flat, isLegacyPermissionShape(source)));
    /* 平台运维不参与机构侧学生档案业务 */
    if (role === '平台运维人员') {
      value.student_list = [];
      value.student_detail = [];
      Object.keys(value).forEach(function (groupId) {
        value[groupId] = (value[groupId] || []).filter(function (id) { return PLATFORM_FORBIDDEN_PERMISSIONS.indexOf(id) < 0; });
      });
    }
    (REQUIRED_ROLE_PERMISSIONS[role] || []).forEach(function (id) {
      var groupId = PERMISSION_GROUP_OF[id];
      if (groupId && value[groupId] && value[groupId].indexOf(id) < 0) value[groupId].push(id);
    });
    /* 平台系统页面只允许平台运维角色持有；机构内置角色和自建角色的
       历史残留一律清空，避免配置页显示已授权而运行时必然拒绝。 */
    if (role !== '平台运维人员' && role !== '超级管理员') {
      PLATFORM_ONLY_PAGE_GROUPS.forEach(function (groupId) { value[groupId] = []; });
    }
    if (role !== 'PMO') Object.keys(value).forEach(function(group) { value[group] = (value[group] || []).filter(function(id) { return id !== 'archive_approve'; }); });
    return value;
  }
  function savedRolePerms() {
    try {
      var saved = JSON.parse(localStorage.getItem(ROLE_PERMS_KEY) || '{}');
      Object.keys(saved || {}).forEach(function (role) {
        saved[role] = migrateSavedRolePermissions(role, saved[role]);
      });
      return saved;
    } catch (e) { return {}; }
  }
  /* 角色是否拥有指定权限点（读取角色权限管理页保存的配置） */
  function roleHasPermission(role, permIds) {
    if (role !== 'PMO' && permIds && permIds.indexOf('archive_approve') >= 0) { permIds = permIds.filter(function(id) { return id !== 'archive_approve'; }); if (!permIds.length) return false; }
    if (!permIds || !permIds.length) return true;
    if (role === '超级管理员') return true;
    if (role === '平台运维人员') {
      permIds = permIds.filter(function (id) { return PLATFORM_FORBIDDEN_PERMISSIONS.indexOf(id) < 0; });
      if (!permIds.length) return false;
    }
    var perms = savedRolePerms();
    var p = perms[role] || DEFAULT_ROLE_PERMISSIONS[role];
    if (!p) return false;
    return permIds.some(function (id) {
      return Object.keys(p).some(function (mod) { return (p[mod] || []).indexOf(id) >= 0; });
    });
  }
  function roleIsConfigured(role) {
    if (role === '超级管理员') return true;
    var perms = savedRolePerms();
    return !!(perms && perms[role]);
  }
  function sessionRoles(session) {
    if (!session) return [];
    if (session.previewRole && session.previewRole !== 'all') return [session.previewRole];
    return session.userRoles && session.userRoles.length ? session.userRoles.slice() : [session.role];
  }
  function sessionHasPermission(session, permIds) {
    if (!permIds || (Array.isArray(permIds) && !permIds.length)) return true;
    var ids = Array.isArray(permIds) ? permIds : [permIds];
    return sessionRoles(session).some(function (role) { return roleHasPermission(role, ids); });
  }
  window.pbsHasPermission = function (permIds) {
    return sessionHasPermission(window.pbsGetSession ? window.pbsGetSession() : null, permIds);
  };

  /* ---------------- 按钮级权限 ----------------
     复用角色权限页现有权限点；没有独立权限点的动作暂随所属页面权限，不擅自扩充配置项。 */
  var ACTION_PERMISSION_RULES = {
    '学生档案列表页 - 留学申请管理系统.html': [
      { permission: 'customer_manage', texts: ['新增学生档案','新增档案','批量导入','导入学生档案','确认导入','删除','批量删除'] },
      { permission: 'customer_export', texts: ['导出','批量导出'] }
    ],
    '学生档案详情页 - 留学申请管理系统.html': [
      { permission: 'customer_edit', texts: ['编辑档案','保存','新增科目','新增字段','编辑字段信息','保存设置','添加工作经历','添加教育经历','添加荣誉','添加实践经历','添加学术发表','添加账号','添加资质','上传文件','开始上传','选择文件','删除'] }
    ],
    '项目池列表页 - 留学申请管理系统.html': [
      { permission: 'project_create', texts: ['新增项目','新建项目','创建项目档案','确认创建','移除'] },
      { permission: 'project_team_manage', texts: ['分配','更换人员','完成分配'] }
    ],
    '项目详情页 - 留学申请管理系统.html': [
      { permission: 'project_team_manage', texts: ['分配','更换人员','完成分配','更换项目经理','提前分配','按需更换'] }
    ],
    '我的项目列表页 - 留学申请管理系统.html': [
      { permission: 'my_project_handle', texts: ['接收','立即接收','退回','确认退回'] }
    ],
    '我的项目详情页 - 留学申请管理系统.html': [
      { permission: 'my_project_team_manage', texts: ['分配','更换人员','完成分配'] },
      { permission: 'my_project_complete', texts: ['完成任务','确认完成'] }
    ],
    '院校目标详情页 - 留学申请管理系统.html': [
      { permission: 'goal_team_manage', texts: ['分配任务','确认分发','更换分配','确认更换'] },
      { permission: 'goal_complete', texts: ['完成任务','确认完成'] }
    ],
    '机构管理 - PBS留学CRM系统.html': [
      { permission: 'personnel_view', texts: ['查看成员'] }
    ],
    '人员管理 - PBS留学CRM系统.html': [
      { permission: 'personnel_manage', texts: ['新增成员','确认创建','编辑','保存','停职','复职'] },
      { permission: 'personnel_manage', selector: '#add-expiry-type,#add-expiry-date,#add-must-change-pwd,input[name="add-status"]', mode: 'disable' },
      { permission: 'personnel_assign_roles', selector: '#add-roles input,#edit-roles input', mode: 'disable' }
    ],
    '任务列表页 - 文书交付系统.html': [
      { permission: 'doc_editor_view', texts: ['进入文书编辑器'] },
      { permission: 'doc_task_handle', texts: ['接收','立即接收','接收任务','退回','确认退回'] }
    ],
    '文书编辑器 - 文书交付系统.html': [
      { permission: 'doc_edit', texts: ['保存','编辑','补充信息','删除','新增邮箱','基于当前内容发起请求','扩写段落','润色优化','续写段落','语法检查','AI修改','套用','确认套用','上传文件','开始上传','选择文件'] },
      { permission: 'doc_submit', texts: ['提交','确认提交','完成任务'] },
      { permission: 'doc_download', texts: ['导出Word','下载'] }
    ],
    '模板库列表 - 文书交付系统.html': [
      { permission: 'library_manage', texts: ['新建模板','删除','批量删除','导入','批量导入'] },
      { permission: 'doc_template_edit_view', texts: ['编辑'] },
      { permission: 'library_export', texts: ['下载','导出','批量导出'] }
    ],
    '模板库编辑 - 文书交付系统.html': [
      { permission: 'doc_template_save', texts: ['保存'] }
    ],
    '案例库 - 文书交付系统.html': [
      { permission: 'case_manage', texts: ['生成模板','解析','开始解析','批量解析','批量填充示例信息','重新解析','批量删除','删除','删除案例','上传案例包','上传并入库'] },
      { permission: 'case_export', texts: ['批量导出','下载','下载原文'] }
    ],
    '网申模板库 - 留学申请管理系统.html': [
      { permission: 'app_library_manage', texts: ['新增模板','删除','导入','确认导入'] },
      { permission: 'app_template_edit_view', texts: ['编辑模板','编辑'] },
      { permission: 'app_library_export', texts: ['导出','下载'] }
    ],
    '网申模板编辑 - 留学申请管理系统.html': [
      { permission: 'app_template_save', texts: ['保存','保存模板'] }
    ],
    '网申任务列表页 - 留学申请管理系统.html': [
      { permission: 'app_task_handle', texts: ['接收','立即接收','接收任务','领取任务','退回','确认退回'] }
    ],
    '文书审核列表页 - 留学申请管理系统.html': [
      { permission: 'review_task_handle', texts: ['接收','退回','确认退回'] }
    ],
    '文书审核详情页 - 留学申请管理系统.html': [
      { permission: 'review_score', texts: ['保存修改','采纳AI评分','提交批注','修改评分','修改文书','生成AI评价','重新生成'] },
      { permission: 'review_decide', texts: ['打回重写','确认打回','审核通过'] },
      { permission: 'review_download', texts: ['下载','导出'] }
    ],
    '网申任务详情页 - 留学申请管理系统.html': [
      { permission: 'app_fill', texts: ['保存表单','保存配置','复用此版本','复用模板','更换图片','配置进度线','确认绑定','添加节点','移除','从EV系统导入','确认导入','确认上传','上传','上传材料'] },
      { permission: 'app_submit', texts: ['保存申请结果','更新进度','确认更新','上传Offer/结果图片'] }
    ],
    '监控任务列表 - PBS留学CRM.html': [
      { permission: 'monitor_track', texts: ['手动触发'] }
    ],
    '监控详情页 - 留学申请管理系统.html': [
      { permission: 'monitor_track', texts: ['手动触发'] }
    ],
    '监控详情页（官网） - 留学申请管理系统.html': [
      { permission: 'monitor_track', texts: ['手动触发'] },
      { permission: 'monitor_site_manage', texts: ['编辑配置','保存配置','上传监控记录','上传截图','确认上传'] }
    ],
    '监控详情页（邮件） - 留学申请管理系统.html': [
      { permission: 'monitor_track', texts: ['手动触发'] },
      { permission: 'monitor_mail_manage', texts: ['编辑配置','保存配置','上传监控记录','上传截图','确认上传'] }
    ],
    '结项详情页 - 留学申请管理系统.html': [
      { permission: 'archive_create', texts: ['查看/编辑','保存','生成报告','生成并导出 PDF','导出 PDF','重新生成','上传并应用母报告','恢复机构 Logo','图片上传','编辑内容','插入Offer邮件图片','生成《客户项目结项报告》','生成《项目管理结项报告》'] },
      { permission: 'archive_create', texts: ['确认结果'] },
      { permission: 'archive_submit', texts: ['提交结项材料'] },
      { permission: 'archive_approve', texts: ['确认结项','手动确认结项'] }
    ],
    '选校任务列表页 - 留学申请管理系统.html': [
      { permission: 'school_task_manage', texts: ['新建任务','确认创建'] },
      { permission: 'school_plan', texts: ['进入工作台'] },
      { permission: 'school_task_manage', selector: '#selTaskTbody select', mode: 'disable' }
    ],
    '选校工作台页 - 留学申请管理系统.html': [
      { permission: 'school_plan_manage', selector: '#schoolWorkspace button,#schoolActionBar button,#savePlanModal button', texts: ['加入清单','加入选校清单','删除','保存方案'] },
      { permission: 'school_plan_share', texts: ['分享客户（H5链接）'] },
      { permission: 'school_plan_manage', selector: '#workbenchHistoryModal button,#workbenchCommunicationModal button', texts: ['新增记录','编辑','删除','保存'] }
    ],
    '角色权限管理 - 留学申请管理系统.html': [
      { permission: 'sys_role_manage', texts: ['新增角色','确认创建','删除','保存并生效'] }
    ],
    '操作日志审计 - 留学申请管理系统.html': [
      { permission: 'sys_log_export', texts: ['导出'] }
    ],
    'AI管理 - 留学申请管理系统.html': [
      { permission: 'ai_manage', selector: '[data-tab="models"]' },
      { permission: 'ai_view', selector: '[data-tab="monitor"]' },
      { permission: 'ai_manage', selector: '[data-tab="prompts"]' },
      { permission: 'ai_manage', texts: ['新增 AI 模型'] },
      { permission: 'ai_manage', selector: '#modelRows button,#modelModal button', texts: ['编辑','删除','确认'] },
      { permission: 'ai_manage', selector: '#pane-models select,#modelModal input,#modelModal select', mode: 'disable' },
      { permission: 'ai_manage', selector: '#modelRows button,#modelKeyPoolModal button', texts: ['配置 Key','添加 Key','保存 Key','检测','启用','停用','移出','复用','删除'] },
      { permission: 'ai_view', texts: ['刷新数据'] },
      { permission: 'ai_manage', selector: '#pane-prompts input,#pane-prompts textarea,#pane-prompts select', mode: 'disable' }
    ],
    '视频管理 - 留学申请管理系统.html': [
      { permission: 'video_manage', texts: ['管理视频','保存展示内容','选择视频','保存播放策略','重置所有账号首次播放'] },
      { permission: 'video_manage', selector: '#videoFileInput,#videoEnabled,#autoPlayFirstVisit', mode: 'disable' }
    ]
  };

  function normalizedActionText(element) {
    return String(element && element.textContent || '').replace(/\s+/g, '').replace(/[→↗＋+✎📤⚡]/g, '').trim();
  }
  function matchesActionText(element, texts) {
    if (!texts || !texts.length) return true;
    var actual = normalizedActionText(element);
    return texts.some(function (text) {
      var expected = String(text).replace(/\s+/g, '').replace(/[→↗＋+✎📤⚡]/g, '');
      return actual === expected || actual.slice(-expected.length) === expected;
    });
  }
  function restrictAction(element, mode) {
    if (!element || element.getAttribute('data-pbs-permission-locked') === 'true') return;
    element.setAttribute('data-pbs-permission-locked', 'true');
    element.setAttribute('aria-disabled', 'true');
    element.title = '当前角色无此操作权限';
    if (mode === 'disable') {
      element.disabled = true;
      element.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      element.style.display = 'none';
    }
  }
  function applyActionPermissions(session, file) {
    document.querySelectorAll('[data-pbs-permission]').forEach(function (element) {
      var ids = String(element.getAttribute('data-pbs-permission') || '').split(',').map(function (id) { return id.trim(); }).filter(Boolean);
      if (!sessionHasPermission(session, ids)) restrictAction(element, element.getAttribute('data-pbs-permission-mode'));
    });
    (ACTION_PERMISSION_RULES[file] || []).forEach(function (rule) {
      if (sessionHasPermission(session, rule.permission)) return;
      document.querySelectorAll(rule.selector || 'button,a').forEach(function (element) {
        if (matchesActionText(element, rule.texts)) restrictAction(element, rule.mode);
      });
    });
    if (file === 'AI管理 - 留学申请管理系统.html') ensureAccessibleAiTab(session);
  }

  function ensureAccessibleAiTab(session) {
    var tabPermissions = { models: ['ai_manage'], monitor: ['ai_view'], prompts: ['ai_manage'] };
    var firstAllowed = null;
    Object.keys(tabPermissions).forEach(function (tabId) {
      var allowed = sessionHasPermission(session, tabPermissions[tabId]);
      var tab = document.querySelector('[data-tab="' + tabId + '"]');
      var pane = document.getElementById('pane-' + tabId);
      if (!allowed) {
        if (tab) tab.style.display = 'none';
        if (pane) pane.style.display = 'none';
      } else if (!firstAllowed) {
        firstAllowed = tab;
      }
    });
    var activeTab = document.querySelector('[data-tab].active');
    if ((!activeTab || activeTab.style.display === 'none') && firstAllowed) firstAllowed.click();
  }
  function observePermissionActions(session, file) {
    if (!window.MutationObserver || document.documentElement.getAttribute('data-pbs-permission-observed') === 'true') return;
    document.documentElement.setAttribute('data-pbs-permission-observed', 'true');
    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; applyActionPermissions(session, file); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  function workbenchPermissionVisible(session, permissionId) {
    if (!permissionId) return false;
    var checkRoles = (session.previewRole && session.previewRole !== 'all')
      ? [session.previewRole]
      : (session.userRoles && session.userRoles.length ? session.userRoles : [session.role]);
    if (checkRoles.indexOf('超级管理员') >= 0) return true;
    var perms = savedRolePerms();
    return checkRoles.some(function (r) {
      var configuredSource = perms[r] || DEFAULT_ROLE_PERMISSIONS[r];
      if (!configuredSource) return false;
      /* 工作台视角权限项统一挂在 wb_home 分组下；兼容旧版 workbench 分组键。 */
      var configured = Array.isArray(configuredSource.wb_home) ? configuredSource.wb_home
        : (Array.isArray(configuredSource.workbench) ? configuredSource.workbench : null);
      if (!configured) return false;
      if (configured.indexOf(permissionId) >= 0) return true;
      /* 兼容旧版通用 workbench_view：只折算为该角色自己的工作台。 */
      return configured.indexOf('workbench_view') >= 0 && WORKBENCH_ROLE_PERMISSION[r] === permissionId;
    });
  }
  function workbenchVisible(session) {
    return sessionRoles(session).indexOf('超级管理员') >= 0 || workbenchPermissionVisible(session, WORKBENCH_ROLE_PERMISSION[session.role]);
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

  /* 在当前页面挂载 Navbar 当前角色对应的工作台 */
  function mountRoleWorkbench(session, file) {
    var host = WORKBENCH_HOSTS[file];
    if (!host) return;
    var isWorkbenchView = host.always || isWorkbenchRequest();
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
    var activeKey = window.pbsWorkbench.ROLE_KEY[session.role];
    if (keys.indexOf(activeKey) < 0) activeKey = keys[0];
    window.pbsWorkbench.mount(mount, keys, { active: activeKey });
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

  /* ---------------- 一级列表页：标题与筛选统一 ---------------- */
  var FILTER_PAGE_CONTROLS = {
    '学生档案列表页 - 留学申请管理系统.html': '#flt-kw',
    '项目池列表页 - 留学申请管理系统.html': '#flt-kw',
    '我的项目列表页 - 留学申请管理系统.html': '#flt-kw',
    '任务列表页 - 文书交付系统.html': '#flt-kw',
    '模板库列表 - 文书交付系统.html': '[data-dom-id="filter-type"]',
    '案例库 - 文书交付系统.html': '#flt-kw',
    '文书审核列表页 - 留学申请管理系统.html': '#flt-kw',
    '网申任务列表页 - 留学申请管理系统.html': '#flt-kw',
    '网申模板库 - 留学申请管理系统.html': '#templateKeyword',
    '监控任务列表 - PBS留学CRM.html': '#monitorKeyword',
    '结项归档列表 - PBS留学CRM系统.html': '#flt-kw',
    '选校订单池页 - 留学申请管理系统.html': '#flt-kw',
    '选校任务列表页 - 留学申请管理系统.html': '#flt-kw',
    '用户管理 - 留学申请管理系统.html': '#flt-kw',
    '人员管理 - PBS留学CRM系统.html': '#flt-kw',
    '机构管理 - PBS留学CRM系统.html': '#organizationSearch',
    '操作日志审计 - 留学申请管理系统.html': '#flt-kw'
  };

  function mountAdvancedFilter(file) {
    if (!FILTER_PAGE_CONTROLS[file]) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/pbs-advanced-filter.css?v=6.6';
    document.head.appendChild(link);
    var script = document.createElement('script');
    script.src = './assets/js/pbs-advanced-filter.js?v=6.8';
    script.onload = function () {
      if (window.PBSAdvancedFilter) {
        window.PBSAdvancedFilter.mount({ file: file, controlSelector: FILTER_PAGE_CONTROLS[file] });
      }
    };
    document.head.appendChild(script);
  }

  function closestFilterCard(control) {
    return control ? control.closest('.bg-white.rounded-xl, .card, .monitor-filter') : null;
  }

  function findFilterField(control, card) {
    var node = control ? control.parentElement : null;
    while (node && node !== card) {
      if (node.querySelector('label') && node.querySelector('input:not([type="hidden"]), select')) return node;
      node = node.parentElement;
    }
    return null;
  }

  function isFilterField(node) {
    return !!(node && node.querySelector && node.querySelector('label') &&
      node.querySelector('input:not([type="hidden"]), select'));
  }

  function filterFieldIsSearch(node) {
    var label = node.querySelector('label');
    var input = node.querySelector('input[type="text"], input[type="search"]');
    var text = ((label && label.textContent) || '') + ' ' + ((input && input.placeholder) || '');
    return !!input && /关键词|搜索/.test(text);
  }

  function syncFilterSelect(select) {
    var group = select.parentElement.querySelector('.pbs-filter-options');
    if (!group) return;
    Array.prototype.forEach.call(group.querySelectorAll('.pbs-filter-option'), function(button) {
      var selected = button.getAttribute('data-value') === select.value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function enhanceFilterSelect(select, label) {
    if (!select || select.disabled || select.classList.contains('pbs-filter-native-select') || select.options.length < 2) return;
    var group = document.createElement('div');
    group.className = 'pbs-filter-options';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label || '筛选选项');
    Array.prototype.forEach.call(select.options, function(option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pbs-filter-option';
      button.textContent = option.textContent;
      button.setAttribute('data-value', option.value);
      button.addEventListener('click', function() {
        select.value = option.value;
        syncFilterSelect(select);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      group.appendChild(button);
    });
    select.classList.add('pbs-filter-native-select');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    select.parentNode.insertBefore(group, select.nextSibling);
    syncFilterSelect(select);
  }

  function collectFilterButtons(card, rowsContainer, fieldRows) {
    var buttons = [];
    var fieldSet = fieldRows.slice();
    Array.prototype.forEach.call(Array.prototype.slice.call(rowsContainer.children), function(child) {
      if (fieldSet.indexOf(child) >= 0) return;
      if (child.tagName === 'BUTTON') buttons.push(child);
      else if (child.querySelector && !child.querySelector('label')) {
        Array.prototype.forEach.call(child.querySelectorAll('button'), function(button) { buttons.push(button); });
      }
    });
    var sibling = rowsContainer.nextElementSibling;
    if (sibling && !sibling.querySelector('table') && sibling.querySelector('button')) {
      Array.prototype.forEach.call(sibling.querySelectorAll('button'), function(button) { buttons.push(button); });
    }
    return buttons;
  }

  function enhanceFilterCard(card, firstControl) {
    var firstField = findFilterField(firstControl, card);
    if (!firstField) return;
    var rowsContainer = firstField.parentElement;
    var fieldRows = Array.prototype.filter.call(rowsContainer.children, isFilterField);
    if (!fieldRows.length) return;

    var searchRow = fieldRows.filter(filterFieldIsSearch)[0];
    if (searchRow && searchRow !== rowsContainer.firstElementChild) rowsContainer.insertBefore(searchRow, rowsContainer.firstElementChild);
    fieldRows = Array.prototype.filter.call(rowsContainer.children, isFilterField);

    var buttons = collectFilterButtons(card, rowsContainer, fieldRows);
    if (rowsContainer === card) {
      var rowWrap = document.createElement('div');
      rowWrap.className = 'pbs-filter-rows';
      card.insertBefore(rowWrap, fieldRows[0]);
      fieldRows.forEach(function(row) { rowWrap.appendChild(row); });
      rowsContainer = rowWrap;
    } else {
      rowsContainer.classList.add('pbs-filter-rows');
    }

    var visibleIndex = 0;
    fieldRows.forEach(function(row) {
      row.classList.add('pbs-filter-row');
      var label = row.querySelector('label');
      Array.prototype.forEach.call(row.querySelectorAll('select'), function(select) {
        enhanceFilterSelect(select, label ? label.textContent.trim() : '筛选选项');
      });
      if (!row.classList.contains('hidden')) {
        if (visibleIndex >= 2) {
          row.classList.add('pbs-filter-extra');
          row.hidden = true;
        }
        visibleIndex += 1;
      }
    });

    var oldButtonParents = [];
    buttons.forEach(function(button) {
      if (button.parentElement && button.parentElement !== rowsContainer && oldButtonParents.indexOf(button.parentElement) < 0) {
        oldButtonParents.push(button.parentElement);
      }
    });
    var footer = document.createElement('div');
    footer.className = 'pbs-filter-footer';
    if (visibleIndex > 2) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'pbs-filter-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span>展开筛选</span><span class="pbs-filter-toggle-icon">⌄</span>';
      toggle.addEventListener('click', function() {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        toggle.querySelector('span').textContent = expanded ? '展开筛选' : '收起筛选';
        Array.prototype.forEach.call(rowsContainer.querySelectorAll('.pbs-filter-extra'), function(row) { row.hidden = expanded; });
      });
      footer.appendChild(toggle);
    } else {
      footer.appendChild(document.createElement('span'));
    }
    if (buttons.length) {
      var actions = document.createElement('div');
      actions.className = 'pbs-filter-actions';
      buttons.forEach(function(button) { actions.appendChild(button); });
      footer.appendChild(actions);
    }
    oldButtonParents.forEach(function(parent) { if (!parent.children.length) parent.remove(); });
    card.appendChild(footer);
    buttons.forEach(function(button) {
      if (/重置/.test(button.textContent || '')) {
        button.addEventListener('click', function() {
          setTimeout(function() {
            Array.prototype.forEach.call(card.querySelectorAll('.pbs-filter-native-select'), syncFilterSelect);
          }, 0);
        });
      }
    });
  }

  function findListInfoBar(main, card) {
    var candidates = Array.prototype.filter.call(main.children, function(child) {
      if (child === card || !child.querySelector) return false;
      var heading = child.querySelector('h2');
      var next = child.nextElementSibling;
      return !!(heading && next && next.querySelector && next.querySelector('table'));
    });
    return candidates[0] || null;
  }

  function mergeListTitleIntoFilter(main, card) {
    var title = main.querySelector('h1');
    if (!title) return;
    var listInfoBar = findListInfoBar(main, card);
    var listHeading = listInfoBar && listInfoBar.querySelector('h2');
    if (listHeading && listHeading.textContent.trim()) title.textContent = listHeading.textContent.trim();
    var titleBar = title.closest('.pbs-detail-topbar');
    if (!titleBar) {
      titleBar = title.parentElement;
      while (titleBar.parentElement && titleBar.parentElement !== main && titleBar.parentElement !== card.parentElement) {
        titleBar = titleBar.parentElement;
      }
    }
    if (!titleBar || titleBar === card || titleBar.contains(card)) return;
    var titleLead = title.closest('.pbs-detail-topbar__main');
    if (!titleLead || !titleBar.contains(titleLead)) {
      titleLead = Array.prototype.filter.call(titleBar.children, function(child) { return child === title || child.contains(title); })[0] || title;
    }
    Array.prototype.forEach.call(titleLead.querySelectorAll ? titleLead.querySelectorAll('p') : [], function(desc) { desc.remove(); });

    var titleActions = Array.prototype.filter.call(titleBar.children, function(child) { return child !== titleLead; });
    var header = document.createElement('div');
    header.className = 'pbs-filter-card-header';
    var heading = document.createElement('div');
    heading.className = 'pbs-filter-card-heading';
    heading.appendChild(titleLead);
    header.appendChild(heading);
    if (titleActions.length) {
      var actions = document.createElement('div');
      actions.className = 'pbs-filter-card-actions';
      titleActions.forEach(function(child) { actions.appendChild(child); });
      header.appendChild(actions);
    }
    card.classList.add('pbs-filter-card');
    titleBar.parentNode.insertBefore(card, titleBar);
    card.insertBefore(header, card.firstChild);
    titleBar.remove();
    if (listInfoBar) listInfoBar.remove();
  }

  function enhanceListPage(file) {
    var controlSelector = FILTER_PAGE_CONTROLS[file];
    if (!controlSelector || document.getElementById('pbs-workbench-mount')) return;
    var main = document.querySelector('main');
    var control = main && main.querySelector(controlSelector);
    var card = closestFilterCard(control);
    if (!main || !control || !card) return;
    enhanceFilterCard(card, control);
    mergeListTitleIntoFilter(main, card);
  }

  function normalizeDisabledStatus(root) {
    (root || document).querySelectorAll('span').forEach(function (item) {
      var text = item.textContent.replace(/\s+/g, '');
      var styledState = /(?:border|bg-|badge|status|rounded)/.test(item.className || '');
      if ((text === '禁用' || text === '停用') && styledState) item.classList.add('pbs-status-disabled');
    });
  }

  function removeTextAvatars(root) {
    var scope = root || document;
    scope.querySelectorAll('[id$="Avatar"], .wb-pm-avatar, .wb-student-avatar, .student-avatar, .pm-owner-avatar').forEach(function (item) {
      if (!item.classList.contains('pbs-organization-avatar')) item.remove();
    });
    scope.querySelectorAll('.rounded-full.bg-gradient-to-br').forEach(function (item) {
      if (!item.querySelector('img, svg') && item.textContent.trim()) item.remove();
    });
  }

  function normalizeOutlinedColorControls(root) {
    (root || document).querySelectorAll('button, a').forEach(function (item) {
      var classes = item.className || '';
      var coloredBorder = /border-(?:blue|red|orange|amber|yellow|green|emerald|purple|violet|pink|rose)-/.test(classes);
      var coloredText = /text-(?:blue|red|orange|amber|yellow|green|emerald|purple|violet|pink|rose)-/.test(classes);
      var lightSurface = /(?:bg-white|bg-transparent)/.test(classes);
      if (coloredBorder && coloredText && lightSurface) item.classList.add('pbs-neutral-outline');
    });
  }

  function compactDetailBackLabels(root) {
    var labels = {
      '返回我的项目列表': '项目列表',
      '返回项目池列表': '项目列表',
      '返回文书审核列表': '文书列表',
      '返回文书任务列表': '文书列表',
      '返回网申任务列表': '网申列表',
      '返回监控任务列表': '监控列表',
      '返回结项归档列表': '结项列表',
      '返回学生档案列表': '学生列表',
      '返回选校任务列表': '选校列表',
      '返回模板库': '模板库',
      '返回网申模板库': '模板库',
      '返回项目详情': '项目详情'
    };
    (root || document).querySelectorAll('.pbs-detail-back').forEach(function (item) {
      var fullLabel = item.getAttribute('aria-label') || item.getAttribute('title') || '返回';
      item.dataset.backLabel = labels[fullLabel] || fullLabel.replace(/^返回/, '');
    });
  }

  function ensureDetailSidebar(file) {
    if (file.indexOf('详情') < 0 || document.getElementById('pbs-sidebar')) return;
    var main = document.querySelector('body > main') || document.querySelector('main');
    if (!main || main.closest('.pbs-detail-layout')) return;
    var layout = document.createElement('div');
    layout.className = 'pbs-detail-layout';
    var sidebar = document.createElement('aside');
    sidebar.id = 'pbs-sidebar';
    sidebar.className = 'bg-white border-r border-gray-200 flex-shrink-0';
    main.parentNode.insertBefore(layout, main);
    layout.appendChild(sidebar);
    layout.appendChild(main);
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
    /* 页面级RBAC（超级管理员放行所有页面）：
       1) 角色权限页保存过该角色配置 → 以权限点（PAGE_PERM_KEYS）为准；
       2) 未保存过配置 → 按 PAGE_PERMS 默认角色表放行。 */
    var perms = PAGE_PERMS[file];
    var permKeys = PAGE_PERM_KEYS[file];
    var activeRoles = sessionRoles(session);
    var denied = false;
    if (activeRoles.indexOf('超级管理员') < 0 && perms && !roleCanAccess(activeRoles, perms)) {
      denied = true;
    } else if (activeRoles.indexOf('超级管理员') < 0 && permKeys && !sessionHasPermission(session, permKeys)) {
      denied = true;
    }
    if (denied) {
      showForbiddenToast(session.role);
      setTimeout(function () { location.replace(ROLE_WORKBENCH[session.role]); }, 1200);
      return;
    }
    ensureDetailSidebar(file);
    renderSidebar(session, file);
    bindHeader(session);
    mountRoleWorkbench(session, file);
    var w = PAGE_WIRING[file];
    if (w) { try { w(session); } catch (e) { console.error(e); } }
    enhanceListPage(file);
    mountAdvancedFilter(file);
    normalizeDisabledStatus(document);
    removeTextAvatars(document);
    normalizeOutlinedColorControls(document);
    compactDetailBackLabels(document);
    applyActionPermissions(session, file);
    observePermissionActions(session, file);
    initSystemIntroduction(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  document.addEventListener('click', function () {
    setTimeout(function () {
      normalizeDisabledStatus(document);
      removeTextAvatars(document);
      normalizeOutlinedColorControls(document);
      compactDetailBackLabels(document);
    }, 0);
  });
})();

(function loadTaskReturns() {
  var script = document.createElement('script');
  script.src = './assets/js/pbs-task-return.js?v=1.4';
  document.head.appendChild(script);
})();

/* 已交付文件：文书、网申、结项归档与商城提交使用同一份跨页面数据。 */
(function loadDeliveryWorkflow() {
  var page = decodeURIComponent((location.pathname || '').split('/').pop() || '');
  var enabledPages = [
    '学生档案详情页 - 留学申请管理系统.html',
    '文书审核详情页 - 留学申请管理系统.html',
    '网申任务详情页 - 留学申请管理系统.html',
    '结项详情页 - 留学申请管理系统.html',
    '项目详情页 - 留学申请管理系统.html',
    '我的项目详情页 - 留学申请管理系统.html'
  ];
  if (enabledPages.indexOf(page) < 0) return;
  if (!document.querySelector('link[href*="pbs-delivery.css"]')) {
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = './assets/css/pbs-delivery.css?v=2.1';
    document.head.appendChild(style);
  }
  if (!document.querySelector('script[src*="pbs-delivery.js"]')) {
    var script = document.createElement('script');
  script.src = './assets/js/pbs-delivery.js?v=2.6';
    document.body.appendChild(script);
  }
})();
/* 列表筛选：关键词统一覆盖当前行全部可见文本字段。 */
(function () {
  function enrichFilterKeywords() {
    document.querySelectorAll('tbody tr[data-kw]').forEach(function (row) {
      var visibleText = (row.innerText || row.textContent || '').replace(/\s+/g, '').toLowerCase();
      var current = (row.getAttribute('data-kw') || '').replace(/\s+/g, '').toLowerCase();
      if (visibleText && current.indexOf(visibleText) < 0) row.setAttribute('data-kw', current + visibleText);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enrichFilterKeywords);
  else enrichFilterKeywords();
  document.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    var action = button && (button.getAttribute('onclick') || '');
    if (action && /(applyFilter|search|filter)/i.test(action)) enrichFilterKeywords();
  }, true);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target && /^flt-/.test(event.target.id || '')) enrichFilterKeywords();
  }, true);
})();

/* 筛选日期：统一显示“开始日期 / 结束日期”，保留浏览器原生日历选择能力。 */
(function () {
  function datePlaceholder(input) {
    if (input.getAttribute('data-date-placeholder')) return input.getAttribute('data-date-placeholder');
    if (input.id && /-end$/i.test(input.id)) return '结束日期';
    return '开始日期';
  }

  function updateDateField(input) {
    var field = input.closest('.pbs-filter-date-field');
    if (!field) return;
    var label = field.querySelector('.pbs-filter-date-label');
    var hasValue = Boolean(input.value);
    label.textContent = hasValue ? input.value : datePlaceholder(input);
    field.classList.toggle('has-value', hasValue);
  }

  function enhanceDateField(input) {
    if (input.dataset.pbsDateEnhanced === '1') return;
    input.dataset.pbsDateEnhanced = '1';

    var placeholder = datePlaceholder(input);
    var field = document.createElement('label');
    field.className = 'pbs-filter-date-field';
    field.setAttribute('title', placeholder);
    input.parentNode.insertBefore(field, input);

    var label = document.createElement('span');
    label.className = 'pbs-filter-date-label';
    field.appendChild(label);

    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'pbs-filter-date-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"></path>';
    field.appendChild(icon);

    field.appendChild(input);
    input.classList.add('pbs-filter-date-native');
    input.setAttribute('aria-label', placeholder);
    input.addEventListener('click', function () {
      if (typeof input.showPicker === 'function') {
        try { input.showPicker(); } catch (error) { /* 旧版浏览器继续使用原生点击行为 */ }
      }
    });
    input.addEventListener('keydown', function (event) {
      if ((event.key === 'Enter' || event.key === ' ') && typeof input.showPicker === 'function') {
        event.preventDefault();
        try { input.showPicker(); } catch (error) { /* 旧版浏览器继续使用原生键盘行为 */ }
      }
    });
    input.addEventListener('input', function () { updateDateField(input); });
    input.addEventListener('change', function () { updateDateField(input); });
    updateDateField(input);
  }

  function enhanceAllDateFields() {
    document.querySelectorAll('input[id^="flt-"][type="date"]').forEach(enhanceDateField);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAllDateFields);
  else enhanceAllDateFields();

  document.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    var action = button && (button.getAttribute('onclick') || '');
    if (action && /reset/i.test(action)) setTimeout(function () {
      document.querySelectorAll('.pbs-filter-date-native').forEach(updateDateField);
    }, 0);
  }, true);
})();

(function () {
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function section(title, color, icon, note) {
    return '<div class="border border-gray-200 rounded-xl p-4 mb-3 bg-white"><div class="flex items-center gap-2 mb-3"><span class="w-8 h-8 rounded-lg bg-' + color + '-100 text-' + color + '-600 flex items-center justify-center">' + icon + '</span><h3 class="text-sm font-semibold text-gray-800">' + title + '</h3></div>' + (note ? '<p class="text-xs text-gray-400 mb-3">' + note + '</p>' : '');
  }
  window.pbsStaffAssignmentFormHtml = function(goal, assignment, prefix, selections) {
    var docs = assignment.docs || {}, reviewers = assignment.reviewers || {};
    var html = section('文书交付人员', 'blue', '✎', '每种文书单独指定交付人员及交付 DDL，可只填部分文书');
    goal.docs.forEach(function(doc) {
      var key = prefix + 'd_' + doc.key, saved = docs[doc.key] || {}, ddl = saved.ddl || doc.ddl || '', title = doc.name.replace(/×\d+/g, '');
      selections[key] = saved.person || null;
      html += '<div class="border border-gray-100 rounded-lg p-3 mb-2 bg-gray-50"><p class="text-xs font-medium text-gray-700 mb-2">' + esc(title) + '</p><div class="flex items-center gap-2">' + window.dropdownHtml(key, selections[key], '选择交付人员') + '<input type="date" value="' + esc(ddl) + '" id="' + prefix + 'Ddl_' + doc.key + '" title="交付 DDL" oninput="pbsSyncReviewerDdl(\'' + prefix + '\',\'' + doc.key + '\',this.value)" class="w-[132px] flex-shrink-0 h-9 px-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></div></div>';
    });
    html += '</div>' + section('文书审核人员', 'green', '✓', '每种文书单独指定审核人员，可只填部分；审核 DDL 跟随对应文书交付 DDL');
    goal.docs.forEach(function(doc) {
      var key = prefix + 'Reviewer_' + doc.key, ddl = (docs[doc.key] || {}).ddl || doc.ddl || '', title = doc.name.replace(/×\d+/g, '');
      selections[key] = reviewers[doc.key] || null;
      html += '<div class="border border-gray-100 rounded-lg p-3 mb-2 bg-gray-50"><div class="flex items-center justify-between gap-2 mb-2"><p class="text-xs font-medium text-gray-700">' + esc(title) + '</p><span class="text-[10px] text-gray-500 whitespace-nowrap">交付 DDL <span id="' + prefix + 'ReviewerDdl_' + doc.key + '">' + esc(ddl || '—') + '</span></span></div>' + window.dropdownHtml(key, selections[key], '选择 ' + title + ' 审核人员') + '</div>';
    });
    selections[prefix + 'Network'] = assignment.network || null;
    html += '</div>' + section('网申人员', 'purple', '◎', '材料准备 · 网申提交') + '<div class="mb-3">' + window.dropdownHtml(prefix + 'Network', assignment.network, '选择网申人员') + '</div><div class="grid grid-cols-2 gap-2"><div><label class="block text-xs text-gray-500 mb-1">材料准备 DDL</label><input type="date" value="' + esc(assignment.networkMatDdl || goal.materialDdl || '') + '" id="' + prefix + 'DdlMatNetwork" class="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg"></div><div><label class="block text-xs text-gray-500 mb-1">网申提交 DDL</label><input type="date" value="' + esc(assignment.networkDdl || goal.appDdl || '') + '" id="' + prefix + 'DdlAppNetwork" class="w-full h-9 px-2 text-sm border border-gray-300 rounded-lg"></div></div></div>';
    return html;
  };
  window.pbsSyncReviewerDdl = function(prefix, key, value) {
    var node = document.getElementById(prefix + 'ReviewerDdl_' + key);
    if (node) node.textContent = value || '—';
  };
  window.pbsClearAssignedPerson = function(key) {
    window.selectedPersons[key] = null;
    var placeholder = document.getElementById(key + 'Placeholder');
    if (placeholder) { placeholder.textContent = /Network$/.test(key) ? '选择网申人员' : /Reviewer_/.test(key) ? '选择审核人员' : '选择交付人员'; placeholder.classList.remove('text-gray-900', 'font-medium'); placeholder.classList.add('text-gray-400'); }
    var clear = document.getElementById(key + 'Clear'); if (clear) clear.classList.add('hidden');
  };
})();

(function () {
  function renderProjectNotes() {
    var context = window.PROJECT_CONTEXT || window.MY_PROJECT_CONTEXT;
    if (!context) return;
    var project = window.pbsProjects.find(context.projectNo); if (!project) return;
    var note = project.closureNote || '', assignment = window.pbsProjects.getAssignment(project.projectNo).taskNote;
    if (window.MY_PROJECT_CONTEXT && window.currentSchoolCockpit) note = (project.goalClosures || {})[window.currentSchoolCockpit] ? project.goalClosures[window.currentSchoolCockpit].closureNote : note;
    else if (!note) note = (project.packages || []).filter(function(item) { return (project.goalClosures || {})[item.id] && project.goalClosures[item.id].closureNote; }).map(function(item) { return item.school + ' · ' + project.goalClosures[item.id].closureNote; }).join('\n');
    var text = document.getElementById('projectClosureNote'), bar = document.getElementById('projectClosureNoteBar');
    if (text) text.textContent = note; if (bar) bar.classList.toggle('hidden', !note);
    text = document.getElementById('projectAssignmentNote'); bar = document.getElementById('projectAssignmentNoteBar');
    if (text) text.textContent = assignment; if (bar) bar.classList.toggle('hidden', !assignment);
    var host = document.getElementById('projectNotes'); if (host) host.classList.toggle('hidden', !note && !assignment);
  }
  window.pbsRefreshProjectNotes = renderProjectNotes;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderProjectNotes); else renderProjectNotes();
  window.addEventListener('storage', function(event) { if (event.key === 'pbs_projects_v1') renderProjectNotes(); });
})();
