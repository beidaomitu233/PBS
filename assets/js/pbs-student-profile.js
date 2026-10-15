(function () {
  'use strict';
  var api = window.pbsStudents, profileId = window.PBS_STUDENT_ID, listBody = document.getElementById('customerTbody'), detail = !!document.getElementById('studentInfoCard');
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function time(value) { return value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'; }
  function fieldName(value) { return String(value || '').replace(/^(?:\s*(?:·\s*)?记录\s*\d+\s*(?:·\s*)?)+/, '').trim(); }
  function url(id, section) { return '学生档案详情页 - 留学申请管理系统.html?studentId=' + encodeURIComponent(id) + (section ? '&section=' + section + (section === 'asset' ? '&upload=1' : '') : ''); }
  function projectHtml(project) {
    var role = window.pbsGetSession().role, canOpen = ['超级管理员', '机构管理员', 'PMO', '项目经理'].indexOf(role) >= 0;
    var page = role === 'PMO' ? '订单项目详情页 - 留学申请管理系统.html' : role === '项目经理' ? '我的项目详情页 - 留学申请管理系统.html' : '项目详情页 - 留学申请管理系统.html';
    var title = canOpen ? '<a href="' + page + '?project=' + encodeURIComponent(project.projectNo) + '">' + esc(project.projectNo) + '</a>' : esc(project.projectNo);
    return '<div class="pbs-profile-project"><div>' + title + '</div></div>';
  }
  function relatedProjectsHtml(linked) {
    var groups = {};
    linked.forEach(function(project) { var key = project.orderNo || ''; (groups[key] || (groups[key] = [])).push(project); });
    var keys = Object.keys(groups);
    return keys.map(function(key) { return (keys.length > 1 ? '<p class="pbs-profile-order">' + esc(key ? '商城订单 ' + key : '线下项目') + '</p>' : '') + groups[key].map(projectHtml).join(''); }).join('');
  }
  function renderList() {
    var profiles = api.visible(), table = listBody.closest('table');
    table.classList.add('pbs-profile-table');
    table.querySelector('thead tr').innerHTML = ['序号', '关联商城订单', '关联项目与院校目标', '学生姓名', '客户姓名', '申请层次', '最近修改时间', '操作'].map(function(label) { return '<th>' + label + '</th>'; }).join('');
    listBody.innerHTML = profiles.map(function(profile, index) {
      var linked = api.projects(profile.id), orders = Array.from(new Set(linked.map(function(p) { return p.orderNo; }).filter(Boolean))), levels = Array.from(new Set(linked.map(function(p) { return p.level; }))), targets = linked.reduce(function(total, p) { return total + (p.packages || []).length; }, 0), customers = Array.from(new Set(linked.map(function(p) { return p.customer; })));
      var related = relatedProjectsHtml(linked);
      var sharedOrder = orders.some(function(order) { return linked.filter(function(project) { return project.orderNo === order; }).length > 1; });
      return '<tr data-kw="' + esc([profile.name, profile.id, customers.join(' '), orders.join(' '), linked.map(function(p) { return p.projectNo + ' ' + (p.packages || []).map(function(item) { return item.school + ' ' + item.major; }).join(' '); }).join(' ')].join(' ')) + '" data-name="' + esc(customers.join('、')) + '" data-applicant="' + esc(profile.name) + '" data-project="' + esc(linked.map(function(p) { return p.projectNo; }).join('、')) + '" data-level="' + esc(levels.join('、')) + '" data-targets="' + targets + '"><td>' + (index + 1) + '</td><td class="pbs-profile-order-cell' + (sharedOrder ? ' pbs-profile-order-shared' : '') + '">' + (orders.length ? orders.map(esc).join('<br>') : '—') + '</td><td>' + related + '</td><td><a href="' + url(profile.id) + '">' + esc(profile.name) + '</a></td><td>' + esc(customers.join('、')) + '</td><td>' + esc(levels.join('、')) + '</td><td>' + time(profile.updatedAt) + '</td><td><a href="' + url(profile.id) + '">查看档案</a></td></tr>';
    }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="8" class="pbs-profile-empty">暂无符合条件的学生档案</td></tr>';
    var pager = table.parentElement.nextElementSibling;
    if (pager) { pager.className = 'pbs-profile-list-count'; pager.textContent = '共 ' + profiles.length + ' 名学生'; }
    if (window.applyFilter) window.applyFilter();
  }
  var sectionNames = { edu: '教育背景', lang: '语言成绩', score: '学业信息', qual: '专业资质', work: '工作经历', practice: '实践经历', honor: '荣誉奖项', pub: '学术发表', apply: '申请记录', selectionBinding: '申请记录', account: '账号管理', asset: '资产文件', delivered: '交付文件', student: '学生信息', customer: '客户信息' };
  var baseline = {}, linkBound = false;
  function capture(section) {
    var body = document.getElementById('secbody-' + section);
    if (!body) return null;
    var values = {}, labels = {}, counts = {};
    var records = Array.from(body.querySelectorAll('[data-record], tbody tr'));
    records.forEach(function(record) { if (!record.dataset.auditRecord) record.dataset.auditRecord = 'REC-' + Math.random().toString(36).slice(2); });
    body.querySelectorAll('[data-v]').forEach(function(node) {
      if (node.parentElement.closest('[data-v]') || node.closest('.ai-pending') || /INPUT|SELECT|TEXTAREA/.test(node.tagName)) return;
      var key = node.dataset.v, record = node.closest('[data-audit-record]'), scope = record ? record.dataset.auditRecord + ':' : '', fieldKey = scope + key, index = counts[fieldKey] || 0; counts[fieldKey] = index + 1;
      var labelNode = body.querySelector('th[data-f="' + key + '"]');
      var custom = node.closest('[data-custom-field-id]'), customLabel = custom && custom.querySelector('p > span');
      var definition = ((window.PBSProfileFieldLabels || {})[section] || []).find(function(item) { return item[0] === key; });
      var label = definition ? definition[1] : labelNode ? labelNode.textContent.trim() : customLabel ? customLabel.textContent.trim() : key;
      var value = /pwd|password/i.test(key) ? node.innerHTML : node.textContent.trim();
      values[fieldKey + ':' + index] = value; labels[fieldKey + ':' + index] = label;
    });
    body.querySelectorAll('[data-file]').forEach(function(node) { var key = '文件:' + node.dataset.file; values[key] = node.textContent.replace(/\s+/g, ' ').trim(); labels[key] = key; });
    var snapshot = body.cloneNode(true), bindings = snapshot.querySelector('#studentSelectionBindings'); if (bindings) bindings.remove();
    return { values: values, labels: labels, html: snapshot.innerHTML };
  }
  function commitSection(section, action) {
    if (!api.canEdit(profileId)) return;
    var next = capture(section); if (!next) return;
    var profile = api.find(profileId), previous = profile.sections[section] || baseline[section];
    if (previous && JSON.stringify(previous.values) === JSON.stringify(next.values)) return;
    if (!profile.sections[section] && baseline[section]) {
      var profiles = api.all(), own = profiles.find(function(item) { return item.id === profileId; });
      own.sections[section] = baseline[section]; localStorage.setItem('pbs_student_profiles_v1', JSON.stringify(profiles));
    }
    api.commit(profileId, section, next, Object.assign({}, previous && previous.labels, next.labels), action || '修改' + (sectionNames[section] || section));
    baseline[section] = next;
  }
  function sectionLogs() {
    var groups = {};
    api.find(profileId).logs.forEach(function(log) {
      var section = log.section === 'selectionBinding' ? 'apply' : log.section;
      (groups[section] || (groups[section] = [])).push(log);
    });
    Object.keys(groups).forEach(function(section) { groups[section].sort(function(a, b) { return new Date(b.at) - new Date(a.at); }); });
    return groups;
  }
  function renderLogs() {
    var host = document.getElementById('pbsStudentLogs'), groups = sectionLogs();
    if (!host) {
      host = document.createElement('section'); host.id = 'pbsStudentLogs'; host.className = 'pbs-student-logs scroll-mt-24'; host.dataset.section = 'logs';
      document.getElementById('sections').appendChild(host);
    }
    var sections = Object.keys(groups).sort(function(a, b) { return new Date(groups[b][0].at) - new Date(groups[a][0].at); });
    host.innerHTML = '<h2>档案变更</h2><div class="pbs-profile-log-scroll"><table class="pbs-profile-log-table"><thead><tr><th>档案板块</th><th>最近修改时间</th><th>最近操作人</th><th>修改明细</th></tr></thead><tbody>' + (sections.length ? sections.map(function(section) {
      var latest = groups[section][0];
      return '<tr><td>' + esc(sectionNames[section] || section) + '</td><td>' + time(latest.at) + '</td><td>' + esc(latest.actor) + '<small>' + esc(latest.role) + '</small></td><td><button class="pbs-profile-section-detail" type="button" data-profile-section="' + esc(section) + '">查看修改明细</button></td></tr>';
    }).join('') : '<tr><td colspan="4" class="pbs-profile-empty">暂无修改记录</td></tr>') + '</tbody></table></div>';
    host.onclick = function(event) { var button = event.target.closest('[data-profile-section]'); if (button) openLogDetail(button.dataset.profileSection); };
  }
  function openLogDetail(section) {
    if (!api.canView(profileId)) return;
    var logs = sectionLogs()[section]; if (!logs) return;
    var dialog = document.createElement('dialog');
    dialog.className = 'pbs-profile-log-dialog';
    dialog.setAttribute('aria-labelledby', 'pbsProfileLogDialogTitle');
    dialog.innerHTML = '<div class="pbs-profile-log-panel"><header><h3 id="pbsProfileLogDialogTitle">' + esc((sectionNames[section] || section) + ' · 修改明细') + '</h3><button type="button" aria-label="关闭修改明细">×</button></header><div class="pbs-profile-log-detail-scroll"><table><thead><tr><th>字段</th><th>修改前</th><th>修改后</th></tr></thead><tbody>' + logs.map(function(log) {
      return '<tr class="pbs-profile-change-time"><td colspan="3">' + time(log.at) + '<span>' + esc(log.actor + ' · ' + log.role) + '</span></td></tr>' + (log.changes || []).map(function(change) {
        return '<tr><td>' + esc(fieldName(change.field)) + '</td><td>' + esc(change.before) + '</td><td>' + esc(change.after) + '</td></tr>';
      }).join('');
    }).join('') + '</tbody></table></div></div>';
    dialog.querySelector('button').addEventListener('click', function() { dialog.close(); });
    dialog.addEventListener('click', function(event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function() { dialog.remove(); });
    document.body.appendChild(dialog); dialog.showModal();
  }
  function restoreDetail() {
    var profile = api.find(profileId);
    if (!profile || !api.canView(profileId)) { document.querySelector('main').innerHTML = '<p class="pbs-profile-empty">无权查看该学生档案</p>'; return; }
    var heading = document.querySelector('main h1'); if (heading) heading.textContent = profile.name + ' · 学生档案';
    ['customer', 'student'].forEach(function(type) { if (window.pbsApplyProfileValues) window.pbsApplyProfileValues(type, profile[type]); });
    Object.keys(sectionNames).forEach(function(section) {
      var body = document.getElementById('secbody-' + section); if (!body) return;
      if (section !== 'asset' && profile.sections[section] && profile.sections[section].html) body.innerHTML = profile.sections[section].html;
      if (!profile.demo && section !== 'student' && section !== 'customer' && !profile.sections[section]) {
        body.querySelectorAll('[id^="records-"]').forEach(function(node) { node.innerHTML = ''; });
        body.querySelectorAll('tbody').forEach(function(node) { node.innerHTML = ''; });
        body.querySelectorAll('[data-file]:not([data-uploaded-asset])').forEach(function(node) { node.remove(); });
        body.querySelectorAll('[data-v]').forEach(function(node) { if (!node.querySelector('[data-v]')) node.textContent = '—'; });
      }
      baseline[section] = capture(section);
    });
    if (!api.canEdit(profileId)) document.querySelectorAll('main button').forEach(function(button) { if (/编辑|删除|新增|上传|保存/.test(button.textContent + button.title)) button.hidden = true; });
    var oldServices = document.getElementById('studentSelectionServices'); if (oldServices) oldServices.remove();
    if(window.pbsRenderSelectionBindings) pbsRenderSelectionBindings();
    renderLogs();
  }
  function syncProjectProfile() {
    var context = window.PROJECT_CONTEXT || window.MY_PROJECT_CONTEXT;
    if (!context) return;
    var project = window.pbsProjects.find(context.projectNo), profile = project && api.find(project.studentId);
    if (!profile || !api.canView(profile.id)) return;
    var student = profile.student;
    context.student = student.name; context.level = student.level;
    var mapping = { projectContextStudent: student.name, projectContextLevel: student.level, 'apply-level-text': student.level, 'apply-level-badge': student.level, myProjectTitle: student.name + ' · ' + student.level, myProjectProfileLevel: student.level, myProjectStudentProfileName: student.name, myProjectStudentSummary: [student.name, student.level, student.country, student.major].filter(Boolean).join(' · ') };
    Object.keys(mapping).forEach(function(key) { var node = document.getElementById(key); if (node) node.textContent = mapping[key] || '—'; });
    var heading = Array.from(document.querySelectorAll('h2')).find(function(node) { return node.textContent.trim() === '学生信息'; });
    var card = heading && heading.closest('.bg-white');
    var fields = { '申请层次': student.level, '出生年月日': student.birth, '身份信息': student.identity, '身份证号': student.idcard, '联系电话': student.phone, '申请方向': [student.country, student.major].filter(Boolean).join(' · '), '现居住地': student.address };
    if (card) card.querySelectorAll('p').forEach(function(node) { if (Object.prototype.hasOwnProperty.call(fields, node.textContent.trim()) && node.nextElementSibling) node.nextElementSibling.textContent = fields[node.textContent.trim()] || '—'; });
    document.querySelectorAll('a[href*="学生档案详情页"]').forEach(function(anchor) { anchor.href = url(profile.id); });
    window.openStudentAssetUpload = function() { location.href = url(profile.id, 'asset'); };
    if (!linkBound) document.addEventListener('click', function(event) { var button = event.target.closest('button'); if (button && (button.getAttribute('onclick') || '').indexOf('学生档案详情页') >= 0) { event.preventDefault(); event.stopImmediatePropagation(); location.href = url(profile.id); } }, true);
    linkBound = true;
  }
  function init() {
    if (listBody) renderList();
    if (detail) {
      restoreDetail();
      var sections = document.getElementById('sections');
      if (sections) new MutationObserver(function() { var logs = document.getElementById('pbsStudentLogs'); if (logs && sections.lastElementChild !== logs) sections.appendChild(logs); }).observe(sections, { childList: true });
    }
    syncProjectProfile();
    if (detail) {
      document.addEventListener('click', function(event) {
        var button = event.target.closest('button'), section = button && button.closest('section[data-section]');
        if (!section || button.classList.contains('ai-edit-save')) return;
        var action = button.textContent.trim() + ' ' + button.title;
        if (/保存|删除|移除|确认/.test(action) && !/取消|保存设置|驳回/.test(action)) setTimeout(function() { commitSection(section.dataset.section); }, 0);
      }, true);
      var upload = window.confirmAssetUpload;
      if (upload) window.confirmAssetUpload = async function() { await upload.apply(this, arguments); commitSection('asset', '上传资产文件'); };
      ['saveAddField', 'delCustomField'].forEach(function(name) {
        var original = window[name];
        if (original) window[name] = function(section) { if (!api.canEdit(profileId)) return; var result = original.apply(this, arguments); commitSection(section, name === 'saveAddField' ? '新增自定义字段' : '删除自定义字段'); return result; };
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('pbs-student-updated', function(event) { if (listBody) renderList(); if (detail && event.detail === profileId) renderLogs(); syncProjectProfile(); });
  window.addEventListener('storage', function(event) { if (event.key !== 'pbs_student_profiles_v1' && event.key !== 'pbs_selection_services_v1') return; if (listBody) renderList(); if (detail) restoreDetail(); syncProjectProfile(); });
})();
