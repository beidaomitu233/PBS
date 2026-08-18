(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var isNew = params.get('mode') === 'new';
  var templateId = Number(params.get('id') || 1);
  var metadata = {
    1: { name: 'CMU 计算机科学硕士网申模板', school: '卡内基梅隆大学', program: '计算机科学', region: '美国', version: 'V3.2', fieldCount: 42, materialCount: 6 },
    2: { name: '斯坦福计算机科学网申模板', school: '斯坦福大学', program: '计算机科学', region: '美国', version: 'V2.4', fieldCount: 38, materialCount: 7 },
    3: { name: '哥伦比亚金融工程网申模板', school: '哥伦比亚大学', program: '金融工程', region: '美国', version: 'V2.1', fieldCount: 35, materialCount: 8 },
    4: { name: '剑桥金融学网申模板', school: '剑桥大学', program: '金融学', region: '英国', version: 'V1.8', fieldCount: 31, materialCount: 7 },
    5: { name: '香港大学数据科学网申模板', school: '香港大学', program: '数据科学', region: '中国香港', version: 'V1.6', fieldCount: 29, materialCount: 6 }
  };
  var currentMeta = metadata[templateId] || metadata[1];
  var fields = isNew ? [] : [
    { name: 'First Name', type: '文本', required: true, note: '与护照英文名保持一致' },
    { name: 'Last Name', type: '文本', required: true, note: '与护照英文姓保持一致' },
    { name: 'Date of Birth', type: '日期', required: true, note: '按 MM/DD/YYYY 填写' },
    { name: 'Citizenship', type: '下拉', required: true, note: '选择护照签发国家或地区' },
    { name: 'Email', type: '邮箱', required: true, note: '使用项目托管邮箱' },
    { name: 'Undergraduate School', type: '文本', required: true, note: '填写本科院校英文全称' },
    { name: 'Major', type: '文本', required: true, note: '填写本科专业英文名称' },
    { name: 'GPA', type: '文本', required: true, note: '按成绩单原始计分制填写' }
  ];
  var additionalFieldNames = ['Middle Name', 'Preferred Name', 'Gender', 'Country of Birth', 'Passport Number', 'Passport Expiry Date', 'Phone', 'Address Line 1', 'Address Line 2', 'City', 'State / Province', 'Postal Code', 'Country', 'Degree Type', 'Enrollment Date', 'Graduation Date', 'GPA Scale', 'Class Rank', 'TOEFL Score', 'IELTS Score', 'GRE Verbal', 'GRE Quantitative', 'GRE Writing', 'Work Experience', 'Employer', 'Job Title', 'Research Experience', 'Research Interest', 'Personal Website', 'LinkedIn URL', 'Application Round', 'Entry Term', 'Scholarship Consideration', 'Additional Information'];
  if (!isNew) {
    additionalFieldNames.slice(0, Math.max(0, currentMeta.fieldCount - fields.length)).forEach(function (name) {
      var isDate = name.indexOf('Date') >= 0;
      var isScore = name.indexOf('Score') >= 0 || name.indexOf('GRE ') === 0;
      fields.push({ name: name, type: isDate ? '日期' : (isScore ? '数字' : '文本'), required: false, note: '按申请官网要求填写' });
    });
  }
  var materials = isNew ? [] : [
    { name: '个人陈述（PS）', required: true, note: 'PDF，1000 词以内' },
    { name: '推荐信（RL）', required: true, note: '2 封，由推荐人在线提交' },
    { name: '简历（CV）', required: true, note: 'PDF，建议不超过 2 页' },
    { name: '本科成绩单', required: true, note: '中英文成绩单合并上传' },
    { name: '语言成绩单', required: true, note: '填写送分信息并上传成绩页' },
    { name: '护照复印件', required: true, note: '护照个人信息页彩色扫描件' }
  ];
  if (!isNew && currentMeta.materialCount > materials.length) {
    [{ name: 'GRE 成绩单', required: false, note: '如项目要求，上传成绩页并填写送分信息' }, { name: '研究计划', required: false, note: 'PDF，按院校规定页数上传' }].slice(0, currentMeta.materialCount - materials.length).forEach(function (item) { materials.push(item); });
  }
  var histories = isNew ? [] : [
    { version: currentMeta.version, time: '2026-08-08 16:20', editor: '王志强', fields: currentMeta.fieldCount, materials: currentMeta.materialCount, change: '补充护照有效期、推荐信抬头和申请轮次字段要求。' },
    { version: previousVersion(currentMeta.version, 1), time: '2026-07-25 10:12', editor: '王志强', fields: Math.max(1, currentMeta.fieldCount - 2), materials: currentMeta.materialCount, change: '更新个人陈述字数限制和语言成绩送分说明。' },
    { version: previousVersion(currentMeta.version, 2), time: '2026-06-18 14:35', editor: '李雪', fields: Math.max(1, currentMeta.fieldCount - 4), materials: Math.max(1, currentMeta.materialCount - 1), change: '建立首版官网字段结构，补充本科成绩单要求。' }
  ];
  var selectedVersion = 0;

  function previousVersion(version, offset) {
    var matched = String(version).match(/V(\d+)\.(\d+)/i);
    if (!matched) return 'V1.0';
    var serial = Math.max(10, Number(matched[1]) * 10 + Number(matched[2]) - offset);
    return 'V' + Math.floor(serial / 10) + '.' + (serial % 10);
  }
  function nextVersion(version) {
    var matched = String(version).match(/V(\d+)\.(\d+)/i);
    if (!matched) return 'V1.0';
    return 'V' + matched[1] + '.' + (Number(matched[2]) + 1);
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function showToast(message) {
    var toast = document.getElementById('editorToast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }
  function fieldRow(item, index) {
    return '<div class="field-grid grid grid-cols-[minmax(220px,1.4fr)_150px_120px_minmax(220px,1fr)_64px] gap-3 items-center px-5 py-3" data-field-index="' + index + '">' +
      '<input class="input field-name" value="' + escapeHtml(item.name) + '" placeholder="请输入官网字段名称">' +
      '<select class="input field-type"><option' + (item.type === '文本' ? ' selected' : '') + '>文本</option><option' + (item.type === '日期' ? ' selected' : '') + '>日期</option><option' + (item.type === '下拉' ? ' selected' : '') + '>下拉</option><option' + (item.type === '邮箱' ? ' selected' : '') + '>邮箱</option><option' + (item.type === '数字' ? ' selected' : '') + '>数字</option><option' + (item.type === '文件' ? ' selected' : '') + '>文件</option></select>' +
      '<select class="input field-required"><option value="1"' + (item.required ? ' selected' : '') + '>必填</option><option value="0"' + (!item.required ? ' selected' : '') + '>选填</option></select>' +
      '<input class="input field-note" value="' + escapeHtml(item.note) + '" placeholder="填写格式或取值说明">' +
      '<button class="text-sm text-red-600 hover:text-red-800" onclick="removeFieldRow(' + index + ')">删除</button></div>';
  }
  function materialRow(item, index) {
    return '<div class="field-grid grid grid-cols-[minmax(220px,1.2fr)_120px_minmax(300px,1.6fr)_64px] gap-3 items-center px-5 py-3" data-material-index="' + index + '">' +
      '<input class="input material-name" value="' + escapeHtml(item.name) + '" placeholder="请输入材料名称">' +
      '<select class="input material-required"><option value="1"' + (item.required ? ' selected' : '') + '>必需</option><option value="0"' + (!item.required ? ' selected' : '') + '>非必需</option></select>' +
      '<input class="input material-note" value="' + escapeHtml(item.note) + '" placeholder="文件格式、数量或提交要求">' +
      '<button class="text-sm text-red-600 hover:text-red-800" onclick="removeMaterialRow(' + index + ')">删除</button></div>';
  }
  function syncRows() {
    document.querySelectorAll('#fieldRows [data-field-index]').forEach(function (row, index) {
      if (!fields[index]) return;
      fields[index] = { name: row.querySelector('.field-name').value.trim(), type: row.querySelector('.field-type').value, required: row.querySelector('.field-required').value === '1', note: row.querySelector('.field-note').value.trim() };
    });
    document.querySelectorAll('#materialRows [data-material-index]').forEach(function (row, index) {
      if (!materials[index]) return;
      materials[index] = { name: row.querySelector('.material-name').value.trim(), required: row.querySelector('.material-required').value === '1', note: row.querySelector('.material-note').value.trim() };
    });
  }
  function renderRows() {
    document.getElementById('fieldRows').innerHTML = fields.length ? fields.map(fieldRow).join('') : '<div class="py-10 text-center text-sm text-gray-400">暂无字段，请点击“添加字段”</div>';
    document.getElementById('materialRows').innerHTML = materials.length ? materials.map(materialRow).join('') : '<div class="py-10 text-center text-sm text-gray-400">暂无材料，请点击“添加材料”</div>';
    document.getElementById('fieldCount').textContent = fields.length;
    document.getElementById('materialCount').textContent = materials.length;
  }
  window.addFieldRow = function () { syncRows(); fields.push({ name: '', type: '文本', required: true, note: '' }); renderRows(); var inputs = document.querySelectorAll('.field-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeFieldRow = function (index) { syncRows(); fields.splice(index, 1); renderRows(); };
  window.addMaterialRow = function () { syncRows(); materials.push({ name: '', required: true, note: '' }); renderRows(); var inputs = document.querySelectorAll('.material-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeMaterialRow = function (index) { syncRows(); materials.splice(index, 1); renderRows(); };

  function renderVersionDetail() {
    var item = histories[selectedVersion];
    if (!item) {
      document.getElementById('versionDetail').innerHTML = '<div class="h-full flex items-center justify-center text-sm text-gray-400">保存首个版本后可在此查看历史记录</div>';
      return;
    }
    document.getElementById('versionDetail').innerHTML = '<div class="flex items-center justify-between mb-6"><div><p class="text-xl font-semibold text-gray-900">' + item.version + '</p><p class="text-sm text-gray-500 mt-1">' + item.time + ' · ' + item.editor + '</p></div>' + (selectedVersion === 0 ? '<span class="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">当前版本</span>' : '') + '</div>' +
      '<div class="grid grid-cols-2 gap-4 mb-6"><div class="p-4 bg-blue-50 rounded-xl"><p class="text-xs text-blue-600">申请官网字段</p><p class="text-2xl font-bold text-blue-800 mt-1">' + item.fields + '</p></div><div class="p-4 bg-emerald-50 rounded-xl"><p class="text-xs text-emerald-600">申请材料清单</p><p class="text-2xl font-bold text-emerald-800 mt-1">' + item.materials + '</p></div></div>' +
      '<div><p class="text-sm font-semibold text-gray-800 mb-2">版本变更</p><div class="p-4 border border-gray-200 rounded-xl text-sm leading-6 text-gray-600">' + item.change + '</div></div>';
  }
  function renderVersionList() {
    document.getElementById('versionList').innerHTML = histories.length ? histories.map(function (item, index) {
      return '<button class="version-item w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 ' + (index === selectedVersion ? 'active' : '') + '" onclick="selectHistoryVersion(' + index + ')"><span class="flex items-center justify-between"><strong class="text-sm text-gray-900">' + item.version + '</strong><span class="text-xs text-gray-400">' + item.editor + '</span></span><span class="block text-xs text-gray-500 mt-2">' + item.time + '</span></button>';
    }).join('') : '<div class="py-10 text-center text-sm text-gray-400">暂无历史版本</div>';
    renderVersionDetail();
  }
  window.selectHistoryVersion = function (index) { selectedVersion = index; renderVersionList(); };
  window.openVersionHistory = function () { selectedVersion = 0; renderVersionList(); document.getElementById('versionModal').classList.add('show'); };
  window.closeVersionHistory = function () { document.getElementById('versionModal').classList.remove('show'); };
  window.saveNewVersion = function () {
    syncRows();
    var name = document.getElementById('templateName').value.trim();
    var region = document.getElementById('templateRegion').value.trim();
    var school = document.getElementById('templateSchool').value.trim();
    var program = document.getElementById('templateProgram').value.trim();
    if (!name || !school || !program) { showToast('请完整填写模板信息（国家/地区为选填）'); return; }
    if (!fields.length || fields.some(function (item) { return !item.name; })) { showToast('请至少添加一个完整的官网字段'); return; }
    if (!materials.length || materials.some(function (item) { return !item.name; })) { showToast('请至少添加一项完整的申请材料'); return; }
    var current = document.getElementById('currentVersion').textContent;
    var version = isNew && !histories.length ? 'V1.0' : nextVersion(current);
    document.getElementById('currentVersion').textContent = version;
    histories.unshift({ version: version, time: '2026-08-17 15:30', editor: '王志强', fields: fields.length, materials: materials.length, change: isNew && histories.length === 0 ? '创建网申模板并保存字段与材料清单。' : '更新官网字段与申请材料清单。' });
    showToast(version + ' 已保存');
  };

  function initialize() {
    document.getElementById('pageTitle').textContent = isNew ? '新增网申模板' : '修改网申模板';
    document.getElementById('breadcrumbMode').textContent = isNew ? '新增模板' : '修改模板';
    document.getElementById('currentVersion').textContent = isNew ? '未保存' : currentMeta.version;
    document.getElementById('templateName').value = isNew ? '' : currentMeta.name;
    document.getElementById('templateRegion').value = isNew ? '' : currentMeta.region;
    document.getElementById('templateSchool').value = isNew ? '' : currentMeta.school;
    document.getElementById('templateProgram').value = isNew ? '' : currentMeta.program;
    renderRows();
  }
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeVersionHistory(); });
  initialize();
})();
