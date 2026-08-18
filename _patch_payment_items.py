# -*- coding: utf-8 -*-
"""
项目详情页 · 支付信息卡片改造
阶段进度条(节点1→2→3)  →  服务条目清单（按院校分组 / 条目独立并行 / 单条反馈交付 / 保录取全包模式）
同步移除仅服务于旧节点模型的「配置节点」按钮、配置抽屉与二次确认弹窗。
"""
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = r'项目详情页 - 留学申请管理系统.html'
src = open(PATH, encoding='utf-8', newline='').read()
lines = src.split('\n')
total0 = len(lines)


def ok(cond, msg):
    if not cond:
        print('ASSERT FAILED: ' + msg)
        sys.exit(1)


# ---------- 锚点校验（基于原始行号，1-based 注释） ----------
ok('支付节点配置抽屉' in lines[995], 'drawer comment @996')
ok('payConfigDrawer' in lines[996], 'drawer div @997')
ok(lines[1049].rstrip('\r') == '  </div>', 'modal end @1050, got: %r' % lines[1049])
ok(lines[1050].strip() == '', 'blank @1051')
ok('页面提示 Toast' in lines[1051], 'toast comment @1052')

ok('支付节点自定义配置' in lines[1741], 'payconfig js start @1742')
ok('function savePayConfig' in lines[1864], 'savePayConfig @1865')
ok(lines[1882].rstrip('\r') == '    }', 'payconfig js end @1883, got: %r' % lines[1882])
ok('DOMContentLoaded' in lines[1884], 'DOMContentLoaded @1885')

ok('套餐支付信息动态切换' in lines[1909], 'pkg section @1910')
ok(lines[2006].rstrip('\r') == '    }', 'renderPaymentInfo end @2007, got: %r' % lines[2006])
ok('初始化' in lines[2008], 'init comment @2009')
ok("selectPackage('cmu')" in lines[2009], 'init call @2010')

ok(lines[777].startswith('<div id="paymentInfo"'), 'paymentInfo static @778')
ok(lines[776].rstrip('\r') == '          </h3>', 'h3 end @777')
ok(lines[778].rstrip('\r') == '        </div>', 'card close @779')

ok('openPayConfig' in lines[772], 'config btn @773')
ok(lines[774].strip() == '配置节点', 'config btn text @775')
ok(lines[775].rstrip('\r') == '            </button>', 'config btn end @776')
ok(lines[776].rstrip('\r') == '          </h3>', 'h3 close @777')

# ---------- 新内容 ----------
NEW_PAY_DIV = ['<div id="paymentInfo" class="text-sm"></div>']

