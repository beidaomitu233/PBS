(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var isNew = params.get('mode') === 'new';
  var templateId = Number(params.get('id') || 1);
  var savedTemplateId = isNew ? Date.now() : templateId;
  var templateStoreKey = 'pbs_web_application_templates_v2';
  var metadata = {
    1: { name: 'CMU 计算机学院网申模板', school: '卡内基梅隆大学', college: '计算机学院', program: '', region: '美国', version: 'V3.2', fieldCount: 96, materialCount: 6 },
    2: { name: '斯坦福计算机科学网申模板', school: '斯坦福大学', college: '工程学院', program: '计算机科学', region: '美国', version: 'V2.4', fieldCount: 38, materialCount: 7 },
    3: { name: '哥伦比亚金融工程网申模板', school: '哥伦比亚大学', college: '工程与应用科学学院', program: '金融工程', region: '美国', version: 'V2.1', fieldCount: 35, materialCount: 8 },
    4: { name: '剑桥金融学网申模板', school: '剑桥大学', college: '商学院', program: '金融学', region: '英国', version: 'V1.8', fieldCount: 31, materialCount: 7 },
    5: { name: '香港大学数据科学网申模板', school: '香港大学', college: '计算与数据科学学院', program: '数据科学', region: '中国香港', version: 'V1.6', fieldCount: 29, materialCount: 6 },
    6: { name: 'CMU 人文学院网申模板', school: '卡内基梅隆大学', college: '人文学院', program: '中国哲学', region: '美国', version: 'V1.2', fieldCount: 28, materialCount: 6 },
    7: { name: 'CMU 软件工程硕士网申案例', school: '卡内基梅隆大学', program: '软件工程', region: '美国', version: 'V1.4', fieldCount: 34, materialCount: 6 },
    8: { name: '通用数据科学网申案例', school: '', program: '数据科学', region: '', version: 'V1.1', fieldCount: 26, materialCount: 6 }
  };
  var currentMeta = metadata[templateId] || metadata[1];
  try {
    var storedMetadata = JSON.parse(localStorage.getItem(templateStoreKey) || '[]').find(function (item) { return Number(item.id) === Number(templateId); });
    if (storedMetadata && storedMetadata.versions && storedMetadata.versions.length) {
      var storedCurrent = storedMetadata.versions[0];
      currentMeta = { name: storedMetadata.name, school: storedMetadata.school || '', college: storedMetadata.college || '', program: storedMetadata.program || '', boundPrograms: storedMetadata.boundPrograms || [], region: storedMetadata.region || '', version: String(storedCurrent.version || 'v1.0').toUpperCase(), fieldCount: storedCurrent.fields || 0, materialCount: storedCurrent.materials || 0 };
    }
  } catch (error) {}
  var availableSchools = ['卡内基梅隆大学', '斯坦福大学', '哥伦比亚大学', '剑桥大学', '香港大学', '纽约大学', '波士顿大学'];
  var availablePrograms = ['计算机科学', '人工智能', '软件工程', '数据科学', '金融工程', '金融学', '中国哲学'];
  var defaultPrograms = { 1: ['计算机科学', '人工智能', '软件工程'], 2: ['计算机科学'], 3: ['金融工程'], 4: ['金融学'], 5: ['数据科学'], 6: ['中国哲学'] };
  var boundPrograms = currentMeta.boundPrograms && currentMeta.boundPrograms.length ? currentMeta.boundPrograms.slice() : (defaultPrograms[templateId] || (currentMeta.program ? [currentMeta.program] : [])).slice();
  var activeProgramScope = 'common';
  var pages = isNew ? [{ id: 'page-1', name: '个人信息' }] : [
    { id: 'page-1', name: '个人信息' },
    { id: 'page-2', name: '教育背景' },
    { id: 'page-3', name: '经历与成绩' },
    { id: 'page-4', name: '项目问题' }
  ];
  var activePageId = pages[0].id;
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
    fields.forEach(function (item, index) { item.pageId = pages[Math.min(Math.floor(index / 10), pages.length - 1)].id; item.programScope = 'common'; });
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
  if (storedCurrent) {
    if (Array.isArray(storedCurrent.pageDetails) && storedCurrent.pageDetails.length) pages = storedCurrent.pageDetails;
    if (Array.isArray(storedCurrent.fieldDetails)) fields = storedCurrent.fieldDetails;
    if (Array.isArray(storedCurrent.materialDetails)) materials = storedCurrent.materialDetails;
    activePageId = pages[0].id;
  }
  var histories = isNew ? [] : [
    { version: currentMeta.version, time: '2026-08-08 16:20', editor: '王志强', fields: currentMeta.fieldCount, materials: currentMeta.materialCount, change: '补充护照有效期、推荐信抬头和申请轮次字段要求。' },
    { version: previousVersion(currentMeta.version, 1), time: '2026-07-25 10:12', editor: '王志强', fields: Math.max(1, currentMeta.fieldCount - 2), materials: currentMeta.materialCount, change: '更新个人陈述字数限制和语言成绩送分说明。' },
    { version: previousVersion(currentMeta.version, 2), time: '2026-06-18 14:35', editor: '李雪', fields: Math.max(1, currentMeta.fieldCount - 4), materials: Math.max(1, currentMeta.materialCount - 1), change: '建立首版官网字段结构，补充本科成绩单要求。' }
  ];
  if (storedMetadata && Array.isArray(storedMetadata.versions)) {
    histories = storedMetadata.versions.map(function (item) {
      return { version: String(item.version || 'v1.0').toUpperCase(), time: (item.updated || '2026-09-18') + ' 15:30', editor: '王志强', fields: item.fields || 0, materials: item.materials || 0, change: item.review || '保存该版本字段与材料内容。', fieldDetails: item.fieldDetails || [], pageDetails: item.pageDetails || pages };
    });
  } else {
    histories.forEach(function (item, index) {
      item.fieldDetails = fields.slice(0, Math.max(4, fields.length - index * 3)).map(function (field) { return Object.assign({}, field); });
      item.pageDetails = pages.slice();
    });
  }
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
  function fieldRow(item, index, order) {
    return '<article class="field-definition" data-field-index="' + index + '"><div class="field-definition-head"><span class="field-order">' + (order + 1) + '</span><button class="text-xs text-gray-400 hover:text-red-600" onclick="removeFieldRow(' + index + ')">删除</button></div>' +
      '<div class="field-control-grid"><div><label>字段名称</label><input class="input field-name" value="' + escapeHtml(item.name) + '" placeholder="请输入官网字段名称"></div>' +
      '<div><label>字段类型</label><select class="input field-type"><option' + (item.type === '文本' ? ' selected' : '') + '>文本</option><option' + (item.type === '日期' ? ' selected' : '') + '>日期</option><option' + (item.type === '下拉' ? ' selected' : '') + '>下拉</option><option' + (item.type === '邮箱' ? ' selected' : '') + '>邮箱</option><option' + (item.type === '数字' ? ' selected' : '') + '>数字</option><option' + (item.type === '文件' ? ' selected' : '') + '>文件</option></select></div>' +
      '<div><label>填写要求</label><select class="input field-required"><option value="1"' + (item.required ? ' selected' : '') + '>必填</option><option value="0"' + (!item.required ? ' selected' : '') + '>选填</option></select></div></div>' +
      '<div class="field-description"><label>填写说明</label><input class="input field-note" value="' + escapeHtml(item.note) + '" placeholder="说明填写格式、取值或注意事项"></div></article>';
  }
  function materialRow(item, index) {
    return '<div class="field-grid grid grid-cols-[minmax(220px,1.2fr)_120px_minmax(300px,1.6fr)_64px] gap-3 items-center px-5 py-3" data-material-index="' + index + '">' +
      '<input class="input material-name" value="' + escapeHtml(item.name) + '" placeholder="请输入材料名称">' +
      '<select class="input material-required"><option value="1"' + (item.required ? ' selected' : '') + '>必需</option><option value="0"' + (!item.required ? ' selected' : '') + '>非必需</option></select>' +
      '<input class="input material-note" value="' + escapeHtml(item.note) + '" placeholder="文件格式、数量或提交要求">' +
      '<button class="text-sm text-red-600 hover:text-red-800" onclick="removeMaterialRow(' + index + ')">删除</button></div>';
  }
  function syncRows() {
    document.querySelectorAll('#fieldRows [data-field-index]').forEach(function (row) {
      var index = Number(row.dataset.fieldIndex);
      if (!fields[index]) return;
      fields[index] = { name: row.querySelector('.field-name').value.trim(), type: row.querySelector('.field-type').value, required: row.querySelector('.field-required').value === '1', note: row.querySelector('.field-note').value.trim(), pageId: activePageId, programScope: activeProgramScope };
    });
    document.querySelectorAll('#materialRows [data-material-index]').forEach(function (row, index) {
      if (!materials[index]) return;
      materials[index] = { name: row.querySelector('.material-name').value.trim(), required: row.querySelector('.material-required').value === '1', note: row.querySelector('.material-note').value.trim() };
    });
  }
  function renderPages() {
    document.getElementById('applicationPageTabs').innerHTML = pages.map(function (page) {
      var count = fields.filter(function (field) { return field.pageId === page.id && (field.programScope || 'common') === activeProgramScope; }).length;
      return '<button type="button" class="page-tab ' + (page.id === activePageId ? 'active' : '') + '" onclick="selectApplicationPage(\'' + page.id + '\')"><strong>' + escapeHtml(page.name) + '</strong><small>' + count + ' 个字段</small></button>';
    }).join('');
    var activePage = pages.find(function (page) { return page.id === activePageId; });
    document.getElementById('activePageName').textContent = activePage ? activePage.name : '当前页面';
  }
  function renderRows() {
    var visibleFields = fields.map(function (item, index) { return { item: item, index: index }; }).filter(function (entry) { return entry.item.pageId === activePageId && (entry.item.programScope || 'common') === activeProgramScope; });
    document.getElementById('fieldRows').innerHTML = visibleFields.length ? visibleFields.map(function (entry, order) { return fieldRow(entry.item, entry.index, order); }).join('') : '<div class="col-span-2 py-10 text-center text-sm text-gray-400">当前页面暂无字段</div>';
    document.getElementById('materialRows').innerHTML = materials.length ? materials.map(materialRow).join('') : '<div class="py-10 text-center text-sm text-gray-400">暂无材料，请点击“添加材料”</div>';
    document.getElementById('fieldCount').textContent = visibleFields.length;
    document.getElementById('materialCount').textContent = materials.length;
    renderProgramScopes();
    renderPages();
  }
  window.selectApplicationPage = function (pageId) { syncRows(); activePageId = pageId; renderRows(); };
  window.addApplicationPage = function () { syncRows(); var page = { id: 'page-' + Date.now(), name: '申请页面 ' + (pages.length + 1) }; pages.push(page); activePageId = page.id; renderRows(); };
  window.addFieldRow = function () { syncRows(); fields.push({ name: '', type: '文本', required: true, note: '', pageId: activePageId, programScope: activeProgramScope }); renderRows(); var inputs = document.querySelectorAll('.field-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeFieldRow = function (index) { syncRows(); fields.splice(index, 1); renderRows(); };
  window.addMaterialRow = function () { syncRows(); materials.push({ name: '', required: true, note: '' }); renderRows(); var inputs = document.querySelectorAll('.material-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeMaterialRow = function (index) { syncRows(); materials.splice(index, 1); renderRows(); };
  function closeSearchSelectors(exceptPanel) {
    var schoolPanel = document.getElementById('schoolSelectorPanel');
    var programPanel = document.getElementById('programSelectorPanel');
    var schoolInput = document.getElementById('templateSchool');
    var programButton = document.getElementById('programSelectorButton');
    if (schoolPanel !== exceptPanel) {
      schoolPanel.classList.remove('show');
      schoolInput.setAttribute('aria-expanded', 'false');
    }
    if (programPanel !== exceptPanel) {
      programPanel.classList.remove('show');
      programButton.classList.remove('open');
      programButton.setAttribute('aria-expanded', 'false');
    }
  }
  function renderSchoolOptions() {
    var keyword = document.getElementById('templateSchool').value.trim().toLowerCase();
    var matched = availableSchools.map(function (school, index) { return { school: school, index: index }; }).filter(function (item) { return !keyword || item.school.toLowerCase().indexOf(keyword) >= 0; });
    document.getElementById('schoolSelectorPanel').innerHTML = matched.length ? matched.map(function (item) {
      return '<button type="button" class="school-option" onclick="selectSchool(' + item.index + ')">' + escapeHtml(item.school) + '</button>';
    }).join('') : '<div class="px-3 py-4 text-center text-xs text-gray-400">无匹配院校</div>';
  }
  window.openSchoolSelector = function () {
    var panel = document.getElementById('schoolSelectorPanel');
    closeSearchSelectors(panel);
    renderSchoolOptions();
    panel.classList.add('show');
    document.getElementById('templateSchool').setAttribute('aria-expanded', 'true');
  };
  window.filterSchoolOptions = window.openSchoolSelector;
  window.selectSchool = function (index) {
    document.getElementById('templateSchool').value = availableSchools[index];
    closeSearchSelectors();
  };
  function renderProgramOptions() {
    var searchInput = document.getElementById('programSearch');
    var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var matched = availablePrograms.map(function (program, index) { return { program: program, index: index }; }).filter(function (item) { return !keyword || item.program.toLowerCase().indexOf(keyword) >= 0; });
    document.getElementById('programOptions').innerHTML = matched.length ? matched.map(function (item) {
      return '<label class="program-option"><input type="checkbox" ' + (boundPrograms.indexOf(item.program) >= 0 ? 'checked ' : '') + 'onchange="toggleBoundProgram(' + item.index + ', this.checked)"><span>' + escapeHtml(item.program) + '</span></label>';
    }).join('') : '<div class="px-3 py-4 text-center text-xs text-gray-400">无匹配专业</div>';
  }
  function renderProgramSelector() {
    document.getElementById('boundProgramSummary').textContent = boundPrograms.length ? boundPrograms.length + ' 个专业：' + boundPrograms.join('、') : '请选择专业';
    renderProgramOptions();
  }
  window.filterProgramOptions = renderProgramOptions;
  function renderProgramScopes() {
    document.getElementById('programScopeTabs').innerHTML = '<span class="text-xs text-gray-400 mr-1">字段范围</span><button type="button" class="scope-tab ' + (activeProgramScope === 'common' ? 'active' : '') + '" onclick="selectProgramScope(-1)">通用字段</button>' + boundPrograms.map(function (program, index) {
      return '<button type="button" class="scope-tab ' + (activeProgramScope === program ? 'active' : '') + '" onclick="selectProgramScope(' + index + ')">' + escapeHtml(program) + '</button>';
    }).join('');
  }
  window.toggleProgramSelector = function () {
    var panel = document.getElementById('programSelectorPanel');
    var button = document.getElementById('programSelectorButton');
    if (panel.classList.contains('show')) {
      closeSearchSelectors();
      return;
    }
    closeSearchSelectors(panel);
    document.getElementById('programSearch').value = '';
    renderProgramOptions();
    panel.classList.add('show');
    button.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    document.getElementById('programSearch').focus();
  };
  window.toggleBoundProgram = function (index, checked) {
    syncRows();
    var program = availablePrograms[index];
    if (checked && boundPrograms.indexOf(program) < 0) boundPrograms.push(program);
    if (!checked) boundPrograms = boundPrograms.filter(function (item) { return item !== program; });
    if (activeProgramScope !== 'common' && boundPrograms.indexOf(activeProgramScope) < 0) activeProgramScope = 'common';
    renderProgramSelector();
    renderRows();
  };
  window.selectProgramScope = function (index) {
    syncRows();
    activeProgramScope = index < 0 ? 'common' : boundPrograms[index];
    renderRows();
  };

  function renderVersionDetail() {
    var item = histories[selectedVersion];
    if (!item) {
      document.getElementById('versionDetail').innerHTML = '<div class="h-full flex items-center justify-center text-sm text-gray-400">保存首个版本后可在此查看历史记录</div>';
      return;
    }
    var previewFields = item.fieldDetails && item.fieldDetails.length ? item.fieldDetails : fields;
    var previewRows = previewFields.map(function (field, index) {
      return '<div class="grid grid-cols-[36px_minmax(150px,1fr)_100px_90px_minmax(180px,1.2fr)] gap-3 px-3 py-2.5 border-t border-gray-100 text-xs items-center"><span class="text-gray-400">' + (index + 1) + '</span><span class="font-medium text-gray-800">' + escapeHtml(field.name) + '</span><span class="text-gray-500">' + escapeHtml(field.type || '文本') + '</span><span class="text-gray-500">' + (field.required ? '必填' : '选填') + '</span><span class="text-gray-500">' + escapeHtml(field.note || '—') + '</span></div>';
    }).join('');
    document.getElementById('versionDetail').innerHTML = '<div class="flex items-center justify-between mb-5"><div><p class="text-xl font-semibold text-gray-900">' + item.version + '</p><p class="text-sm text-gray-500 mt-1">' + item.time + ' · ' + item.editor + '</p></div>' + (selectedVersion === 0 ? '<span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">当前版本</span>' : '') + '</div>' +
      '<div class="flex items-center gap-5 pb-4 mb-4 border-b border-gray-200 text-sm text-gray-600"><span>官网字段 <strong class="text-gray-900">' + item.fields + '</strong></span><span>申请材料 <strong class="text-gray-900">' + item.materials + '</strong></span></div>' +
      '<div class="mb-4"><p class="text-sm font-semibold text-gray-800 mb-2">版本变更</p><p class="text-sm leading-6 text-gray-600">' + escapeHtml(item.change) + '</p></div>' +
      '<div><div class="flex items-center justify-between mb-2"><p class="text-sm font-semibold text-gray-800">字段预览</p><span class="text-xs text-gray-400">当前版本保存内容</span></div><div class="border border-gray-200 rounded-lg overflow-hidden"><div class="grid grid-cols-[36px_minmax(150px,1fr)_100px_90px_minmax(180px,1.2fr)] gap-3 px-3 py-2 bg-gray-50 text-xs text-gray-500"><span>序号</span><span>字段名称</span><span>类型</span><span>要求</span><span>填写说明</span></div><div class="max-h-64 overflow-y-auto">' + previewRows + '</div></div></div>';
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
  function persistTemplate(createVersion) {
    syncRows();
    var name = document.getElementById('templateName').value.trim();
    var school = document.getElementById('templateSchool').value.trim();
    var college = document.getElementById('templateCollege').value.trim();
    if (!name || !school || !college) { showToast('请完整填写模板名称、绑定院校和学院'); return; }
    if (availableSchools.indexOf(school) < 0) { showToast('请从搜索结果中选择绑定院校'); return; }
    if (!fields.length || fields.some(function (item) { return !item.name; })) { showToast('请至少添加一个完整的官网字段'); return; }
    if (!materials.length || materials.some(function (item) { return !item.name; })) { showToast('请至少添加一项完整的申请材料'); return; }
    var current = document.getElementById('currentVersion').textContent;
    var version = current === '未保存' ? 'V1.0' : (createVersion ? nextVersion(current) : current);
    document.getElementById('currentVersion').textContent = version;
    var historyItem = { version: version, time: '2026-09-18 15:30', editor: '王志强', fields: fields.length, materials: materials.length, change: createVersion ? '另存版本并保留上一版本内容。' : '保存当前版本的字段与材料内容。', fieldDetails: fields.map(function (field) { return Object.assign({}, field); }), pageDetails: pages.slice() };
    if (createVersion || !histories.length) histories.unshift(historyItem); else histories[0] = historyItem;
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(templateStoreKey) || '[]'); } catch (error) { stored = []; }
    var session = window.pbsGetSession ? window.pbsGetSession() : { org: 'PBS留学总部' };
    var existing = stored.find(function (item) { return Number(item.id) === Number(savedTemplateId); });
    var versions = existing && Array.isArray(existing.versions) ? existing.versions.slice() : histories.slice(1).map(function (item) {
      return { version: String(item.version).toLowerCase(), fields: item.fields, materials: item.materials, updated: item.time.slice(0, 10), review: '历史版本，仅供查看与复用。' };
    });
    var versionPayload = {
      version: version.toLowerCase(),
      fields: fields.length,
      materials: materials.length,
      updated: new Date().toISOString().slice(0, 10),
      review: '请按当前申请季复核官网字段与材料要求。',
      fieldDetails: fields,
      materialDetails: materials,
      pageDetails: pages
    };
    if (existing && versions.length && !createVersion) versions[0] = versionPayload; else versions.unshift(versionPayload);
    stored = stored.filter(function (item) { return Number(item.id) !== Number(savedTemplateId); });
    stored.push({ id: savedTemplateId, name: name, school: school, college: college, boundPrograms: boundPrograms, program: boundPrograms[0] || '', region: currentMeta.region || '', org: session.org || 'PBS留学总部', versions: versions });
    localStorage.setItem(templateStoreKey, JSON.stringify(stored));
    showToast(createVersion ? version + ' 已另存为新版本' : version + ' 已保存，版本号未变化');
  }
  window.saveTemplate = function () { persistTemplate(false); };
  window.saveNewVersion = function () { persistTemplate(true); };

  function initialize() {
    document.getElementById('pageTitle').textContent = isNew ? '新增网申模板' : '修改网申模板';
    document.getElementById('breadcrumbMode').textContent = isNew ? '新增模板' : '修改模板';
    document.getElementById('currentVersion').textContent = isNew ? '未保存' : currentMeta.version;
    document.getElementById('templateName').value = isNew ? '' : currentMeta.name;
    document.getElementById('templateSchool').value = isNew ? '' : currentMeta.school;
    document.getElementById('templateCollege').value = isNew ? '' : currentMeta.college;
    document.getElementById('templateSchool').addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openSchoolSelector();
        var firstOption = document.querySelector('#schoolSelectorPanel .school-option');
        if (firstOption) firstOption.focus();
      }
      if (event.key === 'Enter') {
        var firstMatched = document.querySelector('#schoolSelectorPanel.show .school-option');
        if (firstMatched) {
          event.preventDefault();
          firstMatched.click();
        }
      }
    });
    renderProgramSelector();
    renderRows();
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('.search-select')) return;
    closeSearchSelectors();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeVersionHistory();
    closeSearchSelectors();
  });
  initialize();
})();
