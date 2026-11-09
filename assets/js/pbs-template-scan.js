(function () {
  'use strict';
  var taskKey = 'pbs_template_scan_tasks_v1', templateKey = 'pbs_platform_application_templates_v1';
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function pluginSession() { try { return JSON.parse(localStorage.getItem('pbs_plugin_session_v1') || '{}'); } catch(e) { return {}; } }
  function actor() { return window.pbsGetSession ? pbsGetSession() : pluginSession(); }
  function owns(task) { var session = actor(); return task.actorAccount ? task.actorAccount === session.account : task.actor === session.name; }
  function pluginPermission() {
    var session = pluginSession(); if (session.role === '超级管理员') return true;
    if (session.role !== '平台运维人员') return false;
    var scoped = {}, saved = {};
    try { scoped = JSON.parse(localStorage.getItem('pbs_role_perms_scoped_v1') || '{}'); saved = JSON.parse(localStorage.getItem('pbs_role_perms_v1') || '{}'); } catch(e) {}
    var grants = Object.assign({},saved,scoped.default || {})[session.role]; if (!grants) return true;
    var ids = Array.isArray(grants) ? grants : Object.keys(grants).reduce(function(all,key) { return all.concat(grants[key]); },[]);
    return ids.some(function(id) { return ['app_template_plugin','app_template_plugin_view','app_template_plugin_edit'].indexOf(id) >= 0; });
  }
  function pluginAdmin() {
    return pluginPermission();
  }
  function request(id) {
    if (!window.pbsTemplatePublishing || !pbsTemplatePublishing.isPublisher('edit')) return { error: '无权提交扫描任务' };
    var templates = read(templateKey), template = templates.find(function (item) { return Number(item.id) === Number(id); });
    if (!template) return { error: '请先保存模板' };
    if (!String(template.school || '').trim() || !String(template.college || '').trim()) return { error: '请填写学校和学院' };
    var version = template.versions[0], entrances = version.entranceDetails || [];
    var tasks = read(taskKey), pending = tasks.find(function (task) { return task.templateId === template.id && task.status !== '已扫描' && owns(task); });
    if (pending && pending.version === version.version) return pending;
    if (pending) tasks = tasks.filter(function (task) { return task.id !== pending.id; });
    var task = { id: 'SCAN-' + Date.now(), templateId: template.id, name: template.name, school: template.school, college: template.college, programs: template.boundPrograms || [], version: version.version, entrances: entrances, status: '待扫描', at: new Date().toISOString(), actor: pbsGetSession().name, actorAccount:pbsGetSession().account };
    tasks.unshift(task); write(taskKey, tasks); return task;
  }
  function save(id, result, complete) {
    if (!pluginPermission()) return { error: '无权使用模板扫描插件' };
    var tasks = read(taskKey), task = tasks.find(function (item) { return item.id === id; });
    if (!task || !owns(task) || task.status === '已扫描') return { error: '扫描任务已完成或不属于当前账号' };
    if (!result.fields.length || result.fields.some(function (field) { return !field.label.trim(); })) return { error: '请填写所有官网字段名称' };
    if (result.materials.some(function (material) { return !material.name.trim(); })) return { error: '请填写所有材料名称' };
    var templates = read(templateKey), template = templates.find(function (item) { return item.id === task.templateId; });
    if (!template || template.versions[0].version !== task.version) return { error: '模板版本已变更，请从发布中心重新提交扫描任务' };
    task.result = result; task.status = complete ? '已扫描' : '待确认'; task.updatedAt = new Date().toISOString();
    if (complete) {
      var version = template.versions[0], entry = task.entrances.find(function (item) { return item.isDefault; }) || task.entrances[0];
      var pageId = 'page-scan-' + task.id;
      version.fieldDetails = result.fields.map(function (field, index) { return { id: task.id + '-' + index, name: field.label, type: field.type, required: field.required, note: field.note || '', pageId: pageId, programScope: 'common' }; });
      version.materialDetails = result.materials.map(function (item) { return { name: item.name, note: item.requirement || '', required: !!item.required, programScope: 'common' }; });
      version.pageDetails = [{ id: pageId, name: '申请页面', entranceId: entry.id, url: entry.url }];
      version.fields = version.fieldDetails.length; version.materials = version.materialDetails.length; version.savedAt = task.updatedAt; version.updated = task.updatedAt.slice(0, 10);
      template.scannedAt = task.updatedAt;
      template.updatedAt = task.updatedAt;
      write(templateKey, templates);
    }
    write(taskKey, tasks); return task;
  }
  window.pbsTemplateScan = { key: taskKey, request: request, save: save, pluginAdmin: pluginAdmin, tasks: function () { return pluginAdmin() || window.pbsTemplatePublishing && pbsTemplatePublishing.isPublisher() ? read(taskKey).filter(owns) : []; }, status: function (id,version) { if (!version) { var template=read(templateKey).find(function(item){return Number(item.id)===Number(id);}); version=template&&template.versions[0].version; } var task = read(taskKey).find(function (item) { return Number(item.templateId) === Number(id) && owns(item) && (!version || String(item.version).toLowerCase()===String(version).toLowerCase()); }); return task ? task.status : '未扫描'; } };
})();