NEW_JS = r"""    // ========== 套餐支付信息动态切换（服务条目清单模式） ==========
    function fmtAmt(n) { return '¥' + Number(n).toLocaleString('en-US'); }
    function currentDateTime() {
      var now = new Date();
      function pad(v) { return String(v).padStart(2, '0'); }
      return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    }

    // 每个套餐由「院校目标分组 + 独立服务条目」构成；条目支付/任务状态互相独立，支持并行推进
    var packageData = {
      cmu: {
        name: '卡内基梅隆大学+计算机科学',
        allInclusive: false,
        groups: [
          {
            school: '卡内基梅隆大学',
            major: '计算机科学',
            items: [
              { id: 'cmu-ps', name: 'PS 文书（个人陈述）', amount: 18000, paid: true, payTime: '2026-07-05 14:30', delivered: false },
              { id: 'cmu-rl', name: 'RL 推荐信（2 封）', amount: 8000, paid: true, payTime: '2026-07-05 14:30', delivered: true },
              { id: 'cmu-cv', name: 'CV 简历', amount: 6000, paid: true, payTime: '2026-08-10 10:20', delivered: false },
              { id: 'cmu-apply', name: '网申服务', amount: 20000, paid: true, payTime: '2026-08-10 10:20', delivered: false },
              { id: 'cmu-interview', name: '面试辅导', amount: 6000, paid: false, payTime: null, delivered: false }
            ]
          }
        ]
      },
      ic: {
        name: '帝国理工学院+金融工程',
        allInclusive: false,
        groups: [
          {
            school: '帝国理工学院',
            major: '金融工程',
            items: [
              { id: 'ic-ps', name: 'PS 文书（个人陈述）', amount: 16000, paid: true, payTime: '2026-07-02 11:00', delivered: false },
              { id: 'ic-cv', name: 'CV 简历', amount: 6000, paid: true, payTime: '2026-07-02 11:00', delivered: true },
              { id: 'ic-apply', name: '网申服务', amount: 12000, paid: true, payTime: '2026-08-12 09:40', delivered: false },
              { id: 'ic-school', name: '选校报告', amount: 4000, paid: false, payTime: null, delivered: false }
            ]
          }
        ]
      }
    };

    var selectedPackageId = 'cmu';

    function selectPackage(id) {
      selectedPackageId = id;
      document.querySelectorAll('[data-package-id]').forEach(function(el) {
        el.classList.remove('border-blue-500', 'bg-blue-50');
        el.classList.add('border-transparent', 'bg-gray-50');
        if (el.dataset.packageId === id) {
          el.classList.remove('border-transparent', 'bg-gray-50');
          el.classList.add('border-blue-500', 'bg-blue-50');
        }
      });
      renderPaymentInfo();
    }

    // 条目任务状态推导：未支付=待付款锁定；已支付未反馈=进行中；已反馈=已交付反馈
    function itemTaskStatus(it) {
      if (!it.paid) { return 'locked'; }
      return it.delivered ? 'delivered' : 'inprogress';
    }
    function findPayItem(itemId) {
      var data = packageData[selectedPackageId];
      for (var g = 0; g < data.groups.length; g++) {
        var items = data.groups[g].items;
        for (var i = 0; i < items.length; i++) {
          if (items[i].id === itemId) { return { group: data.groups[g], item: items[i] }; }
        }
      }
      return null;
    }

    // 反馈交付：仅通知商城该条目对应的服务已完成交付，不影响其他条目
    function deliverItem(itemId) {
      var found = findPayItem(itemId);
      if (!found) { return; }
      var it = found.item;
      if (!it.paid || it.delivered) { return; }
      it.delivered = true;
      renderPaymentInfo();
      showPageToast('已通知商城：“' + found.group.school + ' · ' + it.name + '”已完成交付', true);
    }

    // 保录取全包模式：一次性解锁全部条目，所有条目并行进行中，可分别反馈交付
    function switchAllInclusive() {
      var data = packageData[selectedPackageId];
      if (data.allInclusive) { return; }
      data.allInclusive = true;
      var now = currentDateTime();
      data.groups.forEach(function(g) {
        g.items.forEach(function(it) {
          if (!it.paid) { it.paid = true; it.payTime = now; }
        });
      });
      renderPaymentInfo();
      showPageToast('已切换为保录取全包模式：全部服务条目已解锁，可分别反馈交付', true);
    }

    function renderPaymentInfo() {
      var data = packageData[selectedPackageId];
      var paidAmt = 0, paidCnt = 0, totalCnt = 0;
      data.groups.forEach(function(g) {
        g.items.forEach(function(it) {
          totalCnt++;
          if (it.paid) { paidCnt++; paidAmt += it.amount; }
        });
      });
      var pct = totalCnt ? Math.round(paidCnt / totalCnt * 100) : 0;

      var html = '';

      // 顶部汇总：累计已到账金额 + 支付进度（已支付条目数/总条目数）
      html += '<div class="mb-3 pb-3 border-b border-gray-100">' +
        '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-gray-900 font-semibold">累计已到账金额 <span class="text-lg">' + fmtAmt(paidAmt) + '</span></span>' +
        '<span class="text-xs text-gray-500">支付进度 <span class="font-medium text-blue-600">' + paidCnt + '/' + totalCnt + '</span> 条目</span></div>' +
        '<div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">' +
        '<div class="h-full bg-blue-500 rounded-full transition-all duration-500" style="width: ' + pct + '%"></div></div></div>';

      // 服务条目清单：按院校目标分组平铺，条目平等展示、无先后顺序
      data.groups.forEach(function(g, gi) {
        var gPaid = 0;
        g.items.forEach(function(it) { if (it.paid) { gPaid++; } });
        if (gi > 0) {
          html += '<div class="border-t border-dashed border-gray-200 my-3"></div>';
        }
        html += '<div>' +
          '<div class="flex items-center gap-1.5 mb-2">' +
          '<svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>' +
          '<span class="text-sm font-semibold text-gray-800">' + g.school + '</span>' +
          '<span class="text-xs text-gray-400">' + g.major + '</span>' +
          '<span class="ml-auto text-[10px] text-gray-400 flex-shrink-0">' + gPaid + '/' + g.items.length + ' 已到账</span></div>' +
          '<div class="space-y-2">';

        g.items.forEach(function(it) {
          var st = itemTaskStatus(it);
          var boxCls = it.paid ? 'border-blue-200 bg-blue-50 bg-opacity-50' : 'border-gray-200 bg-gray-100 bg-opacity-70';
          var textCls = it.paid ? 'text-gray-900' : 'text-gray-400';
          var payBadge = it.paid
            ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 flex-shrink-0">💰 已到账</span>'
            : '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-500 flex-shrink-0">⏳ 待支付</span>';
          var taskBadge = '';
          var btnHtml = '';
          var timeHtml = '';
          if (st === 'locked') {
            taskBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-400 flex-shrink-0">🔒 待付款锁定</span>';
          } else if (st === 'delivered') {
            taskBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 flex-shrink-0">✅ 已交付反馈</span>';
            btnHtml = '<button disabled class="ml-auto px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 rounded-md cursor-not-allowed flex-shrink-0">✅ 已反馈</button>';
          } else {
            taskBadge = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 flex-shrink-0">进行中</span>';
            btnHtml = '<button class="ml-auto px-2 py-1 text-[10px] font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-100 transition-colors flex-shrink-0" data-item-id="' + it.id + '" onclick="deliverItem(this.dataset.itemId)">📤 反馈交付</button>';
          }
          if (it.paid && it.payTime) {
            timeHtml = '<p class="text-[10px] text-gray-400 mt-1.5">到账时间 ' + it.payTime + '</p>';
          }
          html += '<div class="rounded-lg border p-3 ' + boxCls + '">' +
            '<div class="flex items-center gap-2">' +
            payBadge +
            '<span class="text-sm font-medium ' + textCls + ' truncate">' + it.name + '</span>' +
            '<span class="ml-auto text-sm font-semibold ' + textCls + ' flex-shrink-0">' + fmtAmt(it.amount) + '</span></div>' +
            '<div class="flex items-center gap-1.5 mt-2">' + taskBadge + btnHtml + '</div>' +
            timeHtml +
            '</div>';
        });

        html += '</div></div>';
      });

      // 保录取全包模式入口（卡片底部）
      if (data.allInclusive) {
        html += '<div class="mt-3 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">⚡ 保录取全包模式已开启 · 全部条目已解锁</div>';
      } else {
        html += '<button class="w-full mt-3 px-3 py-2 text-xs font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition-colors" onclick="switchAllInclusive()">⚡ 切换为保录取全包模式</button>';
      }

      document.getElementById('paymentInfo').innerHTML = html;
    }"""

