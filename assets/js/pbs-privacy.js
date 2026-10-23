(function () {
  'use strict';
  var BRAND = '壹言申途';
  var POLICY_KEYS = ['user', 'privacy'];
  var POLICIES = {
    user: {
      key: 'user',
      title: '用户政策',
      desc: '说明账号使用、服务内容与用户权利义务',
      sections: [
        ['一、协议适用与主体', '本政策由' + BRAND + '（以下简称“我们”）与使用 PBS 留学申请管理平台及' + BRAND + '相关服务的个人或机构（以下简称“用户”）共同订立，适用于用户注册、登录、使用以及终止使用相关服务的全过程。'],
        ['二、账号注册与使用', '用户应提供真实、准确、有效的注册信息，并妥善保管账号与密码。账号项下的操作视为用户本人行为；发现账号被非授权使用时应及时通知' + BRAND + '并采取必要的处置措施。'],
        ['三、服务内容与使用规范', '平台提供留学申请项目管理、文书交付、网申填报、选校服务与结果监控等功能。用户应在授权范围内使用服务，不得利用平台从事违反法律法规、侵害第三方权益或干扰平台正常运营的行为。'],
        ['四、机构与成员管理', '机构管理员负责维护本机构成员、角色与业务数据。成员账号的开通、停用与权限调整由机构管理员在管理后台完成，用户可通过所属机构提交申请。'],
        ['五、用户权利与义务', '用户有权查询与更正本人的账号信息、在合法范围内导出业务数据，并可对平台服务提出意见或投诉；同时应按约定完成付款、配合信息补充，并对账号项下提交材料的真实性负责。'],
        ['六、知识产权与内容', '平台界面、软件、模板、案例库等内容的知识产权归' + BRAND + '或相应权利人所有。用户上传的材料仅用于提供约定服务，' + BRAND + '不会将其用于与本服务无关的用途。'],
        ['七、服务变更与终止', BRAND + '可能基于运营需要调整、暂停或终止部分服务，并在合理范围内提前通知。用户可随时停止使用服务并申请关闭账号，账号关闭不影响关闭前已产生的权利义务。'],
        ['八、政策更新与联系', '本政策内容发生变化时，将通过平台提供适当的查看入口并更新生效时间。对政策内容有疑问时，可联系所属机构管理员，由管理员协助核实并反馈。']
      ]
    },
    privacy: {
      key: 'privacy',
      title: '隐私协议',
      desc: '说明个人信息收集、使用、存储与共享方式',
      sections: [
        ['一、适用范围', '本协议用于说明 ' + BRAND + '旗下 PBS 留学申请管理平台在账号登录、学生档案、项目协作和申请服务等场景中的信息处理方式。请在使用相关功能前阅读本协议。'],
        ['二、我们处理的信息', '账号使用过程中可能涉及姓名、手机号、所属机构及角色信息；申请服务中可能涉及学生联系方式、教育经历、申请院校、文书及申请材料。具体信息应以实际服务需要和用户提交内容为准。'],
        ['三、信息的使用', '相关信息用于身份核验、机构成员管理、项目任务分配、申请进度协作及必要的系统通知。我们遵循与服务目的相匹配的原则，避免收集与当前服务无关的信息。'],
        ['四、信息共享与访问', '机构内成员根据其角色和项目权限访问相关信息。涉及向院校或服务合作方提交申请材料时，应明确接收方、使用目的和信息范围，并按实际业务要求取得相应授权。'],
        ['五、存储与保护', '平台应采取合理的访问控制、传输保护和权限管理措施，并根据服务目的和适用要求确定保存期限。原型页面中展示的账号、学生资料及文件均用于功能演示。'],
        ['六、您的选择与权利', '您可以向所属机构管理员提出查阅、更正、删除个人信息或调整账号权限的请求。对不再需要处理的信息，可根据实际服务状态申请停止使用或删除。'],
        ['七、协议更新与联系', '协议内容发生变化时，应通过平台提供适当的查看入口。对信息处理有疑问时，可联系所属机构管理员，由管理员协助核实并反馈。']
      ]
    }
  };

  var defaults = {
    user: { name: '壹言申途用户政策.pdf', size: 186320, updatedAt: '2026-10-19T00:00:00.000Z' },
    privacy: { name: '壹言申途隐私协议.pdf', size: 143354, updatedAt: '2026-10-19T00:00:00.000Z' }
  };
  var isEmpty = new URLSearchParams(location.search).get('privacy') === 'empty';
  var currentFiles = {};
  POLICY_KEYS.forEach(function (key) {
    currentFiles[key] = isEmpty ? null : { name: defaults[key].name, size: defaults[key].size, updatedAt: defaults[key].updatedAt };
  });

  var icons = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" d="m6 6 12 12M18 6 6 18"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 14h8M8 17h5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16V3m-5 5 5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
    replace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7H5m4-4L5 7l4 4M4 17h15m-4-4 4 4-4 4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function policyOf(key) { return POLICIES[key] || POLICIES.privacy; }
  function normalizeKey(key) { return POLICIES[key] ? key : 'privacy'; }
  function get(key) { return Promise.resolve(currentFiles[normalizeKey(key)]); }
  function notify() { window.dispatchEvent(new CustomEvent('pbs-privacy-updated')); }
  function toast(message) { var el = document.createElement('div'); el.className = 'pbs-privacy-toast'; el.setAttribute('role', 'status'); el.textContent = message; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }
  function modal(title, body, footer, cls) {
    var trigger = document.activeElement, dialog = document.createElement('dialog');
    dialog.className = 'pbs-dialog ' + (cls || '');
    dialog.setAttribute('aria-label', title);
    dialog.innerHTML = '<header><h2>' + esc(title) + '</h2><button type="button" class="pbs-dialog-close" data-close aria-label="关闭">' + icons.close + '</button></header><div class="pbs-dialog-body">' + body + '</div>' + (footer ? '<footer>' + footer + '</footer>' : '');
    dialog.addEventListener('click', function (e) { if (e.target === dialog || e.target.closest('[data-close]')) dialog.close(); });
    dialog.addEventListener('close', function () { dialog.remove(); if (trigger && trigger.isConnected) trigger.focus(); });
    document.body.appendChild(dialog); dialog.showModal(); return dialog;
  }
  function formatSize(size) {
    return size < 1048576 ? Math.max(1, Math.round(size / 1024)) + ' KB' : (size / 1048576).toFixed(1) + ' MB';
  }
  function formatTime(value) {
    return new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).slice(0, 16);
  }

  /* 阅读器：按协议类型展示正文，可携带“同意并继续”回调 */
  function view(key, onAgree) {
    if (typeof key === 'function') { onAgree = key; key = 'privacy'; }
    var policyKey = normalizeKey(key), policy = policyOf(policyKey), file = currentFiles[policyKey];
    if (!file) {
      modal(policy.title, '<div class="pbs-privacy-empty">' + icons.file + '<span>《' + policy.title + '》暂未上传</span></div>', '<button class="pbs-dialog-btn" data-close>关闭</button>');
      return;
    }
    var body = '<div class="pbs-policy-reading" tabindex="0" aria-label="' + esc(policy.title) + '正文"><article class="pbs-policy-paper"><h3>' + esc(policy.title) + '</h3><p class="pbs-policy-meta">' + esc(BRAND) + ' · PBS 留学申请管理平台</p><p class="pbs-policy-notice">本内容仅供原型界面与交互演示。</p>' + policy.sections.map(function (section) { return '<section><h4>' + esc(section[0]) + '</h4><p>' + esc(section[1]) + '</p></section>'; }).join('') + '</article></div>';
    var dialog = modal(policy.title, body, '<button class="pbs-dialog-btn" data-close>关闭</button>' + (onAgree ? '<button class="pbs-dialog-btn primary" data-agree>同意并继续</button>' : ''), 'pbs-privacy-viewer');
    if (onAgree) dialog.querySelector('[data-agree]').onclick = function () { onAgree(policyKey); dialog.close(); };
  }

  function canManage() { return !window.pbsHasPermission || window.pbsHasPermission('sys_org'); }

  /* 管理弹窗：按区块分别上传《用户政策》与《隐私协议》 */
  function manage() {
    if (!canManage()) return;
    var body = POLICY_KEYS.map(function (key) {
      var policy = policyOf(key);
      return '<section class="pbs-policy-block" data-policy="' + key + '">' +
        '<div class="pbs-policy-block-head">' +
          '<div class="pbs-policy-block-titles"><h3>《' + esc(policy.title) + '》</h3><p>' + esc(policy.desc) + '</p></div>' +
          '<span class="pbs-policy-state" data-state></span>' +
        '</div>' +
        '<div class="pbs-policy-block-body" data-content></div>' +
        '<input type="file" accept=".pdf,application/pdf" data-input hidden>' +
        '<p class="pbs-privacy-status" data-status role="status"></p>' +
        '<p class="pbs-privacy-error" data-error role="alert"></p>' +
      '</section>';
    }).join('');
    var dialog = modal('协议配置', body, '<button class="pbs-dialog-btn" data-close>关闭</button>', 'pbs-privacy-manager');
    POLICY_KEYS.forEach(function (key) { setupBlock(dialog, key); });
  }

  function setupBlock(dialog, key) {
    var policy = policyOf(key);
    var block = dialog.querySelector('[data-policy="' + key + '"]');
    if (!block) return;
    var content = block.querySelector('[data-content]');
    var input = block.querySelector('[data-input]');
    var error = block.querySelector('[data-error]');
    var status = block.querySelector('[data-status]');
    var state = block.querySelector('[data-state]');
    var busy = false;

    function render() {
      var file = currentFiles[key];
      state.textContent = file ? '已上传' : '未上传';
      state.className = 'pbs-policy-state ' + (file ? 'is-uploaded' : 'is-empty');
      if (!file) {
        content.innerHTML = '<div class="pbs-upload-zone" role="button" tabindex="0" aria-label="上传《' + esc(policy.title) + '》PDF">' + icons.upload + '<strong>点击上传《' + esc(policy.title) + '》</strong><span>仅支持 PDF 格式</span></div>';
        var zone = content.firstElementChild;
        zone.onclick = function () { if (!busy) input.click(); };
        zone.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zone.click(); } };
        zone.ondragover = function (e) { e.preventDefault(); zone.classList.add('is-dragging'); };
        zone.ondragleave = function () { zone.classList.remove('is-dragging'); };
        zone.ondrop = function (e) { e.preventDefault(); zone.classList.remove('is-dragging'); if (e.dataTransfer.files.length !== 1) { error.textContent = '请一次上传一个 PDF 文件'; return; } upload(e.dataTransfer.files[0]); };
        return;
      }
      content.innerHTML = '<div class="pbs-privacy-file"><div class="pbs-pdf-icon">PDF</div><div class="pbs-privacy-file-info"><button type="button" class="pbs-privacy-file-name" data-view>' + esc(file.name) + '</button><p>' + formatSize(file.size) + ' · ' + formatTime(file.updatedAt) + '</p></div><div class="pbs-privacy-file-actions"><button type="button" class="pbs-privacy-action" data-open>' + icons.eye + '<span>查看</span></button><button type="button" class="pbs-privacy-action" data-replace>' + icons.replace + '<span>替换</span></button></div></div>';
      content.querySelector('[data-view]').onclick = function () { view(key); };
      content.querySelector('[data-open]').onclick = function () { view(key); };
      content.querySelector('[data-replace]').onclick = function () { input.click(); };
    }

    async function upload(file) {
      if (!file || busy || !canManage()) return;
      error.textContent = ''; input.value = '';
      if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) { error.textContent = '仅支持上传 PDF 文件'; return; }
      var replacing = !!currentFiles[key];
      busy = true; input.disabled = true; content.inert = true;
      status.textContent = replacing ? '正在替换…' : '正在上传…';
      dialog.setAttribute('aria-busy', 'true');
      await new Promise(function (resolve) { setTimeout(resolve, 400); });
      currentFiles[key] = { name: file.name, size: file.size, updatedAt: new Date().toISOString() };
      busy = false; input.disabled = false; content.inert = false; status.textContent = ''; dialog.removeAttribute('aria-busy');
      notify();
      if (dialog.isConnected) { render(); toast('《' + policy.title + '》已' + (replacing ? '替换' : '上传')); }
    }

    input.onchange = function () { upload(input.files[0]); };
    render();
  }

  window.pbsPrivacy = {
    get: get,
    view: view,
    manage: manage,
    policies: function () { return POLICY_KEYS.map(function (key) { return { key: key, title: policyOf(key).title, file: currentFiles[key] }; }); }
  };
})();
