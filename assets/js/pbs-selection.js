(function () {
  'use strict';
  var api = window.pbsSelection, selectedOrder = null;
  var file = decodeURIComponent(location.pathname).split('/').pop();
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function time(value) { return value ? new Date(value).toLocaleString('sv-SE').slice(0,16) : '—'; }
  function toast(value) { (window.planToast || window.showToast || window.alert)(value); }
  function link(item, page) { return page + '?service=' + encodeURIComponent(item.id); }
  function orderLabel(item) { return item.orderNo || '—'; }
  function canWork(item) { var role = pbsGetSession().role; return role === '超级管理员' || role === '销售人员' && item.sales === pbsGetSession().name; }
  function renderList() {
    var body = document.getElementById('selTaskTbody') || document.querySelector('main tbody');
    if (!body) return;
    body.innerHTML = api.visible().map(function(item,index) {
      var profile = pbsStudents.find(item.studentId), student = profile ? profile.name : item.student;
      var data = {project:item.id,sales:item.sales,student:student,level:item.level,country:item.country,major:item.major,status:item.status,time:item.createdAt.slice(0,10)};
      data.kw = Object.values(data).join(' ') + ' ' + item.orderNo + ' ' + item.projectNo;
      return '<tr class="hover:bg-gray-50" ' + Object.keys(data).map(function(key) { return 'data-' + key + '="' + esc(data[key]) + '"'; }).join(' ') + '><td class="px-5 py-4 text-sm">' + (index+1) + '</td><td class="px-5 py-4 text-sm font-medium">' + esc(item.id) + '</td><td class="px-5 py-4 text-sm text-center">' + esc(orderLabel(item)) + '</td><td class="px-5 py-4 text-sm">' + esc(item.sales) + '</td><td class="px-5 py-4 text-sm"><a class="text-blue-600" href="学生档案详情页 - 留学申请管理系统.html?studentId=' + encodeURIComponent(item.studentId) + '">' + esc(student) + '</a></td><td class="px-5 py-4 text-sm">' + esc(item.level) + '</td><td class="px-5 py-4 text-sm">' + esc(item.country) + '</td><td class="px-5 py-4 text-sm">' + esc(item.major) + '</td><td class="px-5 py-4 text-sm">' + esc(item.status) + '</td><td class="px-5 py-4 text-sm">' + time(item.createdAt) + '</td><td class="px-5 py-4 text-sm whitespace-nowrap">' + (canWork(item) ? '<a class="text-blue-600 mr-3" href="' + link(item,'选校工作台页 - 留学申请管理系统.html') + '">进入工作台</a>' : '') + '<a class="text-blue-600" href="' + link(item,'选校方案未生成 - 留学申请管理系统.html') + '">查看方案</a></td></tr>';
    }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="11" class="p-8 text-center text-sm text-gray-400">暂无符合条件的选校服务单</td></tr>';
    if (window.applyFilter) applyFilter();
  }
  window.openSelectionOrderPicker = function () {
    var dialog = document.createElement('dialog'); dialog.id = 'selectionOrderPicker'; dialog.style.cssText = 'width:min(1000px,94vw);max-height:80vh;border:0;border-radius:16px;padding:0;box-shadow:0 20px 70px #0003';
    dialog.innerHTML = '<div class="px-6 py-4 border-b flex justify-between"><h3 class="font-semibold">关联学生档案与申请订单</h3><button data-close aria-label="关闭">×</button></div><div class="px-6 py-4 flex gap-3"><input id="orderSearch" placeholder="搜索学生、客户、订单号或项目号" class="flex-1 border rounded-lg px-3 h-10 text-sm"><select id="orderLevel" class="border rounded-lg px-3 text-sm"><option value="">全部申请层次</option><option>本科申请</option><option>硕士申请</option><option>博士申请</option></select><select id="orderSource" class="border rounded-lg px-3 text-sm"><option value="">全部订单来源</option><option>线上</option><option>线下</option></select></div><div style="max-height:55vh;overflow:auto"><table class="w-full text-sm text-left"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-4">学生姓名</th><th>客户姓名</th><th>申请订单</th><th>关联项目与院校目标</th><th>申请层次</th><th>操作</th></tr></thead><tbody id="selectionOrderRows"></tbody></table></div>';
    document.body.appendChild(dialog);
    function render() {
      var keyword = dialog.querySelector('#orderSearch').value.trim().toLowerCase(), level = dialog.querySelector('#orderLevel').value, source = dialog.querySelector('#orderSource').value;
      var rows = api.orders().filter(function(order) { return (!keyword || (order.student + order.customer + order.orderNo + order.projects.map(function(p){return p.projectNo;}).join(' ')).toLowerCase().includes(keyword)) && (!level || order.level === level) && (!source || (order.orderNo ? '线上' : '线下') === source); });
      dialog.querySelector('tbody').innerHTML = rows.map(function(order) {
        var bound = api.all().find(function(item) { return item.orderKey === order.key; });
        return '<tr class="border-t"><td class="p-4">' + esc(order.student) + '</td><td>' + esc(order.customer) + '</td><td>' + esc(order.orderNo || '—') + '</td><td class="py-3">' + order.projects.map(function(p){return '<div>' + esc(p.projectNo) + '</div>';}).join('') + '<span class="text-xs text-gray-400">' + order.goals + ' 个院校目标</span></td><td>' + esc(order.level) + '</td><td><button data-order="' + esc(order.key) + '" ' + (bound ? 'disabled class="text-gray-400"' : 'class="text-blue-600"') + '>' + (bound ? '已绑定' : '关联') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="6" class="text-center text-gray-400 p-8">暂无可关联订单</td></tr>';
    }
    dialog.addEventListener('input',render); dialog.addEventListener('change',render);
    dialog.addEventListener('click',function(event) {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
      var button = event.target.closest('[data-order]'); if (!button || button.disabled) return;
      selectedOrder = api.orders().find(function(order){return order.key === button.dataset.order;});
      var profile = pbsStudents.find(selectedOrder.studentId), student = profile.student;
      document.getElementById('selectionOrderLabel').textContent = selectedOrder.student + ' · ' + (selectedOrder.orderNo || selectedOrder.projectNo);
      var values = {'stu-name':profile.name,'stu-level':student.level.replace('申请',''),'stu-phone':student.phone,'stu-address':student.address,'stu-country':student.country,'stu-major':student.major};
      Object.keys(values).forEach(function(id) { var input = document.getElementById(id); if(input) { input.value = values[id] || ''; if (id === 'stu-name' || id === 'stu-level') { input.readOnly = true; if(input.tagName === 'SELECT') input.disabled = true; } } });
      dialog.close();
    });
    dialog.addEventListener('close',function(){dialog.remove();}); render(); dialog.showModal();
  };
  function initList() {
    var table = document.querySelector('main table');
    table.querySelector('thead tr').innerHTML = ['序号','服务单号','关联申请订单','销售人员','学生姓名','申请层次','意向国家','意向专业','咨询状态','创建时间','操作'].map(function(label){return '<th class="px-5 py-4 text-left text-sm font-medium text-gray-500">' + label + '</th>';}).join('');
    var filter = document.getElementById('flt-status'); filter.innerHTML = '<option value="">全部</option>' + ['未选校','咨询中','已发送','已结单'].map(function(s){return '<option>' + s + '</option>';}).join('');
    var name = document.getElementById('stu-name');
    if (name) {
      name.closest('.grid.grid-cols-2').insertAdjacentHTML('beforebegin','<div class="mb-4"><label class="block text-sm text-gray-700 mb-2">学生档案与申请订单 <span class="text-red-500">*</span></label><button type="button" class="w-full text-left px-3 py-2 border rounded-lg text-sm text-blue-600" onclick="openSelectionOrderPicker()" id="selectionOrderLabel">选择学生档案与申请订单</button></div>');
      var oldOpen = window.openCreateModal;
      window.openCreateModal = function() { selectedOrder = null; oldOpen(); document.getElementById('selectionOrderLabel').textContent = '选择学生档案与申请订单'; name.readOnly = true; document.getElementById('stu-level').disabled = true; };
      window.submitCreateTask = function() {
        if (!selectedOrder) { toast('请关联学生档案与申请订单'); return; }
        selectedOrder = api.orders().find(function(order) { return order.key === selectedOrder.key; });
        if (!selectedOrder) { toast('关联订单已失效，请重新选择'); return; }
        var country = document.getElementById('stu-country').value.trim(), major = document.getElementById('stu-major').value.trim();
        if (!country || !major) { toast('请填写意向国家和意向专业'); return; }
        var item = api.create(selectedOrder,{sales:pbsGetSession().name,country:country,major:major,note:document.getElementById('order-remark').value.trim()});
        if (!item) { toast('该申请订单已绑定选校服务单'); return; }
        closeCreateModal(); renderList(); toast('选校服务单已创建');
      };
    }
    renderList();
  }
  function initWorkbench() {
    if (new URLSearchParams(location.search).get('mode') === 'catalog') return;
    var id = window.TASK_PROJECT_NO, item = api.find(id);
    if (!item || !api.visible().some(function(row){return row.id===id;})) { document.getElementById('schoolTaskContextBar').textContent = '选校服务单不存在或无权查看'; document.getElementById('schoolActionBar').hidden = true; return; }
    var bar = document.getElementById('schoolTaskContextBar'), profile = pbsStudents.find(item.studentId), summary = bar.firstElementChild.firstElementChild;
    summary.innerHTML = '<button class="pbs-detail-back" onclick="location.href=\'选校任务列表页 - 留学申请管理系统.html\'">‹</button><strong>' + esc(item.id) + '</strong><span>申请订单：' + esc(orderLabel(item)) + '</span><a class="text-blue-600" href="学生档案详情页 - 留学申请管理系统.html?studentId=' + encodeURIComponent(item.studentId) + '">' + esc(profile.name) + '</a><span>' + esc(item.level) + '</span><span id="selectionStatus">' + esc(item.status) + '</span><button class="text-blue-600" onclick="openStudentSupplement()">学生补充信息</button>';
    document.getElementById('taskNoteText').textContent = item.note || '—';
    var versions = JSON.parse(localStorage.getItem('pbs_selection_plan_versions_' + id) || '[]'), latest = versions[versions.length-1];
    currentPlanVersion = latest ? Number(latest.version.replace(/\D/g,'')) : 0;
    document.getElementById('planVersionLabel').textContent = latest ? latest.version : '—';
    if(latest) Object.keys(latest.zones).forEach(function(zone) { latest.zones[zone].forEach(function(school) { schoolReasons[school.id] = school.reason || ''; }); });
    if (latest || item.status === '未选校') {
      ['reach','match','safe'].forEach(function(zone) { document.getElementById('zone-'+zone).innerHTML = ''; if(latest) (latest.zones[zone] || []).forEach(function(school){ if(window.SCHOOL_INFO[school.id]) addToZone(zone,school.id); }); });
      refreshCounts();
    }
    var action = document.getElementById('schoolActionBar');
    action.insertAdjacentHTML('beforeend','<button class="px-5 h-11 border rounded-lg text-gray-700 bg-white" onclick="openSelectionActivity()">访问动态</button><button id="closeSelectionTask" class="px-5 h-11 border border-blue-200 rounded-lg text-blue-600 bg-white" onclick="completeSelectionTask()">手动接单</button>');
    function status() { var closed = api.find(id).status === '已结单'; document.getElementById('selectionStatus').textContent = api.find(id).status; action.querySelectorAll('button').forEach(function(button) { if (/保存方案|分享客户|手动接单/.test(button.textContent)) button.disabled = closed; }); }
    var oldSave = window.confirmSavePlan;
    window.confirmSavePlan = function() { if(!canWork(item) || api.find(id).status === '已结单') return; var before = localStorage.getItem('pbs_selection_plan_versions_' + id); oldSave(); if(before !== localStorage.getItem('pbs_selection_plan_versions_' + id)) { api.transition(id,'save'); status(); } };
    window.completeSelectionTask = function() { if(!canWork(item)) return; if(!confirm('确认该选校服务单已完成？')) return; api.transition(id,'close'); status(); toast('选校服务单已结单'); };
    window.sharePlan = function() {
      if(!canWork(item) || api.find(id).status === '已结单') return;
      var snapshots = JSON.parse(localStorage.getItem('pbs_selection_plan_versions_' + id) || '[]'), snapshot = snapshots[snapshots.length-1];
      if(!snapshot) { toast('请先保存方案'); return; }
      var share = {id:'H5-'+Date.now(),version:snapshot.version,at:new Date().toISOString(),snapshot:snapshot};
      item = api.find(id); item.shares.push(share); api.update(id,{shares:item.shares}); api.transition(id,'share'); status();
      var target = '选校方案分享H5 - PBS留学.html?service=' + encodeURIComponent(id) + '&share=' + encodeURIComponent(share.id), url = new URL(target,location.href).href;
      if(navigator.clipboard) navigator.clipboard.writeText(url).catch(function(){});
      window.open(target,'_blank'); toast('H5链接已生成');
    };
    window.openSelectionActivity = function() {
      var current = api.find(id), dialog = document.createElement('dialog'); dialog.style.cssText = 'position:fixed;inset:0 0 0 auto;margin:0;width:min(560px,96vw);height:100vh;max-height:100vh;border:0;padding:0';
      dialog.innerHTML = '<div class="px-6 py-5 border-b flex justify-between"><h3 class="font-semibold">H5 访问动态</h3><button aria-label="关闭">×</button></div><div class="p-6"><div class="grid grid-cols-3 gap-4 mb-6">' + [['发送次数',current.shares.length],['访问次数',current.visits.filter(function(v){return v.kind==='打开方案';}).length],['访客数',new Set(current.visits.map(function(v){return v.visitor;})).size]].map(function(pair){return '<div><p class="text-xs text-gray-500">'+pair[0]+'</p><p class="text-2xl mt-2">'+pair[1]+'</p></div>';}).join('') + '</div><div style="max-height:75vh;overflow:auto">' + current.visits.slice().reverse().map(function(v){return '<div class="py-4 border-t"><p class="text-xs text-gray-400">'+time(v.at)+' · '+esc(v.version)+'</p><p class="text-sm mt-2">'+esc(v.visitor)+' · '+esc(v.kind)+(v.school?' · '+esc(v.school):'')+'</p></div>';}).join('') + (!current.visits.length?'<p class="text-gray-400 text-sm py-8">暂无访问记录</p>':'') + '</div></div>';
      dialog.querySelector('button').onclick=function(){dialog.close();};dialog.onclose=function(){dialog.remove();};document.body.appendChild(dialog);dialog.showModal();
    };
    status(); if(!canWork(item)) action.querySelectorAll('button').forEach(function(button){if(/保存方案|分享客户|手动接单/.test(button.textContent))button.hidden=true;});
  }
  document.addEventListener('DOMContentLoaded',function() {
    api.seed();
    if (/选校任务列表|选校订单池/.test(file)) initList();
    if (/选校工作台/.test(file)) initWorkbench();
  });
  window.addEventListener('storage',function(event){ if(event.key === 'pbs_selection_services_v1' && /选校任务列表|选校订单池/.test(file)) renderList(); });
})();
