# -*- coding: utf-8 -*-
"""通过 Kimi WebBridge 在真实浏览器中验证 15 个页面的筛选区：
- PBSFilter 是否挂载、分组数量
- 可收缩开关是否生效
- 勾选复选项后列表数量是否变化（过滤联动）
"""
import json, time, urllib.request, urllib.parse, io, sys

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
DAEMON = 'http://127.0.0.1:10086/command'
SESSION = 'pbs-filter-verify'

PAGES = [
    '学生档案列表页 - 留学申请管理系统.html',
    '项目池列表页 - 留学申请管理系统.html',
    '我的项目列表页 - 留学申请管理系统.html',
    '任务列表页 - 文书交付系统.html',
    '模板库列表 - 文书交付系统.html',
    '案例库 - 文书交付系统.html',
    '文书审核列表页 - 留学申请管理系统.html',
    '网申任务列表页 - 留学申请管理系统.html',
    '网申模板库 - 留学申请管理系统.html',
    '监控任务列表 - PBS留学CRM.html',
    '结项归档列表 - PBS留学CRM系统.html',
    '选校任务列表页 - 留学申请管理系统.html',
    '机构管理 - PBS留学CRM系统.html',
    '人员管理 - PBS留学CRM系统.html',
    '操作日志审计 - 留学申请管理系统.html',
]

def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': SESSION}, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(DAEMON, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))

EVAL_CODE = r"""
(() => {
  var out = { title: document.title };
  out.hasPBSFilter = typeof window.PBSFilter !== 'undefined';
  var root = document.querySelector('#pbsFilterRoot');
  out.hasRoot = !!root;
  if (!root) return JSON.stringify(out);
  out.barMounted = !!root.querySelector('.pbs-filter-bar');
  out.groups = root.querySelectorAll('.pbs-filter-group').length;
  out.dropdowns = root.querySelectorAll('.pbs-filter-dd').length;
  out.ranges = root.querySelectorAll('.pbs-filter-range, .pbs-filter-group [type=range]').length;
  var body = root.querySelector('.pbs-filter-body');
  var toggle = root.querySelector('.pbs-filter-collapse-btn');
  out.hasToggle = !!toggle;
  if (body && toggle) {
    var before = body.style.display;
    toggle.click();
    var afterClick = body.style.display;
    toggle.click();
    var afterBack = body.style.display;
    out.collapseWorks = (afterClick === 'none' && afterBack !== 'none') || (afterClick !== 'none' && afterBack === 'none') || (before !== afterClick);
    out.collapseDetail = [before, afterClick, afterBack].join('>');
  }
  // 过滤联动测试：勾选第一个复选框，比较可见行/卡片数量
  function visibleCount() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('tbody tr'));
    var vis = rows.filter(function (tr) { return tr.offsetParent !== null; }).length;
    return vis;
  }
  var cb = root.querySelector('.pbs-filter-checks input[type=checkbox]');
  out.hasCheckbox = !!cb;
  if (cb) {
    var c0 = visibleCount();
    cb.click();
    var c1 = visibleCount();
    cb.click();
    var c2 = visibleCount();
    out.filterTest = { before: c0, afterCheck: c1, afterUncheck: c2, ok: c2 === c0 };
  }
  return JSON.stringify(out);
})()
"""

results = []
first = True
for name in PAGES:
    url = 'file:///' + urllib.parse.quote((BASE + '\\' + name).replace('\\', '/'))
    try:
        args = {'url': url}
        if first:
            args['newTab'] = True
            args['group_title'] = 'PBS筛选区验证'
        r = call('navigate', args)
        time.sleep(2.5)
        ev = call('evaluate', {'code': EVAL_CODE})
        val = ev.get('result', {}).get('value') or ev.get('value') or ''
        results.append((name, val))
        first = False
    except Exception as e:
        results.append((name, 'ERROR: ' + str(e)))

out_path = BASE + r'\outputs\_verify_browser_result.txt'
w = io.open(out_path, 'w', encoding='utf-8')
for name, val in results:
    w.write(name + '\n  ' + str(val) + '\n')
w.close()
print('done ->', out_path)
