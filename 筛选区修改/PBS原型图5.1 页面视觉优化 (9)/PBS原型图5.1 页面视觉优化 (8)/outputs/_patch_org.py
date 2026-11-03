# -*- coding: utf-8 -*-
"""机构管理页：筛选区加共享 PBSFilter 组件。文件为混合换行，内部统一 LF 处理后写回 CRLF。"""
import io

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
HTML = BASE + r'\机构管理 - PBS留学CRM系统.html'

raw = io.open(HTML, encoding='utf-8', newline='').read()
h = raw.replace('\r\n', '\n').replace('\r', '\n')

# 1) head 引入
old = '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.1">'
new = (old + '\n'
       + '<link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\n'
       + '<script src="./assets/js/pbs-filter.js?v=6.4"></script>')
assert h.count(old) == 1, 'head anchor'
h = h.replace(old, new)

# 2) 筛选区容器：加 pbsFilterRoot + flex-wrap
old = '''<div class="p-5 border-b border-gray-100 flex items-end gap-3">'''
new = '''<div class="p-5 border-b border-gray-100 flex items-end gap-3 flex-wrap">'''
assert h.count(old) == 1, 'flex wrap'
h = h.replace(old, new)
old = '''          <button type="button" class="h-10 px-5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" onclick="resetOrganizationSearch()">重置</button>
        </div>'''
new = '''          <button type="button" class="h-10 px-5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50" onclick="resetOrganizationSearch()">重置</button>
          <div id="pbsFilterRoot" class="w-full"></div>
        </div>'''
assert h.count(old) == 1, 'filter container'
h = h.replace(old, new)

# 3) renderOrganizations 前插入辅助函数
old = '''    function renderOrganizations() {'''
new = '''    var ORG_REF_NOW = new Date('2026-08-21T00:00:00+08:00');
    function createdDaysAgo(organization) {
      var t = new Date((organization.createdAt || '').replace(' ', 'T') + '+08:00');
      if (isNaN(t.getTime())) return 0;
      return Math.max(0, Math.round((ORG_REF_NOW.getTime() - t.getTime()) / 86400000));
    }
    function renderOrganizations() {'''
assert h.count(old) == 1, 'renderOrganizations fn'
h = h.replace(old, new)

# 4) rows 过滤逻辑替换
old = '''      var rows = organizations.filter(function (organization) { return !keyword || organization.name.toLowerCase().indexOf(keyword) >= 0; });'''
new = '''      var st = (window.PBSFilter && PBSFilter.getState()) || {};
      var names = st.name || [];
      var members = st.members || { min: 0, max: 10 };
      var created = st.created || { min: 0, max: 600 };
      var rows = organizations.filter(function (organization) {
        var count = memberCounts[organization.name] || 0;
        var days = createdDaysAgo(organization);
        return (!keyword || organization.name.toLowerCase().indexOf(keyword) >= 0)
          && (!names.length || names.indexOf(organization.name) >= 0)
          && (count >= members.min && count <= members.max)
          && (days >= created.min && days <= created.max);
      });'''
assert h.count(old) == 1, 'rows filter'
h = h.replace(old, new)

# 5) reset + 挂载函数
old = '''    function resetOrganizationSearch() {
      document.getElementById('organizationSearch').value = '';
      renderOrganizations();
    }'''
new = '''    function resetOrganizationSearch() {
      document.getElementById('organizationSearch').value = '';
      if (window.PBSFilter) PBSFilter.reset();
      renderOrganizations();
    }
    function initOrgPbsFilter() {
      if (!window.PBSFilter) return;
      PBSFilter.init({
        container: '#pbsFilterRoot',
        collapseKey: 'org_list',
        groups: [
          { key: 'name', title: '机构名称', type: 'dropdown', placeholder: '全部机构', options: organizations.map(function (o) { return o.name; }) },
          { key: 'members', title: '机构成员人数', type: 'range', min: 0, max: 10, unit: '人' },
          { key: 'created', title: '创建时间（距今天数）', type: 'range', min: 0, max: 600, unit: '天' }
        ],
        onChange: function () { renderOrganizations(); }
      });
    }'''
assert h.count(old) == 1, 'reset fn'
h = h.replace(old, new)

old = "document.addEventListener('DOMContentLoaded', renderOrganizations);"
new = '''document.addEventListener('DOMContentLoaded', function () {
      initOrgPbsFilter();
      renderOrganizations();
    });'''
assert h.count(old) == 1, 'domcontentloaded'
h = h.replace(old, new)

io.open(HTML, 'w', encoding='utf-8', newline='').write(h.replace('\n', '\r\n'))
print('HTML OK')
