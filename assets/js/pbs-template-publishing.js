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
  var institutionKey = 'pbs_web_application_templates_v2', platformKey = 'pbs_platform_application_templates_v1', publicationKey = 'pbs_application_template_publications_v1';
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isPublisher() { var role = window.pbsGetSession && pbsGetSession().role; return role === '超级管理员' || role === '平台运维人员'; }
  function institutions() {
    var list = clone(seeds), stored = read(institutionKey);
    stored.forEach(function(item) { list = list.filter(function(row){return Number(row.id)!==Number(item.id);});list.push(item); });
    list.forEach(function(item) { if(!item.boundPrograms) item.boundPrograms = item.program ? [item.program] : []; });
    return list;
  }
  function extract(id) {
    if (!isPublisher()) return null;
    var source = institutions().find(function(item){return Number(item.id)===Number(id);}); if(!source)return null;
    var list = read(platformKey), version = source.versions[0].version;
    var existing = list.find(function(item){return item.sourceTemplateId === source.id && item.sourceOrg === source.org && item.sourceTemplateVersion === version;});
    if(existing)return existing;
    var draft = clone(source); draft.id = Date.now(); while(list.some(function(item){return item.id === draft.id;}))draft.id++;
    draft.org = '平台'; draft.sourceTemplateId = source.id; draft.sourceOrg = source.org; draft.sourceTemplateVersion = version;
    draft.updatedAt=new Date().toISOString();
    draft.versions = draft.versions.slice(0,1); draft.versions[0].version = 'v1.0';
    list.push(draft);localStorage.setItem(platformKey,JSON.stringify(list));return draft;
  }
  function publish(id, scope) {
    var result=publishMany([id],scope);return result.error?result:result[0];
  }
  function publishMany(ids, scope) {
    if (!isPublisher()) return {error:'无权发布模板'};
    var drafts=read(platformKey),selected=Array.from(new Set(ids.map(Number))).map(function(id){return drafts.find(function(item){return Number(item.id)===id;});});
    if(!selected.length || selected.some(function(item){return !item;}))return {error:'请选择有效的模板'};
    var incomplete=selected.filter(function(item){return !item.name || !item.school || !item.college || !item.versions.length;});
    if(incomplete.length)return {error:'请填写模板名称、学校和学院：'+incomplete.map(function(item){return item.name || '未命名模板';}).join('、')};
    if(!scope.length)return {error:'请选择发布范围'};
    var list=read(publicationKey);
    var created=selected.map(function(draft,index){var serial=Date.now()+index;while(list.some(function(item){return item.id==='PUB-'+serial;}))serial++;var item={id:'PUB-'+serial,templateId:draft.id,version:draft.versions[0].version,scope:scope.slice(),at:new Date().toISOString(),publisher:pbsGetSession().name,snapshot:clone(draft)};item.snapshot.versions=item.snapshot.versions.slice(0,1);list.push(item);return item;});
    localStorage.setItem(publicationKey,JSON.stringify(list));return created;
  }
  function available() { var org = pbsGetSession().org; if(org==='PBS留学')org='PBS留学总部';return read(publicationKey).filter(function(item){return isPublisher() || item.scope.includes('*') || item.scope.includes(org);}); }
  function seedPublications() {
    if(!isPublisher() || localStorage.getItem('pbs_template_publication_examples_v2'))return;
    var drafts=read(platformKey),releases=read(publicationKey);
    [{id:61001,name:'斯坦福大学 · 硕士网申模板',school:'斯坦福大学',college:'工程学院',sourceOrg:'PBS留学总部',version:'v1.1',scope:['*']},{id:61002,name:'香港大学 · 商学院网申模板',school:'香港大学',college:'商学院',sourceOrg:'上海启明留学',version:'v1.2',scope:['上海启明留学','北京知行教育']},{id:61003,name:'CMU 计算机学院网申模板',school:'卡内基梅隆大学',college:'计算机学院',sourceOrg:'PBS留学总部',version:'v1.0',scope:null},{id:61004,name:'CMU 人文学院网申模板',school:'卡内基梅隆大学',college:'人文学院',sourceOrg:'PBS留学总部',version:'v1.0',scope:['*']}].forEach(function(example){
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
  window.pbsTemplatePublishing={platformKey:platformKey,isPublisher:isPublisher,institutions:institutions,extract:extract,publish:publish,publishMany:publishMany,seedPublications:seedPublications,available:available,adopt:adopt,drafts:function(){return read(platformKey);},publications:function(){return read(publicationKey);}};
})();
