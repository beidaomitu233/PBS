(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var isNew = params.get('mode') === 'new';
  var templateId = Number(params.get('id') || 1);
  var savedTemplateId = isNew ? Date.now() : templateId;
  var centerMode = params.get('center') === '1';
  var templateStoreKey = centerMode ? 'pbs_platform_application_templates_v1' : 'pbs_web_application_templates_v2';
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
    var storedMetadata = isNew ? null : JSON.parse(localStorage.getItem(templateStoreKey) || '[]').find(function (item) { return Number(item.id) === Number(templateId); });
    if (storedMetadata && storedMetadata.versions && storedMetadata.versions.length) {
      var storedCurrent = storedMetadata.versions[0];
      currentMeta = { name: storedMetadata.name, school: storedMetadata.school || '', college: storedMetadata.college || '', program: storedMetadata.program || '', boundPrograms: storedMetadata.boundPrograms || [], region: storedMetadata.region || '', applicationUrl:storedMetadata.applicationUrl || '', version: String(storedCurrent.version || 'v1.0').toUpperCase(), fieldCount: storedCurrent.fields || 0, materialCount: storedCurrent.materials || 0 };
    }
  } catch (error) {}
  if (!centerMode && storedMetadata && storedMetadata.sourcePlatformTemplateId) { location.replace('网申模板库 - 留学申请管理系统.html'); return; }
  var scanResultsAvailable = false, loadedScanTime = storedMetadata && storedMetadata.scannedAt || '', savedContentSignature = '';
  var availableSchools = ['卡内基梅隆大学', '斯坦福大学', '哥伦比亚大学', '剑桥大学', '香港大学', '纽约大学', '波士顿大学'];
  var defaultPrograms = { 1: ['计算机科学', '人工智能', '软件工程'], 2: ['计算机科学'], 3: ['金融工程'], 4: ['金融学'], 5: ['数据科学'], 6: ['中国哲学'] };
  var boundPrograms = Array.isArray(currentMeta.boundPrograms) ? currentMeta.boundPrograms.slice() : (defaultPrograms[templateId] || (currentMeta.program ? [currentMeta.program] : [])).slice();
  if (isNew) boundPrograms = [];
  var activeProgramScope = 'all', editingPageId = '';
  var selectedSchool = isNew ? '' : currentMeta.school;
  var pages = isNew ? [{ id: 'page-1', name: '申请信息', programScope:'common' }] : [
    { id: 'page-1', name: '个人信息' },
    { id: 'page-2', name: '教育背景' },
    { id: 'page-3', name: '经历与成绩' },
    { id: 'page-4', name: '项目问题' }
  ];
  var activePageId = pages[0].id;
  var entrances = [{ id:'entry-main', name:'默认入口', url:'https://apply.cmu.edu', stage:'不限', channel:'直申', isDefault:true }];
  var activeEntranceId = 'entry-main', editingEntranceId = null, editingFields = {}, selectedPrograms = [];
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
  fields.forEach(function(field,index){if (!field.id) field.id = 'field-' + index;});
  if (storedMetadata && Array.isArray(storedMetadata.versions)) {
    histories = storedMetadata.versions.map(function (item) {
      return { version: String(item.version || 'v1.0').toUpperCase(), time: item.savedAt || item.updated || '', editor: '王志强', fields: item.fields || 0, materials: item.materials || 0, change: item.review || '', fieldDetails: item.fieldDetails || [], pageDetails: item.pageDetails || [], materialDetails:item.materialDetails || [], entranceDetails:item.entranceDetails || [] };
    });
  } else {
    histories.forEach(function (item, index) {
      item.fieldDetails = fields.slice(0, Math.max(4, fields.length - index * 3)).map(function (field) { return Object.assign({}, field); });
      item.pageDetails = pages.slice();
      item.materialDetails = materials.slice(0, Math.max(0, materials.length - index));
      item.fields = item.fieldDetails.length; item.materials = item.materialDetails.length;
    });
  }
  var selectedVersion = 0;
  if (storedCurrent && storedCurrent.entranceDetails && storedCurrent.entranceDetails.length) entrances = storedCurrent.entranceDetails;
  else if (isNew) entrances[0].url = '';
  else if (templateId !== 1) entrances[0].url = '';
  activeEntranceId = (entrances.find(function (entry) { return entry.isDefault; }) || entrances[0]).id;
  entrances.forEach(function(entry){entry.stage=entry.stage || '不限';entry.channel=entry.channel || '直申';});
  pages.forEach(function (page) { if (!page.entranceId) page.entranceId = activeEntranceId; if (!page.programScope) page.programScope='common'; });
  activePageId = (pages.find(function (page) { return page.entranceId === activeEntranceId; }) || pages[0]).id;

  function previousVersion(version, offset) {
    var matched = String(version).match(/V(\d+)\.(\d+)/i);
    if (!matched) return 'V1.0';
    var serial = Math.max(10, Number(matched[1]) * 10 + Number(matched[2]) - offset);
    return 'V' + Math.floor(serial / 10) + '.' + (serial % 10);
  }
  function nextVersion(version) {
    if (centerMode) return pbsTemplatePublishing.nextVersion([{version:version}]);
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
    var editing = !!editingFields[index];
    var head = '<article class="field-definition' + (editing ? ' is-editing' : '') + '" data-field-index="' + index + '"><div class="field-definition-head"><span class="field-order">' + (order + 1) + '</span><div class="flex gap-4"><button class="text-xs text-blue-600" onclick="toggleFieldEditing(' + index + ')">' + (editing ? '完成' : '编辑') + '</button><button class="text-xs text-gray-400 hover:text-red-600" onclick="removeFieldRow(' + index + ')">删除</button></div></div>';
    if (!editing) return head + '<h3 class="field-read-name">' + escapeHtml(item.name) + '</h3><div class="field-read-meta"><span>' + escapeHtml(item.type) + '</span><span>' + (item.required ? '必填' : '选填') + '</span></div><p class="field-read-note">' + escapeHtml(item.note || '—') + '</p></article>';
    return head +
      '<div class="field-control-grid"><div><label>字段名称</label><input class="input field-name" value="' + escapeHtml(item.name) + '" placeholder="请输入官网字段名称"></div>' +
      '<div><label>字段类型</label><select class="input field-type" onchange="updateFieldOptions(this)">' + ['文本','邮箱','日期','下拉','多行文本','电话','数字','单选','勾选','文件'].map(function(type){ return '<option' + (item.type === type ? ' selected' : '') + '>' + type + '</option>'; }).join('') + '</select></div>' +
      '<div><label>填写要求</label><select class="input field-required"><option value="1"' + (item.required ? ' selected' : '') + '>必填</option><option value="0"' + (!item.required ? ' selected' : '') + '>选填</option></select></div></div>' +
      '<div class="field-description"><label>填写说明</label><input class="input field-note" value="' + escapeHtml(item.note) + '" placeholder="说明填写格式、取值或注意事项"></div><div class="field-description field-options-wrap"' + (['下拉','单选','勾选'].indexOf(item.type) < 0 ? ' hidden' : '') + '><label>可选值</label><textarea class="textarea field-options" placeholder="每行一个选项">' + escapeHtml(Array.isArray(item.options) ? item.options.join('\n') : item.options || '') + '</textarea></div></article>';
  }
  window.updateFieldOptions = function(select) { select.closest('article').querySelector('.field-options-wrap').hidden = ['下拉','单选','勾选'].indexOf(select.value) < 0; };
  window.toggleFieldEditing = function(index) { syncRows(); if (editingFields[index] && !fields[index].name) { showToast('请填写字段名称'); return; } editingFields[index] = !editingFields[index]; renderRows(); };
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
      if (!row.querySelector('.field-name')) return;
      fields[index] = Object.assign({}, fields[index], { name: row.querySelector('.field-name').value.trim(), type: row.querySelector('.field-type').value, required: row.querySelector('.field-required').value === '1', note: row.querySelector('.field-note').value.trim(), options: row.querySelector('.field-options').value.split('\n').map(function(value){return value.trim();}).filter(Boolean) });
    });
    document.querySelectorAll('#materialRows [data-material-index]').forEach(function (row, index) {
      if (!materials[index]) return;
      materials[index] = { name: row.querySelector('.material-name').value.trim(), required: row.querySelector('.material-required').value === '1', note: row.querySelector('.material-note').value.trim() };
    });
  }
  function visiblePages() {
    return pages.filter(function(page){return page.entranceId === activeEntranceId && (activeProgramScope === 'all' || (page.programScope || 'common') === activeProgramScope || fields.some(function(field){return field.pageId === page.id && field.programScope === activeProgramScope;}));});
  }
  function renderPages() {
    document.getElementById('applicationPageTabs').innerHTML = visiblePages().map(function(page){
      var count = fields.filter(function(field){return field.pageId === page.id && (activeProgramScope === 'all' || (field.programScope || 'common') === activeProgramScope);}).length;
      return '<button type="button" class="page-tab ' + (page.id === activePageId ? 'active' : '') + '" onclick="selectApplicationPage(\'' + page.id + '\')"><strong>' + escapeHtml(page.name) + '</strong><small><em>' + escapeHtml(page.programScope === 'common' ? '通用' : page.programScope) + '</em><span>' + count + ' 个字段</span></small></button>';
    }).join('');
    var activePage = pages.find(function(page){return page.id === activePageId;});
    document.getElementById('activePageName').textContent = activePage ? activePage.name : '当前页面';
    document.getElementById('applicationPageName').value = activePage ? activePage.name : '';
    document.getElementById('pageManager').hidden = !activePage || (!fields.some(function(field){return field.pageId === activePageId;}) && editingPageId !== activePageId);
    document.getElementById('entranceTabRow').hidden = entrances.length < 2;
    document.getElementById('entranceTabs').innerHTML = entrances.map(function(entry,index){return '<button type="button" class="scope-tab ' + (entry.id === activeEntranceId ? 'active' : '') + '" onclick="selectEntrance(' + index + ')">' + escapeHtml(entry.name) + '</button>';}).join('');
  }
  function renderRows() {
    var list=visiblePages();
    if(!list.some(function(page){return page.id === activePageId;}))activePageId=list.length ? list[0].id : '';
    var visibleFields = fields.map(function(item,index){return {item:item,index:index};}).filter(function(entry){return entry.item.pageId === activePageId && (activeProgramScope === 'all' || (entry.item.programScope || 'common') === activeProgramScope);});
    document.getElementById('fieldRows').innerHTML = visibleFields.length ? visibleFields.map(function(entry,order){return fieldRow(entry.item,entry.index,order);}).join('') : '<div class="col-span-2 py-10 text-center text-sm text-gray-400">当前页面暂无字段</div>';
    document.getElementById('materialRows').innerHTML = materials.length ? materials.map(materialRow).join('') : '<div class="py-10 text-center text-sm text-gray-400">暂无材料</div>';
    document.getElementById('fieldCount').textContent=visibleFields.length;
    document.getElementById('materialCount').textContent=materials.length;
    renderProgramScopes(); renderPages(); filterMaterials();
  }
  window.filterMaterials = function(){
    var keyword=document.getElementById('materialSearch').value.trim().toLowerCase();
    document.querySelectorAll('#materialRows [data-material-index]').forEach(function(row){var item=materials[Number(row.dataset.materialIndex)];row.hidden=!!keyword && !(item.name+' '+item.note).toLowerCase().includes(keyword);});
  };
  window.selectApplicationPage = function (pageId) { syncRows(); activePageId = pageId; renderRows(); };
  window.addApplicationPage = function () { syncRows(); var page = { id: 'page-' + Date.now(), name: '申请页面 ' + (pages.length + 1), entranceId:activeEntranceId, programScope:activeProgramScope === 'all' ? 'common' : activeProgramScope }; pages.push(page); activePageId = page.id; editingPageId=page.id; renderRows(); document.getElementById('applicationPageName').focus(); };
  window.renameApplicationPage = function(value) { var page = pages.find(function(item){return item.id === activePageId;}); if (page && value.trim()) page.name = value.trim(); renderPages(); };
  window.deleteApplicationPage = function() { if (pages.filter(function(page){return page.entranceId === activeEntranceId;}).length <= 1) { showToast('每个入口至少保留一个页面'); return; } if (!confirm('删除页面及其字段？')) return; syncRows(); fields = fields.filter(function(field){return field.pageId !== activePageId;}); pages = pages.filter(function(page){return page.id !== activePageId;}); activePageId = pages.find(function(page){return page.entranceId === activeEntranceId;}).id; editingFields = {}; renderRows(); };
  window.addFieldRow = function () { syncRows(); if(!activePageId)window.addApplicationPage(); fields.push({ id:'field-' + Date.now(), name: '', type: '文本', required: true, note: '', pageId: activePageId, programScope: activeProgramScope === 'all' ? (pages.find(function(page){return page.id === activePageId;}).programScope || 'common') : activeProgramScope }); editingFields[fields.length - 1] = true; renderRows(); var inputs = document.querySelectorAll('.field-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeFieldRow = function (index) { syncRows(); fields.splice(index, 1); editingFields = {}; renderRows(); };
  window.selectEntrance = function(index) { syncRows(); activeEntranceId = entrances[index].id; var page = pages.find(function(item){return item.entranceId === activeEntranceId;}); if (!page) { page = {id:'page-' + Date.now(),name:'个人信息',entranceId:activeEntranceId}; pages.push(page); } activePageId = page.id; renderRows(); };
  function renderEntranceRows() {
    document.getElementById('entranceCount').textContent=entrances.length;
    document.getElementById('entranceRows').innerHTML=entrances.map(function(entry,index){
      var entryPages=pages.filter(function(page){return page.entranceId === entry.id;});
      var programs=Array.from(new Set(entryPages.map(function(page){return page.programScope;}).filter(function(scope){return scope && scope!=='common';})));
      return '<div class="drawer-record"><div><strong>'+escapeHtml(entry.name)+(entry.isDefault?'<small>默认</small>':'')+'</strong><p>'+escapeHtml(entry.stage+' · '+entry.channel)+' · '+entryPages.length+' 页 · '+programs.length+' 个专业</p></div><div class="flex gap-3"><button onclick="editEntrance('+index+')">编辑</button>'+(!entry.isDefault?'<button onclick="removeEntranceRow('+index+')">删除</button>':'')+'</div></div>';
    }).join('');
  }
  window.resetEntranceEditor=function(){editingEntranceId=null;document.getElementById('entranceEditorTitle').textContent='新增入口';document.getElementById('entranceName').value='';document.getElementById('entranceStage').value='不限';document.getElementById('entranceChannel').value='直申';document.getElementById('entranceUrl').value='';document.getElementById('entranceError').textContent='';document.getElementById('saveEntranceButton').textContent='添加入口';document.getElementById('cancelEntranceEdit').hidden=true;};
  window.openEntranceManager=function(){syncRows();var entry=entrances.find(function(item){return item.isDefault;});entry.url=document.getElementById('templateUrl').value.trim();renderEntranceRows();resetEntranceEditor();document.getElementById('entranceModal').hidden=false;};
  window.closeEntranceManager=function(){document.getElementById('entranceModal').hidden=true;};
  window.editEntrance=function(index){var entry=entrances[index];editingEntranceId=entry.id;document.getElementById('entranceEditorTitle').textContent='编辑入口';document.getElementById('entranceName').value=entry.name;document.getElementById('entranceStage').value=entry.stage;document.getElementById('entranceChannel').value=entry.channel;document.getElementById('entranceUrl').value=entry.url;document.getElementById('saveEntranceButton').textContent='保存入口';document.getElementById('cancelEntranceEdit').hidden=false;document.getElementById('entranceName').focus();};
  window.saveEntranceEntry=function(){
    var name=document.getElementById('entranceName').value.trim(),url=document.getElementById('entranceUrl').value.trim();
    if(!name || url && !/^https?:\/\/[^\s/]+/i.test(url)){document.getElementById('entranceError').textContent='请填写入口名称和有效的网址';return;}
    var entry=entrances.find(function(item){return item.id===editingEntranceId;});
    if(!entry){entry={id:'entry-'+Date.now(),isDefault:false};entrances.push(entry);pages.push({id:'page-'+Date.now(),name:'申请信息',entranceId:entry.id,programScope:'common'});}
    Object.assign(entry,{name:name,url:url,stage:document.getElementById('entranceStage').value,channel:document.getElementById('entranceChannel').value});
    if(entry.isDefault)document.getElementById('templateUrl').value=entry.url;
    renderEntranceRows();resetEntranceEditor();renderRows();
  };
  window.removeEntranceRow=function(index){var entry=entrances[index];if(entry.isDefault)return;if(!confirm('删除此入口及其页面、字段？'))return;var removed=pages.filter(function(page){return page.entranceId===entry.id;}).map(function(page){return page.id;});fields=fields.filter(function(field){return !removed.includes(field.pageId);});pages=pages.filter(function(page){return page.entranceId!==entry.id;});entrances.splice(index,1);if(activeEntranceId===entry.id)activeEntranceId=entrances[0].id;renderEntranceRows();resetEntranceEditor();renderRows();};
  window.addMaterialRow = function () { syncRows(); document.getElementById('materialSearch').value=''; materials.push({ name: '', required: true, note: '' }); renderRows(); var inputs = document.querySelectorAll('.material-name'); if (inputs.length) inputs[inputs.length - 1].focus(); };
  window.removeMaterialRow = function (index) { syncRows(); materials.splice(index, 1); renderRows(); };
  function closeSearchSelectors(exceptPanel) {
    var schoolPanel = document.getElementById('schoolSelectorPanel');
    var schoolInput = document.getElementById('templateSchool');
    if (schoolPanel !== exceptPanel) {
      schoolPanel.classList.remove('show');
      schoolInput.setAttribute('aria-expanded', 'false');
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
    var school=availableSchools[index];
    if(selectedSchool!==school){boundPrograms=[];activeProgramScope='all';fields.forEach(function(field){field.programScope='common';});pages.forEach(function(page){page.programScope='common';});}
    document.getElementById('templateSchool').value = school;
    selectedSchool=school;
    renderProgramSelector();renderRows();
    closeSearchSelectors();
  };
  var schoolPrograms={
    '香港大学':[{name:'东亚研究文学硕士',degree:'文学硕士',code:'MAEAS'},{name:'中医学士',degree:'中医学士',code:'BChinMed'},{name:'中国历史学文学硕士',degree:'硕士',code:'MACH'},{name:'中国发展研究硕士',degree:'硕士',code:'MCDS'},{name:'中国法法学硕士',degree:'硕士',code:'LLM'},{name:'数据科学',degree:'硕士',code:'MDASC'},{name:'人工智能',degree:'硕士',code:'MSAI'}],
    '卡内基梅隆大学':[{name:'计算机科学',degree:'硕士',code:'MSCS'},{name:'人工智能',degree:'硕士',code:'MSAI'},{name:'软件工程',degree:'硕士',code:'MSE'},{name:'数据科学',degree:'硕士',code:'MCDS'},{name:'中国哲学',degree:'人文学院',code:'PHIL'}],
    '斯坦福大学':[{name:'计算机科学',degree:'硕士',code:'MSCS'},{name:'数据科学',degree:'硕士',code:'MSDS'},{name:'电气工程',degree:'硕士',code:'MSEE'}],
    '哥伦比亚大学':[{name:'金融工程',degree:'硕士',code:'MSFE'},{name:'计算机科学',degree:'硕士',code:'MSCS'}],
    '剑桥大学':[{name:'金融学',degree:'硕士',code:'MFIN'},{name:'高级计算机科学',degree:'硕士',code:'ACS'}]
  };
  var catalogKey='pbs_institution_program_catalog_v1';
  function programCatalogKey(){return (window.pbsGetSession?pbsGetSession().org:'PBS留学总部')+'|'+document.getElementById('templateSchool').value.trim();}
  function organizationPrograms(){return JSON.parse(localStorage.getItem(catalogKey)||'{}')[programCatalogKey()]||[];}
  function programsForSchool(){return schoolPrograms[document.getElementById('templateSchool').value.trim()]||[];}
  function programOption(item){var bound=boundPrograms.includes(item.name);return '<label class="drawer-program-option"><input type="checkbox" value="'+escapeHtml(item.name)+'"'+(selectedPrograms.includes(item.name)?' checked':'')+(bound?' disabled':'')+'><span><strong>'+escapeHtml(item.name)+'</strong><p>'+escapeHtml([item.degree,item.code].filter(Boolean).join(' · '))+(bound?' · 已绑定':'')+'</p></span></label>';}
  function renderProgramOptions(){
    var keyword=document.getElementById('programSearch').value.trim().toLowerCase(),list=programsForSchool();
    document.getElementById('programSchoolName').textContent=document.getElementById('templateSchool').value.trim();document.getElementById('schoolProgramCount').textContent=list.length;
    document.getElementById('programOptions').innerHTML=list.filter(function(item){return !keyword||(item.name+' '+item.code).toLowerCase().includes(keyword);}).map(programOption).join('')||'<div class="drawer-empty">暂无匹配专业</div>';
    document.getElementById('organizationProgramOptions').innerHTML=organizationPrograms().map(programOption).join('')||'<div class="drawer-empty">暂无可选专业</div>';
    document.getElementById('programSelectedCount').textContent='已选 '+selectedPrograms.length+' 项';document.getElementById('addSelectedPrograms').disabled=!selectedPrograms.length;
  }
  function renderProgramSelector(){document.getElementById('boundProgramSummary').textContent=boundPrograms.length?boundPrograms.join('、'):'尚未绑定专业';}
  function renderBoundPrograms(){document.getElementById('boundProgramCount').textContent=boundPrograms.length;document.getElementById('boundProgramList').innerHTML=boundPrograms.length?boundPrograms.map(function(name,index){return '<div class="drawer-record"><strong>'+escapeHtml(name)+'</strong><button onclick="removeBoundProgram('+index+')">解除绑定</button></div>';}).join(''):'<div class="drawer-empty">暂无绑定专业</div>';}
  window.filterProgramOptions=renderProgramOptions;
  function renderProgramScopes(){
    document.getElementById('programScopeTabs').innerHTML='<span class="text-xs text-gray-400 mr-1">页面筛选</span><button type="button" class="scope-tab '+(activeProgramScope==='all'?'active':'')+'" onclick="selectProgramScope(-2)">全部页面</button><button type="button" class="scope-tab '+(activeProgramScope==='common'?'active':'')+'" onclick="selectProgramScope(-1)">学院通用</button>'+boundPrograms.map(function(program,index){return '<button type="button" class="scope-tab '+(activeProgramScope===program?'active':'')+'" onclick="selectProgramScope('+index+')">'+escapeHtml(program)+'</button>';}).join('');
  }
  window.openProgramManager=function(){if(!document.getElementById('templateSchool').value.trim()){showToast('请先选择学校');return;}syncRows();selectedPrograms=[];document.getElementById('programSearch').value='';document.getElementById('programCatalogEditor').hidden=true;renderBoundPrograms();renderProgramOptions();document.getElementById('programModal').hidden=false;};
  window.closeProgramManager=function(){document.getElementById('programModal').hidden=true;};
  window.addSelectedPrograms=function(){selectedPrograms.forEach(function(name){if(!boundPrograms.includes(name))boundPrograms.push(name);});selectedPrograms=[];renderBoundPrograms();renderProgramOptions();renderProgramSelector();renderRows();};
  window.removeBoundProgram=function(index){var name=boundPrograms[index];boundPrograms.splice(index,1);if(activeProgramScope===name)activeProgramScope='all';fields.forEach(function(field){if(field.programScope===name)field.programScope='common';});pages.forEach(function(page){if(page.programScope===name)page.programScope='common';});renderBoundPrograms();renderProgramOptions();renderProgramSelector();renderRows();};
  window.selectProgramScope=function(index){syncRows();activeProgramScope=index===-2?'all':index<0?'common':boundPrograms[index];renderRows();};
  window.toggleProgramCatalogEditor=function(){var form=document.getElementById('programCatalogEditor');form.hidden=!form.hidden;if(!form.hidden)document.getElementById('catalogProgramName').focus();};
  window.addCatalogProgram=function(){var name=document.getElementById('catalogProgramName').value.trim(),code=document.getElementById('catalogProgramCode').value.trim(),all=JSON.parse(localStorage.getItem(catalogKey)||'{}'),key=programCatalogKey(),list=all[key]||[];if(!name){document.getElementById('programCatalogError').textContent='请填写专业名称';return;}if(list.some(function(item){return item.name===name;})||programsForSchool().some(function(item){return item.name===name;})){document.getElementById('programCatalogError').textContent='该专业已在目录中';return;}list.push({name:name,code:code});all[key]=list;localStorage.setItem(catalogKey,JSON.stringify(all));document.getElementById('catalogProgramName').value='';document.getElementById('catalogProgramCode').value='';document.getElementById('programCatalogError').textContent='';renderProgramOptions();};
  document.getElementById('programModal').addEventListener('change',function(event){var input=event.target;if(input.matches('.drawer-program-option input')){selectedPrograms=selectedPrograms.filter(function(name){return name!==input.value;});if(input.checked)selectedPrograms.push(input.value);document.getElementById('programSelectedCount').textContent='已选 '+selectedPrograms.length+' 项';document.getElementById('addSelectedPrograms').disabled=!selectedPrograms.length;}});
  ['entranceModal','programModal'].forEach(function(id){document.getElementById(id).addEventListener('click',function(event){if(event.target===this)this.hidden=true;});});

  function renderVersionDetail() {
    var item = histories[selectedVersion];
    if (!item) {
      document.getElementById('versionDetail').innerHTML = '<div class="h-full flex items-center justify-center text-sm text-gray-400">保存首个版本后可在此查看历史记录</div>';
      return;
    }
    var previewFields = item.fieldDetails || [], previewPages = item.pageDetails || [];
    var previewRows = previewFields.map(function (field, index) {
      var page = previewPages.find(function(page){return page.id === field.pageId;});
      return '<tr><td>' + (index + 1) + '</td><td><strong>' + escapeHtml(field.name) + '</strong><div class="text-gray-400 mt-1">' + escapeHtml(page ? page.name : '') + (field.programScope && field.programScope !== 'common' ? ' · ' + escapeHtml(field.programScope) : '') + '</div></td><td>' + escapeHtml(field.type || '文本') + '</td><td>' + (field.required ? '必填' : '选填') + '</td><td>' + escapeHtml(field.note || '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="5">此版本尚未保存字段内容</td></tr>';
    var materialPreview = (item.materialDetails || []).map(function(material){return '<tr><td>' + escapeHtml(material.name) + '</td><td>' + (material.required ? '必需' : '非必需') + '</td><td>' + escapeHtml(material.note || '—') + '</td></tr>';}).join('') || '<tr><td colspan="3">暂无材料内容</td></tr>';
    document.getElementById('versionDetail').innerHTML = '<div class="flex items-center justify-between mb-5"><div><p class="text-xl font-semibold text-gray-900">' + item.version + '</p><p class="text-sm text-gray-500 mt-1">' + item.time + ' · ' + item.editor + '</p></div>' + (selectedVersion === 0 ? '<span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">当前版本</span>' : '') + '</div>' +
      '<div class="flex items-center gap-5 pb-4 mb-4 border-b border-gray-200 text-sm text-gray-600"><span>官网字段 <strong class="text-gray-900">' + item.fields + '</strong></span><span>申请材料 <strong class="text-gray-900">' + item.materials + '</strong></span></div>' +
      '<div><p class="text-sm font-semibold text-gray-800 mb-3">字段预览</p><div class="version-preview-scroll"><table class="version-preview-table"><thead><tr><th>序号</th><th>字段名称 / 页面</th><th>类型</th><th>要求</th><th>填写说明</th></tr></thead><tbody>' + previewRows + '</tbody></table></div></div><div class="mt-6"><p class="text-sm font-semibold text-gray-800 mb-3">申请材料</p><div class="version-preview-scroll"><table class="version-preview-table"><thead><tr><th>材料名称</th><th>要求</th><th>材料说明</th></tr></thead><tbody>' + materialPreview + '</tbody></table></div></div>';
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
  function contentSignature() { return JSON.stringify([document.getElementById('templateName').value.trim(),document.getElementById('templateSchool').value.trim(),document.getElementById('templateCollege').value.trim(),document.getElementById('templateRegion').value.trim(),document.getElementById('templateUrl').value.trim(),boundPrograms,fields,pages,materials,entrances]); }
  function persistTemplate(createVersion, forScan, afterSave, destination) {
    if (scanResultsAvailable) { showToast('请先加载插件保存的扫描结果'); return false; }
    if (centerMode && !pbsTemplatePublishing.isPublisher(isNew ? 'create' : 'edit')) { showToast('无权维护平台模板'); return false; }
    syncRows();
    var name = document.getElementById('templateName').value.trim();
    var school = document.getElementById('templateSchool').value.trim();
    var college = document.getElementById('templateCollege').value.trim();
    if (forScan) {
      if (!school || !college) { showToast('请填写学校和学院'); return false; }
      if (!name) { name = school + ' · ' + college + '网申模板'; document.getElementById('templateName').value = name; }
    } else {
      if (!name || !school || !college) { showToast('请完整填写模板名称、绑定院校和学院'); return false; }
      if (availableSchools.indexOf(school) < 0) { showToast('请从搜索结果中选择绑定院校'); return false; }
      if (fields.some(function (item) { return !item.name; })) { showToast('请填写完整的官网字段名称'); return false; }
      if (materials.some(function (item) { return !item.name; })) { showToast('请填写材料名称'); return false; }
    }
    var applicationUrl=document.getElementById('templateUrl').value.trim();
    if(!forScan && applicationUrl && !/^https?:\/\/[^\s/]+/i.test(applicationUrl)){showToast('请填写有效的申请入口网址');return false;}
    entrances.find(function(entry){return entry.isDefault;}).url=applicationUrl;
    if (centerMode && isNew && destination === undefined && pbsTemplatePublishing.overwriteCandidates(school,college).length) {
      choosePlatformTemplateDestination([{id:'draft',name:name,school:school,college:college}],'确认保存',function(choices){if(persistTemplate(createVersion,forScan,null,choices.draft) && afterSave)afterSave();}); return false;
    }
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(templateStoreKey) || '[]'); } catch (error) {}
    var overwriting = centerMode && isNew && !!destination;
    if (overwriting) {
      var target = stored.find(function(item) { return Number(item.id) === Number(destination) && item.school === school && item.college === college; });
      if (!target || !pbsTemplatePublishing.isPublisher('edit')) { showToast('请选择同校同学院的有效覆盖模板'); return false; }
      savedTemplateId = target.id; createVersion = true; document.getElementById('currentVersion').textContent = target.versions[0].version;
      histories = target.versions.map(function(item){return {version:item.version,time:item.savedAt || item.updated || '',editor:item.editor || '王志强',fields:item.fields,materials:item.materials,fieldDetails:item.fieldDetails || [],pageDetails:item.pageDetails || [],materialDetails:item.materialDetails || [],entranceDetails:item.entranceDetails || []};});
    }
    var existing = stored.find(function(item) { return Number(item.id) === Number(savedTemplateId); });
    if (centerMode && existing && !createVersion) {
      var published = pbsTemplatePublishing.publications().some(function(item) { return Number(item.templateId) === Number(existing.id) && item.version === existing.versions[0].version; });
      if (published) {
        var changed = forScan || contentSignature() !== savedContentSignature;
        if (!changed) { showToast('当前版本已保存'); return true; }
        createVersion = true;
      }
    }
    var current = document.getElementById('currentVersion').textContent;
    var version = current === '未保存' ? (centerMode ? 'V1' : 'V1.0') : (createVersion ? nextVersion(current) : current);
    document.getElementById('currentVersion').textContent = version;
    var savedAt = new Date().toLocaleString('sv-SE').slice(0,16);
    var historyItem = { version: version, time: savedAt, editor: '王志强', fields: fields.length, materials: materials.length, change: '', fieldDetails: JSON.parse(JSON.stringify(fields)), pageDetails: JSON.parse(JSON.stringify(pages)), materialDetails:JSON.parse(JSON.stringify(materials)), entranceDetails:JSON.parse(JSON.stringify(entrances)) };
    if (createVersion || !histories.length) histories.unshift(historyItem); else histories[0] = historyItem;
    var session = window.pbsGetSession ? window.pbsGetSession() : { org: 'PBS留学总部' };
    var versions = existing && Array.isArray(existing.versions) ? existing.versions.slice() : histories.slice(1).map(function (item) {
      return { version: centerMode ? item.version : String(item.version).toLowerCase(), fields: item.fields, materials: item.materials, updated: item.time.slice(0, 10), fieldDetails:item.fieldDetails, pageDetails:item.pageDetails, materialDetails:item.materialDetails, entranceDetails:item.entranceDetails };
    });
    if (existing && existing.sourceTemplateId && versions[0]) versions[0] = Object.assign({},versions[0],{sourceTemplateId:existing.sourceTemplateId,sourceOrg:existing.sourceOrg,sourceTemplateVersion:existing.sourceTemplateVersion});
    var versionPayload = {
      version: centerMode ? version : version.toLowerCase(),
      fields: fields.length,
      materials: materials.length,
      updated: new Date().toISOString().slice(0, 10),
      savedAt:savedAt,
      review: '请按当前申请季复核官网字段与材料要求。',
      fieldDetails: fields,
      materialDetails: materials,
      pageDetails: pages,
      entranceDetails:entrances
    };
    if (existing && versions.length && !createVersion) versions[0] = versionPayload; else versions.unshift(versionPayload);
    stored = stored.filter(function (item) { return Number(item.id) !== Number(savedTemplateId); });
    stored.push({ id: savedTemplateId, updatedAt:new Date().toISOString(), name: name, school: school, college: college, boundPrograms: boundPrograms, program: boundPrograms[0] || '', region: document.getElementById('templateRegion').value.trim(), applicationUrl:applicationUrl, scannedAt: existing && existing.scannedAt, org: centerMode ? '平台' : existing && existing.org || session.org || 'PBS留学总部', versions: versions, publicationId: existing && existing.publicationId, sourcePlatformTemplateId: existing && existing.sourcePlatformTemplateId, sourceVersion: existing && existing.sourceVersion, sourceTemplateId: !overwriting && existing && existing.sourceTemplateId, sourceOrg: overwriting || published && createVersion ? '平台' : existing && existing.sourceOrg, sourceTemplateVersion:!overwriting && existing && existing.sourceTemplateVersion });
    localStorage.setItem(templateStoreKey, JSON.stringify(stored));
    savedContentSignature = contentSignature();
    var scanButton=document.querySelector('[data-template-scan]');
    if(scanButton){var scanState=pbsTemplateScan.status(savedTemplateId,version);scanButton.textContent=['待扫描','待确认'].includes(scanState)?scanState:'新增扫描任务';}
    if(isNew){params.delete('mode');params.set('id',savedTemplateId);history.replaceState(null,'',location.pathname+'?'+params.toString());isNew=false;document.getElementById('pageTitle').textContent=centerMode?'编辑平台网申模板':'修改网申模板';document.getElementById('breadcrumbMode').textContent='修改模板';}
    showToast(createVersion ? version + ' 已另存为新版本' : version + ' 已保存');
    return true;
  }
  window.saveTemplate = function () { return persistTemplate(false); };
  window.publishCurrentTemplate = function() { function done(){openPublishTemplate(savedTemplateId);} if(persistTemplate(false,false,done))done(); };
  window.getTemplateDraftId = function() { return savedTemplateId; };
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
    document.getElementById('templateUrl').value=isNew?'':currentMeta.applicationUrl || entrances.find(function(entry){return entry.isDefault;}).url;
    document.getElementById('templateRegion').value=isNew?'':currentMeta.region || '';
    renderProgramSelector();
    renderRows();
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('.search-select')) return;
    closeSearchSelectors();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeEntranceManager();
    closeProgramManager();
    closeVersionHistory();
    closeSearchSelectors();
  });
  window.scanTemplatePage = function() {
    if (scanResultsAvailable) { location.reload(); return; }
    if (!centerMode || !pbsTemplatePublishing.isPublisher()) return;
    function done(){var result=pbsTemplateScan.request(savedTemplateId);if(result.error){showToast(result.error);return;}showToast('已加入待扫描任务，请在插件中使用同一账号扫描');var button=document.querySelector('[data-template-scan]');if(button)button.textContent=result.status;}
    if(persistTemplate(false,true,done))done();
  };
  window.addEventListener('storage', function(event) {
    if (!centerMode || event.key !== templateStoreKey) return;
    var template = JSON.parse(event.newValue || '[]').find(function(item) { return item.id === savedTemplateId; });
    if (template && template.scannedAt && template.scannedAt !== loadedScanTime) {
      scanResultsAvailable = true;
      var button = document.querySelector('[data-template-scan]'); if (button) button.textContent = '加载扫描结果';
      showToast('插件已保存扫描结果，请点击加载扫描结果');
    }
  });
  initialize();
  savedContentSignature = contentSignature();
  document.addEventListener('DOMContentLoaded',function(){
    if(!centerMode)return;
    if(!pbsTemplatePublishing.isPublisher()){location.replace('网申模板库 - 留学申请管理系统.html');return;}
    document.getElementById('pageTitle').textContent=isNew?'新建平台网申模板':'编辑平台网申模板';
    document.querySelector('.pbs-detail-back').href='网申模板发布中心 - 留学申请管理系统.html';
    document.querySelector('.pbs-detail-topbar__actions').insertAdjacentHTML('afterbegin','<button class="btn" data-template-scan onclick="scanTemplatePage()">新增扫描任务</button>');
    var scanStatus = pbsTemplateScan.status(savedTemplateId);
    if (scanStatus === '待扫描' || scanStatus === '待确认') document.querySelector('[data-template-scan]').textContent = scanStatus;
    document.querySelector('.pbs-detail-topbar__actions').insertAdjacentHTML('beforeend','<button class="btn primary" onclick="publishCurrentTemplate()">发布</button>');
  });
})();
