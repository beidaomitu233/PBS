(function () {
  'use strict';

  var templateStoreKey = 'pbs_web_application_templates';
  var programTemplates = [
    { id: 1, name: 'CMU 计算机科学硕士网申案例', school: '卡内基梅隆大学', program: '计算机科学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v3.2', fields: 42, materials: 6, updated: '2026-08-08', review: '护照有效期与推荐信抬头要求需按申请季复核。' },
      { version: 'v3.1', fields: 40, materials: 6, updated: '2026-07-18', review: '申请轮次与通信地址字段需人工核对。' },
      { version: 'v2.8', fields: 37, materials: 5, updated: '2026-05-26', review: '可作为旧申请季结构参考。' }
    ] },
    { id: 6, name: 'CMU 人工智能硕士网申案例', school: '卡内基梅隆大学', program: '人工智能', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v2.2', fields: 39, materials: 7, updated: '2026-08-03', review: '作品集和研究方向字段需按项目要求复核。' },
      { version: 'v2.1', fields: 38, materials: 7, updated: '2026-06-20', review: '无待复核项。' }
    ] },
    { id: 7, name: 'CMU 软件工程硕士网申案例', school: '卡内基梅隆大学', program: '软件工程', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v1.4', fields: 34, materials: 6, updated: '2026-07-26', review: '工作经历字段需要结合当前申请人核对。' },
      { version: 'v1.3', fields: 33, materials: 6, updated: '2026-05-12', review: '可作为旧申请季结构参考。' }
    ] },
    { id: 2, name: '斯坦福计算机科学网申案例', school: '斯坦福大学', program: '计算机科学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v2.4', fields: 38, materials: 7, updated: '2026-08-05', review: '无待复核项。' },
      { version: 'v2.3', fields: 37, materials: 7, updated: '2026-06-11', review: '推荐信要求需按当前申请季复核。' }
    ] },
    { id: 3, name: '哥伦比亚金融工程网申案例', school: '哥伦比亚大学', program: '金融工程', region: '美国', org: '上海启明留学', versions: [
      { version: 'v2.1', fields: 35, materials: 8, updated: '2026-08-01', review: 'GRE 是否可选需结合当前轮次核对。' }
    ] },
    { id: 4, name: '剑桥金融学网申案例', school: '剑桥大学', program: '金融学', region: '英国', org: '北京知行教育', versions: [
      { version: 'v1.8', fields: 31, materials: 7, updated: '2026-07-28', review: '研究计划字段与本申请季官网存在差异，需项目经理复核。' }
    ] },
    { id: 5, name: '香港大学数据科学网申案例', school: '香港大学', program: '数据科学', region: '中国香港', org: '上海启明留学', versions: [
      { version: 'v1.6', fields: 29, materials: 6, updated: '2026-07-25', review: '无待复核项。' }
    ] },
    { id: 8, name: '通用数据科学网申案例', school: '', program: '数据科学', region: '', org: 'PBS留学总部', versions: [
      { version: 'v1.1', fields: 26, materials: 6, updated: '2026-08-10', review: '当前案例未绑定院校，复用时必须人工确认官网差异。' },
      { version: 'v1.0', fields: 24, materials: 5, updated: '2026-07-02', review: '当前案例未绑定院校，仅作为字段结构参考。' }
    ] }
  ];
  var expandedSchools = { '卡内基梅隆大学': true };
  var visibleGroups = [];
  var currentTemplate = null;
  var currentVersionIndex = 0;
  var fieldDetails = ['First Name｜文本｜必填', 'Last Name｜文本｜必填', 'Date of Birth｜日期｜必填', 'Citizenship｜下拉｜必填', 'Email｜邮箱｜必填', 'Phone｜文本｜选填', 'Undergraduate School｜文本｜必填', 'Major｜文本｜必填', 'GPA｜文本｜必填', 'Mailing Address｜文本｜选填'];
  var materialDetails = ['个人陈述（PS）｜1000词', '推荐信（RL）｜2封', '简历（CV）｜2页', '本科成绩单｜中英文', '语言成绩单｜官方送分', '护照复印件｜信息页'];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function mergeStoredTemplates() {
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(templateStoreKey) || '[]'); } catch (error) { stored = []; }
    if (!Array.isArray(stored)) return;
    stored.forEach(function (item) {
      if (!item || !item.program || !Array.isArray(item.versions)) return;
      programTemplates = programTemplates.filter(function (current) { return Number(current.id) !== Number(item.id); });
      programTemplates.push(item);
    });
  }
  function latestVersion(item) {
    return item.versions && item.versions.length ? item.versions[0] : { version: '—', fields: 0, materials: 0, updated: '—', review: '无' };
  }
  function groupTemplates(items) {
    var groups = [];
    items.forEach(function (item) {
      var key = item.school || '__unbound__';
      var group = groups.find(function (entry) { return entry.key === key && entry.org === item.org; });
      if (!group) {
        group = { key: key, school: item.school || '未绑定院校', region: item.region || '', org: item.org, programs: [] };
        groups.push(group);
      }
      group.programs.push(item);
    });
    return groups;
  }
  function groupRow(group, index, forceOpen) {
    var versionCount = group.programs.reduce(function (sum, item) { return sum + item.versions.length; }, 0);
    var latest = group.programs.map(latestVersion).sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); })[0];
    var isOpen = forceOpen || expandedSchools[group.key];
    var html = '<tr class="bg-slate-50/70 border-t border-gray-100" data-school-group="' + escapeHtml(group.key) + '">' +
      '<td class="px-5 py-4"><button class="flex items-center gap-3 text-left" onclick="toggleSchoolGroup(' + index + ')"><svg class="school-toggle w-4 h-4 text-gray-400 ' + (isOpen ? 'open' : '') + '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path></svg><span><strong class="block text-sm text-gray-900">' + escapeHtml(group.school) + '</strong><span class="block text-xs text-gray-400 mt-1">' + escapeHtml(group.region || (group.key === '__unbound__' ? '通用案例' : '')) + '</span></span></button></td>' +
      '<td class="px-5 py-4 text-sm text-gray-700">' + escapeHtml(group.org) + '</td><td class="px-5 py-4 text-sm font-medium text-gray-800">' + group.programs.length + ' 个</td><td class="px-5 py-4 text-sm text-gray-700">' + versionCount + ' 个</td><td class="px-5 py-4 text-sm text-gray-500">' + escapeHtml(latest ? latest.updated : '—') + '</td>' +
      '<td class="px-5 py-4"><button class="text-sm text-blue-600 font-medium" onclick="toggleSchoolGroup(' + index + ')">' + (isOpen ? '收起' : '展开') + '</button></td></tr>';
    if (!isOpen) return html;
    return html + group.programs.map(function (item) {
      var version = latestVersion(item);
      return '<tr class="hover:bg-blue-50/40" data-program-template="' + item.id + '"><td class="px-5 py-4 pl-12"><p class="text-sm font-medium text-gray-900">' + escapeHtml(item.program) + '</p><p class="text-xs text-gray-400 mt-1">' + escapeHtml(item.name || '') + '</p></td><td class="px-5 py-4 text-sm text-gray-500">' + escapeHtml(item.org) + '</td><td class="px-5 py-4 text-sm text-gray-400">—</td><td class="px-5 py-4"><p class="text-sm text-gray-800">' + item.versions.length + ' 个</p><p class="text-xs text-gray-400 mt-1">当前 ' + escapeHtml(version.version) + '</p></td><td class="px-5 py-4 text-sm text-gray-500">' + escapeHtml(version.updated) + '</td><td class="px-5 py-4 whitespace-nowrap"><button class="text-sm text-blue-600 font-medium hover:text-blue-800 mr-4" onclick="openTemplateDetail(' + item.id + ')">查看专业详情</button><button class="text-sm text-amber-600 font-medium hover:text-amber-800" onclick="openTemplateEditor(' + item.id + ')">编辑</button></td></tr>';
    }).join('');
  }
  function currentFilters() {
    return {
      keyword: document.getElementById('templateKeyword').value.trim().toLowerCase(),
      region: document.getElementById('templateRegion').value.trim().toLowerCase(),
      org: document.getElementById('templateOrganization').value
    };
  }
  function renderTemplates() {
    var filters = currentFilters();
    var filtered = programTemplates.filter(function (item) {
      var schoolName = item.school || '未绑定院校';
      var search = (schoolName + item.program + (item.name || '')).toLowerCase();
      return (!filters.keyword || search.indexOf(filters.keyword) >= 0) && (!filters.region || String(item.region || '').toLowerCase().indexOf(filters.region) >= 0) && (!filters.org || item.org === filters.org);
    });
    visibleGroups = groupTemplates(filtered);
    document.getElementById('templateRows').innerHTML = visibleGroups.map(function (group, index) { return groupRow(group, index, !!filters.keyword); }).join('');
    document.getElementById('templateEmpty').classList.toggle('hidden', visibleGroups.length !== 0);
    document.getElementById('templateProgramCount').textContent = programTemplates.length;
    var schoolCount = programTemplates.reduce(function (list, item) { if (item.school && list.indexOf(item.school) < 0) list.push(item.school); return list; }, []).length;
    document.getElementById('templateSchoolCount').textContent = schoolCount;
  }
  window.toggleSchoolGroup = function (index) {
    var group = visibleGroups[index];
    if (!group) return;
    expandedSchools[group.key] = !expandedSchools[group.key];
    renderTemplates();
  };
  window.filterTemplates = renderTemplates;
  window.resetTemplateFilter = function () {
    document.getElementById('templateKeyword').value = '';
    document.getElementById('templateRegion').value = '';
    var orgFilter = document.getElementById('templateOrganization');
    if (!orgFilter.disabled) orgFilter.value = '';
    renderTemplates();
  };
  function detailRows(items) {
    return items.map(function (item) {
      if (typeof item === 'string') {
        var parts = item.split('｜');
        return '<div class="flex items-center justify-between gap-3 px-3 py-2.5"><span class="text-xs text-gray-800">' + escapeHtml(parts[0]) + '</span><span class="text-xs text-gray-500">' + escapeHtml(parts.slice(1).join(' · ')) + '</span></div>';
      }
      return '<div class="flex items-center justify-between gap-3 px-3 py-2.5"><span class="text-xs text-gray-800">' + escapeHtml(item.name) + '</span><span class="text-xs text-gray-500">' + escapeHtml((item.type || '') + (item.required ? ' · 必填' : ' · 选填')) + '</span></div>';
    }).join('');
  }
  function renderTemplateVersion() {
    if (!currentTemplate) return;
    var version = currentTemplate.versions[currentVersionIndex] || latestVersion(currentTemplate);
    document.getElementById('templateVersionTabs').innerHTML = currentTemplate.versions.map(function (item, index) {
      return '<button class="version-tab flex-shrink-0 ' + (index === currentVersionIndex ? 'active' : '') + '" onclick="selectTemplateVersion(' + index + ')">' + escapeHtml(item.version) + '</button>';
    }).join('');
    document.getElementById('templateDetailMeta').textContent = (currentTemplate.name || currentTemplate.program) + ' · ' + currentTemplate.org + ' · ' + version.updated + ' · ' + version.fields + ' 个官网字段 · ' + version.materials + ' 项材料';
    document.getElementById('templateFields').innerHTML = detailRows(version.fieldDetails || fieldDetails);
    document.getElementById('templateMaterials').innerHTML = detailRows(version.materialDetails || materialDetails);
    document.getElementById('templateReviewNote').innerHTML = '<span class="font-medium">复核提示：</span>' + escapeHtml(version.review || '无待复核项。');
  }
  window.selectTemplateVersion = function (index) { currentVersionIndex = index; renderTemplateVersion(); };
  window.openTemplateDetail = function (id) {
    currentTemplate = programTemplates.find(function (item) { return Number(item.id) === Number(id); });
    if (!currentTemplate) return;
    currentVersionIndex = 0;
    document.getElementById('templateDetailTitle').textContent = (currentTemplate.school ? currentTemplate.school : '未绑定院校') + ' · ' + currentTemplate.program;
    renderTemplateVersion();
    document.getElementById('templateDetailModal').classList.add('show');
  };
  window.closeTemplateDetail = function () { document.getElementById('templateDetailModal').classList.remove('show'); };
  window.openTemplateEditor = function (id) { location.href = '网申模板编辑 - 留学申请管理系统.html' + (id ? '?id=' + id : '?mode=new'); };
  window.editCurrentTemplate = function () { if (currentTemplate) openTemplateEditor(currentTemplate.id); };
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeTemplateDetail(); });

  mergeStoredTemplates();
  renderTemplates();
  document.addEventListener('DOMContentLoaded', function () {
    var session = window.pbsGetSession ? window.pbsGetSession() : { role: '超级管理员', org: 'PBS留学总部' };
    var isPlatformScope = session.role === '超级管理员' || session.role === '平台运维人员';
    var organizations = ['PBS留学总部', '上海启明留学', '北京知行教育'];
    var orgFilter = document.getElementById('templateOrganization');
    if (!isPlatformScope) {
      orgFilter.value = organizations.indexOf(session.org) >= 0 ? session.org : 'PBS留学总部';
      orgFilter.disabled = true;
      orgFilter.title = '机构角色仅查看本机构网申模板';
    }
    renderTemplates();
  });
})();