NEW_JS_LINES = [l + '\r' for l in NEW_JS.split('\n')]

# ---------- 按行号从高到低执行替换/删除 ----------
lines[1909:2007] = NEW_JS_LINES     # F: 套餐数据 + 渲染函数（1910-2007）
del lines[1741:1883]                # E: 旧「配置支付节点」JS（1742-1883）
del lines[995:1051]                 # C+D: 配置抽屉 + 二次确认弹窗（996-1051）
lines[777:778] = NEW_PAY_DIV        # B: 支付信息静态占位（778）
del lines[772:776]                  # A: 「配置节点」按钮（773-776）

out = '\n'.join(lines)

# ---------- 结果校验 ----------
checks = [
    ('openPayConfig', 0),
    ('payConfigDrawer', 0),
    ('payStatusConfirmModal', 0),
    ('payNodeList', 0),
    ('配置节点', 0),
    ('data.payments', 0),
    ('deliverItem', 2),   # 函数定义 + onclick
    ('switchAllInclusive', 2),
    ('保录取全包模式', 5),  # 注释×2 + toast + 已开启提示 + 切换按钮
    ('服务条目清单', 2),
    ('id="paymentInfo"', 1),
    ('selectPackage', 4),  # 套餐卡片 onclick×2 + 函数定义 + 初始化调用
]
for token, expect in checks:
    n = out.count(token)
    ok(n == expect, 'token %r count=%d expect=%d' % (token, n, expect))

with open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(out)

print('OK  lines %d -> %d' % (total0, len(lines)))
