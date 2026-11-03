# -*- coding: utf-8 -*-
"""监控任务列表页：筛选区改为共享 PBSFilter 组件（复选/下拉/滑块 + 可收缩）。"""
import io, re

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\监控任务列表 - PBS留学CRM.html'
JS = BASE + r'\assets\js\pbs-monitor-v2.js'

def rd(p):
    return io.open(p, encoding='utf-8', newline='').read()

def wr(p, s):
    io.open(p, 'w', encoding='utf-8', newline='').write(s)

h = rd(HTML)

# 1) head 引入 pbs-filter.css + pbs-filter.js
old = '<link rel="stylesheet" href="./assets/css/pbs-monitor-v2.css?v=1.4">'
new = (old + '\r\n'
       '<link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n'
       '<script src="./assets/js/pbs-filter.js?v=6.4"></script>')
assert h.count(old) == 1, 'head css anchor'
h = h.replace(old, new)

# 2) 筛选区：保留关键词，删掉两个 select 块和按钮行，挂 pbsFilterRoot
old = '''        <div class="monitor-field">
          <label for="monitorStatusFilter">任务状态</label>
          <select id="monitorStatusFilter">
            <option value="">全部状态</option>
            <option>无待办</option>
            <option>待处理</option>
            <option>紧急处理</option>
            <option>已逾期</option>
          </select>
        </div>
        <div class="monitor-field">
          <label for="monitorFrequencyFilter">监控频率</label>
          <select id="monitorFrequencyFilter"><option value="">全部频率</option><option>每小时</option><option>每天</option></select>
        </div>
        <button class="monitor-btn" onclick="pbsMonitor.renderList()">查询</button>
        <button class="monitor-btn secondary" onclick="pbsMonitor.resetListFilters()">重置</button>'''
new = '''        <div id="pbsFilterRoot" style="flex:1 1 100%"></div>
        <button class="monitor-btn secondary" onclick="pbsMonitor.resetListFilters()">重置</button>'''
assert h.count(old) == 1, 'filter selects block'
h = h.replace(old, new)
wr(HTML, h)
print('HTML OK')

j = rd(JS)

# 3) taskRows 增加邮件监控频率字段 mailFrequency
old = "frequency: '每小时', lastSync: '2026-08-18 10:15', owner: '王芳' }"
new = "frequency: '每小时', mailFrequency: '每小时', lastSync: '2026-08-18 10:15', owner: '王芳' }"
assert j.count(old) == 1; j = j.replace(old, new)
old = "frequency: '每小时', lastSync: '2026-08-18 09:52', owner: '陈凯' }"
new = "frequency: '每小时', mailFrequency: '每天', lastSync: '2026-08-18 09:52', owner: '陈凯' }"
assert j.count(old) == 1; j = j.replace(old, new)
old = "frequency: '每天', lastSync: '2026-08-18 08:30', owner: '王芳' }"
new = "frequency: '每天', mailFrequency: '每天', lastSync: '2026-08-18 08:30', owner: '王芳' }"
assert j.count(old) == 1; j = j.replace(old, new)
old = "frequency: '每天', lastSync: '2026-08-18 08:05', owner: '周宁' }"
new = "frequency: '每天', mailFrequency: '每周', lastSync: '2026-08-18 08:05', owner: '周宁' }"
assert j.count(old) == 1; j = j.replace(old, new)
old = "frequency: '每天', lastSync: '2026-08-17 22:00', owner: '陈凯' }"
new = "frequency: '每天', mailFrequency: '每天', lastSync: '2026-08-17 22:00', owner: '陈凯' }"
assert j.count(old) == 1; j = j.replace(old, new)

