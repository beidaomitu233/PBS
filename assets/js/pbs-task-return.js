(function () {
  'use strict';
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './assets/css/pbs-task-return.css?v=1.0';
  document.head.appendChild(style);
  var key = 'pbs_task_returns_v1';
  var page = decodeURIComponent(location.pathname.split('/').pop() || '');
  function read() { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; } }
  function save(items) { localStorage.setItem(key, JSON.stringify(items)); refresh(); }
  function text(value) { var el = document.createElement('span'); el.textContent = value || ''; return el.innerHTML; }
  function identity(item) { return [item.organization, item.kind, item.student, item.school, item.doc || ''].join('|'); }
  function close() {
    var mask = document.getElementById('pbsTaskReturnDialog');
    if (!mask) return;
    var trigger = mask.returnFocus;
    mask.remove();
    if (trigger && trigger.isConnected) trigger.focus();
  }
  function dialog(title, body, button, submit) {
    close();
    var mask = document.createElement('div');
    mask.id = 'pbsTaskReturnDialog';
    mask.className = 'pbs-task-dialog-mask';
    mask.returnFocus = document.activeElement;
    mask.innerHTML = '<form class="pbs-task-dialog" role="dialog" aria-modal="true" aria-labelledby="pbsTaskDialogTitle"><header><h3 id="pbsTaskDialogTitle">' + title + '</h3><button type="button" data-close aria-label="关闭">×</button></header><div class="pbs-task-dialog-body">' + body + '<p class="pbs-task-error" role="alert"></p></div><footer><button type="button" data-close>取消</button><button type="submit">' + button + '</button></footer></form>';
    mask.querySelectorAll('[data-close]').forEach(function (el) { el.onclick = close; });
    mask.onclick = function (e) { if (e.target === mask) close(); };
    mask.onkeydown = function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        var controls = mask.querySelectorAll('button,input,select,textarea');
        var first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    mask.querySelector('form').onsubmit = function (e) { e.preventDefault(); submit(mask); };
    document.body.appendChild(mask);
    mask.querySelector('textarea,select,input').focus();
  }
  function confirmReturn(context, callback) {
    dialog('退回任务', '<p>' + text(context.label) + '</p><label for="pbsTaskReturnReason">退回原因 <span style="color:#dc2626">*</span></label><textarea id="pbsTaskReturnReason" placeholder="请填写退回原因" maxlength="500"></textarea>', '确认退回', function (mask) {
      var reason = mask.querySelector('textarea').value.trim();
      if (!reason) { mask.querySelector('.pbs-task-error').textContent = '请填写退回原因'; mask.querySelector('textarea').focus(); return; }
      callback(reason);
      if (context.kind !== 'project') {
        var session = window.pbsGetSession ? window.pbsGetSession() : {};
        var item = Object.assign({}, context, { reason: reason, returnedAt: new Date().toISOString(), returnedBy: session.name || '', organization: session.org || 'PBS留学总部', status: 'returned' });
        item.id = identity(item);
        var items = read().filter(function (row) { return row.id !== item.id; });
        items.push(item);
        save(items);
        if (window.pbsCreateNotification) window.pbsCreateNotification({ kind: 'task_assigned', type: '任务退回提醒', title: item.label + '已退回', business: item.student + ' · ' + item.school, detail: '退回原因：' + reason, level: 'danger', recipientRoles: context.kind === 'review' ? ['项目经理', '文书人员'] : ['项目经理'], organization: item.organization, href: '项目经理工作台 - 留学申请管理系统.html' });
      }
      close();
    });
  }
  function reassign(item) {
    if (!window.pbsHasPermission || !window.pbsHasPermission('my_project_assign_member')) return;
    var people = window.TEAM ? window.TEAM.filter(function (person) { return item.kind === 'review' ? person.role === '审核专员' : item.kind === 'application' ? person.role === '网申专员' : person.role === '文书顾问'; }).map(function (person) { return person.name; }) : item.kind === 'review' ? ['孙老师', '周老师', '王审核'] : item.kind === 'application' ? ['吴老师', '郑老师', '孙网申'] : ['刘老师', '陈老师', '杨老师'];
    dialog('重新分配', '<p>' + text(item.label) + '</p><label for="pbsTaskAssignee">接收人</label><select id="pbsTaskAssignee"><option value="">请选择人员</option>' + people.map(function (person) { return '<option>' + text(person) + '</option>'; }).join('') + '</select><label for="pbsTaskDdl" style="margin-top:16px">完成时间</label><input id="pbsTaskDdl" type="date">', '确认分配', function (mask) {
      var person = mask.querySelector('select').value;
      var ddl = mask.querySelector('input').value;
      if (!person || !ddl) { mask.querySelector('.pbs-task-error').textContent = '请选择接收人和完成时间'; return; }
      var items = read();
      items.forEach(function (row) { if (row.id === item.id) { row.status = 'assigned'; row.assignee = person; row.ddl = ddl; row.assignedAt = new Date().toISOString(); } });
      save(items);
      if (window.pbsCreateNotification) window.pbsCreateNotification({ kind: 'task_assigned', type: '任务派发提醒', title: item.label + '已重新分配', business: item.student + ' · ' + item.school, detail: '完成时间：' + ddl, recipientRoles: [item.kind === 'review' ? '文书审核' : item.kind === 'application' ? '网申人员' : '文书人员'], recipientName: person, organization: item.organization, href: item.page });
      close();
    });
  }
  function matches(row, item) {
    var d = row.dataset;
    var student = d.student || d.name || '';
    var school = d.school || d.target || '';
    var content = row.textContent;
    return (student ? student === item.student : content.indexOf(item.student) >= 0) && (school ? school.indexOf(item.school) >= 0 : content.indexOf(item.school) >= 0) && (!item.doc || (d.type || content).indexOf(item.doc) >= 0);
  }
  function refresh() {
    var session = window.pbsGetSession ? window.pbsGetSession() : {};
    var items = read().filter(function (item) { return !session.org || item.organization === session.org; });
    document.querySelectorAll('tr[data-project]').forEach(function (row) {
      var project = window.pbsProjects && window.pbsProjects.find(row.dataset.project);
      row.classList.toggle('pbs-returned-row', !!(project && project.rejectedAt && !project.projectManager));
      if (project && project.rejectReason) row.title = '退回原因：' + project.rejectReason;
      else if (row.title.indexOf('退回原因：') === 0) row.removeAttribute('title');
    });
    var kind = page.indexOf('文书审核列表') >= 0 ? 'review' : page.indexOf('任务列表页 - 文书交付系统') >= 0 ? 'document' : page.indexOf('网申任务列表') >= 0 ? 'application' : '';
    if (kind) {
      if (kind === 'document') {
        var heading = document.querySelector('thead tr');
        if (heading && !heading.querySelector('[data-return-reason]')) {
          var th = document.createElement('th'); th.dataset.returnReason = 'true'; th.className = 'px-5 py-4 text-left text-sm font-medium text-gray-500'; th.textContent = '退回原因'; heading.children[6].after(th);
        }
        document.querySelectorAll('tbody td[colspan="11"]').forEach(function(cell){cell.colSpan = 12;});
      }
      document.querySelectorAll('tbody tr[data-kw]').forEach(function (row) {
        var returned = items.find(function (item) { return item.kind === kind && item.status === 'returned' && matches(row, item); });
        if (kind === 'document') {
          var reasonCell = row.querySelector('[data-return-reason]');
          if (!reasonCell) { reasonCell = document.createElement('td'); reasonCell.dataset.returnReason = 'true'; reasonCell.className = 'px-5 py-4 text-sm text-gray-500'; reasonCell.style.cssText = 'min-width:140px;max-width:240px;white-space:normal;overflow-wrap:anywhere'; row.children[6].after(reasonCell); }
          reasonCell.textContent = returned ? returned.reason : '—';
        }
        row.classList.toggle('pbs-returned-row', !!returned);
        if (returned) row.title = '退回原因：' + returned.reason;
        else if (row.title.indexOf('退回原因：') === 0) row.removeAttribute('title');
      });
      items.filter(function (item) { return item.kind === kind && item.page === page && item.cardId; }).forEach(function (item) {
        var card = document.getElementById(item.cardId);
        if (card && (item.status === 'returned' || item.status === 'accepted')) card.remove();
        if (card && item.status === 'assigned') {
          if (!card.querySelector('[data-reassigned]')) {
            var note = document.createElement('p'); note.dataset.reassigned = 'true'; note.className = 'text-xs text-gray-500 mb-3'; card.prepend(note);
          }
          card.querySelector('[data-reassigned]').textContent = item.assignee + ' · 完成时间 ' + item.ddl;
        }
      });
      if (typeof window.updatePendingBadge === 'function') window.updatePendingBadge(document.querySelectorAll('#pendingTaskList > div[id^="pendingTaskCard"]').length);
    }
    var projectContext = window.MY_PROJECT_CONTEXT;
    var schoolContext = window.SCHOOL_COCKPITS && window.SCHOOL_COCKPITS[window.currentSchoolCockpit];
    if (projectContext && schoolContext) {
      document.querySelectorAll('#projectStageContent tbody tr').forEach(function (row) {
        var returned = items.find(function (item) { return item.status === 'returned' && item.student === projectContext.student && schoolContext.name.indexOf(item.school) >= 0 && (!item.doc || row.textContent.indexOf(item.doc) >= 0); });
        row.classList.toggle('pbs-returned-row', !!returned);
        if (returned) row.title = '退回原因：' + returned.reason;
        else if (row.title.indexOf('退回原因：') === 0) row.removeAttribute('title');
      });
    }
    if (page.indexOf('项目经理工作台') >= 0 || page.indexOf('我的项目详情页') >= 0) {
      var canAssign = window.pbsHasPermission && window.pbsHasPermission('my_project_assign_member');
      var context = window.MY_PROJECT_CONTEXT;
      var scoped = items.filter(function (item) { return item.status !== 'accepted' && (!context || item.student === context.student); });
      var host = document.getElementById('pbsReturnedTasks');
      if (!scoped.length) { if (host) host.remove(); return; }
      if (!host) { host = document.createElement('section'); host.id = 'pbsReturnedTasks'; host.className = 'pbs-task-return-list'; host.style.order = '3'; document.querySelector('main').appendChild(host); }
      host.innerHTML = '<h2>任务分配</h2><div class="pbs-task-return-scroll"><table><thead><tr><th>任务</th><th>退回原因</th><th>状态</th><th>操作</th></tr></thead><tbody>' + scoped.map(function (item) { return '<tr class="' + (item.status === 'returned' ? 'pbs-returned-row' : '') + '"><td>' + text(item.label) + '</td><td>' + text(item.reason) + '</td><td>' + (item.status === 'returned' ? '已退回' : '待接收') + '</td><td>' + (item.status === 'returned' && canAssign ? '<button type="button" data-reassign="' + text(item.id) + '">重新分配</button>' : text(item.assignee)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      host.querySelectorAll('[data-reassign]').forEach(function (button) { button.onclick = function () { reassign(items.find(function (item) { return item.id === button.dataset.reassign; })); }; });
    }
  }
  window.pbsTaskReturn = {
    confirm: confirmReturn,
    refresh: refresh,
    accept: function (kind, student, school) {
      var items = read();
      var session = window.pbsGetSession();
      items.forEach(function (item) { if (item.organization === session.org && item.kind === kind && item.student === student && item.school === school && item.status === 'assigned') item.status = 'accepted'; });
      save(items);
    },
    clearScope: function (student, school, assignment) {
      var items = read();
      var session = window.pbsGetSession();
      items.forEach(function (item) {
        if (item.organization !== session.org || item.student !== student || school.indexOf(item.school) < 0 || item.status !== 'returned') return;
        var doc = assignment.docs[item.doc];
        var assignee = item.kind === 'application' ? assignment.network : doc ? (item.kind === 'review' ? doc.reviewer : doc.person) : '';
        if (!assignee) return;
        item.status = 'assigned';
        item.assignee = assignee;
        item.ddl = item.kind === 'application' ? assignment.appDdl : doc ? doc.ddl : '';
      });
      save(items);
    }
  };
  function profileDescriptions() {
    var notes = { edu: '记录教育经历与成绩，用于选校评估、文书写作和网申信息填报。', lang: '记录语言考试成绩，用于核对院校语言要求与准备申请材料。', score: '补充学术考试成绩，供选校评估和网申填报使用。', qual: '记录专业证书与资质，供文书引用和申请材料核对。', work: '记录工作经历，供文书撰写和网申经历字段引用。', practice: '记录实践与科研经历，供文书撰写和网申填报使用。', honor: '记录奖项与荣誉，供文书引用和网申材料准备。', pub: '记录论文与学术成果，供研究经历说明和申请材料引用。', apply: '记录历史申请情况，供后续申请规划与结果核对。', account: '填写各院校网申账号、密码和申请网址，供网申人员及插件调用；邮箱监控使用授权码。', asset: '按档案模块保存文档和图片，供 AI 解析、文书写作及网申材料绑定使用。' };
    Object.keys(notes).forEach(function (id) { var body = document.getElementById('secbody-' + id); if (body) { var p = document.createElement('p'); p.className = 'pbs-profile-purpose'; p.textContent = notes[id]; body.prepend(p); } });
  }
  function editorPanels() {
    if (document.getElementById('btn-collapse-left')) return;
    ['sidebar-tabs', 'right-sidebar'].forEach(function (id) {
      var panel = document.getElementById(id); if (!panel) return;
      var bar = document.createElement('div'); bar.className = 'pbs-editor-collapse-bar';
      var button = document.createElement('button'); button.type = 'button'; button.className = 'pbs-editor-collapse'; button.setAttribute('aria-expanded', 'true'); button.setAttribute('aria-controls', id);
      var side = id === 'sidebar-tabs' ? '左侧工具栏' : '右侧工具栏';
      button.title = '收起' + side; button.setAttribute('aria-label', button.title);
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M' + (id === 'sidebar-tabs' ? '9' : '15') + ' 4v16"/><path d="' + (id === 'sidebar-tabs' ? 'm15 9-3 3 3 3' : 'm9 9 3 3-3 3') + '"/></svg>';
      button.onclick = function () { var collapsed = panel.classList.toggle('is-collapsed'); button.setAttribute('aria-expanded', String(!collapsed)); button.title = (collapsed ? '展开' : '收起') + side; button.setAttribute('aria-label', button.title); };
      bar.appendChild(button); panel.prepend(bar);
    });
  }
  function init() { refresh(); if (page.indexOf('学生档案详情') >= 0) profileDescriptions(); if (page.indexOf('文书编辑器') >= 0) editorPanels(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('storage', function (event) { if (event.key === key || event.key === 'pbs_projects_v1') refresh(); });
})();
