var PBS_ACCOUNTS = [
      { u:'pmo',e:'pmo@pbs.com',phone:'13800000005',p:'pbs123456',name:'林老师',role:'PMO',org:'PBS留学总部' },
      { u:'pm',e:'pm@pbs.com',phone:'13800000006',p:'pbs123456',name:'张老师',role:'项目经理',org:'PBS留学总部' },
      { u: 'test',     e: 'test@pbs.com',     phone: '13800000000', p: 'pbs123456', name: '测试账号', role: '超级管理员',     org: 'PBS留学总部' },
      { u: 'ops',      e: 'ops@pbs.com',      phone: '13800000001', p: 'pbs123456', name: '王运维',   role: '平台运维人员',   org: 'PBS留学总部' },
      { u: 'orgadmin', e: 'orgadmin@pbs.com', phone: '13800000002', p: 'pbs123456', name: '王志强',   role: '机构管理员',     org: 'PBS留学总部' },
      { u: 'saleslead',e: 'saleslead@pbs.com',phone: '13800000003', p: 'pbs123456', name: '赵主管',   role: '销售人员管理员', org: 'PBS留学总部' },
      { u: 'docadmin', e: 'docadmin@pbs.com', phone: '13800000004', p: 'pbs123456', name: '陈管理',   role: '文书机构管理员', org: 'PBS留学总部' }
    ];
    /* 内置演示账号同步进共享账号库（仅存散列）：登录校验、人员管理与账号体系共用一份数据 */
    (function syncDemoAccounts() {
      if (!window.pbsAccounts) return;
      PBS_ACCOUNTS.forEach(function (a) {
        var existing=window.pbsAccounts.find(a.u);
        if (existing) {
          if(!existing.phone || !existing.e) window.pbsAccounts.upsert(Object.assign({},existing,{phone:existing.phone || a.phone,e:existing.e || a.e}));
          return;
        }
        window.pbsAccounts.upsert({
          u: a.u,
          e: a.e,
          phone: a.phone,
          phash: window.pbsAccounts.hashPassword(a.p),
          name: a.name,
          role: a.role,
          roles: [a.role],
          org: a.org,
          status: '正常',
          accountStatus: '启用',
          accountExpiry: '长期有效',
          mustChangePassword: false
        });
      });
    })();
    function getLoginAccounts() { return window.pbsAccounts.all(); }
    var ROLE_WORKBENCH = {
      '超级管理员': '管理员工作台 - 留学申请管理系统.html',
      '平台运维人员': '平台运维工作台 - PBS留学CRM系统.html',
      '机构管理员': '机构管理员工作台 - 留学申请管理系统.html',
      'PMO': 'PMO工作台 - 留学申请管理系统.html',
      '销售人员管理员': '选校任务列表页 - 留学申请管理系统.html#workbench',
      '销售人员': '选校任务列表页 - 留学申请管理系统.html#workbench',
      '项目经理': '项目经理工作台 - 留学申请管理系统.html',
      '文书人员': '任务列表页 - 文书交付系统.html#workbench',
      '网申人员': '网申任务列表页 - 留学申请管理系统.html#workbench',
      '文书审核': '文书审核列表页 - 留学申请管理系统.html#workbench',
      '文书机构管理员': '任务列表页 - 文书交付系统.html#workbench'
    };

    var loginMode = 'password';
    var captchaCode = '';
    var loginLanguage = 'zh';
    var demoSmsCode = '';
    var demoWechatSmsCode = '';
    var WECHAT_BINDING_KEY = 'pbs_wechat_binding_demo_openid';
    function setLoginFeedback(message, success) {
      var el = document.getElementById('loginFeedback');
      el.textContent = message || '';
      el.classList.toggle('success', !!success);
    }
    function findLoginAccount(value) {
      var accounts = getLoginAccounts();
      for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].u === value || accounts[i].phone === value || accounts[i].e === value) return accounts[i];
      }
      return null;
    }
    function validateAccount(acc) {
      if (!acc) return '该信息尚未绑定系统用户，请联系机构管理员先添加用户并绑定手机号';
      if (acc.status === '停用' || acc.accountStatus === '停用') return '该账号已停用，请联系机构管理员';
      if (window.pbsAccounts && window.pbsAccounts.isExpired(acc)) return '该账号已过有效期，请联系机构管理员';
      return '';
    }
    function enterSystem(acc) {
      if (!requirePrivacyConsent()) return;
      var session = { account: acc.u, name: acc.name, role: acc.role, roles: acc.roles || [acc.role], org: acc.org, email: acc.e, phone: acc.phone || '', mustChangePassword: !!acc.mustChangePassword };
      localStorage.setItem('pbs_session_v1', JSON.stringify(session));
      if (acc.mustChangePassword) {
        sessionStorage.setItem('pbs_pending_force_change', '1');
        sessionStorage.setItem('pbs_pending_account', acc.u);
        alert('首次登录成功，请先修改初始密码');
        if (typeof window.pbsForceChangePassword === 'function') window.pbsForceChangePassword();
        return;
      }
      location.href = ROLE_WORKBENCH[acc.role];
    }
    function switchLoginMode(mode) {
      loginMode = mode;
      var isSms = mode === 'sms';
      document.getElementById('passwordLoginTab').classList.toggle('active', !isSms);
      document.getElementById('smsLoginTab').classList.toggle('active', isSms);
      document.getElementById('passwordLoginTab').setAttribute('aria-selected',String(!isSms));
      document.getElementById('smsLoginTab').setAttribute('aria-selected',String(isSms));
      document.getElementById('passwordLoginTab').tabIndex = isSms ? -1 : 0;
      document.getElementById('smsLoginTab').tabIndex = isSms ? 0 : -1;
      document.getElementById('passwordField').classList.toggle('hidden', isSms);
      document.getElementById('captchaField').classList.toggle('hidden', isSms);
      document.getElementById('captcha').required = !isSms;
      document.getElementById('smsField').classList.toggle('hidden', !isSms);
      document.getElementById('loginAccountLabel').textContent = isSms ? '手机号' : '账号';
      document.getElementById('username').placeholder = isSms ? (loginLanguage === 'en' ? 'Phone number' : '请输入手机号码') : (loginLanguage === 'en' ? 'Account' : '账号');
      document.getElementById('username').inputMode = isSms ? 'numeric' : 'text';
      document.getElementById('password').required = !isSms;
      document.getElementById('smsCode').required = isSms;
      setLoginFeedback('');
    }
    function sendSmsCode() {
      if (!requirePrivacyConsent()) return;
      var phone = document.getElementById('username').value.trim();
      if (!/^1\d{10}$/.test(phone)) { setLoginFeedback('请输入11位手机号'); return; }
      var acc = findLoginAccount(phone);
      var error = validateAccount(acc);
      if (error) { setLoginFeedback(error); return; }
      demoSmsCode = '123456';
      setLoginFeedback('验证码已发送至 ' + phone.slice(0, 3) + '****' + phone.slice(-4) + '（演示验证码：123456）', true);
      var button = document.getElementById('sendSmsButton');
      var seconds = 60;
      button.disabled = true;
      button.textContent = seconds + '秒后重发';
      var timer = setInterval(function () {
        seconds--;
        button.textContent = seconds + '秒后重发';
        if (seconds <= 0) { clearInterval(timer); button.disabled = false; button.textContent = '获取验证码'; }
      }, 1000);
    }

    function handleLogin(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (!requirePrivacyConsent()) return;
      var u = document.getElementById('username').value.trim();
      var acc = findLoginAccount(u);
      var error = validateAccount(acc);
      if (error) { setLoginFeedback(error); return; }
      if (loginMode === 'sms') {
        if (!/^1\d{10}$/.test(u)) { setLoginFeedback('验证码登录仅支持已绑定手机号'); return; }
        if (document.getElementById('smsCode').value.trim() !== demoSmsCode || !demoSmsCode) { setLoginFeedback('短信验证码不正确或尚未获取'); return; }
      } else {
        if (!window.pbsAccounts.verifyPassword(acc.u,document.getElementById('password').value)) { setLoginFeedback('账号或密码不正确'); return; }
        if (document.getElementById('captcha').value.trim().toUpperCase() !== captchaCode) { setLoginFeedback('图形验证码不正确，请重新输入'); refreshCaptcha(); document.getElementById('captcha').focus(); return; }
      }
      enterSystem(acc);
    }

    function wechatDialogHtml() {
      return '<div id="wechatLoginLayer" class="wechat-layer"><div class="wechat-dialog">' +
        '<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200"><div><h3 class="font-semibold text-gray-900">微信扫码登录</h3><p class="text-xs text-gray-400 mt-1">微信首次登录需绑定已添加用户的手机号</p></div><button type="button" onclick="closeWechatLogin()" class="text-2xl text-gray-400">×</button></div>' +
        '<div class="px-6 py-4 flex items-center justify-between"><span class="wechat-step active"><b>1</b>扫码</span><span class="text-gray-300">—</span><span id="wechatStepBind" class="wechat-step"><b>2</b>绑定手机号</span><span class="text-gray-300">—</span><span id="wechatStepDone" class="wechat-step"><b>3</b>登录</span></div>' +
        '<div id="wechatScanPanel" class="px-6 pb-6 text-center"><div class="qr-box"><svg viewBox="0 0 120 120" class="w-full h-full text-gray-900" fill="currentColor"><path d="M4 4h42v42H4V4Zm8 8v26h26V12H12Zm8 8h10v10H20V20ZM74 4h42v42H74V4Zm8 8v26h26V12H82Zm8 8h10v10H90V20ZM4 74h42v42H4V74Zm8 8v26h26V82H12Zm8 8h10v10H20V90ZM56 4h8v16h-8V4Zm0 24h8v12h-8V28Zm0 20h16v8H56v-8Zm24 8h12v8H80v-8Zm20 0h16v8h-16v-8ZM52 68h8v12h-8V68Zm16 0h8v8h-8v-8Zm16 4h8v12h-8V72Zm16 0h16v8h-16v-8ZM52 88h12v8H52v-8Zm20-4h8v16h-8V84Zm16 8h8v8h-8v-8Zm12-4h16v8h-16v-8Zm-44 16h20v8H52v-8Zm28 4h12v8H80v-8Zm20-8h16v16h-16v-16Z"/></svg></div><p class="text-sm text-gray-700">使用微信扫描二维码</p><p class="text-xs text-gray-400 mt-1">扫码后系统将检查微信是否已绑定用户</p><button type="button" onclick="simulateWechatScan()" class="mt-5 w-full h-10 bg-[#07C160] text-white rounded-lg font-medium">模拟微信扫码</button></div>' +
        '<div id="wechatBindPanel" class="hidden px-6 pb-6"><div class="bg-green-50 text-green-700 text-xs rounded-lg px-3 py-2 mb-4">该微信尚未绑定，请验证系统内已添加用户的手机号</div><label class="block text-sm text-gray-700 mb-2">已绑定手机号</label><input id="wechatPhone" type="tel" inputmode="numeric" placeholder="请输入系统用户绑定的手机号" class="w-full h-10 px-3 border border-gray-300 rounded-lg"><label class="block text-sm text-gray-700 mt-4 mb-2">短信验证码</label><div class="flex gap-2"><input id="wechatSmsCode" maxlength="6" inputmode="numeric" placeholder="6位验证码" class="min-w-0 flex-1 h-10 px-3 border border-gray-300 rounded-lg"><button type="button" onclick="sendWechatSmsCode()" class="px-3 border border-green-200 text-green-700 rounded-lg text-sm">获取验证码</button></div><p id="wechatFeedback" class="login-feedback"></p><button type="button" onclick="bindWechatAndLogin()" class="mt-2 w-full h-10 bg-[#07C160] text-white rounded-lg font-medium">绑定并登录</button></div>' +
      '</div></div>';
    }
    function openWechatLogin() {
      if (!requirePrivacyConsent()) return;
      if (!document.getElementById('wechatLoginLayer')) document.body.insertAdjacentHTML('beforeend', wechatDialogHtml());
      var layer=document.getElementById('wechatLoginLayer'); layer.style.display = 'flex';
      layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','微信扫码登录');layer.returnFocus=document.activeElement;
      layer.querySelector('button').setAttribute('aria-label','关闭微信登录');layer.querySelector('button').focus();
      layer.onclick=function(e){if(e.target===layer) closeWechatLogin();};
      layer.onkeydown=function(e){
        if(e.key==='Escape'){closeWechatLogin();return;}
        if(e.key==='Tab'){var controls=Array.from(layer.querySelectorAll('button,input')).filter(function(el){return el.offsetParent!==null && !el.disabled;});var first=controls[0],last=controls[controls.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}
      };
      document.body.style.overflow = 'hidden';
    }
    function closeWechatLogin() { var layer = document.getElementById('wechatLoginLayer'); if (layer) { var trigger=layer.returnFocus;layer.remove();if(trigger && trigger.isConnected) trigger.focus(); } document.body.style.overflow = ''; }
    function simulateWechatScan() {
      var boundAccount = localStorage.getItem(WECHAT_BINDING_KEY);
      var bound = boundAccount ? findLoginAccount(boundAccount) : null;
      if (bound && !validateAccount(bound)) { document.getElementById('wechatStepDone').classList.add('active'); enterSystem(bound); return; }
      document.getElementById('wechatScanPanel').classList.add('hidden');
      document.getElementById('wechatBindPanel').classList.remove('hidden');
      document.getElementById('wechatStepBind').classList.add('active');
    }
    function setWechatFeedback(message, success) { var el = document.getElementById('wechatFeedback'); el.textContent = message; el.classList.toggle('success', !!success); }
    function sendWechatSmsCode() {
      var phone = document.getElementById('wechatPhone').value.trim();
      var acc = findLoginAccount(phone);
      var error = !/^1\d{10}$/.test(phone) ? '请输入11位手机号' : validateAccount(acc);
      if (error) { setWechatFeedback(error); return; }
      demoWechatSmsCode = '123456';
      setWechatFeedback('验证码已发送（演示验证码：123456）', true);
    }
    function bindWechatAndLogin() {
      var phone = document.getElementById('wechatPhone').value.trim();
      var acc = findLoginAccount(phone);
      var error = validateAccount(acc);
      if (error) { setWechatFeedback(error); return; }
      if (document.getElementById('wechatSmsCode').value.trim() !== demoWechatSmsCode || !demoWechatSmsCode) { setWechatFeedback('短信验证码不正确或尚未获取'); return; }
      localStorage.setItem(WECHAT_BINDING_KEY, acc.u);
      document.getElementById('wechatStepDone').classList.add('active');
      setWechatFeedback('手机号绑定成功，正在登录', true);
      setTimeout(function () { enterSystem(acc); }, 350);
    }


    /* 首次登录须设置个人密码后进入工作台。 */
    function forceChangePassword() {
      var u = sessionStorage.getItem('pbs_pending_account') || document.getElementById('username').value.trim();
      var layer = document.createElement('div');
      layer.id = 'pbsForcePwdLayer';
      layer.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.5);';
      layer.innerHTML = '<div style="background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.25);width:min(420px,92vw);overflow:hidden;">' +
        '<div style="padding:20px 24px;border-bottom:1px solid #EDEFF2;"><h3 style="margin:0;font-size:17px;font-weight:700;color:#1F2937;">首次登录，请修改初始密码</h3>' +
        '<p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;">密码需 8 位以上，同时包含字母与数字。</p></div>' +
        '<div style="padding:20px 24px;display:grid;gap:12px;">' +
        '<label style="display:grid;gap:6px;font-size:13px;color:#4B5563;">新密码<input id="fp1" type="password" autocomplete="new-password" style="height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;"></label>' +
        '<label style="display:grid;gap:6px;font-size:13px;color:#4B5563;">确认新密码<input id="fp2" type="password" autocomplete="new-password" style="height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;"></label>' +
        '<p id="fpErr" style="margin:0;font-size:12px;color:#DC2626;min-height:16px;"></p></div>' +
        '<div style="padding:14px 24px;border-top:1px solid #EDEFF2;display:flex;justify-content:flex-end;">' +
        '<button id="fpGo" style="height:36px;padding:0 18px;border:0;border-radius:8px;background:#2563EB;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">确认修改并登录</button></div></div>';
      document.body.appendChild(layer);
      layer.querySelector('#fpGo').addEventListener('click', function () {
        var p1 = layer.querySelector('#fp1').value, p2 = layer.querySelector('#fp2').value;
        var err = layer.querySelector('#fpErr');
        err.textContent = '';
        if (p1.length < 8 || !/[A-Za-z]/.test(p1) || !/\d/.test(p1)) { err.textContent = '密码需为 8 位以上，并同时包含字母与数字'; return; }
        if (p1 !== p2) { err.textContent = '两次输入的新密码不一致'; return; }
        var rec = window.pbsAccounts.find(u);
        if (rec) window.pbsAccounts.upsert(Object.assign({},rec,{phash:window.pbsAccounts.hashPassword(p1),mustChangePassword:false}));
        sessionStorage.removeItem('pbs_pending_force_change');
        sessionStorage.removeItem('pbs_pending_account');
        layer.remove();
        var acc = null;
        getLoginAccounts().forEach(function (item) { if (item.u === u) acc = item; });
        if (acc) {
          var session = { account: acc.u, name: acc.name, role: acc.role, roles: acc.roles || [acc.role], org: acc.org, email: acc.e, phone: acc.phone || '', mustChangePassword: false };
          localStorage.setItem('pbs_session_v1', JSON.stringify(session));
        }
        location.href = ROLE_WORKBENCH[acc ? acc.role : '超级管理员'];
      });
    }
    window.pbsForceChangePassword = forceChangePassword;
    if (sessionStorage.getItem('pbs_pending_force_change') === '1') {
      sessionStorage.removeItem('pbs_pending_force_change');
      window.addEventListener('DOMContentLoaded', forceChangePassword);
    }

    function togglePassword() {
      var passwordInput = document.getElementById('password');
      var eyeIcon = document.getElementById('eyeIcon');
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        document.getElementById('passwordToggle').setAttribute('aria-label','隐藏密码');
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>';
      } else {
        passwordInput.type = 'password';
        document.getElementById('passwordToggle').setAttribute('aria-label','显示密码');
        eyeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
      }
    }

    function requirePrivacyConsent() {
      var checkbox=document.getElementById('privacyConsent');
      if(checkbox.checked) return true;
      document.getElementById('privacyConsentRow').classList.add('has-error');
      setLoginFeedback(loginLanguage==='en' ? 'Please read and agree to the User Policy and Privacy Policy.' : '请先阅读并同意《用户政策》和《隐私协议》');
      checkbox.focus(); return false;
    }
    function privacyConsentChanged() {
      var checkbox=document.getElementById('privacyConsent');
      if(checkbox && !checkbox.checked) resetPolicyRead();
      document.getElementById('privacyConsentRow').classList.remove('has-error');
      setLoginFeedback('');
    }
    function markPolicyRead(linkId) {
      var link=document.getElementById(linkId);
      if(link) link.classList.add('is-read');
    }
    function resetPolicyRead() {
      ['userPolicyLink','privacyLink'].forEach(function(id){var link=document.getElementById(id);if(link) link.classList.remove('is-read');});
    }
    function agreePolicy(linkId,policyKey) {
      markPolicyRead(linkId);
      document.getElementById('privacyConsent').checked=true;
      privacyConsentChanged();
    }
    function readUserPolicy() {
      pbsPrivacy.view('user',function(){agreePolicy('userPolicyLink','user');});
    }
    function readPrivacy() {
      pbsPrivacy.view('privacy',function(){agreePolicy('privacyLink','privacy');});
    }
    function refreshCaptcha() {
      var chars='23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; captchaCode='';
      for(var i=0;i<4;i++) captchaCode+=chars.charAt(Math.floor(Math.random()*chars.length));
      var canvas=document.getElementById('captchaCanvas'), ctx=canvas.getContext('2d');
      ctx.fillStyle='#f9fafb';ctx.fillRect(0,0,120,42);
      for(var p=0;p<70;p++){ctx.fillStyle='#c4c8cf';ctx.fillRect(Math.random()*120,Math.random()*42,1,1);}
      ctx.strokeStyle='#d5d9e0';ctx.beginPath();ctx.moveTo(0,28);ctx.lineTo(120,12);ctx.stroke();
      ctx.font='bold 26px Georgia';ctx.textBaseline='middle';
      for(var n=0;n<4;n++){ctx.save();ctx.translate(17+n*28,22);ctx.rotate((Math.random()-.5)*.25);ctx.fillStyle='#202735';ctx.fillText(captchaCode[n],-7,0);ctx.restore();}
      document.getElementById('captcha').value='';
    }
    function toggleLoginTheme() {
      var dark=document.body.classList.toggle('is-dark');
      var button=document.getElementById('themeToggle');button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'切换浅色模式':'切换深色模式');
      localStorage.setItem('pbs_login_theme_v1',dark?'dark':'light');
    }
    function toggleLoginLanguage() {
      loginLanguage=loginLanguage==='zh'?'en':'zh';var english=loginLanguage==='en';
      document.documentElement.lang=english?'en':'zh-CN';
      var labels={passwordLoginTab:english?'Password login':'密码登录',smsLoginTab:english?'SMS login':'验证码登录',loginSubmit:english?'Log in':'登录',consentLabel:english?'I have read and agree to the ':'我已阅读并同意',userPolicyLink:english?'《User Policy》':'《用户政策》',policyAndLabel:english?'and':'和',privacyLink:english?'《Privacy Policy》':'《隐私协议》',loginDivider:english?'Other login methods':'其他登录方式',wechatLabel:english?'WeChat login':'微信扫码登录'};
      Object.keys(labels).forEach(function(id){document.getElementById(id).textContent=labels[id];});
      document.getElementById('password').placeholder=english?'Password':'密码';document.getElementById('captcha').placeholder=english?'Code':'验证码';document.getElementById('smsCode').placeholder=english?'SMS code':'请输入验证码';
      if(!document.getElementById('sendSmsButton').disabled) document.getElementById('sendSmsButton').textContent=english?'Get code':'获取验证码';
      switchLoginMode(loginMode);
    }
    document.querySelectorAll('[role="tab"]').forEach(function(tab){tab.addEventListener('keydown',function(e){if(e.key==='ArrowLeft' || e.key==='ArrowRight'){e.preventDefault();var target=document.getElementById(loginMode==='password'?'smsLoginTab':'passwordLoginTab');target.click();target.focus();}});});
    window.addEventListener('pbs-privacy-updated',function(){document.getElementById('privacyConsent').checked=false;resetPolicyRead();privacyConsentChanged();});
    window.addEventListener('pageshow',function(){document.getElementById('privacyConsent').checked=false;resetPolicyRead();privacyConsentChanged();});
    if(localStorage.getItem('pbs_login_theme_v1')==='dark') toggleLoginTheme();
    refreshCaptcha();
