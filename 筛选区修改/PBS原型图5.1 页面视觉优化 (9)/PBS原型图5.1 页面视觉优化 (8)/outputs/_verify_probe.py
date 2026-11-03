# -*- coding: utf-8 -*-
"""单页试探：结项归档列表，输出完整响应便于诊断。"""
import json, time, urllib.request, urllib.parse

BASE = r'D:\work\project\自营系统\PBS产品\原型图文件\PBS原型图5.1 页面视觉优化 (8)'
DAEMON = 'http://127.0.0.1:10086/command'

def call(action, args):
    body = json.dumps({'action': action, 'args': args, 'session': 'pbs-filter-verify'}, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(DAEMON, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')

url = 'file:///' + urllib.parse.quote((BASE + '\\结项归档列表 - PBS留学CRM系统.html').replace('\\', '/'))
print('navigate:', call('navigate', {'url': url, 'newTab': True, 'group_title': 'PBS筛选区验证'}))
time.sleep(2)
print('eval:', call('evaluate', {'code': 'document.title'}))
