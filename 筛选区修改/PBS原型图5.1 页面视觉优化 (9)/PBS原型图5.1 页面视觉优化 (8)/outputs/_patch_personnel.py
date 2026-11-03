# -*- coding: utf-8 -*-
"""人员管理页（机构成员管理）：筛选区改为共享 PBSFilter 组件。混合换行，内部统一 LF 后写回 CRLF。"""
import io

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\人员管理 - PBS留学CRM系统.html'

raw = io.open(HTML, encoding='utf-8', newline='').read()
h = raw.replace('\r\n', '\n').replace('\r', '\n')

# 1) head 引入
old = '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.3">'
new = (old + '\n'
       + '<link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\n'
       + '<script src="./assets/js/pbs-filter.js?v=6.4"></script>')
assert h.count(old) == 1, 'head anchor'
h = h.replace(old, new)

# 2) 删角色/状态 select 块（保留关键词与 flt-org hidden）
old = '''          <div>
            <label class="block text-sm text-gray-600 mb-2">角色</label>
            <select id="flt-role" class="w-36 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>机构管理员</option>
              <option>项目经理</option>
              <option>文书人员</option>
              <option>网申人员</option>
              <option>文书审核</option>
              <option>销售人员</option>
            </select>
          </div>
          <input id="flt-org" type="hidden">
          <div>
            <label class="block text-sm text-gray-600 mb-2">人员状态</label>
            <select id="flt-status" class="w-28 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>在职</option>
              <option>离职/停职</option>
            </select>
          </div>
'''
new = '''          <input id="flt-org" type="hidden">
'''
assert h.count(old) == 1, 'select blocks'
h = h.replace(old, new)

# 3) 按钮行 → pbsFilterRoot
old = '''        </div>
        <div class="flex items-center gap-3 mt-4">
          <button onclick="applyFilter()" class="px-6 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">搜索</button>
          <button onclick="resetFilter()" class="px-6 h-10 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">重置</button>
        </div>
      </div>'''
new = '''        </div>
        <div id="pbsFilterRoot" class="mt-4"></div>
      </div>'''
assert h.count(old) == 1, 'button row'
h = h.replace(old, new)

# 4) applyFilter 重写
old = '''    function applyFilter() {
      var kw = gv('flt-kw').toLowerCase(), name = gv('flt-name'), role = gv('flt-role'), status = gv('flt-status'), org = gv('flt-org'),
          account = gv('flt-account');
      filteredData = personnelData.filter(function (p) {
        var ok = true;
        if (personnelScopeOrg) ok = ok && p.org === personnelScopeOrg;
        if (currentPersonnelRole === '文书机构管理员') ok = ok && p.roles.some(function (item) { return item === '文书人员' || item === '文书审核'; });
        if (org) ok = ok && p.org === org;
        if (kw) ok = ok && (p.name + p.org + p.account + p.roles.join('') + p.status).toLowerCase().indexOf(kw) >= 0;
        if (name) ok = ok && p.name.indexOf(name) >= 0;
        if (role) ok = ok && p.roles.indexOf(role) >= 0;
        if (status) ok = ok && p.status === status;
        if (account) ok = ok && p.account.toLowerCase().indexOf(account.toLowerCase()) >= 0;
        return ok;
      });
      currentPage = 1;
      renderTable();
    }'''
new = '''    function applyFilter() {
      var kw = gv('flt-kw').toLowerCase(), org = gv('flt-org'),
          account = gv('flt-account');
      var st = (window.PBSFilter && PBSFilter.getState()) || {};
      var names = st.name || [], orgs = st.org || [];
      var roles = st.role || [], statuses = st.status || [];
      filteredData = personnelData.filter(function (p) {
        var ok = true;
        if (personnelScopeOrg) ok = ok && p.org === personnelScopeOrg;
        if (currentPersonnelRole === '文书机构管理员') ok = ok && p.roles.some(function (item) { return item === '文书人员' || item === '文书审核'; });
        if (org) ok = ok && p.org === org;
        if (kw) ok = ok && (p.name + p.org + p.account + p.roles.join('') + p.status).toLowerCase().indexOf(kw) >= 0;
        if (ok && names.length) ok = names.indexOf(p.name) >= 0;
        if (ok && orgs.length) ok = orgs.indexOf(p.org) >= 0;
        if (ok && roles.length) ok = p.roles.some(function (item) { return roles.indexOf(item) >= 0; });
        if (ok && statuses.length) ok = statuses.indexOf(p.status) >= 0;
        if (account) ok = ok && p.account.toLowerCase().indexOf(account.toLowerCase()) >= 0;
        return ok;
      });
      currentPage = 1;
      renderTable();
    }'''
assert h.count(old) == 1, 'applyFilter'
h = h.replace(old, new)

# 5) resetFilter + initPbsFilter
old = '''    function resetFilter() {
      ['flt-kw','flt-name','flt-role','flt-status','flt-org','flt-account'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      applyFilter();
    }'''
new = '''    function resetFilter() {
      ['flt-kw','flt-org','flt-account'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter();
    }
    function uniqPersonnel(field) {
      var seen = {}, out = [];
      personnelData.forEach(function (p) {
        var v = p[field];
        if (v && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    }
    function initPersonnelPbsFilter() {
      if (!window.PBSFilter) return;
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'personnel_list',
        groups: [
          { key: 'name', title: '姓名', type: 'dropdown', placeholder: '全部姓名', options: uniqPersonnel('name') },
          { key: 'org', title: '所属机构', type: 'dropdown', placeholder: '全部机构', options: uniqPersonnel('org') },
          { key: 'role', title: '角色', type: 'checks', options: ['机构管理员', '项目经理', '文书人员', '网申人员', '文书审核', '销售人员'] },
          { key: 'status', title: '人员状态', type: 'checks', options: ['在职', '离职/停职'] }
        ],
        onChange: function () { applyFilter(); }
      });
    }'''
assert h.count(old) == 1, 'resetFilter'
h = h.replace(old, new)

# 6) DOMContentLoaded 里挂载（在 openOrganization 之前）
old = '''    document.addEventListener('DOMContentLoaded', function () {
      var session = window.pbsGetSession ? window.pbsGetSession() : null;
      currentPersonnelRole = session && session.role ? session.role : '超级管理员';'''
new = '''    document.addEventListener('DOMContentLoaded', function () {
      initPersonnelPbsFilter();
      var session = window.pbsGetSession ? window.pbsGetSession() : null;
      currentPersonnelRole = session && session.role ? session.role : '超级管理员';'''
assert h.count(old) == 1, 'domcontentloaded'
h = h.replace(old, new)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h.replace('\n', '\r\n'))
print('HTML OK')
