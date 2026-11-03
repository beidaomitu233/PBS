# -*- coding: utf-8 -*-
"""结项归档列表页：筛选区改为共享 PBSFilter 组件（CRLF 文件）。"""
import io

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\结项归档列表 - PBS留学CRM系统.html'

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

# 2) 筛选区：删两个 select 块
old = crlf('''          <div>
            <label class="block text-sm text-gray-600 mb-2">申请层次</label>
            <select id="flt-level" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>本科申请</option>
              <option>硕士申请</option>
              <option>博士申请</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">结项状态</label>
            <select id="flt-status" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>待结项</option>
              <option>已结项</option>
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

# 4) applyFilter / resetFilter 重写 + 挂载 PBSFilter
old = crlf('''    function applyFilter() {
      var rows = document.querySelectorAll('#archiveTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        var v_level = gv('flt-level'); if (ok && v_level && d.level !== v_level) ok = false;
        var v_status = gv('flt-status'); if (ok && v_status && d.status !== v_status) ok = false;
        var v_endtime = gv('flt-endtime'), v_endtime_end = gv('flt-endtime-end'), endDate = (d.endtime || '').slice(0, 10);
        if (ok && v_endtime && (!endDate || endDate < v_endtime)) ok = false;
        if (ok && v_endtime_end && (!endDate || endDate > v_endtime_end)) ok = false;
        tr.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      var empty = document.getElementById('flt-empty');
      if (empty) empty.classList.toggle('hidden', visible > 0);
      document.getElementById('totalRecords').textContent = visible;
    }

    function resetFilter() {
      ['flt-kw','flt-level','flt-status','flt-endtime','flt-endtime-end'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      applyFilter();
    }''')
new = crlf('''    function applyFilter() {
      var st = (window.PBSFilter && PBSFilter.getState()) || {};
      var levels = st.level || [], statuses = st.status || [];
      var projects = st.project || [], customers = st.customer || [], students = st.student || [];
      var rows = document.querySelectorAll('#archiveTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        if (ok && levels.length && levels.indexOf(d.level) < 0) ok = false;
        if (ok && statuses.length && statuses.indexOf(d.status) < 0) ok = false;
        if (ok && projects.length && projects.indexOf(d.project) < 0) ok = false;
        if (ok && customers.length && customers.indexOf(d.name) < 0) ok = false;
        if (ok && students.length && students.indexOf(d.student) < 0) ok = false;
        var v_endtime = gv('flt-endtime'), v_endtime_end = gv('flt-endtime-end'), endDate = (d.endtime || '').slice(0, 10);
        if (ok && v_endtime && (!endDate || endDate < v_endtime)) ok = false;
        if (ok && v_endtime_end && (!endDate || endDate > v_endtime_end)) ok = false;
        tr.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      var empty = document.getElementById('flt-empty');
      if (empty) empty.classList.toggle('hidden', visible > 0);
      document.getElementById('totalRecords').textContent = visible;
    }

    function resetFilter() {
      ['flt-kw','flt-endtime','flt-endtime-end'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter();
    }

    function uniqFromRows(attr) {
      var seen = {}, out = [];
      document.querySelectorAll('#archiveTbody tr[data-kw]').forEach(function (tr) {
        var v = tr.getAttribute(attr);
        if (v && v !== '\\u2014' && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    }

    function initPbsFilter() {
      if (!window.PBSFilter) return;
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'archive_list',
        groups: [
          { key: 'project', title: '项目号', type: 'dropdown', placeholder: '全部项目号', options: uniqFromRows('data-project') },
          { key: 'customer', title: '客户姓名', type: 'dropdown', placeholder: '全部客户', options: uniqFromRows('data-name') },
          { key: 'student', title: '学生姓名', type: 'dropdown', placeholder: '全部学生', options: uniqFromRows('data-student') },
          { key: 'level', title: '申请层次', type: 'checks', options: ['本科申请', '硕士申请', '博士申请'] },
          { key: 'status', title: '结项状态', type: 'radios', options: ['待结项', '已结项'] }
        ],
        onChange: function () { applyFilter(); }
      });
    }''')
assert h.count(old) == 1, 'applyFilter block'
h = h.replace(old, new)

# 5) DOMContentLoaded 里挂载
old = crlf('''      applyFilter();
    });''')
new = crlf('''      initPbsFilter();
      applyFilter();
    });''')
assert h.count(old) == 1, 'domcontentloaded'
h = h.replace(old, new)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h)
print('HTML OK')
