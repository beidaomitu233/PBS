(function () {
  'use strict';
  var pool = !!document.getElementById('poolTbody'), tbody = document.getElementById(pool ? 'poolTbody' : 'myProjTbody');
  if (!tbody) return;
  var table = tbody.closest('table'), page = 1, size = 20, pager, pendingTrigger;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function session() { return window.pbsGetSession(); }
  function managerName() { var s = session(); return s.account === 'demo_admin' ? '张老师' : s.name; }
  function scoped() {
    var s = session();
    return window.pbsProjects.all().filter(function(p) {
      if (s.org && p.org && p.org !== (s.org === 'PBS留学' ? 'PBS留学总部' : s.org) && s.role !== '超级管理员' && s.role !== '平台运维人员') return false;
      if (pool) return s.role !== '项目经理' || p.projectManager === managerName() || (p.createdBy === s.name && p.source === '线下');
      return !!p.projectManager && (s.role !== '项目经理' || p.projectManager === managerName());
    });
  }
  function status(p) { return window.pbsProjects.statusOf(p); }
  function time(value) {
    if (!value) return '—';
    if (String(value).indexOf('T') >= 0) return new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).slice(0, 16);
    return String(value).slice(0, 16);
  }
  function open(projectNo, action) { location.href = (pool && session().role !== '项目经理' ? '项目详情页 - 留学申请管理系统.html' : '我的项目详情页 - 留学申请管理系统.html') + '?project=' + encodeURIComponent(projectNo) + (action ? '&action=' + action : ''); }
  function cell(value, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(value || '—') + '</td>'; }
  function button(label, action) { return '<button type="button" data-project-action="' + action + '">' + label + '</button>'; }
  function render() {
    var records = scoped().filter(function(p) { return pool || status(p) !== '待接收'; });
    if (pool) records.sort(function(a,b) { return String(a.orderNo || a.projectNo).localeCompare(String(b.orderNo || b.projectNo)) || a.projectNo.localeCompare(b.projectNo); });
    var headings = pool ? ['序号','商城订单号','项目号','客户姓名','学生姓名','申请层次','项目状态','项目经理','分配时间','备注','订单创建时间','操作'] : ['序号','项目号','客户姓名','学生姓名','申请层次','项目状态','项目经理','分配时间','备注','操作'];
    table.querySelector('thead tr').innerHTML = headings.map(function(label,index) { return '<th' + (label === '商城订单号' ? ' class="project-order-heading"' : index === headings.length-1 ? ' class="project-actions"' : '') + '>' + label + '</th>'; }).join('');
    tbody.innerHTML = records.map(function(p) {
      var state = status(p), actions = button('查看详情','view');
      var remark = window.pbsProjects.getAssignment(p.projectNo).taskNote || '';
      var fullyAssigned = window.pbsProjects.assignmentComplete(p);
      if (pool && state !== '已结项') {
        if (fullyAssigned ? window.pbsHasPermission('project_change_pm') : window.pbsHasPermission('project_assign_pm')) actions += button(fullyAssigned ? '更换人员' : '分配', fullyAssigned ? 'change' : 'assign');
        if (p.projectManager && window.pbsHasPermission('project_pool_urge')) actions += button('催办','urge');
      }
      if (!pool && state !== '已结项' && session().role !== '项目经理' && window.pbsHasPermission('my_project_urge')) actions += button('催办','urge');
      return '<tr data-project="' + esc(p.projectNo) + '" data-order="' + esc(p.orderNo) + '" data-kw="' + esc([p.projectNo,p.orderNo,p.customer,p.student,p.level,p.projectManager,remark,p.rejectReason,p.source,state].join(' ')) + '" data-name="' + esc(p.customer) + '" data-applicant="' + esc(p.student) + '" data-student="' + esc(p.student) + '" data-level="' + esc(p.level) + '" data-status="' + state + '" data-pm="' + esc(p.projectManager) + '" data-created="' + time(p.createdAt) + '" data-time="' + time(p.assignedAt) + '" class="' + (p.rejectedAt && !p.projectManager ? 'pbs-returned-row' : '') + '">'
        + cell('','project-row-index') + (pool ? '<td class="project-order">' + esc(p.orderNo || '—') + '</td>' : '') + cell(p.projectNo,'project-number') + cell(p.customer) + cell(p.student) + cell(p.level)
        + '<td><span class="project-state" data-status="' + state + '">' + state + '</span></td>' + cell(p.projectManager) + cell(time(p.assignedAt),'project-number')
        + '<td class="project-remark" title="' + esc(remark) + '">' + esc(remark || '—') + '</td>' + (pool ? cell(time(p.createdAt),'project-number') : '') + '<td class="project-actions"><div>' + actions + '</div></td></tr>';
    }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="' + headings.length + '" style="text-align:center;padding:48px;color:#94a3b8">暂无符合条件的项目</td></tr>';
    page = 1; keyword(); updatePendingBadge();
    if (window.PBSAdvancedFilter && window.PBSAdvancedFilter.refresh) window.PBSAdvancedFilter.refresh(true);
    var create = document.getElementById('btn-create-offline-project'); if (create) create.classList.toggle('hidden',['超级管理员','机构管理员','项目经理'].indexOf(session().role) < 0);
  }
  function keyword() {
    var input = document.getElementById('flt-kw'), value = input ? input.value.trim().toLowerCase() : '';
    tbody.querySelectorAll('tr[data-project]').forEach(function(row) { row.classList.toggle('pbs-project-keyword-hidden',row.dataset.kw.toLowerCase().indexOf(value) < 0); });
    paginate(true);
  }
  function paginate(resetPage) {
    if (!pager) return; if (resetPage) page = 1;
    var all = Array.from(tbody.querySelectorAll('tr[data-project]')), matches = all.filter(function(row) { return !row.classList.contains('pbs-project-keyword-hidden') && !row.classList.contains('pbs-advanced-filter-hidden'); });
    var pages = Math.max(1,Math.ceil(matches.length/size)); page = Math.min(page,pages);
    all.forEach(function(row) { row.classList.add('pbs-project-page-hidden'); var order = row.querySelector('.project-order'); if (order) { order.rowSpan = 1; order.style.display = ''; order.textContent = row.dataset.order || '—'; order.classList.remove('project-order-shared'); } });
    var visible = matches.slice((page-1)*size,page*size), orderGroups = {};
    visible.forEach(function(row,index) { row.classList.remove('pbs-project-page-hidden'); row.querySelector('.project-row-index').textContent = (page-1)*size+index+1; if (pool && row.dataset.order) { var key = row.dataset.order; (orderGroups[key] || (orderGroups[key]=[])).push(row); } });
    Object.keys(orderGroups).forEach(function(key) { var group = orderGroups[key], first = group[0].querySelector('.project-order'); if (group.length < 2) return; first.rowSpan = group.length; first.classList.add('project-order-shared'); first.innerHTML = '<strong>' + esc(key) + '</strong><small>共 ' + group.length + ' 个子订单</small>'; group.slice(1).forEach(function(row) { row.querySelector('.project-order').style.display = 'none'; }); });
    document.getElementById('flt-empty').classList.toggle('hidden',matches.length > 0);
    pager.querySelector('[data-project-count]').textContent = matches.length;
    pager.querySelector('nav').innerHTML = '<button type="button" data-project-page="prev" ' + (page===1?'disabled':'') + '>上一页</button>' + Array.from({length:pages},function(_,i){return '<button type="button" data-project-page="' + (i+1) + '" ' + (page===i+1?'aria-current="page"':'') + '>' + (i+1) + '</button>';}).join('') + '<button type="button" data-project-page="next" ' + (page===pages?'disabled':'') + '>下一页</button>';
  }
  function pending() { return scoped().filter(function(p) { return p.projectManager === managerName() && status(p) === '待接收'; }); }
  function updatePendingBadge() {
    var count = pending().length; ['pendingTaskBadge','pendingDrawerCount'].forEach(function(id) { var el=document.getElementById(id); if(el) { el.textContent=count; if(id==='pendingTaskBadge') el.classList.toggle('hidden',!count); } });
  }
  function renderPending() {
    var records = pending(), list=document.getElementById('pendingTaskList'), empty=document.getElementById('pendingTaskEmpty'); if(!list) return;
    list.classList.toggle('hidden',!records.length); empty.classList.toggle('hidden',!!records.length);
    list.innerHTML=records.map(function(p) { return '<section class="project-pending-card" data-pending-project="' + esc(p.projectNo) + '"><strong>' + esc(p.student) + ' · ' + esc(p.level) + '</strong><dl><dt>项目号</dt><dd>' + esc(p.projectNo) + '</dd><dt>客户姓名</dt><dd>' + esc(p.customer) + '</dd><dt>院校目标</dt><dd>' + esc(p.packages.map(function(item){return item.school+' · '+item.major;}).join('；')) + '</dd><dt>分配时间</dt><dd>' + time(p.assignedAt) + '</dd></dl><footer><button type="button" data-pending-action="accept">接收</button><button type="button" data-pending-action="return">退回</button></footer></section>'; }).join(''); updatePendingBadge();
  }
  function openPending() {
    pendingTrigger = document.activeElement;
    renderPending();
    document.getElementById('pendingDrawerMask').classList.remove('hidden');
    var drawer = document.getElementById('pendingDrawer');
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-label', '待处理任务');
    drawer.classList.remove('translate-x-full');
    drawer.querySelector('[data-dom-id="btn-close-pending-drawer"]').focus();
  }
  function closePending() {
    document.getElementById('pendingDrawerMask').classList.add('hidden');
    document.getElementById('pendingDrawer').classList.add('translate-x-full');
    if (pendingTrigger && pendingTrigger.isConnected) pendingTrigger.focus();
  }
  function urge(project) {
    if (window.openUrgeModal) { window.openUrgeModal(project.student + ' · ' + project.projectNo,project.projectManager,'项目经理'); return; }
    window.pbsCreateNotification({kind:'task_urge',type:'项目催办提醒',title:project.student+'的项目收到催办',business:project.projectNo,recipientName:project.projectManager,recipientRoles:['项目经理'],organization:project.org,href:'我的项目详情页 - 留学申请管理系统.html?project='+encodeURIComponent(project.projectNo)});
    if(window.showToast) window.showToast('已向 '+project.projectManager+' 发送项目催办');
  }
  function init() {
    var imported; try { imported=JSON.parse(localStorage.getItem('pbs_offline_projects_v1')||'[]'); } catch(e){imported=[];}
    imported.forEach(function(p){if(!window.pbsProjects.find(p.projectNo)) window.pbsProjects.upsert(Object.assign({pmAccepted:!!p.projectManager},p));});
    var wrap=document.createElement('div'); wrap.className='pbs-project-table-scroll'; table.before(wrap); wrap.appendChild(table); table.className='pbs-project-table'+(pool?' is-pool':'');
    var oldPager=wrap.nextElementSibling; pager=document.createElement('div'); pager.className='pbs-project-pager'; pager.innerHTML='<div>共 <span data-project-count>0</span> 条记录，每页<select aria-label="每页条数"><option>10</option><option selected>20</option><option>50</option></select>条</div><nav aria-label="项目列表分页"></nav>'; oldPager.replaceWith(pager);
    pager.querySelector('select').onchange=function(){size=Number(this.value);paginate(true);}; pager.onclick=function(e){var button=e.target.closest('[data-project-page]');if(!button||button.disabled)return;var value=button.dataset.projectPage;page=value==='next'?page+1:value==='prev'?page-1:Number(value);paginate(false);};
    tbody.onclick=function(e){var button=e.target.closest('[data-project-action]'),row=e.target.closest('tr[data-project]');if(!row||!button)return;var p=window.pbsProjects.find(row.dataset.project),action=button.dataset.projectAction;if(action==='urge')urge(p);else open(p.projectNo,action==='view'?'':action);};
    var list=document.getElementById('pendingTaskList'); if(list) list.onclick=function(e){var button=e.target.closest('[data-pending-action]');if(!button)return;var id=button.closest('[data-pending-project]').dataset.pendingProject;if(button.dataset.pendingAction==='accept'){window.pbsProjects.acceptPM(id);if(window.pbsRecordOperation)window.pbsRecordOperation('项目管理','接收','接收项目 '+id);render();renderPending();}else window.pbsTaskReturn.confirm({kind:'project',label:id},function(reason){window.pbsProjects.rejectPM(id,reason.trim());if(window.pbsRecordOperation)window.pbsRecordOperation('项目管理','退回','退回项目 '+id+'：'+reason.trim());render();renderPending();});};
    document.getElementById('flt-kw').addEventListener('keydown', function(e) { if (e.key === 'Enter') window.applyFilter(); });
    document.getElementById('flt-kw').addEventListener('input', function() { if (!this.value) keyword(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && document.getElementById('pendingDrawerMask') && !document.getElementById('pendingDrawerMask').classList.contains('hidden') && !document.getElementById('pbsTaskReturnDialog')) closePending(); });
    render();
  }
  window.pbsProjectList={render:render,filterChanged:function(){paginate(true);},managerName:managerName};
  window.updatePendingBadge=updatePendingBadge;
  window.applyFilter = function() { keyword(); if(window.PBSAdvancedFilter && window.PBSAdvancedFilter.refresh) window.PBSAdvancedFilter.refresh(); };
  window.resetFilter = function() { document.getElementById('flt-kw').value = ''; keyword(); if(window.PBSAdvancedFilter && window.PBSAdvancedFilter.reset) window.PBSAdvancedFilter.reset(); };
  window.openPendingDrawer=openPending; window.closePendingDrawer=closePending;
  window.openPoolProjectDetail=function(id){open(id);}; window.openMyProjectDetail=function(id){open(id);};
  window.renderOfflineProjects=render; window.renderOfflineMyProjects=render; window.configurePoolRoleView=function(){}; window.syncStaticRowsFromStore=render; window.renderOrderReferences=function(){};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('storage',function(e){if(e.key==='pbs_projects_v1') {render();if(!pool)renderPending();}});
})();
