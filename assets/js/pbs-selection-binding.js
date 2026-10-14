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
    api.seed();
    var host = document.getElementById('studentSelectionBindings');
    if (!host) { host = document.createElement('div'); host.id = 'studentSelectionBindings'; host.className = 'selection-bindings'; body.prepend(host); }
    var orders = profileOrders(), rows = api.bindings().filter(function(item) { return item.studentId === studentId; }), editable = pbsStudents.canEdit(studentId);
    host.innerHTML = '<div class="selection-binding-heading"><h3>订单与选校任务关联</h3>' + (editable ? '<button class="selection-secondary-button" data-bind>关联选校任务</button>' : '') + '</div><div class="selection-binding-scroll"><table><thead><tr><th>申请订单</th><th>订单院校目标</th><th>选校任务</th><th>选校意向</th><th>任务状态</th>' + (editable ? '<th>操作</th>' : '') + '</tr></thead><tbody>' + (rows.length ? rows.map(function(item) {
      var task = api.find(item.serviceId), order = orders.find(function(row) { return row.key === item.orderKey; });
      return '<tr><td>' + esc(item.orderNo || '—') + (!item.orderNo ? '<small>' + esc(item.projectNo) + '</small>' : '') + '</td><td class="selection-bound-targets">' + esc(targets(order)) + '</td><td>' + (task ? taskLink(task) : esc(item.serviceId)) + '</td><td>' + (task ? esc([task.country,task.major].filter(Boolean).join(' · ')) : '—') + '</td><td>' + esc(task ? task.status : '—') + '</td>' + (editable ? '<td><button class="selection-text-button" data-unbind="' + esc(item.orderKey) + '">解除关联</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="' + (editable ? 6 : 5) + '" class="selection-binding-empty">暂无选校任务关联</td></tr>') + '</tbody></table></div>';
    host.onclick = function(event) {
      if (event.target.closest('[data-bind]')) openPicker();
      var button = event.target.closest('[data-unbind]');
      if (button && confirm('确认解除该订单与选校任务的关联？')) { api.unbind(studentId,button.dataset.unbind); render(); }
    };
  }
  function openPicker() {
    if (!pbsStudents.canEdit(studentId)) return;
    var orders = profileOrders(), tasks = api.candidates(studentId), dialog = document.createElement('dialog');
    dialog.className = 'selection-binding-dialog';
    dialog.innerHTML = '<header><h3>关联选校任务</h3><button data-close aria-label="关闭">×</button></header><div class="selection-binding-order"><label>申请订单<select id="bindingOrder">' + (orders.length ? orders.map(function(order) { return '<option value="' + esc(order.key) + '">' + esc(order.orderNo || order.projectNo) + '</option>'; }).join('') : '<option value="">暂无申请订单</option>') + '</select></label><p id="bindingOrderTargets"></p></div><div class="selection-binding-filters"><input id="selectionTaskSearch" placeholder="搜索任务号、学生、销售人员或专业"><select id="selectionTaskStatus"><option value="">全部任务状态</option><option>未选校</option><option>咨询中</option><option>已发送</option><option>已结单</option></select></div><div class="selection-binding-scroll"><table><thead><tr><th>选校任务</th><th>学生姓名</th><th>销售人员</th><th>申请层次</th><th>选校意向</th><th>状态</th><th>操作</th></tr></thead><tbody id="selectionTaskCandidates"></tbody></table></div><p id="selectionBindingError" role="alert"></p>';
    function draw() {
      var keyword = dialog.querySelector('#selectionTaskSearch').value.trim().toLowerCase(), status = dialog.querySelector('#selectionTaskStatus').value;
      var orderKey = dialog.querySelector('#bindingOrder').value, order = orders.find(function(item) { return item.key === orderKey; });
      var bound = api.bindings().find(function(item) { return item.orderKey === orderKey; });
      dialog.querySelector('#bindingOrderTargets').textContent = targets(order);
      dialog.querySelector('#selectionTaskCandidates').innerHTML = tasks.filter(function(task) { return (!keyword || [task.id,task.student,task.sales,task.major,task.country].join(' ').toLowerCase().includes(keyword)) && (!status || task.status === status); }).map(function(task) {
        return '<tr><td>' + esc(task.id) + '</td><td>' + esc(task.student) + '</td><td>' + esc(task.sales) + '</td><td>' + esc(task.level) + '</td><td>' + esc([task.country,task.major].filter(Boolean).join(' · ')) + '</td><td>' + esc(task.status) + '</td><td><button class="selection-text-button" data-task="' + esc(task.id) + '"' + (!order || bound ? ' disabled' : '') + '>' + (bound && bound.serviceId === task.id ? '已关联' : '关联') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="selection-binding-empty">暂无符合条件的选校任务</td></tr>';
      dialog.querySelector('#selectionBindingError').textContent = bound ? '该申请订单已关联选校任务，请先解除原关联。' : '';
    }
    dialog.addEventListener('input',draw); dialog.addEventListener('change',draw);
    dialog.addEventListener('click',function(event) {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
      var button = event.target.closest('[data-task]'); if (!button || button.disabled) return;
      var result = api.bind(studentId,dialog.querySelector('#bindingOrder').value,button.dataset.task);
      if (result.error) { dialog.querySelector('#selectionBindingError').textContent = result.error; return; }
      dialog.close(); render();
    });
    dialog.onclose = function() { dialog.remove(); };
    document.body.appendChild(dialog); draw(); dialog.showModal();
  }
  window.pbsRenderSelectionBindings = render;
  window.addEventListener('storage',function(event) { if (event.key === 'pbs_selection_services_v1' || event.key === 'pbs_selection_order_bindings_v1') render(); });
})();
