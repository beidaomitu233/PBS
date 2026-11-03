# -*- coding: utf-8 -*-
"""选校任务列表页：筛选区改为共享 PBSFilter 组件（CRLF 文件）。"""
import io

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\选校任务列表页 - 留学申请管理系统.html'

def crlf(s):
    return s.replace('\r\n', '\n').replace('\n', '\r\n')

h = io.open(HTML, encoding='utf-8', newline='').read()

# 1) head 引入
old = '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.3">'
new = (old + '\r\n'
       '<link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n'
       '<script src="./assets/js/pbs-filter.js?v=6.4"></script>')
assert h.count(old) == 1, 'head anchor'
h = h.replace(old, new)

# 2) 删四个 select 块（咨询状态 / 销售人员 / 申请层次 / 意向国家）
old = crlf('''          <div>
            <label class="block text-sm text-gray-600 mb-2">咨询状态</label>
            <select id="flt-status" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>咨询中</option>
              <option>已结单</option>
            </select>
          </div>
          <div id="filterSalesWrap" class="hidden">
            <label class="block text-sm text-gray-600 mb-2">销售人员</label>
            <select id="flt-sales" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option><option>陈晨</option><option>李欣</option><option>周扬</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">申请层次</label>
            <select id="flt-level" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>本科申请</option>
              <option>硕士申请</option>
              <option>博士申请</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">意向国家</label>
            <select id="flt-country" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>美国</option>
              <option>英国</option>
              <option>加拿大</option>
            </select>
          </div>
''')
assert h.count(old) == 1, 'select blocks'
h = h.replace(old, '')

# 3) 按钮行 → pbsFilterRoot
old = crlf('''        </div>
        <div class="flex items-center gap-3 mt-4">
          <button onclick="applyFilter()" class="px-6 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">搜索</button>
          <button onclick="resetFilter()" class="px-6 h-10 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">重置</button>
        </div>
      </div>''')
new = crlf('''        </div>
        <div id="pbsFilterRoot" class="mt-4"></div>
      </div>''')
assert h.count(old) == 1, 'button row'
h = h.replace(old, new)

# 4) applyFilter / resetFilter 重写
old = crlf('''    function applyFilter() {
      var rows = document.querySelectorAll('#selTaskTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var role = selectionListSession ? selectionListSession.role : '超级管理员';
        if (role === '销售人员' && d.sales !== selectionListSession.name) ok = false;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        var v_level = gv('flt-level'); if (ok && v_level && d.level !== v_level) ok = false;
        var v_country = gv('flt-country'); if (ok && v_country && d.country !== v_country) ok = false;
        var v_status = gv('flt-status'); if (ok && v_status && d.status !== v_status) ok = false;
        var v_sales = gv('flt-sales'); if (ok && v_sales && d.sales !== v_sales) ok = false;
        var v_time = gv('flt-time'), v_time_end = gv('flt-time-end'), timeDate = (d.time || '').slice(0, 10);
        if (ok && v_time && (!timeDate || timeDate < v_time)) ok = false;
        if (ok && v_time_end && (!timeDate || timeDate > v_time_end)) ok = false;
        tr.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      var empty = document.getElementById('flt-empty');
      if (empty) empty.classList.toggle('hidden', visible > 0);
    }
    function resetFilter() {
      ['flt-kw','flt-sales','flt-level','flt-country','flt-status','flt-time','flt-time-end'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      applyFilter();
    }''')
