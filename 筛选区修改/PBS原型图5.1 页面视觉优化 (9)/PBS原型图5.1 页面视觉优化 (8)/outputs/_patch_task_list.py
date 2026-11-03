# -*- coding: utf-8 -*-
import io, re
p = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)\任务列表页 - 文书交付系统.html'
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
     '        <!-- 结构化筛选区（复选框组 / 可搜索多选下拉 / 滑块） -->\r\n        <div id="pbsFilterRoot" class="mt-4"></div>', 'buttons-row')

rows = [
    ('1李建国李雪卡内基梅隆大学人工智能PS撰写中', 'data-school="卡内基梅隆大学" data-major="人工智能" data-writer="陈文书" data-ddl-days="75" data-stay-days="2"'),
    ('2王建华王明斯坦福大学计算机科学CV撰写中', 'data-school="斯坦福大学" data-major="计算机科学" data-writer="周文书" data-ddl-days="119" data-stay-days="5"'),
    ('3张国庆张华麻省理工学院数据科学RL审核中', 'data-school="麻省理工学院" data-major="数据科学" data-writer="吴文书" data-ddl-days="73" data-stay-days="1"'),
    ('4刘志强刘芳哈佛大学公共卫生PS需修改', 'data-school="哈佛大学" data-major="公共卫生" data-writer="陈文书" data-ddl-days="94" data-stay-days="3"'),
    ('5陈国强陈磊剑桥大学金融学RP已完成', 'data-school="剑桥大学" data-major="金融学" data-writer="郑文书" data-ddl-days="28" data-stay-days=""'),
    ('6李建国李雪卡内基梅隆大学人工智能CL套磁信待分配', 'data-school="卡内基梅隆大学" data-major="人工智能" data-writer="" data-ddl-days="31" data-stay-days=""'),
]
for kw, attrs in rows:
    pat = re.compile(r'(<tr data-kw="' + re.escape(kw) + r'[^"]*"[^>]*?)( class="hover:bg-gray-50")')
    ms = pat.findall(s)
    print('row', kw[:8], 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT row ' + kw[:8])
    s = pat.sub(lambda m: m.group(1) + ' ' + attrs + m.group(2), s, count=1)

dyn = "tr.setAttribute('data-status', '撰写中');"
assert s.count(dyn) == 1
s = s.replace(dyn, dyn + "\r\n      tr.setAttribute('data-school', info.school);\r\n      tr.setAttribute('data-major', info.major);\r\n      tr.setAttribute('data-writer', '');\r\n      tr.setAttribute('data-ddl-days', '');\r\n      tr.setAttribute('data-stay-days', '0');")

start = s.find('    /* ---------- 高级筛选 ---------- */')
end = s.find('  </script>', start)
print('js block:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT js')

new_js = """    /* ---------- 高级筛选（共享筛选组件 PBSFilter） ---------- */
    function gv(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    function taskUniq(attr) {
      var set = [];
      document.querySelectorAll('#taskTbody tr[data-kw]').forEach(function (tr) {
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
      var rows = document.querySelectorAll('#taskTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        if (ok && st.type && st.type.length && st.type.indexOf(d.type) < 0) ok = false;
        if (ok && st.status && st.status.length && st.status.indexOf(d.status) < 0) ok = false;
        if (ok && !ddlBucketMatch(d.ddlDays, st.ddlCountdown)) ok = false;
        if (ok && st.writer && st.writer.length && st.writer.indexOf(d.writer || '') < 0) ok = false;
        if (ok && st.customer && st.customer.length && st.customer.indexOf(d.customer) < 0) ok = false;
        if (ok && st.student && st.student.length && st.student.indexOf(d.name) < 0) ok = false;
        if (ok && st.school && st.school.length && st.school.indexOf(d.school) < 0) ok = false;
        if (ok && st.major && st.major.length && st.major.indexOf(d.major) < 0) ok = false;
        if (ok && st.stay) {
          var stay = d.stayDays === '' ? 0 : parseInt(d.stayDays || '0', 10);
          if (stay < st.stay.min || stay > st.stay.max) ok = false;
        }
        var v_ddl = gv('flt-ddl'), v_ddl_end = gv('flt-ddl-end'), ddlDate = (d.ddl || '').slice(0, 10);
        if (ok && v_ddl && (!ddlDate || ddlDate < v_ddl)) ok = false;
        if (ok && v_ddl_end && (!ddlDate || ddlDate > v_ddl_end)) ok = false;
        tr.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      var empty = document.getElementById('flt-empty');
      if (empty) empty.classList.toggle('hidden', visible > 0);
    }
    function resetFilter() {
      ['flt-kw','flt-ddl','flt-ddl-end'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      if (window.PBSFilter) PBSFilter.reset();
      applyFilter();
    }
    /* 初始化结构化筛选：文书状态·文书类型·DDL倒计时复选框组 / 交付人员·客户·学生·学校·专业可搜索多选下拉 / 滞留时长滑块 */
    document.addEventListener('DOMContentLoaded', function() {
      if (window.PBSFilter) {
        PBSFilter.init({
          container: '#pbsFilterRoot',
          onChange: applyFilter,
          groups: [
            { key: 'status', title: '文书状态（可多选）', type: 'checks', options: ['撰写中', '审核中', '需修改', '已完成', '待分配'] },
            { key: 'type', title: '文书类型（可多选）', type: 'checks', options: ['PS', 'CV', 'RL', 'RP', 'CL'] },
            { key: 'ddlCountdown', title: 'DDL倒计时（可多选）', type: 'checks', options: ['剩3天', '剩7天', '剩14天', '其他'] },
            { key: 'writer', title: '文书交付人员', type: 'dropdown', options: taskUniq('data-writer'), placeholder: '全部交付人员' },
            { key: 'customer', title: '客户姓名', type: 'dropdown', options: taskUniq('data-customer'), placeholder: '全部客户' },
            { key: 'student', title: '学生姓名', type: 'dropdown', options: taskUniq('data-name'), placeholder: '全部学生' },
            { key: 'school', title: '学校', type: 'dropdown', options: taskUniq('data-school'), placeholder: '全部学校' },
            { key: 'major', title: '专业', type: 'dropdown', options: taskUniq('data-major'), placeholder: '全部专业' },
            { key: 'stay', title: '当前环节滞留时长', type: 'range', min: 0, max: 30, unit: '天' }
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
