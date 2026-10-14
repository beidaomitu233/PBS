(function () {
  'use strict';
  var key = 'pbs_selection_services_v1', bindingKey = 'pbs_selection_order_bindings_v1';
  function read(store) { try { return JSON.parse(localStorage.getItem(store || key) || '[]'); } catch(e) { return []; } }
  function save(list, store) { localStorage.setItem(store || key, JSON.stringify(list)); }
  function orgName(value) { return !value || value === 'PBS留学' ? 'PBS留学总部' : value; }
  function find(id) { return read().find(function(item) { return item.id === id; }); }
  function update(id, values) { var list = read(), item = list.find(function(row) { return row.id === id; }); if (!item) return null; Object.assign(item, values); save(list); return item; }
  function bindings() { return read(bindingKey); }
  function orders(includeHidden) {
    var groups = [];
    window.pbsProjects.all().forEach(function(project) {
      if (!project.studentId || !includeHidden && !pbsStudents.canView(project.studentId)) return;
      var id = orgName(project.org) + '|' + (project.orderNo || project.projectNo), group = groups.find(function(item) { return item.key === id; });
      if (!group) { group = {key:id, orderNo:project.orderNo || '', projectNo:project.projectNo, studentId:project.studentId, org:orgName(project.org), projects:[]}; groups.push(group); }
      group.projects.push(project);
    });
    return groups;
  }
  function create(values) {
    var now = new Date(), session = pbsGetSession();
    var item = Object.assign({}, values, {id:'SEL-' + String(now.getFullYear()).slice(2) + String(now.getMonth()+1).padStart(2,'0') + '-' + now.getTime().toString().slice(-7) + Math.random().toString(36).slice(2,4), org:orgName(session.org), sales:session.name, status:'未选校', createdAt:now.toISOString(), visits:[], shares:[]});
    var list = read(); list.push(item); save(list); return item;
  }
  function visible() {
    var session = pbsGetSession();
    return read().filter(function(item) {
      if (session.role === '超级管理员') return true;
      return orgName(item.org) === orgName(session.org) && (session.role !== '销售人员' || item.sales === session.name);
    });
  }
  function candidates(studentId) {
    var profile = pbsStudents.find(studentId);
    if (!profile || !pbsStudents.canView(studentId)) return [];
    return read().filter(function(item) { return orgName(item.org) === orgName(profile.org); });
  }
  function audit(studentId, action, previous) {
    var profiles = JSON.parse(localStorage.getItem('pbs_student_profiles_v1') || '[]'), profile = profiles.find(function(item) { return item.id === studentId; });
    if (profile && !profile.sections.selectionBinding) {
      var before = {};
      previous.filter(function(item) { return item.studentId === studentId; }).forEach(function(item) { before[item.orderKey] = item.serviceId; });
      profile.sections.selectionBinding = {values:before};
      localStorage.setItem('pbs_student_profiles_v1',JSON.stringify(profiles));
    }
    var values = {}, labels = {};
    orders().filter(function(item) { return item.studentId === studentId; }).forEach(function(item) { labels[item.key] = '申请订单 ' + (item.orderNo || item.projectNo) + ' · 选校任务'; });
    bindings().filter(function(item) { return item.studentId === studentId; }).forEach(function(item) {
      values[item.orderKey] = item.serviceId;
      labels[item.orderKey] = '申请订单 ' + (item.orderNo || item.projectNo) + ' · 选校任务';
    });
    pbsStudents.commit(studentId, 'selectionBinding', {values:values}, labels, action);
  }
  function bind(studentId, selectedOrder, serviceId) {
    if (!pbsStudents.canEdit(studentId)) return {error:'无权修改该学生档案'};
    var order = orders().find(function(item) { return item.key === selectedOrder && item.studentId === studentId; });
    var service = candidates(studentId).find(function(item) { return item.id === serviceId; });
    if (!order || !service) return {error:'请选择有效的申请订单和选校任务'};
    var list = bindings();
    if (list.some(function(item) { return item.orderKey === order.key; })) return {error:'该申请订单已关联选校任务'};
    var item = {orderKey:order.key, orderNo:order.orderNo, projectNo:order.projectNo, studentId:studentId, serviceId:serviceId, boundAt:new Date().toISOString(), boundBy:pbsGetSession().name};
    var previous = list.slice();
    list.push(item); save(list, bindingKey); audit(studentId, '关联选校任务', previous); return item;
  }
  function unbind(studentId, selectedOrder) {
    if (!pbsStudents.canEdit(studentId)) return false;
    var list = bindings(), item = list.find(function(row) { return row.studentId === studentId && row.orderKey === selectedOrder; });
    if (!item) return false;
    save(list.filter(function(row) { return row !== item; }), bindingKey); audit(studentId, '解除选校任务关联', list); return true;
  }
  function transition(id, action) {
    var item = find(id); if (!item) return;
    if (item.status === '已结单') return item;
    var status = {save:'咨询中', share:'已发送', close:'已结单'}[action];
    return status ? update(id, {status:status}) : item;
  }
  function recordView(id, version) {
    var item = find(id); if (!item) return;
    var visits = item.visits || [];
    visits.push({id:'VIEW-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), at:new Date().toISOString(), version:version, kind:'查看方案'});
    update(id, {visits:visits});
  }
  function migrateBindings() {
    var list = read(), linked = bindings(), changed = false;
    list.forEach(function(item) {
      if (!item.orderKey || !item.studentId) return;
      var order = item.orderKey.replace(/^PBS留学\|/, 'PBS留学总部|');
      if (!linked.some(function(row) { return row.orderKey === order; })) linked.push({orderKey:order, orderNo:item.orderNo || '', projectNo:item.projectNo, studentId:item.studentId, serviceId:item.id, boundAt:item.createdAt, boundBy:item.sales});
      ['orderKey','orderNo','projectNo','studentId'].forEach(function(field) { delete item[field]; }); changed = true;
    });
    if (changed) { save(linked, bindingKey); save(list); }
  }
  function seed() {
    if (localStorage.getItem(key)) return;
    var session = pbsGetSession(), names = ['陈雨桐','李雪','王伟','赵婷','陈晓'], states = ['未选校','咨询中','已发送','已结单','未选校'];
    var list = names.map(function(name,index) {
      return {id:'SEL-2607-000' + (index+1), org:orgName(session.org), student:name, level:index===2?'博士申请':'硕士申请', country:'美国', major:index===3?'经济学':'计算机科学', sales:session.role === '销售人员' ? session.name : '陈晨', status:states[index], note:'学生关注课程设置、科研机会与就业资源。', createdAt:'2026-07-' + (15+index) + 'T09:00:00+08:00', visits:index===2 ? [{id:'demo-view-1', at:'2026-10-12T14:30:00+08:00', version:'V1', kind:'查看方案'}] : [], shares:[]};
    });
    list.forEach(function(item) {
      if (item.status === '未选校') return;
      var snapshot = {version:'V1', savedAt:item.createdAt, recommendation:'结合学生申请方向与背景，按冲刺、匹配和保底安排院校梯度。', zones:{reach:[{id:'cmu',name:'卡内基梅隆大学',program:'计算机科学',reason:'课程与研究方向匹配，作为冲刺目标。'}],match:[{id:'uiuc',name:'伊利诺伊大学厄巴纳-香槟分校',program:'计算机科学',reason:'专业背景匹配，课程设置符合申请方向。'}],safe:[{id:'bu',name:'波士顿大学',program:'计算机科学',reason:'录取梯度稳妥，可补充方案覆盖。'}]}};
      if (!localStorage.getItem('pbs_selection_plan_versions_'+item.id)) { localStorage.setItem('pbs_selection_plan_versions_'+item.id,JSON.stringify([snapshot])); localStorage.setItem('pbs_selection_plan_version_'+item.id,'1'); localStorage.setItem('pbs_selection_plan_recommendation_'+item.id,snapshot.recommendation); }
      if (item.status === '已发送') item.shares = [{id:'H5-DEMO-'+item.id,version:'V1',at:item.createdAt,snapshot:snapshot}];
    });
    save(list);
  }
  migrateBindings();
  window.pbsSelection = {all:function(){return read();}, find:find, update:update, orders:orders, create:create, visible:visible, candidates:candidates, bindings:bindings, bind:bind, unbind:unbind, transition:transition, recordView:recordView, seed:seed};
})();
