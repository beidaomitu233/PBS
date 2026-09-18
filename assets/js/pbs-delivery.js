(function () {
  'use strict';

  var STORE_KEY = 'pbs_delivered_files_v3';
  var ACTIVE_SCHOOL = '卡内基梅隆大学';
  var proofFile = null;
  var nodes = [
    { id: 'document', name: '文书', empty: '暂无已审核通过的文书' },
    { id: 'application', name: '网申', empty: '暂无网申提交证明或网申结果' },
    { id: 'interview', name: '面试辅导', empty: '面试辅导阶段仅展示服务进度，无需交付文件' },
    { id: 'closure', name: '结项报告', empty: '暂无已保存的结项报告' }
  ];

  function seedRecords() {
    return [
      { id: 'doc-cmu-ps-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '个人陈述', fileName: 'CMU-个人陈述-V1.pdf', version: 'V1', source: '文书审核', sourceKey: 'cmu-ps-v1', createdAt: '2026-09-10 10:15', status: 'pending' },
      { id: 'doc-cmu-ps-v2', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '个人陈述', fileName: 'CMU-个人陈述-V2.pdf', version: 'V2', source: '文书审核', sourceKey: 'cmu-ps-v2', createdAt: '2026-09-13 14:20', status: 'pending' },
      { id: 'doc-cmu-ps-v3', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '个人陈述', fileName: 'CMU-个人陈述-V3.pdf', version: 'V3', source: '文书审核', sourceKey: 'cmu-ps-v3', createdAt: '2026-09-16 16:30', status: 'verified' },
      { id: 'doc-cmu-rl-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '推荐信', fileName: 'CMU-推荐信-V1.pdf', version: 'V1', source: '文书审核', sourceKey: 'cmu-rl-v1', createdAt: '2026-09-11 09:40', status: 'pending' },
      { id: 'doc-cmu-rl-v2', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '推荐信', fileName: 'CMU-推荐信-V2.pdf', version: 'V2', source: '文书审核', sourceKey: 'cmu-rl-v2', createdAt: '2026-09-15 11:20', status: 'pending' },
      { id: 'doc-cmu-cv-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '学术简历', fileName: 'CMU-学术简历-V1.pdf', version: 'V1', source: '文书审核', sourceKey: 'cmu-cv-v1', createdAt: '2026-09-12 13:10', status: 'pending' },
      { id: 'doc-cmu-cv-v2', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '学术简历', fileName: 'CMU-学术简历-V2.pdf', version: 'V2', source: '文书审核', sourceKey: 'cmu-cv-v2', createdAt: '2026-09-16 10:05', status: 'verified' },
      { id: 'doc-cmu-rp-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '研究计划', fileName: 'CMU-研究计划-V1.pdf', version: 'V1', source: '文书审核', sourceKey: 'cmu-rp-v1', createdAt: '2026-09-12 16:45', status: 'pending' },
      { id: 'doc-cmu-rp-v2', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '研究计划', fileName: 'CMU-研究计划-V2.pdf', version: 'V2', source: '文书审核', sourceKey: 'cmu-rp-v2', createdAt: '2026-09-17 10:20', status: 'verified' },
      { id: 'doc-cmu-cl-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'document', name: '套磁信', fileName: 'CMU-套磁信-V1.pdf', version: 'V1', source: '文书审核', sourceKey: 'cmu-cl-v1', createdAt: '2026-09-14 15:35', status: 'pending' },
      { id: 'app-cmu-proof-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'application', name: '网申提交证明', fileName: 'CMU-网申提交确认页.pdf', version: 'V1', source: '网申任务', sourceKey: 'cmu-proof-v1', createdAt: '2026-09-17 09:10', status: 'pending' },
      { id: 'close-cmu-client-v1', school: '卡内基梅隆大学', major: '计算机科学', node: 'closure', name: '客户项目结项报告', fileName: 'CMU-客户项目结项报告-V1.pdf', version: 'V1', source: '结项管理', sourceKey: 'cmu-close-client-v1', createdAt: '2026-09-17 14:00', status: 'pending' },
      { id: 'doc-ic-ps-v2', school: '帝国理工学院', major: '金融工程', node: 'document', name: '个人陈述', fileName: 'IC-个人陈述-V2.pdf', version: 'V2', source: '文书审核', sourceKey: 'ic-ps-v2', createdAt: '2026-09-12 15:40', status: 'verified' }
    ];
  }

  function readRecords() {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      var seeded = seedRecords();
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try { return JSON.parse(raw) || []; } catch (error) {
      var fallback = seedRecords();
      localStorage.setItem(STORE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  function writeRecords(records) {
    localStorage.setItem(STORE_KEY, JSON.stringify(records));
  }

  function nowText() {
    var now = new Date();
    function pad(value) { return String(value).padStart(2, '0'); }
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  }

  function nextVersion(records, school, node, name) {
    var count = records.filter(function (item) { return item.school === school && item.node === node && item.name === name; }).length;
    return 'V' + (count + 1);
  }

  function archive(input) {
    var records = readRecords();
    var sourceKey = input.sourceKey || [input.school, input.node, input.name, input.version].join('-');
    var existed = records.find(function (item) { return item.sourceKey === sourceKey; });
    if (existed) return existed;
    var version = input.version || nextVersion(records, input.school, input.node, input.name);
    var record = {
      id: input.id || ('delivery-' + Date.now() + '-' + Math.random().toString(16).slice(2)),
      school: input.school || ACTIVE_SCHOOL,
      major: input.major || '计算机科学',
      node: input.node,
      name: input.name,
      fileName: input.fileName,
      version: version,
      source: input.source,
      sourceKey: sourceKey,
      createdAt: input.createdAt || nowText(),
      status: 'pending'
    };
    records.unshift(record);
    writeRecords(records);
    renderArchive();
    if (typeof window.renderPaymentInfo === 'function') window.renderPaymentInfo();
    return record;
  }

  function statusText(status) {
    if (status === 'submitted') return '已提交商城';
    return '待提交';
  }

  function statusClass(status) {
    if (status === 'submitted') return 'is-submitted';
    return '';
  }

  function archiveFileName(record) {
    var student = (document.getElementById('profile-student-name') || {}).textContent || '张明';
    var extension = (record.fileName.match(/\.[^.]+$/) || ['.pdf'])[0];
    return student.trim() + '-' + record.school + '-' + record.name + '-' + record.version + extension;
  }

  function schoolList(records) {
    var map = {};
    records.forEach(function (item) { map[item.school] = item.major; });
    if (!map[ACTIVE_SCHOOL]) map[ACTIVE_SCHOOL] = '计算机科学';
    return Object.keys(map).map(function (name) { return { name: name, major: map[name] }; });
  }

  function mountArchiveSection() {
    if (document.getElementById('sec-delivered')) return;
    var asset = document.getElementById('sec-asset');
    if (!asset) return;
    var section = document.createElement('section');
    section.id = 'sec-delivered';
    section.dataset.section = 'delivered';
    section.className = 'pbs-delivery-section bg-white rounded-xl shadow-sm border border-gray-100 scroll-mt-24';
    section.innerHTML = '<div class="pbs-delivery-head"><div><h2 class="pbs-delivery-title"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l5 5v11a2 2 0 0 1-2 2Z"/></svg>已交付文件</h2><p class="pbs-delivery-path">档案 / 目标学校 / 已交付文件</p></div></div><div class="pbs-delivery-body"><div id="pbsDeliverySchools" class="pbs-delivery-schools"></div><div id="pbsDeliveryNodes"></div></div>';
    asset.parentNode.insertBefore(section, asset);
    var assetLink = document.querySelector('[data-target="sec-asset"]');
    if (assetLink) {
      var link = assetLink.cloneNode(true);
      link.dataset.target = 'sec-delivered';
      link.textContent = '已交付文件';
      link.href = '#sec-delivered';
      assetLink.parentNode.insertBefore(link, assetLink);
    }
    renderArchive();
  }

  function renderArchive() {
    var schoolRoot = document.getElementById('pbsDeliverySchools');
    var nodeRoot = document.getElementById('pbsDeliveryNodes');
    if (!schoolRoot || !nodeRoot) return;
    var records = readRecords();
    var schools = schoolList(records);
    if (!schools.some(function (school) { return school.name === ACTIVE_SCHOOL; })) ACTIVE_SCHOOL = schools[0].name;
    schoolRoot.innerHTML = schools.map(function (school) {
      var schoolRecords = records.filter(function (item) { return item.school === school.name; });
      var typeCount = Object.keys(schoolRecords.reduce(function (map, item) { map[item.node + '-' + item.name] = true; return map; }, {})).length;
      return '<button class="pbs-delivery-school ' + (school.name === ACTIVE_SCHOOL ? 'is-active' : '') + '" data-school="' + school.name + '"><strong>' + school.name + '</strong><span>' + school.major + ' · ' + typeCount + ' 类文件</span></button>';
    }).join('');
    schoolRoot.querySelectorAll('[data-school]').forEach(function (button) {
      button.addEventListener('click', function () { ACTIVE_SCHOOL = button.dataset.school; renderArchive(); });
    });
    nodeRoot.innerHTML = nodes.filter(function (node) { return node.id !== 'interview'; }).map(function (node) {
      var items = records.filter(function (item) { return item.school === ACTIVE_SCHOOL && item.node === node.id; });
      var grouped = items.reduce(function (map, item) {
        if (!map[item.name]) map[item.name] = [];
        map[item.name].push(item);
        return map;
      }, {});
      var names = Object.keys(grouped);
      var rows = names.length ? names.map(function (name) {
        var versions = grouped[name].sort(function (a, b) { return Number(b.version.replace(/\D/g, '')) - Number(a.version.replace(/\D/g, '')); });
        var current = versions[0];
        var options = versions.map(function (item, index) {
          var displayName = archiveFileName(item);
          return '<button type="button" class="pbs-version-option ' + (index === 0 ? 'is-active' : '') + '" data-archive-version-option="' + item.id + '" data-version-label="' + item.version + '" data-version-file="' + displayName + '" data-version-time="' + item.createdAt + '" data-version-status="' + item.status + '"><strong>' + item.version + '</strong><small>' + displayName + '</small></button>';
        }).join('');
        return '<div class="pbs-delivery-file"><div class="pbs-delivery-file-name"><strong>' + name + '</strong><span data-archive-file-summary>' + archiveFileName(current) + ' · ' + current.createdAt + '</span></div><div class="pbs-version-picker pbs-archive-version-picker"><span class="pbs-version-label">版本</span><button type="button" class="pbs-version-trigger" data-archive-version-trigger><strong data-archive-version-label>' + current.version + '</strong><svg viewBox="0 0 20 20" fill="none"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="pbs-version-menu">' + options + '</div></div><span class="pbs-delivery-status ' + statusClass(current.status) + '">' + statusText(current.status) + '</span><button class="pbs-delivery-view" data-view-record="' + current.id + '">查看</button></div>';
      }).join('') : '<div class="pbs-delivery-empty">' + node.empty + '</div>';
      return '<div class="pbs-delivery-node"><div class="pbs-delivery-node-head"><h3>' + node.name + '</h3></div><div class="pbs-delivery-files">' + rows + '</div></div>';
    }).join('');
    nodeRoot.querySelectorAll('[data-archive-version-trigger]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var picker = button.closest('.pbs-version-picker');
        nodeRoot.querySelectorAll('.pbs-version-picker.is-open').forEach(function (item) { if (item !== picker) item.classList.remove('is-open'); });
        picker.classList.toggle('is-open');
      });
    });
    nodeRoot.querySelectorAll('[data-archive-version-option]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var row = button.closest('.pbs-delivery-file');
        row.querySelectorAll('[data-archive-version-option]').forEach(function (option) { option.classList.remove('is-active'); });
        button.classList.add('is-active');
        row.querySelector('[data-archive-version-label]').textContent = button.dataset.versionLabel;
        row.querySelector('[data-archive-file-summary]').textContent = button.dataset.versionFile + ' · ' + button.dataset.versionTime;
        var state = row.querySelector('.pbs-delivery-status');
        state.textContent = statusText(button.dataset.versionStatus);
        state.className = 'pbs-delivery-status ' + statusClass(button.dataset.versionStatus);
        row.querySelector('[data-view-record]').dataset.viewRecord = button.dataset.archiveVersionOption;
        button.closest('.pbs-version-picker').classList.remove('is-open');
      });
    });
    nodeRoot.onclick = function (event) {
      if (!event.target.closest('.pbs-version-picker')) nodeRoot.querySelectorAll('.pbs-version-picker.is-open').forEach(function (picker) { picker.classList.remove('is-open'); });
    };
    nodeRoot.querySelectorAll('[data-view-record]').forEach(function (button) {
      button.addEventListener('click', function () { openRecord(button.dataset.viewRecord); });
    });
  }

  function ensureModal() {
    var modal = document.getElementById('pbsDeliveryModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'pbsDeliveryModal';
    modal.className = 'pbs-delivery-modal';
    modal.innerHTML = '<div class="pbs-delivery-mask" data-delivery-close></div><div class="pbs-delivery-dialog" role="dialog" aria-modal="true"><div class="pbs-delivery-dialog-head"><div><h3 id="pbsDeliveryModalTitle"></h3><p id="pbsDeliveryModalSub"></p></div><button class="pbs-delivery-close" data-delivery-close aria-label="关闭">×</button></div><div id="pbsDeliveryModalBody" class="pbs-delivery-dialog-body"></div><div id="pbsDeliveryModalFoot" class="pbs-delivery-dialog-foot"></div></div>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-delivery-close]').forEach(function (target) { target.addEventListener('click', closeModal); });
    return modal;
  }

  function openModal(title, sub, body, foot) {
    var modal = ensureModal();
    modal.querySelector('.pbs-delivery-dialog').classList.remove('pbs-delivery-dialog--submit');
    document.getElementById('pbsDeliveryModalTitle').textContent = title;
    document.getElementById('pbsDeliveryModalSub').textContent = sub || '';
    document.getElementById('pbsDeliveryModalBody').innerHTML = body || '';
    document.getElementById('pbsDeliveryModalFoot').innerHTML = foot || '<button class="pbs-delivery-secondary" data-delivery-close>关闭</button>';
    document.getElementById('pbsDeliveryModalFoot').querySelectorAll('[data-delivery-close]').forEach(function (target) { target.addEventListener('click', closeModal); });
    modal.classList.add('is-open');
  }

  function closeModal() {
    var modal = document.getElementById('pbsDeliveryModal');
    if (modal) modal.classList.remove('is-open');
  }

  function openRecord(id) {
    var record = readRecords().find(function (item) { return item.id === id; });
    if (!record) return;
    openModal(record.name, record.school + ' · ' + record.major + ' · ' + record.version, previewMarkup(record), '<button class="pbs-delivery-secondary" data-delivery-close>关闭</button>');
  }

  function previewMarkup(record) {
    if (record.node === 'document') {
      return '<article class="pbs-delivery-document-preview"><header class="pbs-delivery-document-head"><strong>' + record.name + '</strong><span>' + record.fileName + ' · ' + record.version + '</span></header>' +
        '<div class="pbs-delivery-document-scroll"><p>申请材料应完整呈现学生的学术准备、实践经历与申请动机，并围绕目标专业建立清晰的叙事主线。</p><p>在学术经历部分，文书结合课程学习、科研训练和项目实践，说明申请人如何逐步形成专业兴趣，并通过具体成果证明其学习与研究能力。</p><p>在项目匹配部分，内容进一步对应目标院校的课程设置、研究方向和培养特点，说明申请人的背景与项目要求之间的关联。</p><p>文书同时保留了申请人的个人表达方式，避免模板化叙述，并对关键事实、时间和成果数据进行了统一核对。</p><p>职业规划部分说明了短期学习目标和长期发展方向，使项目选择、能力提升与未来规划形成连续逻辑。</p><p>本预览区域支持长文滚动查看。项目经理可在当前弹窗中完成版本确认，无需前往学生档案执行额外核验。</p></div></article>';
    }
    return '<div class="pbs-delivery-preview"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg><strong>' + record.fileName + '</strong><p>来源：' + record.source + '　归档时间：' + record.createdAt + '</p></div>';
  }

  function currentPackageSchool() {
    return window.selectedPackageId === 'ic' ? '帝国理工学院' : '卡内基梅隆大学';
  }

  function nodeAmount(packageId, nodeId) {
    var amounts = {
      cmu: { document: 32000, application: 20000, interview: 6000, closure: 0 },
      ic: { document: 22000, application: 12000, interview: 0, closure: 4000 }
    };
    return (amounts[packageId] || amounts.cmu)[nodeId] || 0;
  }

  function money(value) { return value ? '¥' + Number(value).toLocaleString('en-US') : '套餐内'; }

  function renderPaymentNodes() {
    var root = document.getElementById('paymentInfo');
    if (!root) return;
    var records = readRecords();
    var school = currentPackageSchool();
    var packageId = window.selectedPackageId || 'cmu';
    var packageRecords = records.filter(function (item) { return item.school === school; });
    var total = nodes.reduce(function (sum, node) { return sum + nodeAmount(packageId, node.id); }, 0);
    var submittedCount = packageRecords.filter(function (item) { return item.status === 'submitted'; }).length;
    var html = '<div class="pbs-payment-summary"><div><strong>' + money(total) + '</strong><span>四个服务节点总额</span></div><div style="text-align:right"><strong>' + submittedCount + ' 份</strong><span>已提交商城</span></div></div><div class="pbs-payment-nodes">';
    nodes.forEach(function (node) {
      var files = packageRecords.filter(function (item) { return item.node === node.id; });
      var submitted = files.filter(function (item) { return item.status === 'submitted'; }).length;
      var available = files.filter(function (item) { return item.status !== 'submitted'; }).length;
      var state = files.length ? (submitted === files.length ? '已全部提交' : (submitted ? '已提交 ' + submitted + '/' + files.length : '待提交')) : '暂无文件';
      var stateClass = submitted ? 'is-sent' : (available ? 'is-ready' : '');
      var detail = node.id === 'document' ? '审核通过版本' : (node.id === 'application' ? '提交证明与结果分阶段交付' : (node.id === 'interview' ? '服务进度展示' : '客户结项报告'));
      if (node.id === 'interview') {
        html += '<div class="pbs-payment-node is-display-only"><div><strong>' + node.name + '</strong><small>' + detail + '</small></div><span class="pbs-payment-amount">' + money(nodeAmount(packageId, node.id)) + '</span><span class="pbs-payment-files">无需交付文件</span><span class="pbs-payment-state is-ready">服务进行中</span><span class="pbs-payment-display-only">进度展示</span></div>';
      } else {
        html += '<div class="pbs-payment-node"><div><strong>' + node.name + '</strong><small>' + detail + '</small></div><span class="pbs-payment-amount">' + money(nodeAmount(packageId, node.id)) + '</span><span class="pbs-payment-files">' + files.length + ' 份归档文件</span><span class="pbs-payment-state ' + stateClass + '">' + state + '</span><button class="pbs-payment-action" data-submit-node="' + node.id + '" ' + (available ? '' : 'disabled') + '>提交交付文件</button></div>';
      }
    });
    root.innerHTML = html + '</div>';
    root.querySelectorAll('[data-submit-node]').forEach(function (button) { button.addEventListener('click', function () { openSubmit(button.dataset.submitNode); }); });
  }

  function openSubmit(nodeId) {
    var school = currentPackageSchool();
    var records = readRecords();
    var grouped = {};
    records.filter(function (item) { return item.school === school && item.node === nodeId; }).forEach(function (item) {
      if (!grouped[item.name]) grouped[item.name] = [];
      grouped[item.name].push(item);
    });
    var node = nodes.find(function (item) { return item.id === nodeId; });
    var rows = Object.keys(grouped).map(function (name) {
      var versions = grouped[name].sort(function (a, b) { return Number(b.version.replace(/\D/g, '')) - Number(a.version.replace(/\D/g, '')); });
      var ready = versions.filter(function (item) { return item.status !== 'submitted'; });
      var current = ready[0] || versions[0];
      var options = ready.map(function (item, index) {
        return '<button type="button" class="pbs-version-option ' + (index === 0 ? 'is-active' : '') + '" data-version-option="' + item.id + '" data-version-label="' + item.version + '" data-version-file="' + item.fileName + '"><strong>' + item.version + '</strong><small>' + item.fileName + '</small></button>';
      }).join('');
      return '<div class="pbs-delivery-choice ' + (ready.length ? '' : 'is-disabled') + '"><input type="checkbox" data-delivery-choice ' + (ready.length ? '' : 'disabled') + '><button type="button" class="pbs-choice-main" data-choice-toggle ' + (ready.length ? '' : 'disabled') + '><span class="pbs-choice-check"><svg viewBox="0 0 20 20" fill="none"><path d="m5 10 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="pbs-choice-copy"><strong>' + name + '</strong><small data-current-version-summary>' + current.fileName + '</small></span></button><div class="pbs-version-picker"><span class="pbs-version-label">版本</span><button type="button" class="pbs-version-trigger" data-version-trigger ' + (ready.length ? '' : 'disabled') + '><strong data-current-version-label>' + current.version + '</strong><svg viewBox="0 0 20 20" fill="none"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="pbs-version-menu">' + options + '</div><input type="hidden" data-delivery-version value="' + current.id + '"></div><button class="pbs-delivery-preview-button" type="button" data-preview-delivery="' + current.id + '"><svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg><span>预览</span></button></div>';
    }).join('');
    if (!rows) rows = '<div class="pbs-delivery-empty">该节点暂无已交付文件</div>';
    var body = '<div class="pbs-submit-layout"><div class="pbs-submit-file-panel"><div class="pbs-submit-panel-title"><span>选择文书与版本</span><strong id="selectedDeliveryCount">已选 0 项</strong></div><div class="pbs-submit-list">' + rows + '</div></div><div class="pbs-submit-preview-panel"><div class="pbs-submit-panel-title"><span>文件预览</span></div><div id="pbsInlineDeliveryPreview" class="pbs-submit-preview-empty">点击左侧“预览”查看文件内容</div></div></div>';
    openModal('提交' + node.name + '交付文件', school + ' · 选择文件和版本后提交至商城', body, '<button class="pbs-delivery-secondary" data-delivery-close>取消</button><button class="pbs-delivery-primary" id="pbsDeliverySubmitConfirm">提交商城</button>');
    document.querySelector('#pbsDeliveryModal .pbs-delivery-dialog').classList.add('pbs-delivery-dialog--submit');
    var confirm = document.getElementById('pbsDeliverySubmitConfirm');
    function syncChoiceState() {
      var selected = document.querySelectorAll('[data-delivery-choice]:checked').length;
      var count = document.getElementById('selectedDeliveryCount');
      if (count) count.textContent = '已选 ' + selected + ' 项';
      confirm.disabled = selected === 0;
    }
    document.querySelectorAll('[data-choice-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var row = button.closest('.pbs-delivery-choice');
        var checkbox = row.querySelector('[data-delivery-choice]');
        checkbox.checked = !checkbox.checked;
        row.classList.toggle('is-selected', checkbox.checked);
        button.setAttribute('aria-pressed', checkbox.checked ? 'true' : 'false');
        syncChoiceState();
      });
    });
    document.querySelectorAll('[data-version-trigger]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var picker = button.closest('.pbs-version-picker');
        document.querySelectorAll('.pbs-version-picker.is-open').forEach(function (item) {
          if (item !== picker) item.classList.remove('is-open');
        });
        picker.classList.toggle('is-open');
      });
    });
    document.querySelectorAll('[data-version-option]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var row = button.closest('.pbs-delivery-choice');
        row.querySelectorAll('[data-version-option]').forEach(function (option) { option.classList.remove('is-active'); });
        button.classList.add('is-active');
        row.querySelector('[data-delivery-version]').value = button.dataset.versionOption;
        row.querySelector('[data-current-version-label]').textContent = button.dataset.versionLabel;
        row.querySelector('[data-current-version-summary]').textContent = button.dataset.versionFile;
        row.querySelector('[data-preview-delivery]').dataset.previewDelivery = button.dataset.versionOption;
        button.closest('.pbs-version-picker').classList.remove('is-open');
        var checkbox = row.querySelector('[data-delivery-choice]');
        if (!checkbox.checked) {
          checkbox.checked = true;
          row.classList.add('is-selected');
          row.querySelector('[data-choice-toggle]').setAttribute('aria-pressed', 'true');
        }
        row.querySelector('[data-preview-delivery]').click();
        syncChoiceState();
      });
    });
    document.querySelector('.pbs-submit-file-panel').addEventListener('click', function () {
      document.querySelectorAll('.pbs-version-picker.is-open').forEach(function (picker) { picker.classList.remove('is-open'); });
    });
    document.querySelectorAll('[data-preview-delivery]').forEach(function (button) {
      button.addEventListener('click', function () {
        var row = button.closest('.pbs-delivery-choice');
        var select = row.querySelector('[data-delivery-version]');
        var id = select && select.value ? select.value : button.dataset.previewDelivery;
        var record = readRecords().find(function (item) { return item.id === id; });
        if (record) document.getElementById('pbsInlineDeliveryPreview').innerHTML = previewMarkup(record);
      });
    });
    var firstPreview = document.querySelector('[data-preview-delivery]');
    if (firstPreview) firstPreview.click();
    syncChoiceState();
    confirm.addEventListener('click', function () {
      var ids = [];
      document.querySelectorAll('.pbs-delivery-choice').forEach(function (row) {
        var checkbox = row.querySelector('[data-delivery-choice]');
        var select = row.querySelector('[data-delivery-version]');
        if (checkbox && checkbox.checked && select && select.value) ids.push(select.value);
      });
      if (!ids.length) { window.alert('请选择要提交的文件与版本'); return; }
      var all = readRecords();
      all.forEach(function (item) { if (ids.indexOf(item.id) >= 0) { item.status = 'submitted'; item.submittedAt = nowText(); item.submittedNode = nodeId; } });
      writeRecords(all);
      closeModal();
      renderPaymentNodes();
      renderArchive();
      window.alert('已按“' + node.name + '”节点提交 ' + ids.length + ' 份文件至商城');
    });
  }

  function injectApplicationProof() {
    var resultInput = document.getElementById('resultOfferImageInput');
    if (!resultInput || document.getElementById('applicationProofInput')) return;
    var resultBlock = resultInput.closest('.col-span-3');
    if (!resultBlock) return;
    var container = resultBlock.parentNode;
    var card = container.closest('.bg-white.rounded-xl');
    var title = card && card.querySelector('h2');
    if (title) title.textContent = '网申交付进度';
    resultBlock.innerHTML = '<div class="pbs-stage-upload"><input id="resultOfferImageInput" type="file" accept="image/*" hidden onchange="previewResultImage(this.files[0])"><div id="resultOfferImageEmpty"><strong>选择 Offer 或结果凭证</strong><span>支持 JPG、PNG</span></div><div id="resultOfferImagePreview" class="hidden"><img id="resultOfferImage" class="hidden" alt="网申结果文件"><strong id="resultOfferImageName"></strong><span>已选择，可继续更换</span></div><button type="button" onclick="document.getElementById(\'resultOfferImageInput\').click()">选择文件</button></div>';
    var originalChildren = Array.from(container.children);
    var proofStage = document.createElement('section');
    proofStage.className = 'pbs-application-stage is-current';
    proofStage.innerHTML = '<div class="pbs-application-stage-head"><div class="pbs-application-stage-title"><span class="pbs-application-stage-step">1</span><div><strong>网申提交证明</strong><small>提交院校申请后归档凭证，任务继续进入等待结果阶段</small></div></div><span id="applicationProofStageState" class="pbs-application-stage-state">待归档</span></div><div class="pbs-stage-upload"><input id="applicationProofInput" type="file" accept="image/*,.pdf" hidden><div><strong id="applicationProofName">选择提交确认页或提交回执</strong><span>支持 PDF、JPG、PNG</span></div><button type="button" id="applicationProofButton">选择文件</button></div><div class="pbs-application-stage-actions"><button type="button" id="archiveApplicationProof" class="pbs-delivery-primary">归档提交证明</button></div>';
    var resultStage = document.createElement('section');
    resultStage.className = 'pbs-application-stage';
    resultStage.innerHTML = '<div class="pbs-application-stage-head"><div class="pbs-application-stage-title"><span class="pbs-application-stage-step">2</span><div><strong>网申结果</strong><small>院校发布结果后补充结果信息与凭证</small></div></div><span id="applicationResultStageState" class="pbs-application-stage-state">等待结果</span></div><div class="pbs-application-fields"></div>';
    originalChildren.forEach(function (child) { resultStage.querySelector('.pbs-application-fields').appendChild(child); });
    var resultActions = container.nextElementSibling;
    if (resultActions && resultActions.querySelector('button[onclick*="saveAdmissionResult"]')) {
      resultActions.className = 'pbs-application-stage-actions';
      resultStage.appendChild(resultActions);
    }
    container.className = 'pbs-application-flow';
    container.appendChild(proofStage);
    container.appendChild(resultStage);
    function setResultStageEnabled(enabled) {
      resultStage.classList.toggle('is-disabled', !enabled);
      resultStage.querySelectorAll('input, select, textarea, button').forEach(function (control) { control.disabled = !enabled; });
    }
    setResultStageEnabled(false);
    if (typeof window.renderResultImage === 'function') window.renderResultImage('');
    var input = proofStage.querySelector('input');
    proofStage.querySelector('#applicationProofButton').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      proofFile = input.files && input.files[0] ? input.files[0] : null;
      document.getElementById('applicationProofName').textContent = proofFile ? proofFile.name : '选择提交确认页或提交回执';
    });
    proofStage.querySelector('#archiveApplicationProof').addEventListener('click', function () {
      if (!proofFile) { window.alert('请先选择网申提交证明'); return; }
      archive({ school: ACTIVE_SCHOOL, major: '计算机科学', node: 'application', name: '网申提交证明', fileName: proofFile.name, source: '网申任务', sourceKey: 'proof-' + proofFile.name + '-' + proofFile.lastModified });
      document.getElementById('applicationProofStageState').textContent = '已归档 · 等待结果';
      document.getElementById('applicationProofStageState').classList.add('is-done');
      proofStage.classList.remove('is-current');
      proofStage.classList.add('is-complete');
      resultStage.classList.add('is-current');
      setResultStageEnabled(true);
      window.alert('网申提交证明已归档，网申任务继续等待院校结果');
    });
    if (readRecords().some(function (item) { return item.school === ACTIVE_SCHOOL && item.node === 'application' && item.name === '网申提交证明'; })) {
      document.getElementById('applicationProofStageState').textContent = '已归档 · 等待结果';
      document.getElementById('applicationProofStageState').classList.add('is-done');
      proofStage.classList.remove('is-current');
      proofStage.classList.add('is-complete');
      resultStage.classList.add('is-current');
      setResultStageEnabled(true);
    }
  }

  function wrapSourceActions() {
    if (typeof window.approveReview === 'function' && !window.approveReview.__deliveryWrapped) {
      var approve = window.approveReview;
      window.approveReview = function () {
        approve.apply(this, arguments);
        archive({ school: ACTIVE_SCHOOL, major: '计算机科学', node: 'document', name: '个人陈述', fileName: 'CMU-个人陈述-终稿.pdf', source: '文书审核', sourceKey: 'review-' + nowText().slice(0, 10) });
        var done = document.getElementById('reviewDone');
        if (done) done.querySelector('span').textContent = '已审核通过，当前版本已归档至“已交付文件”';
      };
      window.approveReview.__deliveryWrapped = true;
      var approveButton = document.querySelector('button[onclick*="approveReview"]');
      if (approveButton) approveButton.textContent = '审核通过并归档';
    }
    if (typeof window.saveAdmissionResult === 'function' && !window.saveAdmissionResult.__deliveryWrapped) {
      var saveResult = window.saveAdmissionResult;
      window.saveAdmissionResult = function () {
        var result = document.getElementById('admissionResult');
        if (!result || !result.value) return saveResult.apply(this, arguments);
        if (!window.selectedResultImageData) { window.alert('请上传网申结果文件'); return; }
        saveResult.apply(this, arguments);
        archive({ school: ACTIVE_SCHOOL, major: '计算机科学', node: 'application', name: '网申结果', fileName: (document.getElementById('resultOfferImageName') || {}).textContent || '网申结果图片.png', source: '网申任务', sourceKey: 'result-' + result.value + '-' + nowText().slice(0, 10) });
        var stageState = document.getElementById('applicationResultStageState');
        if (stageState) { stageState.textContent = '结果已归档'; stageState.classList.add('is-done'); }
      };
      window.saveAdmissionResult.__deliveryWrapped = true;
      var resultButton = document.querySelector('button[onclick*="saveAdmissionResult"]');
      if (resultButton) resultButton.textContent = '保存并归档结果';
    }
    if (typeof window.saveReport === 'function' && !window.saveReport.__deliveryWrapped) {
      var saveReport = window.saveReport;
      window.saveReport = function () {
        saveReport.apply(this, arguments);
        var store = window.reportStore || {};
        var report = store[window.currentReportId];
        if (report) archive({ school: ACTIVE_SCHOOL, major: '计算机科学', node: 'closure', name: report.title, fileName: 'CMU-' + report.title + '.pdf', source: '结项管理', sourceKey: 'report-' + report.id });
      };
      window.saveReport.__deliveryWrapped = true;
      var reportSaveButton = document.querySelector('button[onclick*="saveReport"]');
      if (reportSaveButton && document.getElementById('reportModal')) reportSaveButton.textContent = '保存并归档';
    }
  }

  function enhancePayment() {
    if (!document.getElementById('paymentInfo')) return;
    var title = document.getElementById('paymentInfo').previousElementSibling;
    if (title && title.textContent.indexOf('支付信息') >= 0) {
      title.childNodes.forEach(function (node) { if (node.nodeType === 3 && node.textContent.indexOf('支付信息') >= 0) node.textContent = ' 支付与交付信息 '; });
    }
    window.renderPaymentInfo = renderPaymentNodes;
    renderPaymentNodes();
  }

  function init() {
    mountArchiveSection();
    injectApplicationProof();
    wrapSourceActions();
    enhancePayment();
  }

  window.PBSDelivery = {
    archive: archive,
    openSubmit: openSubmit,
    renderArchive: renderArchive,
    renderPayment: renderPaymentNodes
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
