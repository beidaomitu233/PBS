(function () {
  'use strict';
  var KEY = 'pbs_student_profiles_v1';
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]').map(function(profile) { profile.student = window.pbsIdentity ? pbsIdentity.normalize(profile.student) : profile.student; return profile; }); } catch(e) { return []; } }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function id() { return 'STU-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }
  function find(value) { return read().find(function(profile) { return profile.id === value; }) || null; }
  function projects(value) { return window.pbsProjects.all().filter(function(project) { return project.studentId === value; }); }
  function canView(value) {
    var profile = find(value), session = window.pbsGetSession();
    if (!profile) return false;
    if (session.role === '超级管理员') return true;
    if (!window.pbsHasPermission('customer_view')) return false;
    var org = session.org === 'PBS留学' ? 'PBS留学总部' : session.org;
    if (profile.org && org && profile.org !== org && session.role !== '平台运维人员') return false;
    if (session.role === '机构管理员' || session.role === '平台运维人员' || session.role === '销售人员') return true;
    var name = session.account === 'demo_admin' ? '张老师' : session.name;
    return projects(value).some(function(project) {
      if (project.projectManager === name) return true;
      var goals = window.pbsProjects.getAssignment(project.projectNo).goalAssignments;
      return Object.keys(goals).some(function(key) {
        var goal = goals[key];
        return goal.network === name || Object.keys(goal.docs || {}).some(function(doc) { return goal.docs[doc].person === name; }) || Object.keys(goal.reviewers || {}).some(function(doc) { return goal.reviewers[doc] === name; });
      });
    });
  }
  function canEdit(value) { return canView(value) && window.pbsHasPermission('customer_edit'); }
  function attach(project) {
    var list = read(), profile = list.find(function(item) { return item.id === project.studentId; });
    if (!profile && project.studentData && project.studentData.idcard) profile = list.find(function(item) { return item.org === (project.org || 'PBS留学总部') && item.student.idcard === project.studentData.idcard && item.student.identity === project.studentData.identity; });
    if (!profile && project.orderNo) profile = list.find(function(item) { return item.org === (project.org || 'PBS留学总部') && (item.orderNos || []).indexOf(project.orderNo) >= 0; });
    if (!profile && project.orderNo) {
      var peer = window.pbsProjects.all().find(function(item) { return item.orderNo === project.orderNo && item.studentId && item.projectNo !== project.projectNo; });
      if (peer) profile = list.find(function(item) { return item.id === peer.studentId; });
    }
    if (!profile && /^PRJ-[MO]-2607-00[0-9][0-9]$/.test(project.projectNo) && !project.manualCreated) profile = list.find(function(item) { return item.demo && item.org === (project.org || 'PBS留学总部') && item.name === project.student; });
    if (!profile) {
      var now = new Date().toISOString();
      profile = { id: id(), name: project.student, org: project.org || 'PBS留学总部', demo: !project.manualCreated && /^PRJ-[MO]-2607-00[0-9][0-9]$/.test(project.projectNo), student: Object.assign({ name: project.student, level: project.level }, project.studentData || {}), customer: Object.assign({ name: project.customer }, project.customerData || {}), orderNos: project.orderNo ? [project.orderNo] : [], sections: {}, logs: [], createdAt: now, updatedAt: now };
      list.push(profile); save(list);
    }
    if (project.orderNo && (profile.orderNos || []).indexOf(project.orderNo) < 0) { profile.orderNos = (profile.orderNos || []).concat(project.orderNo); save(list); }
    project.studentId = profile.id;
    project.student = profile.name;
    project.level = profile.student.level || project.level;
    project.studentData = Object.assign({}, profile.student);
    project.customer = profile.customer.name || project.customer;
    project.customerData = Object.assign({}, profile.customer);
    return project;
  }
  function display(value, label) {
    if (value === undefined || value === null || value === '') return '—';
    if (/密码|授权码|身份证号|证件号码|idcard|pwd|password/i.test(label)) return '******';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  function commit(value, section, payload, labels, action) {
    if (!canEdit(value)) return false;
    if (section === 'student') payload = pbsIdentity.normalize(payload);
    var list = read(), profile = list.find(function(item) { return item.id === value; });
    var before = section === 'student' || section === 'customer' ? profile[section] || {} : (profile.sections[section] || {}).values || {};
    var after = section === 'student' || section === 'customer' ? payload : payload.values;
    var changes = Array.from(new Set(Object.keys(before).concat(Object.keys(after)))).filter(function(key) { return !(section === 'student' && (key === 'idcard' || key === 'documents')) && JSON.stringify(before[key] == null ? '' : before[key]) !== JSON.stringify(after[key] == null ? '' : after[key]); }).map(function(key) { var label = (labels || {})[key] || key; return { field: label, before: display(before[key], label), after: display(after[key], label) }; });
    if (section === 'student') {
      var previousDocs = before.documents || [], nextDocs = payload.documents || [];
      for (var i = 0; i < Math.max(previousDocs.length, nextDocs.length); i++) {
        var a = previousDocs[i] || {}, b = nextDocs[i] || {};
        ['type','number','country','desc'].forEach(function(key) {
          if ((a[key] || '') === (b[key] || '')) return;
          var label = (b.type || a.type || '身份证件') + ' · ' + ({type:'证件类型',number:'证件号码',country:'永居国家',desc:'证件说明'})[key];
          changes.push({field:label,before:display(a[key],label),after:display(b[key],label)});
        });
      }
    }
    if (!changes.length) return false;
    if (section === 'student' || section === 'customer') profile[section] = Object.assign({}, payload); else profile.sections[section] = payload;
    var session = window.pbsGetSession(), now = new Date().toISOString();
    profile.updatedAt = now;
    profile.logs.push({ id: id(), actor: session.name || session.account, role: session.role, at: now, section: section, action: action || '修改档案', changes: changes });
    if (section === 'student' || section === 'customer') {
      if (section === 'student') profile.name = payload.name;
      var linked = window.pbsProjects.all();
      linked.forEach(function(project) {
        if (project.studentId !== value) return;
        if (section === 'student') { project.student = payload.name; project.level = payload.level; project.studentData = Object.assign({}, payload); }
        else { project.customer = payload.name; project.customerData = Object.assign({}, payload); }
      });
      window.pbsProjects.save(linked);
    }
    save(list);
    window.dispatchEvent(new CustomEvent('pbs-student-updated', { detail: value }));
    return true;
  }
  function seedDemoLogs() {
    var list = read(), changed = false;
    list.forEach(function(profile) {
      if (!profile.demo) return;
      var linked = projects(profile.id), manager = linked.map(function(project) { return project.projectManager; }).filter(Boolean)[0] || '张老师';
      var network = '吴老师';
      linked.some(function(project) {
        var goals = window.pbsProjects.getAssignment(project.projectNo).goalAssignments;
        return Object.keys(goals).some(function(key) { if (!goals[key].network) return false; network = goals[key].network; return true; });
      });
      var rows = [];
      function add(section, action, role, fields) {
        rows.push({ id: 'demo-profile-log-' + (rows.length + 1), sample: true, actor: role === '网申人员' ? network : manager, role: role, at: new Date(Date.parse('2026-10-12T09:00:00+08:00') + rows.length * 20 * 60000).toISOString(), section: section, action: action, changes: fields.map(function(field) { return { field: field[0], before: display(field[1], field[0]), after: display(field[2], field[0]) }; }) });
      }
      add('student', '修改学生信息', '项目经理', [['联系电话', '13800000001', '13800000002'], ['申请方向', '计算机科学', '人工智能'], ['身份证号', '******', '******']]);
      add('customer', '修改客户信息', '项目经理', [['与学生关系', '其他', '父亲'], ['联系电话', '13900000001', '13900000002']]);
      add('edu', '新增教育背景', '项目经理', [['就读学校', '', '示范大学'], ['专业', '', '计算机科学与技术'], ['起始时间', '', '2022-09-01']]);
      add('edu', '修改教育背景', '项目经理', [['成绩', '3.60 / 4.00', '3.80 / 4.00'], ['终止时间', '2026-07-01', '2026-06-30']]);
      add('edu', '删除教育背景', '项目经理', [['就读学校', '示范中学', ''], ['学历', '高中', '']]);
      add('lang', '修改语言成绩', '网申人员', [['雅思 · 总分', '6.5', '7.0'], ['雅思 · 考试日期', '2026-06-10', '2026-08-22']]);
      add('score', '修改学业信息', '项目经理', [/本科/.test(profile.student.level) ? ['SAT · 总分', '1480', '1520'] : ['GRE · 总分', '320', '325']]);
      add('qual', '新增专业资质', '项目经理', [['资质名称', '', '计算机程序设计证书'], ['获取日期', '', '2026-05-20']]);
      add('work', '修改工作经历', '项目经理', [['岗位', '软件开发实习生', '数据分析实习生'], ['结束时间', '2026-07-31', '2026-08-31']]);
      add('work', '删除工作经历', '项目经理', [['公司名称', '示范科技公司', ''], ['岗位', '短期实习生', '']]);
      add('practice', '新增实践经历', '项目经理', [['组织名称', '', '大学生创新训练项目'], ['担任角色', '', '项目负责人']]);
      add('honor', '修改荣誉', '项目经理', [['荣誉名称', '校级优秀学生', '校级优秀毕业生'], ['获奖日期', '2026-05-01', '2026-06-15']]);
      add('pub', '新增学术发表', '项目经理', [['论文标题', '', '面向学习行为分析的数据建模研究'], ['作者排序', '', '第二作者']]);
      add('apply', '修改申请记录', '网申人员', [['申请院校', '示范大学', '香港大学'], ['申请状态', '未提交', '已提交']]);
      add('account', '新增网申账号', '网申人员', [['院校', '', '香港大学'], ['登录邮箱', '', 'student@example.com'], ['密码', '', '******']]);
      add('account', '修改网申账号', '网申人员', [['登录邮箱', 'student@example.com', 'applicant@example.com'], ['密码', '******', '******'], ['邮箱授权码', '******', '******']]);
      add('account', '删除网申账号', '网申人员', [['院校', '示范学院', ''], ['登录邮箱', 'old-applicant@example.com', ''], ['密码', '******', '']]);
      add('edu', '新增自定义字段', '项目经理', [['预计毕业时间', '', '2027-06']]);
      add('edu', '修改自定义字段', '项目经理', [['预计毕业时间', '2027-06', '2027-07']]);
      add('edu', '删除自定义字段', '项目经理', [['补充说明', '待补交课程清单', '']]);
      add('asset', '上传资产文件', '网申人员', [['文件名称', '', '本科成绩单.pdf'], ['档案模块', '', '教育背景'], ['文件大小', '', '1.8 MB']]);
      add('asset', '删除资产文件', '项目经理', [['文件名称', '成绩单草稿.pdf', ''], ['档案模块', '教育背景', '']]);
      add('edu', '确认 AI 解析结果', '网申人员', [['所获学位', '', '工学学士'], ['学制', '', '4 年'], ['成绩', '3.80 / 4.00', '3.85 / 4.00']]);
      var missing = rows.filter(function(row) { return !profile.logs.some(function(log) { return log.id === row.id; }); });
      if (!missing.length) return;
      profile.logs = profile.logs.concat(missing).sort(function(a, b) { return Date.parse(a.at) - Date.parse(b.at); });
      changed = true;
    });
    if (changed) save(list);
  }
  window.pbsStudents = { all: read, find: find, projects: projects, attachProject: attach, canView: canView, canEdit: canEdit, commit: commit, visible: function() { return read().filter(function(item) { return canView(item.id); }); } };
  var linked = window.pbsProjects.all();
  linked.forEach(attach); window.pbsProjects.save(linked);
  seedDemoLogs();
  var params = new URLSearchParams(location.search), project = window.pbsProjects.find(params.get('project'));
  var named = read().find(function(item) { return item.name === params.get('student'); });
  var defaultProfile = read().find(function(item) { return item.name === '张明'; }) || read()[0];
  window.PBS_STUDENT_ID = params.get('studentId') || (project && project.studentId) || (params.has('student') ? named && named.id || '' : params.has('project') ? '' : defaultProfile && defaultProfile.id);
})();