# 4) listFilters 改为读 PBSFilter 状态
old = '''  function listFilters() {
    var kw = (document.getElementById('monitorKeyword').value || '').toLowerCase();
    var status = document.getElementById('monitorStatusFilter').value;
    var frequency = document.getElementById('monitorFrequencyFilter').value;
    return taskRows.filter(function (item) {
      var text = [item.customer, item.student].join(' ').toLowerCase();
      return (!kw || text.indexOf(kw) >= 0) && (!status || item.status === status) && (!frequency || item.frequency === frequency);
    });
  }'''
new = '''  function lastSyncHours(item) {
    var t = new Date(item.lastSync.replace(' ', 'T') + ':00+08:00');
    return Math.max(0, Math.round((monitorNow.getTime() - t.getTime()) / 3600000));
  }

  function listFilters() {
    var kw = (document.getElementById('monitorKeyword').value || '').toLowerCase();
    var st = (window.PBSFilter && PBSFilter.getState()) || {};
    var customers = st.customer || [];
    var students = st.student || [];
    var status = st.status || [];
    var siteFreq = st.siteFrequency || [];
    var mailFreq = st.mailFrequency || [];
    var syncRange = st.lastSync || { min: 0, max: 72 };
    return taskRows.filter(function (item) {
      var text = [item.customer, item.student].join(' ').toLowerCase();
      var hours = lastSyncHours(item);
      return (!kw || text.indexOf(kw) >= 0)
        && (!customers.length || customers.indexOf(item.customer) >= 0)
        && (!students.length || students.indexOf(item.student) >= 0)
        && (!status.length || status.indexOf(item.status) >= 0)
        && (!siteFreq.length || siteFreq.indexOf(item.frequency) >= 0)
        && (!mailFreq.length || mailFreq.indexOf(item.mailFrequency) >= 0)
        && (hours >= syncRange.min && hours <= syncRange.max);
    });
  }'''
assert j.count(old) == 1, 'listFilters'
j = j.replace(old, new)

# 5) resetListFilters 加 PBSFilter.reset()
old = '''  function resetListFilters() {
    ['monitorKeyword', 'monitorStatusFilter', 'monitorFrequencyFilter'].forEach(function (id) { document.getElementById(id).value = ''; });
    renderList();
  }'''
new = '''  function resetListFilters() {
    document.getElementById('monitorKeyword').value = '';
    if (window.PBSFilter) PBSFilter.reset();
    renderList();
  }'''
assert j.count(old) == 1, 'resetListFilters'
j = j.replace(old, new)

# 6) initList 挂载 PBSFilter
old = '''  function initList() {
    taskId = 1;
    renderList();
    ['monitorKeyword', 'monitorStatusFilter', 'monitorFrequencyFilter'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener(id === 'monitorKeyword' ? 'input' : 'change', renderList);
    });
  }'''
new = '''  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  function initList() {
    taskId = 1;
    if (window.PBSFilter) {
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'monitor_list',
        groups: [
          { key: 'customer', title: '客户姓名', type: 'dropdown', placeholder: '全部客户', options: uniq(taskRows.map(function (t) { return t.customer; })) },
          { key: 'student', title: '学生姓名', type: 'dropdown', placeholder: '全部学生', options: uniq(taskRows.map(function (t) { return t.student; })) },
          { key: 'status', title: '监控状态', type: 'checks', options: ['无待办', '待处理', '紧急处理', '已逾期'] },
          { key: 'siteFrequency', title: '官网监控频率', type: 'checks', options: ['每小时', '每6小时', '每12小时', '每天', '每周'] },
          { key: 'mailFrequency', title: '邮件监控频率', type: 'checks', options: ['每小时', '每天', '每周'] },
          { key: 'lastSync', title: '上次监控时间（距现在）', type: 'range', min: 0, max: 72, unit: '小时' }
        ],
        onChange: function () { renderList(); }
      });
    }
    renderList();
    var kw = document.getElementById('monitorKeyword');
    if (kw) kw.addEventListener('input', renderList);
  }'''
assert j.count(old) == 1, 'initList'
j = j.replace(old, new)

wr(JS, j)
print('JS OK')
