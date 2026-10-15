(function () {
  'use strict';
  var project, closureKey, reportsKey, orderMode = false, scopeSchool = '', state = {}, selection = null;
  var defaultLogo = localStorage.getItem('pbs_organization_report_logo') || '';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch(e) { return fallback; } }
  function editor() { return document.getElementById('reportEditor'); }
  function current() { return window.reportStore[window.currentReportId]; }
  function message(text) { document.getElementById('reportEditorState').textContent = text; }
  function canEdit() { return !!(project && project.status !== '已结项' && window.pbsHasPermission('archive_create') && (pbsOrders.canManage(project) || !orderMode && (project.packages || []).some(function(goal) { return (!scopeSchool || goal.id === scopeSchool) && pbsOrders.canHandleGoal(project,goal.id,true); }))); }
  function dirty() { var report = current(); if (report) report.saved = false; message('有未生成的修改'); }
  function setLogo(src) {
    window.reportLogoSrc = src || '';
    editor().querySelectorAll('.report-logo').forEach(function(node) { node.remove(); });
    if (src) editor().insertAdjacentHTML('afterbegin', '<div class="report-logo"><img src="' + esc(src) + '" alt="机构 Logo"></div>');
    document.getElementById('reportLogoState').textContent = src ? '已应用机构 Logo' : '未配置机构 Logo';
  }
  function restoreSelection() {
    editor().focus();
    if (selection && editor().contains(selection.commonAncestorContainer)) { var range = window.getSelection(); range.removeAllRanges(); range.addRange(selection); }
  }
  window.reportFormat = function(command, value) {
    if (!canEdit()) return;
    restoreSelection(); document.execCommand(command, false, value || null); dirty();
  };
  window.insertReportTable = function() {
    var size = prompt('表格行数、列数', '3,3'); if (!size) return;
    var parts = size.split(/[,，]/), rows = Number(parts[0]), cols = Number(parts[1]);
    if (!(rows > 0 && rows <= 20 && cols > 0 && cols <= 10)) return;
    var html = '<table><tbody>';
    for (var i = 0; i < rows; i++) { html += '<tr>'; for (var j = 0; j < cols; j++) html += '<td><br></td>'; html += '</tr>'; }
    window.reportFormat('insertHTML', html + '</tbody></table><p><br></p>');
  };
  window.insertReportLink = function() {
    var url = prompt('链接地址', 'https://'); if (url && /^(https?:\/\/|mailto:)/i.test(url)) window.reportFormat('createLink', url);
  };
  window.generateReport = function(type) {
    if (window.pendingCount > 0 || !canEdit()) return;
    var now = new Date(), id = 'RPT-' + Date.now();
    window.reportLogoSrc = defaultLogo;
    window.reportStore[id] = { id: id, type: type, title: type === 'internal' ? '对内项目管理报告' : '客户项目结项报告', time: window.fmtTime(now), content: window.buildReportHtml(type), saved: false, logo: defaultLogo };
    window.openReportEditor(id);
  };
  window.openReportEditor = function(id) {
    var report = window.reportStore[id]; if (!report) return;
    window.currentReportId = id; selection = null;
    editor().innerHTML = report.content; editor().contentEditable = String(canEdit());
    window.reportLogoSrc = report.logo || defaultLogo;
    document.getElementById('reportModalTitle').textContent = report.title;
    document.getElementById('reportLogoState').textContent = window.reportLogoSrc ? '已应用机构 Logo' : '未配置机构 Logo';
    document.getElementById('reportModal').classList.remove('hidden', 'is-preview');
    document.getElementById('reportPreviewButton').textContent = '预览';
    message(report.saved ? '已生成' : '未生成');
  };
  window.closeReportModal = function() { document.getElementById('reportModal').classList.add('hidden'); };
  window.regenerateReport = function() {
    var report = current(); if (!report || !canEdit()) return;
    editor().innerHTML = window.buildReportHtml(report.type); selection = null; dirty();
  };
  window.saveReport = function() {
    var report = current(); if (!report || !canEdit()) return false;
    report.content = editor().innerHTML; report.logo = window.reportLogoSrc; report.time = window.fmtTime(new Date()); report.saved = true;
    try { localStorage.setItem(reportsKey, JSON.stringify(window.reportStore)); } catch(e) { report.saved = false; message('报告未保存，请缩小上传图片后重试'); return false; }
    window.renderReportList(); message('报告已生成');
    if (window.PBSDelivery && window.projectData.targets.length) window.PBSDelivery.archive({ school: window.projectData.targets[0].school, major: window.projectData.targets[0].major, node: 'closure', name: report.title, contentHtml: report.content || '', fileName: report.title + '.pdf', source: '结项管理', sourceKey: 'report-' + report.id });
    return true;
  };
  window.saveReport.__deliveryWrapped = true;
  window.exportReportPdf = async function(id) {
    if (id && id !== window.currentReportId) window.openReportEditor(id);
    if (canEdit()) { if (!window.saveReport()) return; } else if (!current() || !current().saved) return;
    var report = current(), button = document.getElementById('reportPdfButton');
    button.disabled = true; button.textContent = '正在导出…';
    var paper = editor().cloneNode(true); paper.removeAttribute('id'); paper.removeAttribute('contenteditable'); paper.style.cssText = 'width:186mm;max-width:none;min-height:0;margin:0;padding:0;background:#fff;';
    try {
      await window.html2pdf().set({ margin: 12, filename: report.title + '-' + window.projectData.projectNo + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'h1', 'h2', '.report-logo'] } }).from(paper).save();
      message('PDF 已导出');
    } catch(e) { message('PDF 导出失败，请重试'); }
    finally { button.disabled = false; button.textContent = '生成并导出 PDF'; }
  };
  window.renderReportList = function() {
    var reports = Object.keys(window.reportStore).map(function(id) { return window.reportStore[id]; }).filter(function(report) { return report.saved; });
    document.getElementById('reportListWrap').classList.toggle('hidden', !reports.length);
    document.getElementById('reportList').innerHTML = reports.map(function(report) {
      return '<div class="flex items-center justify-between gap-4 border border-gray-200 rounded-lg p-3"><div><p class="text-sm font-medium text-gray-900">' + esc(report.title) + '</p><p class="text-xs text-gray-400 mt-1">' + esc(report.time) + '</p></div><div class="flex gap-4 text-sm text-blue-600"><button data-report-open="' + esc(report.id) + '">查看 / 编辑</button><button data-report-pdf="' + esc(report.id) + '">导出 PDF</button></div></div>';
    }).join('');
  };
  window.triggerReportLogoUpload = function() { document.getElementById('reportLogoInput').click(); };
  window.handleReportLogoSelect = function(input) {
    var file = input.files[0]; if (!file || !/^image\//.test(file.type)) return;
    var reader = new FileReader(); reader.onload = function() { setLogo(reader.result); dirty(); }; reader.readAsDataURL(file); input.value = '';
  };
  window.restoreReportLogo = function() { setLogo(defaultLogo); dirty(); };
  window.triggerOfferImageUpload = function() { document.getElementById('offerImageInput').click(); };
  window.handleOfferImageSelect = function(input) {
    var file = input.files[0]; if (!file || !/^image\//.test(file.type)) return;
    var reader = new FileReader(); reader.onload = function() { window.reportFormat('insertHTML', '<p><img src="' + esc(reader.result) + '" alt="报告图片"></p>'); }; reader.readAsDataURL(file); input.value = '';
  };
  function safeHtml(html) {
    var parsed = new DOMParser().parseFromString(html, 'text/html');
    parsed.querySelectorAll('script,iframe,object,embed,form,link,meta').forEach(function(node) { node.remove(); });
    parsed.body.querySelectorAll('*').forEach(function(node) { Array.from(node.attributes).forEach(function(attr) { if (/^on/i.test(attr.name) || attr.name === 'srcdoc' || /^(href|src)$/i.test(attr.name) && /^\s*(javascript:|data:text\/html)/i.test(attr.value)) node.removeAttribute(attr.name); }); });
    return parsed.body.innerHTML;
  }
  window.importMotherReport = async function(input) {
    var file = input.files[0]; if (!file || !canEdit()) return;
    try {
      var html;
      if (/\.docx$/i.test(file.name)) html = (await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
      else html = await file.text();
      editor().innerHTML = safeHtml(html); selection = null; dirty();
    } catch(e) { message('母报告读取失败，请选择 Word 或 HTML 文件重试'); }
    input.value = '';
  };
  window.toggleReportPreview = function() {
    var preview = document.getElementById('reportModal').classList.toggle('is-preview');
    editor().contentEditable = String(!preview && canEdit());
    document.getElementById('reportPreviewButton').textContent = preview ? '返回编辑' : '预览';
  };
  window.toggleReportFullscreen = function() { var full = document.getElementById('reportModal').classList.toggle('is-fullscreen'); document.getElementById('reportFullscreenButton').textContent = full ? '退出全屏' : '全屏'; };

  function initialize() {
    var params = new URLSearchParams(location.search), requested = params.get('project');
    project = window.pbsProjects.find(requested || window.projectData.projectNo);
    if (!project && requested) Object.assign(window.projectData, { projectNo: requested, customer: params.get('customer') || window.projectData.customer, student: params.get('student') || window.projectData.student, level: params.get('level') || window.projectData.level });
    if (project) {
      Object.assign(window.projectData, { projectNo: project.projectNo, customer: project.customer, student: project.student, level: project.level });
    }
    var values = [window.projectData.projectNo, window.projectData.customer, window.projectData.student, window.projectData.level];
    document.querySelectorAll('#basic-info .grid > div').forEach(function(node, index) { if (index < 4) node.querySelector('p').textContent = values[index]; });
    document.querySelectorAll('#confirmModal .bg-gray-50 .flex > span:last-child').forEach(function(node, index) { if (index < 3) node.textContent = [values[0], values[1] + ' / ' + values[2], values[3]][index]; });
    scopeSchool = params.get('school') || ''; orderMode = params.get('orderReport') === '1';
    closureKey = 'pbs_closure_' + window.projectData.projectNo + (scopeSchool ? '_' + scopeSchool : ''); reportsKey = 'pbs_closure_reports_' + window.projectData.projectNo + (scopeSchool ? '_' + scopeSchool : '');
    if (orderMode) reportsKey = 'pbs_order_closure_reports_' + pbsOrders.key(project);
    var savedClosure = scopeSchool ? project && (project.goalClosures || {})[scopeSchool] || {} : project || {};
    state = Object.assign({ note: savedClosure.closureNote || '', closedAt: savedClosure.closureAt || '' }, read(closureKey, {})); window.reportStore = read(reportsKey, {});
    if (project && project.packages && project.packages.length) renderTargetResults();
    renderProjectNotes(); restoreClosure(); window.renderReportList();
    var reportId = params.get('report'); if (reportId && window.reportStore[reportId]) window.openReportEditor(reportId);
    editor().addEventListener('input', dirty);
    document.addEventListener('selectionchange', function() { var range = window.getSelection(); if (range.rangeCount && editor().contains(range.anchorNode)) selection = range.getRangeAt(0).cloneRange(); });
    document.querySelectorAll('#reportToolbar [data-command]').forEach(function(button) { button.addEventListener('mousedown', function(event) { event.preventDefault(); }); button.onclick = function() { window.reportFormat(button.dataset.command); }; });
    document.getElementById('reportList').onclick = function(event) { var open = event.target.closest('[data-report-open]'), pdf = event.target.closest('[data-report-pdf]'); if (open) window.openReportEditor(open.dataset.reportOpen); if (pdf) window.exportReportPdf(pdf.dataset.reportPdf); };
  }
  function renderTargetResults() {
    var examples = window.projectData.targets, demo = !project.manualCreated && /^PRJ-[MO]-2607-/.test(project.projectNo);
    var selectedSchool = new URLSearchParams(location.search).get('school');
    var packages = project.packages.filter(function(item) { return (!selectedSchool || item.id === selectedSchool) && (pbsOrders.canManage(project) || pbsOrders.canAssignOwner(project) || pbsOrders.canReadGoal(project,item.id)); });
    if (orderMode && pbsOrders.canView(project)) packages = pbsOrders.members(project).flatMap(function(owner) { return owner.packages.map(function(goal) { return Object.assign({},goal,{sourceProject:owner,sourceGoal:goal.id,id:owner.projectNo + '::' + goal.id}); }); });
    state.confirmed = state.confirmed || {};
    window.projectData.targets = packages.map(function(item, index) {
      var example = demo ? examples[index % examples.length] : null;
      var source = item.sourceProject || project, goalId = item.sourceGoal || item.id;
      var saved = (source.goalResults || {})[goalId] || {};
      var target = { code: item.id || 'SUB' + (index + 1), school: item.school, major: item.major, result: saved.result || item.result || example && example.result || '待录入', note: saved.note || item.resultNote || example && example.note || '—', image: saved.image || '' };
      if (orderMode) state.confirmed[target.code] = source.status === '已结项' || ((source.goalSubmissions || {})[goalId] || {}).status === '已通过';
      if (state.confirmed[target.code] === undefined && example) state.confirmed[target.code] = index !== 1;
      return target;
    });
    var table = document.querySelector('#result-confirm .result-table'), header = table.querySelector('.result-table__head').outerHTML;
    table.innerHTML = header + window.projectData.targets.map(function(target) {
      var done = state.confirmed[target.code], unavailable = target.result === '待录入';
      return '<div class="result-table__row" role="row"><div class="result-target" role="cell"><strong>' + esc(target.school) + '</strong><span class="result-target__major">' + esc(target.major) + '</span></div><div class="result-state ' + (target.result === '录取' ? 'result-state--admitted' : target.result === '拒录' ? 'result-state--rejected' : '') + '" role="cell">' + esc(target.result) + '</div><div role="cell">' + (target.image ? '<button class="result-view-button" onclick="showClosureResultImage(\'' + esc(target.code) + '\')">查看图片</button>' : esc(target.note)) + '</div><div role="cell" class="result-confirm-actions">' + (done ? '<span class="result-confirmed-text">已确认</span>' : orderMode ? '<span class="result-pending-text">待 PMO 核验</span>' : '<span id="badge-' + esc(target.code) + '" class="result-pending-text">待确认</span><button id="btnConfirm-' + esc(target.code) + '" class="result-confirm-button"' + (unavailable ? ' disabled title="请先录入网申结果"' : '') + ' onclick="confirmResult(\'' + esc(target.code) + '\')">确认结果</button>') + '</div></div>';
    }).join('');
    window.pendingCount = window.projectData.targets.filter(function(target) { return !state.confirmed[target.code]; }).length;
    window.updateClosureHint();
    var summary = document.querySelectorAll('#confirmModal .bg-gray-50 .flex > span:last-child');
    if (summary[3]) summary[3].textContent = '录取 ' + window.projectData.targets.filter(function(item) { return item.result === '录取'; }).length + ' · 拒录 ' + window.projectData.targets.filter(function(item) { return item.result === '拒录'; }).length;
  }
  window.showClosureResultImage = function(code) {
    var target = window.projectData.targets.find(function(item) { return item.code === code; });
    if (!target || !target.image) return;
    document.getElementById('screenshotTitle').textContent = target.school + ' · ' + target.result;
    document.getElementById('screenshotContent').innerHTML = '<img src="' + esc(target.image) + '" alt="结果材料" style="max-width:100%;max-height:70vh;object-fit:contain;margin:auto;">';
    document.getElementById('screenshotModal').classList.remove('hidden');
  };
  function renderProjectNotes() {
    var host = document.getElementById('closureProjectNotes');
    if (!host) { host = document.createElement('div'); host.id = 'closureProjectNotes'; host.className = 'closure-project-notes'; document.getElementById('basic-info').appendChild(host); }
    var assignment = project ? window.pbsProjects.getAssignment(project.projectNo).taskNote : '';
    host.innerHTML = [['项目备注', project && (project.projectNote || project.orderNote)], ['项目分配备注', assignment], ['结项备注', state.note]].map(function(item) { return '<div><strong>' + item[0] + '</strong><p>' + esc(item[1] || '—') + '</p></div>'; }).join('');
  }
  function restoreClosure() {
    if (state.confirmed) Object.keys(state.confirmed).forEach(function(code) { var button = document.getElementById('btnConfirm-' + code); if (state.confirmed[code] && button) window.confirmResult(code); });
    if (!state.closedAt) return;
    window.closureDone = true;
    document.getElementById('statusTag').textContent = '已结项'; document.getElementById('statusTag').className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
    document.getElementById('closureTimeText').textContent = state.closedAt;
    var button = document.getElementById('btnConfirmClosure'); button.disabled = true; button.textContent = '已结项';
    document.getElementById('closureHint').textContent = '项目已于 ' + state.closedAt + ' 完成结项';
  }
  var confirmResult = window.confirmResult;
  window.confirmResult = function(code) { if (!canEdit() || orderMode) return; confirmResult(code); if (closureKey) { state.confirmed = state.confirmed || {}; state.confirmed[code] = true; localStorage.setItem(closureKey, JSON.stringify(state)); var target = window.projectData.targets.find(function(item) { return item.code === code; }); if (target && project.packages.some(function(goal) { return goal.id === code; })) { var results = Object.assign({},pbsProjects.find(project.projectNo).goalResults || {}); results[code] = {result:target.result,note:target.note,image:target.image}; project = pbsProjects.update(project.projectNo,{goalResults:results}); } } };
  window.openConfirmModal = window.doConfirmClosure = function() {
    if (!project || !pbsOrders.canManage(project) || !window.pbsHasPermission('archive_approve')) return;
    location.href = '订单项目详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(project.projectNo) + '#closure';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize); else initialize();
})();
