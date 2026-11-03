# -*- coding: utf-8 -*-
import io, re
p = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)\案例库 - 文书交付系统.html'
s = io.open(p, encoding='utf-8', newline='').read()

def sub1(pat, repl, name, flags=re.S):
    global s
    r = re.compile(pat, flags)
    ms = r.findall(s)
    print(name, 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT: ' + name)
    s = r.sub(repl, s, count=1)

# 1) head 引入
sub1(r'<link rel="stylesheet" href="\./assets/css/pbs-theme\.css\?v=6\.3">',
     '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.3">\r\n  <link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n  <script src="./assets/js/pbs-filter.js?v=6.4"></script>',
     'theme', 0)

# 2) 筛选区：删除 5 个下拉块 + 按钮行，插入 pbsFilterRoot
for label, name in [('文书类型','type'), ('申请层次','level'), ('解析状态','status'), ('申请方向','direction')]:
    sub1(r'[ \t]*<div>\s*<label class="block text-sm text-gray-600 mb-2">' + label + r'</label>.*?</div>\s*\r?\n', '', name + '-block')
sub1(r'[ \t]*<div id="orgFilterField" class="hidden">.*?</div>\s*\r?\n', '', 'org-block')
sub1(r'[ \t]*<div class="flex items-center gap-3 mt-4">\s*<button onclick="applyFilter\(\)".*?重置</button>\s*</div>',
     '        <!-- 结构化筛选区（复选框组 / 可搜索多选下拉） -->\r\n        <div id="pbsFilterRoot" class="mt-4"></div>', 'buttons-row')

# 3) 行补 data-student / data-template
rows = [
    ('张同学cs方向ps终稿', '张**', 'AI方向PS标准模板'),
    ('李同学ai方向ps录取版', '李**', 'AI方向PS标准模板'),
    ('王同学数据科学ps终稿', '王**', ''),
    ('陈同学金融方向cv终版', '陈**', ''),
    ('刘同学电子工程rp研究计划', '刘**', ''),
    ('赵同学市场营销推荐信', '赵**', '商科推荐信通用模板'),
    ('周同学机械工程ps', '周**', ''),
    ('吴同学计算机科学cv', '吴**', ''),
]
for kw, student, tpl in rows:
    pat = re.compile(r'(data-kw="' + re.escape(kw) + r'[^"]*")')
    ms = pat.findall(s)
    print('row', kw[:6], 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT row ' + kw[:6])
    s = pat.sub(lambda m: m.group(1) + ' data-student="' + student + '" data-template="' + tpl + '"', s, count=1)

# 4) 重写 applyFilter / resetFilter
start = s.find('    // ================= 筛选 =================')
end = s.find('    // ================= 勾选与批量操作 =================', start)
print('filter js:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT filter js')

new_filter_js = """    // ================= 筛选（共享筛选组件 PBSFilter） =================
    function gv(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    function caseUniq(attr) {
      var set = [];
      document.querySelectorAll('#caseTbody tr[data-kw]').forEach(function (tr) {
        var v = tr.getAttribute(attr);
        if (v && set.indexOf(v) < 0) set.push(v);
      });
      return set;
    }
    function applyFilter(silent) {
      var kw = gv('flt-kw').toLowerCase();
      var time = gv('flt-time'), timeEnd = gv('flt-time-end');
      var st = window.PBSFilter ? PBSFilter.getState() : {};
      var rows = document.querySelectorAll('#caseTbody tr:not(#flt-empty)');
      var visible = 0;
      rows.forEach(function(r) {
        var ok = true;
        if (kw && (r.dataset.kw || '').toLowerCase().indexOf(kw) === -1) ok = false;
        if (ok && st.type && st.type.length && st.type.indexOf(r.dataset.type) < 0) ok = false;
        if (ok && st.level && st.level.length && st.level.indexOf(r.dataset.level) < 0) ok = false;
        if (ok && st.status && st.status.length && st.status.indexOf(r.dataset.status) < 0) ok = false;
        if (ok && st.org && st.org.length && st.org.indexOf(r.dataset.org) < 0) ok = false;
        if (ok && st.author && st.author.length && st.author.indexOf(r.dataset.uploader) < 0) ok = false;
        if (ok && st.direction && st.direction.length && st.direction.indexOf(r.dataset.direction) < 0) ok = false;
        if (ok && st.school && st.school.length && st.school.indexOf(r.dataset.school) < 0) ok = false;
        if (ok && st.student && st.student.length && st.student.indexOf(r.dataset.student) < 0) ok = false;
        if (ok && st.template && st.template.length && st.template.indexOf(r.dataset.template || '') < 0) ok = false;
        var caseDate = (r.dataset.time || '').slice(0, 10);
        if (ok && time && (!caseDate || caseDate < time)) ok = false;
        if (ok && timeEnd && (!caseDate || caseDate > timeEnd)) ok = false;
        r.style.display = ok ? '' : 'none';
        if (ok) visible++;
      });
      document.getElementById('flt-empty').classList.toggle('hidden', visible > 0);
      if (visible > 0 && silent !== true) showToast('筛选完成，命中 ' + visible + ' 个案例（当前页）');
    }

    function resetFilter() {
      ['flt-kw','flt-time','flt-time-end'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter(true);
    }

"""
s = s[:start] + new_filter_js + s[end:]

# 5) DOMContentLoaded 中的机构逻辑重写 + 初始化 PBSFilter
start = s.find("      var orgFilter = document.getElementById('flt-org');")
end = s.find('      updateSelected();', start)
print('init js:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT init js')

new_init_js = """      var caseGroups = [
        { key: 'type', title: '文书类型（可多选）', type: 'checks', options: ['PS', 'CV', 'RP', '推荐信', 'CL'] },
        { key: 'level', title: '申请层次（可多选）', type: 'checks', options: ['本科申请', '硕士申请', '博士申请', '本硕连读申请'] },
        { key: 'status', title: '解析状态（可多选）', type: 'checks', options: ['已解析', '未解析', '解析中', '解析失败', '已归档'] }
      ];
      if (isPlatformScope) {
        caseGroups.push({ key: 'org', title: '所属机构（可多选）', type: 'checks', options: ['PBS留学总部', '上海启明留学', '北京知行教育'] });
        var caseTable = document.querySelector('#caseTbody').closest('table');
        var headRow = caseTable.querySelector('thead tr');
        var orgHead = document.createElement('th');
        orgHead.className = 'px-5 py-4 text-left text-sm font-medium text-gray-500';
        orgHead.textContent = '机构';
        orgHead.setAttribute('data-platform-column', 'organization');
        headRow.insertBefore(orgHead, headRow.children[8]);
        rows.forEach(function(row) {
          var cell = document.createElement('td');
          cell.className = 'px-5 py-4 text-sm text-gray-600';
          cell.textContent = row.dataset.org;
          cell.setAttribute('data-platform-column', 'organization');
          row.insertBefore(cell, row.children[8]);
        });
        var tableScroll = document.createElement('div');
        tableScroll.style.overflowX = 'auto';
        caseTable.style.minWidth = '1540px';
        caseTable.parentNode.insertBefore(tableScroll, caseTable);
        tableScroll.appendChild(caseTable);
      } else {
        /* 机构角色仅查看本机构案例 */
        var ownOrg = organizationNames.indexOf(session.org) >= 0 ? session.org : 'PBS留学总部';
        rows.forEach(function(row) { if (row.dataset.org !== ownOrg) row.style.display = 'none'; });
      }
      caseGroups.push(
        { key: 'author', title: '作者', type: 'dropdown', options: caseUniq('data-uploader'), placeholder: '全部作者' },
        { key: 'direction', title: '申请方向', type: 'dropdown', options: caseUniq('data-direction'), placeholder: '全部方向' },
        { key: 'school', title: '录取院校', type: 'dropdown', options: caseUniq('data-school'), placeholder: '全部院校' },
        { key: 'student', title: '来源学生', type: 'dropdown', options: caseUniq('data-student'), placeholder: '全部学生' },
        { key: 'template', title: '关联模板', type: 'dropdown', options: caseUniq('data-template'), placeholder: '全部模板' }
      );
      if (window.PBSFilter) {
        PBSFilter.init({ container: '#pbsFilterRoot', onChange: function () { applyFilter(true); }, groups: caseGroups });
      }
      var emptyCell = document.querySelector('#flt-empty td');
      if (emptyCell) emptyCell.colSpan = isPlatformScope ? 13 : 12;
      applyFilter(true);
"""
s = s[:start] + new_init_js + s[end:]

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('WRITE OK')
