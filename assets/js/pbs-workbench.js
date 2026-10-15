/* ============================================================
   PBS留学CRM系统 - 角色工作台共享模块
   角色工作台（核心指标 × 优先待办 × 关键日程 × 数据看板）
   Navbar 负责角色切换，共享模块只渲染当前角色工作台：
   - 项目经理       → 项目经理工作台 - 留学申请管理系统.html
   - 文书人员       → 任务列表页 - 文书交付系统.html#workbench
   - 销售人员管理员 → 选校任务列表页 - 留学申请管理系统.html#workbench
   - 销售人员       → 选校任务列表页 - 留学申请管理系统.html#workbench
   - 网申人员       → 网申任务列表页 - 留学申请管理系统.html#workbench
   - 文书审核       → 文书审核列表页 - 留学申请管理系统.html#workbench
   - 文书机构管理员 → 任务列表页 - 文书交付系统.html#workbench
   - 平台运维人员   → 平台运维工作台 - PBS留学CRM系统.html
   - 机构管理员     → 机构管理员工作台 - 留学申请管理系统.html
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 工作台视觉：大卡片、低信息密度、单角色视角 ---------------- */
  var WB_CSS = ''
    + '.wb-shell{width:100%;max-width:1680px;margin:0 auto}'
    + '.wb-head{min-height:116px;display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 18px;padding:24px 28px;border-radius:20px;background:linear-gradient(135deg,#26384c 0%,#536f88 100%);box-shadow:0 14px 34px rgba(38,56,76,.16)}'
    + '.wb-title{font-size:25px;line-height:1.2;font-weight:700;color:#fff}'
    + '.wb-sub{font-size:13px;color:rgba(255,255,255,.72);margin-top:8px}'
    + '.wb-date{font-size:13px;color:#fff;padding:9px 13px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.1);white-space:nowrap}'
    + '.wb-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:18px}'
    + '.wb-stat-wrap{display:block;min-width:0;color:inherit;text-decoration:none}'
    + '.wb-stat{position:relative;min-height:150px;padding:22px;background:#fff;border:1px solid #e8edf1;border-radius:20px;box-shadow:0 8px 24px rgba(30,41,59,.055);overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s}'
    + '.wb-stat-link:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(30,41,59,.10);border-color:#cddae4}'
    + '.wb-stat .l{font-size:13px;color:#64748b;font-weight:600}'
    + '.wb-stat .v{font-size:38px;font-weight:750;color:#172033;margin-top:16px;line-height:1}'
    + '.wb-stat .n{font-size:12px;color:#94a3b8;margin-top:12px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.wb-stat-go{position:absolute;right:18px;top:16px;width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#f2f5f7;color:#6b829a;font-size:16px}'
    + '.wb-main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}'
    + '.wb-panel{box-sizing:border-box;height:560px;min-width:0;overflow:hidden;background:#fff;border:1px solid #e8edf1;border-radius:20px;padding:22px;box-shadow:0 8px 24px rgba(30,41,59,.055)}'
    + '.wb-todo-panel,.wb-calendar-panel{display:flex;flex-direction:column}'
    + '.wb-panel-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}'
    + '.wb-panel-t{font-size:17px;font-weight:700;color:#172033}'
    + '.wb-panel-n{font-size:12px;color:#94a3b8}'
    + '.wb-priority{box-sizing:border-box;display:flex;align-items:center;gap:13px;height:76px;min-height:76px;padding:14px 15px;margin-bottom:10px;border-radius:15px;background:#f8fafc;border:1px solid transparent;transition:border-color .15s,background .15s}'
    + '.wb-priority:last-child{margin-bottom:0}.wb-priority:hover{border-color:#dbe5ec;background:#fff}'
    + '.wb-priority-dot{width:9px;height:9px;border-radius:999px;flex-shrink:0}'
    + '.wb-priority-b{flex:1;min-width:0}.wb-priority-t{font-size:14px;font-weight:650;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wb-priority-window{display:block;font-size:11px;font-weight:650;color:#64748b;margin-bottom:3px}'
    + '.wb-priority-m{font-size:12px;color:#94a3b8;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.wb-act{flex-shrink:0;font-size:12px;font-weight:600;padding:7px 12px;border-radius:9px;border:none;cursor:pointer;background:#6b829a;color:#fff}'
    + '.wb-act:hover{background:#556b7d}.wb-act.ghost{background:#edf2f5;color:#5f7488}.wb-act.plain{background:#f1f3f5;color:#475569}'
    + '.wb-calendar{display:flex;flex:1;min-height:0;flex-direction:column}.wb-cal-h{display:flex;flex-shrink:0;align-items:center;justify-content:space-between;margin-bottom:12px}.wb-cal-t{font-size:14px;font-weight:650;color:#334155}.wb-cal-nav{display:flex;gap:7px}'
    + '.wb-cal-nav button{width:30px;height:30px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:16px;line-height:1}.wb-cal-nav button:hover{background:#f8fafc}'
    + '.wb-cal-grid{display:grid;flex-shrink:0;grid-template-columns:repeat(7,1fr);grid-template-rows:20px repeat(6,38px);gap:5px}.wb-cal-w{font-size:11px;color:#a1aab7;text-align:center;padding:2px 0}'
    + '.wb-day{position:relative;height:38px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;line-height:1.05;color:#475569;cursor:pointer;border:1px solid transparent;background:#fff;user-select:none}.wb-day small{font-size:9px;font-weight:500;color:#a75f59;margin-top:3px}.wb-day.sel small{color:#fff}.wb-day:hover{background:#f1f5f9}'
    + '.wb-day.out{color:#d6dbe2;cursor:default;background:transparent}.wb-day.has{font-weight:700;color:#a75f59;background:#f7ecea}.wb-day.has::after{content:"";position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:999px;background:#b36b64}'
    + '.wb-day.today{border-color:#7890a6;color:#60798e;font-weight:700}.wb-day.sel{background:#6b829a;color:#fff;font-weight:700}.wb-day.sel.has{background:#b36b64;color:#fff}.wb-day.sel::after{background:#fff}'
    + '.wb-daydetail{flex:1;min-height:0;margin-top:14px;border-top:1px solid #edf1f4;padding-top:13px;overflow-y:auto;scrollbar-gutter:stable}.wb-dd{font-size:12px;font-weight:650;color:#475569;margin-bottom:8px}'
    + '.wb-ev{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#f8fafc;margin-bottom:6px}.wb-ev-dot{width:7px;height:7px;border-radius:999px;flex-shrink:0;margin-top:6px}.wb-ev .tx{font-size:12px;color:#475569;line-height:1.55}.wb-ev .tx strong{color:#334155;font-weight:650}.wb-ev-empty{font-size:12px;color:#9aa4b2;padding:11px;text-align:center;background:#f8fafc;border-radius:10px}'
    + '.wb-board-section{margin-top:18px}.wb-board-section-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.wb-board-section-t{font-size:17px;font-weight:700;color:#172033}.wb-board-section-n{font-size:12px;color:#94a3b8}'
    + '.wb-boards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.wb-board-link{display:block;min-width:0;color:inherit;text-decoration:none}'
    + '.wb-board-col{box-sizing:border-box;display:flex;height:330px;flex-direction:column;min-width:0;padding:18px;background:#fff;border:1px solid #e8edf1;border-radius:18px;box-shadow:0 8px 24px rgba(30,41,59,.045);transition:transform .18s,box-shadow .18s,border-color .18s}.wb-board-link:hover .wb-board-col{transform:translateY(-2px);border-color:#cddae4;box-shadow:0 14px 30px rgba(30,41,59,.09)}'
    + '.wb-board-h{display:flex;flex-shrink:0;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.wb-board-t{display:flex;align-items:center;gap:8px;min-width:0;font-size:14px;font-weight:700;color:#1f2937}.wb-board-dot{width:8px;height:8px;border-radius:999px;flex-shrink:0}.wb-board-c{font-size:12px;color:#94a3b8;white-space:nowrap}'
    + '.wb-board-list{flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable;padding-right:3px}.wb-bitem{box-sizing:border-box;display:flex;min-height:58px;align-items:flex-start;justify-content:space-between;gap:10px;padding:10px 11px;border-radius:11px;background:#f8fafc;margin-bottom:7px}.wb-bitem:last-child{margin-bottom:0}.wb-bitem-body{min-width:0}.wb-bitem .nm{font-size:13px;color:#1f2937;font-weight:600;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wb-bitem .mt{font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wb-bdg{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;flex-shrink:0;white-space:nowrap}.wb-prog{height:5px;border-radius:999px;background:#e9eef2;overflow:hidden;margin-top:7px}.wb-prog span{display:block;height:100%;border-radius:999px}.wb-board-go{flex-shrink:0;margin-top:11px;padding-top:11px;border-top:1px solid #edf1f4;text-align:right;font-size:12px;font-weight:650;color:#60798e}'
    + '.wb-team-section{margin-top:18px}.wb-team-shell{padding:22px;background:#fff;border:1px solid #e8edf1;border-radius:20px;box-shadow:0 8px 24px rgba(30,41,59,.045)}.wb-team-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.wb-team-title{font-size:17px;font-weight:700;color:#172033}.wb-team-note{font-size:12px;color:#94a3b8}'
    + '.wb-team-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:16px}.wb-team-kpi{padding:17px 18px;border-radius:15px;background:#f8fafc}.wb-team-kpi .label{font-size:12px;font-weight:600;color:#64748b}.wb-team-kpi .value{font-size:27px;font-weight:750;color:#172033;margin-top:8px;line-height:1}.wb-team-kpi .hint{font-size:11px;color:#94a3b8;margin-top:8px}'
    + '.wb-team-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr);gap:16px}.wb-team-panel{min-width:0;padding:17px;border-radius:16px;background:#f8fafc}.wb-team-panel-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.wb-team-panel-t{font-size:14px;font-weight:700;color:#334155}.wb-team-panel-n{font-size:11px;color:#94a3b8}'
    + '.wb-pm-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.wb-pm-row{box-sizing:border-box;display:flex;width:100%;min-width:0;align-items:center;gap:10px;padding:11px;border:1px solid #e8edf1;border-radius:12px;background:#fff;text-align:left;cursor:pointer}.wb-pm-row:hover{border-color:#cddae4;box-shadow:0 5px 14px rgba(30,41,59,.06)}.wb-pm-avatar,.wb-student-avatar{display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:999px;background:#e8edf1;color:#556b7d;font-weight:700}.wb-pm-avatar{width:34px;height:34px;font-size:13px}.wb-pm-info{min-width:0;flex:1}.wb-pm-name{font-size:13px;font-weight:700;color:#1f2937}.wb-pm-skill{font-size:11px;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wb-pm-count{text-align:right;white-space:nowrap}.wb-pm-count strong{font-size:18px;color:#172033}.wb-pm-count span{display:block;font-size:10px;color:#94a3b8;margin-top:2px}'
    + '.wb-skill-chart{position:relative;height:224px;display:flex;align-items:flex-end;justify-content:space-around;gap:20px;padding:24px 14px 0 36px;border-bottom:1px solid #dfe6ec;background:repeating-linear-gradient(to top,transparent 0,transparent 43px,#e7edf2 44px)}.wb-chart-axis{position:absolute;left:8px;top:24px;bottom:25px;display:flex;flex-direction:column;justify-content:space-between;font-size:10px;color:#94a3b8}.wb-chart-item{display:flex;height:100%;flex:1;max-width:88px;flex-direction:column;align-items:center;justify-content:flex-end}.wb-chart-value{font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}.wb-chart-bar{width:42px;min-height:8px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,#7890a6,#536f88)}.wb-chart-label{font-size:12px;color:#64748b;margin-top:9px;white-space:nowrap}.wb-chart-caption{font-size:11px;color:#94a3b8;text-align:center;margin-top:12px}'
    + '.wb-pm-modal{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.46)}.wb-pm-modal.is-open{display:flex}.wb-pm-dialog{display:flex;width:min(920px,100%);max-height:86vh;flex-direction:column;overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.24)}.wb-pm-modal-h{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid #edf1f4}.wb-pm-modal-t{font-size:17px;font-weight:700;color:#172033}.wb-pm-close{width:34px;height:34px;border:0;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:21px;cursor:pointer}.wb-pm-modal-b{overflow-y:auto;padding:20px 22px;scrollbar-gutter:stable}.wb-student-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.wb-student-card{padding:15px;border:1px solid #e8edf1;border-radius:15px;background:#fff}.wb-student-h{display:flex;align-items:center;gap:10px;margin-bottom:12px}.wb-student-avatar{width:32px;height:32px;font-size:12px}.wb-student-name{font-size:14px;font-weight:700;color:#1f2937}.wb-target{padding:10px 11px;border-radius:11px;background:#f8fafc;margin-bottom:8px}.wb-target:last-child{margin-bottom:0}.wb-target-name{font-size:12px;font-weight:650;color:#334155;line-height:1.5}.wb-target-package{font-size:11px;color:#7b8796;line-height:1.55;margin-top:4px}'
    + '@media(max-width:1180px){.wb-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.wb-main{grid-template-columns:1fr}.wb-boards{grid-template-columns:repeat(2,minmax(0,1fr))}.wb-team-grid{grid-template-columns:1fr}}'
    + '@media(max-width:640px){.wb-head{align-items:flex-start;flex-direction:column;padding:20px}.wb-date{padding:0;border:0;background:transparent;color:rgba(255,255,255,.7)}.wb-stats{grid-template-columns:1fr}.wb-stat{min-height:132px}.wb-priority{height:88px;min-height:88px}.wb-act{margin-left:0}.wb-boards,.wb-team-kpis,.wb-pm-list,.wb-student-grid{grid-template-columns:1fr}.wb-board-col{height:310px}.wb-team-shell{padding:18px}.wb-pm-modal{padding:12px}.wb-pm-dialog{max-height:92vh}}';

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
  var WB_TODAY_LABEL = '演示数据基线 2026-08-18 · 周二';
  var WB_RED = '#b36b64', WB_ORANGE = '#c9a87c', WB_AMBER = '#bfa07a', WB_BLUE = '#6b829a',
      WB_PURPLE = '#7d869a', WB_GREEN = '#4f7a62', WB_CYAN = '#6a9299', WB_GRAY = '#6b7280';
  var WB_PACKAGE_PREMIUM = '尊享套餐：选校规划 + 文书 + 网申 + 面试辅导';
  var WB_PACKAGE_FULL = '全程套餐：文书 + 网申 + 面试辅导';
  var WB_PACKAGE_DOC_APP = '文书网申套餐：文书 + 网申';

  /* 状态徽标配色（与系统各列表页状态徽标一致） */
  var WB_BADGE = {
    '撰写中':['#e8edf1','#556b7d'], '需修改':['#f3ddd9','#9a5a54'], '审核中':['#f5ebda','#8c6f4e'],
    '已完成':['#eaf2ed','#3d5f4c'], '进行中':['#e8edf1','#556b7d'], '待领取':['#f3f4f6','#4b5563'],
    '已提交':['#eaf2ed','#3d5f4c'], '待接收':['#f2f5f7','#6b829a'], '未接收':['#f5ebda','#8c6f4e'],
    '咨询中':['#e8edf1','#556b7d'], '选校中':['#eaf2ed','#3d5f4c'], '待确认':['#f5ebda','#8c6f4e'],
    '已结单':['#f3f4f6','#4b5563'], '已退回':['#f3ddd9','#9a5a54'], '暂停':['#f5ebda','#8c6f4e'],
    '已结项':['#f3f4f6','#4b5563'], '已付':['#eaf2ed','#3d5f4c'], '待付':['#f5ebda','#8c6f4e'],
    '文书临期':['#f3ddd9','#9a5a54'], '材料缺失':['#f5ebda','#8c6f4e'], '正常':['#eaf2ed','#3d5f4c'],
    '逾期':['#f3ddd9','#9a5a54'], '新推送':['#f2f5f7','#6b829a'],
    '已有成员':['#eaf2ed','#3d5f4c'], '暂无成员':['#f3ddd9','#9a5a54'],
    '在职':['#eaf2ed','#3d5f4c'],
    '已解析':['#eaf2ed','#3d5f4c'], '解析中':['#f5ebda','#8c6f4e'], '未解析':['#f3f4f6','#4b5563'], '解析失败':['#f3ddd9','#9a5a54'], '已归档':['#f3f4f6','#4b5563'],
    '已启用':['#eaf2ed','#3d5f4c'], '待接入':['#f5ebda','#8c6f4e'], '已发布':['#eaf2ed','#3d5f4c'],
    '待复核':['#f5ebda','#8c6f4e'], '待处理':['#f3ddd9','#9a5a54'], '待结项':['#f5ebda','#8c6f4e']
  };

  /* ---------- 数据构造小工具 ---------- */
  function wbT(bar, tag, tagC, title, meta, time, timeC, act) {
    return { bar: bar, tag: tag, tagColor: tagC, title: title, meta: meta, time: time, timeColor: timeC, act: act };
  }
  function wbB(nm, bdg, mt, prog, progC) { return { nm: nm, bdg: bdg, mt: mt, prog: prog, progC: progC }; }
  function wbEv(tg, c, tx) { return { tg: tg, c: c, tx: tx }; }

  /* ================= 角色工作台数据 ================= */
  var WB_ROLES = {

    /* ---------- 1. 项目经理 ---------- */
    pm: {
      name: '项目经理', scope: '管理视角 · 我的项目', scopeBg: '#f2f5f7', scopeC: '#6b829a',
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
      name: '文书人员', scope: '执行视角 · 我的文书任务', scopeBg: '#e8edf1', scopeC: '#556b7d',
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
      todoCount: 4,
      todoGroups: [
        { title: '优先处理', color: WB_RED, items: [
          wbT(WB_RED, '需修改', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS', '审核打回 · 驳回理由：结构松散，需补充研究经历与职业规划关联', 'DDL 2026-11-20', WB_GRAY, { l: '去修改', href: '文书编辑器 - 文书交付系统.html' }),
          wbT(WB_PURPLE, '新任务', WB_PURPLE, '陈雨桐 · 加州大学伯克利分校 推荐信初稿', '项目经理分配 · 文书种类：推荐信 · 2026-08-18 04:30 分配', '接收后开始撰写', WB_GRAY, { l: '接收任务', href: '任务列表页 - 文书交付系统.html' })
        ]},
        { title: '近期跟进', color: WB_BLUE, items: [
          wbT(WB_BLUE, null, null, '李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中 · 客户：李建国', 'DDL 2026-11-01', WB_GRAY, { l: '继续撰写', href: '文书编辑器 - 文书交付系统.html', cls: 'plain' }),
          wbT(WB_BLUE, null, null, '王明 · 斯坦福大学 计算机科学 CV', '撰写中 · 客户：王建华', 'DDL 2026-12-15', WB_GRAY, { l: '继续撰写', href: '文书编辑器 - 文书交付系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-08-18': [wbEv('被催办', WB_RED, '李雪 · CMU 个人陈述（PS）终稿被项目经理催办 · 今天 18:00 前')],
        '2026-09-15': [wbEv('文书DDL', WB_GREEN, '陈磊 · 剑桥大学 金融学 RP（已完成）')],
        '2026-10-30': [wbEv('文书DDL', WB_ORANGE, '张华 · 麻省理工学院 数据科学 RL（审核中）')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS（撰写中）')],
        '2026-11-20': [wbEv('文书DDL', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS（需修改）')],
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
      name: '销售人员', scope: '执行视角 · 订单与方案', scopeBg: '#f5ebda', scopeC: '#8c6f4e',
      tagline: '待确认先跟、方案先交、咨询持续跟',
      stats: [
        { l: '最近3个月选校服务单', v: '12', n: '2026-06 至 2026-08 累计下单', t: '' },
        { l: '咨询中选校服务单', v: '4', n: '钱思睿 · 孙浩然 · 吴子墨 · 周雨薇', t: 'tone-blue' },
        { l: '待确认选校服务单', v: '1', n: '吴子墨 博士申请 · 待客户确认方案', t: 'tone-orange' }
      ],
      cards: [
        { m: '选校任务列表', c: '4 项咨询中 · 1 项待确认', color: WB_CYAN, href: '选校任务列表页 - 留学申请管理系统.html' },
        { m: '院校列表', c: '查看院校目标与清单', color: WB_GREEN, href: '院校目标详情页 - 留学申请管理系统.html' }
      ],
      todoCount: 6,
      todoGroups: [
        { title: '今天先处理', color: WB_RED, items: [
          wbT(WB_RED, '待确认', WB_RED, '吴子墨 · 博士申请 / 加拿大 / 数据科学', '选校服务单 · 2026-07-18 下单 · 负责人：孙鹏', '待客户确认选校方案', WB_RED, { l: '去跟进', href: '选校工作台页 - 留学申请管理系统.html' }),
          wbT(WB_ORANGE, '咨询中', WB_ORANGE, '周雨薇 · 硕士申请 / 美国 / 电子工程', '选校服务单 · 2026-07-17 下单 · 负责人：赵敏', '选校中 · 需提醒补充素材', WB_ORANGE, { l: '去跟进', href: '选校工作台页 - 留学申请管理系统.html' }),
          wbT(WB_BLUE, '咨询中', WB_BLUE, '钱思睿 · 本科申请 / 美国 / 计算机科学', '选校服务单 · 2026-07-15 下单 · 负责人：陈晨', '咨询中', WB_BLUE, { l: '去跟进', href: '选校工作台页 - 留学申请管理系统.html' }),
          wbT(WB_BLUE, '咨询中', WB_BLUE, '孙浩然 · 硕士申请 / 英国 / 金融', '选校服务单 · 2026-07-16 下单 · 负责人：刘洋', '咨询中', WB_BLUE, { l: '去跟进', href: '选校工作台页 - 留学申请管理系统.html' })
        ]},
        { title: '持续跟进', color: WB_GREEN, items: [
          wbT(WB_GREEN, null, null, '郑晓萌 · 本科申请 / 英国 / 金融', '选校任务列表 · 咨询中 · 负责人：周扬', '最近沟通 2026-08-15', WB_GRAY, { l: '去跟进', href: '选校任务列表页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_GREEN, null, null, '孙可欣 · 本科申请 / 美国 / 计算机科学', '选校任务列表 · 咨询中 · 负责人：陈晨', '选校咨询 2026-07-20 09:00', WB_GRAY, { l: '去跟进', href: '选校任务列表页 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-07-15': [wbEv('选校下单', WB_GREEN, '钱思睿 · 本科/美国/计算机科学 下单（咨询中 · 陈晨）')],
        '2026-07-16': [wbEv('选校下单', WB_GREEN, '孙浩然 · 硕士/英国/金融 下单（咨询中 · 刘洋）')],
        '2026-07-17': [wbEv('选校下单', WB_GREEN, '周雨薇 · 硕士/美国/电子工程 下单（选校中 · 赵敏）')],
        '2026-07-18': [wbEv('选校下单', WB_AMBER, '吴子墨 · 博士/加拿大/数据科学 下单（待确认 · 孙鹏）')],
        '2026-07-19': [wbEv('咨询', WB_CYAN, '郑晓萌 · 本科/英国/金融 选校咨询 14:20（周扬）')],
        '2026-07-20': [wbEv('咨询', WB_CYAN, '孙可欣 · 本科/美国/计算机科学 选校咨询 09:00（陈晨）')]
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
        ]}
      ]
    },

    /* ---------- 5. 网申人员 ---------- */
    apply: {
      name: '网申人员', scope: '执行视角 · 我的网申任务', scopeBg: '#f2f5f7', scopeC: '#6b829a',
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
      todoCount: 3,
      todoGroups: [
        { title: '优先处理', color: WB_RED, items: [
          wbT(WB_PURPLE, '新任务', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1', '系统推送新网申任务 · 学生：孙梓涵 · 硕士申请 · 2026-08-18 08:00 推送', 'DDL 2026-12-01', WB_GRAY, { l: '接收任务', href: '网申任务列表页 - 留学申请管理系统.html' })
        ]},
        { title: '进行中', color: WB_BLUE, items: [
          wbT(WB_BLUE, null, null, '张华 · 麻省理工学院 数据科学 Round 1', '材料完成度 4/6 · 学生：张华 · 硕士申请', 'DDL 2026-10-30', WB_GRAY, { l: '进入详情', href: '网申任务详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_BLUE, null, null, '李雪 · 卡内基梅隆大学 人工智能 Round 1', '材料完成度 3/5 · 学生：李雪 · 硕士申请', 'DDL 2026-11-01', WB_GRAY, { l: '进入详情', href: '网申任务详情页 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-08-18': [wbEv('被催办', WB_RED, 'Stanford 网申准备任务被项目经理催办 · 已等待 18 小时')],
        '2026-10-17': [wbEv('网申DDL', WB_ORANGE, '赵婷 · 哥伦比亚大学 经济学 Round 1 截止（材料 3/5 · 待领取）')],
        '2026-10-30': [wbEv('网申DDL', WB_BLUE, '张华 · 麻省理工学院 数据科学 Round 1 截止（材料 4/6 · 进行中）')],
        '2026-11-01': [wbEv('网申DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 Round 1 截止（材料 3/5 · 进行中）')],
        '2026-11-20': [wbEv('网申DDL', WB_ORANGE, '刘芳 · 哈佛大学 公共卫生 Round 1 截止（材料 5/5 · 审核中）')],
        '2026-12-01': [wbEv('网申DDL', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1 截止（材料 2/6 · 待接收）')],
        '2026-12-15': [wbEv('网申DDL', WB_GREEN, '王明 · 斯坦福大学 计算机科学 Round 2 截止（材料 6/6 · 已提交）')]
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
      name: '文书审核', scope: '执行视角 · 审核队列', scopeBg: '#f5ebda', scopeC: '#8c6f4e',
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
        { title: '优先处理', color: WB_RED, items: [
          wbT(WB_PURPLE, '新任务', WB_PURPLE, '《哥伦比亚大学-经济学-个人陈述》', '文书交付团队新提交审核 · 学生：王雨桐 · 分配时间：待接收', '待接收', WB_GRAY, { l: '接收任务', href: '文书审核列表页 - 留学申请管理系统.html' })
        ]},
        { title: '审核队列', color: WB_ORANGE, items: [
          wbT(WB_ORANGE, null, null, '刘芳 · 哈佛大学 公共卫生 PS', '提交人：陈文书 · 审核人员：李审核', '今天 08:40 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '李雪 · 卡内基梅隆大学 PS', '提交人：陈文书 · 审核人员：王审核', '08-17 10:30 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '王明 · 斯坦福大学 CV', '提交人：周文书 · 审核人员：王审核', '08-16 14:20 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_AMBER, '积压最久', WB_AMBER, '赵婷 · 哥伦比亚大学 CV', '提交人：周文书 · 审核人员：王审核', '08-15 11:05 提交', WB_AMBER, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_PURPLE, '待接收', WB_PURPLE, '《哥伦比亚大学-经济学-个人陈述》', '提交人：王雨桐 · 文书交付团队新提交审核', '待接收', WB_GRAY, { l: '接收', toast: '已接收审核任务《哥伦比亚大学-经济学-个人陈述》，已加入文书审核列表' })
        ]}
      ],
      events: {
        '2026-08-10': [wbEv('提交审核', WB_GREEN, '陈磊 · 剑桥大学 RP 16:00 提交（已完成 · DDL 2026-09-15）')],
        '2026-08-12': [wbEv('提交审核', WB_GREEN, '张华 · 麻省理工学院 RL 09:15 提交（已完成 · DDL 2026-10-30）')],
        '2026-08-15': [wbEv('提交审核', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV 11:05 提交（审核中 · 积压最久 · DDL 2026-10-17）')],
        '2026-08-16': [wbEv('提交审核', WB_ORANGE, '王明 · 斯坦福大学 CV 14:20 提交（审核中 · DDL 2026-12-15）')],
        '2026-08-17': [wbEv('提交审核', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS 10:30 提交（审核中 · DDL 2026-11-01）')],
        '2026-08-18': [wbEv('提交审核', WB_ORANGE, '刘芳 · 哈佛大学 PS 08:40 提交（审核中 · DDL 2026-11-20）'), wbEv('被催办', WB_RED, 'CMU 个人陈述终稿审核被催办 · 已等待 1 天 6 小时')],
        '2026-09-15': [wbEv('文书DDL', WB_GREEN, '陈磊 · 剑桥大学 RP（已完成）')],
        '2026-10-17': [wbEv('文书DDL', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV（审核中）')],
        '2026-10-30': [wbEv('文书DDL', WB_GREEN, '张华 · 麻省理工学院 RL（已完成）')],
        '2026-11-01': [wbEv('文书DDL', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS（审核中）')],
        '2026-11-20': [wbEv('文书DDL', WB_ORANGE, '刘芳 · 哈佛大学 PS（审核中）')],
        '2026-12-15': [wbEv('文书DDL', WB_ORANGE, '王明 · 斯坦福大学 CV（审核中）')]
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
    },

    /* ---------- 7. 平台运维人员 ---------- */
    platform: {
      name: '平台运维人员', scope: '平台视角 · 跨机构运营', scopeBg: '#eaf0f3', scopeC: '#5a7a85',
      tagline: '维护机构配置与内容资产',
      stats: [
        { l: '机构总数', v: '5', n: '3 家已有成员 · 2 家暂无成员', t: '' },
        { l: '角色配置', v: '10', n: '平台与机构角色权限', t: 'tone-orange' },
        { l: '文书模板', v: '6', n: '覆盖 3 家机构', t: 'tone-blue' },
        { l: '网申模板', v: '5', n: '覆盖 4 个国家/地区', t: 'tone-purple' }
      ],
      cards: [
        { m: '机构管理', c: '5 家机构 · 2 家暂无成员', color: WB_CYAN, href: '机构管理 - PBS留学CRM系统.html' },
        { m: '角色权限', c: '角色授权与权限校验', color: WB_GREEN, href: '角色权限管理 - 留学申请管理系统.html' },
        { m: '文书模板库', c: '6 个模板 · 覆盖 3 家机构', color: WB_BLUE, href: '模板库列表 - 文书交付系统.html' },
        { m: '文书案例库', c: '8 个案例 · 已解析 4 · 待处理 4', color: WB_ORANGE, href: '案例库 - 文书交付系统.html' },
        { m: '网申模板库', c: '5 个模板 · 覆盖 4 个国家/地区', color: WB_PURPLE, href: '网申模板库 - 留学申请管理系统.html' },
        { m: '结项归档', c: '6 条记录 · 3 条已结项', color: WB_AMBER, href: '结项归档列表 - PBS留学CRM系统.html' }
      ],
      todoCount: 6,
      todoGroups: [
        { title: '需要我处理', color: WB_RED, items: [
          wbT(WB_RED, '权限复核', WB_RED, '完成角色权限定期检查', '角色权限 · 平台配置', '本周完成', WB_RED, { l: '去处理', href: '角色权限管理 - 留学申请管理系统.html' }),
          wbT(WB_ORANGE, '解析失败', WB_ORANGE, '复核刘同学-电子工程-RP研究计划解析失败', '案例库 · 博士申请 · 斯坦福大学 · 解析失败', '上传时间 2026-07-29 11:05', WB_ORANGE, { l: '去复核', href: '案例库 - 文书交付系统.html' }),
          wbT(WB_AMBER, '模板复核', WB_AMBER, '复核剑桥大学/金融学网申模板字段差异', '网申模板库 · 北京知行教育 · v1.8 · 需项目经理复核', '更新时间 2026-07-28', WB_AMBER, { l: '去复核', href: '网申模板库 - 留学申请管理系统.html' })
        ]},
        { title: '机构运营 · 可跟进', color: WB_CYAN, items: [
          wbT(WB_CYAN, null, null, '广州远航教育暂无成员', '机构管理 · 创建时间 2026-02-12 16:40 · 成员数 0', '需引导机构入驻', WB_GRAY, { l: '去查看', href: '机构管理 - PBS留学CRM系统.html', cls: 'plain' }),
          wbT(WB_CYAN, null, null, '深圳新途教育暂无成员', '机构管理 · 创建时间 2026-06-25 11:05 · 成员数 0', '需引导机构入驻', WB_GRAY, { l: '去查看', href: '机构管理 - PBS留学CRM系统.html', cls: 'plain' })
        ]},
        { title: '系统审计', color: WB_GRAY, items: [
          wbT(WB_GRAY, '失败', WB_GRAY, '操作日志：删除无效学生档案 PRJ20260701005 失败', '操作日志审计 · 王五 · 北京总部 · 2026-07-17 10:05', '需排查失败原因', WB_GRAY, { l: '去查看', href: '操作日志审计 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-07-20': [wbEv('案例上传', WB_GREEN, '吴同学-计算机科学-CV 已归档上传')],
        '2026-07-25': [wbEv('网申模板', WB_PURPLE, '香港大学/数据科学 网申模板 v1.6 更新')],
        '2026-07-26': [wbEv('案例上传', WB_ORANGE, '周同学-机械工程-PS 上传（未解析）')],
        '2026-07-27': [wbEv('案例上传', WB_BLUE, '赵同学-市场营销-推荐信 上传（已解析）')],
        '2026-07-28': [wbEv('案例上传', WB_BLUE, '张同学-CS方向-PS终稿 / 李同学-AI方向-PS录取版 已解析'), wbEv('网申模板', WB_PURPLE, '剑桥大学/金融学 网申模板 v1.8 更新 · 需复核')],
        '2026-07-29': [wbEv('案例上传', WB_RED, '刘同学-电子工程-RP研究计划 解析失败')],
        '2026-07-30': [wbEv('案例上传', WB_ORANGE, '王同学-数据科学-PS 解析中 / 陈同学-金融方向-CV 未解析')],
        '2026-08-05': [wbEv('网申模板', WB_PURPLE, '斯坦福大学/计算机科学 网申模板 v2.4 更新')],
        '2026-08-08': [wbEv('网申模板', WB_PURPLE, '卡内基梅隆大学/计算机科学 网申模板 v3.2 更新')],
        '2026-08-12': [wbEv('系统审计', WB_GRAY, '平台运营人员更新 Kimi 厂商 API Key / 发布金标集 120 条')],
        '2026-08-18': [wbEv('机构配置', WB_RED, '完成 2 家待接入机构的基础配置')]
      },
      boards: [
        { title: '机构管理', color: WB_CYAN, items: [
          wbB('PBS留学总部', '已有成员', '2025-01-08 创建 · 成员 2 人'),
          wbB('上海启明留学', '已有成员', '2025-03-18 创建 · 成员 2 人'),
          wbB('北京知行教育', '已有成员', '2025-05-06 创建 · 成员 1 人'),
          wbB('广州远航教育', '暂无成员', '2026-02-12 创建 · 成员 0 人'),
          wbB('深圳新途教育', '暂无成员', '2026-06-25 创建 · 成员 0 人')
        ]},
        { title: '人员管理', color: WB_GREEN, items: [
          wbB('张明 · 机构管理员', '在职', 'PBS留学总部 · zhangming@pbs.com'),
          wbB('李雪 · 销售人员', '在职', '上海启明留学 · lixue@pbs.com'),
          wbB('角色权限配置', '待复核', '平台与机构角色权限'),
          wbB('陈晨 · 项目经理、网申人员', '在职', '北京知行教育 · chenchen@pbs.com'),
          wbB('刘洋 · 机构管理员', '在职', 'PBS留学总部 · liuyang@pbs.com')
        ]},
        { title: '文书模板库', color: WB_BLUE, items: [
          wbB('AI方向PS标准模板', 'PS', '硕士 · PBS留学总部'),
          wbB('学术CV标准模板', 'CV', '硕士 · PBS留学总部'),
          wbB('学术推荐信模板', 'RL', '博士 · 上海启明留学'),
          wbB('转专业PS框架', 'PS', '硕士 · 北京知行教育'),
          wbB('研究计划模板', 'RP', '博士 · 上海启明留学'),
          wbB('科研型PS模板', 'PS', '硕士 · PBS留学总部')
        ]},
        { title: '文书案例库', color: WB_ORANGE, items: [
          wbB('张同学-CS方向-PS终稿', '已解析', 'CS/人工智能 · 硕士 · 卡内基梅隆大学'),
          wbB('李同学-AI方向-PS录取版', '已解析', 'CS/人工智能 · 硕士 · 帝国理工学院'),
          wbB('王同学-数据科学-PS终稿', '解析中', '数据科学 · 硕士 · 麻省理工学院'),
          wbB('陈同学-金融方向-CV终版', '未解析', '商科/金融 · 硕士 · 伦敦政治经济学院'),
          wbB('刘同学-电子工程-RP研究计划', '解析失败', '电子工程 · 博士 · 斯坦福大学'),
          wbB('赵同学-市场营销-推荐信', '已解析', '商科/市场营销 · 硕士 · 西北大学'),
          wbB('周同学-机械工程-PS', '未解析', '机械工程 · 本科 · 密歇根大学安娜堡分校'),
          wbB('吴同学-计算机科学-CV', '已归档', 'CS/人工智能 · 本科 · 伊利诺伊大学香槟分校')
        ]},
        { title: '网申模板库', color: WB_PURPLE, items: [
          wbB('卡内基梅隆大学 / 计算机科学 / 美国', 'v3.2', '42 字段 · 6 材料 · 2026-08-08 更新'),
          wbB('斯坦福大学 / 计算机科学 / 美国', 'v2.4', '38 字段 · 7 材料 · 2026-08-05 更新'),
          wbB('哥伦比亚大学 / 金融工程 / 美国', 'v2.1', '35 字段 · 8 材料 · 2026-08-01 更新 · 需复核 GRE'),
          wbB('剑桥大学 / 金融学 / 英国', 'v1.8', '31 字段 · 7 材料 · 2026-07-28 更新 · 需复核'),
          wbB('香港大学 / 数据科学 / 中国香港', 'v1.6', '29 字段 · 6 材料 · 2026-07-25 更新')
        ]},
        { title: '结项归档', color: WB_AMBER, items: [
          wbB('赵敏 · 赵欣怡 · 本科申请', '待结项', 'PRJ20260701018'),
          wbB('李慧敏 · 李雪 · 硕士申请', '待结项', 'PRJ20260701002'),
          wbB('王建军 · 王伟 · 博士申请', '待结项', 'PRJ-M-2607-0003'),
          wbB('孙丽 · 孙浩然 · 硕士申请', '已结项', '2026-07-12 结项'),
          wbB('周杰 · 周子墨 · 本科申请', '已结项', '2026-06-28 结项'),
          wbB('吴芳 · 吴思远 · 博士申请', '已结项', '2026-07-05 结项')
        ]}
      ]
    },

    /* ---------- 8. 机构管理员 ---------- */
    orgadmin: {
      name: '机构管理员', scope: '管理视角 · 本机构', scopeBg: '#eceff3', scopeC: '#5a6278',
      tagline: '分配项目、盯团队进度与卡点，推进本机构交付',
      stats: [
        { l: '在管项目总数', v: '5', n: '1 待接收 · 1 进行中 · 1 暂停 · 1 已退回 · 1 已结项', t: '' },
        { l: '团队任务', v: '11', n: '文书 5 · 网申 6', t: 'tone-blue' },
        { l: '结项积压', v: '3', n: '本机构待结项 3 项', t: 'tone-orange' },
        { l: '咨询中选校订单数', v: '4', n: '1 笔待确认', t: 'tone-purple' }
      ],
      cards: [
        { m: 'PMO 项目池', c: '5 个项目 · 1 个待接收', color: WB_CYAN, href: '项目池列表页 - 留学申请管理系统.html' },
        { m: '文书交付', c: '5 项任务 · 1 项需修改', color: WB_BLUE, href: '任务列表页 - 文书交付系统.html' },
        { m: '网申管理', c: '6 项任务 · 1 项待领取', color: WB_PURPLE, href: '网申任务列表页 - 留学申请管理系统.html' },
        { m: '文书审核', c: '6 份审核 · 4 份审核中', color: WB_ORANGE, href: '文书审核列表页 - 留学申请管理系统.html' },
        { m: '选校工作台', c: '4 笔订单 · 1 笔待确认', color: WB_GREEN, href: '选校订单池页 - 留学申请管理系统.html' },
        { m: '人员管理', c: '5 位成员', color: WB_AMBER, href: '人员管理 - PBS留学CRM系统.html' },
        { m: '结项归档', c: '6 条记录 · 3 条待结项', color: WB_GRAY, href: '结项归档列表 - PBS留学CRM系统.html' }
      ],
      todoCount: 10,
      todoGroups: [
        { title: '需要我处理', color: WB_RED, items: [
          wbT(WB_RED, '待分配', WB_RED, '为张明的本科申请订单分配 PMO', '客户：张建国 · 学生：张明 · 本科申请 · PRJ-M-2607-0001', '进入项目池 2 小时', WB_RED, { l: '去分配', href: '项目详情页 - 留学申请管理系统.html' })
        ]},
        { title: '近期跟进', color: WB_AMBER, items: [
          wbT(WB_AMBER, null, null, '跟进斯坦福推荐信审核进度', '孙老师 · 文书审核 · 当前环节已停留 18 小时', '停留超时 18 小时', WB_AMBER, { l: '催办', urge: ['跟进斯坦福推荐信审核进度', '孙老师', '审核人员'], cls: 'ghost' })
        ]},
        { title: '团队卡点 · 可催办', color: WB_ORANGE, items: [
          wbT(WB_ORANGE, '待领取', WB_ORANGE, '赵婷 · 哥伦比亚大学 经济学 网申任务待领取', '网申任务列表 · 材料 3/5 · 负责人：孙网申', 'DDL 2026-10-17 · 最近网申 DDL', WB_ORANGE, { l: '催办', urge: ['赵婷 · 哥伦比亚大学经济学网申任务待领取', '孙网申', '网申人员'], cls: 'ghost' }),
          wbT(WB_RED, '需修改', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS 需修改', '文书交付 · 审核打回 · 负责人：陈文书 · DDL 2026-11-20', '需按审核意见修改', WB_RED, { l: '催办', urge: ['刘芳 · 哈佛大学公共卫生PS修改', '陈文书', '文书人员'], cls: 'ghost' }),
          wbT(WB_RED, '逾期', WB_RED, '审核 CMU 个人陈述终稿', '文书审核 · 李雪 · 卡内基梅隆大学 · 孙老师 · 2026-08-13 04:30 分配', '已等待 1 天 6 小时', WB_RED, { l: '催办', urge: ['审核 CMU 个人陈述终稿', '孙老师', '审核人员'], cls: 'ghost' })
        ]},
        { title: '结项队列', color: WB_GRAY, items: [
          wbT(WB_GRAY, '待结项', WB_GRAY, '赵欣怡 · 本科申请', '客户：赵敏 · PRJ20260701018', '待结项', WB_GRAY, { l: '去结项查看', href: '结项详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_GRAY, '待结项', WB_GRAY, '李雪 · 硕士申请', '客户：李慧敏 · PRJ20260701002', '待结项', WB_GRAY, { l: '去结项查看', href: '结项详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_GRAY, '待结项', WB_GRAY, '王伟 · 博士申请', '客户：王建军 · PRJ-M-2607-0003', '待结项', WB_GRAY, { l: '去结项查看', href: '结项详情页 - 留学申请管理系统.html', cls: 'plain' })
        ]}
      ],
      events: {
        '2026-08-13': [wbEv('分配', WB_RED, '04:30 分配「审核 CMU 个人陈述终稿」给孙老师（已等待 1 天 6 小时）')],
        '2026-08-15': [wbEv('审核提交', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV 提交审核（审核人员：王审核）')],
        '2026-08-16': [wbEv('审核提交', WB_ORANGE, '王明 · 斯坦福大学 CV 提交审核（审核人员：王审核）')],
        '2026-08-17': [wbEv('审核提交', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS 提交审核（审核人员：王审核）')],
        '2026-08-18': [wbEv('审核提交', WB_ORANGE, '刘芳 · 哈佛大学 PS 今天 08:40 提交审核（审核人员：李审核）'), wbEv('项目待分配', WB_RED, '张明 PRJ-M-2607-0001 待接收 · 吴子墨选校订单待确认')],
        '2026-09-15': [wbEv('文书DDL', WB_BLUE, '陈磊 · 剑桥大学 金融学 RP（已完成）')],
        '2026-10-17': [wbEv('网申DDL', WB_PURPLE, '赵婷 · 哥伦比亚大学 经济学 Round 1 截止')],
        '2026-10-30': [wbEv('文书DDL', WB_BLUE, '张华 · 麻省理工学院 数据科学 RL'), wbEv('网申DDL', WB_PURPLE, '张华 · 麻省理工学院 Round 1 截止')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS'), wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 Round 1 截止')],
        '2026-11-20': [wbEv('文书DDL', WB_BLUE, '刘芳 · 哈佛大学 公共卫生 PS'), wbEv('网申DDL', WB_PURPLE, '刘芳 · 哈佛大学 Round 1 截止')],
        '2026-12-01': [wbEv('网申DDL', WB_PURPLE, '孙梓涵 · 哥伦比亚大学 金融工程 Round 1 截止')],
        '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 计算机科学 CV'), wbEv('网申DDL', WB_PURPLE, '王明 · 斯坦福大学 Round 2 截止')]
      },
      boards: [
        { title: 'PMO 项目池', color: WB_CYAN, items: [
          wbB('张建国 · 张明 · 本科申请', '待接收', 'PRJ-M-2607-0001 · 2026-07-01 10:24'),
          wbB('李慧敏 · 李雪 · 硕士申请', '进行中', 'PRJ-M-2607-0002 · 2026-07-02 14:05 · 张老师'),
          wbB('王建军 · 王伟 · 博士申请', '已结项', 'PRJ-O-2607-0003 · 2026-06-18 09:40 · 李老师'),
          wbB('赵文华 · 赵婷 · 硕士申请', '暂停', 'PRJ-M-2607-0004 · 2026-07-05 16:30 · 王老师'),
          wbB('陈国平 · 陈晓 · 本科申请', '已退回', 'PRJ-O-2607-0005 · 2026-07-08 11:12')
        ]},
        { title: '文书交付 · 任务列表', color: WB_BLUE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中', 'DDL 2026-11-01 · 陈文书'),
          wbB('王明 · 斯坦福大学 计算机科学 CV', '撰写中', 'DDL 2026-12-15 · 周文书'),
          wbB('张华 · 麻省理工学院 数据科学 RL', '审核中', 'DDL 2026-10-30 · 吴文书'),
          wbB('刘芳 · 哈佛大学 公共卫生 PS', '需修改', 'DDL 2026-11-20 · 陈文书'),
          wbB('陈磊 · 剑桥大学 金融学 RP', '已完成', 'DDL 2026-09-15 · 郑文书')
        ]},
        { title: '网申管理 · 网申任务列表', color: WB_PURPLE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 Round 1', '进行中', '材料 3/5 · DDL 2026-11-01 · 孙网申'),
          wbB('张华 · 麻省理工学院 数据科学 Round 1', '进行中', '材料 4/6 · DDL 2026-10-30 · 钱网申'),
          wbB('刘芳 · 哈佛大学 公共卫生 Round 1', '审核中', '材料 5/5 · DDL 2026-11-20 · 钱网申'),
          wbB('赵婷 · 哥伦比亚大学 经济学 Round 1', '待领取', '材料 3/5 · DDL 2026-10-17 · 孙网申'),
          wbB('王明 · 斯坦福大学 计算机科学 Round 2', '已提交', '材料 6/6 · DDL 2026-12-15 · 孙网申'),
          wbB('孙梓涵 · 哥伦比亚大学 金融工程 Round 1', '未开始', '材料 2/5 · DDL 2026-12-01')
        ]},
        { title: '文书审核 · 审核列表', color: WB_ORANGE, items: [
          wbB('刘芳 · 哈佛大学 PS', '审核中', '今天 08:40 提交 · 李审核 · 陈文书'),
          wbB('李雪 · 卡内基梅隆大学 PS', '审核中', '08-17 10:30 提交 · 王审核 · 陈文书'),
          wbB('王明 · 斯坦福大学 CV', '审核中', '08-16 14:20 提交 · 王审核 · 周文书'),
          wbB('赵婷 · 哥伦比亚大学 CV', '审核中', '08-15 11:05 提交 · 王审核 · 周文书'),
          wbB('张华 · 麻省理工学院 RL', '已完成', '08-12 09:15 提交 · 李审核 · 吴文书'),
          wbB('陈磊 · 剑桥大学 RP', '已完成', '08-10 16:00 提交 · 王审核 · 郑文书')
        ]},
        { title: '选校工作台 · 订单池', color: WB_GREEN, items: [
          wbB('钱文博 · 钱思睿 · 本科申请 / 美国 / 计算机科学', '咨询中', '2026-07-15 下单 · 陈晨'),
          wbB('孙雅婷 · 孙浩然 · 硕士申请 / 英国 / 金融', '咨询中', '2026-07-16 下单 · 刘洋'),
          wbB('周立群 · 周雨薇 · 硕士申请 / 美国 / 电子工程', '选校中', '2026-07-17 下单 · 赵敏'),
          wbB('吴国强 · 吴子墨 · 博士申请 / 加拿大 / 数据科学', '待确认', '2026-07-18 下单 · 孙鹏')
        ]},
        { title: '结项归档', color: WB_GRAY, items: [
          wbB('赵敏 · 赵欣怡 · 本科申请', '待结项', 'PRJ20260701018'),
          wbB('李慧敏 · 李雪 · 硕士申请', '待结项', 'PRJ20260701002'),
          wbB('王建军 · 王伟 · 博士申请', '待结项', 'PRJ-M-2607-0003'),
          wbB('孙丽 · 孙浩然 · 硕士申请', '已结项', '2026-07-12 结项'),
          wbB('周杰 · 周子墨 · 本科申请', '已结项', '2026-06-28 结项'),
          wbB('吴芳 · 吴思远 · 博士申请', '已结项', '2026-07-05 结项')
        ]}
      ]
    },

    /* ---------- 8. 文书机构管理员 ---------- */
    docadmin: {
      name: '文书机构管理员', scope: '文书管理视角 · 本机构', scopeBg: '#f2f5f7', scopeC: '#6b829a',
      tagline: '统筹文书交付与审核质量，管理机构成员',
      stats: [
        { l: '今日待办', v: '6', n: '2 项待分配 · 2 项审核积压 · 2 项待跟进', t: '' },
        { l: '文书任务', v: '5', n: '撰写中 2 · 审核中 2 · 需修改 1', t: 'tone-blue' },
        { l: '审核积压', v: '4', n: '最早 08-15 提交', t: 'tone-orange' },
        { l: '团队成员', v: '5', n: '文书 3 · 审核 2', t: 'tone-purple' }
      ],
      cards: [
        { m: '文书交付', c: '5 项任务 · 1 项需修改', color: WB_BLUE, href: '任务列表页 - 文书交付系统.html' },
        { m: '文书审核', c: '6 份审核 · 4 份审核中', color: WB_ORANGE, href: '文书审核列表页 - 留学申请管理系统.html' },
        { m: '模板库', c: '6 个标准模板', color: WB_CYAN, href: '模板库列表 - 文书交付系统.html' },
        { m: '案例库', c: '12 份已解析案例', color: WB_PURPLE, href: '案例库 - 文书交付系统.html' },
        { m: '人员管理', c: '5 位成员', color: WB_AMBER, href: '人员管理 - PBS留学CRM系统.html' },
        { m: '学生档案', c: '31 位在管学生', color: WB_GREEN, href: '学生档案列表页 - 留学申请管理系统.html' }
      ],
      todoCount: 6,
      todoGroups: [
        { title: '需要我处理', color: WB_RED, items: [
          wbT(WB_RED, '需修改', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS 需修改', '文书交付 · 审核打回 · 负责人：陈文书 · DDL 2026-11-20', '需按审核意见修改', WB_RED, { l: '催办', urge: ['刘芳 · 哈佛大学公共卫生PS修改', '陈文书', '文书人员'], cls: 'ghost' }),
          wbT(WB_PURPLE, '待分配', WB_PURPLE, '新到李雪 CMU 套磁信任务待分配', '文书交付 · 类型 CL · 客户：李建国', '待分配文书人员', WB_PURPLE, { l: '去分配', href: '任务列表页 - 文书交付系统.html' })
        ]},
        { title: '审核队列', color: WB_ORANGE, items: [
          wbT(WB_ORANGE, null, null, '刘芳 · 哈佛大学 PS', '提交人：陈文书 · 审核人员：李审核', '今天 08:40 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '李雪 · 卡内基梅隆大学 PS', '提交人：陈文书 · 审核人员：王审核', '08-17 10:30 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '王明 · 斯坦福大学 CV', '提交人：周文书 · 审核人员：王审核', '08-16 14:20 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' }),
          wbT(WB_ORANGE, null, null, '赵婷 · 哥伦比亚大学 CV', '提交人：周文书 · 审核人员：王审核', '08-15 11:05 提交', WB_GRAY, { l: '去审核', href: '文书审核详情页 - 留学申请管理系统.html', cls: 'plain' })
        ]},
        { title: '团队跟进', color: WB_BLUE, items: [
          wbT(WB_BLUE, '撰写中', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS', '负责人：陈文书 · DDL 2026-11-01', '进度正常', WB_BLUE, { l: '催办', urge: ['李雪 · 卡内基梅隆大学 人工智能 PS', '陈文书', '文书人员'], cls: 'ghost' }),
          wbT(WB_BLUE, '撰写中', WB_BLUE, '王明 · 斯坦福大学 计算机科学 CV', '负责人：周文书 · DDL 2026-12-15', '进度正常', WB_BLUE, { l: '催办', urge: ['王明 · 斯坦福大学 计算机科学 CV', '周文书', '文书人员'], cls: 'ghost' })
        ]}
      ],
      events: {
        '2026-08-15': [wbEv('审核提交', WB_ORANGE, '赵婷 · 哥伦比亚大学 CV 提交审核（审核人员：王审核 · DDL 2026-10-17）')],
        '2026-08-16': [wbEv('审核提交', WB_ORANGE, '王明 · 斯坦福大学 CV 提交审核（审核人员：王审核 · DDL 2026-12-15）')],
        '2026-08-17': [wbEv('审核提交', WB_ORANGE, '李雪 · 卡内基梅隆大学 PS 提交审核（审核人员：王审核 · DDL 2026-11-01）')],
        '2026-08-18': [wbEv('审核提交', WB_ORANGE, '刘芳 · 哈佛大学 PS 今天 08:40 提交审核（审核人员：李审核 · DDL 2026-11-20）'), wbEv('任务待分配', WB_RED, '李雪 CMU 套磁信任务待分配')],
        '2026-09-15': [wbEv('文书DDL', WB_GREEN, '陈磊 · 剑桥大学 金融学 RP（已完成）')],
        '2026-10-30': [wbEv('文书DDL', WB_ORANGE, '张华 · 麻省理工学院 数据科学 RL（审核中）')],
        '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 人工智能 PS（撰写中）')],
        '2026-11-20': [wbEv('文书DDL', WB_RED, '刘芳 · 哈佛大学 公共卫生 PS（需修改）')],
        '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 计算机科学 CV（撰写中）')]
      },
      boards: [
        { title: '文书交付 · 任务列表', color: WB_BLUE, items: [
          wbB('李雪 · 卡内基梅隆大学 人工智能 PS', '撰写中', 'DDL 2026-11-01 · 陈文书'),
          wbB('王明 · 斯坦福大学 计算机科学 CV', '撰写中', 'DDL 2026-12-15 · 周文书'),
          wbB('张华 · 麻省理工学院 数据科学 RL', '审核中', 'DDL 2026-10-30 · 吴文书'),
          wbB('刘芳 · 哈佛大学 公共卫生 PS', '需修改', 'DDL 2026-11-20 · 陈文书'),
          wbB('陈磊 · 剑桥大学 金融学 RP', '已完成', 'DDL 2026-09-15 · 郑文书')
        ]},
        { title: '文书审核 · 审核列表', color: WB_ORANGE, items: [
          wbB('刘芳 · 哈佛大学 PS', '审核中', '今天 08:40 提交 · 李审核 · 陈文书'),
          wbB('李雪 · 卡内基梅隆大学 PS', '审核中', '08-17 10:30 提交 · 王审核 · 陈文书'),
          wbB('王明 · 斯坦福大学 CV', '审核中', '08-16 14:20 提交 · 王审核 · 周文书'),
          wbB('赵婷 · 哥伦比亚大学 CV', '审核中', '08-15 11:05 提交 · 王审核 · 周文书'),
          wbB('张华 · 麻省理工学院 RL', '已完成', '08-12 09:15 提交 · 李审核 · 吴文书'),
          wbB('陈磊 · 剑桥大学 RP', '已完成', '08-10 16:00 提交 · 王审核 · 郑文书')
        ]},
        { title: '团队成员', color: WB_PURPLE, items: [
          wbB('陈文书', '文书人员', '负责 PS/CL'),
          wbB('周文书', '文书人员', '负责 CV/RP'),
          wbB('吴文书', '文书人员', '负责 RL'),
          wbB('王审核', '文书审核', '一审'),
          wbB('李审核', '文书审核', '二审')
        ]}
      ]
    }
  };

  /* ---------- 销售人员管理员：权限基线中的独立管理角色 ---------- */
  WB_ROLES.salesmanager = {
    name: '销售人员管理员', scope: '管理视角 · 本机构选校业务', scopeBg: '#f5ebda', scopeC: '#8c6f4e',
    tagline: '先分配咨询单，再盯跟进节奏与方案确认',
    stats: [
      { l: '待分配咨询单', v: '3', n: '最早已等待 6 小时', t: 'tone-red' },
      { l: '今日应跟进', v: '5', n: '2 项尚未记录沟通', t: 'tone-orange' },
      { l: '方案待确认', v: '2', n: '已分享 H5，客户未确认', t: 'tone-purple' },
      { l: '选校订单总数', v: '18', n: '4 名销售人员负责', t: 'tone-blue' }
    ],
    cards: [
      { m: '选校订单池', c: '查看并分配全部咨询单', color: WB_GREEN, href: '选校订单池页 - 留学申请管理系统.html' },
      { m: '选校任务列表', c: '查看团队跟进与方案进度', color: WB_CYAN, href: '选校任务列表页 - 留学申请管理系统.html' }
    ],
    todoCount: 6,
    todoGroups: [
      { title: '需要我处理', color: WB_RED, items: [
        wbT(WB_RED, '待分配', WB_RED, '分配钱思睿的本科选校咨询单', '美国 · 计算机科学 · 2026-08-18 04:20 已进入选校列表', '已进入选校列表 6 小时', WB_RED, { l: '去分配', href: '选校订单池页 - 留学申请管理系统.html' }),
        wbT(WB_ORANGE, '需调整', WB_ORANGE, '调整周雨薇选校任务负责人', '当前负责人待调整', '建议今日完成重分配', WB_ORANGE, { l: '去调整', href: '选校任务列表页 - 留学申请管理系统.html' })
      ]},
      { title: '团队业务消息', color: WB_AMBER, items: [
        wbT(WB_AMBER, '待跟进', WB_AMBER, '吴子墨方案已分享 2 天仍未确认', '负责人：孙鹏 · 加拿大 · 数据科学 · 方案 v3', '今天 17:00 前跟进', WB_AMBER, { l: '催办', urge: ['跟进吴子墨选校方案确认', '孙鹏', '销售人员'], cls: 'ghost' }),
        wbT(WB_ORANGE, '沟通缺失', WB_ORANGE, '郑晓萌任务超过 3 天未记录沟通', '负责人：周扬 · 英国 · 金融', '最近沟通 2026-08-15', WB_ORANGE, { l: '催办', urge: ['补充郑晓萌选校沟通记录', '周扬', '销售人员'], cls: 'ghost' })
      ]},
      { title: '客户反馈', color: WB_GREEN, items: [
        wbT(WB_GREEN, '方案反馈', WB_GREEN, '周雨薇客户要求补充 2 所保底院校', '负责人：赵敏 · 当前方案 v2', '10 分钟前', WB_GRAY, { l: '查看任务', href: '选校任务列表页 - 留学申请管理系统.html', cls: 'plain' }),
        wbT(WB_GREEN, '已确认', WB_GREEN, '钱思睿已确认选校方案 v4', '负责人：陈晨 · 冲刺 3 / 匹配 4 / 保底 2', '35 分钟前', WB_GRAY, { l: '查看任务', href: '选校任务列表页 - 留学申请管理系统.html', cls: 'plain' })
      ]}
    ],
    events: {
      '2026-08-18': [wbEv('分配DDL', WB_RED, '17:00 前完成 3 笔新咨询单分配'), wbEv('客户跟进', WB_AMBER, '吴子墨方案确认跟进')],
      '2026-08-19': [wbEv('团队跟进', WB_CYAN, '复核本周未记录沟通的选校任务')],
      '2026-08-22': [wbEv('方案复盘', WB_GREEN, '本周方案确认与退回原因复盘')]
    },
    boards: [
      { title: '咨询单分配队列', color: WB_RED, items: [
        wbB('钱思睿 · 本科 / 美国 / 计算机科学', '待分配', '已进入选校列表 6 小时'),
        wbB('林若曦 · 硕士 / 英国 / 金融', '待分配', '已进入选校列表 3 小时'),
        wbB('赵嘉言 · 博士 / 新加坡 / 生物工程', '待分配', '已进入选校列表 1 小时')
      ]},
      { title: '销售人员选校订单', color: WB_BLUE, items: [
        wbB('陈晨', '5 单', '当前负责选校订单'),
        wbB('赵敏', '7 单', '当前负责选校订单'),
        wbB('孙鹏', '3 单', '当前负责选校订单'),
        wbB('周扬', '3 单', '当前负责选校订单')
      ]}
    ]
  };

  /* ---------- 角色工作台数据 ---------- */
  (function applyWorkbenchData() {
    function setStatLinks(role, links) {
      (WB_ROLES[role].stats || []).forEach(function (item, index) { item.href = links[index] || links[0]; });
    }
    function setBoardLinks(role, links) {
      (WB_ROLES[role].boards || []).forEach(function (item, index) { item.href = links[index] || links[0]; });
    }
    function addCalendarEvents(role, additions) {
      var events = WB_ROLES[role].events || (WB_ROLES[role].events = {});
      Object.keys(additions).forEach(function (date) {
        events[date] = (events[date] || []).concat(additions[date]);
      });
    }
    function markMessageKinds(role) {
      (WB_ROLES[role].todoGroups || []).forEach(function (group) {
        (group.items || []).forEach(function (item) {
          if (item.act && item.act.urge) item.kind = 'collaboration';
          else if (item.tag === '新推送' || item.tag === '已确认' || group.title.indexOf('系统') >= 0 || group.title.indexOf('客户') >= 0) item.kind = 'notice';
          else item.kind = 'mine';
        });
      });
    }
    function roleMeta(role, source, title, desc, calendarLabel) {
      var R = WB_ROLES[role];
      R.source = source;
      R.overviewTitle = title;
      R.overviewDesc = desc;
      R.calendarLabel = calendarLabel || 'DDL 与日程';
      R.updatedAt = '数据基线 2026-08-18 10:30';
      markMessageKinds(role);
    }

    /* 项目经理 */
    WB_ROLES.pm.stats = [
      { l: '我的项目', v: '5', n: '进行中 2 · 待接收 1' },
      { l: '文书任务', v: '5', n: '待接收 1 · 撰写中 2' },
      { l: '网申任务', v: '5', n: '准备中 3 · 已提交 2' },
      { l: '学生监控任务', v: '5', n: '本人项目监控任务' },
      { l: '存在待办', v: '3', n: '监控结果需要处理' },
      { l: '紧急或逾期', v: '2', n: '优先跟进监控异常' },
      { l: '无待办', v: '2', n: '监控状态正常' },
      { l: '待结项', v: '2', n: '等待 PMO 核验' }
    ];
    WB_ROLES.pm.cards = [
      { m: '学生档案', c: '查看本人项目学生', href: '学生档案列表页 - 留学申请管理系统.html' },
      { m: '我的项目', c: '5 个在管项目', href: '我的项目列表页 - 留学申请管理系统.html' },
      { m: '文书任务', c: '5 项文书交付任务', href: '任务列表页 - 文书交付系统.html' },
      { m: '网申任务', c: '5 项网申任务', href: '网申任务列表页 - 留学申请管理系统.html' },
      { m: '监控任务', c: '3 项监控待办', href: '监控任务列表 - PBS留学CRM.html' },
      { m: '结项归档', c: '2 个院校目标待提交材料', href: '结项归档列表 - PBS留学CRM系统.html' }
    ];
    WB_ROLES.pm.todoCount = 3;
    WB_ROLES.pm.todoGroups = [
      { title: '优先处理', color: WB_RED, items: [
        wbT(WB_RED, null, null, '处理 2 项紧急或逾期监控', '监控任务 · 本人项目', '今天', WB_RED, { l: '查看任务', href: '监控任务列表 - PBS留学CRM.html' }),
        wbT(WB_BLUE, null, null, '确认 CMU 个人陈述终稿', '文书任务 · 李雪', '今天', WB_BLUE, { l: '查看文书', href: '任务列表页 - 文书交付系统.html' }),
        wbT(WB_PURPLE, null, null, '补齐 MIT 网申材料', '网申任务 · 张华', '明天', WB_PURPLE, { l: '查看网申', href: '网申任务列表页 - 留学申请管理系统.html' })
      ]}
    ];
    WB_ROLES.pm.events = {
      '2026-09-15': [wbEv('文书DDL', WB_BLUE, '陈磊 · 剑桥大学 RP')],
      '2026-10-30': [wbEv('文书DDL', WB_BLUE, '张华 · 麻省理工学院 RL'), wbEv('网申DDL', WB_PURPLE, '张华 · 麻省理工学院 Round 1')],
      '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 PS'), wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 Round 1')],
      '2026-11-20': [wbEv('文书DDL', WB_BLUE, '刘芳 · 哈佛大学 PS')],
      '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 CV'), wbEv('网申DDL', WB_PURPLE, '王明 · 斯坦福大学 Round 2')]
    };
    WB_ROLES.pm.boards = [
      { title: '我的项目', color: WB_CYAN, items: [
        wbB('李雪 · 硕士申请（PRJ20260701002）', '进行中', '更新 2026-08-14 09:30'),
        wbB('赵欣怡 · 本科申请（PRJ20260701018）', '进行中', '更新 2026-08-15 10:20'),
        wbB('刘晓 · 本科申请（PRJ20260701005）', '待接收', '机构已分配 · 2026-08-18 04:30'),
        wbB('陈雨桐 · 硕士申请（PRJ20260701008）', '已退回', '更新 2026-07-15 14:00'),
        wbB('王梓豪 · 博士申请（PRJ20260701012）', '暂停', '更新 2026-07-16 10:15')
      ]},
      { title: '文书任务', color: WB_BLUE, items: [
        wbB('李雪 · CMU 人工智能 PS', '撰写中', 'DDL 2026-11-01 · 刘老师'),
        wbB('刘芳 · 哈佛大学公共卫生 PS', '需修改', 'DDL 2026-11-20 · 陈老师'),
        wbB('张华 · MIT 数据科学 RL', '审核中', 'DDL 2026-10-30 · 吴老师'),
        wbB('陈雨桐 · 伯克利推荐信', '待接收', '2026-08-18 04:30 分配'),
        wbB('陈磊 · 剑桥大学金融学 RP', '已完成', 'DDL 2026-09-15')
      ]},
      { title: '网申任务', color: WB_PURPLE, items: [
        wbB('李雪 · CMU Round 1', '材料缺失', '材料 3/5 · DDL 2026-11-01', 60, WB_ORANGE),
        wbB('张华 · MIT Round 1', '进行中', '材料 4/6 · DDL 2026-10-30', 67, WB_BLUE),
        wbB('刘芳 · Harvard Round 1', '审核中', '材料 5/5 · DDL 2026-11-20', 100, WB_GREEN),
        wbB('王明 · Stanford Round 2', '已提交', '材料 6/6 · DDL 2026-12-15', 100, WB_GREEN),
        wbB('陈雨桐 · Berkeley Round 1', '待接收', '网申人员尚未接收')
      ]},
      { title: '监控任务', color: WB_ORANGE, items: [
        wbB('学生监控任务', '5', '本人项目监控总数'),
        wbB('存在待办', '3', '需要跟进处理'),
        wbB('紧急或逾期', '2', '优先处理'),
        wbB('无待办', '2', '运行状态正常')
      ]},
      { title: '结项归档', color: WB_GRAY, items: [
        wbB('赵欣怡 · 本科申请', '待结项', 'PRJ20260701018'),
        wbB('李雪 · 硕士申请', '待结项', 'PRJ20260701002')
      ]}
    ];
    setStatLinks('pm', ['我的项目列表页 - 留学申请管理系统.html', '任务列表页 - 文书交付系统.html', '网申任务列表页 - 留学申请管理系统.html', '监控任务列表 - PBS留学CRM.html', '监控任务列表 - PBS留学CRM.html', '监控任务列表 - PBS留学CRM.html', '监控任务列表 - PBS留学CRM.html', '结项归档列表 - PBS留学CRM系统.html']);
    setBoardLinks('pm', ['我的项目列表页 - 留学申请管理系统.html', '任务列表页 - 文书交付系统.html', '网申任务列表页 - 留学申请管理系统.html', '监控任务列表 - PBS留学CRM.html', '结项归档列表 - PBS留学CRM系统.html']);
    WB_ROLES.pm.tagline = '跟进本人项目的文书、网申与监控节点';
    roleMeta('pm', '本人院校目标、交付任务、监控结果与结项材料', '项目推进总览', '聚合本人负责项目的交付任务与服务风险。', '项目文书与网申 DDL');

    setStatLinks('writer', ['任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html']);
    setBoardLinks('writer', ['任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html']);
    roleMeta('writer', '本人文书任务、审核反馈、模板库与案例库', '我的文书任务总览', '按任务状态与反馈类型组织，只展示本人被分配的文书。');

    setStatLinks('sales', ['选校任务列表页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html', '选校订单池页 - 留学申请管理系统.html']);
    setBoardLinks('sales', ['选校订单池页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html']);
    roleMeta('sales', '本人客户、选校咨询单、方案版本与沟通记录', '我的选校业务总览', '围绕客户跟进、方案制作与确认闭环，不展示其他销售的数据。', '客户跟进与方案 DDL');

    setStatLinks('apply', ['网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html']);
    setBoardLinks('apply', ['网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html', '网申任务列表页 - 留学申请管理系统.html']);
    roleMeta('apply', '本人网申任务、材料齐备度、申请轮次与提交 DDL', '我的网申任务总览', '把材料不齐且临近 DDL 的任务前置，状态与材料齐备度可下钻。');

    setStatLinks('audit', ['文书审核列表页 - 留学申请管理系统.html', '文书审核列表页 - 留学申请管理系统.html', '文书审核列表页 - 留学申请管理系统.html', '文书审核列表页 - 留学申请管理系统.html']);
    setBoardLinks('audit', ['文书审核列表页 - 留学申请管理系统.html', '文书审核列表页 - 留学申请管理系统.html']);
    roleMeta('audit', '本人审核任务、提交时间、审核状态与复审记录', '我的审核队列总览', '按超期、今日到期、重新提交、普通审核的顺序处理。', '审核 DDL 与提交日程');

    /* 平台运维人员 */
    WB_ROLES.platform.stats = [
      { l: '机构总数', v: '5', n: '3 家已启用 · 2 家待接入' },
      { l: '角色配置', v: '10', n: '平台与机构角色权限' },
      { l: '文书模板', v: '6', n: '覆盖 3 家机构' },
      { l: '网申模板', v: '18', n: '覆盖 12 所院校' }
    ];
    WB_ROLES.platform.cards = [
      { m: '机构管理', c: '机构接入与基础配置', href: '机构管理 - PBS留学CRM系统.html' },
      { m: '人员管理', c: '平台与机构成员配置', href: '人员管理 - PBS留学CRM系统.html' },
      { m: '角色权限', c: '角色授权与权限校验', href: '角色权限管理 - 留学申请管理系统.html' },
      { m: '操作日志', c: '平台操作审计记录', href: '操作日志审计 - 留学申请管理系统.html' },
      { m: 'AI 管理', c: '模型与调用配置', href: 'AI管理 - 留学申请管理系统.html' },
      { m: '视频管理', c: '平台视频内容资产', href: '视频管理 - 留学申请管理系统.html' },
      { m: '文书模板库', c: '6 个模板', href: '模板库列表 - 文书交付系统.html' },
      { m: '文书案例库', c: '128 个案例', href: '案例库 - 文书交付系统.html' },
      { m: '网申模板库', c: '18 个模板', href: '网申模板库 - 留学申请管理系统.html' }
    ];
    WB_ROLES.platform.todoCount = 3;
    WB_ROLES.platform.todoGroups = [
      { title: '平台待处理', color: WB_RED, items: [
        wbT(WB_RED, null, null, '复核案例解析失败记录', '文书案例库 · 内容资产', '今天', WB_RED, { l: '查看案例', href: '案例库 - 文书交付系统.html' }),
        wbT(WB_ORANGE, null, null, '复核网申模板字段差异', '网申模板库 · 剑桥大学', '今天', WB_ORANGE, { l: '查看模板', href: '网申模板库 - 留学申请管理系统.html' }),
        wbT(WB_BLUE, null, null, '完成角色权限定期检查', '角色权限 · 平台配置', '本周', WB_BLUE, { l: '查看权限', href: '角色权限管理 - 留学申请管理系统.html' })
      ]}
    ];
    WB_ROLES.platform.events = {
      '2026-08-18': [wbEv('机构配置', WB_BLUE, '完成 2 家待接入机构的基础配置')],
      '2026-08-20': [wbEv('权限复核', WB_PURPLE, '平台与机构角色权限定期检查')],
      '2026-08-22': [wbEv('资产复核', WB_ORANGE, '网申模板字段版本复核')]
    };
    WB_ROLES.platform.boards = [
      { title: '机构接入', color: WB_CYAN, items: [
        wbB('PBS留学总部', '已启用', '基础配置完整'),
        wbB('上海启明留学', '已启用', '基础配置完整'),
        wbB('北京知行教育', '已启用', '基础配置完整'),
        wbB('广州远航教育', '待接入', '基础配置待完成'),
        wbB('深圳新途教育', '待接入', '基础配置待完成')
      ]},
      { title: '内容资产', color: WB_BLUE, items: [
        wbB('文书模板', '6', '覆盖 3 家机构'),
        wbB('文书案例', '128', '已解析 124 · 待处理 4'),
        wbB('网申模板', '18', '覆盖 12 所院校'),
        wbB('视频内容', '已发布', '平台培训与操作指引')
      ]}
    ];
    setStatLinks('platform', ['机构管理 - PBS留学CRM系统.html', '角色权限管理 - 留学申请管理系统.html', '模板库列表 - 文书交付系统.html', '网申模板库 - 留学申请管理系统.html']);
    setBoardLinks('platform', ['机构管理 - PBS留学CRM系统.html', '模板库列表 - 文书交付系统.html']);
    WB_ROLES.platform.tagline = '维护机构配置与内容资产';
    roleMeta('platform', '全平台机构、内容资产、权限与配置数据', '平台运营总览', '聚焦机构配置与内容资产。', '机构与资产复核日历');

    /* 机构管理员 */
    WB_ROLES.orgadmin.stats = [
      { l: '学生档案', v: '126', n: '本机构学生总数' },
      { l: '项目池', v: '89', n: '本机构项目总数' },
      { l: '文书任务', v: '5', n: '待接收 1 · 撰写中 2' },
      { l: '网申任务', v: '5', n: '准备中 3 · 已提交 2' },
      { l: '文书模板', v: '6', n: '本机构可用模板' },
      { l: '文书案例', v: '128', n: '本机构可用案例' },
      { l: '网申模板', v: '18', n: '覆盖 12 所院校' },
      { l: '待结项', v: '3', n: '等待 PMO 核验结项' }
    ];
    WB_ROLES.orgadmin.cards = [
      { m: '学生档案', c: '126 名学生', href: '学生档案列表页 - 留学申请管理系统.html' },
      { m: '项目池', c: '89 个项目', href: '项目池列表页 - 留学申请管理系统.html' },
      { m: '文书任务', c: '5 项文书任务', href: '任务列表页 - 文书交付系统.html' },
      { m: '文书模板库', c: '6 个模板', href: '模板库列表 - 文书交付系统.html' },
      { m: '文书案例库', c: '128 个案例', href: '案例库 - 文书交付系统.html' },
      { m: '网申任务', c: '5 项网申任务', href: '网申任务列表页 - 留学申请管理系统.html' },
      { m: '网申模板库', c: '18 个模板', href: '网申模板库 - 留学申请管理系统.html' },
      { m: '监控任务', c: '3 项待办', href: '监控任务列表 - PBS留学CRM.html' },
      { m: '结项归档', c: '3 个项目待结项', href: '结项归档列表 - PBS留学CRM系统.html' }
    ];
    WB_ROLES.orgadmin.todoCount = 3;
    WB_ROLES.orgadmin.todoGroups = [
      { title: '机构待处理', color: WB_RED, items: [
        wbT(WB_RED, null, null, '分配项目池中的待处理项目', '项目池 · 本机构', '今天', WB_RED, { l: '查看项目', href: '项目池列表页 - 留学申请管理系统.html' }),
        wbT(WB_BLUE, null, null, '跟进 1 项临近 DDL 文书', '文书任务 · 本机构', '2 天内', WB_BLUE, { l: '查看文书', href: '任务列表页 - 文书交付系统.html' }),
        wbT(WB_PURPLE, null, null, '补齐 1 项网申材料', '网申任务 · 本机构', '3 天内', WB_PURPLE, { l: '查看网申', href: '网申任务列表页 - 留学申请管理系统.html' })
      ]}
    ];
    WB_ROLES.orgadmin.events = {
      '2026-09-15': [wbEv('文书DDL', WB_BLUE, '陈磊 · 剑桥大学 RP')],
      '2026-10-30': [wbEv('文书DDL', WB_BLUE, '张华 · 麻省理工学院 RL'), wbEv('网申DDL', WB_PURPLE, '张华 · 麻省理工学院 Round 1')],
      '2026-11-01': [wbEv('文书DDL', WB_BLUE, '李雪 · 卡内基梅隆大学 PS'), wbEv('网申DDL', WB_PURPLE, '李雪 · 卡内基梅隆大学 Round 1')],
      '2026-11-20': [wbEv('文书DDL', WB_BLUE, '刘芳 · 哈佛大学 PS')],
      '2026-12-15': [wbEv('文书DDL', WB_BLUE, '王明 · 斯坦福大学 CV'), wbEv('网申DDL', WB_PURPLE, '王明 · 斯坦福大学 Round 2')]
    };
    WB_ROLES.orgadmin.boards = [
      { title: '学生与项目', color: WB_CYAN, items: [
        wbB('学生档案', '126', '本机构学生总数'),
        wbB('项目池', '89', '本机构项目总数'),
        wbB('待分配项目', '3', '等待分配 PMO'),
        wbB('进行中项目', '45', '项目交付推进中')
      ]},
      { title: '文书交付', color: WB_BLUE, items: [
        wbB('李雪 · CMU 人工智能 PS', '撰写中', 'DDL 2026-11-01'),
        wbB('刘芳 · 哈佛大学公共卫生 PS', '需修改', 'DDL 2026-11-20'),
        wbB('张华 · MIT 数据科学 RL', '审核中', 'DDL 2026-10-30'),
        wbB('陈雨桐 · 伯克利推荐信', '待接收', '等待文书人员接收'),
        wbB('陈磊 · 剑桥大学金融学 RP', '已完成', 'DDL 2026-09-15')
      ]},
      { title: '网申交付', color: WB_PURPLE, items: [
        wbB('李雪 · CMU Round 1', '材料缺失', '材料 3/5 · DDL 2026-11-01', 60, WB_ORANGE),
        wbB('张华 · MIT Round 1', '进行中', '材料 4/6 · DDL 2026-10-30', 67, WB_BLUE),
        wbB('刘芳 · Harvard Round 1', '审核中', '材料 5/5 · DDL 2026-11-20', 100, WB_GREEN),
        wbB('王明 · Stanford Round 2', '已提交', '材料 6/6 · DDL 2026-12-15', 100, WB_GREEN),
        wbB('陈雨桐 · Berkeley Round 1', '待接收', '等待网申人员接收')
      ]},
      { title: '内容资产', color: WB_GREEN, items: [
        wbB('文书模板', '6', '本机构可用模板'),
        wbB('文书案例', '128', '本机构可用案例'),
        wbB('网申模板', '18', '覆盖 12 所院校')
      ]},
      { title: '监控任务', color: WB_ORANGE, items: [
        wbB('学生监控任务', '5', '本机构项目监控总数'),
        wbB('存在待办', '3', '需要团队跟进'),
        wbB('紧急或逾期', '2', '优先处理'),
        wbB('无待办', '2', '运行状态正常')
      ]},
      { title: '结项归档', color: WB_GRAY, items: [
        wbB('待结项', '3', '等待机构确认'),
        wbB('本月已结项', '3', '已完成归档')
      ]}
    ];
    WB_ROLES.orgadmin.pmTeam = {
      stats: [
        { label: '总 PM 数', value: '6 人', hint: '当前在职项目经理' },
        { label: '总负责学生数', value: '21 人', hint: '进行中项目学生去重' },
        { label: '平均负责学生数', value: '3.5 人', hint: '总学生数 ÷ 总 PM 数' }
      ],
      levels: [
        { label: '本科申请', value: 4 },
        { label: '硕士申请', value: 3 },
        { label: '博士申请', value: 2 }
      ],
      people: [
        { name: '张老师', skills: '本科申请 · 硕士申请', students: [
          { name: '张明', targets: [
            { school: '卡内基梅隆大学', major: '计算机科学', packageName: WB_PACKAGE_PREMIUM },
            { school: '斯坦福大学', major: '数据科学', packageName: WB_PACKAGE_PREMIUM }
          ]},
          { name: '李雪', targets: [{ school: '卡内基梅隆大学', major: '人工智能', packageName: WB_PACKAGE_FULL }] },
          { name: '陈磊', targets: [{ school: '剑桥大学', major: '金融学', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '王明', targets: [{ school: '斯坦福大学', major: '计算机科学', packageName: WB_PACKAGE_DOC_APP }] },
          { name: '刘芳', targets: [{ school: '哈佛大学', major: '公共卫生', packageName: WB_PACKAGE_FULL }] }
        ]},
        { name: '王老师', skills: '硕士申请 · 博士申请', students: [
          { name: '赵婷', targets: [{ school: '哥伦比亚大学', major: '金融工程', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '陈雨桐', targets: [{ school: '加州大学伯克利分校', major: '电子工程', packageName: WB_PACKAGE_FULL }] },
          { name: '林若曦', targets: [{ school: '伦敦政治经济学院', major: '金融学', packageName: WB_PACKAGE_DOC_APP }] },
          { name: '赵嘉言', targets: [{ school: '新加坡国立大学', major: '生物工程', packageName: WB_PACKAGE_PREMIUM }] }
        ]},
        { name: '李老师', skills: '本科申请 · 硕士申请', students: [
          { name: '孙浩然', targets: [{ school: '帝国理工学院', major: '机械工程', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '吴子墨', targets: [{ school: '多伦多大学', major: '数据科学', packageName: WB_PACKAGE_FULL }] },
          { name: '周雨薇', targets: [{ school: '纽约大学', major: '市场营销', packageName: WB_PACKAGE_DOC_APP }] },
          { name: '郑晓萌', targets: [{ school: '伦敦大学学院', major: '金融学', packageName: WB_PACKAGE_PREMIUM }] }
        ]},
        { name: '陈老师', skills: '本科申请', students: [
          { name: '刘晓', targets: [{ school: '加州大学洛杉矶分校', major: '经济学', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '钱思睿', targets: [{ school: '伊利诺伊大学香槟分校', major: '计算机科学', packageName: WB_PACKAGE_FULL }] },
          { name: '王梓豪', targets: [{ school: '密歇根大学安娜堡分校', major: '机械工程', packageName: WB_PACKAGE_DOC_APP }] }
        ]},
        { name: '刘老师', skills: '本科申请', students: [
          { name: '周海宁', targets: [{ school: '华盛顿大学', major: '计算机科学', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '赵欣怡', targets: [{ school: '波士顿大学', major: '传媒学', packageName: WB_PACKAGE_FULL }] },
          { name: '李想', targets: [{ school: '宾夕法尼亚州立大学', major: '商业分析', packageName: WB_PACKAGE_DOC_APP }] }
        ]},
        { name: '赵老师', skills: '博士申请', students: [
          { name: '陈晓', targets: [{ school: '麻省理工学院', major: '材料科学', packageName: WB_PACKAGE_PREMIUM }] },
          { name: '吴思远', targets: [{ school: '斯坦福大学', major: '电子工程', packageName: WB_PACKAGE_PREMIUM }] }
        ]}
      ]
    };
    setStatLinks('orgadmin', ['学生档案列表页 - 留学申请管理系统.html', '项目池列表页 - 留学申请管理系统.html', '任务列表页 - 文书交付系统.html', '网申任务列表页 - 留学申请管理系统.html', '模板库列表 - 文书交付系统.html', '案例库 - 文书交付系统.html', '网申模板库 - 留学申请管理系统.html', '结项归档列表 - PBS留学CRM系统.html']);
    setBoardLinks('orgadmin', ['项目池列表页 - 留学申请管理系统.html', '任务列表页 - 文书交付系统.html', '网申任务列表页 - 留学申请管理系统.html', '模板库列表 - 文书交付系统.html', '监控任务列表 - PBS留学CRM.html', '结项归档列表 - PBS留学CRM系统.html']);
    WB_ROLES.orgadmin.tagline = '统筹本机构学生、项目与交付资源';
    roleMeta('orgadmin', '本机构学生、项目、文书、网申、内容库、监控与结项数据', '机构运营总览', '聚合本机构学生、项目交付与内容资产。', '全部项目文书与网申 DDL');

    setStatLinks('docadmin', ['任务列表页 - 文书交付系统.html', '任务列表页 - 文书交付系统.html', '文书审核列表页 - 留学申请管理系统.html', '人员管理 - PBS留学CRM系统.html']);
    setBoardLinks('docadmin', ['任务列表页 - 文书交付系统.html', '文书审核列表页 - 留学申请管理系统.html', '人员管理 - PBS留学CRM系统.html']);
    roleMeta('docadmin', '本机构承接的文书、审核任务与文书团队成员', '文书机构运营总览', '关注待分配、修改返工、审核积压与团队负载，不展示其他机构数据。', '文书交付与审核 DDL');

    setStatLinks('salesmanager', ['选校订单池页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html']);
    setBoardLinks('salesmanager', ['选校订单池页 - 留学申请管理系统.html', '选校任务列表页 - 留学申请管理系统.html']);
    roleMeta('salesmanager', '本机构全部选校咨询单、销售负责人、沟通与方案状态', '选校团队运营总览', '以咨询单分配、团队跟进和方案确认为核心，可催办但不进入项目交付数据。', '分配、跟进与方案确认日历');

    addCalendarEvents('pm', {
      '2026-09-15': [wbEv('网申DDL', WB_PURPLE, '陈磊 · 剑桥大学 Round 1 网申提交'), wbEv('已完成', WB_GREEN, '陈磊 · 剑桥大学 RP 已完成交付')],
      '2026-09-18': [wbEv('项目DDL', WB_RED, '刘晓 · 本科申请项目材料补齐截止')],
      '2026-09-22': [wbEv('监控待办', WB_ORANGE, '王明 · 斯坦福大学官网结果需确认')],
      '2026-09-25': [wbEv('文书DDL', WB_AMBER, '赵婷 · 哥伦比亚大学 CV 客户确认截止')],
      '2026-09-30': [wbEv('文书DDL', WB_BLUE, '陈雨桐 · 加州大学伯克利分校 RL 初稿'), wbEv('网申DDL', WB_PURPLE, '陈雨桐 · 加州大学伯克利分校材料预审')]
    });
    addCalendarEvents('writer', {
      '2026-08-17': [wbEv('逾期', WB_RED, '赵婷 · 哥伦比亚大学 CV 修改稿已逾期')],
      '2026-08-18': [wbEv('今日DDL', WB_RED, '刘芳 · 哈佛大学 PS 修改稿今天提交'), wbEv('待接收', WB_AMBER, '陈雨桐 · 伯克利推荐信任务待接收')],
      '2026-08-19': [wbEv('客户反馈', WB_ORANGE, '李雪 · CMU PS 收到补充修改意见')],
      '2026-08-20': [wbEv('初稿DDL', WB_BLUE, '王明 · 斯坦福大学 CV 初稿交付')],
      '2026-08-22': [wbEv('提交审核', WB_PURPLE, '张华 · MIT 推荐信提交文书审核')],
      '2026-08-25': [wbEv('已完成', WB_GREEN, '陈磊 · 剑桥大学 RP 终稿归档')]
    });
    addCalendarEvents('sales', {
      '2026-08-18': [wbEv('今日跟进', WB_RED, '周海宁 · 确认本科选校需求'), wbEv('方案确认', WB_ORANGE, '赵欣怡 · 选校方案待客户确认')],
      '2026-08-19': [wbEv('沟通预约', WB_BLUE, '陈雨桐 · 15:00 选校沟通')],
      '2026-08-20': [wbEv('方案DDL', WB_PURPLE, '李雪 · 硕士选校方案初版')],
      '2026-08-22': [wbEv('回访', WB_AMBER, '王梓豪 · 暂停项目原因回访')],
      '2026-08-25': [wbEv('已确认', WB_GREEN, '张华 · 选校方案完成确认')]
    });
    addCalendarEvents('apply', {
      '2026-08-17': [wbEv('逾期', WB_RED, '张华 · MIT 推荐人信息确认已逾期')],
      '2026-08-18': [wbEv('材料缺失', WB_RED, '李雪 · CMU 成绩单英文版待补'), wbEv('官网预扫', WB_BLUE, '王明 · Stanford 官网字段预扫描')],
      '2026-08-19': [wbEv('账号校验', WB_AMBER, '刘芳 · Harvard 网申账号需要二次验证')],
      '2026-08-20': [wbEv('填写DDL', WB_PURPLE, '陈雨桐 · Berkeley 基础信息填写完成')],
      '2026-08-22': [wbEv('提交DDL', WB_ORANGE, '赵婷 · Columbia 网申提交前复核')],
      '2026-08-25': [wbEv('结果更新', WB_GREEN, '陈磊 · Cambridge 状态更新为已提交')]
    });
    addCalendarEvents('audit', {
      '2026-08-17': [wbEv('逾期审核', WB_RED, '赵婷 · 哥伦比亚大学 CV 初审逾期')],
      '2026-08-18': [wbEv('今日审核', WB_RED, '刘芳 · 哈佛大学 PS 需今天给出结论'), wbEv('重新提交', WB_ORANGE, '李雪 · CMU PS 修改稿已重新提交')],
      '2026-08-19': [wbEv('初审DDL', WB_BLUE, '王明 · 斯坦福大学 CV 初审')],
      '2026-08-21': [wbEv('复审DDL', WB_PURPLE, '张华 · MIT 推荐信复审'), wbEv('待分配', WB_AMBER, '陈雨桐 · 伯克利推荐信待分配审核人')],
      '2026-08-22': [wbEv('审核通过', WB_GREEN, '陈磊 · 剑桥大学 RP 完成审核')],
      '2026-08-25': [wbEv('质量复盘', WB_GRAY, '本周退回文书集中复盘')]
    });
    addCalendarEvents('platform', {
      '2026-08-18': [wbEv('系统巡检', WB_GREEN, 'AI、日志与内容服务运行状态正常')],
      '2026-08-19': [wbEv('版本发布', WB_BLUE, '网申模板字段解析规则发布')],
      '2026-08-20': [wbEv('权限复核', WB_RED, '2 个高权限角色配置待确认')],
      '2026-08-21': [wbEv('日志审计', WB_GRAY, '本周高风险操作日志抽查')],
      '2026-08-22': [wbEv('容量预警', WB_ORANGE, 'AI 服务调用量达到预警阈值')],
      '2026-08-25': [wbEv('内容发布', WB_PURPLE, '平台培训视频与模板版本发布')]
    });
    addCalendarEvents('orgadmin', {
      '2026-09-15': [wbEv('网申DDL', WB_PURPLE, '陈磊 · 剑桥大学 Round 1 网申提交'), wbEv('项目DDL', WB_GREEN, '陈磊 · 剑桥项目阶段交付完成')],
      '2026-09-18': [wbEv('项目DDL', WB_RED, '刘晓 · 本科申请项目材料补齐截止')],
      '2026-09-22': [wbEv('文书DDL', WB_ORANGE, '王明 · 斯坦福大学 CV 机构复核截止')],
      '2026-09-25': [wbEv('网申DDL', WB_AMBER, '赵婷 · 哥伦比亚大学申请材料确认')],
      '2026-09-30': [wbEv('文书DDL', WB_BLUE, '陈雨桐 · 伯克利推荐信初稿'), wbEv('网申DDL', WB_PURPLE, '陈雨桐 · 伯克利网申材料预审'), wbEv('项目DDL', WB_RED, '陈雨桐 · 项目阶段复盘')]
    });
    addCalendarEvents('docadmin', {
      '2026-08-17': [wbEv('交付逾期', WB_RED, '赵婷 · 哥伦比亚大学 CV 修改稿逾期')],
      '2026-08-18': [wbEv('待分配', WB_RED, '李雪 · CMU 套磁信待分配文书人员'), wbEv('审核积压', WB_ORANGE, '3 份文书等待审核')],
      '2026-08-19': [wbEv('负载调整', WB_AMBER, '陈文书任务负载达到上限')],
      '2026-08-20': [wbEv('初稿DDL', WB_BLUE, '王明 · 斯坦福大学 CV 初稿')],
      '2026-08-22': [wbEv('复审DDL', WB_PURPLE, '张华 · MIT 推荐信复审')],
      '2026-08-25': [wbEv('交付完成', WB_GREEN, '陈磊 · 剑桥大学 RP 终稿归档')]
    });
    addCalendarEvents('salesmanager', {
      '2026-08-17': [wbEv('跟进逾期', WB_RED, '2 笔咨询单超过 24 小时未跟进')],
      '2026-08-18': [wbEv('订单分配', WB_RED, '3 笔新咨询单待分配销售'), wbEv('方案确认', WB_ORANGE, '赵欣怡 · 选校方案待确认')],
      '2026-08-19': [wbEv('团队跟进', WB_BLUE, '复核本周重点客户跟进记录')],
      '2026-08-20': [wbEv('方案评审', WB_PURPLE, '李雪 · 硕士选校方案内部评审')],
      '2026-08-22': [wbEv('客户回访', WB_AMBER, '暂停与流失客户集中回访')],
      '2026-08-25': [wbEv('业务复盘', WB_GREEN, '本周选校订单转化复盘')]
    });
  })();

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
    if (a.href) return '<button type="button" class="' + cls + '" onclick="location.href=\'' + a.href + '\'">' + a.l + '</button>';
    if (a.toast) return '<button type="button" class="' + cls + '" onclick="workbenchToast(\'' + a.toast + '\')">' + a.l + '</button>';
    return '';
  }

  function wbPriorityItems(role) {
    var items = [];
    (WB_ROLES[role].todoGroups || []).some(function (group) {
      (group.items || []).some(function (item) {
        items.push(item);
        return items.length >= 3;
      });
      return items.length >= 3;
    });
    return items;
  }

  function wbPriorityRow(it) {
    var source = [it.tag, it.title, it.time, it.meta].join('');
    var windowLabel = source.indexOf('逾期') >= 0 ? '逾期' : (/今天|明天|临期|紧急/.test(source) ? '临近 3 天' : '临近 7 天');
    return '<div class="wb-priority">'
      + '<span class="wb-priority-dot" style="background:' + (it.bar || WB_BLUE) + '"></span>'
      + '<div class="wb-priority-b"><span class="wb-priority-window">' + windowLabel + '</span><div class="wb-priority-t">' + it.title + '</div>'
      + '<div class="wb-priority-m">' + (it.time || it.meta || '待处理') + '</div></div>'
      + wbActBtn(it.act)
      + '</div>';
  }

  function wbBoardCol(board) {
    var h = '<div class="wb-board-col"><div class="wb-board-h"><span class="wb-board-t"><span class="wb-board-dot" style="background:' + (board.color || WB_BLUE) + '"></span>' + board.title + '</span><span class="wb-board-c">' + board.items.length + ' 项</span></div><div class="wb-board-list">';
    for (var i = 0; i < board.items.length; i++) {
      var item = board.items[i];
      var badge = WB_BADGE[item.bdg] || ['#f1f3f5', '#475569'];
      h += '<div class="wb-bitem"><div class="wb-bitem-body"><div class="nm">' + item.nm + '</div>'
        + (item.mt ? '<div class="mt">' + item.mt + '</div>' : '')
        + (item.prog != null ? '<div class="wb-prog"><span style="width:' + item.prog + '%;background:' + (item.progC || WB_BLUE) + '"></span></div>' : '')
        + '</div>'
        + (item.bdg ? '<span class="wb-bdg" style="background:' + badge[0] + ';color:' + badge[1] + '">' + item.bdg + '</span>' : '')
        + '</div>';
    }
    h += '</div>' + (board.href ? '<div class="wb-board-go">查看列表 ›</div>' : '') + '</div>';
    return board.href ? '<a class="wb-board-link" href="' + board.href + '">' + h + '</a>' : h;
  }

  function wbPmTeam(team) {
    var h = '<section class="wb-team-section"><div class="wb-team-shell"><div class="wb-team-h"><span class="wb-team-title">PM 团队分析</span><span class="wb-team-note">仅统计在职 PM 与进行中项目</span></div><div class="wb-team-kpis">';
    for (var i = 0; i < team.stats.length; i++) {
      var stat = team.stats[i];
      h += '<div class="wb-team-kpi"><div class="label">' + stat.label + '</div><div class="value">' + stat.value + '</div><div class="hint">' + stat.hint + '</div></div>';
    }
    h += '</div><div class="wb-team-grid"><div class="wb-team-panel"><div class="wb-team-panel-h"><span class="wb-team-panel-t">PM 负责学生</span><span class="wb-team-panel-n">点击查看学生明细</span></div><div class="wb-pm-list">';
    for (var p = 0; p < team.people.length; p++) {
      var person = team.people[p];
      h += '<button type="button" class="wb-pm-row" onclick="openPmStudents(' + p + ')"><span class="wb-pm-info"><span class="wb-pm-name">' + person.name + '</span><span class="wb-pm-skill">擅长：' + person.skills + '</span></span><span class="wb-pm-count"><strong>' + person.students.length + '</strong><span>名学生</span></span></button>';
    }
    h += '</div></div><div class="wb-team-panel"><div class="wb-team-panel-h"><span class="wb-team-panel-t">PM 擅长申请层次</span><span class="wb-team-panel-n">人数可重复统计</span></div><div class="wb-skill-chart"><div class="wb-chart-axis"><span>6</span><span>4</span><span>2</span><span>0</span></div>';
    for (var l = 0; l < team.levels.length; l++) {
      var level = team.levels[l];
      h += '<div class="wb-chart-item"><span class="wb-chart-value">' + level.value + ' 人</span><span class="wb-chart-bar" style="height:' + Math.round(level.value / 6 * 100) + '%"></span><span class="wb-chart-label">' + level.label + '</span></div>';
    }
    h += '</div><div class="wb-chart-caption">同一 PM 可擅长多个申请层次</div></div></div></div></section>';
    return h;
  }

  function wbBrief(value) {
    return String(value || '').split(' · ').slice(0, 2).join(' · ');
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
      h += '<div class="' + cls + '" onclick="wbCalSelect(\'' + role + '\',\'' + key + '\')"><span>' + d + '</span>' + (ev[key] ? '<small>' + ev[key].length + '项</small>' : '') + '</div>';
    }
    var tail = (7 - (off + dim) % 7) % 7;
    for (var t = 1; t <= tail; t++) h += '<div class="wb-day out">' + t + '</div>';
    h += '</div>';
    var list = ev[st.sel] || [];
    h += '<div class="wb-daydetail"><div class="wb-dd">' + wbDateLabel(st.sel) + ' · ' + (list.length ? list.length + ' 项 DDL/事件' : '无 DDL/事件') + '</div>';
    if (list.length) {
      for (var k = 0; k < list.length; k++) {
        h += '<div class="wb-ev"><span class="wb-ev-dot" style="background:' + list[k].c + '"></span><span class="tx"><strong>' + list[k].tg + '</strong> · ' + list[k].tx + '</span></div>';
      }
    } else {
      h += '<div class="wb-ev-empty">暂无事项</div>';
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

  function renderPmoWorkbench(host) {
    function esc(value) { return String(value || '').replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    var orders = window.pbsOrders.all().filter(function(order) { return pbsGetSession().role === '超级管理员' || pbsOrders.canManage(order.project); });
    var targets = orders.flatMap(function(order) { return order.targets; }), active = orders.filter(function(order) { return order.status !== '已结项'; });
    var stats = [['在管订单',active.length],['待分配目标',targets.filter(function(target) { return target.project.status !== '已结项' && !target.manager.name; }).length],['待接收目标',targets.filter(function(target) { return target.project.status !== '已结项' && target.manager.name && !target.manager.accepted; }).length],['待核验目标',targets.filter(function(target) { return target.submission.status === '待审核'; }).length],['待结项订单',orders.filter(function(order) { return order.status === '待结项'; }).length],['已结项订单',orders.length-active.length]];
    var groups = [{title:'分配与接收',color:'#6366f1',filter:function(order) { return order.status === '待分配经理' || order.status === '待接收'; }},{title:'交付进行中',color:'#2563eb',filter:function(order) { return (order.status === '进行中' || order.status === '待补充材料') && order.targets.every(function(target) { return target.manager.accepted; }); }},{title:'结项核验',color:'#d97706',filter:function(order) { return order.status === '待核验' || order.status === '待结项'; }},{title:'已结项',color:'#16a34a',filter:function(order) { return order.status === '已结项'; }}];
    var date = new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'});
    host.innerHTML = '<div class="wb-shell"><div class="wb-head"><h1 class="wb-title">PMO 工作台</h1><div class="wb-date">' + date + '</div></div><div class="wb-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + stats.map(function(stat) { return '<div class="wb-stat-wrap"><div class="wb-stat"><div class="l">' + stat[0] + '</div><div class="v">' + stat[1] + '</div></div></div>'; }).join('') + '</div><section class="wb-board-section"><div class="wb-board-section-h"><h2 class="wb-board-section-t">订单看板</h2><input id="pmoWorkbenchSearch" placeholder="搜索订单、学生或项目经理" aria-label="搜索订单" style="width:260px;padding:9px 12px;border:1px solid #dbe2ea;border-radius:9px;font-size:13px"></div><div class="wb-boards" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">' + groups.map(function(group,index) {
      var items = orders.filter(group.filter);
      return '<div class="wb-board-col" style="height:510px;border-top:3px solid ' + group.color + '"><div class="wb-board-h"><h3 class="wb-board-t">' + group.title + '</h3><span class="wb-board-c" data-pmo-count="' + index + '">' + items.length + '</span></div><div class="wb-board-list">' + items.map(function(order) {
        var p = order.project, names = Array.from(new Set(order.targets.map(function(target) { return target.manager.name; }).filter(Boolean)));
        return '<a data-pmo-card="' + index + '" data-keyword="' + esc([p.student,p.orderNo,p.projectNo,names.join(' ')].join(' ').toLowerCase()) + '" href="订单项目详情页 - 留学申请管理系统.html?project=' + encodeURIComponent(p.projectNo) + '" class="wb-bitem" style="display:block;margin-bottom:12px;border:1px solid #e2e8f0;border-radius:11px;padding:16px;background:#fff"><div class="wb-bitem-body"><div class="nm">' + esc(p.student) + ' · ' + esc(p.level) + '</div><div class="mt" style="margin:8px 0">' + esc(p.orderNo || p.projectNo) + '</div><div class="mt">' + order.targets.length + ' 个院校目标 · ' + esc(names.join('、') || '待分配经理') + '</div><div class="mt" style="margin-top:10px;color:' + group.color + '">' + esc(order.status) + '</div></div></a>';
      }).join('') + '<p data-pmo-empty="' + index + '" style="padding:28px 0;color:#94a3b8;text-align:center"' + (items.length ? ' hidden' : '') + '>暂无订单</p></div></div>';
    }).join('') + '</div></section></div>';
    host.querySelector('#pmoWorkbenchSearch').oninput = function() { var keyword = this.value.trim().toLowerCase(); host.querySelectorAll('[data-pmo-card]').forEach(function(card) { card.hidden = card.dataset.keyword.indexOf(keyword) < 0; card.style.display = card.hidden ? 'none' : 'block'; }); groups.forEach(function(group,index) { var count = Array.from(host.querySelectorAll('[data-pmo-card="' + index + '"]')).filter(function(card) { return !card.hidden; }).length; host.querySelector('[data-pmo-count="' + index + '"]').textContent = count; host.querySelector('[data-pmo-empty="' + index + '"]').hidden = !!count; }); };
    if (!host.dataset.pmoBound) { host.dataset.pmoBound = '1'; window.addEventListener('storage',function(event) { if (host.isConnected && ['pbs_projects_v1','pbs_order_management_v1'].indexOf(event.key) >= 0) renderPmoWorkbench(host); }); }
  }
  function wbRenderRole(role, host) {
    if (role === 'pmo') { renderPmoWorkbench(host); return; }
    var R = WB_ROLES[role];
    if (!R) return;
    var messageCount = 0;
    (R.todoGroups || []).forEach(function (group) { messageCount += (group.items || []).length; });
    var priorities = wbPriorityItems(role);
    var h = '<div class="wb-shell">';
    h += '<div class="wb-head"><div><h1 class="wb-title">' + R.name + '工作台</h1><p class="wb-sub">' + R.tagline + '</p></div><div class="wb-date">2026-08-18 · 周二</div></div>';
    h += '<div class="wb-stats">';
    for (var i = 0; i < R.stats.length; i++) {
      var s = R.stats[i];
      var stat = '<div class="wb-stat ' + (s.t || '') + (s.href ? ' wb-stat-link' : '') + '"><div class="l">' + s.l + '</div><div class="v">' + s.v + '</div><div class="n">' + wbBrief(s.n) + '</div>' + (s.href ? '<div class="wb-stat-go">↗</div>' : '') + '</div>';
      h += s.href ? '<a class="wb-stat-wrap" href="' + s.href + '">' + stat + '</a>' : '<div class="wb-stat-wrap">' + stat + '</div>';
    }
    h += '</div>';
    h += '<div class="wb-main"><section class="wb-panel wb-todo-panel"><div class="wb-panel-h"><span class="wb-panel-t">优先待办</span><span class="wb-panel-n">' + messageCount + ' 项</span></div>';
    for (var p = 0; p < priorities.length; p++) h += wbPriorityRow(priorities[p]);
    h += '</section><aside class="wb-panel wb-calendar-panel"><div class="wb-panel-h"><span class="wb-panel-t">关键日程</span></div><div class="wb-calendar" id="wbCal-' + role + '"></div></aside></div>';
    if (R.boards && R.boards.length) {
      h += '<section class="wb-board-section"><div class="wb-board-section-h"><span class="wb-board-section-t">数据看板</span><span class="wb-board-section-n">' + R.boards.length + ' 个数据分组</span></div><div class="wb-boards">';
      for (var b = 0; b < R.boards.length; b++) h += wbBoardCol(R.boards[b]);
      h += '</div></section>';
    }
    if (R.pmTeam) h += wbPmTeam(R.pmTeam);
    h += '</div>';
    host.innerHTML = h;
  }

  /* ---------- 通用轻提示 ---------- */
  function workbenchToast(message) {
    var old = document.getElementById('wbToast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'wbToast';
    toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:120;padding:10px 16px;border-radius:10px;background:#2a2a30;color:#fff;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.18)';
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
    var note = document.getElementById('urgeNote') ? document.getElementById('urgeNote').value.trim() : '';
    closeUrgeModal();
    if (window.pbsSendUrgeNotification) window.pbsSendUrgeNotification({ task: urgeContext.task, target: urgeContext.target, role: urgeContext.role, note: note });
    if (window.pbsShowUrgeSuccess) window.pbsShowUrgeSuccess();
  }

  function ensurePmStudentsModal() {
    var modal = document.getElementById('wbPmStudentsModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'wbPmStudentsModal';
    modal.className = 'wb-pm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="wb-pm-dialog"><div class="wb-pm-modal-h"><div id="wbPmStudentsTitle" class="wb-pm-modal-t">PM · 当前负责学生</div><button type="button" class="wb-pm-close" onclick="closePmStudents()" aria-label="关闭">×</button></div><div id="wbPmStudentsBody" class="wb-pm-modal-b"></div></div>';
    modal.addEventListener('click', function (event) { if (event.target === modal) closePmStudents(); });
    document.body.appendChild(modal);
    return modal;
  }
  function openPmStudents(index) {
    var team = WB_ROLES.orgadmin && WB_ROLES.orgadmin.pmTeam;
    var person = team && team.people[index];
    if (!person) return;
    var modal = ensurePmStudentsModal();
    document.getElementById('wbPmStudentsTitle').textContent = person.name + ' · 当前负责学生';
    var h = '<div class="wb-student-grid">';
    for (var i = 0; i < person.students.length; i++) {
      var student = person.students[i];
      h += '<section class="wb-student-card"><div class="wb-student-h"><span class="wb-student-name">' + student.name + '</span></div>';
      for (var t = 0; t < student.targets.length; t++) {
        var target = student.targets[t];
        h += '<div class="wb-target"><div class="wb-target-name">' + target.school + ' · ' + target.major + '</div><div class="wb-target-package">' + target.packageName + '</div></div>';
      }
      h += '</section>';
    }
    h += '</div>';
    document.getElementById('wbPmStudentsBody').innerHTML = h;
    modal.classList.add('is-open');
  }
  function closePmStudents() {
    var modal = document.getElementById('wbPmStudentsModal');
    if (modal) modal.classList.remove('is-open');
  }

  /* ================= 角色 ↔ 工作台视角映射 ================= */
  var WB_KEY_ORDER = ['platform', 'orgadmin', 'pmo', 'salesmanager', 'sales', 'pm', 'writer', 'audit', 'apply', 'docadmin'];
  var WB_ROLE_KEY = {
    'PMO': 'pmo',
    '项目经理': 'pm',
    '文书人员': 'writer',
    '销售人员': 'sales',
    '销售人员管理员': 'salesmanager',
    '网申人员': 'apply',
    '文书审核': 'audit',
    '平台运维人员': 'platform',
    '机构管理员': 'orgadmin',
    '文书机构管理员': 'docadmin'
  };
  var WB_KEY_LABEL = {
    pmo: 'PMO',
    pm: '项目经理', writer: '文书人员',
    salesmanager: '销售人员管理员', sales: '销售人员', apply: '网申人员', audit: '文书审核',
    platform: '平台运维人员', orgadmin: '机构管理员', docadmin: '文书机构管理员'
  };

  /* ================= 挂载入口 =================
     host: 容器元素；keys: 当前用户可见的工作台视角（按 WB_KEY_ORDER 排序）；
     页面仅渲染 Navbar 当前角色对应的工作台。 */
  function mountWorkbench(host, keys, opts) {
    ensureStyle();
    opts = opts || {};
    var active = opts.active && keys.indexOf(opts.active) >= 0 ? opts.active : keys[0];
    host.innerHTML = '<div id="panel-' + active + '" class="role-panel" data-role="' + active + '"></div>';
    var panel = document.getElementById('panel-' + active);
    if (!WB_CAL[active]) {
      WB_CAL[active] = active === 'pm' || active === 'orgadmin'
        ? { y: 2026, m: 9, sel: '2026-09-15' }
        : { y: 2026, m: 8, sel: WB_TODAY };
    }
    wbRenderRole(active, panel);
    if (active !== 'pmo') wbRenderCal(active);
    ensureUrgeModal();
  }

  /* ---------------- 全局导出（生成内容的 onclick 依赖以下全局函数） ---------------- */
  window.wbCalShift = wbCalShift;
  window.wbCalSelect = wbCalSelect;
  window.openUrgeModal = openUrgeModal;
  window.closeUrgeModal = closeUrgeModal;
  window.sendUrge = sendUrge;
  window.openPmStudents = openPmStudents;
  window.closePmStudents = closePmStudents;
  window.workbenchToast = workbenchToast;
  window.pbsWorkbench = {
    KEY_ORDER: WB_KEY_ORDER,
    ROLE_KEY: WB_ROLE_KEY,
    KEY_LABEL: WB_KEY_LABEL,
    mount: mountWorkbench
  };
})();
