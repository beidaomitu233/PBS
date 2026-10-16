(function () {
  'use strict';
  var pool = !!document.getElementById('poolTbody'), tbody = document.getElementById(pool ? 'poolTbody' : 'myProjTbody');
  if (!tbody) return;
  var table = tbody.closest('table'), page = 1, size = 20, pager, pendingTrigger;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function session() { return window.pbsGetSession(); }
  function managerView() { var s = session(); return s.role === '项目经理' && (s.roles || [s.role]).length === 1; }
  function managerName() { return window.pbsOrders.name('项目经理'); }
  function returnedByMe(item) { var s = session(); return (s.roles || [s.role]).indexOf('项目经理') >= 0 && item.kind === 'manager' && (item.returnedAccount ? item.returnedAccount === s.account : item.returnedBy === managerName() || item.returnedBy === s.name); }
  function returnsFor(project) { return pbsOrders.returns(project).filter(function(item) { return pool || !managerView() || pbsOrders.canHandleGoal(project,item.goalId,true) || returnedByMe(item); }); }
  function scoped() {
    var s = session();
    return window.pbsProjects.all().filter(function(p) {
      if (s.org && p.org && p.org !== (s.org === 'PBS留学' ? 'PBS留学总部' : s.org) && s.role !== '超级管理员' && s.role !== '平台运维人员') return false;
      if (pbsOrders.canAssignOwner(p)) return true;
      var roles = s.roles || [s.role];
      if (roles.indexOf('PMO') >= 0 || roles.indexOf('项目经理') >= 0) return pbsOrders.canManage(p) || (p.packages || []).some(function(goal) { return pbsOrders.canHandleGoal(p,goal.id); }) || pbsOrders.returns(p).some(returnedByMe);
      return pool || pbsOrders.canAssignOwner(p) || !!p.projectManager;
    });
  }
  function status(p) { return window.pbsProjects.statusOf(p); }
  function time(value) {
    if (!value) return '—';
    if (String(value).indexOf('T') >= 0) return new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).slice(0, 16);
    return String(value).slice(0, 16);
  }
  function open(projectNo, action, goalId, taskKind, doc) { var deliveryTask = ['document','review','application'].indexOf(taskKind) >= 0; location.href = (!deliveryTask && (pool || taskKind === 'owner' || taskKind === 'manager') ? '项目详情页 - 留学申请管理系统.html' : '我的项目详情页 - 留学申请管理系统.html') + '?project=' + encodeURIComponent(projectNo) + (goalId ? '&school=' + encodeURIComponent(goalId) : '') + (action ? '&action=' + action : '') + (taskKind ? '&task=' + encodeURIComponent(taskKind) : '') + (doc ? '&doc=' + encodeURIComponent(doc) : ''); }
  function cell(value, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(value || '—') + '</td>'; }
  function button(label, action) { return '<button type="button" data-project-action="' + action + '">' + label + '</button>'; }
  function render() {
    var records = scoped().map(function(p) { var returns = returnsFor(p); if (!pool && managerView()) { var assigned = (p.packages || []).filter(function(goal) { return pbsOrders.canHandleGoal(p,goal.id); }); return Object.assign({},p,{projectManager:assigned.length ? managerName() : '',packages:assigned,returnOnly:!assigned.length,returnItems:returns}); } return Object.assign({},p,{returnItems:returns}); }).filter(function(p) { return pool || p.packages.length || p.returnItems.length; });
    if (pool) records.sort(function(a,b) { return String(a.orderNo || a.projectNo).localeCompare(String(b.orderNo || b.projectNo)) || a.projectNo.localeCompare(b.projectNo); });
    var headings = pool ? ['序号','商城订单号','PMO','项目号','客户姓名','学生姓名','申请层次','项目状态','项目经理','分配时间','备注','订单创建时间','操作'] : ['序号','项目号','客户姓名','学生姓名','申请层次','项目状态','PMO','项目经理','分配时间','备注','操作'];
    table.querySelector('thead tr').innerHTML = headings.map(function(label,index) { return '<th' + (label === '商城订单号' ? ' class="project-order-heading"' : label === 'PMO' ? ' class="project-pmo"' : index === headings.length-1 ? ' class="project-actions"' : '') + '>' + label + '</th>'; }).join('');
    tbody.innerHTML = records.map(function(p) {
      var state = status(p), actions = p.returnOnly ? '' : button('查看详情','view');
      var remark = window.pbsProjects.getAssignment(p.projectNo).taskNote || '';
      var fullyAssigned = window.pbsProjects.assignmentComplete(p) && !!pbsOrders.state(p).pmoName && (p.packages || []).every(function(goal) { return !!pbsOrders.manager(p,goal.id).name; });
      if (pool && state !== '已结项') {
        var owner = pbsOrders.state(p);
        if (pbsOrders.canAssignOwner(p)) actions += button(fullyAssigned ? '更换人员' : '分配',fullyAssigned ? 'change' : 'assign');
        else if (pbsOrders.canManage(p)) actions += button(fullyAssigned ? '更换人员' : '分配','assign');
        if (owner.pmoName) actions += button('催办','urge');
      }
      if (!pool && state !== '已结项' && session().role !== '项目经理' && window.pbsHasPermission('my_project_urge')) actions += button('催办','urge');
      return '<tr data-project-returns="true" data-project="' + esc(p.projectNo) + '" data-order="' + esc(p.orderNo) + '" data-kw="' + esc([p.projectNo,p.orderNo,p.customer,p.student,p.level,p.projectManager,pbsOrders.state(p).pmoName,remark,p.returnItems.map(function(item) { return [item.reason,item.returnedBy,item.school].join(' '); }).join(' '),p.source,state].join(' ')) + '" data-name="' + esc(p.customer) + '" data-applicant="' + esc(p.student) + '" data-student="' + esc(p.student) + '" data-level="' + esc(p.level) + '" data-status="' + state + '" data-pm="' + esc(p.projectManager) + '" data-created="' + time(p.createdAt) + '" data-time="' + time(p.assignedAt) + '">'
        + cell('','project-row-index') + (pool ? '<td class="project-order">' + esc(p.orderNo || '—') + '</td>' + cell(pbsOrders.state(p).pmoName,'project-pmo') : '') + cell(p.projectNo,'project-number') + cell(p.customer) + cell(p.student) + cell(p.level)
        + '<td><span class="project-state" data-status="' + state + '">' + state + '</span></td>' + (!pool ? cell(pbsOrders.state(p).pmoName,'project-pmo') : '') + cell(p.projectManager) + cell(time(p.assignedAt),'project-number')
        + '<td class="project-remark" title="' + esc(remark) + '">' + esc(remark || '—') + '</td>' + (pool ? cell(time(p.createdAt),'project-number') : '') + '<td class="project-actions"><div>' + actions + '</div></td></tr>';
    }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="' + headings.length + '" style="text-align:center;padding:48px;color:#94a3b8">暂无符合条件的项目</td></tr>';
    page = 1; keyword(); updatePendingBadge();
    var drawer = document.getElementById('pendingDrawer');
    if (drawer && !drawer.classList.contains('translate-x-full')) renderPending();
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
    all.forEach(function(row) { row.classList.add('pbs-project-page-hidden'); var pmo = row.querySelector('.project-pmo'); if(pmo) { pmo.rowSpan=1; pmo.style.display=''; pmo.classList.remove('project-pmo-shared'); } var order = row.querySelector('.project-order'); if (order) { order.rowSpan = 1; order.style.display = ''; order.textContent = row.dataset.order || '—'; order.classList.remove('project-order-shared'); } });
    var visible = matches.slice((page-1)*size,page*size), orderGroups = {};
    visible.forEach(function(row,index) { row.classList.remove('pbs-project-page-hidden'); row.querySelector('.project-row-index').textContent = (page-1)*size+index+1; if (pool && row.dataset.order) { var key = row.dataset.order; (orderGroups[key] || (orderGroups[key]=[])).push(row); } });
    Object.keys(orderGroups).forEach(function(key) { var group = orderGroups[key], first = group[0].querySelector('.project-order'); if (group.length < 2) return; first.rowSpan = group.length; var pmo = group[0].querySelector('.project-pmo'); if(pmo) { pmo.rowSpan=group.length; pmo.classList.add('project-pmo-shared'); group.slice(1).forEach(function(row) { row.querySelector('.project-pmo').style.display='none'; }); } first.classList.add('project-order-shared'); first.innerHTML = '<strong>' + esc(key) + '</strong><small>共 ' + group.length + ' 个子订单</small>'; group.slice(1).forEach(function(row) { row.querySelector('.project-order').style.display = 'none'; }); });
    document.getElementById('flt-empty').classList.toggle('hidden',matches.length > 0);
    pager.querySelector('[data-project-count]').textContent = matches.length;
    pager.querySelector('nav').innerHTML = '<button type="button" data-project-page="prev" ' + (page===1?'disabled':'') + '>上一页</button>' + Array.from({length:pages},function(_,i){return '<button type="button" data-project-page="' + (i+1) + '" ' + (page===i+1?'aria-current="page"':'') + '>' + (i+1) + '</button>';}).join('') + '<button type="button" data-project-page="next" ' + (page===pages?'disabled':'') + '>下一页</button>';
  }
  function pending() {
    var seenOrders = {};
    return scoped().flatMap(function(project) {
      if (project.status === '已结项') return [];
      var seen = {}, records = [], owner = pbsOrders.state(project), orderId = pbsOrders.key(project);
      if (pool && !seenOrders[orderId]) {
        seenOrders[orderId] = true;
        if (pbsOrders.canManage(project) && owner.pmoAccepted === false) records.push(Object.assign({},project,{pendingType:'accept',pendingScope:'owner',packages:pbsOrders.members(project).flatMap(function(item) { return item.packages || []; }),assignedAt:owner.assignedAt}));
        var ownerReturn = (owner.returnHistory || []).slice().reverse().find(function(item) { return !item.handledAt; });
        if (ownerReturn && pbsOrders.canAssignOwner(project)) records.push(Object.assign({},project,{pendingType:'assign',pendingScope:'owner',pendingReturn:ownerReturn,assignedAt:ownerReturn.returnedAt}));
      }
      pbsOrders.returns(project).forEach(function(item) {
        if (!item.pending) return;
        var goal = (project.packages || []).find(function(goal) { return goal.id === item.goalId; });
        if (!goal) return;
        var allowed = pool
          ? item.kind === 'manager' && pbsOrders.canManage(project)
          : ['document','review','application'].indexOf(item.kind) >= 0 && pbsOrders.canHandleGoal(project,goal.id,true) && pbsHasPermission('my_project_team_manage');
        var key = [goal.id,item.kind,item.doc || ''].join('|');
        if (!allowed || seen[key]) return;
        seen[key] = true;
        records.push(Object.assign({},project,{pendingType:'assign',pendingGoal:goal.id,packages:[goal],pendingReturn:item,assignedAt:item.returnedAt}));
      });
      (project.packages || []).forEach(function(goal) {
        var manager = pbsOrders.manager(project,goal.id);
        if (!pool && pbsOrders.canHandleGoal(project,goal.id) && !manager.accepted) records.push(Object.assign({},project,{pendingType:'accept',pendingGoal:goal.id,packages:[goal],assignedAt:manager.assignedAt}));
      });
      return records;
    }).sort(function(a,b) { return String(b.assignedAt || '').localeCompare(String(a.assignedAt || '')); });
  }
  function updatePendingBadge() {
    var count = pending().length; ['pendingTaskBadge','pendingDrawerCount'].forEach(function(id) { var el=document.getElementById(id); if(el) { el.textContent=count; if(id==='pendingTaskBadge') el.classList.toggle('hidden',!count); } });
  }
  function taskPeople(project) {
    var owner = pbsOrders.state(project), manager = project.pendingGoal ? pbsOrders.manager(project,project.pendingGoal) : {};
    var item = project.pendingReturn, sender, recipient, senderRole, recipientRole;
    if (item) {
      sender = item.returnedBy;
      recipient = item.returnedTo || (item.kind === 'owner' ? owner.assignedBy || '机构管理员' : item.kind === 'manager' ? owner.pmoName || manager.assignedBy || 'PMO' : manager.name || '项目经理');
      senderRole = {owner:'PMO',manager:'项目经理',document:'文书人员',review:'文书审核',application:'网申人员'}[item.kind];
      recipientRole = item.kind === 'owner' ? '机构管理员' : item.kind === 'manager' ? 'PMO' : '项目经理';
    } else if (project.pendingScope === 'owner') {
      sender = owner.assignedBy || '机构管理员'; recipient = owner.pmoName;
    } else {
      sender = manager.assignedBy || owner.pmoName || 'PMO'; recipient = manager.name;
    }
    return {sender:sender || '—',recipient:recipient || '—',senderRole:senderRole,recipientRole:recipientRole};
  }
  function renderPending() {
    var records = pending(), list=document.getElementById('pendingTaskList'), empty=document.getElementById('pendingTaskEmpty'); if(!list) return;
    list.classList.toggle('hidden',!records.length); empty.classList.toggle('hidden',!!records.length);
    list.innerHTML=records.map(function(p,index) {
      var returned = p.pendingType === 'assign', item = p.pendingReturn, people = taskPeople(p);
      var task = returned ? ({owner:'PMO 分配',manager:'项目经理分配',document:'文书交付',review:'文书审核',application:'网申任务'}[item.kind]) : p.pendingScope === 'owner' ? 'PMO 分配' : '院校目标分配';
      var icon = '<div class="project-pending-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/></svg></div>';
      var heading = '<h3>' + (returned ? '分配被退回' : '待接收任务') + '</h3>';
      function field(label,value) { return '<div class="project-pending-field"><dt>' + label + '</dt><dd>' + esc(value) + '</dd></div>'; }
      var fields = field('学生姓名',p.student) + field('院校目标',p.packages.map(function(goal){return goal.school+' · '+goal.major;}).join('；')) + field('任务类型',task);
      if (returned && item.doc) fields += field('文书类型',item.doc);
      fields += field('申请层次',p.level);
      if (returned) fields += field('退回时间',time(p.assignedAt));
      var returnDetail = '';
      if (returned) {
        var reasonId = 'projectPendingReason-' + index;
        var direction = '<span class="project-pending-direction" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 12h16m-6-6 6 6-6 6"/></svg></span>';
        returnDetail = '<div class="project-pending-return"><div class="project-pending-people" role="group" aria-label="退回人员"><div><span>退回人</span><strong>' + esc(people.sender) + '</strong><small>' + esc(people.senderRole) + '</small></div>' + direction + '<div><span>退回给</span><strong>' + esc(people.recipient) + '</strong><small>' + esc(people.recipientRole) + '</small></div></div><div class="project-pending-reason"><div class="project-pending-reason-heading"><span>退回原因</span><button type="button" class="project-pending-reason-toggle" data-pending-action="toggle-reason" aria-expanded="false" aria-controls="' + reasonId + '" hidden>展开</button></div><p id="' + reasonId + '" data-pending-reason>' + esc(item.reason || '—') + '</p></div></div>';
      } else {
        fields += field('分配关系',people.sender + ' → ' + people.recipient) + field('分配时间',time(p.assignedAt));
      }
      return '<section class="project-pending-card" data-pending-project="' + esc(p.projectNo) + '" data-pending-goal="' + esc(p.pendingGoal || '') + '" data-pending-scope="' + (p.pendingScope || 'goal') + '" data-pending-type="' + p.pendingType + '" data-pending-kind="' + esc(returned ? item.kind : '') + '" data-pending-doc="' + esc(returned ? item.doc || '' : '') + '"><header>' + icon + heading + '</header><dl>' + fields + '</dl>' + returnDetail + '<footer>' +
        (returned ? '<button type="button" data-pending-action="assign">分配</button>' : '<button type="button" data-pending-action="accept">接收</button><button type="button" data-pending-action="return">退回</button>') + '</footer></section>';
    }).join('');
    list.querySelectorAll('[data-pending-reason]').forEach(function(reason) {
      reason.parentElement.querySelector('[data-pending-action="toggle-reason"]').hidden = reason.scrollHeight <= reason.clientHeight + 1;
    });
    updatePendingBadge();
  }
  function handlePendingAction(e) {
    var button = e.target.closest('[data-pending-action]'); if (!button) return;
    var card = button.closest('[data-pending-project]'), id = card.dataset.pendingProject, goalId = card.dataset.pendingGoal, ownerTask = card.dataset.pendingScope === 'owner';
    if (button.dataset.pendingAction === 'toggle-reason') {
      var expanded = button.getAttribute('aria-expanded') !== 'true';
      card.querySelector('[data-pending-reason]').classList.toggle('is-expanded',expanded);
      button.setAttribute('aria-expanded',String(expanded)); button.textContent = expanded ? '收起' : '展开'; return;
    }
    if (button.dataset.pendingAction === 'assign') { closePending(); open(id,'assign',goalId,card.dataset.pendingKind,card.dataset.pendingDoc); return; }
    if (button.dataset.pendingAction === 'accept') {
      if (ownerTask) pbsOrders.acceptOwner(id); else window.pbsProjects.acceptPM(id,goalId);
      if (window.pbsRecordOperation) window.pbsRecordOperation('项目管理','接收','接收项目 '+id);
      render(); return;
    }
    window.pbsTaskReturn.confirm({kind:'project',label:id},function(reason) {
      if (ownerTask) pbsOrders.rejectOwner(id,reason.trim()); else window.pbsProjects.rejectPM(id,reason.trim(),goalId);
      if (window.pbsRecordOperation) window.pbsRecordOperation('项目管理','退回','退回项目 '+id+'：'+reason.trim());
      render();
    });
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
  function urge(project,goalId) {
    var owner = pbsOrders.state(project), institutional = pbsOrders.canAssignOwner(project);
    var recipient = institutional ? owner.pmoName : goalId ? pbsOrders.manager(project,goalId).name : project.projectManager, role = institutional ? 'PMO' : '项目经理';
    if (window.openUrgeModal) { window.openUrgeModal(project.student + ' · ' + project.projectNo,recipient,role); return; }
    window.pbsCreateNotification({kind:'task_urge',type:'项目催办提醒',title:project.student+'的项目收到催办',business:project.projectNo,recipientName:recipient,recipientRoles:[role],organization:project.org,href:(institutional ? '项目详情页 - 留学申请管理系统.html' : '我的项目详情页 - 留学申请管理系统.html')+'?project='+encodeURIComponent(project.projectNo)});
    if(window.showToast) window.showToast('已向 '+recipient+' 发送项目催办');
  }
  function init() {
    var imported; try { imported=JSON.parse(localStorage.getItem('pbs_offline_projects_v1')||'[]'); } catch(e){imported=[];}
    imported.forEach(function(p){if(!window.pbsProjects.find(p.projectNo)) window.pbsProjects.upsert(Object.assign({pmAccepted:!!p.projectManager},p));});
    var wrap=document.createElement('div'); wrap.className='pbs-project-table-scroll'; table.before(wrap); wrap.appendChild(table); table.className='pbs-project-table'+(pool?' is-pool':'');
    var oldPager=wrap.nextElementSibling; pager=document.createElement('div'); pager.className='pbs-project-pager'; pager.innerHTML='<div>共 <span data-project-count>0</span> 条记录，每页<select aria-label="每页条数"><option>10</option><option selected>20</option><option>50</option></select>条</div><nav aria-label="项目列表分页"></nav>'; oldPager.replaceWith(pager);
    pager.querySelector('select').onchange=function(){size=Number(this.value);paginate(true);}; pager.onclick=function(e){var button=e.target.closest('[data-project-page]');if(!button||button.disabled)return;var value=button.dataset.projectPage;page=value==='next'?page+1:value==='prev'?page-1:Number(value);paginate(false);};
    tbody.onclick=function(e){var button=e.target.closest('[data-project-action]'),row=e.target.closest('tr[data-project]');if(!row||!button)return;var p=window.pbsProjects.find(row.dataset.project),action=button.dataset.projectAction;if(action==='urge')urge(p);else open(p.projectNo,action==='view'?'':action);};
    var list=document.getElementById('pendingTaskList'); if(list) list.onclick=handlePendingAction;
    document.getElementById('flt-kw').addEventListener('keydown', function(e) { if (e.key === 'Enter') window.applyFilter(); });
    document.getElementById('flt-kw').addEventListener('input', function() { if (!this.value) keyword(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && document.getElementById('pendingDrawerMask') && !document.getElementById('pendingDrawerMask').classList.contains('hidden') && !document.getElementById('pbsTaskReturnDialog')) closePending(); });
    render();
    if (new URLSearchParams(location.search).get('returns') === '1') openPending();
  }
  window.pbsProjectList={render:render,filterChanged:function(){paginate(true);},managerName:managerName};
  window.updatePendingBadge=updatePendingBadge;
  window.applyFilter = function() { keyword(); if(window.PBSAdvancedFilter && window.PBSAdvancedFilter.refresh) window.PBSAdvancedFilter.refresh(); };
  window.resetFilter = function() { document.getElementById('flt-kw').value = ''; keyword(); if(window.PBSAdvancedFilter && window.PBSAdvancedFilter.reset) window.PBSAdvancedFilter.reset(); };
  window.openPendingDrawer=openPending; window.closePendingDrawer=closePending;
  window.openPoolProjectDetail=function(id){open(id);}; window.openMyProjectDetail=function(id){open(id);};
  window.renderOfflineProjects=render; window.renderOfflineMyProjects=render; window.configurePoolRoleView=function(){}; window.syncStaticRowsFromStore=render; window.renderOrderReferences=function(){};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('storage',function(e){if(['pbs_projects_v1','pbs_order_management_v1','pbs_task_returns_v1'].indexOf(e.key)>=0) render();});
  window.addEventListener('pbs-order-updated',render);
  window.addEventListener('pbs-task-return-updated',render);
})();
