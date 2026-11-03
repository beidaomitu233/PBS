# -*- coding: utf-8 -*-
"""操作日志审计页：筛选区改为共享 PBSFilter 组件（LF 文件）。"""
import io

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\操作日志审计 - 留学申请管理系统.html'

raw = io.open(HTML, encoding='utf-8', newline='').read()
h = raw.replace('\r\n', '\n').replace('\r', '\n')

# 1) head 引入
old = '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.3">'
new = (old + '\n'
       + '<link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\n'
       + '<script src="./assets/js/pbs-filter.js?v=6.4"></script>')
assert h.count(old) == 1, 'head anchor'
h = h.replace(old, new)

# 2) 删 4 个 select 块 + 操作时间段
old = '''<div>
            <label class="block text-sm text-gray-600 mb-2">操作类型</label>
            <select id="flt-type" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>登录</option>
              <option>新增</option>
              <option>修改</option>
              <option>分配</option>
              <option>更换</option>
              <option>提交</option>
              <option>审核</option>
              <option>上传</option>
              <option>导入</option>
              <option>删除</option>
              <option>查询</option>
              <option>导出</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">操作结果</label>
            <select id="flt-result" class="w-28 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>成功</option>
              <option>失败</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">业务模块</label>
            <select id="flt-module" class="w-36 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部模块</option><option>账号与权限</option><option>学生档案</option><option>项目管理</option><option>套餐与支付</option><option>选校管理</option><option>文书交付</option><option>文书审核</option><option>网申管理</option><option>监控管理</option><option>结项归档</option><option>AI 管理</option><option>系统管理</option>
            </select>
          </div>
<div>
            <label class="block text-sm text-gray-600 mb-2">所属机构</label>
            <select id="flt-org" class="w-32 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部</option>
              <option>北京总部</option>
              <option>上海分部</option>
              <option>广州分部</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-2">操作时间段</label>
            <div class="flex items-center gap-2"><input id="flt-time" type="date" title="开始日期" class="w-36 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-gray-400">至</span><input id="flt-time-end" type="date" title="结束日期" class="w-36 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></div>
          </div>
'''
assert h.count(old) == 1, 'select blocks'
h = h.replace(old, '')

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

# 4) applyAuditScope IIFE 删除（flt-org select 已不存在，scopedOrg 过滤保留在 applyFilter）
old = '''    (function applyAuditScope() {
      if (!scopedOrg) return;
      var orgSelect = document.getElementById('flt-org');
      if (orgSelect) {
        Array.prototype.forEach.call(orgSelect.options, function (opt) {
          if (opt.value && opt.textContent !== scopedOrg) opt.remove();
        });
        orgSelect.value = scopedOrg;
      }
    })();
'''
assert h.count(old) == 1, 'applyAuditScope'
h = h.replace(old, '')

# 5) applyFilter / resetFilter 重写 + 挂载
old = '''    function applyFilter() {
      var kw = gv('flt-kw').toLowerCase(), type = gv('flt-type'), module = gv('flt-module'), org = gv('flt-org'),
          time = gv('flt-time'), timeEnd = gv('flt-time-end'), result = gv('flt-result');
      filteredLogs = allLogs.filter(function(log) {
        /* 机构隔离优先于任何筛选条件 */
        if (scopedOrg && log.organization !== scopedOrg) return false;
        if (kw && (log.time + log.user + log.organization + log.module + log.type + log.content + log.ip + log.result).toLowerCase().indexOf(kw) < 0) return false;
        if (type && log.type !== type) return false;
        if (module && log.module !== module) return false;
        if (org && log.organization !== org) return false;
        var logDate = (log.time || '').slice(0, 10);
        if (time && (!logDate || logDate < time)) return false;
        if (timeEnd && (!logDate || logDate > timeEnd)) return false;
        if (result && log.result !== result) return false;
        return true;
      });
      currentPage = 1;
      renderTable();
    }
    function filterLogs() { applyFilter(); }
    function searchLogs() { applyFilter(); }
    function resetFilter() {
      ['flt-kw','flt-type','flt-module','flt-org','flt-time','flt-time-end','flt-result'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      applyFilter();
    }'''
new = '''    var AUDIT_REF_NOW = new Date('2026-08-21T23:59:59+08:00');
    function logDaysAgo(log) {
      var t = new Date((log.time || '').replace(' ', 'T') + '+08:00');
      if (isNaN(t.getTime())) return 0;
      return Math.max(0, Math.floor((AUDIT_REF_NOW.getTime() - t.getTime()) / 86400000));
    }
    function applyFilter() {
      var kw = gv('flt-kw').toLowerCase();
      var st = (window.PBSFilter && PBSFilter.getState()) || {};
      var types = st.type || [], modules = st.module || [], results = st.result || [];
      var users = st.user || [], orgs = st.org || [];
      var timeRange = st.time || { min: 0, max: 40 };
      filteredLogs = allLogs.filter(function(log) {
        /* 机构隔离优先于任何筛选条件 */
        if (scopedOrg && log.organization !== scopedOrg) return false;
        if (kw && (log.time + log.user + log.organization + log.module + log.type + log.content + log.ip + log.result).toLowerCase().indexOf(kw) < 0) return false;
        if (types.length && types.indexOf(log.type) < 0) return false;
        if (modules.length && modules.indexOf(log.module) < 0) return false;
        if (results.length && results.indexOf(log.result) < 0) return false;
        if (users.length && users.indexOf(log.user) < 0) return false;
        if (orgs.length && orgs.indexOf(log.organization) < 0) return false;
        var days = logDaysAgo(log);
        if (days < timeRange.min || days > timeRange.max) return false;
        return true;
      });
      currentPage = 1;
      renderTable();
    }
    function filterLogs() { applyFilter(); }
    function searchLogs() { applyFilter(); }
    function resetFilter() {
      ['flt-kw'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter();
    }
    function uniqLogs(field) {
      var seen = {}, out = [];
      allLogs.forEach(function (log) {
        var v = log[field];
        if (v && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    }
    function initAuditPbsFilter() {
      if (!window.PBSFilter) return;
      var groups = [
        { key: 'user', title: '操作人', type: 'dropdown', placeholder: '全部操作人', options: uniqLogs('user') },
        { key: 'module', title: '业务模块', type: 'checks', options: ['账号与权限', '学生档案', '项目管理', '套餐与支付', '选校管理', '文书交付', '文书审核', '网申管理', '监控管理', '结项归档', 'AI 管理', '系统管理'] },
        { key: 'type', title: '操作类型', type: 'checks', options: ['登录', '新增', '修改', '分配', '更换', '提交', '审核', '上传', '导入', '删除', '查询', '导出'] },
        { key: 'result', title: '操作结果', type: 'checks', options: ['成功', '失败'] },
        { key: 'time', title: '操作时间（距今天数）', type: 'range', min: 0, max: 40, unit: '天' }
      ];
      if (!scopedOrg) {
        groups.splice(1, 0, { key: 'org', title: '所属机构', type: 'dropdown', placeholder: '全部机构', options: uniqLogs('organization') });
      }
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'audit_log',
        groups: groups,
        onChange: function () { applyFilter(); }
      });
    }'''
assert h.count(old) == 1, 'applyFilter block'
h = h.replace(old, new)

# 6) 初始化时挂载
old = '''    document.addEventListener('DOMContentLoaded', function() {
      renderTable();
    });'''
new = '''    document.addEventListener('DOMContentLoaded', function() {
      initAuditPbsFilter();
      applyFilter();
    });'''
assert h.count(old) == 1, 'init'
h = h.replace(old, new)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h.replace('\n', '\r\n'))
print('HTML OK')
