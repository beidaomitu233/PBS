(function () {
  'use strict';
  var seeds = [
    { id: 1, name: 'CMU 计算机学院网申模板', school: '卡内基梅隆大学', college: '计算机学院', boundPrograms: ['计算机科学', '人工智能', '软件工程'], region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v3.2', fields: 96, materials: 6, updated: '2026-08-08', review: '多个专业复用通用字段，各专业差异字段已独立维护。' },
      { version: 'v3.1', fields: 92, materials: 6, updated: '2026-07-18', review: '申请轮次与通信地址字段需人工核对。' },
      { version: 'v2.8', fields: 88, materials: 5, updated: '2026-05-26', review: '可作为旧申请季结构参考。' }
    ] },
    { id: 6, name: 'CMU 人文学院网申模板', school: '卡内基梅隆大学', college: '人文学院', program: '中国哲学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v1.2', fields: 28, materials: 6, updated: '2026-08-02', review: '无待复核项。' }
    ] },
    { id: 2, name: '斯坦福计算机科学网申案例', school: '斯坦福大学', college: '工程学院', program: '计算机科学', region: '美国', org: 'PBS留学总部', versions: [
      { version: 'v2.4', fields: 38, materials: 7, updated: '2026-08-05', review: '无待复核项。' },
      { version: 'v2.3', fields: 37, materials: 7, updated: '2026-06-11', review: '推荐信要求需按当前申请季复核。' }
    ] },
    { id: 3, name: '哥伦比亚金融工程网申案例', school: '哥伦比亚大学', college: '工程与应用科学学院', program: '金融工程', region: '美国', org: '上海启明留学', versions: [
      { version: 'v2.1', fields: 35, materials: 8, updated: '2026-08-01', review: 'GRE 是否可选需结合当前轮次核对。' }
    ] },
    { id: 4, name: '剑桥金融学网申案例', school: '剑桥大学', college: '商学院', program: '金融学', region: '英国', org: '北京知行教育', versions: [
      { version: 'v1.8', fields: 31, materials: 7, updated: '2026-07-28', review: '研究计划字段与本申请季官网存在差异，需项目经理复核。' }
    ] },
    { id: 5, name: '香港大学数据科学网申案例', school: '香港大学', college: '计算与数据科学学院', program: '数据科学', region: '中国香港', org: '上海启明留学', versions: [
      { version: 'v1.6', fields: 29, materials: 6, updated: '2026-07-25', review: '无待复核项。' }
    ] }
  ];
  ['上海启明留学','北京知行教育'].forEach(function(org,index) {
    seeds.push({id:7+index,name:'纽约大学工程学院网申模板',school:'纽约大学',college:'工程学院',region:'美国',org:org,boundPrograms:['计算机科学','数据科学'],versions:[{version:index?'v2.1':'v3.0',fields:4,materials:2,updated:'2026-11-09',entranceDetails:[{id:'entry-main',name:'研究生申请入口',stage:'硕士',channel:'直申',isDefault:true,url:''}],pageDetails:[{id:'page-1',name:'个人信息',entranceId:'entry-main',programScope:'common'}],fieldDetails:[{name:'First Name',type:'文本',required:true,note:'与护照姓名一致',pageId:'page-1',programScope:'common'},{name:'Last Name',type:'文本',required:true,note:'与护照姓氏一致',pageId:'page-1',programScope:'common'},{name:'Email',type:'邮箱',required:true,note:'填写申请邮箱',pageId:'page-1',programScope:'common'},{name:'Date of Birth',type:'日期',required:true,note:'填写出生日期',pageId:'page-1',programScope:'common'}],materialDetails:[{name:'简历（CV）',required:true,note:'PDF 格式'},{name:'本科成绩单',required:true,note:'中英文成绩单'}]}]});
  });
  var institutionKey = 'pbs_web_application_templates_v2', platformKey = 'pbs_platform_application_templates_v1', publicationKey = 'pbs_application_template_publications_v1';
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isPublisher(action) { var role = window.pbsGetSession && pbsGetSession().role; return (role === '超级管理员' || role === '平台运维人员') && (!action || pbsHasPermission('app_template_publish_' + action)); }
  function nextVersion(versions) { return 'V' + ((versions || []).reduce(function(max,item) { var n = Number(String(item.version).replace(/^v/i,'')); return Math.max(max,Number.isFinite(n) ? Math.floor(n) : 0); },0) + 1); }
  function overwriteCandidates(school,college) { return read(platformKey).filter(function(item) { return item.school === school && item.college === college; }); }
  function extractionOf(source) {
    var found;
    read(platformKey).some(function(draft) {
      var version = draft.versions.find(function(item) { return item.sourceTemplateId === source.id && item.sourceOrg === source.org && item.sourceTemplateVersion === source.versions[0].version; });
      if (!version && draft.sourceTemplateId === source.id && draft.sourceOrg === source.org && draft.sourceTemplateVersion === source.versions[0].version) version = draft.versions[0];
      if (version) { found = {template:draft,version:version}; return true; }
    });
    return found;
  }
  function institutions() {
    var list = clone(seeds), stored = read(institutionKey);
    stored.forEach(function(item) { list = list.filter(function(row){return Number(row.id)!==Number(item.id);});list.push(item); });
    list.forEach(function(item) { if(!item.boundPrograms) item.boundPrograms = item.program ? [item.program] : []; });
    return list.filter(function(item) { return !item.sourcePlatformTemplateId; });
  }
  function extract(id, targetId) {
    if (!isPublisher('create')) return null;
    var source = institutions().find(function(item){return Number(item.id)===Number(id);}); if(!source)return null;
    var list = read(platformKey), version = source.versions[0].version, done = extractionOf(source);
    if(done)return done.template;
    var target = targetId && list.find(function(item) { return Number(item.id) === Number(targetId); });
    if (!targetId && list.some(function(item) { return item.school === source.school && item.college === source.college; })) return null;
    if (targetId && (!target || target.school !== source.school || target.college !== source.college)) return null;
    if (target && !isPublisher('edit')) return null;
    var draft = clone(source); draft.id = Date.now(); while(list.some(function(item){return item.id === draft.id;}))draft.id++;
    draft.org = '平台'; draft.sourceTemplateId = source.id; draft.sourceOrg = source.org; draft.sourceTemplateVersion = version;
    draft.updatedAt=new Date().toISOString();
    var incoming = clone(source.versions[0]); incoming.version = target ? nextVersion(target.versions) : 'V1';
    incoming.sourceTemplateId = source.id; incoming.sourceOrg = source.org; incoming.sourceTemplateVersion = version;
    incoming.savedAt = draft.updatedAt; incoming.updated = draft.updatedAt.slice(0,10);
    draft.versions = [incoming].concat(target ? target.versions : []);
    if (target) { draft.id = target.id; list = list.filter(function(item) { return item.id !== target.id; }); }
    list.push(draft);localStorage.setItem(platformKey,JSON.stringify(list));return draft;
  }
  function publish(id, scope) {
    var result=publishMany([id],scope);return result.error?result:result[0];
  }
  function publishMany(ids, scope) {
    if (!isPublisher('edit')) return {error:'无权发布模板'};
    var drafts=read(platformKey),selected=Array.from(new Set(ids.map(Number))).map(function(id){return drafts.find(function(item){return Number(item.id)===id;});});
    if(!selected.length || selected.some(function(item){return !item;}))return {error:'请选择有效的模板'};
    var incomplete=selected.filter(function(item){return !item.name || !item.school || !item.college || !item.versions.length;});
    if(incomplete.length)return {error:'请填写模板名称、学校和学院：'+incomplete.map(function(item){return item.name || '未命名模板';}).join('、')};
    if(!scope.length)return {error:'请选择发布范围'};
    var list=read(publicationKey);
    var created=selected.map(function(draft,index){var serial=Date.now()+index;while(list.some(function(item){return item.id==='PUB-'+serial;}))serial++;var item={id:'PUB-'+serial,templateId:draft.id,version:draft.versions[0].version,scope:scope.slice(),at:new Date().toISOString(),publisher:pbsGetSession().name,snapshot:clone(draft)};item.snapshot.versions=item.snapshot.versions.slice(0,1);list.push(item);return item;});
    localStorage.setItem(publicationKey,JSON.stringify(list));
    syncInstitutionTemplates();
    return created;
  }
  function available() { var org = pbsGetSession().org; if(org==='PBS留学')org='PBS留学总部';return read(publicationKey).filter(function(item){return isPublisher() || item.scope.includes('*') || item.scope.includes(org);}); }
  function seedPublications() {
    if(!isPublisher() || localStorage.getItem('pbs_template_publication_examples_v2'))return;
    var drafts=read(platformKey),releases=read(publicationKey);
    [{id:61001,name:'斯坦福大学 · 硕士网申模板',school:'斯坦福大学',college:'工程学院',sourceOrg:'PBS留学总部',version:'V1',scope:['*']},{id:61002,name:'香港大学 · 商学院网申模板',school:'香港大学',college:'商学院',sourceOrg:'上海启明留学',version:'V1',scope:['上海启明留学','北京知行教育']},{id:61003,name:'CMU 计算机学院网申模板',school:'卡内基梅隆大学',college:'计算机学院',sourceOrg:'PBS留学总部',version:'V1',scope:null},{id:61004,name:'CMU 人文学院网申模板',school:'卡内基梅隆大学',college:'人文学院',sourceOrg:'PBS留学总部',version:'V1',scope:['*']}].forEach(function(example){
      if(drafts.some(function(item){return Number(item.id)===example.id;}))return;
      var version={version:example.version,fields:2,materials:1,updated:'2026-11-06',fieldDetails:[{name:'First Name',type:'文本',required:true,note:'与护照姓名一致',pageId:'page-1',programScope:'common'},{name:'Email',type:'邮箱',required:true,note:'填写申请邮箱',pageId:'page-1',programScope:'common'}],materialDetails:[{name:'简历（CV）',required:true,note:'PDF 格式'}],pageDetails:[{id:'page-1',name:'个人信息',entranceId:'entry-main',programScope:'common'}],entranceDetails:[{id:'entry-main',name:'默认入口',url:'',stage:'硕士',channel:'直申',isDefault:true}]};
      var draft={id:example.id,name:example.name,school:example.school,college:example.college,org:'平台',sourceOrg:example.sourceOrg,boundPrograms:[],versions:[version],updatedAt:'2026-11-06T10:00:00+08:00'};
      draft.region=example.school==='香港大学'?'中国香港':'美国';drafts.push(draft);if(example.scope)releases.push({id:'PUB-'+example.id+'-'+example.version,templateId:example.id,version:example.version,scope:example.scope,at:'2026-11-06T10:00:00+08:00',publisher:pbsGetSession().name,snapshot:clone(draft)});
    });
    localStorage.setItem(platformKey,JSON.stringify(drafts));localStorage.setItem(publicationKey,JSON.stringify(releases));localStorage.setItem('pbs_template_publication_examples_v2','1');
  }
  function adopt(id) {
    var publication=available().find(function(item){return item.id===id;});if(!publication)return {error:'无权引用该模板'};
    if(!pbsHasPermission('app_template_save') && pbsGetSession().role !== '机构管理员')return {error:'无权保存机构模板'};
    var org=pbsGetSession().org;if(org==='PBS留学')org='PBS留学总部';
    var list=read(institutionKey);
    if(list.some(function(item){return item.org===org && item.publicationId===id;}))return {error:'本机构已引用该发布版本'};
    var item=clone(publication.snapshot);item.id=Date.now();item.org=org;item.publicationId=id;item.sourcePlatformTemplateId=publication.templateId;item.sourceVersion=publication.version;
    delete item.sourceTemplateId;delete item.sourceOrg;list.push(item);localStorage.setItem(institutionKey,JSON.stringify(list));return item;
  }
  function syncInstitutionTemplates(org) {
    org = org || pbsGetSession().org; if (org === 'PBS留学') org = 'PBS留学总部';
    var list = read(institutionKey), changed = false;
    read(publicationKey).filter(function(item) { return item.scope.includes('*') || item.scope.includes(org); }).forEach(function(publication) {
      var source = publication.snapshot, existing = list.find(function(item) { return item.org === org && Number(item.sourcePlatformTemplateId) === Number(publication.templateId); });
      if (existing && existing.versions.some(function(item) { return item.version === publication.version; })) return;
      if (!existing) {
        existing = clone(source); existing.id = Date.now(); while(list.some(function(item) { return item.id === existing.id; }) || seeds.some(function(item) { return item.id === existing.id; })) existing.id++;
        if (institutions().some(function(item) { return item.org === org && item.name === source.name; }) || list.some(function(item) { return item.org === org && item.name === source.name; })) existing.name += '-平台发布';
        existing.org = org; existing.versions = []; existing.sourcePlatformTemplateId = publication.templateId; list.push(existing);
      }
      existing.versions.unshift(clone(source.versions[0])); existing.versions.sort(function(a,b) { return Number(b.version.replace(/^v/i,'')) - Number(a.version.replace(/^v/i,'')); }); existing.publicationId = publication.id; existing.sourceVersion = existing.versions[0].version;
      existing.name = source.name + (institutions().some(function(item) { return item.org === org && item.name === source.name; }) || list.some(function(item) { return item.id !== existing.id && item.org === org && item.name === source.name; }) ? '-平台发布' : '');
      existing.school = source.school; existing.college = source.college; existing.boundPrograms = clone(source.boundPrograms || []); existing.updatedAt = publication.at;
      changed = true;
    });
    if (changed) localStorage.setItem(institutionKey,JSON.stringify(list));
  }
  function remove(id) {
    if (!isPublisher('delete')) return false;
    localStorage.setItem(platformKey,JSON.stringify(read(platformKey).filter(function(item) { return Number(item.id) !== Number(id); })));
    var key = 'pbs_template_scan_tasks_v1'; localStorage.setItem(key,JSON.stringify(read(key).filter(function(item) { return Number(item.templateId) !== Number(id) || item.status === '已扫描'; })));
    return true;
  }
  function normalizeVersions() {
    var drafts = read(platformKey), publications = read(publicationKey), tasks = read('pbs_template_scan_tasks_v1'), institutionsList = read(institutionKey), changed = false;
    drafts.forEach(function(draft) {
      var related = publications.filter(function(item) { return Number(item.templateId) === Number(draft.id); });
      var labels = draft.versions.map(function(item) { return item.version; }).concat(related.map(function(item) { return item.version; }));
      if (labels.every(function(label) { return /^V\d+$/.test(label); })) return;
      var unique = Array.from(new Set(labels)).sort(function(a,b) { return parseFloat(a.replace(/^v/i,'')) - parseFloat(b.replace(/^v/i,'')); });
      function convert(value) { var index = unique.indexOf(value); return index < 0 ? value : 'V' + (index + 1); }
      draft.versions.forEach(function(item) { item.version = convert(item.version); });
      related.forEach(function(item) { item.version = convert(item.version); item.snapshot.versions.forEach(function(version) { version.version = convert(version.version); }); });
      tasks.filter(function(item) { return Number(item.templateId) === Number(draft.id); }).forEach(function(item) { item.version = convert(item.version); });
      institutionsList.filter(function(item) { return Number(item.sourcePlatformTemplateId) === Number(draft.id); }).forEach(function(item) { item.sourceVersion = convert(item.sourceVersion); item.versions.forEach(function(version) { version.version = convert(version.version); }); });
      changed = true;
    });
    if (!changed) return;
    localStorage.setItem(platformKey,JSON.stringify(drafts)); localStorage.setItem(publicationKey,JSON.stringify(publications)); localStorage.setItem('pbs_template_scan_tasks_v1',JSON.stringify(tasks)); localStorage.setItem(institutionKey,JSON.stringify(institutionsList));
  }
  normalizeVersions();
  window.pbsTemplatePublishing={platformKey:platformKey,isPublisher:isPublisher,nextVersion:nextVersion,overwriteCandidates:overwriteCandidates,extractionOf:extractionOf,syncInstitutionTemplates:syncInstitutionTemplates,remove:remove,institutions:institutions,extract:extract,publish:publish,publishMany:publishMany,seedPublications:seedPublications,available:available,adopt:adopt,drafts:function(){return read(platformKey);},publications:function(){return read(publicationKey);}};
})();
