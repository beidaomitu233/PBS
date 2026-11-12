(function () {
  'use strict';
  var busy = false;
  function toast(message) { if (window.__pbsToast) window.__pbsToast(message); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function canEdit() {
    var profile = window.pbsStudents && pbsStudents.find(window.PBS_STUDENT_ID);
    return profile && !profile.boundTo && pbsStudents.canEdit(profile.id);
  }
  async function parseAll() {
    if (!canEdit() || busy) return;
    if (window.parseTimer) { toast('正在解析，请稍候'); return; }
    var buttons = Array.from(document.querySelectorAll('#asset-file-list button[title="AI 解析"]')).filter(function(button) { return !button.hidden; });
    if (!buttons.length) { toast('请先上传文件'); return; }
    var action = document.getElementById('assetParseAll'), label = action.querySelector('span'), total = 0;
    busy = true;
    buttons.concat([action,document.getElementById('assetParseConfirm')]).forEach(function(button) { button.disabled = true; });
    try {
      for (var i = 0; i < buttons.length; i++) {
        label.textContent = '解析中 ' + (i + 1) + '/' + buttons.length;
        total += await window.parseFile(buttons[i]) || 0;
      }
      toast(total ? '已解析 ' + buttons.length + ' 个文件，请点击“解析确认”核对结果' : '解析完成，暂无新增字段');
    } finally {
      busy = false; label.textContent = '一键解析';
      buttons.concat([action,document.getElementById('assetParseConfirm')]).forEach(function(button) { button.disabled = false; });
    }
  }
  function review() {
    if (!canEdit() || busy) return;
    if (window.parseTimer) { toast('正在解析，请稍候'); return; }
    var entries = Array.from(document.querySelectorAll('[data-ai-bar], [data-pa-value]')).map(function(node) {
      var isConflict = node.hasAttribute('data-pa-value'), cell = node.parentElement;
      var field = isConflict ? Array.from(cell.querySelectorAll('[data-v]')).find(function(value) { return value.dataset.v === node.dataset.paKey; }) : cell.querySelector('.ai-value-pending');
      var section = node.closest('section[data-section]'), title = section && section.querySelector('h2');
      return {node:node,field:field,conflict:isConflict,section:section && section.dataset.section || 'student',module:title ? title.textContent.trim() : '学生信息',label:isConflict ? node.querySelector('span').firstChild.textContent.replace(/解析值[：:]\s*$/,'') : node.dataset.aiField,current:isConflict && field ? field.textContent.trim() : '—',value:isConflict ? node.dataset.paValue : field && field.textContent.trim(),source:node.dataset.aiSrc || ''};
    }).filter(function(item) { return item.field; });
    var dialog = document.createElement('dialog'); dialog.className = 'pbs-asset-review'; dialog.setAttribute('aria-labelledby','assetReviewTitle');
    dialog.innerHTML = '<div class="pbs-asset-review-panel"><header><h2 id="assetReviewTitle">解析确认</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="pbs-asset-review-body">' + (entries.length ? '<table><thead><tr><th>档案板块</th><th>字段</th><th>当前值</th><th>识别结果</th></tr></thead><tbody>' + entries.map(function(item,index) { return '<tr><td>' + esc(item.module) + '</td><td>' + esc(item.label) + (item.source ? '<small>' + esc(item.source) + '</small>' : '') + '</td><td>' + esc(item.current) + '</td><td><input aria-label="' + esc(item.label) + '" data-result="' + index + '" value="' + esc(item.value) + '"></td></tr>'; }).join('') + '</tbody></table>' : '<p class="pbs-asset-review-empty">暂无待确认的解析结果</p>') + '</div><footer><button type="button" data-close class="pbs-asset-button">' + (entries.length ? '取消' : '关闭') + '</button>' + (entries.length ? '<button type="button" data-confirm class="pbs-asset-button pbs-asset-upload">确认保存</button>' : '') + '</footer></div>';
    dialog.querySelectorAll('[data-close]').forEach(function(button) { button.onclick = function() { dialog.close(); }; });
    var confirm = dialog.querySelector('[data-confirm]');
    if (confirm) confirm.onclick = function() {
      var sections = {}, studentDocument;
      entries.forEach(function(item,index) {
        var value = dialog.querySelector('[data-result="' + index + '"]').value.trim();
        if (item.conflict) {
          item.field.textContent = value || '—'; item.node.remove();
        } else {
          item.field.textContent = value || '—';
          window.aiConfirmField(item.node.querySelector('.ai-confirm'));
        }
        sections[item.section] = true;
        if (item.section === 'student' && item.field.dataset.v === 'idcard') studentDocument = value;
      });
      Object.keys(sections).forEach(function(section) { if (section !== 'student') window.pbsCommitStudentSection(section,'确认文件解析结果'); });
      if (studentDocument !== undefined) {
        var profile = pbsStudents.find(window.PBS_STUDENT_ID), student = Object.assign({},profile.student,{idcard:studentDocument,documents:studentDocument ? [{type:'身份证',number:studentDocument}] : []});
        pbsStudents.commit(profile.id,'student',student,{documents:'身份证件'},'确认文件解析结果');
      }
      dialog.close(); toast('已确认保存 ' + entries.length + ' 项解析结果');
    };
    dialog.addEventListener('click',function(event) { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close',function() { dialog.remove(); });
    document.body.appendChild(dialog); dialog.showModal();
  }
  function init() {
    if (!document.getElementById('sec-asset')) return;
    document.querySelectorAll('.pa-intake').forEach(function(node) { node.remove(); });
    if (!canEdit()) document.querySelectorAll('#assetParseConfirm,#assetParseAll').forEach(function(button) { button.hidden = true; });
  }
  window.pbsAssetActions = {parseAll:parseAll,review:review};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
