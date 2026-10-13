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
    var draft = clone(source); draft.id = Date.now(); draft.org = '平台'; draft.sourceTemplateId = source.id; draft.sourceOrg = source.org;
    draft.versions = draft.versions.slice(0,1); draft.versions[0].version = 'v1.0';
    var list = read(platformKey);list.push(draft);localStorage.setItem(platformKey,JSON.stringify(list));return draft;
  }
  function publish(id, scope) {
    if (!isPublisher()) return {error:'无权发布模板'};
    var draft = read(platformKey).find(function(item){return Number(item.id)===Number(id);});
    if(!draft || !draft.versions.length || !(draft.versions[0].fieldDetails || []).length)return {error:'请先编辑并保存完整模板'};
    if(!scope.length)return {error:'请选择发布范围'};
    var list=read(publicationKey), version=draft.versions[0].version;
    if(list.some(function(item){return item.templateId===draft.id && item.version===version;}))return {error:'该版本已发布，请另存新版本后发布'};
    var item={id:'PUB-'+Date.now(),templateId:draft.id,version:version,scope:scope.slice(),at:new Date().toISOString(),publisher:pbsGetSession().name,snapshot:clone(draft)};
    item.snapshot.versions=item.snapshot.versions.slice(0,1);list.push(item);localStorage.setItem(publicationKey,JSON.stringify(list));return item;
  }
  function available() { var org = pbsGetSession().org; if(org==='PBS留学')org='PBS留学总部';return read(publicationKey).filter(function(item){return isPublisher() || item.scope.includes('*') || item.scope.includes(org);}); }
  function adopt(id) {
    var publication=available().find(function(item){return item.id===id;});if(!publication)return {error:'无权引用该模板'};
    if(!pbsHasPermission('app_template_save') && pbsGetSession().role !== '机构管理员')return {error:'无权保存机构模板'};
    var org=pbsGetSession().org;if(org==='PBS留学')org='PBS留学总部';
    var list=read(institutionKey);
    if(list.some(function(item){return item.org===org && item.publicationId===id;}))return {error:'本机构已引用该发布版本'};
    var item=clone(publication.snapshot);item.id=Date.now();item.org=org;item.publicationId=id;item.sourcePlatformTemplateId=publication.templateId;item.sourceVersion=publication.version;
    delete item.sourceTemplateId;delete item.sourceOrg;list.push(item);localStorage.setItem(institutionKey,JSON.stringify(list));return item;
  }
  window.pbsTemplatePublishing={platformKey:platformKey,isPublisher:isPublisher,institutions:institutions,extract:extract,publish:publish,available:available,adopt:adopt,drafts:function(){return read(platformKey);},publications:function(){return read(publicationKey);}};
})();
