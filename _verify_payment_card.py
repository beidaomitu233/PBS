# -*- coding: utf-8 -*-
"""校验美化后的支付信息卡片：JS 语法 / CSS 类配对 / 渲染输出结构"""
import re, io, sys, subprocess, tempfile, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

src = open('项目详情页 - 留学申请管理系统.html', encoding='utf-8', newline='').read()

# 1) 内联 JS 语法
m = re.search(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', src, re.S)
js = m.group(1)
p = os.path.join(tempfile.gettempdir(), 'pbs_check.js')
open(p, 'w', encoding='utf-8').write(js)
r = subprocess.run(['node', '--check', p], capture_output=True)
print('syntax:', 'OK' if r.returncode == 0 else r.stderr.decode('utf-8', errors='replace')[:1500])
os.remove(p)

# 2) 渲染代码引用的 pay-* 类是否都已在 <style> 中定义
need = ['pay-summary','pay-summary-row','pay-summary-label','pay-summary-amount','pay-summary-count',
        'pay-progress','pay-progress-fill','pay-group','pay-group-head','pay-group-icon','pay-group-name',
        'pay-group-major','pay-group-count','pay-items','pay-item','is-paid','is-done','is-locked',
        'pay-item-main','pay-item-line1','pay-name','pay-pill','pill-green','pill-violet','pill-gray',
        'pay-sub','pay-amount','pay-btn','pay-btn-done','pay-allin-btn','pay-allin-on']
missing = [c for c in need if ('.' + c) not in src]
print('css classes missing:', missing if missing else 'NONE')

# 3) 旧实现的临时变量应已无残留
for t in ['payBadge', 'taskBadge', 'btnHtml', 'timeHtml', 'border-dashed border-gray-200 my-3']:
    print('residual %r: %d' % (t, js.count(t)))

# 4) Node 模拟渲染：默认 CMU / 反馈交付 / IC / 全包模式
start = js.index('// ========== 套餐支付信息动态切换')
end = js.index("selectPackage('cmu');")
seg = js[start:end]
harness = seg + r"""
var __html = '';
var document = { getElementById: function(){ return null; }, querySelectorAll: function(){ return []; } };
function showPageToast(msg, ok) { console.log('TOAST: ' + msg); }
var __setter = { set innerHTML(v){ __html = v; } };
function bind() { document.getElementById = function(){ return __setter; }; }

bind(); renderPaymentInfo();
var cmu = __html;
console.log('--- CMU 汇总:', /pay-summary-amount">([^<]+)</.exec(cmu)[1], '| 进度:', /pay-summary-count"><strong>([^<]+)<\/strong>([^<]+)</.exec(cmu)[0].replace(/<[^>]+>/g,' '));
console.log('CMU 条目数:', (cmu.match(/pay-item /g) || []).length, '| 锁定:', (cmu.match(/is-locked/g) || []).length, '| 已完成:', (cmu.match(/is-done/g) || []).length, '| 反馈按钮:', (cmu.match(/pay-btn"/g) || []).length, '| 已反馈章:', (cmu.match(/pay-btn-done/g) || []).length);
deliverItem('cmu-cv');
console.log('--- cmu-cv 反馈后反馈按钮数:', (__html.match(/pay-btn"/g) || []).length, '已反馈章数:', (__html.match(/pay-btn-done/g) || []).length);
selectedPackageId = 'ic'; bind(); renderPaymentInfo();
console.log('--- IC 汇总:', /pay-summary-amount">([^<]+)</.exec(__html)[1], '| 条目数:', (__html.match(/pay-item /g) || []).length);
switchAllInclusive();
console.log('--- IC 全包后: 锁定数', (__html.match(/is-locked/g) || []).length, '| 全包状态条:', /pay-allin-on/.test(__html), '| 进度:', (__html.match(/pay-progress-fill" style="width: (\d+)%/) || [])[1] + '%');
"""
p2 = os.path.join(tempfile.gettempdir(), 'pbs_render2.js')
open(p2, 'w', encoding='utf-8').write(harness)
r2 = subprocess.run(['node', p2], capture_output=True)
print(r2.stdout.decode('utf-8', errors='replace'))
if r2.returncode != 0:
    print('STDERR:', r2.stderr.decode('utf-8', errors='replace')[:2000])
os.remove(p2)
