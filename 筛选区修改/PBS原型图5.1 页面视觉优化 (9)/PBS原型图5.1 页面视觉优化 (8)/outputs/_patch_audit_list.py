# -*- coding: utf-8 -*-
import io, re
p = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)\文书审核列表页 - 留学申请管理系统.html'
s = io.open(p, encoding='utf-8', newline='').read()

def sub1(pat, repl, name, flags=re.S):
    global s
    r = re.compile(pat, flags)
    ms = r.findall(s)
    print(name, 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT: ' + name)
    s = r.sub(repl, s, count=1)

sub1(r'<link rel="stylesheet" href="\./assets/css/pbs-theme\.css\?v=6\.4">',
     '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.4">\r\n  <link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n  <script src="./assets/js/pbs-filter.js?v=6.4"></script>',
     'theme', 0)
sub1(r'[ \t]*<div>\s*<label class="block text-sm text-gray-600 mb-2">文书类型</label>.*?</div>\s*\r?\n', '', 'type-block')
sub1(r'[ \t]*<div>\s*<label class="block text-sm text-gray-600 mb-2">文书状态</label>.*?</div>\s*\r?\n', '', 'status-block')
sub1(r'[ \t]*<div class="flex items-center gap-3 mt-4">\s*<button onclick="applyFilter\(\)".*?重置</button>\s*</div>',
     '        <!-- 结构化筛选区（复选框组 / 可搜索多选下拉） -->\r\n        <div id="pbsFilterRoot" class="mt-4"></div>', 'buttons-row')

rows = [
    ('1李建国李雪PS审核中', '75'),
    ('2王建华王明CV审核中', '119'),
    ('3张国庆张华RL已完成', '73'),
    ('4刘志强刘芳PS审核中', '94'),
    ('5陈国强陈磊RP已完成', '28'),
    ('6赵文华赵婷CV审核中', '60'),
]
for kw, days in rows:
    pat = re.compile(r'(data-kw="' + re.escape(kw) + r'[^"]*")')
    ms = pat.findall(s)
    print('row', kw[:6], 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT row ' + kw[:6])
    s = pat.sub(lambda m: m.group(1) + ' data-ddl-days="' + days + '"', s, count=1)

dyn = "tr.setAttribute('data-status', '审核中');"
assert s.count(dyn) == 1
s = s.replace(dyn, dyn + "\r\n      tr.setAttribute('data-ddl-days', '');")

start = s.find('    /* ---------- 高级筛选 ---------- */')
end = s.find('  </script>', start)
print('js block:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT js')

new_js = """    /* ---------- 高级筛选（共享筛选组件 PBSFilter） ---------- */
    function gv(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    function auditUniq(attr) {
      var set = [];
      document.querySelectorAll('#auditTbody tr[data-kw]').forEach(function (tr) {
        var v = tr.getAttribute(attr);
        if (v && set.indexOf(v) < 0) set.push(v);
      });
      return set;
    }
    function ddlBucketMatch(days, buckets) {
      if (!buckets || !buckets.length) return true;
      if (days === '' || days == null) return false;
      var n = parseInt(days, 10);
      if (isNaN(n)) return false;
      var hit = false;
      buckets.forEach(function (b) {
        if (b === '剩3天' && n <= 3) hit = true;
        if (b === '剩7天' && n >= 4 && n <= 7) hit = true;
        if (b === '剩14天' && n >= 8 && n <= 14) hit = true;
        if (b === '其他' && n > 14) hit = true;
      });
      return hit;
    }
    function applyFilter() {
      var st = window.PBSFilter ? PBSFilter.getState() : {};
      var rows = document.querySelectorAll('#auditTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        if (ok && st.type && st.type.length && st.type.indexOf(d.type) < 0) ok = false;
        if (ok && st.status && st.status.length && st.status.indexOf(d.status) < 0) ok = false;
        if (ok && !ddlBucketMatch(d.ddlDays, st.ddlCountdown)) ok = false;
        if (ok && st.customer && st.customer.length && st.customer.indexOf(d.customer) < 0) ok = false;
        if (ok && st.student && st.student.length && st.student.indexOf(d.student) < 0) ok = false;
        if (ok && st.reviewer && st.reviewer.length && st.reviewer.indexOf(d.reviewer) < 0) ok = false;
        if (ok && st.person && st.person.length && st.person.indexOf(d.person) < 0) ok = false;
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
    /* 初始化结构化筛选：文书类型·文书状态·DDL倒计时复选框组 / 客户·学生·审核人员·提交人可搜索多选下拉 */
    document.addEventListener('DOMContentLoaded', function() {
      if (window.PBSFilter) {
        PBSFilter.init({
          container: '#pbsFilterRoot',
          onChange: applyFilter,
          groups: [
            { key: 'type', title: '文书类型（可多选）', type: 'checks', options: ['PS', 'CV', 'RL', 'RP', 'CL'] },
            { key: 'status', title: '文书状态（可多选）', type: 'checks', options: ['审核中', '已完成'] },
            { key: 'ddlCountdown', title: 'DDL倒计时（可多选）', type: 'checks', options: ['剩3天', '剩7天', '剩14天', '其他'] },
            { key: 'customer', title: '客户姓名', type: 'dropdown', options: auditUniq('data-customer'), placeholder: '全部客户' },
            { key: 'student', title: '学生姓名', type: 'dropdown', options: auditUniq('data-student'), placeholder: '全部学生' },
            { key: 'reviewer', title: '文书审核人员', type: 'dropdown', options: auditUniq('data-reviewer'), placeholder: '全部审核人员' },
            { key: 'person', title: '提交人', type: 'dropdown', options: auditUniq('data-person'), placeholder: '全部提交人' }
          ]
        });
      }
      document.querySelectorAll('input[id^="flt-"]').forEach(function (inp) {
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyFilter(); });
        if (inp.type === 'text') inp.addEventListener('input', applyFilter);
        if (inp.type === 'date') inp.addEventListener('change', applyFilter);
      });
    });
"""
s = s[:start] + new_js + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('WRITE OK')
