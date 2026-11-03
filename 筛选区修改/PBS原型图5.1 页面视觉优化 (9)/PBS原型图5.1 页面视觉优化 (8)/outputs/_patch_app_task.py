# -*- coding: utf-8 -*-
import io, re
p = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)\网申任务列表页 - 留学申请管理系统.html'
s = io.open(p, encoding='utf-8', newline='').read()

def sub1(pat, repl, name, flags=re.S):
    global s
    r = re.compile(pat, flags)
    ms = r.findall(s)
    print(name, 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT: ' + name)
    s = r.sub(repl, s, count=1)

# 1) head 引入
sub1(r'<link rel="stylesheet" href="\./assets/css/pbs-theme\.css\?v=6\.4">',
     '<link rel="stylesheet" href="./assets/css/pbs-theme.css?v=6.4">\r\n  <link rel="stylesheet" href="./assets/css/pbs-filter.css?v=6.4">\r\n  <script src="./assets/js/pbs-filter.js?v=6.4"></script>',
     'theme', 0)

# 2) 删除 网申状态 / 申请轮次 下拉块，按钮行 → pbsFilterRoot
sub1(r'[ \t]*<div>\s*<label class="block text-sm text-gray-600 mb-2">网申状态</label>.*?</div>\s*\r?\n', '', 'status-block')
sub1(r'[ \t]*<div>\s*<label class="block text-sm text-gray-600 mb-2">申请轮次</label>.*?</div>\s*\r?\n', '', 'round-block')
sub1(r'[ \t]*<div class="flex items-center gap-3 mt-4">\s*<button onclick="applyFilter\(\)".*?重置</button>\s*</div>',
     '        <!-- 结构化筛选区（复选框组 / 可搜索多选下拉 / 滑块 / 单选按钮组） -->\r\n        <div id="pbsFilterRoot" class="mt-4"></div>', 'buttons-row')

# 3) 静态行补 data-person / data-ddl-days / data-stay-days
rows = [
    ('1李建国李雪卡内基梅隆大学人工智能', '孙网申', '75', '12'),
    ('2王建华王明斯坦福大学计算机科学', '孙网申', '119', ''),
    ('3张国庆张华麻省理工学院数据科学', '钱网申', '73', '8'),
    ('4刘志强刘芳哈佛大学公共卫生', '钱网申', '94', '2'),
    ('5陈国强陈磊剑桥大学金融学', '', '28', ''),
    ('6赵文华赵婷哥伦比亚大学经济学', '孙网申', '60', '1'),
]
for kw, person, ddl, stay in rows:
    pat = re.compile(r'(data-kw="' + re.escape(kw) + r'[^"]*")')
    ms = pat.findall(s)
    print('row', kw[:6], 'matches:', len(ms))
    if len(ms) != 1: raise SystemExit('ABORT row ' + kw[:6])
    attrs = ' data-person="' + person + '" data-ddl-days="' + ddl + '" data-stay-days="' + stay + '"'
    s = pat.sub(lambda m: m.group(1) + attrs, s, count=1)

# 4) 动态行补属性
dyn = "tr.setAttribute('data-status', '进行中');"
assert s.count(dyn) == 1
s = s.replace(dyn, dyn + "\r\n      tr.setAttribute('data-person', '孙网申');\r\n      tr.setAttribute('data-ddl-days', '105');\r\n      tr.setAttribute('data-stay-days', '0');")

# 5) 替换筛选 JS
start = s.find('    /* ---------- 高级筛选 ---------- */')
end = s.find('  </script>', start)
print('js block:', start, end)
if not (start > 0 and end > start): raise SystemExit('ABORT js')

new_js = """    /* ---------- 高级筛选（共享筛选组件 PBSFilter） ---------- */
    function gv(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    function appUniq(attr) {
      var set = [];
      document.querySelectorAll('#appTaskTbody tr[data-kw]').forEach(function (tr) {
        var v = tr.getAttribute(attr);
        if (v && set.indexOf(v) < 0) set.push(v);
      });
      return set;
    }
    function normRound(v) { return (v || '').replace(/\\s/g, ''); }
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
    function roundMatch(roundVal, buckets) {
      if (!buckets || !buckets.length) return true;
      var r = normRound(roundVal);
      var hit = false;
      buckets.forEach(function (b) {
        if (b === '更多') {
          var m = r.match(/^Round(\\d+)$/i);
          if (m && parseInt(m[1], 10) > 5) hit = true;
          if (r && !/^Round\\d+$/i.test(r)) hit = true;
        } else if (normRound(b) === r) hit = true;
      });
      return hit;
    }
    function materialMatch(material, picked) {
      if (!picked || !picked.length) return true;
      var m = (material || '').match(/(\\d+)\\s*\\/\\s*(\\d+)/);
      if (!m) return false;
      var total = parseInt(m[2], 10), done = parseInt(m[1], 10);
      var missPct = total > 0 ? (total - done) / total * 100 : 0;
      var bucket = missPct < 20 ? '<20%' : (missPct < 40 ? '<40%' : '其他');
      return picked.indexOf(bucket) >= 0;
    }
    function applyFilter() {
      var st = window.PBSFilter ? PBSFilter.getState() : {};
      var rows = document.querySelectorAll('#appTaskTbody tr[data-kw]');
      var visible = 0;
      rows.forEach(function (tr) {
        var d = tr.dataset, ok = true;
        var v_kw = gv('flt-kw').toLowerCase(); if (ok && v_kw && d.kw.toLowerCase().indexOf(v_kw) < 0) ok = false;
        if (ok && st.status && st.status.length && st.status.indexOf(d.status) < 0) ok = false;
        if (ok && !roundMatch(d.round, st.round)) ok = false;
        if (ok && !ddlBucketMatch(d.ddlDays, st.ddlCountdown)) ok = false;
        if (ok && st.customer && st.customer.length && st.customer.indexOf(d.customer) < 0) ok = false;
        if (ok && st.student && st.student.length && st.student.indexOf(d.name) < 0) ok = false;
        if (ok && st.major && st.major.length && st.major.indexOf(d.major) < 0) ok = false;
        if (ok && st.school && st.school.length && st.school.indexOf(d.school) < 0) ok = false;
        if (ok && st.person && st.person.length && st.person.indexOf(d.person || '') < 0) ok = false;
        if (ok && st.stay) {
          var stay = d.stayDays === '' ? 0 : parseInt(d.stayDays || '0', 10);
          if (stay < st.stay.min || stay > st.stay.max) ok = false;
        }
        if (ok && !materialMatch(d.material, st.materialMiss)) ok = false;
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
    /* 初始化结构化筛选：网申状态·申请轮次·DDL倒计时复选框组 / 客户·学生·专业·学校·网申人员可搜索多选下拉 / 滞留时长滑块 / 材料缺失数量单选 */
    document.addEventListener('DOMContentLoaded', function() {
      if (window.PBSFilter) {
        PBSFilter.init({
          container: '#pbsFilterRoot',
          onChange: applyFilter,
          groups: [
            { key: 'status', title: '网申状态（可多选）', type: 'checks', options: ['未开始', '待领取', '进行中', '审核中', '已提交'] },
            { key: 'round', title: '申请轮次（可多选）', type: 'checks', options: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', '更多'] },
            { key: 'ddlCountdown', title: 'DDL倒计时（可多选）', type: 'checks', options: ['剩3天', '剩7天', '剩14天', '其他'] },
            { key: 'customer', title: '客户姓名', type: 'dropdown', options: appUniq('data-customer'), placeholder: '全部客户' },
            { key: 'student', title: '学生姓名', type: 'dropdown', options: appUniq('data-name'), placeholder: '全部学生' },
            { key: 'major', title: '专业', type: 'dropdown', options: appUniq('data-major'), placeholder: '全部专业' },
            { key: 'school', title: '学校', type: 'dropdown', options: appUniq('data-school'), placeholder: '全部学校' },
            { key: 'person', title: '网申人员', type: 'dropdown', options: appUniq('data-person'), placeholder: '全部网申人员' },
            { key: 'stay', title: '当前环节滞留时长', type: 'range', min: 0, max: 30, unit: '天' },
            { key: 'materialMiss', title: '材料缺失数量（单选）', type: 'radios', options: ['<20%', '<40%', '其他'] }
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
