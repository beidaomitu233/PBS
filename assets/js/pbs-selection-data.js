(function () {
  'use strict';
  var key = 'pbs_selection_services_v1';
  function read() { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
  function save(list) { localStorage.setItem(key, JSON.stringify(list)); }
  function find(id) { return read().find(function(item) { return item.id === id; }); }
  function update(id, values) { var list = read(), item = list.find(function(row) { return row.id === id; }); if (!item) return null; Object.assign(item, values); save(list); return item; }
  function orderKey(project) { return (project.org || 'PBS留学总部') + '|' + (project.orderNo || project.projectNo); }
  function orders(includeHidden) {
    var groups = [];
    window.pbsProjects.all().forEach(function(project) {
      if (!project.studentId || !includeHidden && !pbsStudents.canView(project.studentId)) return;
      var key = orderKey(project), group = groups.find(function(item) { return item.key === key; });
      if (!group) { group = {key:key, orderNo:project.orderNo || '', projectNo:project.projectNo, studentId:project.studentId, org:project.org, projects:[]}; groups.push(group); }
      group.projects.push(project);
    });
    groups.forEach(function(group) {
      var profile = pbsStudents.find(group.studentId);
      group.student = profile.name; group.customer = profile.customer.name || group.projects[0].customer; group.level = profile.student.level || group.projects[0].level;
      group.goals = group.projects.reduce(function(count, project) { return count + (project.packages || []).length; }, 0);
    });
    return groups;
  }
  function create(order, values) {
    if (read().some(function(item) { return item.orderKey === order.key; })) return null;
    var now = new Date(), id = 'SEL-' + String(now.getFullYear()).slice(2) + String(now.getMonth()+1).padStart(2,'0') + '-' + now.getTime().toString().slice(-7);
    var item = Object.assign({id:id, orderKey:order.key, orderNo:order.orderNo, projectNo:order.projectNo, studentId:order.studentId, org:order.org, student:order.student, customer:order.customer, level:order.level, status:'未选校', createdAt:now.toISOString(), visits:[], shares:[]}, values);
    var list = read(); list.push(item); save(list); return item;
  }
  function visible() {
    var session = pbsGetSession();
    return read().filter(function(item) { return pbsStudents.canView(item.studentId) && (session.role !== '销售人员' || item.sales === session.name); });
  }
  function transition(id, action) {
    var item = find(id); if (!item) return;
    if (item.status === '已结单') return item;
    var status = {save:'咨询中', share:'已发送', close:'已结单'}[action];
    return status ? update(id, {status:status}) : item;
  }
  function seed() {
    if (localStorage.getItem(key)) return;
    var keys = ['PRJ-M-2607-0007','PRJ-M-2607-0002','PRJ-O-2607-0003','PRJ-M-2607-0004','PRJ-O-2607-0005'];
    var states = ['未选校','咨询中','已发送','已结单','未选校'], all = orders(true), list = [];
    keys.forEach(function(projectNo, index) {
      var order = all.find(function(item) { return item.projects.some(function(project) { return project.projectNo === projectNo; }); });
      if (!order) return;
      list.push({id:'SEL-2607-000' + (index+1), orderKey:order.key, orderNo:order.orderNo, projectNo:order.projectNo, studentId:order.studentId, org:order.org, student:order.student, customer:order.customer, level:order.level, country:index===2?'英国':'美国', major:index===3?'经济学':'计算机科学', sales:pbsGetSession().role === '销售人员' ? pbsGetSession().name : '陈晨', status:states[index], note:'学生关注课程设置、科研机会与就业资源。', createdAt:'2026-07-' + (15+index) + 'T09:00:00+08:00', visits:index===2 ? [{id:'demo-visit-1', at:'2026-10-12T14:30:00+08:00', visitor:'匿名访客 A', version:'V1', kind:'打开方案'},{id:'demo-visit-2', at:'2026-10-12T14:32:00+08:00', visitor:'匿名访客 A', version:'V1', kind:'查看院校', school:'卡内基梅隆大学'}] : [], shares:[]});
    });
    list.forEach(function(item) {
      if(item.status==='未选校')return;
      var snapshot={version:'V1',savedAt:item.createdAt,recommendation:'结合学生申请方向与背景，按冲刺、匹配和保底安排院校梯度。',zones:{reach:[{id:'cmu',name:'卡内基梅隆大学',program:'计算机科学',reason:'课程与研究方向匹配，作为冲刺目标。'}],match:[{id:'uiuc',name:'伊利诺伊大学厄巴纳-香槟分校',program:'计算机科学',reason:'专业背景匹配，课程设置符合申请方向。'}],safe:[{id:'bu',name:'波士顿大学',program:'计算机科学',reason:'录取梯度稳妥，可补充方案覆盖。'}]}};
      if(!localStorage.getItem('pbs_selection_plan_versions_'+item.id)){localStorage.setItem('pbs_selection_plan_versions_'+item.id,JSON.stringify([snapshot]));localStorage.setItem('pbs_selection_plan_version_'+item.id,'1');localStorage.setItem('pbs_selection_plan_recommendation_'+item.id,snapshot.recommendation);}
      if(item.status==='已发送')item.shares=[{id:'H5-DEMO-'+item.id,version:'V1',at:item.createdAt,snapshot:snapshot}];
    });
    save(list);
  }
  window.pbsSelection = {all:read, find:find, update:update, orders:orders, create:create, visible:visible, transition:transition, seed:seed};
})();
