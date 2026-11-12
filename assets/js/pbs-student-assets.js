(function () {
  'use strict';
  var busy = false, parsing = 0, stateKey, state;
  function toast(message) { if (window.__pbsToast) window.__pbsToast(message); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function empty(value) { return !value || /^(—|-|待补充)$/.test(String(value).trim()); }
  function canEdit() { var profile = pbsStudents.find(window.PBS_STUDENT_ID); return profile && !profile.boundTo && pbsStudents.canEdit(profile.id); }
  function save() { localStorage.setItem(stateKey,JSON.stringify(state)); }
  function element(field) { return document.querySelector(field.selector); }
  function currentValue(field) {
    var profile = pbsStudents.find(window.PBS_STUDENT_ID);
    if (field.section === 'student' || field.section === 'customer') return String((profile[field.section] || {})[field.key] || '');
    var node = element(field);
    if (!node || node.querySelector('input,select,textarea') || node.classList.contains('ai-value-pending')) return field.current;
    var copy = node.cloneNode(true);
    copy.querySelectorAll('button,[data-ai-bar],[data-pa-value]').forEach(function(item) { item.remove(); });
    return copy.textContent.trim();
  }
  function fieldFor(item) {
    var node = document.querySelector(item.sel); if (!node) return null;
    var section = node.closest('section[data-section]'), record = node.closest('[data-audit-record],[data-record-key]');
    var key = item.key || node.dataset.v || node.id.replace(/^profile-(student|customer)-/,'');
    var module = item.section || (section && section.dataset.section) || (node.id.indexOf('profile-customer-') === 0 ? 'customer' : 'student');
    var id = module + ':' + key + ':' + (record && (record.dataset.auditRecord || record.dataset.recordKey) || '');
    var field = state.fields.find(function(row) { return row.id === id; });
    if (!field) {
      field = {id:id,key:key,section:module,label:item.label || key,selector:item.sel,current:'',candidates:[],resolved:false};
      field.current = currentValue(field); state.fields.push(field);
    }
    return field;
  }
  function addCandidate(field,id,name,value) {
    if (empty(value)) return;
    value = String(value).trim();
    var prior = field.candidates.find(function(item) { return item.fileId === id; });
    if (!prior || prior.value !== value) {
      if (prior) { prior.value = value; prior.fileName = name; }
      else field.candidates.push({fileId:id,fileName:name,value:value});
      field.resolved = false; delete field.selected;
    }
  }
  function choices(field) {
    var result = [], current = currentValue(field);
    if (!empty(current)) result.push({value:current,sources:['当前档案']});
    field.candidates.forEach(function(item) {
      var row = result.find(function(option) { return option.value === item.value; });
      if (!row) { row = {value:item.value,sources:[]}; result.push(row); }
      if (row.sources.indexOf(item.fileName) < 0) row.sources.push(item.fileName);
    });
    return result;
  }
  function pending() { return state.fields.filter(function(field) { return !field.resolved && choices(field).length > 1; }); }
  function unsaved() {
    return !!document.querySelector('#profileEditModal,[data-sub-editing="1"],#sections button[onclick^="saveFieldEdit("],#sections button[onclick^="saveRecord("],#sections button[onclick^="saveAccountRow("],#sections button[onclick^="saveAddField("]');
  }
  function importConflicts() {
    var changed = false;
    document.querySelectorAll('[data-pa-value]').forEach(function(node) {
      var section = node.closest('section[data-section]'), cell = node.parentElement;
      var target = Array.from(cell.querySelectorAll('[data-v]')).find(function(item) { return item.dataset.v === node.dataset.paKey; });
      if (!section || !target) return;
      var record = target.closest('[data-audit-record],[data-record-key]'), selector = '#secbody-' + section.dataset.section;
      if (record) selector += record.dataset.auditRecord ? ' [data-audit-record="' + record.dataset.auditRecord + '"]' : ' [data-record-key="' + record.dataset.recordKey + '"]';
      selector += ' [data-v="' + target.dataset.v + '"]';
      var span = node.querySelector('span'), label = span && span.firstChild ? span.firstChild.textContent.replace(/解析值[：:]\s*$/,'') : target.dataset.v;
      var field = fieldFor({sel:selector,key:target.dataset.v,section:section.dataset.section,label:label});
      var id = 'import:' + node.dataset.paValue;
      if (!field.candidates.some(function(item) { return item.fileId === id; })) { addCandidate(field,id,node.dataset.aiSrc || '选校资料',node.dataset.paValue); changed = true; }
    });
    if (changed) save();
  }
  function syncConfirm() {
    if (!state) return;
    importConflicts();
    var button = document.getElementById('assetParseConfirm');
    if (button) button.hidden = !canEdit() || busy || parsing > 0 || !!window.parseTimer || !pending().length;
  }
  function collectResults(original,fileId,fileName) {
    var items = window.PARSE_RESULTS[fileId] || [], allowed = [];
    items.forEach(function(item) {
      var field = fieldFor(item); if (!field) return;
      addCandidate(field,fileId,fileName,item.value);
      var node = element(field), conflict = !field.resolved && choices(field).length > 1;
      if (conflict && node.classList.contains('ai-value-pending') && !node.querySelector('input,select,textarea')) {
        var cell = node.closest('[data-f]') || node.parentElement, bar = cell.querySelector('[data-ai-bar]');
        node.textContent = field.current || '—'; node.classList.remove('ai-value-pending'); cell.classList.remove('ai-pending'); if (bar) bar.remove();
      }
      if (!conflict && !node.querySelector('input,select,textarea')) allowed.push(item);
    });
    save();
    window.PARSE_RESULTS[fileId] = allowed;
    try { return original(fileId,fileName) + pending().length; }
    finally { window.PARSE_RESULTS[fileId] = items; }
  }
  async function parseAll() {
    if (!canEdit() || busy || parsing) return;
    var buttons = Array.from(document.querySelectorAll('#asset-file-list button[title="AI 解析"]')).filter(function(button) { return !button.hidden; });
    if (!buttons.length) { toast('请先上传文件'); return; }
    var action = document.getElementById('assetParseAll'), label = action.querySelector('span');
    busy = true; syncConfirm();
    buttons.concat([action]).forEach(function(button) { button.disabled = true; });
    try {
      for (var i = 0; i < buttons.length; i++) { label.textContent = '解析中 ' + (i + 1) + '/' + buttons.length; await window.parseFile(buttons[i]); }
      toast(pending().length ? '解析完成，有 ' + pending().length + ' 项冲突待确认' : '解析完成');
    } finally {
      busy = false; label.textContent = '一键解析'; buttons.concat([action]).forEach(function(button) { button.disabled = false; });
      syncConfirm(); if (pending().length) review();
    }
  }
  function applyChoices(fields,dialog) {
    var warning = dialog.querySelector('[data-unsaved]');
    if (unsaved()) { warning.hidden = false; return; }
    var sections = {}, profile = pbsStudents.find(window.PBS_STUDENT_ID), cards = {};
    for (var i = 0; i < fields.length; i++) {
      var selected = dialog.querySelector('input[name="asset-conflict-' + i + '"]:checked');
      if (!selected) { warning.hidden = false; warning.textContent = '请选择“' + fields[i].label + '”采用的内容'; return; }
    }
    fields.forEach(function(field,index) {
      var value = dialog.querySelector('input[name="asset-conflict-' + index + '"]:checked').value, node = element(field);
      if (field.section === 'student' || field.section === 'customer') {
        var card = cards[field.section] || (cards[field.section] = Object.assign({},profile[field.section])); card[field.key] = value;
        if (field.key === 'idcard') card.documents = [{type:(card.documents || [])[0] && card.documents[0].type || '居民身份证',number:value}];
      } else if (node) { node.textContent = value; sections[field.section] = true; }
      if (node) {
        var cell = node.closest('[data-f]') || node.parentElement;
        node.classList.remove('ai-value-pending'); cell.classList.remove('ai-pending');
        cell.querySelectorAll('[data-ai-bar],[data-pa-value]').forEach(function(item) { if (!item.dataset.paKey || item.dataset.paKey === field.key) item.remove(); });
      }
      field.resolved = true; field.selected = value;
    });
    Object.keys(cards).forEach(function(type) {
      pbsStudents.commit(profile.id,type,cards[type],{name:'学生姓名'},'确认文件解析冲突');
      if (window.pbsApplyProfileValues) pbsApplyProfileValues(type,cards[type]);
    });
    Object.keys(sections).forEach(function(section) { pbsCommitStudentSection(section,'确认文件解析冲突'); });
    save(); dialog.close(); syncConfirm(); toast('冲突已确认');
  }
  function review() {
    if (!canEdit() || busy || parsing || window.parseTimer) return;
    importConflicts(); var fields = pending(); if (!fields.length) { syncConfirm(); return; }
    var existing = document.querySelector('.pbs-asset-review'); if (existing && existing.open) return;
    var dialog = document.createElement('dialog'); dialog.className = 'pbs-asset-review'; dialog.setAttribute('aria-labelledby','assetReviewTitle');
    var names = {student:'学生信息',customer:'客户信息',edu:'教育背景',lang:'语言成绩',score:'学业信息',qual:'专业资质',work:'工作经历',practice:'实践经历',honor:'荣誉奖项',pub:'学术发表'};
    dialog.innerHTML = '<div class="pbs-asset-review-panel"><header><div><h2 id="assetReviewTitle">冲突确认</h2><p>按文件来源核对并选择字段内容。</p></div><button type="button" data-close aria-label="关闭">×</button></header><div class="pbs-asset-review-body"><p class="pbs-asset-conflict-warning" data-unsaved role="alert"' + (unsaved() ? '' : ' hidden') + '>存在未保存的板块，请先保存或取消编辑，再确认冲突。</p>' + fields.map(function(field,index) {
      var current = currentValue(field), selected = field.selected === undefined ? current : field.selected;
      return '<fieldset class="pbs-asset-conflict-field"><legend>' + esc(field.label) + '<small>' + esc(names[field.section] || '档案信息') + '</small></legend>' + choices(field).map(function(option) {
        return '<label class="pbs-asset-conflict-choice"><input type="radio" name="asset-conflict-' + index + '" value="' + esc(option.value) + '"' + (selected === option.value ? ' checked' : '') + '><span><strong>' + esc(option.value) + '</strong><small>' + esc(option.sources.join(' · ')) + '</small></span></label>';
      }).join('') + '</fieldset>';
    }).join('') + '</div><footer><button type="button" data-close class="pbs-asset-button">稍后处理</button><button type="button" data-confirm class="pbs-asset-button pbs-asset-upload"' + (unsaved() ? ' disabled' : '') + '>确认冲突</button></footer></div>';
    dialog.querySelectorAll('[data-close]').forEach(function(button) { button.onclick = function() { dialog.close(); }; });
    dialog.onchange = function(event) { var index = Number(event.target.name.replace('asset-conflict-','')); fields[index].selected = event.target.value; save(); };
    dialog.querySelector('[data-confirm]').onclick = function() { applyChoices(fields,dialog); };
    dialog.addEventListener('click',function(event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close',function() { dialog.remove(); });
    document.body.appendChild(dialog); dialog.showModal();
  }
  async function seedDemo() {
    var profile = pbsStudents.find(window.PBS_STUDENT_ID), key = 'pbs_asset_conflict_demo_' + profile.id;
    if (profile.name !== '张明' || profile.kind === 'preliminary' || localStorage.getItem(key)) return;
    var files = [['idcard','身份证信息.txt','张明'],['passport','护照信息.txt','张铭']].map(function(item) {
      return {id:'conflict-demo-' + profile.id + '-' + item[0],owner:profile.id,name:item[1],category:'身份资料',size:'1 KB',date:'2026-11-12',file:new Blob(['姓名：' + item[2]],{type:'text/plain;charset=utf-8'}),parseFields:[{sel:'#profile-student-name',key:'name',section:'student',label:'学生姓名',value:item[2]}]};
    });
    await pbsAddStudentAssetFiles(files); localStorage.setItem(key,'1');
  }
  function init() {
    if (!document.getElementById('sec-asset')) return;
    stateKey = 'pbs_asset_parse_conflicts_' + window.PBS_STUDENT_ID;
    try { state = JSON.parse(localStorage.getItem(stateKey)) || {fields:[]}; } catch(e) { state = {fields:[]}; }
    if (!canEdit()) document.querySelectorAll('#assetParseConfirm,#assetParseAll').forEach(function(button) { button.hidden = true; });
    var apply = window.applyParseResult;
    if (apply) window.applyParseResult = function(id,name) { return collectResults(apply,id,name); };
    var parse = window.parseFile;
    if (parse) window.parseFile = async function() {
      parsing++; syncConfirm();
      try { return await parse.apply(this,arguments); }
      finally { parsing--; syncConfirm(); if (!busy && pending().length) review(); }
    };
    new MutationObserver(syncConfirm).observe(document.querySelector('main') || document.body,{childList:true,subtree:true});
    syncConfirm(); seedDemo().catch(function() { toast('演示文件读取失败，请刷新重试'); });
  }
  window.pbsAssetActions = {parseAll:parseAll,review:review};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
