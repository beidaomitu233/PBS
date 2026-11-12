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
  function renderApplications(body,rows,editable) {
    var table = Array.from(body.querySelectorAll('table')).find(function(item) { return !item.closest('#studentSelectionBindings'); });
    if (!table || !table.tHead || !table.tBodies.length) return;
    table.classList.add('selection-application-table');
    if (!table.parentElement.classList.contains('selection-history-scroll')) {
      var wrap = document.createElement('div'); wrap.className = 'selection-history-scroll'; table.before(wrap); wrap.appendChild(table);
    }
    var heading = table.tHead.rows[0], orders = profileOrders();
    if (!heading.querySelector('[data-selection-service]')) { var service = document.createElement('th'); service.dataset.selectionService = ''; service.textContent = '服务单号'; heading.prepend(service); }
    if (editable && !heading.querySelector('[data-selection-actions]')) { var action = document.createElement('th'); action.dataset.selectionActions = ''; action.textContent = '操作'; heading.appendChild(action); }
    Array.from(table.tBodies[0].rows).forEach(function(row) {
      var school = row.querySelector('[data-f="school"]'), major = row.querySelector('[data-f="major"]');
      if (!school) return;
      var order = orders.find(function(item) { return item.projects.some(function(project) { return (project.packages || []).some(function(goal) { return goal.school === school.textContent.trim() && (!major || goal.major === major.textContent.trim()); }); }); }) || (orders.length === 1 ? orders[0] : null);
      var linked = rows.filter(function(item) { return order && item.orderKey === order.key; }), ids = Array.from(new Set(linked.map(function(item) { return item.serviceId; })));
      var service = row.querySelector('[data-selection-service]');
      if (!service) { service = document.createElement('td'); service.dataset.selectionService = ''; row.prepend(service); }
      service.innerHTML = ids.length ? ids.map(function(id) { return '<div>' + taskLink(api.find(id) || {id:id}) + '</div>'; }).join('') : '—';
      var action = row.querySelector('[data-selection-actions]');
      if (editable) {
        if (!action) { action = document.createElement('td'); action.dataset.selectionActions = ''; row.appendChild(action); }
        action.innerHTML = '<button type="button" class="selection-secondary-button" data-link-selection>关联选校任务</button>';
        action.querySelector('button').onclick = function(event) { event.stopPropagation(); openPicker(order && order.key); };
      } else if (action) action.remove();
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
    var profile = pbsStudents.find(studentId), pending = profile.pendingParseFiles || [], imports = profile.preImports || [];
    var appended = rows.length || imports.length;
    var moduleNames = {edu:'教育背景',lang:'语言成绩',score:'学业信息',qual:'专业资质',work:'工作经历',practice:'实践经历',honor:'荣誉奖项',pub:'学术发表'}, modules = {};
    imports.forEach(function(item) { Object.keys(item.sections || {}).forEach(function(key) { if (moduleNames[key]) modules[key] = true; }); });
    var links = Object.keys(modules).map(function(key) { return '<a href="#sec-' + key + '" data-archive-section="' + key + '">' + moduleNames[key] + '</a>'; }).join('');
    var appendGuide = appended ? '<div class="pa-append-guide"><div class="pa-append-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zm0 0v6h6M8 13h8m-8 4h5"/></svg></div><div><strong>选校资料已追加到对应模块</strong><p>' + (pending.length ? pending.length + ' 份文件待解析。' : '') + '追加解析将填入对应字段，不同内容可在字段旁确认。</p>' + (links ? '<div class="pa-module-links">' + links + '</div>' : '') + '</div>' + (imports.length ? '<button class="selection-text-button" data-imports>查看资料</button>' : '') + (editable ? '<button class="pa-button primary" data-append-parse>追加解析</button>' : '') + '</div>' : '';
    var services = Array.from(new Set(rows.map(function(item) { return item.serviceId; })));
    host.innerHTML = '<div class="selection-binding-heading"><h3>选校任务关联</h3>' + (editable ? '<button class="selection-secondary-button" data-bind>关联选校任务</button>' : '') + '</div>' + appendGuide + (!rows.length && !imports.length ? '<p class="selection-binding-help">关联选校任务后，预档案资料将追加到当前档案。</p>' : '') + '<div class="selection-binding-scroll"><table class="selection-binding-task-table"><thead><tr>' + taskHeadings() + (editable ? '<th>操作</th>' : '') + '</tr></thead><tbody>' + (services.length ? services.map(function(id) {
      var task = api.find(id) || {id:id};
      return '<tr><td>' + taskLink(task) + '</td>' + taskCells(task) + (editable ? '<td class="selection-binding-actions"><button class="selection-text-button" data-parse="' + esc(id) + '">追加解析</button><button class="selection-text-button" data-unbind="' + esc(id) + '">解除关联</button></td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="' + (editable ? 9 : 8) + '" class="selection-binding-empty">暂未关联选校任务</td></tr>') + '</tbody></table></div>';
    renderApplications(body,rows,editable);
    if (!imports.length && appended) { host.querySelector('.pa-append-guide strong').textContent = '选校任务已关联'; host.querySelector('.pa-append-guide p').textContent = '可追加解析预档案资料，并填入对应模块。'; }
    host.onclick = function(event) {
      var sectionLink = event.target.closest('[data-archive-section]');
      if (sectionLink) { var body = document.getElementById('secbody-' + sectionLink.dataset.archiveSection); if (body.classList.contains('hidden')) toggleSection(sectionLink.dataset.archiveSection); }
      if (event.target.closest('[data-bind]')) openPicker();
      if (event.target.closest('[data-append-parse]') && window.pbsPreArchive) pbsPreArchive.openParse(studentId);
      var button = event.target.closest('[data-unbind]');
      if (button && confirm('确认解除选校任务关联？已追加的档案资料和文件将继续保留。')) { rows.filter(function(item) { return item.serviceId === button.dataset.unbind; }).forEach(function(item) { api.unbind(studentId,item.orderKey,item.serviceId); }); render(); }
      var parse = event.target.closest('[data-parse]'); if (parse && window.pbsPreArchive) pbsPreArchive.openParse(studentId,parse.dataset.parse);
      if (event.target.closest('[data-imports]') && window.pbsPreArchive) pbsPreArchive.showImports(studentId);
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
      dialog.close(); pbsPreArchive.bindSelection(studentId,orderKey,button.dataset.task);
    });
    dialog.onclose = function() { dialog.remove(); };
    document.body.appendChild(dialog); draw(); dialog.showModal();
  }
  window.pbsRenderSelectionBindings = render;
  window.addEventListener('storage',function(event) { if (event.key === 'pbs_selection_services_v1' || event.key === 'pbs_selection_order_bindings_v1') render(); });
})();
