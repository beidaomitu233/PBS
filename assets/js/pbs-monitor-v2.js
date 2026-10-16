(function () {
  'use strict';

  var taskRows = [
    { id: 1, no: 'MON20260818001', customer: '张建国', student: '张明', intake: '2027 Fall', project: '硕士申请', schoolCount: 6, todo: 5, urgent: 2, status: '待处理', frequency: '每小时', lastSync: '2026-08-18 10:15', owner: '王芳' },
    { id: 2, no: 'MON20260818002', customer: '李建国', student: '李雪', intake: '2027 Fall', project: '本科申请', schoolCount: 8, todo: 2, urgent: 1, status: '紧急处理', frequency: '每小时', lastSync: '2026-08-18 09:52', owner: '陈凯' },
    { id: 3, no: 'MON20260817007', customer: '王建军', student: '王伟', intake: '2027 Spring', project: '硕士申请', schoolCount: 5, todo: 3, urgent: 0, status: '待处理', frequency: '每天', lastSync: '2026-08-18 08:30', owner: '王芳' },
    { id: 4, no: 'MON20260816012', customer: '刘志强', student: '刘芳', intake: '2027 Fall', project: '博士申请', schoolCount: 7, todo: 0, urgent: 0, status: '无待办', frequency: '每天', lastSync: '2026-08-18 08:05', owner: '周宁' },
    { id: 5, no: 'MON20260815009', customer: '陈国强', student: '陈磊', intake: '2026 Fall', project: '硕士申请', schoolCount: 4, todo: 0, urgent: 0, status: '无待办', frequency: '每天', lastSync: '2026-08-17 22:00', owner: '陈凯' }
  ];

  var schoolData = [
    {
      id: 'hku', name: '香港大学', slug: 'hku', status: '已录取', mailCount: 4, todo: 2, urgent: 1,
      milestone: '接受录取 / 缴纳押金', progress: 66, latestMailTime: '2026-08-18 10:12',
      emails: [
        { receivedAt: '2026-08-18 10:12:36', tag: '录取通知', subject: 'Conditional Offer - MSc in Computer Science', from: 'admissions@hku.hk', preview: '学校已发出有条件录取，请于 8 月 25 日前登录申请系统确认接受，并完成押金支付。', urgent: true, task: { id: 'hku-accept-offer', title: '确认接受录取并缴纳押金', deadline: '2026-08-25 18:00', priority: 'normal' } },
        { receivedAt: '2026-08-17 16:48:09', tag: '缴费提醒', subject: 'Deposit payment reminder', from: 'pgadmissions@hku.hk', preview: '押金支付入口已经开放，付款成功后请保留回执。', urgent: true },
        { receivedAt: '2026-08-15 09:10:21', tag: '材料确认', subject: 'Supporting documents verified', from: 'admissions@hku.hk', preview: '成绩单、语言成绩与推荐信已完成核验。' },
        { receivedAt: '2026-08-12 11:03:18', tag: '申请确认', subject: 'Application received', from: 'noreply@hku.hk', preview: '申请已成功提交，申请编号为 HKU-PG-270184。' }
      ]
    },
    {
      id: 'cuhk', name: '香港中文大学', slug: 'cuhk', status: '已录取', mailCount: 3, todo: 3, urgent: 1,
      milestone: '接受录取 / 缴纳押金', progress: 66, latestMailTime: '2026-08-18 09:45',
      emails: [
        { receivedAt: '2026-08-18 09:45:12', tag: '录取通知', subject: 'Admission Offer for 2027-28', from: 'gradschool@cuhk.edu.hk', preview: '请在指定日期前接受录取并支付留位费，逾期视为放弃。', urgent: true, task: { id: 'cuhk-accept-offer', title: '确认录取并支付留位费', deadline: '2026-08-20 18:00', priority: 'urgent' } },
        { receivedAt: '2026-08-16 13:25:44', tag: '材料通知', subject: 'Verification of supporting documents', from: 'gradschool@cuhk.edu.hk', preview: '请补充上传学位证英文翻译件。', task: { id: 'cuhk-degree-translation', title: '上传学位证英文翻译件', deadline: '2026-08-26 18:00', priority: 'normal' } },
        { receivedAt: '2026-08-13 08:36:22', tag: '申请确认', subject: 'Online application acknowledgement', from: 'noreply@cuhk.edu.hk', preview: '网申已进入院系审理阶段。' }
      ]
    },
    {
      id: 'cityu', name: '香港城市大学', slug: 'cityu-hk', status: '已录取', mailCount: 3, todo: 3, urgent: 3,
      milestone: '录取 / Offer', progress: 55, latestMailTime: '2026-08-17 16:20',
      emails: [
        { receivedAt: '2026-08-17 16:20:08', tag: '录取通知', subject: 'Your application result is available', from: 'admissions@cityu.edu.hk', preview: '申请结果已更新，请登录申请系统查看 Offer 并完成后续确认。', urgent: true, task: { id: 'cityu-review-offer', title: '查看 Offer 并确认接受', deadline: '2026-08-19 18:00', priority: 'urgent' } },
        { receivedAt: '2026-08-17 15:56:51', tag: '缴费提醒', subject: 'Acceptance fee deadline', from: 'admissions@cityu.edu.hk', preview: '接受录取费用截止时间为 8 月 23 日。', urgent: true },
        { receivedAt: '2026-08-14 10:22:17', tag: '身份核验', subject: 'Identity document verification', from: 'admissions@cityu.edu.hk', preview: '护照信息页需要重新上传清晰版本。', urgent: true, task: { id: 'cityu-passport', title: '重新上传清晰的护照信息页', deadline: '2026-08-18 10:00', priority: 'urgent' } }
      ]
    },
    {
      id: 'hkbu', name: '香港浸会大学', slug: 'hkbu', status: '已录取', mailCount: 4, todo: 4, urgent: 1,
      milestone: '接受录取 / 缴纳押金', progress: 66, latestMailTime: '2026-08-16 11:08',
      emails: [
        { receivedAt: '2026-08-16 11:08:40', tag: '录取通知', subject: 'Offer of admission', from: 'gs@hkbu.edu.hk', preview: '录取通知书已生成，请登录系统下载。', urgent: true, task: { id: 'hkbu-download-offer', title: '下载并确认录取通知', deadline: '2026-08-24 18:00', priority: 'normal' } },
        { receivedAt: '2026-08-15 17:32:11', tag: '面试结果', subject: 'Interview assessment completed', from: 'programme@hkbu.edu.hk', preview: '面试评估已完成，结果将同步至申请系统。' },
        { receivedAt: '2026-08-12 12:15:32', tag: '面试邀请', subject: 'Online interview invitation', from: 'programme@hkbu.edu.hk', preview: '请在邮件中的时间段参加线上面试。' },
        { receivedAt: '2026-08-10 09:06:14', tag: '申请确认', subject: 'Application acknowledgement', from: 'gs@hkbu.edu.hk', preview: '申请材料已接收。' }
      ]
    },
    {
      id: 'polyu', name: '香港理工大学', slug: 'polyu', status: '未录取', mailCount: 3, todo: 3, urgent: 1,
      milestone: '录取 / Offer', progress: 55, latestMailTime: '2026-08-15 14:32',
      emails: [
        { receivedAt: '2026-08-15 14:32:09', tag: '申请结果', subject: 'Application outcome notification', from: 'ar.pg@polyu.edu.hk', preview: '本轮申请未能获得录取，申请结果已在系统中更新。', urgent: true, task: { id: 'polyu-close-result', title: '确认申请结果并完成归档', deadline: '2026-08-21 18:00', priority: 'normal' } },
        { receivedAt: '2026-08-12 16:40:02', tag: '状态更新', subject: 'Application under review', from: 'ar.pg@polyu.edu.hk', preview: '申请仍在院系审核中。' },
        { receivedAt: '2026-08-09 09:26:45', tag: '申请确认', subject: 'Application submitted successfully', from: 'noreply@polyu.edu.hk', preview: '申请提交成功。' }
      ]
    },
    {
      id: 'lingnan', name: '岭南大学', slug: 'ln-hk', status: '待补材料', mailCount: 3, todo: 2, urgent: 0,
      milestone: '材料补充 / 审核中', progress: 38, latestMailTime: '2026-08-14 08:20',
      officialTasks: [
        { id: 'lingnan-site-materials', title: '核对申请系统中的材料缺失项', deadline: '2026-08-23 18:00', priority: 'normal' }
      ],
      emails: [
        { receivedAt: '2026-08-14 08:20:03', tag: '补充材料', subject: 'Additional document required', from: 'registry@ln.edu.hk', preview: '请补充上传最新在读证明与完整成绩单。', task: { id: 'lingnan-supplement', title: '上传在读证明与完整成绩单', deadline: '2026-08-22 18:00', priority: 'normal' } },
        { receivedAt: '2026-08-11 10:06:47', tag: '材料确认', subject: 'Document checklist updated', from: 'registry@ln.edu.hk', preview: '推荐信已收齐，其余材料仍在核验。' },
        { receivedAt: '2026-08-08 13:18:28', tag: '申请确认', subject: 'Application acknowledgement', from: 'noreply@ln.edu.hk', preview: '申请已进入材料核验。' }
      ]
    }
  ];

  var selectedSchoolId = '';
  var toastTimer = null;
  var taskId = 1;
  var listPager;
  var monitorNow = new Date('2026-08-18T12:00:00+08:00');
  var monitorSeverity = { '无待办': 0, '待处理': 1, '紧急处理': 2, '已逾期': 3 };

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function statusClass(status) {
    var map = {
      '无待办': 'status-normal', '待处理': 'status-pending', '紧急处理': 'status-attention', '已逾期': 'status-error',
      '已录取': 'status-admitted', '未录取': 'status-rejected', '待补材料': 'status-supplement', '审核中': 'status-applied',
      '面试中': 'status-interview'
    };
    return map[status] || 'status-pending';
  }

  function pill(status) {
    return '<span class="status-pill ' + statusClass(status) + '">' + esc(status) + '</span>';
  }

  function showToast(message) {
    var toast = document.getElementById('monitorToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-show'); }, 2200);
  }

  function workItemsFor(school) {
    var items = [];
    school.emails.forEach(function (mail) {
      if (mail.task) items.push(mail.task);
    });
    (school.officialTasks || []).forEach(function (item) { items.push(item); });
    return items;
  }

  function workItemStorageKey(school, item) {
    return 'pbs_monitor_todo_' + taskId + '_' + school.id + '_' + item.id;
  }

  function workItemState(school, item) {
    try { return localStorage.getItem(workItemStorageKey(school, item)) || 'pending'; } catch (e) { return 'pending'; }
  }

  function saveWorkItemState(school, item, state) {
    try { localStorage.setItem(workItemStorageKey(school, item), state); } catch (e) {}
  }

  function deadlineDate(deadline) {
    return deadline ? new Date(deadline.replace(' ', 'T') + ':00+08:00') : null;
  }

  function workItemSeverity(school, item) {
    if (workItemState(school, item) !== 'pending') return 0;
    var deadline = deadlineDate(item.deadline);
    if (deadline && deadline.getTime() < monitorNow.getTime()) return 3;
    if (item.priority === 'urgent' || (deadline && deadline.getTime() <= monitorNow.getTime() + 72 * 60 * 60 * 1000)) return 2;
    return 1;
  }

  function schoolMonitorStatus(school) {
    var severity = workItemsFor(school).reduce(function (highest, item) {
      return Math.max(highest, workItemSeverity(school, item));
    }, 0);
    return ['无待办', '待处理', '紧急处理', '已逾期'][severity];
  }

  function aggregateStudentStatus() {
    var severity = schoolData.reduce(function (highest, school) {
      return Math.max(highest, monitorSeverity[schoolMonitorStatus(school)] || 0);
    }, 0);
    return ['无待办', '待处理', '紧急处理', '已逾期'][severity];
  }

  function refreshDerivedTaskStatus() {
    var primaryTask = taskRows.filter(function (item) { return item.id === 1; })[0];
    if (primaryTask) primaryTask.status = aggregateStudentStatus();
  }

  function renderSummary() {
    var actionCount = taskRows.filter(function (item) { return item.status !== '无待办'; }).length;
    var urgentCount = taskRows.filter(function (item) { return item.status === '紧急处理' || item.status === '已逾期'; }).length;
    var totalEl = document.getElementById('monitorTaskCount');
    var actionEl = document.getElementById('monitorActionCount');
    var urgentEl = document.getElementById('monitorUrgentCount');
    if (totalEl) totalEl.textContent = taskRows.length;
    if (actionEl) actionEl.textContent = actionCount;
    if (urgentEl) urgentEl.textContent = urgentCount;
  }

  function linkedProjects(item) {
    return window.pbsProjects ? window.pbsProjects.all().filter(function(project) { return project.student === item.student && window.pbsOrders.canView(project); }) : [];
  }

  function listFilters() {
    var kw = (document.getElementById('monitorKeyword').value || '').toLowerCase();
    var status = document.getElementById('monitorStatusFilter').value;
    var frequency = document.getElementById('monitorFrequencyFilter').value;
    return taskRows.filter(function (item) {
      var text = [item.customer, item.student].concat(linkedProjects(item).map(function(project) { return project.orderNo + ' ' + project.projectNo; })).join(' ').toLowerCase();
      return (!kw || text.indexOf(kw) >= 0) && (!status || item.status === status) && (!frequency || item.frequency === frequency);
    });
  }

  function renderList(resetPage) {
    var body = document.getElementById('monitorTaskRows');
    if (!body) return;
    refreshDerivedTaskStatus();
    renderSummary();
    var filtered = listFilters();
    if (!listPager) listPager = pbsPagination(document.getElementById('monitorPagination'), function() { renderList(false); }, 'monitorResultCount');
    var range = listPager.range(filtered.length, resetPage !== false);
    var rows = filtered.slice(range.start,range.end);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="monitor-empty">没有符合当前条件的监控任务</div></td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (item) {
      var projects = linkedProjects(item);
      var orders = Array.from(new Set(projects.map(function(project) { return project.orderNo || '—'; })));
      var shared = projects.length > 1 && orders.length === 1 && orders[0] !== '—';
      return '<tr>' +
        '<td class="monitor-order' + (shared ? ' is-shared' : '') + '">' + (orders.length ? orders.map(esc).join('<br>') : '—') + '</td>' +
        '<td class="monitor-project-number">' + (projects.length ? projects.map(function(project) { return esc(project.projectNo); }).join('<br>') : '—') + '</td>' +
        '<td><div class="monitor-person"><strong>' + esc(item.customer) + '</strong></div></td>' +
        '<td><div class="monitor-person"><strong>' + esc(item.student) + '</strong></div></td>' +
        '<td>' + esc(item.frequency) + '</td>' +
        '<td>' + pill(item.status) + '</td>' +
        '<td><div class="monitor-person"><strong style="font-size:13px">' + esc(item.lastSync) + '</strong></div></td>' +
        '<td><button class="monitor-link" onclick="pbsMonitor.openDetail(' + item.id + ')">进入监控详情</button></td>' +
      '</tr>';
    }).join('');
  }

  function resetListFilters() {
    ['monitorKeyword', 'monitorStatusFilter', 'monitorFrequencyFilter'].forEach(function (id) { document.getElementById(id).value = ''; });
    renderList();
  }

  function openDetail(id) {
    window.location.href = '监控详情页 - 留学申请管理系统.html?id=' + encodeURIComponent(id);
  }

  function currentTask() {
    return taskRows.filter(function (item) { return item.id === taskId; })[0] || taskRows[0];
  }

  function currentSchool() {
    return schoolData.filter(function (item) { return item.id === selectedSchoolId; })[0] || schoolData[0];
  }

  function loadManualStatuses() {
    var validStatuses = ['审核中', '待补材料', '面试中', '已录取', '未录取'];
    schoolData.forEach(function (school) {
      try {
        var stored = localStorage.getItem('pbs_monitor_school_status_' + taskId + '_' + school.id);
        if (stored === '已申请') stored = '审核中';
        if (stored && validStatuses.indexOf(stored) >= 0) school.status = stored;
      } catch (e) {}
    });
  }

  function renderStudentStrip() {
    var task = currentTask();
    var config = readConfig();
    document.getElementById('monitorStudentStrip').innerHTML =
      '<div class="student-strip-main"><div><h2>' + esc(task.student) + '</h2><p>客户：' + esc(task.customer) + '　负责人：' + esc(task.owner) + '</p></div></div>' +
      '<div class="student-strip-meta"><div><span>申请项目</span><strong>' + esc(task.project) + '</strong></div><div><span>院校数量</span><strong>' + schoolData.length + ' 所</strong></div><div><span>监控频率</span><strong>' + esc(config.frequency || task.frequency) + '</strong></div><div><span>最后汇总</span><strong>' + esc(task.lastSync) + '</strong></div></div>';
  }

  function sortedSchools() {
    return schoolData.slice().sort(function (a, b) { return b.latestMailTime.localeCompare(a.latestMailTime); });
  }

  function renderSchoolCards() {
    var target = document.getElementById('monitorSchoolGrid');
    if (!target) return;
    target.innerHTML = sortedSchools().map(function (school) {
      var handlingStatus = schoolMonitorStatus(school);
      return '<button class="school-nav-item' + (school.id === selectedSchoolId ? ' is-selected' : '') + '" aria-pressed="' + (school.id === selectedSchoolId ? 'true' : 'false') + '" onclick="pbsMonitor.selectSchool(\'' + school.id + '\', this)">' +
        '<div class="school-nav-top"><div class="school-nav-name"><strong>' + esc(school.name) + '</strong><span>' + esc(school.slug) + '</span></div>' + pill(school.status) + '</div>' +
        '<div class="school-nav-meta"><span>' + esc(school.latestMailTime.slice(5)) + '</span><span class="school-handling-status ' + statusClass(handlingStatus) + '">' + handlingStatus + '</span></div>' +
      '</button>';
    }).join('');
  }

  function siteFor(school) {
    if (!school.site) {
      school.site = {
        url: 'https://apply.' + school.slug.replace('-hk', '') + '.edu.hk/status',
        account: 'zhangming_' + school.slug.replace(/[^a-z]/g, ''),
        lastSync: school.latestMailTime,
        status: school.id === 'polyu' ? '状态有变更' : '同步正常',
        records: [
          { time: school.latestMailTime, title: '申请状态页', detail: '页面状态已完成最新检查，与邮件记录已关联。' },
          { time: '2026-08-16 08:00', title: '材料清单页', detail: '材料清单已同步，未发现未识别字段。' }
        ],
        snapshots: [
          { key: 'status', title: '申请状态页', meta: '王芳上传 · ' + school.latestMailTime },
          { key: 'materials', title: '材料清单页', meta: '王芳上传 · 2026-08-16 08:00' },
          { key: 'decision', title: '录取结果页', meta: '尚未上传' }
        ]
      };
    }
    return school.site;
  }

  function renderEmails(school) {
    var emails = school.emails.slice().sort(function (a, b) { return b.receivedAt.localeCompare(a.receivedAt); });
    return '<div class="email-timeline">' + emails.map(function (mail) {
      return '<article class="email-item' + (mail.urgent ? ' is-urgent' : '') + '">' +
        '<div class="email-time"><time>' + esc(mail.receivedAt) + '</time><span class="email-tag">' + esc(mail.tag) + '</span></div>' +
        '<h4>' + esc(mail.subject) + '</h4><div class="email-from">发件人：' + esc(mail.from) + '</div>' +
        '<p class="email-preview">' + esc(mail.preview) + '</p><button class="monitor-link email-action" onclick="pbsMonitor.openMail(' + school.emails.indexOf(mail) + ')">查看邮件原文</button>' +
      '</article>';
    }).join('') + '</div>';
  }

  function renderOfficial(school) {
    var site = siteFor(school);
    return '<div class="snapshot-grid">' + site.snapshots.map(function (snap) {
        var body = snap.dataUrl ? '<img src="' + snap.dataUrl + '" alt="' + esc(snap.title) + '">' : '<div class="snapshot-mock"><span></span><span></span><span></span></div>';
        return '<button class="snapshot-card" onclick="pbsMonitor.openSnapshotViewer(\'' + snap.key + '\')"><div class="snapshot-browser"><div class="snapshot-dots"><i></i><i></i><i></i></div>' + body + '</div><div class="snapshot-card-foot"><strong>' + esc(snap.title) + '</strong><span>' + esc(snap.meta) + '</span></div></button>';
      }).join('') + '</div>';
  }

  function officialUrlFor(school) {
    var urls = {
      hku: 'https://admissions.hku.hk/',
      cuhk: 'https://www.gs.cuhk.edu.hk/admissions/',
      cityu: 'https://www.cityu.edu.hk/pg/admissions',
      hkbu: 'https://gs.hkbu.edu.hk/admission',
      polyu: 'https://www.polyu.edu.hk/study/pg/',
      lingnan: 'https://www.ln.edu.hk/admissions'
    };
    return urls[school.id] || 'https://www.google.com/';
  }

  function openOfficialSite() {
    var school = currentSchool();
    window.open(officialUrlFor(school), '_blank', 'noopener');
  }

  function renderSchoolDetail() {
    var school = currentSchool();
    var statusOptions = ['审核中', '待补材料', '面试中', '已录取', '未录取'];
    var hasPending = workItemsFor(school).some(function (item) { return workItemState(school, item) === 'pending'; });
    document.getElementById('monitorSchoolDetailHead').innerHTML =
      '<div class="school-focus-title"><h2>' + esc(school.name) + ' · 独立监控工作区</h2><p>当前流程：' + esc(school.milestone) + ' · 申请官网：' + esc(officialUrlFor(school).replace(/^https?:\/\//, '')) + '</p></div>' +
      '<div class="school-status-editor"><label for="schoolOverallStatus">学校申请状态</label><select id="schoolOverallStatus" class="monitor-select">' +
      statusOptions.map(function (status) { return '<option' + (status === school.status ? ' selected' : '') + '>' + status + '</option>'; }).join('') +
      '</select><button class="monitor-btn small" data-pbs-permission="monitor_site_manage" onclick="pbsMonitor.saveSchoolStatus()">保存状态</button>' +
      (hasPending ? '<button class="monitor-btn secondary small" data-pbs-permission="monitor_track" onclick="pbsMonitor.completeSchoolTodos()">本校待办全部完成</button>' : '') + '</div>';
    document.getElementById('schoolOverallStatus').setAttribute('data-pbs-permission', 'monitor_site_manage');
    document.getElementById('schoolOverallStatus').setAttribute('data-pbs-permission-mode', 'disable');
    document.getElementById('monitorMailBody').innerHTML = renderEmails(school);
    document.getElementById('monitorOfficialBody').innerHTML = renderOfficial(school);
    document.getElementById('monitorMailTitle').textContent = '邮件监控';
    document.getElementById('monitorOfficialTitle').textContent = '官网监控';
  }

  function selectSchool(id, trigger) {
    selectedSchoolId = id;
    document.querySelectorAll('.school-nav-item').forEach(function (item) {
      var active = item === trigger;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderSchoolDetail();
  }

  function saveSchoolStatus() {
    var school = currentSchool();
    var select = document.getElementById('schoolOverallStatus');
    school.status = select.value;
    try { localStorage.setItem('pbs_monitor_school_status_' + taskId + '_' + school.id, school.status); } catch (e) {}
    renderSchoolCards();
    renderSchoolDetail();
    showToast(school.name + '申请状态已更新为“' + school.status + '”');
  }

  function completeSchoolTodos() {
    var school = currentSchool();
    workItemsFor(school).forEach(function (item) {
      if (workItemState(school, item) === 'pending') saveWorkItemState(school, item, 'completed');
    });
    refreshDerivedTaskStatus();
    renderSchoolCards();
    renderSchoolDetail();
    showToast(school.name + '的待办已全部完成');
  }

  function syncCurrentMail() {
    var school = currentSchool();
    showToast('已更新' + school.name + '的邮件');
  }
  function readConfig() { try { return JSON.parse(localStorage.getItem('pbs_monitor_config_' + taskId)) || {}; } catch (e) { return {}; } }
  function openConfig() {
    var config = readConfig();
    document.getElementById('monitorMailProvider').value = config.provider || 'QQ 邮箱';
    document.getElementById('monitorMailAccount').value = config.account || '';
    document.getElementById('monitorMailAuthorization').value = '';
    document.getElementById('monitorMailAuthorization').placeholder = config.authorization ? '已配置，留空保持原授权码' : '请输入邮箱授权码';
    document.getElementById('monitorConfigFrequency').value = config.frequency || currentTask().frequency;
    document.getElementById('monitorConfigError').textContent = ''; modal('monitorConfigModal',true);
  }
  function saveConfig() {
    var old = readConfig(), account = document.getElementById('monitorMailAccount').value.trim(), authorization = document.getElementById('monitorMailAuthorization').value.trim();
    if (!account || (!authorization && (!old.authorization || old.account !== account))) { document.getElementById('monitorConfigError').textContent = '请填写邮箱账号与授权码'; return; }
    var config = { provider:document.getElementById('monitorMailProvider').value, account:account, authorization:authorization || old.authorization, frequency:document.getElementById('monitorConfigFrequency').value };
    localStorage.setItem('pbs_monitor_config_' + taskId,JSON.stringify(config)); currentTask().frequency = config.frequency;
    modal('monitorConfigModal',false); renderStudentStrip(); showToast('监控配置已保存');
  }
  function openMail(index) {
    var mail = currentSchool().emails[index]; if (!mail) return;
    document.getElementById('monitorMailModalTitle').textContent = mail.subject;
    document.getElementById('monitorMailModalBody').innerHTML = '<div class="text-sm text-gray-400 mb-5">发件人：' + esc(mail.from) + '<br>接收时间：' + esc(mail.receivedAt) + '</div><p>' + esc(mail.preview) + '</p>';
    modal('monitorMailModal',true);
  }
  function openMailAnalysis() {
    var school = currentSchool();
    document.getElementById('monitorMailModalTitle').textContent = school.name + ' · 邮件识别结果';
    document.getElementById('monitorMailModalBody').innerHTML = '<div class="mb-5"><span class="text-sm text-gray-400">申请状态</span><p class="font-semibold">' + esc(school.status) + '</p></div>' + school.emails.filter(function(mail){return mail.task;}).map(function(mail){return '<div style="padding:16px 0;border-top:1px solid #edf0f4"><strong>' + esc(mail.task.title) + '</strong><p class="text-sm text-gray-400 mt-2">截止时间：' + esc(mail.task.deadline) + '</p><p class="text-sm mt-2">' + esc(mail.preview) + '</p></div>';}).join('');
    modal('monitorMailModal',true);
  }

  function modal(id, open) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function openSnapshotUpload() {
    document.getElementById('snapshotFile').value = '';
    document.getElementById('snapshotPage').value = '';
    document.getElementById('snapshotFileName').textContent = '点击选择 PNG / JPG 截图';
    document.getElementById('snapshotUploadPreview').innerHTML = '';
    modal('monitorSnapshotModal', true);
  }

  function previewSnapshot(input) {
    if (!input.files || !input.files[0]) return;
    document.getElementById('snapshotFileName').textContent = input.files[0].name;
    var reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById('snapshotUploadPreview').innerHTML = '<img src="' + event.target.result + '" alt="截图预览">';
    };
    reader.readAsDataURL(input.files[0]);
  }

  function submitSnapshot() {
    var input = document.getElementById('snapshotFile');
    if (!input.files || !input.files[0]) { showToast('请先选择截图文件'); return; }
    var pageInput = document.getElementById('snapshotPage');
    var title = (pageInput.value || '').trim();
    if (!title) { showToast('请填写截图类型'); pageInput.focus(); return; }
    var snapshots = siteFor(currentSchool()).snapshots;
    var snapshot = snapshots.filter(function (item) { return item.title === title; })[0];
    if (!snapshot) {
      snapshot = { key: 'custom-' + Date.now(), title: title, meta: '尚未上传' };
      snapshots.push(snapshot);
    }
    var reader = new FileReader();
    reader.onload = function (event) {
      snapshot.dataUrl = event.target.result;
      snapshot.meta = '测试账号上传 · ' + nowText();
      modal('monitorSnapshotModal', false);
      pageInput.value = '';
      renderSchoolDetail();
      showToast(snapshot.title + '已上传并归档');
    };
    reader.readAsDataURL(input.files[0]);
  }

  function openSnapshotViewer(key) {
    var snapshot = siteFor(currentSchool()).snapshots.filter(function (item) { return item.key === key; })[0];
    document.getElementById('snapshotViewerTitle').textContent = currentSchool().name + ' · ' + snapshot.title;
    document.getElementById('snapshotViewerBody').innerHTML = snapshot.dataUrl ? '<img src="' + snapshot.dataUrl + '" alt="' + esc(snapshot.title) + '">' : '<div class="snapshot-large-mock">当前展示为申请系统页面结构快照，上传真实截图后将在此完整预览。</div>';
    modal('monitorSnapshotViewer', true);
  }

  function nowText() {
    var date = new Date();
    function p(value) { return value < 10 ? '0' + value : value; }
    return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate()) + ' ' + p(date.getHours()) + ':' + p(date.getMinutes());
  }

  function initList() {
    taskId = 1;
    taskRows.forEach(function(task){try { var config = JSON.parse(localStorage.getItem('pbs_monitor_config_' + task.id)); if (config) task.frequency = config.frequency; } catch(e) {}});
    renderList();
    ['monitorKeyword', 'monitorStatusFilter', 'monitorFrequencyFilter'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener(id === 'monitorKeyword' ? 'input' : 'change', renderList);
    });
  }

  function initDetail() {
    try { taskId = parseInt(new URLSearchParams(window.location.search).get('id') || '1', 10) || 1; } catch (e) { taskId = 1; }
    loadManualStatuses();
    selectedSchoolId = sortedSchools()[0].id;
    renderStudentStrip();
    renderSchoolCards();
    renderSchoolDetail();
  }

  window.pbsMonitor = {
    renderList: renderList,
    resetListFilters: resetListFilters,
    openDetail: openDetail,
    selectSchool: selectSchool,
    saveSchoolStatus: saveSchoolStatus,
    completeSchoolTodos: completeSchoolTodos,
    syncCurrentMail: syncCurrentMail,
    openConfig:openConfig,
    saveConfig:saveConfig,
    openMail:openMail,
    openMailAnalysis:openMailAnalysis,
    showToast: showToast,
    openSnapshotUpload: openSnapshotUpload,
    previewSnapshot: previewSnapshot,
    submitSnapshot: submitSnapshot,
    openSnapshotViewer: openSnapshotViewer,
    openOfficialSite: openOfficialSite,
    closeModal: function (id) { modal(id, false); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-monitor-page');
    if (page === 'list') initList();
    if (page === 'detail') initDetail();
  });
})();
