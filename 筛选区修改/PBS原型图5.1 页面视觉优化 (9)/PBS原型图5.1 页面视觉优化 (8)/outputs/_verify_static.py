# -*- coding: utf-8 -*-
"""静态完整性检查：15 个页面都应引用 pbs-filter 资源并挂载 pbsFilterRoot。"""
import io, os

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
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

ok = True
for name in PAGES:
    p = os.path.join(BASE, name)
    s = io.open(p, encoding='utf-8', newline='').read()
    checks = {
        'css': 'assets/css/pbs-filter.css' in s,
        'js': 'assets/js/pbs-filter.js' in s,
        'root': 'pbsFilterRoot' in s,
        'init': 'PBSFilter.init' in s or '网申模板库' in name,  # 模板库由外部 js 联动
    }
    # head 中的 js 引用必须先于 body 内联脚本
    head_end = s.find('</head>')
    js_idx = s.find('pbs-filter.js')
    checks['js_in_head'] = 0 < js_idx < head_end if head_end > 0 else False
    status = 'OK ' if all(checks.values()) else 'FAIL'
    if not all(checks.values()):
        ok = False
        print(status, name, checks)
    else:
        print(status, name)

# 检查共享组件本身存在
for f in ['assets/js/pbs-filter.js', 'assets/css/pbs-filter.css']:
    p = os.path.join(BASE, f)
    print('asset', f, os.path.getsize(p), 'bytes')

print('ALL OK' if ok else 'SOME FAILED')
