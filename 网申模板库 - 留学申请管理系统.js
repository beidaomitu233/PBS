(function () {
  'use strict';

  var templateStoreKey = 'pbs_web_application_templates_v2';
  var programTemplates = [
    { id: 1, name: 'CMU 计算机学院网申模板', school: '卡内基梅隆大学', college: '计算机学院', boundPrograms: ['计算机科学', '人工智能', '软件工程'], region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v3.2', fields: 96, materials: 6, updated: '2026-08-08', review: '多个专业复用通用字段，各专业差异字段已独立维护。' },
      { version: 'v3.1', fields: 92, materials: 6, updated: '2026-07-18', review: '申请轮次与通信地址字段需人工核对。' },
      { version: 'v2.8', fields: 88, materials: 5, updated: '2026-05-26', review: '可作为旧申请季结构参考。' }
    ] },
    { id: 6, name: 'CMU 人文学院网申模板', school: '卡内基梅隆大学', college: '人文学院', program: '中国哲学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v1.2', fields: 28, materials: 6, updated: '2026-08-02', review: '无待复核项。' }
    ] },
    { id: 2, name: '斯坦福计算机科学网申案例', school: '斯坦福大学', college: '工程学院', program: '计算机科学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v2.4', fields: 38, materials: 7, updated: '2026-08-05', review: '无待复核项。' },
      { version: 'v2.3', fields: 37, materials: 7, updated: '2026-06-11', review: '推荐信要求需按当前申请季复核。' }
    ] },
    { id: 3, name: '哥伦比亚金融工程网申案例', school: '哥伦比亚大学', college: '工程与应用科学学院', program: '金融工程', region: '美国', org: '上海启明留学', versions: [
      { version: 'v2.1', fields: 35, materials: 8, updated: '2026-08-01', review: 'GRE 是否可选需结合当前轮次核对。' }
    ] },
    { id: 4, name: '剑桥金融学网申案例', school: '剑桥大学', college: '商学院', program: '金融学', region: '英国', org: '北京知行教育', versions: [
      { version: 'v1.8', fields: 31, materials: 7, updated: '2026-07-28', review: '研究计划字段与本申请季官网存在差异，需项目经理复核。' }
    ] },
    { id: 5, name: '香港大学数据科学网申案例', school: '香港大学', college: '计算与数据科学学院', program: '数据科学', region: '中国香港', org: '上海启明留学', versions: [
      { version: 'v1.6', fields: 29, materials: 6, updated: '2026-07-25', review: '无待复核项。' }
    ] }
  ];
  programTemplates.forEach(function (item) {
    if (!Array.isArray(item.boundPrograms)) item.boundPrograms = item.program ? [item.program] : [];
    if (!item.college) item.college = '未填写学院';
  });
  var expandedSchools = { '卡内基梅隆大学': true };
  var visibleGroups = [];
  var currentTemplate = null;
  var currentVersionIndex = 0;
  var currentPageIndex = 0;
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
      if (!item || !Array.isArray(item.versions)) return;
      if (!Array.isArray(item.boundPrograms)) item.boundPrograms = item.program ? [item.program] : [];
      if (!item.college) item.college = '未填写学院';
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
      var school = item.school || '未绑定院校';
      var group = groups.find(function (entry) { return entry.school === school; });
      if (!group) { group = { school: school, region: item.region || '', templates: [] }; groups.push(group); }
      group.templates.push(item);
    });
    return groups;
  }
  function groupRows(group, index, forceOpen) {
    var isOpen = forceOpen || expandedSchools[group.school];
    var html = '<tr class="bg-slate-50/80 border-t border-gray-100"><td class="px-5 py-4"><button class="flex items-center gap-3 text-left" onclick="toggleSchoolGroup(' + index + ')"><svg class="school-toggle w-4 h-4 text-gray-400 ' + (isOpen ? 'open' : '') + '" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"></path></svg><span><strong class="block text-sm text-gray-900">' + escapeHtml(group.school) + '</strong><span class="block text-xs text-gray-400 mt-1">' + escapeHtml(group.region) + '</span></span></button></td>' +
      '<td class="px-5 py-4 text-sm text-gray-600">' + group.templates.length + ' 个学院</td><td class="px-5 py-4 text-sm text-gray-400">—</td><td class="px-5 py-4"><button class="text-sm text-blue-600 font-medium" onclick="toggleSchoolGroup(' + index + ')">' + (isOpen ? '收起' : '展开') + '</button></td></tr>';
    if (!isOpen) return html;
    return html + group.templates.map(function (item) {
      var programCount = item.boundPrograms.length;
      return '<tr class="hover:bg-slate-50" data-template="' + item.id + '"><td class="px-5 py-4 pl-12"><p class="text-sm font-medium text-gray-900">' + escapeHtml(item.college) + '</p></td><td class="px-5 py-4"><p class="text-sm text-gray-800">' + escapeHtml(item.name || '') + '</p></td><td class="px-5 py-4 text-sm text-gray-500">' + (programCount ? programCount + ' 个专业' : '未绑定专业') + '</td><td class="px-5 py-4 whitespace-nowrap"><button class="text-sm text-blue-600 font-medium hover:text-blue-800 mr-4" onclick="openTemplateDetail(' + item.id + ')">查看</button><button class="text-sm text-gray-600 font-medium hover:text-gray-900" onclick="openTemplateEditor(' + item.id + ')">编辑</button></td></tr>';
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
      var search = (schoolName + (item.college || '') + item.boundPrograms.join('') + (item.name || '')).toLowerCase();
      return (!filters.keyword || search.indexOf(filters.keyword) >= 0) && (!filters.region || String(item.region || '').toLowerCase().indexOf(filters.region) >= 0) && (!filters.org || item.org === filters.org);
    });
    visibleGroups = groupTemplates(filtered);
    document.getElementById('templateRows').innerHTML = visibleGroups.map(function (group, index) { return groupRows(group, index, Boolean(filters.keyword)); }).join('');
    document.getElementById('templateEmpty').classList.toggle('hidden', filtered.length !== 0);
    document.getElementById('templateCount').textContent = programTemplates.length;
    var schoolCount = programTemplates.reduce(function (list, item) { if (item.school && list.indexOf(item.school) < 0) list.push(item.school); return list; }, []).length;
    document.getElementById('templateSchoolCount').textContent = schoolCount;
  }
  window.toggleSchoolGroup = function (index) { var group = visibleGroups[index]; if (!group) return; expandedSchools[group.school] = !expandedSchools[group.school]; renderTemplates(); };
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
    document.getElementById('templateDetailMeta').textContent = currentTemplate.name + ' · ' + version.updated + ' · ' + version.fields + ' 个官网字段 · ' + version.materials + ' 项材料';
    var programs = currentTemplate.boundPrograms.length ? currentTemplate.boundPrograms.map(function (program) { return '<span class="bound-program-item">' + escapeHtml(program) + '</span>'; }).join('') : '<span class="text-xs text-gray-400">未绑定专业</span>';
    document.getElementById('templateBoundPrograms').innerHTML = '<div class="scope-path-node"><small>院校</small><strong>' + escapeHtml(currentTemplate.school) + '</strong></div><div class="scope-path-arrow">›</div><div class="scope-path-node"><small>学院</small><strong>' + escapeHtml(currentTemplate.college) + '</strong></div><div class="scope-path-arrow">›</div><div class="scope-path-node"><small>绑定专业</small><div class="scope-programs">' + programs + '</div></div>';
    var pages = version.pageDetails || [{ id: 'page-1', name: '个人信息' }, { id: 'page-2', name: '教育背景' }, { id: 'page-3', name: '经历与成绩' }, { id: 'page-4', name: '项目问题' }];
    if (currentPageIndex >= pages.length) currentPageIndex = 0;
    document.getElementById('templatePages').innerHTML = pages.map(function (page, index) { return '<button type="button" class="detail-page-tab ' + (index === currentPageIndex ? 'active' : '') + '" onclick="selectTemplatePage(' + index + ')">' + escapeHtml(page.name) + '</button>'; }).join('');
    var sourceFields = version.fieldDetails || fieldDetails;
    var activePage = pages[currentPageIndex];
    var visibleFields = sourceFields.some(function (field) { return typeof field === 'object' && field.pageId; })
      ? sourceFields.filter(function (field) { return field.pageId === activePage.id; })
      : sourceFields.slice(currentPageIndex * Math.ceil(sourceFields.length / pages.length), (currentPageIndex + 1) * Math.ceil(sourceFields.length / pages.length));
    document.getElementById('templateFields').innerHTML = detailRows(visibleFields);
    document.getElementById('templateMaterials').innerHTML = detailRows(version.materialDetails || materialDetails);
    document.getElementById('templateReviewNote').innerHTML = '<span class="font-medium">复核提示：</span>' + escapeHtml(version.review || '无待复核项。');
  }
  window.selectTemplateVersion = function (index) { currentVersionIndex = index; currentPageIndex = 0; renderTemplateVersion(); };
  window.selectTemplatePage = function (index) { currentPageIndex = index; renderTemplateVersion(); };
  window.openTemplateDetail = function (id) {
    currentTemplate = programTemplates.find(function (item) { return Number(item.id) === Number(id); });
    if (!currentTemplate) return;
    currentVersionIndex = 0;
    currentPageIndex = 0;
    document.getElementById('templateDetailTitle').textContent = currentTemplate.school;
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
