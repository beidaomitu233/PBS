(function () {
  'use strict';
  var api = window.pbsSelection, studentId = window.PBS_STUDENT_ID;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function profileOrders() { return api.orders().filter(function(order) { return order.studentId === studentId; }); }
  function targets(order) { return order ? order.projects.reduce(function(all, project) { return all.concat((project.packages || []).map(function(goal) { return [goal.school,goal.major].filter(Boolean).join(' · '); })); }, []).join('\n') : '—'; }
  function taskLink(task) { return pbsHasPermission('school_plan') ? '<a href="选校工作台页 - 留学申请管理系统.html?service=' + encodeURIComponent(task.id) + '">' + esc(task.id) + '</a>' : esc(task.id); }
  function taskCells(task) {
    return [task.sales,task.student,task.level,task.country,task.major,task.status].map(function(value) { return '<td>' + esc(value || '—') + '</td>'; }).join('') + '<td class="selection-binding-date">' + esc(task.createdAt ? new Date(task.createdAt).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai',hour12:false}).slice(0,16) : '—') + '</td>';
  }
  function taskHeadings() { return '<th>服务单号</th><th>销售人员</th><th>学生姓名</th><th>申请层次</th><th>意向国家</th><th>意向专业</th><th>咨询状态</th><th>创建时间</th>'; }
  function renderApplications(body) {
    var table = Array.from(body.querySelectorAll('table')).find(function(item) { return !item.closest('#studentSelectionBindings'); });
    if (!table || !table.tHead || !table.tBodies.length) return;
    table.classList.add('selection-application-table');
    if (!table.parentElement.classList.contains('selection-history-scroll')) {
      var wrap = document.createElement('div'); wrap.className = 'selection-history-scroll'; table.before(wrap); wrap.appendChild(table);
    }
    table.querySelectorAll('[data-selection-service],[data-selection-actions]').forEach(function(cell) { cell.remove(); });
    var heading = table.tHead.rows[0], statusHeading = heading.querySelector('[data-f="status"]');
    if (!statusHeading) { statusHeading = document.createElement('th'); statusHeading.className = 'px-4 py-3 text-left text-sm font-medium text-gray-500'; statusHeading.dataset.f = 'status'; heading.insertBefore(statusHeading,heading.querySelector('[data-f="time"]')); }
    statusHeading.textContent = '项目状态';
    var projects = pbsStudents.projects(studentId);
    Array.from(table.tBodies[0].rows).forEach(function(row) {
      var school = row.querySelector('[data-f="school"]'), major = row.querySelector('[data-f="major"]');
      if (!school) return;
      var matches = projects.filter(function(project) { return (project.packages || []).some(function(goal) { return goal.school === school.textContent.trim() && (!major || goal.major === major.textContent.trim()); }); });
      if (!matches.length) matches = projects.filter(function(project) { return (project.packages || []).some(function(goal) { return goal.school === school.textContent.trim(); }); });
      var project = matches.length === 1 ? matches[0] : null, status = project ? pbsProjects.statusOf(project) : '—';
      var cell = row.querySelector('[data-f="status"]');
      if (!cell) { cell = document.createElement('td'); cell.className = 'px-4 py-4'; cell.dataset.f = 'status'; row.insertBefore(cell,row.querySelector('[data-f="time"]')); }
      cell.dataset.projectStatus = '';
      var colors = {'待分配':'bg-yellow-100 text-yellow-800','待接收':'bg-blue-100 text-blue-800','进行中':'bg-green-100 text-green-800','已结项':'bg-gray-100 text-gray-500'};
      cell.innerHTML = status === '—' ? '—' : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + (colors[status] || 'bg-gray-100 text-gray-500') + '">' + esc(status) + '</span>';
    });
  }
  function render() {
    var body = document.getElementById('secbody-apply');
    if (!body || !pbsStudents.canView(studentId)) return;
    if (pbsStudents.find(studentId).kind === 'preliminary') return;
    api.seed();
    var host = document.getElementById('studentSelectionBindings');
    if (!host) { host = document.createElement('div'); host.id = 'studentSelectionBindings'; host.className = 'selection-bindings'; body.prepend(host); }
    var rows = api.bindings().filter(function(item) { return item.studentId === studentId; }), editable = pbsStudents.canEdit(studentId);
    var services = Array.from(new Set(rows.map(function(item) { return item.serviceId; })));
    host.innerHTML = '<div class="selection-binding-heading"><h3>选校任务关联</h3>' + (editable ? '<button class="selection-secondary-button" data-bind>关联选校任务</button>' : '') + '</div><div class="selection-binding-scroll"><table class="selection-binding-task-table"><thead><tr>' + taskHeadings() + (editable ? '<th>操作</th>' : '') + '</tr></thead><tbody>' + (services.length ? services.map(function(id) {
      var task = api.find(id) || {id:id};
      return '<tr><td>' + taskLink(task) + '</td>' + taskCells(task) + (editable ? '<td class="selection-binding-actions"><button class="selection-text-button" data-unbind="' + esc(id) + '">解除关联</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="' + (editable ? 9 : 8) + '" class="selection-binding-empty">暂未关联选校任务</td></tr>') + '</tbody></table></div>';
    renderApplications(body);
    host.onclick = function(event) {
      if (event.target.closest('[data-bind]')) openPicker();
      var button = event.target.closest('[data-unbind]');
      if (button && confirm('确认解除选校任务关联？')) { rows.filter(function(item) { return item.serviceId === button.dataset.unbind; }).forEach(function(item) { api.unbind(studentId,item.orderKey,item.serviceId); }); render(); }
    };
  }
  function openPicker(selectedOrder) {
    if (!pbsStudents.canEdit(studentId)) return;
    var orders = profileOrders(), tasks = api.candidates(studentId), dialog = document.createElement('dialog');
    dialog.className = 'selection-binding-dialog';
    dialog.innerHTML = '<header><h3>关联选校任务</h3><button data-close aria-label="关闭">×</button></header><div class="selection-binding-order"><label>项目号<select id="bindingOrder">' + (orders.length ? orders.map(function(order) { return '<option value="' + esc(order.key) + '">' + esc(order.orderNo || order.projectNo) + '</option>'; }).join('') : '<option value="">暂无关联项目</option>') + '</select></label><p id="bindingOrderTargets"></p></div><div class="selection-binding-filters"><input id="selectionTaskSearch" placeholder="搜索服务单号、学生、销售人员或专业"><select id="selectionTaskStatus"><option value="">全部咨询状态</option><option>未选校</option><option>咨询中</option><option>已发送</option><option>已结单</option></select></div><div class="selection-binding-scroll"><table class="selection-binding-task-table"><thead><tr>' + taskHeadings() + '<th>操作</th></tr></thead><tbody id="selectionTaskCandidates"></tbody></table></div><p id="selectionBindingError" role="alert"></p>';
    if (selectedOrder) dialog.querySelector('#bindingOrder').value = selectedOrder;
    function draw() {
      var keyword = dialog.querySelector('#selectionTaskSearch').value.trim().toLowerCase(), status = dialog.querySelector('#selectionTaskStatus').value;
      var orderKey = dialog.querySelector('#bindingOrder').value, order = orders.find(function(item) { return item.key === orderKey; });
      var bindings = api.bindings();
      dialog.querySelector('#bindingOrderTargets').textContent = targets(order);
      dialog.querySelector('#selectionTaskCandidates').innerHTML = tasks.filter(function(task) { return (!keyword || [task.id,task.student,task.sales,task.major,task.country].join(' ').toLowerCase().includes(keyword)) && (!status || task.status === status); }).map(function(task) {
        var bound = bindings.find(function(item) { return item.serviceId === task.id; });
        var elsewhere = bound && bound.orderKey !== orderKey;
        return '<tr><td>' + taskLink(task) + '</td>' + taskCells(task) + '<td><button class="selection-text-button" data-task="' + esc(task.id) + '"' + (elsewhere ? ' title="已绑定项目号 ' + esc(bound.orderNo || '—') + '，请先解除原关联"' : '') + (!order || bound ? ' disabled' : '') + '>' + (elsewhere ? '已关联其他项目' : bound ? '已关联' : '关联') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="9" class="selection-binding-empty">暂无符合条件的选校任务</td></tr>';
      dialog.querySelector('#selectionBindingError').textContent = '';
    }
    dialog.addEventListener('input',function(event) { if (event.target.id === 'selectionTaskSearch') draw(); });
    dialog.addEventListener('change',function(event) { if (event.target.id === 'bindingOrder' || event.target.id === 'selectionTaskStatus') draw(); });
    dialog.addEventListener('click',function(event) {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
      var button = event.target.closest('[data-task]'); if (!button || button.disabled) return;
      var orderKey = dialog.querySelector('#bindingOrder').value, error = api.bindingError(studentId,orderKey,button.dataset.task);
      if (error) { dialog.querySelector('#selectionBindingError').textContent = error; return; }
      var result = api.bind(studentId,orderKey,button.dataset.task);
      if (result.error) { dialog.querySelector('#selectionBindingError').textContent = result.error; return; }
      dialog.close(); render();
    });
    dialog.onclose = function() { dialog.remove(); };
    document.body.appendChild(dialog); draw(); dialog.showModal();
  }
  window.pbsRenderSelectionBindings = render;
  window.addEventListener('pbs-order-updated',render);
  window.addEventListener('storage',function(event) { if (['pbs_selection_services_v1','pbs_selection_order_bindings_v1','pbs_projects_v1','pbs_order_management_v1'].indexOf(event.key) >= 0 || (event.key || '').indexOf('pbs_pm_staff_assignment_v3_') === 0 || (event.key || '').indexOf('pbs_project_assignment_v3_') === 0) render(); });
})();
