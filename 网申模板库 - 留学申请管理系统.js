(function () {
  'use strict';

  var templates = [
    { id: 1, school: '卡内基梅隆大学', program: '计算机科学', region: '美国', org: 'PBS留学总部', version: 'v3.2', fields: 42, materials: 6, updated: '2026-08-08', review: '护照有效期与推荐信抬头要求需按申请季复核。' },
    { id: 2, school: '斯坦福大学', program: '计算机科学', region: '美国', org: 'PBS留学总部', version: 'v2.4', fields: 38, materials: 7, updated: '2026-08-05', review: '无待复核项。' },
    { id: 3, school: '哥伦比亚大学', program: '金融工程', region: '美国', org: '上海启明留学', version: 'v2.1', fields: 35, materials: 8, updated: '2026-08-01', review: 'GRE 是否可选需结合当前轮次核对。' },
    { id: 4, school: '剑桥大学', program: '金融学', region: '英国', org: '北京知行教育', version: 'v1.8', fields: 31, materials: 7, updated: '2026-07-28', review: '研究计划字段与本申请季官网存在差异，需项目经理复核。' },
    { id: 5, school: '香港大学', program: '数据科学', region: '中国香港', org: '上海启明留学', version: 'v1.6', fields: 29, materials: 6, updated: '2026-07-25', review: '无待复核项。' }
  ];
  var currentTemplate = null;
  var fieldDetails = ['First Name｜文本｜必填', 'Last Name｜文本｜必填', 'Date of Birth｜日期｜必填', 'Citizenship｜下拉｜必填', 'Email｜邮箱｜必填', 'Phone｜文本｜选填', 'Undergraduate School｜文本｜必填', 'Major｜文本｜必填', 'GPA｜文本｜必填', 'Mailing Address｜文本｜选填'];
  var materialDetails = ['个人陈述（PS）｜1000词', '推荐信（RL）｜2封', '简历（CV）｜2页', '本科成绩单｜中英文', '语言成绩单｜官方送分', '护照复印件｜信息页'];

  function rowHtml(item) {
    return '<tr class="hover:bg-gray-50 cursor-pointer" data-template-id="' + item.id + '" data-search="' + item.school + item.program + '" data-region="' + item.region + '" data-org="' + item.org + '" onclick="openTemplateDetail(' + item.id + ')">' +
      '<td class="px-5 py-4"><p class="text-sm font-medium text-gray-900">' + item.school + '</p><p class="text-xs text-gray-500 mt-1">' + item.program + ' · ' + item.region + '</p></td>' +
      '<td class="px-5 py-4 text-sm text-gray-700">' + item.org + '</td>' +
      '<td class="px-5 py-4"><p class="text-sm text-gray-800">' + item.version + '</p><p class="text-xs text-gray-400 mt-1">' + item.updated + '</p></td>' +
      '<td class="px-5 py-4 text-sm text-gray-700">' + item.fields + ' 个</td><td class="px-5 py-4 text-sm text-gray-700">' + item.materials + ' 项</td>' +
      '<td class="px-5 py-4 whitespace-nowrap"><button class="text-sm text-blue-600 font-medium hover:text-blue-800 mr-4" onclick="event.stopPropagation();openTemplateDetail(' + item.id + ')">查看</button><button class="text-sm text-amber-600 font-medium hover:text-amber-800" onclick="event.stopPropagation();openTemplateEditor(' + item.id + ')">编辑</button></td></tr>';
  }
  function renderTemplates() {
    document.getElementById('templateRows').innerHTML = templates.map(rowHtml).join('');
    filterTemplates();
  }
  window.filterTemplates = function () {
    var keyword = document.getElementById('templateKeyword').value.trim().toLowerCase();
    var region = document.getElementById('templateRegion').value;
    var org = document.getElementById('templateOrganization').value;
    var visible = 0;
    document.querySelectorAll('#templateRows tr').forEach(function (row) {
      var ok = (!keyword || row.dataset.search.toLowerCase().indexOf(keyword) >= 0) && (!region || row.dataset.region === region) && (!org || row.dataset.org === org);
      row.classList.toggle('hidden', !ok);
      if (ok) visible++;
    });
    document.getElementById('templateEmpty').classList.toggle('hidden', visible !== 0);
  };
  window.resetTemplateFilter = function () {
    document.getElementById('templateKeyword').value = '';
    document.getElementById('templateRegion').value = '';
    var orgFilter = document.getElementById('templateOrganization');
    if (!orgFilter.disabled) orgFilter.value = '';
    filterTemplates();
  };
  function detailRows(items) {
    return items.map(function (item) { var parts = item.split('｜'); return '<div class="flex items-center justify-between gap-3 px-3 py-2.5"><span class="text-xs text-gray-800">' + parts[0] + '</span><span class="text-xs text-gray-500">' + parts.slice(1).join(' · ') + '</span></div>'; }).join('');
  }
  window.openTemplateDetail = function (id) {
    currentTemplate = templates.find(function (item) { return item.id === id; });
    if (!currentTemplate) return;
    document.getElementById('templateDetailTitle').textContent = currentTemplate.school + ' · ' + currentTemplate.program;
    document.getElementById('templateDetailMeta').textContent = currentTemplate.org + ' · ' + currentTemplate.version + ' · ' + currentTemplate.fields + ' 个官网字段 · ' + currentTemplate.materials + ' 项材料';
    document.getElementById('templateFields').innerHTML = detailRows(fieldDetails);
    document.getElementById('templateMaterials').innerHTML = detailRows(materialDetails);
    document.getElementById('templateReviewNote').innerHTML = '<span class="font-medium">复核提示：</span>' + currentTemplate.review;
    document.getElementById('templateDetailModal').classList.add('show');
  };
  window.closeTemplateDetail = function () { document.getElementById('templateDetailModal').classList.remove('show'); };
  window.openTemplateEditor = function (id) {
    location.href = '网申模板编辑 - 留学申请管理系统.html' + (id ? '?id=' + id : '?mode=new');
  };
  window.editCurrentTemplate = function () {
    if (currentTemplate) openTemplateEditor(currentTemplate.id);
  };
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeTemplateDetail(); });
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
    filterTemplates();
  });
})();