new = crlf('''    function applyFilter() {
      var st = (window.PBSFilter && PBSFilter.getState()) || {};
      var levels = st.level || [], statuses = st.status || [];
      var sales = st.sales || [], countries = st.country || [], majors = st.major || [];
      var projects = st.project || [], students = st.student || [];
      var rows = document.querySelectorAll('#selTaskTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var role = selectionListSession ? selectionListSession.role : '超级管理员';
        if (role === '销售人员' && d.sales !== selectionListSession.name) ok = false;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        if (ok && levels.length && levels.indexOf(d.level) < 0) ok = false;
        if (ok && statuses.length && statuses.indexOf(d.status) < 0) ok = false;
        if (ok && sales.length && sales.indexOf(d.sales) < 0) ok = false;
        if (ok && countries.length && countries.indexOf(d.country) < 0) ok = false;
        if (ok && majors.length && majors.indexOf(d.major) < 0) ok = false;
        if (ok && projects.length && projects.indexOf(d.project) < 0) ok = false;
        if (ok && students.length && students.indexOf(d.student) < 0) ok = false;
        var v_time = gv('flt-time'), v_time_end = gv('flt-time-end'), timeDate = (d.time || '').slice(0, 10);
        if (ok && v_time && (!timeDate || timeDate < v_time)) ok = false;
        if (ok && v_time_end && (!timeDate || timeDate > v_time_end)) ok = false;
        tr.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      var empty = document.getElementById('flt-empty');
      if (empty) empty.classList.toggle('hidden', visible > 0);
    }
    function resetFilter() {
      ['flt-kw','flt-time','flt-time-end'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter();
    }
    function uniqSelRows(attr) {
      var seen = {}, out = [];
      document.querySelectorAll('#selTaskTbody tr[data-kw]').forEach(function (tr) {
        var v = tr.getAttribute(attr);
        if (v && v !== '\\u2014' && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    }
    function initPbsFilter(role) {
      if (!window.PBSFilter) return;
      var groups = [
        { key: 'project', title: '项目号', type: 'dropdown', placeholder: '全部项目号', options: uniqSelRows('data-project') },
        { key: 'student', title: '学生姓名', type: 'dropdown', placeholder: '全部学生', options: uniqSelRows('data-student') },
        { key: 'country', title: '意向国家', type: 'dropdown', placeholder: '全部国家', options: uniqSelRows('data-country') },
        { key: 'major', title: '意向专业', type: 'dropdown', placeholder: '全部专业', options: uniqSelRows('data-major') }
      ];
      if (role === '机构管理员') {
        groups.splice(1, 0, { key: 'sales', title: '销售人员', type: 'dropdown', placeholder: '全部销售', options: uniqSelRows('data-sales') });
      }
      groups.push({ key: 'level', title: '申请层次', type: 'checks', options: ['本科申请', '硕士申请', '博士申请'] });
      groups.push({ key: 'status', title: '咨询状态', type: 'checks', options: ['咨询中', '已结单'] });
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'selection_task_list',
        groups: groups,
        onChange: function () { applyFilter(); }
      });
    }''')
assert h.count(old) == 1, 'applyFilter block'
h = h.replace(old, new)

# 5) 角色分支：filterSalesWrap 已删除，改为挂载 PBSFilter
old = crlf('''      if (isInstitutionManager) {
        document.getElementById('selectionListSubtitle').textContent = '查看全部销售人员的选校任务和选校方案';
        document.getElementById('filterSalesWrap').classList.remove('hidden');
        document.getElementById('createSelectionTaskButton').classList.add('hidden');
        document.querySelectorAll('.sales-workbench-action').forEach(function (button) { button.classList.add('hidden'); });
      } else if (isSales) {
        document.getElementById('selectionListSubtitle').textContent = '仅展示由我负责的选校任务';
      }''')
new = crlf('''      if (isInstitutionManager) {
        document.getElementById('selectionListSubtitle').textContent = '查看全部销售人员的选校任务和选校方案';
        document.getElementById('createSelectionTaskButton').classList.add('hidden');
        document.querySelectorAll('.sales-workbench-action').forEach(function (button) { button.classList.add('hidden'); });
      } else if (isSales) {
        document.getElementById('selectionListSubtitle').textContent = '仅展示由我负责的选校任务';
      }
      initPbsFilter(role);''')
assert h.count(old) == 1, 'role branch'
h = h.replace(old, new)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h)
print('HTML OK')
