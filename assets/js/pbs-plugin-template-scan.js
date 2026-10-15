(function () {
  'use strict';
  if (!pbsTemplateScan.pluginAdmin()) return;
  var activeTask = null;
  var view = document.createElement('div');
  view.id = 'templateScanView';
  view.innerHTML = '<div class="flex items-center justify-between mb-5"><h2 class="text-xl font-semibold text-slate-900">模板扫描任务</h2><a href="../网申模板发布中心 - 留学申请管理系统.html" class="text-sm text-blue-600">发布中心</a></div><div class="flex gap-3 mb-5"><input id="scanTaskSearch" class="flex-1 h-11 px-4 rounded-lg border border-slate-200" placeholder="搜索模板、院校或专业"><select id="scanTaskStatus" class="h-11 px-4 rounded-lg border border-slate-200"><option value="">全部状态</option><option>待扫描</option><option>待确认</option><option>已扫描</option></select></div><div id="templateScanTasks" class="space-y-4"></div>';
  document.querySelector('main').prepend(view);
  ['studentView', 'schoolView', 'projectView'].forEach(function (id) { document.getElementById(id).classList.add('hidden'); });
  document.getElementById('pluginUserRole').textContent = '平台管理员';
  function render() {
    var keyword = document.getElementById('scanTaskSearch').value.trim().toLowerCase(), status = document.getElementById('scanTaskStatus').value;
    var tasks = pbsTemplateScan.tasks().filter(function (task) { return (!status || task.status === status) && (!keyword || (task.name + task.school + task.college + task.programs.join(' ')).toLowerCase().includes(keyword)); });
    document.getElementById('templateScanTasks').innerHTML = tasks.map(function (task) {
      return '<section class="bg-white border border-slate-200 rounded-xl p-5"><div class="flex items-start justify-between gap-4"><div><h3 class="font-semibold text-slate-900">' + escapeText(task.name) + '</h3><p class="text-sm text-slate-500 mt-2">' + escapeText(task.school + ' · ' + task.college + ' · ' + task.version) + '</p></div><span class="text-sm text-blue-600">' + escapeText(task.status) + '</span></div><div class="flex flex-wrap gap-4 text-sm my-4">' + task.entrances.filter(function (entry) { return /^https?:\/\//i.test(entry.url); }).map(function (entry) { return '<a class="text-blue-600 underline" target="_blank" rel="noopener" href="' + escapeAttr(entry.url) + '">' + escapeText(entry.name) + '</a>'; }).join('') + '</div><div class="flex items-center justify-between border-t border-slate-100 pt-4"><span class="text-xs text-slate-400">' + escapeText(task.actor) + ' · ' + new Date(task.at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) + '</span>' + (task.status === '已扫描' ? '<a class="text-sm text-blue-600" href="../网申模板编辑 - 留学申请管理系统.html?center=1&id=' + task.templateId + '">编辑模板</a>' : '<button data-scan-task="' + escapeAttr(task.id) + '" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">' + (task.result ? '核对扫描结果' : '扫描页面') + '</button>') + '</div></section>';
    }).join('') || '<div class="text-center text-slate-400 bg-white rounded-xl py-16">暂无扫描任务</div>';
  }
  view.addEventListener('input', render);
  view.addEventListener('change', render);
  view.addEventListener('click', function (event) {
    var button = event.target.closest('[data-scan-task]'); if (!button) return;
    activeTask = pbsTemplateScan.tasks().find(function (task) { return task.id === button.dataset.scanTask; });
    if (!activeTask || activeTask.status === '已扫描') return;
    activeSchool = { name: activeTask.school, program: activeTask.college };
    openScanResult(activeTask.result || createScanRecord(false));
    var modal = document.getElementById('scanResultModal');
    modal.querySelector('header p:last-child').textContent = '核对并保存官网字段与材料';
    modal.querySelector('[onclick="confirmScanResult()"]').textContent = '确认并保存模板';
  });
  var originalClose = window.closeScanResult, originalRender = window.renderProjectState;
  window.renderProjectState = function () { if (activeTask) { render(); return; } originalRender(); };
  window.closeScanResult = function () { originalClose(); activeTask = null; };
  function save(complete) {
    if (!activeTask) return;
    var result = pbsTemplateScan.save(activeTask.id, collectScanResult(), complete);
    if (result.error) { toast(result.error); return; }
    closeScanResult(); render(); toast(complete ? '已保存至平台模板，可继续编辑和发布' : '扫描结果已暂存');
  }
  window.saveScanDraft = function () { save(false); };
  window.confirmScanResult = function () { save(true); };
  window.addEventListener('storage', function (event) { if (event.key === pbsTemplateScan.key) render(); });
  render();
})();
