/* ============================================================
   PBS留学CRM系统 - 角色工作台共享模块
   六角色工作台（指标 × 卡片 × 今日待办 × DDL 日历 × 数据看板）
   数据与「管理员工作台（全部角色视角）」页一致，供各角色自己的工作台页面复用：
   - 文书机构管理员 → 任务列表页 - 文书交付系统.html?view=workbench
   - 项目经理       → 项目经理工作台 - 留学申请管理系统.html
   - 文书人员       → 任务列表页 - 文书交付系统.html?view=workbench
   - 销售人员(管理员) → 选校任务列表页 - 留学申请管理系统.html?view=workbench
   - 网申人员       → 网申任务列表页 - 留学申请管理系统.html?view=workbench
   - 文书审核       → 文书审核列表页 - 留学申请管理系统.html?view=workbench
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 样式注入（与管理员工作台页内 wb-* 样式一致） ---------------- */
  var WB_CSS = ''
    + '.wb-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:16px 0 14px;flex-wrap:wrap}'
    + '.wb-title{font-size:20px;font-weight:600;color:#1f2937;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
    + '.wb-scope{font-size:12px;font-weight:500;padding:2px 10px;border-radius:999px}'
    + '.wb-sub{font-size:13px;color:#9ca3af;margin-top:4px}'
    + '.wb-stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}'
    + '.wb-stat{flex:1;min-width:150px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)}'
    + '.wb-stat .l{font-size:13px;color:#6b7280}'
    + '.wb-stat .v{font-size:28px;font-weight:700;color:#111827;margin-top:6px;line-height:1}'
    + '.wb-stat .n{font-size:12px;color:#9ca3af;margin-top:6px}'
    + '.wb-stat.tone-red .v{color:#dc2626}'
    + '.wb-stat.tone-orange .v{color:#ea580c}'
    + '.wb-stat.tone-blue .v{color:#2563eb}'
    + '.wb-stat.tone-purple .v{color:#7c3aed}'
    + '.wb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}'
    + '.wb-card{display:block;background:#fff;border:1px solid #f3f4f6;border-left:4px solid #2563eb;border-radius:12px;padding:12px 14px;text-decoration:none;transition:box-shadow .15s}'
    + '.wb-card:hover{box-shadow:0 6px 16px rgba(16,24,40,.08)}'
    + '.wb-card .m{font-size:13px;font-weight:600;color:#1f2937}'
    + '.wb-card .c{font-size:12px;color:#6b7280;margin-top:4px;line-height:1.5}'
    + '.wb-card .go{font-size:12px;margin-top:8px;font-weight:500}'
    + '.wb-main{display:grid;grid-template-columns:7fr 5fr;gap:16px;margin-bottom:16px}'
    + '@media(max-width:1100px){.wb-main{grid-template-columns:1fr}}'
    + '.wb-panel{background:#fff;border:1px solid #f3f4f6;border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(16,24,40,.04)}'
    + '.wb-panel-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap}'
    + '.wb-panel-t{font-size:15px;font-weight:600;color:#111827}'
    + '.wb-panel-n{font-size:12px;color:#9ca3af}'
    + '.wb-group-t{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#374151;margin:14px 0 8px}'
    + '.wb-group-t:first-of-type{margin-top:0}'
    + '.wb-group-dot{width:8px;height:8px;border-radius:999px;flex-shrink:0}'
    + '.wb-todo{display:flex;gap:12px;padding:12px;border:1px solid #f3f4f6;border-radius:12px;margin-bottom:8px;align-items:flex-start;transition:border-color .15s,background .15s}'
    + '.wb-todo:hover{border-color:#dbeafe;background:#fafbff}'
    + '.wb-todo-bar{width:4px;align-self:stretch;border-radius:4px;flex-shrink:0}'
    + '.wb-todo-b{flex:1;min-width:0}'
    + '.wb-todo-t{font-size:14px;font-weight:600;color:#111827;display:flex;align-items:center;gap:8px;flex-wrap:wrap;line-height:1.5}'
    + '.wb-tag{font-size:11px;font-weight:600;padding:1px 8px;border-radius:999px;color:#fff;flex-shrink:0}'
    + '.wb-todo-m{font-size:12px;color:#6b7280;margin-top:4px;line-height:1.6}'
    + '.wb-todo-time{font-size:12px;font-weight:600;margin-top:6px}'
    + '.wb-act{flex-shrink:0;font-size:12px;font-weight:500;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;background:#2563eb;color:#fff}'
    + '.wb-act:hover{background:#1d4ed8}'
    + '.wb-act.ghost{background:#f5f3ff;color:#7c3aed}'
    + '.wb-act.ghost:hover{background:#ede9fe}'
    + '.wb-act.plain{background:#f3f4f6;color:#374151}'
    + '.wb-act.plain:hover{background:#e5e7eb}'
    + '.wb-cal-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}'
    + '.wb-cal-t{font-size:14px;font-weight:600;color:#111827}'
    + '.wb-cal-nav{display:flex;gap:6px}'
    + '.wb-cal-nav button{width:26px;height:26px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:pointer;font-size:14px;line-height:1}'
    + '.wb-cal-nav button:hover{background:#f3f4f6}'
    + '.wb-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}'
    + '.wb-cal-w{font-size:11px;color:#9ca3af;text-align:center;padding:4px 0}'
    + '.wb-day{position:relative;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#374151;cursor:pointer;border:1px solid transparent;background:#fff;user-select:none}'
    + '.wb-day:hover{background:#f3f4f6}'
    + '.wb-day.out{color:#d1d5db;cursor:default;background:transparent}'
    + '.wb-day.out:hover{background:transparent}'
    + '.wb-day.has{font-weight:700;color:#dc2626;background:#fef2f2}'
    + '.wb-day.has::after{content:"";position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:999px;background:#dc2626}'
    + '.wb-day.today{border-color:#2563eb;color:#2563eb;font-weight:700}'
    + '.wb-day.sel{background:#2563eb;color:#fff;font-weight:700}'
    + '.wb-day.sel.has{background:#dc2626;color:#fff}'
    + '.wb-day.sel::after{background:#fff}'
    + '.wb-daydetail{margin-top:12px;border-top:1px dashed #e5e7eb;padding-top:12px}'
    + '.wb-dd{font-size:13px;font-weight:600;color:#111827;margin-bottom:8px}'
    + '.wb-ev{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#f9fafb;margin-bottom:6px}'
    + '.wb-ev .tg{font-size:11px;font-weight:600;padding:1px 8px;border-radius:999px;color:#fff;flex-shrink:0;margin-top:1px}'
    + '.wb-ev .tx{font-size:12px;color:#374151;line-height:1.6}'
    + '.wb-ev-empty{font-size:12px;color:#9ca3af;padding:12px;text-align:center;background:#f9fafb;border-radius:10px}'
    + '.wb-boards{display:grid;gap:12px}'
    + '.wb-board-col{background:#fff;border:1px solid #f3f4f6;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(16,24,40,.04)}'
    + '.wb-board-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}'
    + '.wb-board-t{font-size:13px;font-weight:600;color:#111827;display:flex;align-items:center;gap:8px}'
    + '.wb-board-dot{width:8px;height:8px;border-radius:999px;flex-shrink:0}'
    + '.wb-board-c{font-size:12px;color:#9ca3af;flex-shrink:0}'
    + '.wb-bitem{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:10px;background:#f9fafb;margin-bottom:6px}'
    + '.wb-bitem .nm{font-size:13px;color:#1f2937;font-weight:500;line-height:1.5}'
    + '.wb-bitem .mt{font-size:11px;color:#9ca3af;margin-top:2px;line-height:1.5}'
    + '.wb-bdg{font-size:11px;font-weight:600;padding:1px 8px;border-radius:999px;flex-shrink:0;white-space:nowrap}'
    + '.wb-prog{height:6px;border-radius:999px;background:#f3f4f6;overflow:hidden;margin-top:6px}'
    + '.wb-prog span{display:block;height:100%;border-radius:999px}';

  function ensureStyle() {
    if (document.getElementById('pbs-workbench-style')) return;
    var st = document.createElement('style');
    st.id = 'pbs-workbench-style';
    st.textContent = WB_CSS;
    document.head.appendChild(st);
  }

  /* ================= 角色工作台数据 =================
     数据全部取自系统内真实页面：任务列表页（文书交付）、网申任务列表页、文书审核列表页、
     选校订单池页、选校任务列表页、我的项目列表页、项目经理工作台、项目详情页支付信息。 */
  var WB_TODAY = '2026-08-18';
  var WB_TODAY_LABEL = '今天 2026-08-18 · 周二';
  var WB_RED = '#dc2626', WB_ORANGE = '#ea580c', WB_AMBER = '#d97706', WB_BLUE = '#2563eb',
      WB_PURPLE = '#7c3aed', WB_GREEN = '#059669', WB_CYAN = '#0891b2', WB_GRAY = '#6b7280';

  /* 状态徽标配色（与系统各列表页状态徽标一致） */
  var WB_BADGE = {
    '撰写中':['#eff6ff','#1d4ed8'], '需修改':['#fee2e2','#b91c1c'], '审核中':['#ffedd5','#c2410c'],
    '已完成':['#dcfce7','#15803d'], '进行中':['#eff6ff','#1d4ed8'], '待领取':['#f3f4f6','#4b5563'],
    '已提交':['#dcfce7','#15803d'], '待接收':['#f5f3ff','#6d28d9'], '未接收':['#fef3c7','#b45309'],
    '咨询中':['#eff6ff','#1d4ed8'], '选校中':['#dcfce7','#15803d'], '待确认':['#fef3c7','#b45309'],
    '已结单':['#f3f4f6','#4b5563'], '已退回':['#fee2e2','#b91c1c'], '暂停':['#fef3c7','#b45309'],
    '已结项':['#f3f4f6','#4b5563'], '已付':['#dcfce7','#15803d'], '待付':['#fef3c7','#b45309'],
    '文书临期':['#fee2e2','#b91c1c'], '材料缺失':['#fef3c7','#b45309'], '正常':['#dcfce7','#15803d'],
    '逾期':['#fee2e2','#b91c1c'], '新推送':['#f5f3ff','#6d28d9']
  };

  /* ---------- 数据构造小工具 ---------- */
  function wbT(bar, tag, tagC, title, meta, time, timeC, act) {
    return { bar: bar, tag: tag, tagColor: tagC, title: title, meta: meta, time: time, timeColor: timeC, act: act };
  }
  function wbB(nm, bdg, mt, prog, progC) { return { nm: nm, bdg: bdg, mt: mt, prog: prog, progC: progC }; }
  function wbEv(tg, c, tx) { return { tg: tg, c: c, tx: tx }; }

  /* ================= 六角色工作台数据 ================= */
  var WB_ROLES = {

    /* ---------- 1. 文书机构管理员 ---------- */
    wsadmin: {
      name: '文书机构管理员', scope: '管理视角 · 全模块', scopeBg: '#eff6ff', scopeC: '#1d4ed8',
      tagline: '项目分配、团队卡点与全模块进度一屏掌握',
      stats: [
        { l: '今日待办', v: '5', n: '2 项需我处理 · 3 项团队卡点', t: '' },
        { l: '待分配项目', v: '2', n: '项目池新增 · 等待分配项目经理', t: 'tone-orange' },
        { l: '审核积压', v: '4', n: '文书审核中 · 最早 08-15 提交', t: 'tone-red' }
      ],
      cards: [
        { m: 'PMO 项目池', c: '2 个新增项目待分配', color: WB_CYAN, href: '项目池列表页 - 留学申请管理系统.html' },
        { m: '文书交付', c: '在办任务 5 项 · 1 项需修改', color: WB_BLUE, href: '任务列表页 - 文书交付系统.html' },
        { m: '网申管理', c: '任务 6 项 · 1 项待领取', color: WB_PURPLE, href: '网申任务列表页 - 留学申请管理系统.html' },
        { m: '文书审核', c: '审核中 4 份 · 已完成 2 份', color: WB_ORANGE, href: '文书审核列表页 - 留学申请管理系统.html' },
        { m: '选校工作台', c: '订单 4 笔 · 1 笔待确认', color: WB_GREEN, href: '选校订单池页 - 留学申请管理系统.html' }
      ],
      todoCount: 5,
      todoGroups: [
        { title: '需要我处理', color: WB_RED, items: [
          wbT(WB_RED, '待分配', WB_RED, '分配项目池 2 个新增项目', 'PMO监控台 · 项目池列表 · 新下单项目等待分配项目经理', '等待分配 · 越早就位越早启动', WB_GRAY, { l: '去分配', href: '项目池列表页 - 留学申请管理系统.html' }),
          wbT(WB_AMBER, '订单跟进', WB_AMBER, '吴子墨博士申请订单「待确认」', '选校订单池 · 加拿大 · 数据科学 · 2026-07-18 下单 · 销售：孙鹏', '待客户确认选校方案', WB_AMBER, { l: '去查看', href: '选校订单池页 - 留学申请管理系统.html', cls: 'plain' })
        ]},
        { title: '团队卡点 · 可催办', color: WB_ORANGE, items: [
          wbT(WB_RED, '逾期', WB_RED, '「审核 CMU 个人陈述终稿」尚未接收', '接收人：孙老师（审核人员）· 8月13日 04:30 分配', '已等待 1 天 6 小时', WB_RED, { l: '催办', urge: ['审核 CMU 个人陈述终稿', '孙老师', '审核人员'], cls: 'ghost' }),
          wbT(WB_ORANGE, '卡点', WB_ORANGE, '「接收 Stanford 网申准备任务」尚未接收', '接收人：周老师（网申人员）· 8月13日 16:30 分配', '已等待 18 小时', WB_ORANGE, { l: '催办', urge: ['接收 Stanford 网申准备任务', '周老师', '网申人员'], cls: 'ghost' }),
          wbT(WB_AMBER, '卡点', WB_AMBER, '「接收推荐信初稿撰写任务」尚未接收', '接收人：刘老师（文书交付人员）· 今天 04:30 分配', '已等待 6 小时', WB_AMBER, { l: '催办', urge: ['接收推荐信初稿撰写任务', '刘老师', '文书交付人员'], cls: 'ghost' })
        ]}
      ],
      events: {
        '2026-08-15': [wbEv('审核提交', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV 提交审核（审核人员：王审核）')],
        '2026-08-16': [wbEv('审核提交', WB_ORANGE, '王明 · 斯坦福大学 CV 提交审核（审核人员：王审核）')],
        '2026-08-17': [wbEv('审核提交', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS 提交审核（审核人员：王审核）')],
        '2026-08-18': [wbEv('审核提交', WB_ORANGE, '刘芳 · 哈佛大学 PS 今天 08:40 提交审核（审核人员：李审核）'), wbEv('分配', WB_RED, '「推荐信初稿撰写任务」分配 6 小时未接收（刘老师）')],
        '2026-09-15': [wbEv('文书DDL', WB_BLUE, '陈磊 · 剑桥大学 金融学 RP（已完成）')],
        '2026-10-17': [wbEv('网申DDL', WB_PURPLE, '赵婷 · 哥伦比亚大学 经济学 Round 1 截止')],
        '2026-10-30': [wbEv('文书DDL', WB_BLUE, '张华 · 麻省理工学院 数据科学 RL'), wbEv('网申DDL', WB_PURPLE, '张华 · 麻省理工学院 Round 1 截止')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS'), wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 Round 1 截止')],
        '2026-11-20': [wbEv('文书DDL', WB_BLUE, '刘芳 · 哈佛大学 公共卫生 PS'), wbEv('网申DDL', WB_PURPLE, '刘芳 · 哈佛大学 Round 1 截止')],
        '2026-12-01': [wbEv('网申DDL', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1 截止')],
        '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 计算机科学 CV'), wbEv('网申DDL', WB_PURPLE, '王明 · 斯坦福大学 Round 2 截止')]
      },
      boards: [
        { title: '文书交付 · 任务列表', color: WB_BLUE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中', 'DDL 2026-11-01'),
          wbB('王明 · 斯坦福大学 计算机科学 CV', '撰写中', 'DDL 2026-12-15'),
          wbB('张华 · 麻省理工学院 数据科学 RL', '审核中', 'DDL 2026-10-30'),
          wbB('刘芳 · 哈佛大学 公共卫生 PS', '需修改', 'DDL 2026-11-20'),
          wbB('陈磊 · 剑桥大学 金融学 RP', '已完成', 'DDL 2026-09-15')
        ]},
        { title: '网申管理 · 网申任务列表', color: WB_PURPLE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 Round 1', '进行中', '材料 3/5 · DDL 2026-11-01 · 孙网申'),
          wbB('张华 · 麻省理工学院 数据科学 Round 1', '进行中', '材料 4/6 · DDL 2026-10-30 · 钱网申'),
          wbB('刘芳 · 哈佛大学 公共卫生 Round 1', '审核中', '材料 5/5 · DDL 2026-11-20 · 钱网申'),
          wbB('赵婷 · 哥伦比亚大学 经济学 Round 1', '待领取', '材料 3/5 · DDL 2026-10-17 · 孙网申'),
          wbB('王明 · 斯坦福大学 计算机科学 Round 2', '已提交', '材料 6/6 · DDL 2026-12-15 · 孙网申'),
          wbB('孙梓涵 · 哥伦比亚大学 金融工程 Round 1', '新推送', 'DDL 2026-12-01 · 待接收')
        ]},
        { title: '文书审核 · 审核列表', color: WB_ORANGE, items: [
          wbB('刘芳 · 哈佛大学 PS', '审核中', '今天 08:40 提交 · 李审核'),
          wbB('李雪 · 卡内基梅隆大学 PS', '审核中', '08-17 10:30 提交 · 王审核'),
          wbB('王明 · 斯坦福大学 CV', '审核中', '08-16 14:20 提交 · 王审核'),
          wbB('赵婷 · 哥伦比亚大学 CV', '审核中', '08-15 11:05 提交 · 王审核'),
          wbB('张华 · 麻省理工学院 RL', '已完成', '08-12 09:15 提交 · 李审核'),
          wbB('陈磊 · 剑桥大学 RP', '已完成', '08-10 16:00 提交 · 王审核')
        ]},
        { title: '选校工作台 · 订单池', color: WB_GREEN, items: [
          wbB('钱思睿 · 本科申请 / 美国 / 计算机科学', '咨询中', '2026-07-15 下单 · 销售：陈晨'),
          wbB('孙浩然 · 硕士申请 / 英国 / 金融', '咨询中', '2026-07-16 下单 · 销售：刘洋'),
          wbB('周雨薇 · 硕士申请 / 美国 / 电子工程', '选校中', '2026-07-17 下单 · 销售：赵敏'),
          wbB('吴子墨 · 博士申请 / 加拿大 / 数据科学', '待确认', '2026-07-18 下单 · 销售：孙鹏')
        ]}
      ]
    },

    /* ---------- 2. 项目经理 ---------- */
    pm: {
      name: '项目经理', scope: '管理视角 · 我的项目', scopeBg: '#f5f3ff', scopeC: '#6d28d9',
      tagline: '先处理临期与卡点，再推进项目进度',
      stats: [
        { l: '今日待办', v: '7', n: '3 项今天先处理 · 1 项近期跟进 · 3 项等待接收', t: '' },
        { l: '等待他人', v: '3', n: '分配未接收 · 最久 1 天 6 小时', t: 'tone-red' },
        { l: '我的项目', v: '5', n: '进行中 1 · 待接收 1 · 已退回 1', t: 'tone-blue' }
      ],
      cards: [
        { m: '我的项目列表', c: '5 个项目 · 刘晓项目待接收', color: WB_CYAN, href: '我的项目列表页 - 留学申请管理系统.html' },
        { m: '文书交付', c: '李雪 CMU PS 终稿等待确认', color: WB_BLUE, href: '任务列表页 - 文书交付系统.html' },
        { m: '网申管理', c: 'Stanford 网申准备任务待接收', color: WB_PURPLE, href: '网申任务列表页 - 留学申请管理系统.html' },
        { m: '文书审核', c: 'CMU 个人陈述终稿审核中', color: WB_ORANGE, href: '文书审核列表页 - 留学申请管理系统.html' }
      ],
      todoCount: 7,
      todoGroups: [
        { title: '今天先处理', color: WB_RED, items: [
          wbT(WB_RED, '临期', WB_RED, '确认李雪的 CMU 文书终稿', '当前在刘老师 · 等待 PM 最终确认 · 李雪 · 硕士申请', '今天 18:00 前', WB_RED, { l: '立即处理', href: '我的项目详情页 - 留学申请管理系统.html' }),
          wbT(WB_ORANGE, '材料', WB_ORANGE, '催收陈雨桐护照复印件', '学生材料缺失 · 已影响网申字段准备 · 陈雨桐 · 硕士申请', '今天', WB_ORANGE, { l: '催办', urge: ['催收陈雨桐护照复印件', '陈雨桐', '学生'], cls: 'ghost' }),
          wbT(WB_PURPLE, '待接收', WB_PURPLE, '接收刘晓的本科申请项目', '机构已完成项目经理分配 · PRJ20260701005', '待接收', WB_GRAY, { l: '查看任务', href: '我的项目列表页 - 留学申请管理系统.html' })
        ]},
        { title: '近期跟进', color: WB_AMBER, items: [
          wbT(WB_AMBER, null, null, '跟进斯坦福推荐信审核', '当前在孙老师 · 已停留 18 小时', '明天 12:00', WB_GRAY, { l: '催办', urge: ['跟进斯坦福推荐信审核', '孙老师', '审核人员'], cls: 'ghost' })
        ]},
        { title: '分配任务待接收 · 可催办', color: WB_ORANGE, items: [
          wbT(WB_RED, '逾期', WB_RED, '审核 CMU 个人陈述终稿', '文书审核 · 李雪 · 卡内基梅隆大学 · 孙老师 · 8月13日 04:30 分配', '已等待 1 天 6 小时', WB_RED, { l: '催办', urge: ['审核 CMU 个人陈述终稿', '孙老师', '审核人员'], cls: 'ghost' }),
          wbT(WB_ORANGE, null, null, '接收 Stanford 网申准备任务', '网申管理 · 李雪 · 斯坦福大学 · 周老师 · 8月13日 16:30 分配', '已等待 18 小时', WB_ORANGE, { l: '催办', urge: ['接收 Stanford 网申准备任务', '周老师', '网申人员'], cls: 'ghost' }),
          wbT(WB_AMBER, null, null, '接收推荐信初稿撰写任务', '文书交付 · 陈雨桐 · 加州大学伯克利分校 · 刘老师 · 今天 04:30 分配', '已等待 6 小时', WB_AMBER, { l: '催办', urge: ['接收推荐信初稿撰写任务', '刘老师', '文书交付人员'], cls: 'ghost' })
        ]}
      ],
      events: {
        '2026-08-13': [wbEv('分配', WB_RED, '04:30 分配「审核 CMU 个人陈述终稿」给孙老师（已等待 1 天 6 小时）'), wbEv('分配', WB_ORANGE, '16:30 分配「Stanford 网申准备任务」给周老师（已等待 18 小时）')],
        '2026-08-18': [wbEv('临期', WB_RED, '今天 18:00 前确认李雪的 CMU 文书终稿'), wbEv('材料', WB_ORANGE, '催收陈雨桐护照复印件'), wbEv('分配', WB_AMBER, '04:30 分配「推荐信初稿撰写任务」给刘老师（已等待 6 小时）')],
        '2026-08-19': [wbEv('跟进', WB_CYAN, '12:00 跟进斯坦福推荐信审核（孙老师）')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS'), wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 Round 1 截止')]
      },
      boards: [
        { title: '重点项目状态', color: WB_BLUE, items: [
          wbB('李雪 · 硕士申请', '文书临期', '当前：CMU 文书交付 · 下一步：PM 确认', 62, WB_RED),
          wbB('陈雨桐 · 硕士申请', '材料缺失', '当前：材料准备 · 卡在学生', 38, WB_AMBER),
          wbB('王梓豪 · 博士申请', '正常', '当前：院校目标确认 · 进度正常', 48, WB_GREEN)
        ]},
        { title: '我的项目 · 项目列表', color: WB_CYAN, items: [
          wbB('李雪 · 硕士申请（PRJ20260701002）', '进行中', '更新 2026-07-14 09:30'),
          wbB('刘晓 · 本科申请（PRJ20260701005）', '待接收', '机构已分配 · 待接收'),
          wbB('陈雨桐 · 硕士申请（PRJ20260701008）', '已退回', '更新 2026-07-15 14:00'),
          wbB('王梓豪 · 博士申请（PRJ20260701012）', '暂停', '更新 2026-07-16 10:15'),
          wbB('赵欣怡 · 本科申请（PRJ20260701018）', '已结项', '更新 2026-07-10 08:00')
        ]},
        { title: '分配任务待接收', color: WB_ORANGE, items: [
          wbB('审核 CMU 个人陈述终稿 · 孙老师（审核人员）', '逾期', '8月13日 04:30 分配 · 已等待 1 天 6 小时'),
          wbB('接收 Stanford 网申准备任务 · 周老师（网申人员）', '未接收', '8月13日 16:30 分配 · 已等待 18 小时'),
          wbB('接收推荐信初稿撰写任务 · 刘老师（文书交付）', '未接收', '今天 04:30 分配 · 已等待 6 小时')
        ]}
      ]
    },

    /* ---------- 3. 文书人员 ---------- */
    writer: {
      name: '文书人员', scope: '执行视角 · 我的文书任务', scopeBg: '#eff6ff', scopeC: '#1d4ed8',
      tagline: '先交被催的、先改打回的，再推进撰写中的',
      stats: [
        { l: '被催办', v: '1', n: '李雪 CMU PS 终稿 · 今天 18:00 前', t: 'tone-red' },
        { l: '需修改', v: '1', n: '刘芳 哈佛 PS · DDL 11-20', t: 'tone-orange' },
        { l: '撰写中', v: '2', n: '李雪 CMU PS · 王明斯坦福 CV', t: 'tone-blue' },
        { l: '待接收', v: '1', n: '陈雨桐 伯克利推荐信初稿', t: 'tone-purple' }
      ],
      cards: [
        { m: '任务列表', c: '我的任务 5 项 · 1 项被催办', color: WB_BLUE, href: '任务列表页 - 文书交付系统.html' },
        { m: '模板库', c: '文书模板与范例', color: WB_CYAN, href: '模板库列表 - 文书交付系统.html' },
        { m: '案例库', c: '优秀文书案例参考', color: WB_GREEN, href: '案例库 - 文书交付系统.html' },
        { m: '文书编辑器', c: '继续撰写未完成文书', color: WB_PURPLE, href: '文书编辑器 - 文书交付系统.html' }
      ],
      todoCount: 5,
      todoGroups: [
        { title: '优先处理', color: WB_RED, items: [
          wbT(WB_RED, '被催办', WB_RED, '李雪 · 卡内基梅隆大学 个人陈述（PS）终稿', '项目经理催办 · 终稿提交后等待 PM 确认 · 客户：李建国', '今天 18:00 前提交', WB_RED, { l: '立即处理', href: '任务列表页 - 文书交付系统.html' }),
          wbT(WB_RED, '需修改', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS 修改', '审核打回 · 按审核意见修改后重新提交 · 客户：刘志强', 'DDL 2026-11-20', WB_GRAY, { l: '去修改', href: '任务列表页 - 文书交付系统.html' }),
          wbT(WB_PURPLE, '待接收', WB_PURPLE, '陈雨桐 · 加州大学伯克利分校 推荐信初稿撰写', '项目经理分配 · 今天 04:30 分配 · 已等待 6 小时', '接收后开始撰写', WB_GRAY, { l: '接收任务', toast: '已接收任务（陈雨桐 · 加州大学伯克利分校 推荐信初稿撰写），任务已加入任务列表' })
        ]},
        { title: '撰写中', color: WB_BLUE, items: [
          wbT(WB_BLUE, null, null, '李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中 · 客户：李建国', 'DDL 2026-11-01', WB_GRAY, { l: '继续撰写', href: '文书编辑器 - 文书交付系统.html', cls: 'plain' }),
          wbT(WB_BLUE, null, null, '王明 · 斯坦福大学 计算机科学 CV', '撰写中 · 客户：王建华', 'DDL 2026-12-15', WB_GRAY, { l: '继续撰写', href: '文书编辑器 - 文书交付系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-08-18': [wbEv('被催办', WB_RED, '李雪 · CMU 个人陈述（PS）终稿被项目经理催办 · 今天 18:00 前')],
        '2026-09-15': [wbEv('文书DDL', WB_BLUE, '陈磊 · 剑桥大学 金融学 RP（已完成）')],
        '2026-10-30': [wbEv('文书DDL', WB_BLUE, '张华 · 麻省理工学院 数据科学 RL（审核中）')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS（撰写中）')],
        '2026-11-20': [wbEv('文书DDL', WB_BLUE, '刘芳 · 哈佛大学 公共卫生 PS（需修改）')],
        '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 计算机科学 CV（撰写中）')]
      },
      boards: [
        { title: '撰写中', color: WB_BLUE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中', 'DDL 2026-11-01'),
          wbB('王明 · 斯坦福大学 计算机科学 CV', '撰写中', 'DDL 2026-12-15')
        ]},
        { title: '需修改', color: WB_RED, items: [
          wbB('刘芳 · 哈佛大学 公共卫生 PS', '需修改', '审核打回 · DDL 2026-11-20')
        ]},
        { title: '审核中', color: WB_ORANGE, items: [
          wbB('张华 · 麻省理工学院 数据科学 RL', '审核中', 'DDL 2026-10-30')
        ]},
        { title: '已完成', color: WB_GREEN, items: [
          wbB('陈磊 · 剑桥大学 金融学 RP', '已完成', 'DDL 2026-09-15')
        ]}
      ]
    },

    /* ---------- 4. 销售人员 ---------- */
    sales: {
      name: '销售人员', scope: '执行视角 · 订单与回款', scopeBg: '#fffbeb', scopeC: '#b45309',
      tagline: '待确认先跟、尾款先催、咨询持续跟',
      stats: [
        { l: '待确认订单', v: '1', n: '吴子墨博士申请 · 07-18 下单', t: 'tone-red' },
        { l: '咨询中订单', v: '2', n: '钱思睿 · 孙浩然', t: 'tone-blue' },
        { l: '待回款节点', v: '1', n: '李雪项目尾款 ¥12,000', t: 'tone-orange' }
      ],
      cards: [
        { m: '选校订单池', c: '订单 4 笔 · 1 笔待确认', color: WB_GREEN, href: '选校订单池页 - 留学申请管理系统.html' },
        { m: '选校任务列表', c: '咨询任务 5 项 · 1 项已结单', color: WB_CYAN, href: '选校任务列表页 - 留学申请管理系统.html' },
        { m: '支付节点', c: '李雪项目尾款待付 ¥12,000', color: WB_AMBER, href: '项目详情页 - 留学申请管理系统.html' }
      ],
      todoCount: 5,
      todoGroups: [
        { title: '今天先处理', color: WB_RED, items: [
          wbT(WB_RED, '待确认', WB_RED, '跟进吴子墨博士申请订单', '选校订单池 · 加拿大 · 数据科学 · 2026-07-18 下单 · 负责人：孙鹏', '待客户确认选校方案', WB_RED, { l: '去跟进', href: '选校订单池页 - 留学申请管理系统.html' }),
          wbT(WB_AMBER, '待回款', WB_AMBER, '催收李雪项目尾款 ¥12,000', '文书预付款 ¥24,000（07-05 已付）· 网申预付款 ¥20,000（08-10 已付）· 尾款待付', '尾款 · 待付', WB_AMBER, { l: '去催收', toast: '已提醒客户支付尾款 ¥12,000（李雪项目）' })
        ]},
        { title: '持续跟进', color: WB_GREEN, items: [
          wbT(WB_GREEN, null, null, '钱思睿 · 本科申请 · 美国 计算机科学', '选校订单池 · 咨询中 · 负责人：陈晨', '下单 2026-07-15', WB_GRAY, { l: '去跟进', href: '选校订单池页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_GREEN, null, null, '孙浩然 · 硕士申请 · 英国 金融', '选校订单池 · 咨询中 · 负责人：刘洋', '下单 2026-07-16', WB_GRAY, { l: '去跟进', href: '选校订单池页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_BLUE, null, null, '孙可欣 · 本科申请 · 美国 计算机科学', '选校任务列表 · 咨询中 · 负责人：陈晨', '选校咨询 2026-07-20 09:00', WB_GRAY, { l: '查看方案', href: '选校任务列表页 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-07-15': [wbEv('订单', WB_GREEN, '钱思睿 · 本科/美国/计算机科学 下单（咨询中 · 陈晨）')],
        '2026-07-16': [wbEv('订单', WB_GREEN, '孙浩然 · 硕士/英国/金融 下单（咨询中 · 刘洋）')],
        '2026-07-17': [wbEv('订单', WB_GREEN, '周雨薇 · 硕士/美国/电子工程 下单（选校中 · 赵敏）')],
        '2026-07-18': [wbEv('订单', WB_AMBER, '吴子墨 · 博士/加拿大/数据科学 下单（待确认 · 孙鹏）')],
        '2026-07-20': [wbEv('咨询', WB_CYAN, '孙可欣 · 本科/美国/计算机科学 选校咨询 09:00（陈晨）')],
        '2026-08-10': [wbEv('支付', WB_AMBER, '李雪项目网申预付款 ¥20,000 已付 · 尾款 ¥12,000 待付')]
      },
      boards: [
        { title: '选校订单池', color: WB_GREEN, items: [
          wbB('钱思睿 · 本科申请 / 美国 / 计算机科学', '咨询中', '2026-07-15 下单 · 负责人：陈晨'),
          wbB('孙浩然 · 硕士申请 / 英国 / 金融', '咨询中', '2026-07-16 下单 · 负责人：刘洋'),
          wbB('周雨薇 · 硕士申请 / 美国 / 电子工程', '选校中', '2026-07-17 下单 · 负责人：赵敏'),
          wbB('吴子墨 · 博士申请 / 加拿大 / 数据科学', '待确认', '2026-07-18 下单 · 负责人：孙鹏')
        ]},
        { title: '选校任务列表', color: WB_CYAN, items: [
          wbB('孙可欣 · 本科申请 / 美国 / 计算机科学', '咨询中', '2026-07-20 09:00 · 陈晨'),
          wbB('周雨薇 · 硕士申请 / 美国 / 电子工程', '咨询中', '2026-07-17 10:00 · 李欣'),
          wbB('吴子墨 · 博士申请 / 加拿大 / 数据科学', '咨询中', '2026-07-18 09:30 · 陈晨'),
          wbB('郑晓萌 · 本科申请 / 英国 / 金融', '咨询中', '2026-07-19 14:20 · 周扬'),
          wbB('冯天翊 · 硕士申请 / 美国 / 市场营销', '已结单', '2026-07-11 16:00 · 李欣')
        ]},
        { title: '支付节点 · 李雪 CMU 项目', color: WB_AMBER, items: [
          wbB('文书预付款 ¥24,000', '已付', '2026-07-05 14:30 支付'),
          wbB('网申预付款 ¥20,000', '已付', '2026-08-10 10:20 支付'),
          wbB('尾款 ¥12,000', '待付', '待客户支付')
        ]}
      ]
    },

    /* ---------- 5. 网申人员 ---------- */
    apply: {
      name: '网申人员', scope: '执行视角 · 我的网申任务', scopeBg: '#f5f3ff', scopeC: '#6d28d9',
      tagline: '先接收、再补材料，盯紧最近的网申 DDL',
      stats: [
        { l: '被催办', v: '1', n: 'Stanford 网申准备 · 已等待 18 小时', t: 'tone-red' },
        { l: '待领取', v: '1', n: '赵婷 哥大经济学 · DDL 10-17 最近', t: 'tone-orange' },
        { l: '进行中', v: '2', n: '张华 MIT · 李雪 CMU', t: 'tone-blue' },
        { l: '待接收', v: '1', n: '孙梓涵 哥大金融工程（新推送）', t: 'tone-purple' }
      ],
      cards: [
        { m: '网申任务列表', c: '任务 6 项 · 1 项被催办', color: WB_PURPLE, href: '网申任务列表页 - 留学申请管理系统.html' },
        { m: '网申模板库', c: '模板 5 套 · 覆盖美国/英国/中国香港', color: WB_BLUE, href: '网申模板库 - 留学申请管理系统.html' }
      ],
      todoCount: 5,
      todoGroups: [
        { title: '优先处理', color: WB_RED, items: [
          wbT(WB_RED, '被催办', WB_RED, '接收 Stanford 网申准备任务', '项目经理催办 · 8月13日 16:30 分配 · 李雪 · 斯坦福大学', '已等待 18 小时', WB_RED, { l: '立即接收', toast: '已接收 Stanford 网申准备任务，任务已加入网申任务列表' }),
          wbT(WB_PURPLE, '新推送', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1', '系统推送新网申任务 · 客户：孙志远', 'DDL 2026-12-01', WB_GRAY, { l: '接收任务', toast: '已接收网申任务（孙梓涵 - 哥伦比亚大学/金融工程），任务已加入网申任务列表' }),
          wbT(WB_ORANGE, '待领取', WB_ORANGE, '赵婷 · 哥伦比亚大学 经济学 Round 1', '材料 3/5 · 客户：赵文华', 'DDL 2026-10-17 · 最近网申 DDL', WB_ORANGE, { l: '领取任务', toast: '已领取网申任务（赵婷 - 哥伦比亚大学/经济学）' })
        ]},
        { title: '进行中', color: WB_BLUE, items: [
          wbT(WB_BLUE, null, null, '张华 · 麻省理工学院 数据科学 Round 1', '材料 4/6 · 客户：张国庆', 'DDL 2026-10-30', WB_GRAY, { l: '进入详情', href: '网申任务详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_BLUE, null, null, '李雪 · 卡内基梅隆大学 人工智能 Round 1', '材料 3/5 · 客户：李建国', 'DDL 2026-11-01', WB_GRAY, { l: '进入详情', href: '网申任务详情页 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-08-18': [wbEv('被催办', WB_RED, 'Stanford 网申准备任务被项目经理催办 · 已等待 18 小时')],
        '2026-10-17': [wbEv('网申DDL', WB_PURPLE, '赵婷 · 哥伦比亚大学 经济学 Round 1 截止（材料 3/5）')],
        '2026-10-30': [wbEv('网申DDL', WB_PURPLE, '张华 · 麻省理工学院 数据科学 Round 1 截止（材料 4/6）')],
        '2026-11-01': [wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 人工智能 Round 1 截止（材料 3/5）')],
        '2026-11-20': [wbEv('网申DDL', WB_PURPLE, '刘芳 · 哈佛大学 公共卫生 Round 1 截止（审核中）')],
        '2026-12-01': [wbEv('网申DDL', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1 截止（待接收）')],
        '2026-12-15': [wbEv('网申DDL', WB_PURPLE, '王明 · 斯坦福大学 计算机科学 Round 2 截止（已提交）')]
      },
      boards: [
        { title: '待接收', color: WB_PURPLE, items: [
          wbB('孙梓涵 · 哥伦比亚大学 金融工程 Round 1', '新推送', 'DDL 2026-12-01 · 系统推送')
        ]},
        { title: '待领取', color: WB_GRAY, items: [
          wbB('赵婷 · 哥伦比亚大学 经济学 Round 1', '待领取', '材料 3/5 · DDL 2026-10-17')
        ]},
        { title: '进行中', color: WB_BLUE, items: [
          wbB('张华 · 麻省理工学院 数据科学 Round 1', '进行中', '材料 4/6 · DDL 2026-10-30'),
          wbB('李雪 · 卡内基梅隆大学 人工智能 Round 1', '进行中', '材料 3/5 · DDL 2026-11-01')
        ]},
        { title: '审核中', color: WB_ORANGE, items: [
          wbB('刘芳 · 哈佛大学 公共卫生 Round 1', '审核中', '材料 5/5 · DDL 2026-11-20')
        ]},
        { title: '已提交', color: WB_GREEN, items: [
          wbB('王明 · 斯坦福大学 计算机科学 Round 2', '已提交', '材料 6/6 · DDL 2026-12-15')
        ]}
      ]
    },

    /* ---------- 6. 文书审核 ---------- */
    audit: {
      name: '文书审核', scope: '执行视角 · 审核队列', scopeBg: '#fff7ed', scopeC: '#c2410c',
      tagline: '按提交时间清零审核队列，被催办的最先审',
      stats: [
        { l: '审核中', v: '4', n: '最早 08-15 提交 · 赵婷 CV', t: 'tone-orange' },
        { l: '今日新增', v: '1', n: '刘芳 哈佛 PS · 08:40 提交', t: 'tone-blue' },
        { l: '被催办', v: '1', n: 'CMU 个人陈述终稿 · 等待 1 天 6 小时', t: 'tone-red' },
        { l: '已完成', v: '2', n: '张华 RL · 陈磊 RP', t: '' }
      ],
      cards: [
        { m: '文书审核列表', c: '队列 6 份 · 审核中 4 份', color: WB_ORANGE, href: '文书审核列表页 - 留学申请管理系统.html' }
      ],
      todoCount: 6,
      todoGroups: [
        { title: '优先审核', color: WB_RED, items: [
          wbT(WB_RED, '被催办', WB_RED, '审核 CMU 个人陈述终稿（李雪）', '项目经理催办 · 8月13日 04:30 分配至今未接收 · 文书审核', '已等待 1 天 6 小时', WB_RED, { l: '立即审核', href: '文书审核详情页 - 留学申请管理系统.html' }),
          wbT(WB_ORANGE, '今日提交', WB_ORANGE, '刘芳 · 哈佛大学 公共卫生 PS', '提交人：陈文书 · 审核人员：李审核', '今天 08:40 提交', WB_ORANGE, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html' }),
          wbT(WB_AMBER, '积压最久', WB_AMBER, '赵婷 · 哥伦比亚大学 CV', '提交人：周文书 · 审核人员：王审核', '08-15 11:05 提交', WB_AMBER, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html' })
        ]},
        { title: '审核队列', color: WB_ORANGE, items: [
          wbT(WB_ORANGE, null, null, '李雪 · 卡内基梅隆大学 PS', '提交人：陈文书 · 审核人员：王审核', '08-17 10:30 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '王明 · 斯坦福大学 CV', '提交人：周文书 · 审核人员：王审核', '08-16 14:20 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_PURPLE, '待接收', WB_PURPLE, '《哥伦比亚大学-经济学-个人陈述》', '提交人：王雨桐 · 文书交付团队新提交审核', '待接收', WB_GRAY, { l: '接收', toast: '已接收审核任务《哥伦比亚大学-经济学-个人陈述》，已加入文书审核列表' })
        ]}
      ],
      events: {
        '2026-08-10': [wbEv('提交审核', WB_ORANGE, '陈磊 · 剑桥大学 RP 16:00 提交（已完成）')],
        '2026-08-12': [wbEv('提交审核', WB_ORANGE, '张华 · 麻省理工学院 RL 09:15 提交（已完成）')],
        '2026-08-15': [wbEv('提交审核', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV 11:05 提交（审核中 · 积压最久）')],
        '2026-08-16': [wbEv('提交审核', WB_ORANGE, '王明 · 斯坦福大学 CV 14:20 提交（审核中）')],
        '2026-08-17': [wbEv('提交审核', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS 10:30 提交（审核中）')],
        '2026-08-18': [wbEv('提交审核', WB_ORANGE, '刘芳 · 哈佛大学 PS 08:40 提交（审核中）'), wbEv('被催办', WB_RED, 'CMU 个人陈述终稿审核被催办 · 已等待 1 天 6 小时')]
      },
      boards: [
        { title: '审核中', color: WB_ORANGE, items: [
          wbB('刘芳 · 哈佛大学 PS', '审核中', '今天 08:40 提交 · 李审核 · 提交人：陈文书'),
          wbB('李雪 · 卡内基梅隆大学 PS', '审核中', '08-17 10:30 提交 · 王审核 · 提交人：陈文书'),
          wbB('王明 · 斯坦福大学 CV', '审核中', '08-16 14:20 提交 · 王审核 · 提交人：周文书'),
          wbB('赵婷 · 哥伦比亚大学 CV', '审核中', '08-15 11:05 提交 · 王审核 · 提交人：周文书')
        ]},
        { title: '已完成', color: WB_GREEN, items: [
          wbB('张华 · 麻省理工学院 RL', '已完成', '08-12 09:15 提交 · 李审核 · 提交人：吴文书'),
          wbB('陈磊 · 剑桥大学 RP', '已完成', '08-10 16:00 提交 · 王审核 · 提交人：郑文书')
        ]}
      ]
    }
  };

  /* ================= 渲染逻辑 ================= */
  var WB_CAL = {};

  function wbPad(n) { return (n < 10 ? '0' : '') + n; }

  function wbDateLabel(key) {
    var p = key.split('-');
    var label = p[0] + ' 年 ' + Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日';
    if (key === WB_TODAY) label += '（今天）';
    return label;
  }

  function wbActBtn(a) {
    if (!a) return '';
    var cls = 'wb-act' + (a.cls ? ' ' + a.cls : '');
    if (a.urge) return '<button type="button" class="' + cls + '" onclick="openUrgeModal(\'' + a.urge[0] + '\',\'' + a.urge[1] + '\',\'' + a.urge[2] + '\')">' + a.l + '</button>';
    if (a.href) return '<button type="button" class="' + cls + '" onclick="location.href=\'' + a.href + '\')">' + a.l + '</button>';
    if (a.toast) return '<button type="button" class="' + cls + '" onclick="workbenchToast(\'' + a.toast + '\')">' + a.l + '</button>';
    return '';
  }

  function wbTodoRow(it) {
    return '<div class="wb-todo">'
      + '<span class="wb-todo-bar" style="background:' + it.bar + '"></span>'
      + '<div class="wb-todo-b">'
      + '<div class="wb-todo-t">' + (it.tag ? '<span class="wb-tag" style="background:' + it.tagColor + '">' + it.tag + '</span>' : '') + it.title + '</div>'
      + '<div class="wb-todo-m">' + it.meta + '</div>'
      + (it.time ? '<div class="wb-todo-time" style="color:' + (it.timeColor || WB_GRAY) + '">' + it.time + '</div>' : '')
      + '</div>'
      + wbActBtn(it.act)
      + '</div>';
  }

  function wbBoardCol(b) {
    var h = '<div class="wb-board-col"><div class="wb-board-h"><span class="wb-board-t"><span class="wb-board-dot" style="background:' + b.color + '"></span>' + b.title + '</span><span class="wb-board-c">' + b.items.length + ' 项</span></div>';
    for (var i = 0; i < b.items.length; i++) {
      var it = b.items[i];
      var bg = WB_BADGE[it.bdg] || ['#f3f4f6', '#374151'];
      h += '<div class="wb-bitem"><div style="min-width:0"><div class="nm">' + it.nm + '</div>'
        + (it.mt ? '<div class="mt">' + it.mt + '</div>' : '')
        + (it.prog != null ? '<div class="wb-prog"><span style="width:' + it.prog + '%;background:' + (it.progC || WB_BLUE) + '"></span></div>' : '')
        + '</div>'
        + (it.bdg ? '<span class="wb-bdg" style="background:' + bg[0] + ';color:' + bg[1] + '">' + it.bdg + '</span>' : '')
        + '</div>';
    }
    return h + '</div>';
  }

  function wbRenderCal(role) {
    var st = WB_CAL[role], ev = WB_ROLES[role].events || {};
    var off = (new Date(st.y, st.m - 1, 1).getDay() + 6) % 7;
    var dim = new Date(st.y, st.m, 0).getDate();
    var prevDim = new Date(st.y, st.m - 1, 0).getDate();
    var h = '<div class="wb-cal-h"><span class="wb-cal-t">' + st.y + ' 年 ' + st.m + ' 月</span>'
      + '<span class="wb-cal-nav"><button type="button" onclick="wbCalShift(\'' + role + '\',-1)" aria-label="上一月">‹</button><button type="button" onclick="wbCalShift(\'' + role + '\',1)" aria-label="下一月">›</button></span></div>';
    h += '<div class="wb-cal-grid">';
    var weeks = ['一', '二', '三', '四', '五', '六', '日'];
    for (var i = 0; i < 7; i++) h += '<div class="wb-cal-w">' + weeks[i] + '</div>';
    for (var p = off - 1; p >= 0; p--) h += '<div class="wb-day out">' + (prevDim - p) + '</div>';
    for (var d = 1; d <= dim; d++) {
      var key = st.y + '-' + wbPad(st.m) + '-' + wbPad(d);
      var cls = 'wb-day';
      if (ev[key]) cls += ' has';
      if (key === WB_TODAY) cls += ' today';
      if (key === st.sel) cls += ' sel';
      h += '<div class="' + cls + '" onclick="wbCalSelect(\'' + role + '\',\'' + key + '\')">' + d + '</div>';
    }
    var tail = (7 - (off + dim) % 7) % 7;
    for (var t = 1; t <= tail; t++) h += '<div class="wb-day out">' + t + '</div>';
    h += '</div>';
    var list = ev[st.sel] || [];
    h += '<div class="wb-daydetail"><div class="wb-dd">' + wbDateLabel(st.sel) + ' · ' + (list.length ? list.length + ' 项 DDL/事件' : '无 DDL/事件') + '</div>';
    if (list.length) {
      for (var k = 0; k < list.length; k++) {
        h += '<div class="wb-ev"><span class="tg" style="background:' + list[k].c + '">' + list[k].tg + '</span><span class="tx">' + list[k].tx + '</span></div>';
      }
    } else {
      h += '<div class="wb-ev-empty">这一天没有到期的 DDL · 点击红色日期可查看当日明细</div>';
    }
    h += '</div>';
    var calEl = document.getElementById('wbCal-' + role);
    if (calEl) calEl.innerHTML = h;
  }

  function wbCalShift(role, d) {
    var st = WB_CAL[role];
    if (!st) return;
    st.m += d;
    if (st.m < 1) { st.m = 12; st.y--; }
    if (st.m > 12) { st.m = 1; st.y++; }
    wbRenderCal(role);
  }

  function wbCalSelect(role, date) {
    if (!WB_CAL[role]) return;
    WB_CAL[role].sel = date;
    wbRenderCal(role);
  }

  function wbRenderRole(role, host) {
    var R = WB_ROLES[role];
    if (!R) return;
    var h = '<div class="wb-head"><div><div class="wb-title">' + R.name + '工作台<span class="wb-scope" style="background:' + R.scopeBg + ';color:' + R.scopeC + '">' + R.scope + '</span></div><p class="wb-sub">' + R.tagline + ' · ' + WB_TODAY_LABEL + '</p></div></div>';
    h += '<div class="wb-stats">';
    for (var i = 0; i < R.stats.length; i++) {
      var s = R.stats[i];
      h += '<div class="wb-stat ' + (s.t || '') + '"><div class="l">' + s.l + '</div><div class="v">' + s.v + '</div><div class="n">' + s.n + '</div></div>';
    }
    h += '</div>';
    h += '<div class="wb-cards">';
    for (var c = 0; c < R.cards.length; c++) {
      var cd = R.cards[c];
      h += '<a class="wb-card" style="border-left-color:' + cd.color + '" href="' + cd.href + '"><div class="m">' + cd.m + '</div><div class="c">' + cd.c + '</div><div class="go" style="color:' + cd.color + '">进入模块 →</div></a>';
    }
    h += '</div>';
    h += '<div class="wb-main"><section class="wb-panel"><div class="wb-panel-h"><span class="wb-panel-t">今日待办</span><span class="wb-panel-n">共 ' + R.todoCount + ' 项 · 按优先级分组</span></div>';
    for (var g = 0; g < R.todoGroups.length; g++) {
      var gr = R.todoGroups[g];
      h += '<div class="wb-group-t"><span class="wb-group-dot" style="background:' + gr.color + '"></span>' + gr.title + '<span class="wb-panel-n">' + gr.items.length + ' 项</span></div>';
      for (var j = 0; j < gr.items.length; j++) h += wbTodoRow(gr.items[j]);
    }
    h += '</section><aside class="wb-panel"><div class="wb-panel-h"><span class="wb-panel-t">DDL 日历</span><span class="wb-panel-n">红色日期 = 有 DDL/事件 · 点击查看</span></div><div id="wbCal-' + role + '"></div></aside></div>';
    h += '<div class="wb-panel-h" style="margin:2px 0 12px"><span class="wb-panel-t">数据看板</span><span class="wb-panel-n">与今日待办、日历数据一致 · 来自系统各模块列表</span></div>';
    h += '<div class="wb-boards" style="grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">';
    for (var b = 0; b < R.boards.length; b++) h += wbBoardCol(R.boards[b]);
    h += '</div>';
    host.innerHTML = h;
  }

  /* ---------- 通用轻提示 ---------- */
  function workbenchToast(message) {
    var old = document.getElementById('wbToast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'wbToast';
    toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:120;padding:10px 16px;border-radius:10px;background:#242136;color:#fff;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.18)';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 2200);
  }

  /* ---------- 催办弹窗（共享注入；页面已有 #urgeModal 则复用） ---------- */
  var urgeContext = { task: '', target: '', role: '' };
  function ensureUrgeModal() {
    var modal = document.getElementById('urgeModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'urgeModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:70;align-items:center;justify-content:center;padding:24px;background:rgba(17,24,39,.45)';
    modal.innerHTML =
      '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">' +
      '<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">' +
      '<h3 class="text-base font-semibold text-gray-900">发起催办</h3>' +
      '<button type="button" class="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 text-xl leading-none" onclick="closeUrgeModal()" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="p-6 space-y-4">' +
      '<div class="bg-purple-50 rounded-xl p-4">' +
      '<p class="text-xs text-purple-500 mb-1">催办任务</p>' +
      '<p id="urgeTaskName" class="text-sm font-semibold text-gray-900">—</p>' +
      '<p class="text-xs text-gray-500 mt-1">催办对象：<span id="urgeTarget" class="font-medium text-gray-700">—</span></p>' +
      '</div>' +
      '<div>' +
      '<label class="block text-sm text-gray-600 mb-2">催办说明 <span class="text-xs text-gray-400">（将随催办消息一同发送给对方）</span></label>' +
      '<textarea id="urgeNote" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none">请优先处理该任务，完成后请及时反馈进度。</textarea>' +
      '</div>' +
      '<p class="text-xs text-gray-400 flex items-start gap-1.5"><span>💡</span>发送后，对方将在「消息提醒」中收到本条催办，消息中包含任务信息与催办说明；同一任务 1 小时内不可重复催办。</p>' +
      '</div>' +
      '<div class="flex gap-3 px-6 py-4 border-t border-gray-100">' +
      '<button type="button" class="flex-1 h-10 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm" onclick="closeUrgeModal()">取消</button>' +
      '<button type="button" class="flex-1 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium" onclick="sendUrge()">发送催办</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }
  function openUrgeModal(task, target, role) {
    urgeContext = { task: task, target: target, role: role };
    var modal = ensureUrgeModal();
    document.getElementById('urgeTaskName').textContent = task;
    document.getElementById('urgeTarget').textContent = target + '（' + role + '）';
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
  function closeUrgeModal() {
    var modal = document.getElementById('urgeModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  function sendUrge() {
    closeUrgeModal();
    workbenchToast('催办消息已发送给 ' + urgeContext.target + '，对方将在消息提醒中看到催办内容');
  }

  /* ================= 角色 ↔ 工作台视角映射 ================= */
  var WB_KEY_ORDER = ['wsadmin', 'pm', 'writer', 'sales', 'apply', 'audit'];
  var WB_ROLE_KEY = {
    '文书机构管理员': 'wsadmin',
    '项目经理': 'pm',
    '文书人员': 'writer',
    '销售人员管理员': 'sales',
    '销售人员': 'sales',
    '网申人员': 'apply',
    '文书审核': 'audit'
  };
  var WB_KEY_LABEL = {
    wsadmin: '文书机构管理员', pm: '项目经理', writer: '文书人员',
    sales: '销售人员', apply: '网申人员', audit: '文书审核'
  };

  /* ---------- 多角色 tab 切换 ---------- */
  function pbsWbSwitch(role) {
    var mount = document.getElementById('pbs-workbench-mount');
    if (!mount) return;
    mount.querySelectorAll('.role-panel').forEach(function (panel) { panel.classList.add('hidden'); });
    var target = document.getElementById('panel-' + role);
    if (target) target.classList.remove('hidden');
    mount.querySelectorAll('.role-tab').forEach(function (tab) {
      var active = tab.getAttribute('data-role') === role;
      tab.classList.toggle('bg-blue-600', active);
      tab.classList.toggle('text-white', active);
      tab.classList.toggle('text-gray-600', !active);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ================= 挂载入口 =================
     host: 容器元素；keys: 当前用户可见的工作台视角（按 WB_KEY_ORDER 排序）；
     单角色（keys 长度为 1）不渲染 tab 条，只渲染本人工作台。 */
  function mountWorkbench(host, keys, opts) {
    ensureStyle();
    opts = opts || {};
    var active = opts.active && keys.indexOf(opts.active) >= 0 ? opts.active : keys[0];
    var html = '';
    if (keys.length > 1) {
      html += '<div class="mb-1 flex items-center gap-1.5 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit flex-wrap" id="roleTabs">';
      keys.forEach(function (key) {
        var on = key === active;
        html += '<button type="button" data-role="' + key + '" class="role-tab px-4 py-2 text-sm font-medium rounded-lg transition-colors '
          + (on ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100')
          + '" onclick="pbsWbSwitch(\'' + key + '\')">' + WB_KEY_LABEL[key] + '</button>';
      });
      html += '</div>';
      html += '<p class="text-xs text-gray-400 mb-6">你拥有 ' + keys.length + ' 个角色视角，点击切换查看对应工作台；单角色账号仅显示本人工作台。管理者（机构管理员/项目经理/文书机构管理员）可发起催办；右侧日历中红色日期为有 DDL/事件的日子，点击查看当日明细。</p>';
    }
    keys.forEach(function (key) {
      html += '<div id="panel-' + key + '" class="role-panel' + (key === active ? '' : ' hidden') + '" data-role="' + key + '"></div>';
    });
    host.innerHTML = html;
    keys.forEach(function (key) {
      var panel = document.getElementById('panel-' + key);
      if (!WB_CAL[key]) WB_CAL[key] = { y: 2026, m: 8, sel: WB_TODAY };
      wbRenderRole(key, panel);
      wbRenderCal(key);
    });
    ensureUrgeModal();
  }

  /* ---------------- 全局导出（生成内容的 onclick 依赖以下全局函数） ---------------- */
  window.pbsWbSwitch = pbsWbSwitch;
  window.wbCalShift = wbCalShift;
  window.wbCalSelect = wbCalSelect;
  window.openUrgeModal = openUrgeModal;
  window.closeUrgeModal = closeUrgeModal;
  window.sendUrge = sendUrge;
  window.workbenchToast = workbenchToast;
  window.pbsWorkbench = {
    KEY_ORDER: WB_KEY_ORDER,
    ROLE_KEY: WB_ROLE_KEY,
    KEY_LABEL: WB_KEY_LABEL,
    mount: mountWorkbench
  };
})();
