(function () {
  'use strict';
  var api = window.pbsStudents, projects = window.pbsProjects;
  if (!api || !projects) return;
  var formalId = 'STU-ARCHIVE-MERGE', preId = 'PRE-ARCHIVE-MERGE', serviceId = 'SEL-202611-0901';
  var name = '档案合并测试', now = '2026-11-09T09:00:00+08:00', session = pbsGetSession();
  var org = session.org === 'PBS留学' ? 'PBS留学总部' : session.org || 'PBS留学总部';
  var definitions = {
    edu:[['start','起始时间'],['end','终止时间'],['school','就读学校'],['addr','学校地址'],['major','专业'],['grade','成绩'],['duration','学制'],['education','学历'],['degree','所获学位']],
    qual:[['qn','资质名称'],['org','发证机构'],['date','获取日期'],['no','资质编号'],['valid','有效期']],
    work:[['co','公司名称'],['post','岗位'],['start','开始时间'],['end','结束时间'],['desc','工作内容'],['ref','证明人及联系方式']],
    practice:[['org','组织名称'],['role','角色'],['start','开始时间'],['end','结束时间'],['act','活动内容'],['gain','收获/成果']],
    honor:[['hn','荣誉名称'],['org','颁奖机构'],['date','获奖日期'],['lvl','荣誉级别'],['note','相关说明']],
    pub:[['title','论文标题'],['journal','发表刊物'],['date','发表日期'],['order','作者排序'],['doi','DOI/链接'],['jlvl','刊物级别']]
  };
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function field(key,label,value) { return '<div data-f="' + key + '"><p class="text-xs text-gray-400 mb-1">' + esc(label) + '</p><p class="text-sm font-medium text-gray-900" data-v="' + key + '">' + esc(value || '—') + '</p></div>'; }
  function saved(html) { return {html:html,values:{},labels:{}}; }
  function records(section,rows) {
    return saved('<div class="flex justify-end mb-4"><button class="pa-text-button" onclick="addRecord(\'' + section + '\')">＋ 新增记录</button></div><div id="records-' + section + '" class="space-y-4">' + rows.map(function(row,index) {
      return '<div class="border border-gray-200 rounded-xl p-4" data-record data-record-key="merge-' + section + '-' + index + '"><div class="flex items-center justify-between mb-3"><span class="text-sm text-gray-500">' + (index + 1) + '</span><div class="flex items-center gap-3"><button class="pa-text-button" onclick="editRecord(this)">编辑</button><button class="pa-text-button" onclick="delRecord(this)">删除</button></div></div><div class="grid grid-cols-3 gap-x-6 gap-y-4">' + definitions[section].map(function(item) { return field(item[0],item[1],row[item[0]]); }).join('') + '</div></div>';
    }).join('') + '</div>');
  }
  function language(values) {
    return saved('<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + [['ielts','雅思成绩'],['toefl','托福成绩']].map(function(exam) {
      return '<div class="bg-blue-50/60 border-blue-100 border rounded-xl p-5"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-semibold text-gray-800">' + exam[1] + '</h3><div data-f="' + exam[0] + 'T" class="flex items-baseline gap-1.5"><span class="text-xs text-gray-400">总分</span><span class="text-xl font-bold text-blue-600" data-v="' + exam[0] + 'T">' + esc(values[exam[0] + 'T'] || '—') + '</span></div></div><div class="grid grid-cols-4 gap-3">' + [['L','听力'],['R','阅读'],['W','写作'],['S','口语']].map(function(item) { return '<div class="bg-white/70 rounded-lg p-2.5 text-center">' + field(exam[0] + item[0],item[1],values[exam[0] + item[0]]) + '</div>'; }).join('') + '</div></div>';
    }).join('') + '</div>');
  }
  function scores(values) { return saved('<div class="grid grid-cols-2 gap-4">' + [['sat','SAT'],['ap','AP'],['alevel','A-Level'],['ib','IB'],['gre','GRE'],['gmat','GMAT']].map(function(item) { return '<div class="bg-gray-50 border border-gray-100 rounded-xl p-4">' + field(item[0],item[1],values[item[0]]) + '</div>'; }).join('') + '</div>'); }
  var profiles = api.all(), target = api.find(formalId), source = api.find(preId);
  if (!target || !Object.keys(target.sections || {}).length) {
    target = {id:formalId,name:name,org:org,student:{name:name,level:'硕士申请',gender:'女',birth:'2003-05-18',phone:'13800007001',address:'南京市鼓楼区',country:'美国',major:'人工智能'},customer:{name:name,relation:'本人',phone:'13800007001',wechat:'archive_merge',source:'线下咨询'},orderNos:['20261109901'],sections:{},logs:[],createdAt:now,updatedAt:now};
    target.sections.edu = records('edu',[{school:'南京大学',major:'计算机科学与技术',start:'2021-09',end:'2025-06',grade:'3.5 / 4.0',education:'本科',duration:'4 年'}]);
    target.sections.lang = language({ieltsT:'6.5',ieltsL:'7.0',ieltsR:'6.5',ieltsW:'6.0',ieltsS:'6.5'});
    target.sections.score = scores({});
    target.sections.work = records('work',[{co:'南京大学智能计算实验室',post:'科研助理',start:'2024-03',end:'2024-12',desc:'整理实验数据并参与模型评估。'}]);
    var targetIndex = profiles.findIndex(function(profile) { return profile.id === formalId; });
    if (targetIndex >= 0) profiles[targetIndex] = target; else profiles.unshift(target);
  }
  if (!source) {
    source = {id:preId,kind:'preliminary',name:name,org:target.org,selectionId:serviceId,createdBy:session.name,student:{name:name,level:'硕士申请',gender:'女',birth:'2003-05-18',phone:'13800007002',address:'南京市鼓楼区',country:'美国',major:'人工智能'},customer:{name:name,relation:'本人',phone:'13800007001'},supplement:'GPA 3.8 / 4.0，希望申请人工智能方向，关注科研机会，年度预算45万元人民币。',sections:{},orderNos:[],logs:[],createdAt:now,updatedAt:now};
    source.sections.edu = records('edu',[
      {school:'南京大学',major:'计算机科学与技术',start:'2021-09',end:'2025-06',grade:'3.8 / 4.0',education:'本科',duration:'4 年',degree:'工学学士'},
      {school:'香港理工大学',major:'数据科学交流课程',start:'2023-09',end:'2023-12',education:'本科交流',grade:'A'}
    ]);
    source.sections.lang = language({ieltsT:'7.0',ieltsL:'7.5',ieltsR:'7.0',ieltsW:'6.5',ieltsS:'7.0'});
    source.sections.score = scores({gre:'325'});
    source.sections.qual = records('qual',[{qn:'计算机技术与软件专业技术资格',org:'工业和信息化部',date:'2024-11',no:'SOFT-2024-0731',valid:'长期有效'}]);
    source.sections.work = records('work',[{co:'星海科技有限公司',post:'数据分析实习生',start:'2025-06',end:'2025-09',desc:'搭建业务数据看板，完成用户行为分析。'}]);
    source.sections.practice = records('practice',[{org:'大学生创新训练项目',role:'项目负责人',start:'2023-06',end:'2024-06',act:'研究多模态数据分类方法，负责实验设计与团队协作。',gain:'完成原型系统并通过项目结题。'}]);
    source.sections.honor = records('honor',[{hn:'优秀毕业生',org:'南京大学',date:'2025-06',lvl:'校级',note:'学业表现与综合测评优秀。'}]);
    source.sections.pub = records('pub',[{title:'多模态学习中的数据表示方法研究',journal:'计算机应用研究',date:'2025-04',order:'第二作者',jlvl:'中文期刊'}]);
    profiles.push(source);
  }
  localStorage.setItem('pbs_student_profiles_v1',JSON.stringify(profiles));
  if (!projects.find('PRJ-M-2611-0901')) projects.upsert({projectNo:'PRJ-M-2611-0901',orderNo:'20261109901',subOrderNo:'SUB-MERGE-001',studentId:formalId,customer:name,student:name,level:'硕士申请',source:'线上',sourceChannel:'商城订单',org:target.org,projectManager:'张老师',pmAccepted:true,status:'进行中',createdAt:'2026-11-09 09:00',packages:[{id:'cmu',school:'卡内基梅隆大学',major:'人工智能',name:'院校申请套餐',services:[{name:'PS',price:1800},{name:'网申提交证明',price:1200}]}],serviceStages:['文书','网申','结项']});
  if (window.pbsSelection) pbsSelection.seed();
  var tasksKey = 'pbs_selection_services_v1', storedTasks = localStorage.getItem(tasksKey);
  if (storedTasks) {
    var tasks = JSON.parse(storedTasks);
    if (!tasks.some(function(item) { return item.id === serviceId; })) {
      tasks.unshift({id:serviceId,preStudentId:preId,customer:name,student:name,level:'硕士申请',gender:'女',birth:'2003-05-18',phone:'13800007002',address:'南京市鼓楼区',country:'美国',major:'人工智能',org:target.org,sales:session.name || '陈晨',status:'咨询中',note:'人工智能方向，关注科研机会与课程设置，年度预算45万元人民币。',supplement:source.supplement,createdAt:now,visits:[],shares:[]});
      localStorage.setItem(tasksKey,JSON.stringify(tasks));
    }
  }
  if (localStorage.getItem('pbs_archive_merge_demo_files_v1')) return;
  var fileSpecs = [
    {id:'merge-demo-ielts',name:'档案合并测试-雅思成绩单.txt',category:'lang',text:'雅思总分：7.5\n听力：8.0\n阅读：7.5\n写作：7.0\n口语：7.5',parseFields:[['ieltsT','雅思总分','7.5'],['ieltsL','雅思听力','8.0'],['ieltsR','雅思阅读','7.5'],['ieltsW','雅思写作','7.0'],['ieltsS','雅思口语','7.5']].map(function(item) { return {sel:'#sec-lang [data-v="' + item[0] + '"]',label:item[1],value:item[2]}; })},
    {id:'merge-demo-work',name:'档案合并测试-实习证明.txt',category:'work',text:'公司：星海科技有限公司\n岗位：数据分析实习生\n起止时间：2025年6月至9月\n证明人：周经理，025-88880000',parseFields:[['co','公司名称','星海科技有限公司'],['post','岗位','数据分析实习生'],['start','开始时间','2025-06'],['end','结束时间','2025-09'],['ref','证明人及联系方式','周经理 · 025-88880000']].map(function(item) { return {sel:'#records-work [data-v="' + item[0] + '"]',label:item[1],value:item[2]}; })}
  ];
  var request = indexedDB.open('pbs_student_assets_v1',1);
  request.onupgradeneeded = function() { request.result.createObjectStore('files',{keyPath:'id'}); };
  request.onsuccess = function() {
    var db = request.result, tx = db.transaction('files','readwrite'), store = tx.objectStore('files'), query = store.getAll(), added = false;
    query.onsuccess = function() {
      fileSpecs.forEach(function(spec) {
        if (query.result.some(function(item) { return item.id === spec.id; })) return;
        store.put({id:spec.id,owner:preId,name:spec.name,category:spec.category,size:'1 KB',date:'2026-11-09',file:new Blob([spec.text],{type:'text/plain;charset=utf-8'}),parseFields:spec.parseFields}); added = true;
      });
    };
    tx.oncomplete = function() { db.close(); localStorage.setItem('pbs_archive_merge_demo_files_v1','1'); if (added && window.PBS_STUDENT_ID === preId) location.reload(); };
    tx.onerror = function() { db.close(); };
  };
})();
