(function () {
  'use strict';
  var api = window.pbsSelection, studentId = window.PBS_STUDENT_ID;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function profileOrders() { return api.orders().filter(function(order) { return order.studentId === studentId; }); }
  function targets(order) { return order ? order.projects.reduce(function(all, project) { return all.concat((project.packages || []).map(function(goal) { return [goal.school,goal.major].filter(Boolean).join(' · '); })); }, []).join('\n') : '—'; }
  function taskLink(task) { return pbsHasPermission('school_plan') ? '<a href="选校工作台页 - 留学申请管理系统.html?service=' + encodeURIComponent(task.id) + '">' + esc(task.id) + '</a>' : esc(task.id); }
  function render() {
    var body = document.getElementById('secbody-apply');
    if (!body || !pbsStudents.canView(studentId)) return;
    if (pbsStudents.find(studentId).kind === 'preliminary') return;
    api.seed();
    var host = document.getElementById('studentSelectionBindings');
    if (!host) { host = document.createElement('div'); host.id = 'studentSelectionBindings'; host.className = 'selection-bindings'; body.prepend(host); }
    var orders = profileOrders(), rows = api.bindings().filter(function(item) { return item.studentId === studentId; }), editable = pbsStudents.canEdit(studentId);
    var profile = pbsStudents.find(studentId), pending = profile.pendingParseFiles || [], imports = profile.preImports || [];
    var appended = rows.length || imports.length;
    var moduleNames = {edu:'教育背景',lang:'语言成绩',score:'学业信息',qual:'专业资质',work:'工作经历',practice:'实践经历',honor:'荣誉奖项',pub:'学术发表'}, modules = {};
    imports.forEach(function(item) { Object.keys(item.sections || {}).forEach(function(key) { if (moduleNames[key]) modules[key] = true; }); });
    var links = Object.keys(modules).map(function(key) { return '<a href="#sec-' + key + '" data-archive-section="' + key + '">' + moduleNames[key] + '</a>'; }).join('');
    var appendGuide = appended ? '<div class="pa-append-guide"><div class="pa-append-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zm0 0v6h6M8 13h8m-8 4h5"/></svg></div><div><strong>选校资料已追加到对应模块</strong><p>' + (pending.length ? pending.length + ' 份文件待解析。' : '') + '追加解析将填入对应字段，不同内容可在字段旁确认。</p>' + (links ? '<div class="pa-module-links">' + links + '</div>' : '') + '</div>' + (editable ? '<button class="pa-button primary" data-append-parse>追加解析</button>' : '') + '</div>' : '';
    host.innerHTML = '<div class="selection-binding-heading"><h3>选校单绑定</h3>' + (editable ? '<button class="selection-secondary-button" data-bind>绑定选校单</button>' : '') + '</div>' + appendGuide + (!rows.length && !imports.length ? '<p class="selection-binding-help">绑定申请订单与选校单后，预档案资料将追加到当前档案，可继续追加解析。</p>' : '') + '<div class="selection-binding-scroll"><table><thead><tr><th>申请订单</th><th>订单院校目标</th><th>选校单</th><th>预档案资料</th><th>任务状态</th>' + (editable ? '<th>操作</th>' : '') + '</tr></thead><tbody>' + (rows.length ? rows.map(function(item) {
      var task = api.find(item.serviceId), order = orders.find(function(row) { return row.key === item.orderKey; });
      var imported = imports.find(function(row) { return row.serviceId === item.serviceId || task && row.sourceId === task.preStudentId; });
      var state = imported ? '资料已追加' : '已绑定';
      return '<tr><td>' + esc(item.orderNo || '—') + (!item.orderNo ? '<small>' + esc(item.projectNo) + '</small>' : '') + '</td><td class="selection-bound-targets">' + esc(targets(order)) + '</td><td>' + (task ? taskLink(task) : esc(item.serviceId)) + '</td><td>' + state + (imported ? '<button class="selection-text-button" data-imports>查看资料</button>' : '') + '</td><td>' + esc(task ? task.status : '—') + '</td>' + (editable ? '<td><button class="selection-text-button" data-parse="' + esc(item.serviceId) + '">追加解析</button><button class="selection-text-button" data-unbind="' + esc(item.orderKey) + '">解除绑定</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="' + (editable ? 6 : 5) + '" class="selection-binding-empty">暂未绑定选校单</td></tr>') + '</tbody></table></div>';
    host.onclick = function(event) {
      var sectionLink = event.target.closest('[data-archive-section]');
      if (sectionLink) { var body = document.getElementById('secbody-' + sectionLink.dataset.archiveSection); if (body.classList.contains('hidden')) toggleSection(sectionLink.dataset.archiveSection); }
      if (event.target.closest('[data-bind]')) openPicker();
      if (event.target.closest('[data-append-parse]') && window.pbsPreArchive) pbsPreArchive.openParse(studentId);
      var button = event.target.closest('[data-unbind]');
      if (button && confirm('确认解除选校单绑定？已追加的档案资料和文件将继续保留。')) { api.unbind(studentId,button.dataset.unbind); render(); }
      var parse = event.target.closest('[data-parse]'); if (parse && window.pbsPreArchive) pbsPreArchive.openParse(studentId,parse.dataset.parse);
      if (event.target.closest('[data-imports]') && window.pbsPreArchive) pbsPreArchive.showImports(studentId);
    };
  }
  function openPicker() {
    if (!pbsStudents.canEdit(studentId)) return;
    var orders = profileOrders(), tasks = api.candidates(studentId), dialog = document.createElement('dialog');
    dialog.className = 'selection-binding-dialog';
    dialog.innerHTML = '<header><h3>绑定选校单</h3><button data-close aria-label="关闭">×</button></header><div class="selection-binding-order"><label>申请订单<select id="bindingOrder">' + (orders.length ? orders.map(function(order) { return '<option value="' + esc(order.key) + '">' + esc(order.orderNo || order.projectNo) + '</option>'; }).join('') : '<option value="">暂无申请订单</option>') + '</select></label><p id="bindingOrderTargets"></p></div><div class="selection-binding-filters"><input id="selectionTaskSearch" placeholder="搜索任务号、学生、销售人员或专业"><select id="selectionTaskStatus"><option value="">全部任务状态</option><option>未选校</option><option>咨询中</option><option>已发送</option><option>已结单</option></select></div><div class="selection-binding-scroll"><table><thead><tr><th>选校任务</th><th>学生姓名</th><th>销售人员</th><th>申请层次</th><th>选校意向</th><th>状态</th><th>操作</th></tr></thead><tbody id="selectionTaskCandidates"></tbody></table></div><p id="selectionBindingError" role="alert"></p>';
    function draw() {
      var keyword = dialog.querySelector('#selectionTaskSearch').value.trim().toLowerCase(), status = dialog.querySelector('#selectionTaskStatus').value;
      var orderKey = dialog.querySelector('#bindingOrder').value, order = orders.find(function(item) { return item.key === orderKey; });
      var bound = api.bindings().find(function(item) { return item.orderKey === orderKey; });
      dialog.querySelector('#bindingOrderTargets').textContent = targets(order);
      dialog.querySelector('#selectionTaskCandidates').innerHTML = tasks.filter(function(task) { return (!keyword || [task.id,task.student,task.sales,task.major,task.country].join(' ').toLowerCase().includes(keyword)) && (!status || task.status === status); }).map(function(task) {
        return '<tr><td>' + esc(task.id) + '</td><td>' + esc(task.student) + '</td><td>' + esc(task.sales) + '</td><td>' + esc(task.level) + '</td><td>' + esc([task.country,task.major].filter(Boolean).join(' · ')) + '</td><td>' + esc(task.status) + '</td><td><button class="selection-text-button" data-task="' + esc(task.id) + '"' + (!order || bound ? ' disabled' : '') + '>' + (bound && bound.serviceId === task.id ? '已绑定' : '绑定') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="selection-binding-empty">暂无符合条件的选校任务</td></tr>';
      dialog.querySelector('#selectionBindingError').textContent = bound ? '该申请订单已绑定选校单，请先解除原绑定。' : '';
    }
    dialog.addEventListener('input',function(event) { if (event.target.id === 'selectionTaskSearch') draw(); });
    dialog.addEventListener('change',function(event) { if (event.target.id === 'bindingOrder' || event.target.id === 'selectionTaskStatus') draw(); });
    dialog.addEventListener('click',function(event) {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
      var button = event.target.closest('[data-task]'); if (!button || button.disabled) return;
      var orderKey = dialog.querySelector('#bindingOrder').value, error = api.bindingError(studentId,orderKey,button.dataset.task);
      if (error) { dialog.querySelector('#selectionBindingError').textContent = error; return; }
      dialog.close(); pbsPreArchive.bindSelection(studentId,orderKey,button.dataset.task);
    });
    dialog.onclose = function() { dialog.remove(); };
    document.body.appendChild(dialog); draw(); dialog.showModal();
  }
  window.pbsRenderSelectionBindings = render;
  window.addEventListener('storage',function(event) { if (event.key === 'pbs_selection_services_v1' || event.key === 'pbs_selection_order_bindings_v1') render(); });
})();
