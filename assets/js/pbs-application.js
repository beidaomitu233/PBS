(function () {
  'use strict';
  var accountKey = 'pbs_application_account_cmu', accountsKey = 'pbs_application_accounts_cmu';
  var accounts = [], editingAccounts = false, templateScope = 'school', archiveValues = {};
  function fieldKey(value) { return String(value || '').toLowerCase().replace(/[\s（）()\-_/]/g,''); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  var accountFields = [
    ['level','申请层次'],['school','申请学校'],['program','申请专业'],['url','申请官网 URL'],['account','申请账号'],['password','申请密码'],['emailUrl','邮箱 URL'],['email','邮箱账号'],['authCode','邮箱授权码']
  ];
  function readAccounts() {
    accounts = Array.from(document.querySelectorAll('#sec-account tbody tr')).map(function(row) {
      var record = { bound:row.dataset.bound === 'true' };
      accountFields.forEach(function(field,index) {
        var cell = row.cells[index], value = cell.querySelector('.ns-editable'), link = cell.querySelector('a');
        record[field[0]] = value && value.dataset.full || (link ? link.getAttribute('href') : cell.textContent.trim().replace('＋ 去补充',''));
        if (record[field[0]] === '—') record[field[0]] = '';
      }); return record;
    });
    try {
      var saved = JSON.parse(localStorage.getItem(accountsKey));
      if (Array.isArray(saved) && saved.length) accounts = saved;
      else { var old = JSON.parse(localStorage.getItem(accountKey)); if (old && accounts[0]) Object.assign(accounts[0],old); }
    } catch(e) {}
    renderAccounts();
  }
  function renderAccounts() {
    var canEdit = window.pbsHasPermission('app_fill');
    document.querySelector('#sec-account tbody').innerHTML = accounts.map(function(record,index) {
      return '<tr' + (index === 0 ? ' id="accRowCurrent" class="ns-acc-row--current"' : '') + ' data-bound="' + record.bound + '">' + accountFields.map(function(field) {
        var key = field[0], value = record[key] || '', secret = key === 'password' || key === 'authCode', link = key === 'url' || key === 'emailUrl';
        var content = editingAccounts ? '<input data-account-row="' + index + '" data-account-field="' + key + '" aria-label="' + esc(record.school + ' · ' + field[1]) + '" type="' + (secret ? 'password' : link ? 'url' : key === 'email' ? 'email' : 'text') + '" value="' + esc(value) + '" autocomplete="off">' : link && /^https?:\/\//i.test(value) ? '<a class="ns-acc-link" href="' + esc(value) + '" target="_blank" rel="noopener">' + esc(value.replace(/\/$/,'')) + ' ↗</a>' : esc(value ? secret ? '••••••••' : value : '—');
        return '<td>' + content + '</td>';
      }).join('') + '</tr>';
    }).join('');
    document.getElementById('applicationAccountsEdit').hidden = editingAccounts || !canEdit;
    document.getElementById('applicationAccountsSave').hidden = !editingAccounts;
    document.getElementById('applicationAccountsCancel').hidden = !editingAccounts;
    document.querySelector('#sec-account table').classList.toggle('is-editing',editingAccounts);
  }
  function editAccount() {
    if (!window.pbsHasPermission('app_fill')) return;
    editingAccounts = true; renderAccounts(); document.querySelector('[data-account-field]').focus();
  }
  function cancelAccount() { editingAccounts = false; renderAccounts(); }
  function persistAccounts() {
    localStorage.setItem(accountsKey,JSON.stringify(accounts));
    localStorage.setItem(accountKey,JSON.stringify(accounts[0]));
  }
  function saveAccount() {
    if (!window.pbsHasPermission('app_fill')) return;
    var inputs = Array.from(document.querySelectorAll('[data-account-field]')), invalid = inputs.find(function(input) { return !input.checkValidity(); });
    if (invalid) { invalid.reportValidity(); return; }
    inputs.forEach(function(input) { accounts[Number(input.dataset.accountRow)][input.dataset.accountField] = input.value.trim(); });
    persistAccounts(); editingAccounts = false; renderAccounts(); nsToast('账号信息已保存','success');
  }
  async function saveResult(result,file) {
    if (!window.pbsHasPermission('app_submit')) return;
    var image = file && /^image\//.test(file.type) ? await new Promise(function(resolve,reject) { var reader = new FileReader(); reader.onload = function() { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(file); }) : '';
    if (image) localStorage.setItem('pbs_offer_image_cmu',image);
    var params = new URLSearchParams(location.search), project = window.pbsProjects.find(params.get('project'));
    if (project) {
      var goalId = params.get('school') || (project.packages.length === 1 ? project.packages[0].id : '');
      if (goalId) { var results = Object.assign({},project.goalResults || {}); results[goalId] = {result:result,image:image,note:document.getElementById('resultRemark').value.trim(),fileName:file ? file.name : ''}; window.pbsProjects.update(project.projectNo,{goalResults:results}); }
    }
  }
  window.renderApplicationTimeline = function() {
    function dateValue(node) {
      var date = String(node.date || '').match(/(\d{4})[-/年](\d{1,2})(?:[-/月](\d{1,2}))?/);
      return date ? Date.UTC(Number(date[1]),Number(date[2]) - 1,Number(date[3] || 1)) : Infinity;
    }
    timelineNodes.sort(function(a,b) { return dateValue(a) - dateValue(b) || 0; });
    var first = timelineNodes.findIndex(function(node) { return !node.completed; });
    var today = new Date(); today.setHours(0,0,0,0);
    document.getElementById('nsTimeline').innerHTML = timelineNodes.map(function(node,index) {
      var internal = node.type === 'ddl';
      var days = /^\d{4}-\d{2}-\d{2}$/.test(node.date) ? Math.ceil((new Date(node.date + 'T00:00:00') - today) / 86400000) : null;
      var countdown = !node.completed && days !== null ? '<span class="ns-tl-countdown">' + (days > 0 ? '剩 ' + days + ' 天' : days === 0 ? '今天截止' : '已过 ' + Math.abs(days) + ' 天') + '</span>' : '';
      return '<article class="ns-tl-item' + (internal ? ' is-internal' : '') + '"><button data-pbs-permission="app_fill" class="ns-tl-dot' + (node.completed ? ' is-done' : index === first ? ' is-current' : '') + '" data-dom-id="timeline-node-' + (index + 1) + '" onclick="toggleNsNode(' + (index + 1) + ')" aria-label="切换' + esc(node.name) + '完成状态">' + (node.completed ? '✓' : index + 1) + '</button><div class="ns-tl-layout"><div class="ns-tl-description"><h3 class="ns-tl-name">' + esc(node.name) + '</h3><p class="application-timeline-note">' + esc((node.note || '').replace(/^(?:内部节点|EV 节点)：/,'')) + '</p></div><div class="ns-tl-meta"><span class="ns-tl-date">' + esc(node.date || '—') + '</span><div class="ns-tl-progress">' + countdown + '<span data-node-status>' + (node.completed ? '已完成' : index === first ? '进行中' : '待开始') + '</span></div></div></div></article>';
    }).join('');
    localStorage.setItem('pbs_application_timeline_cmu',JSON.stringify(timelineNodes));
  };
  function stats() {
    var groups = document.querySelectorAll('.website-form-group'), all = document.querySelectorAll('[data-wf-label]'), filled = 0, missing = 0;
    all.forEach(function (input) { if (String(input.value || '').trim()) filled++; else if (input.hasAttribute('data-wf-required')) missing++; });
    var host = document.getElementById('applicationFormStats');
    if (host) host.innerHTML = '<span>页面<strong>' + groups.length + '</strong></span><span>字段<strong>' + all.length + '</strong></span><span>已填<strong>' + filled + '</strong></span><span>必填待完善<strong>' + missing + '</strong></span>';
    groups.forEach(function (group) {
      var inputs = Array.from(group.querySelectorAll('[data-wf-label]')); var count = inputs.filter(function (input) { return String(input.value || '').trim(); }).length;
      var meta = group.querySelector('.website-form-group__meta'); if (meta) meta.textContent = inputs.length + ' 个字段 · 已填 ' + count;
    });
  }
  function adopt(input, value) { input.value = value; clearWebsiteFieldError(input); input.dispatchEvent(new Event('change', { bubbles:true })); updateWebsiteFormSaveState('有未保存的填写内容'); stats(); }
  function enhanceFields() {
    document.querySelectorAll('.website-form-group').forEach(function (group, groupIndex) {
      var existing = group.querySelector('.application-adopt'); if (existing) existing.remove();
      var suggestions = [];
      group.querySelectorAll('.website-form-field').forEach(function (field, index) {
        var input = field.querySelector('[data-wf-label]'); if (!input) return;
        if (!input.id) input.id = 'wf-page-' + groupIndex + '-field-' + index;
        var label = field.querySelector('label'); if (label) { label.htmlFor = input.id; if (!label.querySelector('.application-field-number')) label.insertAdjacentHTML('afterbegin', '<span class="application-field-number">' + (index + 1) + '</span>'); }
        input.setAttribute('aria-label', input.getAttribute('data-wf-label'));
        if (!input.dataset.enhanced) {
          input.dataset.enhanced = '1';
          input.addEventListener('input', function () { clearWebsiteFieldError(input); updateWebsiteFormSaveState('有未保存的填写内容'); stats(); });
          input.addEventListener('change', function() { clearWebsiteFieldError(input); stats(); });
          if (input.tagName === 'SELECT') {
            var option = document.createElement('option'); option.value = '__manual__'; option.textContent = '手动输入其他选项'; input.appendChild(option);
            var manual = document.createElement('input'); manual.type = 'text'; manual.className = 'application-manual'; manual.placeholder = '请输入官网选项'; manual.hidden = true; manual.setAttribute('aria-label', input.getAttribute('data-wf-label') + '其他选项'); field.insertBefore(manual, input.nextSibling);
            manual.oninput = function () { var current = input.querySelector('[data-custom-option]'); if (!current) { current = document.createElement('option'); current.dataset.customOption = '1'; input.insertBefore(current, option); } current.value = manual.value; current.textContent = manual.value || '自定义选项'; input.value = manual.value; clearWebsiteFieldError(input); updateWebsiteFormSaveState('有未保存的填写内容'); stats(); };
            input.addEventListener('change', function () { manual.hidden = input.value !== '__manual__' && !input.options[input.selectedIndex].hasAttribute('data-custom-option'); if (input.value === '__manual__') { input.value = ''; manual.hidden = false; manual.focus(); } });
          }
        }
        var suggested = input.dataset.archiveValue || ''; if (!suggested) return;
        suggestions.push({ input:input, value:suggested });
        if (!field.querySelector('.application-archive')) {
          var archive = document.createElement('div'); archive.className = 'application-archive'; archive.innerHTML = '<span>档案建议：' + esc(suggested) + '</span><button type="button">采用</button>'; archive.querySelector('button').onclick = function () { adopt(input, suggested); }; field.appendChild(archive);
        }
      });
      if (suggestions.length) { var button = document.createElement('button'); button.type = 'button'; button.className = 'application-adopt'; button.textContent = '采用本页档案建议'; button.onclick = function () { suggestions.forEach(function (item) { adopt(item.input, item.value); }); }; group.appendChild(button); }
    });
    stats();
  }
  function fieldMarkup(field, id, previous) {
    var name = field.name || '', type = field.type || '文本', required = !!field.required;
    var data = ' id="' + esc(id) + '" data-wf-label="' + esc(name) + '"' + (required ? ' data-wf-required' : '');
    var value = previous[id] || '', options = Array.isArray(field.options) ? field.options : String(field.options || '').split(/\n|[，,]/).filter(Boolean), control;
    if (type === '多行文本' || type === '文本域') control = '<textarea' + data + '>' + esc(value) + '</textarea>';
    else if (type === '下拉' && options.length) control = '<select' + data + '><option value="">请选择</option>' + options.map(function (option) { return '<option' + (value === option ? ' selected' : '') + '>' + esc(option) + '</option>'; }).join('') + '</select>';
    else if (type === '文件') control = '<input type="hidden"' + data + ' value="' + esc(value) + '"><input type="file" class="application-field-file" aria-label="' + esc(name) + '"><span class="text-xs text-gray-400 application-file-name">' + esc(value) + '</span>';
    else if ((type === '单选' || type === '勾选') && options.length) {
      control = '<input type="hidden"' + data + ' value="' + esc(value) + '"><div class="application-options">' + options.map(function (option) { return '<label><input type="' + (type === '单选' ? 'radio' : 'checkbox') + '" name="' + esc(id) + '" value="' + esc(option) + '"' + (value.split('、').indexOf(option) >= 0 ? ' checked' : '') + '>' + esc(option) + '</label>'; }).join('') + '</div>';
    } else { var inputType = { '邮箱':'email', '日期':'date', '数字':'number', '电话':'tel' }[type] || 'text'; control = '<input type="' + inputType + '"' + data + ' value="' + esc(value) + '"' + ((type === '下拉' || type === '单选' || type === '勾选') && !options.length ? ' placeholder="填写官网选项"' : '') + '>'; }
    return '<div class="website-form-field' + ((type === '多行文本' || type === '文本域') ? ' website-form-field--wide' : '') + '" data-advice="' + esc(field.note || field.description || '') + '"><label>' + esc(name) + (required ? '<span class="text-red-500"> *</span>' : '') + '</label>' + control.replace(' data-wf-label=', ' data-archive-value="' + esc(archiveValues[fieldKey(name)] || '') + '" data-wf-label=') + '</div>';
  }
  function applyTemplate(template, version) {
    if (!Array.isArray(version.fieldDetails) || !version.fieldDetails.length) { alert('该版本未保存字段内容，请先在模板库补充并保存'); return false; }
    var previous = {}; document.querySelectorAll('[data-wf-label]').forEach(function (input) { previous[input.id] = input.value; });
    var fields = version.fieldDetails.filter(function (field) { return !field.programScope || field.programScope === 'common' || field.programScope === CURRENT_APPLICATION_PROGRAM; });
    var pages = version.pageDetails || [{ id:'page-1', name:'申请信息' }];
    var groups = pages.map(function (page, index) { var list = fields.filter(function (field) { return (field.pageId || pages[0].id) === page.id; }); if (!list.length) return ''; return '<details class="website-form-group"' + (index === 0 ? ' open' : '') + '><summary><span class="website-form-group__name"><span class="website-form-group__index">' + (index + 1) + '</span>' + esc(page.name) + '<span class="website-form-group__meta"></span></span><span>⌄</span></summary><div class="website-form-fields">' + list.map(function (field, fieldIndex) { return fieldMarkup(field, 'wf-template-' + template.id + '-' + (field.id || page.id + '-' + fieldIndex), previous); }).join('') + '</div></details>'; }).join('');
    if (!groups) { alert('该模板没有当前专业适用的字段'); return false; }
    document.querySelector('.website-form-groups').innerHTML = groups;
    document.querySelectorAll('.application-options').forEach(function (host) { host.onchange = function () { var value = Array.from(host.querySelectorAll('input:checked')).map(function (input) { return input.value; }).join('、'); host.previousElementSibling.value = value; host.previousElementSibling.dispatchEvent(new Event('input', {bubbles:true})); }; });
    document.querySelectorAll('.application-field-file').forEach(function(input){ input.onchange = function(){ var file = input.files[0]; input.previousElementSibling.value = file ? file.name : ''; input.nextElementSibling.textContent = file ? file.name : ''; input.previousElementSibling.dispatchEvent(new Event('input',{bubbles:true})); }; });
    document.getElementById('templateFieldSummary').innerHTML = '<span><strong>' + esc(template.name) + '</strong>　' + esc(version.version) + '</span><span>' + esc(template.school + ' · ' + template.college) + '</span>';
    if (Array.isArray(version.materialDetails)) {
      var target = document.getElementById('materialListScanned');
      if (target) { target.innerHTML = version.materialDetails.map(function (item, index) { return '<article class="application-template-material" style="padding:16px 0;border-bottom:1px solid #edf0f4"><div style="display:flex;align-items:center;justify-content:space-between;gap:16px"><strong style="font-size:14px">' + esc(item.name) + '</strong><label style="cursor:pointer;color:#2563eb;font-size:13px"><span>上传</span><input type="file" hidden data-template-material="' + index + '"></label></div><p style="margin:8px 0;color:#64748b;font-size:12px">' + esc(item.note) + '</p><div class="application-material-preview"></div></article>'; }).join('') || '<p class="text-sm text-gray-400 py-6">暂无材料要求</p>'; target.querySelectorAll('input[type=file]').forEach(function (input) { input.onchange = function () { var file = input.files[0]; if (!file) return; var preview = input.closest('article').querySelector('.application-material-preview'); if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url); var url = URL.createObjectURL(file); preview.dataset.url = url; preview.innerHTML = '<a href="' + url + '" target="_blank" rel="noopener" class="text-sm text-blue-600">' + esc(file.name) + ' · 预览</a>'; input.previousElementSibling.textContent = '已上传 · 替换'; }; }); target.classList.remove('hidden'); }
      var pending = document.getElementById('materialListPending'); if (pending) pending.classList.add('hidden');
      var badge = document.getElementById('scanStateBadge'); if (badge) badge.textContent = version.materialDetails.length + ' 项材料';
    }
    localStorage.setItem('pbs_application_template_cmu', JSON.stringify({ template:{id:template.id,name:template.name,school:template.school,college:template.college}, version:version }));
    var applied = document.getElementById('formAppliedWrap'), empty = document.getElementById('formEmptyState');
    if (applied) applied.classList.remove('hidden'); if (empty) empty.classList.add('hidden');
    var materialsEmpty = document.getElementById('materialsEmptyState'), progress = document.getElementById('materialProgressWrap');
    if (materialsEmpty) materialsEmpty.classList.add('hidden'); if (progress) progress.classList.add('hidden');
    enhanceFields(); updateWebsiteFormSaveState('模板已复用，尚未保存'); return true;
  }
  function initialize() {
    var host = document.createElement('div'); host.id = 'applicationFormStats'; host.className = 'application-form-stats'; document.querySelector('.website-form-groups').before(host);
    var summaryCount = document.querySelector('#templateFieldSummary>span:last-child'); if (summaryCount) summaryCount.textContent = '';
    var aliases = {'wf-firstName':['First Name','Legal First(Given)'], 'wf-lastName':['Last Name','Legal Last(Family)'], 'wf-birthDate':['Date of Birth'], 'wf-citizenship':['Citizenship'], 'wf-email':['Email'], 'wf-phone':['Phone'], 'wf-undergrad':['Undergraduate School'], 'wf-major':['Major'], 'wf-gpa':['GPA']};
    document.querySelectorAll('[data-wf-label]').forEach(function (input) {
      var value = input.defaultValue || ''; if (input.tagName === 'SELECT') { var option = Array.from(input.options).find(function(option){return option.defaultSelected;}); value = option ? option.value : ''; }
      if (!value) return; input.dataset.archiveValue = value; archiveValues[fieldKey(input.getAttribute('data-wf-label'))] = value;
      (aliases[input.id] || []).forEach(function(name){archiveValues[fieldKey(name)] = value;});
    });
    enhanceFields();
    var definitions = [], pages = [];
    document.querySelectorAll('.website-form-group').forEach(function (group, index) { var id = 'page-' + index; pages.push({ id:id, name:group.querySelector('.website-form-group__name').childNodes[1].textContent.trim() }); group.querySelectorAll('[data-wf-label]').forEach(function (input) { var type = input.tagName === 'SELECT' ? '下拉' : input.tagName === 'TEXTAREA' ? '多行文本' : ({date:'日期',email:'邮箱',tel:'电话',number:'数字'}[input.type] || '文本'); definitions.push({ name:input.getAttribute('data-wf-label'), type:type, required:input.hasAttribute('data-wf-required'), note:input.closest('.website-form-field').dataset.advice, pageId:id, options:input.tagName === 'SELECT' ? Array.from(input.options).filter(function (option) { return option.value !== '__manual__'; }).map(function (option) { return option.value; }) : [] }); }); });
    var materialDefinitions = Array.from(document.querySelectorAll('#materialListScanned .material-item')).map(function(row){return {name:row.querySelector('h3').childNodes[0].textContent.trim(),note:row.querySelector('p') ? row.querySelector('p').textContent.trim() : '',required:true};});
    TEMPLATE_REUSE_OPTIONS.forEach(function (template) { template.versions.forEach(function (version) { if (!version.fieldDetails) { version.fieldDetails = Number(template.id) === 1 ? definitions : definitions.slice(0,5); version.pageDetails = Number(template.id) === 1 ? pages : pages.slice(0,1); version.fields = version.fieldDetails.length; } if (!version.materialDetails) { version.materialDetails = materialDefinitions; version.materials = materialDefinitions.length; } }); });
    try { var reused = JSON.parse(localStorage.getItem('pbs_application_template_cmu')); if (reused && reused.version) { applyTemplate(reused.template,reused.version); restoreWebsiteForm(); document.querySelectorAll('.application-options input').forEach(function(input){ input.checked = input.closest('.application-options').previousElementSibling.value.split('、').indexOf(input.value) >= 0; }); stats(); } } catch (error) {}
    var search = document.getElementById('templateReuseSearch'); var scopes = document.createElement('div'); scopes.className = 'application-template-scope'; scopes.innerHTML = '<button type="button" aria-pressed="true">本校模板</button><button type="button" aria-pressed="false">全部院校</button>'; search.before(scopes); scopes.querySelectorAll('button').forEach(function (button,index) { button.onclick = function () { templateScope = index ? 'all' : 'school'; scopes.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); }); renderTemplateReuseOptions(); }; });
    readAccounts();
  }
  window.pbsApplication = { editAccount:editAccount, saveAccount:saveAccount, cancelAccount:cancelAccount, saveResult:saveResult, applyTemplate:applyTemplate, matchesScope:function (template) { return templateScope === 'all' || template.school === CURRENT_APPLICATION_SCHOOL; } };
  document.addEventListener('DOMContentLoaded', initialize);
})();
