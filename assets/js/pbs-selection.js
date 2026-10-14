(function () {
  'use strict';
  var api = window.pbsSelection;
  var file = decodeURIComponent(location.pathname).split('/').pop();
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function time(value) { return value ? new Date(value).toLocaleString('sv-SE').slice(0,16) : '—'; }
  function toast(value) { (window.planToast || window.showToast || window.alert)(value); }
  function link(item, page) { return page + '?service=' + encodeURIComponent(item.id); }
  function orderLabel(item) { var orders = api.bindings().filter(function(row) { return row.serviceId === item.id; }).map(function(row) { return row.orderNo || '—'; }); return orders.length ? Array.from(new Set(orders)).join('、') : '—'; }
  function canWork(item) { var role = pbsGetSession().role; return role === '超级管理员' || role === '销售人员' && item.sales === pbsGetSession().name; }
  function renderList() {
    var body = document.getElementById('selTaskTbody') || document.querySelector('main tbody');
    if (!body) return;
    body.innerHTML = api.visible().map(function(item,index) {
      var student = item.student;
      var data = {project:item.id,sales:item.sales,student:student,level:item.level,country:item.country,major:item.major,status:item.status,time:item.createdAt.slice(0,10)};
      data.kw = Object.values(data).join(' ') + ' ' + orderLabel(item);
      return '<tr class="hover:bg-gray-50" ' + Object.keys(data).map(function(key) { return 'data-' + key + '="' + esc(data[key]) + '"'; }).join(' ') + '><td class="px-5 py-4 text-sm">' + (index+1) + '</td><td class="px-5 py-4 text-sm font-medium">' + esc(item.id) + '</td><td class="px-5 py-4 text-sm text-center">' + esc(orderLabel(item)) + '</td><td class="px-5 py-4 text-sm">' + esc(item.sales) + '</td><td class="px-5 py-4 text-sm">' + esc(student) + '</td><td class="px-5 py-4 text-sm">' + esc(item.level) + '</td><td class="px-5 py-4 text-sm">' + esc(item.country) + '</td><td class="px-5 py-4 text-sm">' + esc(item.major) + '</td><td class="px-5 py-4 text-sm">' + esc(item.status) + '</td><td class="px-5 py-4 text-sm">' + time(item.createdAt) + '</td><td class="px-5 py-4 text-sm whitespace-nowrap">' + (canWork(item) ? '<a class="text-blue-600 mr-3" href="' + link(item,'选校工作台页 - 留学申请管理系统.html') + '">进入工作台</a>' : '') + '<a class="text-blue-600" href="' + link(item,'选校方案未生成 - 留学申请管理系统.html') + '">查看方案</a></td></tr>';
    }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="11" class="p-8 text-center text-sm text-gray-400">暂无符合条件的选校服务单</td></tr>';
    if (window.applyFilter) applyFilter();
  }
  function initList() {
    var table = document.querySelector('main table');
    table.querySelector('thead tr').innerHTML = ['序号','服务单号','关联申请订单','销售人员','学生姓名','申请层次','意向国家','意向专业','咨询状态','创建时间','操作'].map(function(label){return '<th class="px-5 py-4 text-left text-sm font-medium text-gray-500">' + label + '</th>';}).join('');
    var filter = document.getElementById('flt-status'); filter.innerHTML = '<option value="">全部</option>' + ['未选校','咨询中','已发送','已结单'].map(function(s){return '<option>' + s + '</option>';}).join('');
    if (document.getElementById('stu-name')) {
      window.submitCreateTask = function() {
        clearFieldErrors();
        var ids = ['stu-name','stu-level','stu-country','stu-major'], ok = true;
        ids.forEach(function(id) { var input = document.getElementById(id); if (!input.value.trim()) { showFieldError(input, '请填写' + ({'stu-name':'学生姓名','stu-level':'申请层次','stu-country':'意向国家','stu-major':'意向专业'})[id]); ok = false; } });
        if (!ok) return;
        var level = document.getElementById('stu-level').value;
        api.create({student:document.getElementById('stu-name').value.trim(), level:level.includes('申请')?level:level+'申请', gender:document.getElementById('stu-gender').value, birth:document.getElementById('stu-birth').value, phone:document.getElementById('stu-phone').value.trim(), address:document.getElementById('stu-address').value.trim(), country:document.getElementById('stu-country').value.trim(), major:document.getElementById('stu-major').value.trim(), note:document.getElementById('order-remark').value.trim()});
        closeCreateModal(); renderList(); toast('选校任务已创建');
      };
    }
    renderList();
  }
  function initWorkbench() {
    if (new URLSearchParams(location.search).get('mode') === 'catalog') return;
    var id = window.TASK_PROJECT_NO, item = api.find(id);
    if (!item || !api.visible().some(function(row){return row.id===id;})) { document.getElementById('schoolTaskContextBar').textContent = '选校服务单不存在或无权查看'; document.getElementById('schoolActionBar').hidden = true; return; }
    var bar = document.getElementById('schoolTaskContextBar'), summary = bar.firstElementChild;
    summary.className = 'selection-task-heading';
    summary.innerHTML = '<div class="selection-task-summary"><button class="pbs-detail-back" onclick="location.href=\'选校任务列表页 - 留学申请管理系统.html\'">‹</button><strong>' + esc(item.id) + '</strong><span>' + esc(item.student) + '</span><span>' + esc(item.level) + '</span><span>' + esc(item.country) + '</span><span id="selectionStatus">' + esc(item.status) + '</span></div><div class="selection-task-actions"><button class="selection-text-button" onclick="openStudentSupplement()">学生补充信息</button><button id="closeSelectionTask" class="selection-secondary-button" onclick="completeSelectionTask()">结单</button></div>';
    document.getElementById('workbenchHistoryContext').textContent = [item.student,item.level,item.country].join(' · ');
    document.getElementById('taskNoteText').textContent = item.note || '—';
    var versions = JSON.parse(localStorage.getItem('pbs_selection_plan_versions_' + id) || '[]'), latest = versions[versions.length-1];
    currentPlanVersion = latest ? Number(latest.version.replace(/\D/g,'')) : 0;
    document.getElementById('planVersionLabel').textContent = latest ? latest.version : '—';
    if(latest) Object.keys(latest.zones).forEach(function(zone) { latest.zones[zone].forEach(function(school) { schoolReasons[school.id] = school.reason || ''; }); });
    if (latest || item.status === '未选校') {
      document.querySelectorAll('#schoolList [data-school]').forEach(function(card) { updateSchoolListState(card.dataset.school, 'ready'); });
      ['reach','match','safe'].forEach(function(zone) { document.getElementById('zone-'+zone).innerHTML = ''; if(latest) (latest.zones[zone] || []).forEach(function(school){ if(window.SCHOOL_INFO[school.id]) addToZone(zone,school.id); }); });
      refreshCounts();
    }
    var action = document.getElementById('schoolActionBar');
    function status() {
      var closed = api.find(id).status === '已结单';
      document.getElementById('selectionStatus').textContent = api.find(id).status;
      document.getElementById('closeSelectionTask').hidden = !canWork(item) || closed;
      action.querySelectorAll('[data-selection-write]').forEach(function(button) { button.disabled = closed; button.hidden = !canWork(item); });
    }
    var oldSave = window.confirmSavePlan;
    window.confirmSavePlan = function() { if(!canWork(item) || api.find(id).status === '已结单') return; var before = localStorage.getItem('pbs_selection_plan_versions_' + id); oldSave(); if(before !== localStorage.getItem('pbs_selection_plan_versions_' + id)) { api.transition(id,'save'); status(); } };
    window.completeSelectionTask = function() { if(!canWork(item)) return; if(api.find(id).status === '已结单' || !confirm('确认结单？')) return; api.transition(id,'close'); status(); toast('选校服务单已结单'); };
    window.sharePlan = function() {
      if(!canWork(item) || api.find(id).status === '已结单') return;
      var snapshots = JSON.parse(localStorage.getItem('pbs_selection_plan_versions_' + id) || '[]'), snapshot = snapshots[snapshots.length-1];
      if(!snapshot) { toast('请先保存方案'); return; }
      var share = {id:'H5-'+Date.now(),version:snapshot.version,at:new Date().toISOString(),snapshot:snapshot};
      item = api.find(id); item.shares.push(share); api.update(id,{shares:item.shares}); api.transition(id,'share'); status();
      var target = '选校方案分享H5 - PBS留学.html?service=' + encodeURIComponent(id) + '&share=' + encodeURIComponent(share.id), url = new URL(target,location.href).href;
      if(navigator.clipboard) navigator.clipboard.writeText(url).catch(function(){});
      var dialog = document.createElement('dialog'); dialog.className = 'selection-share-dialog';
      dialog.innerHTML = '<header><h3>发送 H5</h3><button data-close aria-label="关闭">×</button></header><div class="selection-share-body"><input readonly value="' + esc(url) + '" aria-label="H5 链接"><div class="selection-share-actions"><a target="_blank" class="selection-secondary-button" href="' + esc(url + '&preview=1') + '">预览方案</a><button data-copy class="selection-primary-button">复制链接</button></div></div>';
      dialog.querySelector('[data-close]').onclick = function() { dialog.close(); };
      dialog.querySelector('[data-copy]').onclick = function() { if(navigator.clipboard) navigator.clipboard.writeText(url).then(function(){toast('链接已复制');}).catch(function(){dialog.querySelector('input').select();}); else dialog.querySelector('input').select(); };
      dialog.onclose = function(){dialog.remove();}; document.body.appendChild(dialog); dialog.showModal();
    };
    window.renderWorkbenchCommunications = function() {
      var messages = workbenchCommunications.map(function(row) { return Object.assign({kind:'communication'},row); });
      (api.find(id).visits || []).filter(function(row) { return row.kind === '打开方案' || row.kind === '查看方案'; }).forEach(function(row) { messages.push({id:row.id,time:row.at,kind:'view',content:'用户查看了选校方案' + (row.version ? '（' + row.version + '）' : '')}); });
      messages.sort(function(a,b){return new Date(b.time) - new Date(a.time);});
      document.getElementById('workbenchCommunicationTimeline').innerHTML = messages.length ? messages.map(function(row) {
        return '<div class="selection-history-message"><p class="selection-message-time">' + time(row.time) + (row.kind === 'communication' && row.actor ? ' · ' + esc(row.actor) : '') + '</p><p class="selection-message-content">' + esc(row.content) + '</p>' + (row.kind === 'communication' && canWork(item) ? '<div class="selection-message-actions"><button onclick="editWorkbenchCommunication(' + row.id + ')">编辑</button><button onclick="deleteWorkbenchCommunication(' + row.id + ')">删除</button></div>' : '') + '</div>';
      }).join('') : '<p class="text-sm text-gray-400">暂无记录</p>';
      document.getElementById('addWorkbenchCommunication').hidden = !canWork(item);
    };
    status();
  }
  document.addEventListener('DOMContentLoaded',function() {
    api.seed();
    if (/选校任务列表|选校订单池/.test(file)) initList();
    if (/选校工作台/.test(file)) initWorkbench();
  });
  window.addEventListener('storage',function(event){ if(event.key === 'pbs_selection_services_v1' || event.key === 'pbs_selection_order_bindings_v1') { if(/选校任务列表|选校订单池/.test(file)) renderList(); if(/选校工作台/.test(file) && window.renderWorkbenchCommunications && !document.getElementById('workbenchHistoryModal').classList.contains('hidden')) renderWorkbenchCommunications(); } });
})();
