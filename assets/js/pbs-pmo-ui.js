(function () {
  'use strict';
  var api = window.pbsOrders;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) { return {}; } }
  function time(value) { return value ? new Date(value).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}).slice(0,16) : '—'; }
  function orderClosureUrl(projectNo) { return '结项详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(projectNo) + '&orderReport=1'; }
  function closureUrl(projectNo,goalId) { return '结项详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(projectNo) + '&school=' + encodeURIComponent(goalId); }
  function toast(message) { var old = document.querySelector('.pmo-toast'); if (old) old.remove(); var node = document.createElement('div'); node.className = 'pmo-toast'; node.textContent = message; document.body.appendChild(node); setTimeout(function() { node.remove(); },3000); }
  function modal(title,body,footer) {
    var dialog = document.createElement('dialog'); dialog.className = 'pmo-dialog';
    dialog.innerHTML = '<header><h3>' + esc(title) + '</h3><button data-close aria-label="关闭">×</button></header><div class="pmo-dialog-body">' + body + '<p class="pmo-error" role="alert"></p></div><footer>' + footer + '</footer>';
    dialog.onclick = function(event) { if (event.target === dialog || event.target.closest('[data-close]')) dialog.close(); }; dialog.onclose = function() { dialog.remove(); }; document.body.appendChild(dialog); dialog.showModal(); return dialog;
  }
  function error(dialog,result) { if (!result || !result.error) return false; dialog.querySelector('.pmo-error').textContent = result.error; return true; }
  function currentOrder() {
    var number = new URLSearchParams(location.search).get('project') || (window.projectData && window.projectData.projectNo);
    if (!number) return api.all().find(function(order) { return api.canView(order.project); });
    return api.all().find(function(order) { return order.projects.some(function(project) { return project.projectNo === number; }); });
  }
  function fileStore(mode,action) {
    return new Promise(function(resolve,reject) { var request = indexedDB.open('pbs_pmo_closure_files_v1',1); request.onupgradeneeded = function() { request.result.createObjectStore('files',{keyPath:'id'}); }; request.onerror = function() { reject(request.error); }; request.onsuccess = function() { var db = request.result, transaction = db.transaction('files',mode), result = action(transaction.objectStore('files')); transaction.oncomplete = function() { db.close(); resolve(result && result.result); }; transaction.onerror = function() { db.close(); reject(transaction.error); }; }; });
  }
  function reports(projectNo,goalId) { var stored = read('pbs_closure_reports_' + projectNo + '_' + goalId); return Object.keys(stored).map(function(id) { return stored[id]; }).filter(function(report) { return report.saved; }); }
  function reviewDialog(projectNo,goalId) {
    var project = pbsProjects.find(projectNo); if (!project || !api.canReadGoal(project,goalId)) return;
    var submission = (project.goalSubmissions || {})[goalId], goal = project.packages.find(function(item) { return item.id === goalId; }); if (!submission || !goal) return;
    var canReview = api.canManage(project) && submission.status === '待审核' && project.status !== '已结项';
    var dialog = modal(goal.school + ' · 结项材料','<p class="pmo-review-meta">' + esc(submission.submittedBy) + ' · ' + time(submission.submittedAt) + '</p><div class="pmo-review-note">' + esc(submission.note || '—') + '</div>' + (submission.attachments || []).map(function(file) { return '<div class="pmo-material"><span>' + esc(file.name) + '</span><button class="pmo-link" data-file="' + esc(file.id) + '">下载</button></div>'; }).join('') + reports(projectNo,goalId).map(function(report) { return '<div class="pmo-material"><span>' + esc(report.title) + '</span><a class="pmo-link" target="_blank" rel="noopener" href="' + closureUrl(projectNo,goalId) + '&report=' + encodeURIComponent(report.id) + '">查看报告</a></div>'; }).join('') + (submission.reviewNote ? '<label>核验意见</label><div class="pmo-review-note">' + esc(submission.reviewNote) + '</div>' : '') + (canReview ? '<label>核验意见</label><textarea data-review-note placeholder="退回时请填写需补充的内容"></textarea>' : ''),'<button class="pmo-btn" data-close>关闭</button>' + (canReview ? '<button class="pmo-btn danger" data-reject>退回补充</button><button class="pmo-btn primary" data-approve>核验通过</button>' : ''));
    dialog.querySelectorAll('[data-file]').forEach(function(button) { button.onclick = async function() { try { var saved = await fileStore('readonly',function(store) { return store.get(button.dataset.file); }); if (!saved || !saved.file) { toast('未找到原文件'); return; } var href = URL.createObjectURL(saved.file), link = document.createElement('a'); link.href = href; link.download = saved.file.name; link.click(); setTimeout(function() { URL.revokeObjectURL(href); },30000); } catch(e) { toast('文件读取失败'); } }; });
    ['approve','reject'].forEach(function(action) { var button = dialog.querySelector('[data-' + action + ']'); if (button) button.onclick = function() { var result = api.review(projectNo,goalId,action === 'approve',dialog.querySelector('textarea').value.trim()); if (error(dialog,result)) return; dialog.close(); location.reload(); }; });
  }
  function closeDialog(order) {
    var dialog = modal('确认结项','<div class="pmo-review-note">' + esc(order.project.student) + ' · ' + esc(order.project.orderNo || order.project.projectNo) + '<br>' + order.targets.length + ' 个院校目标已核验通过</div><label>结项备注</label><textarea placeholder="填写结项备注" data-note></textarea>','<button class="pmo-btn" data-close>取消</button><button class="pmo-btn primary" data-confirm>确认结项</button>');
    dialog.querySelector('[data-confirm]').onclick = function() { var result = api.close(order.project.projectNo,dialog.querySelector('textarea').value.trim()); if (error(dialog,result)) return; dialog.close(); location.reload(); toast('订单全部院校目标已结项'); };
  }
  function syncMyProjectState() {
    var context = window.MY_PROJECT_CONTEXT; if (!context) return;
    var project = pbsProjects.find(context.projectNo); if (!project) return;
    if (!api.canView(project)) { document.querySelector('main').innerHTML = '<p class="pmo-empty">无权查看该项目</p>'; return; }
    if (window.MY_PROJECT_CONTEXT && pbsGetSession().role === '项目经理' && !(project.packages || []).some(function(goal) { return api.canHandleGoal(project,goal.id,true); })) { document.querySelector('main').innerHTML = '<p class="pmo-empty">请先在我的项目中接收院校目标</p>'; return; }
    if (window.MY_PROJECT_CONTEXT && window.SCHOOL_COCKPITS) {
      if (pbsGetSession().role === '项目经理' && (Object.keys(SCHOOL_COCKPITS).length !== project.packages.filter(function(goal) { return api.canHandleGoal(project,goal.id,true); }).length || Object.keys(SCHOOL_COCKPITS).some(function(id) { return !api.canHandleGoal(project,id,true); }))) { location.reload(); return; }
      Object.keys(SCHOOL_COCKPITS).forEach(function(id) {
        var goal = SCHOOL_COCKPITS[id], closed = (project.goalClosures || {})[id], submission = (project.goalSubmissions || {})[id] || {};
        goal.archive.status = closed && closed.closureAt ? '已结项' : submission.status === '待审核' ? 'PMO 核验中' : submission.status === '已通过' ? '待 PMO 结项' : submission.status === '退回补充' ? '待补充材料' : '待提交材料';
        goal.archive.time = closed && closed.closureAt ? time(closed.closureAt) : '—';
        var result = (project.goalResults || {})[id]; if (result) { goal.archive.offers = result.result === '录取' ? 1 : 0; goal.archive.rejects = result.result === '拒录' ? 1 : 0; }
      });
      var label = document.getElementById('myProjectStateLabel'); if (label) label.textContent = pbsProjects.statusOf(project);
      var active = document.querySelector('[data-project-stage].is-active'); if (active && active.dataset.projectStage === 'archive' && window.switchProjectStage) switchProjectStage('archive',active);
    }
  }
  function mountClosureSubmission() {
    if (!window.projectData || !document.getElementById('btnConfirmClosure')) return;
    var project = pbsProjects.find(projectData.projectNo); if (!project) return;
    if (!api.canView(project)) { document.querySelector('main').innerHTML = '<p class="pmo-empty">无权查看该项目</p>'; return; }
    var close = document.getElementById('btnConfirmClosure');
    close.hidden = !api.canManage(project); close.style.display = close.hidden ? 'none' : '';
    if (api.canManage(project)) {
      var order = currentOrder(), ready = order && order.targets.length && order.targets.every(function(target) { return target.project.status === '已结项' || target.submission.status === '已通过'; });
      close.disabled = project.status === '已结项' || !ready; close.style.opacity = close.disabled ? '.45' : '';
      close.title = ready ? '' : '请先核验全部院校目标材料';
      close.onclick = function() { if (!close.disabled) closeDialog(currentOrder()); };
      return;
    }
    var scope = new URLSearchParams(location.search).get('school'), targets = project.packages.filter(function(goal) { return (!scope || goal.id === scope) && api.canHandleGoal(project,goal.id,true); });
    if (document.getElementById('pmoClosureSubmission')) document.getElementById('pmoClosureSubmission').remove();
    var section = document.createElement('section'); section.className = 'pmo-submission'; section.id = 'pmoClosureSubmission';
    section.innerHTML = targets.map(function(goal) { var previous = (project.goalSubmissions || {})[goal.id] || {}, editable = project.status !== '已结项' && ['待审核','已通过'].indexOf(previous.status) < 0; return '<div data-submit-goal="' + esc(goal.id) + '"><h3>' + esc(goal.school) + ' · 结项材料</h3><p class="pmo-review-meta">' + esc(previous.status || '待提交') + (previous.submittedAt ? ' · ' + time(previous.submittedAt) : '') + '</p>' + (previous.reviewNote ? '<div class="pmo-review-note">' + esc(previous.reviewNote) + '</div>' : '') + (editable ? '<textarea class="pmo-input" data-note placeholder="填写结项说明" style="width:100%;height:100px;padding:12px">' + esc(previous.note || '') + '</textarea><div style="margin:14px 0"><input type="file" data-attachments multiple aria-label="结项材料附件"></div><label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:16px 0"><input type="checkbox" data-delivery-confirmed>确认该院校目标文书、网申、监控及交付材料已完成</label><button class="pmo-btn primary" data-submit>提交结项材料</button>' : '<div class="pmo-review-note">' + esc(previous.note || '—') + '</div>') + '</div>'; }).join('');
    if (!section.innerHTML) return; document.getElementById('result-confirm').after(section);
    section.querySelectorAll('[data-submit]').forEach(function(button) { button.onclick = async function() { var host = button.closest('[data-submit-goal]'), goalId = host.dataset.submitGoal, old = (pbsProjects.find(project.projectNo).goalSubmissions || {})[goalId] || {}, files = Array.from(host.querySelector('[data-attachments]').files), attachments = (old.attachments || []).slice(); button.disabled = true; try { for (var i = 0; i < files.length; i++) { var id = 'MATERIAL-' + Date.now() + '-' + i; await fileStore('readwrite',function(store) { return store.put({id:id,file:files[i]}); }); attachments.push({id:id,name:files[i].name,size:files[i].size}); } var result = api.submit(project.projectNo,goalId,{note:host.querySelector('[data-note]').value.trim(),attachments:attachments,result:(window.projectData.targets.find(function(target) { return target.code === goalId; }) || {}).result,resultNote:(window.projectData.targets.find(function(target) { return target.code === goalId; }) || {}).note,resultImage:(window.projectData.targets.find(function(target) { return target.code === goalId; }) || {}).image,deliveryConfirmed:host.querySelector('[data-delivery-confirmed]').checked}); if (result.error) { toast(result.error); return; } location.reload(); } catch(e) { toast('材料保存失败，请重试'); } finally { button.disabled = false; } }; });
  }
  function renderArchive() {
    var body = document.getElementById('archiveTbody'); if (!body) return;
    var orders = api.all().filter(function(order) { return api.canView(order.project) && (order.status === '已结项' || order.targets.some(function(target) { return !!target.submission.submittedAt; })); }), table = body.closest('table');
    table.querySelector('thead tr').innerHTML = ['序号','商城订单号','学生姓名','PMO','院校目标','结项状态','结项时间','操作'].map(function(label) { return '<th class="px-5 py-4 text-left text-sm font-medium text-gray-500">' + label + '</th>'; }).join('');
    body.innerHTML = orders.map(function(order,index) { var p = order.project, canOrder = api.canAssignOwner(p) || api.canManage(p), own = order.targets.filter(function(target) { return api.canReadGoal(target.project,target.goal.id); })[0], href = canOrder ? orderClosureUrl(p.projectNo) : own ? closureUrl(own.project.projectNo,own.goal.id) : ''; return '<tr data-project="' + esc(p.projectNo) + '" data-name="' + esc(p.customer) + '" data-student="' + esc(p.student) + '" data-level="' + esc(p.level) + '" data-endtime="' + esc(order.owner.closedAt || p.closureAt || '') + '" data-status="' + (order.status === '已结项' ? '已结项' : '待结项') + '" data-kw="' + esc([p.projectNo,p.orderNo,p.student,order.owner.pmoName,order.status].join(' ')) + '">' + [index + 1,p.orderNo || '—',p.student,order.owner.pmoName || '—',order.targets.length,order.status,time(order.owner.closedAt || (p.status === '已结项' ? p.closureAt : ''))].map(function(value) { return '<td class="px-5 py-4 text-sm">' + esc(value) + '</td>'; }).join('') + '<td class="px-5 py-4 text-sm"><a class="pmo-link" href="' + href + '">' + (canOrder ? '查看详情' : '查看材料') + '</a></td></tr>'; }).join('') + '<tr id="flt-empty" class="hidden"><td colspan="8" class="pmo-empty">暂无符合条件的结项记录</td></tr>';
    var pager = table.nextElementSibling; if (pager && document.getElementById('totalRecords')) pager.innerHTML = '共 <span id="totalRecords">' + orders.length + '</span> 条记录';
    if (window.applyFilter) window.applyFilter();
  }
  window.pbsPmoClosure = { review:reviewDialog, confirm:function() { var order = currentOrder(); if (order && api.canManage(order.project)) closeDialog(order); } };
  function init() { syncMyProjectState(); mountClosureSubmission(); renderArchive(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('storage',function(event) { if (['pbs_order_management_v1','pbs_projects_v1'].indexOf(event.key) >= 0) { renderArchive(); syncMyProjectState(); } });
})();
