(function () {
  'use strict';
  var api = window.pbsStudents;
  if (!api) return;
  var file = decodeURIComponent(location.pathname).split('/').pop();
  var labels = {student:'学生信息',customer:'客户信息',edu:'教育背景',lang:'语言成绩',score:'学业信息',qual:'专业资质',work:'工作经历',practice:'实践经历',honor:'荣誉奖项',pub:'学术发表',apply:'申请记录',account:'账号管理',asset:'资产文件'};
  var identityLabels = {name:'姓名',level:'申请层次',gender:'性别',birth:'出生日期',phone:'联系电话',address:'现居住地',country:'意向国家',major:'意向专业',identity:'身份信息',idcard:'证件号码',relation:'与学生关系',wechat:'微信',source:'客户来源'};
  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zm0 0v6h6M8 13h8m-8 4h5"/></svg>';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function empty(value) { return value == null || value === '' || value === '—' || Array.isArray(value) && !value.length; }
  function profileUrl(id) { return '学生档案详情页 - 留学申请管理系统.html?studentId=' + encodeURIComponent(id); }
  function preUrl(task) { return '选校预档案详情页 - 留学申请管理系统.html?service=' + encodeURIComponent(task.id) + '&studentId=' + encodeURIComponent(task.preStudentId); }
  function saveProfile(profile) { var all = api.all(); var index = all.findIndex(function(item) { return item.id === profile.id; }); all[index] = profile; localStorage.setItem('pbs_student_profiles_v1',JSON.stringify(all)); }
  function notify(value) { if (window.__pbsToast) __pbsToast(value); else if (window.showToast) showToast(value); }
  function modal(title,description,body,footer) {
    var dialog = document.createElement('dialog'); dialog.className = 'pa-dialog';
    dialog.innerHTML = '<header><div><h2>' + esc(title) + '</h2>' + (description ? '<p>' + esc(description) + '</p>' : '') + '</div><button data-pa-close aria-label="关闭">×</button></header><div class="pa-dialog-body">' + body + '</div><footer>' + footer + '</footer>';
    dialog.addEventListener('click',function(event) { if (event.target === dialog || event.target.closest('[data-pa-close]')) dialog.close(); });
    dialog.addEventListener('close',function() { dialog.remove(); }); document.body.appendChild(dialog); dialog.showModal(); return dialog;
  }
  function assets(action) {
    return new Promise(function(resolve,reject) {
      var request = indexedDB.open('pbs_student_assets_v1',1);
      request.onupgradeneeded = function() { request.result.createObjectStore('files',{keyPath:'id'}); };
      request.onerror = function() { reject(request.error); };
      request.onsuccess = function() {
        var db = request.result, tx = db.transaction('files','readwrite'), store = tx.objectStore('files'), query = store.getAll(), result;
        query.onsuccess = function() { result = action(query.result,store); };
        tx.oncomplete = function() { db.close(); resolve(result); };
        tx.onerror = function() { db.close(); reject(tx.error); };
      };
    });
  }
  function createForm() {
    if (!/选校任务列表/.test(file)) return;
    var name = document.getElementById('stu-name'); if (!name) return;
    var card = name.closest('.space-y-2'), note = document.createElement('p');
    note.className = 'pa-form-note'; note.textContent = '同步建立本选校单的学生预档案，可继续完善资料、上传文件和解析。'; card.after(note);
    var caption = name.previousElementSibling.querySelector('span.text-\\[10px\\]'); if (caption) caption.remove();
  }
  function taskCreated(task) {
    modal('选校任务已创建',task.student + ' · ' + task.id,'<div class="pa-summary">选校单的学生预档案已建立。可先完善背景、上传并解析资料，再开始选校。</div>','<button data-pa-close class="pa-button">留在列表</button><a class="pa-button" href="选校工作台页 - 留学申请管理系统.html?service=' + encodeURIComponent(task.id) + '">开始选校</a><a class="pa-button primary" href="' + preUrl(task) + '">完善预档案</a>');
  }
  function taskArchiveLink(task,host) {
    if (!task.preStudentId) return;
    var link = document.createElement('a'); link.className = 'selection-text-button'; link.href = preUrl(task); link.textContent = '学生预档案'; host.prepend(link);
  }
  function detailGuide() {
    if (!document.getElementById('studentInfoCard')) return;
    var profile = api.find(window.PBS_STUDENT_ID); if (!profile || !api.canView(profile.id)) return;
    var preliminary = profile.kind === 'preliminary', task = window.pbsSelection && pbsSelection.find(profile.selectionId);
    if (preliminary && file !== '选校预档案详情页 - 留学申请管理系统.html') { location.replace(task ? preUrl(task) : '选校任务列表页 - 留学申请管理系统.html'); return; }
    var heading = document.querySelector('main h1'); heading.textContent = profile.name + (preliminary ? ' · 学生预档案' : ' · 学生档案');
    var projectLabel = Array.from(document.querySelectorAll('#customerInfoCard p')).find(function(node) { return node.textContent.trim() === '院校号'; });
    if (projectLabel) { if (preliminary) projectLabel.textContent = '选校单号'; projectLabel.nextElementSibling.textContent = preliminary ? profile.selectionId || '—' : api.projects(profile.id).map(function(project) { return project.projectNo; }).join('、') || '—'; }
    if (!preliminary && projectLabel) {
      var orderRow = projectLabel.parentElement.cloneNode(true);
      orderRow.querySelector('p').textContent = '项目号';
      orderRow.querySelector('p').nextElementSibling.textContent = Array.from(new Set(api.projects(profile.id).map(function(project) { return project.orderNo; }).filter(Boolean))).join('、') || '—';
      projectLabel.parentElement.before(orderRow);
    }
    var createdLabel = Array.from(document.querySelectorAll('#customerInfoCard p')).find(function(node) { return node.textContent.trim() === '创建时间'; });
    if (createdLabel) createdLabel.nextElementSibling.textContent = profile.createdAt.slice(0,10);
    if (!document.getElementById('profile-customer-name').textContent.trim()) document.getElementById('profile-customer-name').textContent = '—';
    if (preliminary) {
      adaptSalesArchive(profile);
      document.body.classList.toggle('pa-pre-readonly',!!profile.boundTo);
      var status = document.querySelector('#customerInfoCard .bg-yellow-400'); if (status) status.remove();
      var subtitle = heading.nextElementSibling; if (subtitle) subtitle.textContent = '所属选校单：' + (profile.selectionId || '—');
      var guide = document.createElement('section'); guide.className = 'pa-guide'; guide.id = 'preArchiveGuide';
      guide.innerHTML = icon + '<div class="pa-guide-copy"><strong>' + (profile.boundTo ? '已绑定正式档案' : '选校单的学生预档案') + '</strong><p>' + (profile.boundTo ? '本次选校资料已追加到正式档案，可在正式档案中继续完善。' : '可完善背景、上传文件并解析。下单后，在正式档案的“申请记录”中绑定本选校单，追加这些资料。') + '</p></div>' + (profile.boundTo ? '<a class="pa-button" href="' + profileUrl(profile.boundTo) + '&section=apply">查看学生档案</a>' : task ? '<a class="pa-button" href="选校工作台页 - 留学申请管理系统.html?service=' + encodeURIComponent(task.id) + '">进入选校工作台</a>' : '');
      heading.closest('.pbs-detail-topbar').after(guide);
      var back = document.querySelector('[data-dom-id="btn-back-list"]'); if (back) { back.setAttribute('aria-label','返回选校任务列表'); back.setAttribute('title','返回选校任务列表'); back.dataset.backLabel = '选校列表'; back.addEventListener('click',function(event) { event.stopImmediatePropagation(); location.href = '选校任务列表页 - 留学申请管理系统.html'; },true); }
      if (profile.boundTo) document.querySelectorAll('main button[title="AI 解析"]').forEach(function(button) { button.hidden = true; });
    } else {
      repairImports(profile); profile = api.find(profile.id);
      document.querySelectorAll('.pa-intake').forEach(function(node) { node.remove(); });
    }
    var section = new URLSearchParams(location.search).get('section'), destination = document.getElementById('sec-' + section);
    if (destination) requestAnimationFrame(function() { destination.scrollIntoView({block:'start'}); });
  }
  function adaptSalesArchive(profile) {
    document.body.classList.add('pa-sales');
    var student = document.getElementById('studentInfoCard'), contact = document.getElementById('customerInfoCard');
    var summary = student.parentElement; summary.classList.add('pa-sales-summary'); summary.insertBefore(student,contact);
    var title = contact.querySelector('h2'); title.lastChild.textContent = '咨询联系人';
    Array.from(contact.querySelectorAll('p')).filter(function(node) { return ['院校号','选校单号','创建时间'].indexOf(node.textContent.trim()) >= 0; }).forEach(function(node) { node.parentElement.hidden = true; });
    [document.getElementById('profile-student-identity'),student.querySelector('[data-v="idcard"]')].forEach(function(node) { if (node) node.parentElement.hidden = true; });
    ['apply','account','delivered','logs'].forEach(function(key) { var section = document.querySelector('section[data-section="' + key + '"]') || document.getElementById(key === 'logs' ? 'pbsStudentLogs' : 'sec-' + key); if (section) section.hidden = true; });
    var assetsTitle = document.querySelector('#sec-asset h2'); if (assetsTitle) assetsTitle.lastChild.textContent = '资料文件';
    var assetsLink = document.querySelector('[data-target="sec-asset"]'); if (assetsLink) assetsLink.textContent = '资料文件';
    var edit = window.openProfileCardEdit;
    window.openProfileCardEdit = function(type) {
      edit(type); var dialog = document.getElementById('profileEditModal');
      dialog.querySelector('h3').textContent = type === 'customer' ? '编辑咨询联系人' : '编辑学生信息';
      var hint = dialog.querySelector('h3').nextElementSibling; if (hint) hint.remove();
      if (type === 'student') { var identity = dialog.querySelector('[data-profile-input="identity"]'); if (identity) identity.parentElement.hidden = true; dialog.querySelector('#profile-document-fields').hidden = true; }
    };
    var upload = window.openAssetUpload;
    if (upload) window.openAssetUpload = function() {
      upload(); var category = document.getElementById('assetFileCategory');
      if (category) Array.from(category.options).forEach(function(option) { if (['apply','account','delivered','customer','student'].indexOf(option.value) >= 0) option.remove(); });
    };
    var exporter = document.getElementById('exportStudentArchive'); if (exporter) exporter.textContent = '导出资料';
  }
  function mergeIdentity(target,source,scope,conflicts) {
    var result = Object.assign({},target);
    Object.keys(source).forEach(function(key) {
      if (empty(source[key])) return;
      if (Array.isArray(source[key])) { result[key] = (result[key] || []).slice(); source[key].forEach(function(item) { if (!result[key].some(function(row) { return JSON.stringify(row) === JSON.stringify(item); })) result[key].push(item); }); }
      else if (empty(result[key])) result[key] = source[key];
      else if (String(result[key]) !== String(source[key])) conflicts.push({scope:scope,key:key,field:labels[scope] + ' · ' + (identityLabels[key] || key),current:result[key],incoming:source[key]});
    }); return result;
  }
  function validFields(root) { return Array.from(root.querySelectorAll('[data-v]')).filter(function(node) { return !node.parentElement.closest('[data-v]') && !empty(node.textContent.trim()); }); }
  function signature(record) { return validFields(record).map(function(node) { return node.dataset.v + ':' + node.textContent.trim(); }).sort().join('|'); }
  var recordKeys = {edu:['school','major','start'],qual:['qn','org','date'],work:['co','post','start'],practice:['org','role','start'],honor:['hn','org','date'],pub:['title','doi']};
  var scoreLabels = {ieltsT:'雅思总分',ieltsL:'雅思听力',ieltsR:'雅思阅读',ieltsW:'雅思写作',ieltsS:'雅思口语',toeflT:'托福总分',toeflL:'托福听力',toeflR:'托福阅读',toeflW:'托福写作',toeflS:'托福口语',gpa:'GPA',sat:'SAT',ap:'AP',alevel:'A-Level',ib:'IB',gre:'GRE',gmat:'GMAT'};
  function fieldLabel(section,node) {
    var definition = ((window.PBSProfileFieldLabels || {})[section] || []).find(function(field) { return field[0] === node.dataset.v; });
    return definition ? definition[1] : scoreLabels[node.dataset.v] || (node.previousElementSibling ? node.previousElementSibling.textContent.trim() : node.dataset.v);
  }
  function snapshot(host) {
    var values = {}, names = {};
    validFields(host).forEach(function(node,index) { var key = node.dataset.v + ':' + index; values[key] = node.textContent.trim(); names[key] = node.dataset.v; });
    return {html:host.innerHTML,values:values,labels:names};
  }
  function sameRecord(a,b,section) {
    var keys = recordKeys[section] || [], matches = 0;
    return keys.length && keys.every(function(key,index) {
      var av = a.querySelector('[data-v="' + key + '"]'), bv = b.querySelector('[data-v="' + key + '"]');
      av = av ? av.textContent.trim() : ''; bv = bv ? bv.textContent.trim() : '';
      if (!index && (empty(av) || empty(bv))) return false;
      if (!empty(av) && !empty(bv)) { matches++; return av === bv; }
      return true;
    }) && matches > 0;
  }
  function appendField(host,node,section) {
    var wrapper = node.closest('[data-f], [data-custom-field-id]');
    var grid = host.querySelector('.grid');
    if (!wrapper || !grid) return null;
    var clone = wrapper.cloneNode(true); grid.appendChild(clone);
    return clone.querySelector('[data-v]');
  }
  function mergeFields(destination,incoming,section,conflicts,root) {
    var count = 0;
    validFields(incoming).forEach(function(node) {
      var key = node.dataset.v, value = node.textContent.trim();
      var field = Array.from(destination.querySelectorAll('[data-v]')).find(function(item) { return item.dataset.v === key && (destination !== root || !item.closest('[data-record],tr')); });
      if (!field) { if (appendField(destination,node,section)) count++; return; }
      if (empty(field.textContent.trim())) { field.textContent = value; count++; }
      else if (field.textContent.trim() !== value) {
        var titleKey = (recordKeys[section] || [])[0], title = titleKey && destination.querySelector('[data-v="' + titleKey + '"]');
        conflicts.push({scope:section,key:key,index:Array.from(root.querySelectorAll('[data-v]')).indexOf(field),field:labels[section] + (title ? ' · ' + title.textContent.trim() : '') + ' · ' + fieldLabel(section,node),current:field.textContent.trim(),incoming:value});
      }
    });
    return count;
  }
  function mergeRecord(container,record,section,conflicts,root) {
    var records = Array.from(container.children);
    if (!signature(record) || records.some(function(row) { return signature(row) === signature(record); })) return 0;
    var existing = records.find(function(row) { return sameRecord(row,record,section); });
    if (existing) return mergeFields(existing,record,section,conflicts,root);
    var clone = record.cloneNode(true); clone.removeAttribute('data-audit-record');
    clone.dataset.recordKey = 'import-' + Math.random().toString(36).slice(2);
    container.appendChild(clone);
    Array.from(container.children).forEach(function(row,index) { var number = row.querySelector(':scope > div:first-child > span'); if (number) number.textContent = index + 1; });
    return 1;
  }
  function mergeSections(source,conflicts) {
    var result = {}, counts = [];
    Object.keys(source.sections || {}).forEach(function(section) {
      var saved = source.sections[section], live = document.getElementById('secbody-' + section); if (!saved.html || !live || ['asset','apply','account','delivered','selectionBinding'].indexOf(section) >= 0) return;
      var incoming = document.createElement('div'); incoming.innerHTML = saved.html;
      var merged = live.cloneNode(true), bindings = merged.querySelector('#studentSelectionBindings'); if (bindings) bindings.remove();
      var count = 0;
      incoming.querySelectorAll('[id^="records-"],tbody').forEach(function(container,index) {
        var destination = container.id ? merged.querySelector('[id="' + container.id + '"]') : merged.querySelectorAll('tbody')[index]; if (!destination) return;
        Array.from(container.children).forEach(function(record) {
          count += mergeRecord(destination,record,section,conflicts,merged);
        });
      });
      var flat = incoming.cloneNode(true); flat.querySelectorAll('[id^="records-"],table,.pa-import-values').forEach(function(node) { node.remove(); });
      count += mergeFields(merged,flat,section,conflicts,merged);
      if (count || conflicts.some(function(row) { return row.scope === section; })) result[section] = snapshot(merged);
      if (count) counts.push({section:section,label:labels[section] || section,count:count});
    });
    return {sections:result,counts:counts};
  }
  function preview(target,source,files) {
    var conflicts = [], student = mergeIdentity(target.student,source.student,'student',conflicts), customer = mergeIdentity(target.customer,source.customer,'customer',conflicts), merged = mergeSections(source,conflicts);
    var sections = Object.assign({},target.sections,merged.sections);
    return {student:student,customer:customer,sections:sections,conflicts:conflicts,files:files.map(function(item) { return item.id; }),counts:merged.counts,summary:merged.counts.map(function(item) { return item.label + ' ' + item.count + ' 项'; }).concat(files.length ? files.length + ' 份文件' : [],source.supplement ? '学生补充信息' : []).join('、') || '学生基本信息'};
  }
  function conflictTable(conflicts,editable) {
    return conflicts.length ? '<table class="pa-conflicts"><thead><tr><th>存在不同内容的字段</th><th>当前档案</th><th>预档案</th><th>采用内容</th></tr></thead><tbody>' + conflicts.map(function(row,index) { return '<tr><td>' + esc(row.field) + '</td><td>' + esc(row.current) + '</td><td>' + esc(row.incoming) + '</td><td>' + (editable ? '<select aria-label="' + esc(row.field) + '采用内容" data-conflict="' + index + '"><option value="current">保留当前</option><option value="incoming">使用预档案</option></select>' : row.choice === 'incoming' ? '预档案' : '当前档案') + '</td></tr>'; }).join('') + '</tbody></table>' : '';
  }
  function resolveConflicts(payload,dialog) {
    var sections = {};
    payload.conflicts.forEach(function(row,index) {
      row.choice = dialog.querySelector('[data-conflict="' + index + '"]').value;
      if (row.choice !== 'incoming') return;
      if (row.scope === 'student' || row.scope === 'customer') { payload[row.scope][row.key] = row.incoming; return; }
      var host = sections[row.scope];
      if (!host) { host = document.createElement('div'); host.innerHTML = payload.sections[row.scope].html; sections[row.scope] = host; }
      var field = host.querySelectorAll('[data-v]')[row.index]; if (field) field.textContent = row.incoming;
    });
    Object.keys(sections).forEach(function(key) { payload.sections[key] = snapshot(sections[key]); });
  }
  async function bindSelection(id,orderKey,serviceId) {
    var error = pbsSelection.bindingError(id,orderKey,serviceId);
    if (error) { notify(error); return; }
    var task = pbsSelection.find(serviceId), source = pbsSelection.ensurePre(serviceId);
    if (!source || source.boundTo === id) {
      var result = pbsSelection.bind(id,orderKey,serviceId);
      if (result.error) { notify(result.error); return; }
      location.href = profileUrl(id) + '&section=apply'; return;
    }
    var files;
    try { files = await assets(function(all) { return all.filter(function(item) { return item.owner === source.id; }); }); }
    catch(e) { notify('文件读取失败，请重试'); return; }
    var target = api.find(id), payload = preview(target,source,files);
    payload.serviceId = serviceId; payload.orderKey = orderKey;
    var dialog = modal('绑定选校单并追加资料',task.student + ' · ' + serviceId,
      '<div class="pa-flow"><div><small>选校单预档案</small><strong>' + esc(source.name) + '</strong></div><span>→</span><div><small>当前学生档案</small><strong>' + esc(target.name) + '</strong></div></div><div class="pa-summary">资料将分别追加到对应模块，相同记录跳过。</div><div class="pa-merge-modules">' + payload.counts.map(function(item) { return '<div><span>' + esc(item.label) + '</span><strong>' + item.count + ' 项</strong></div>'; }).join('') + (files.length ? '<div><span>资产文件</span><strong>' + files.length + ' 份</strong></div>' : '') + '</div>' + conflictTable(payload.conflicts,true),
      '<span class="pa-dialog-error" role="alert"></span><button class="pa-button" data-pa-close>取消</button><button class="pa-button primary" data-confirm>绑定并追加</button>');
    dialog.querySelector('[data-confirm]').onclick = async function() {
      var button = dialog.querySelector('[data-confirm]'); button.disabled = true; button.textContent = '正在追加…';
      var error = pbsSelection.bindingError(id,orderKey,serviceId);
      if (error) { dialog.querySelector('[role="alert"]').textContent = error; button.disabled = false; button.textContent = '绑定并追加'; return; }
      try {
        resolveConflicts(payload,dialog);
        payload.files = await assets(function(all,store) {
          return all.filter(function(item) { return item.owner === source.id; }).map(function(item) {
            var copy = Object.assign({},item,{id:'bound-' + id + '-' + item.id,owner:id,preSourceId:source.id,selectionId:serviceId}); store.put(copy); return copy.id;
          });
        });
        var result = pbsSelection.bind(id,orderKey,serviceId); if (result.error) throw new Error(result.error);
        if (!api.bindPre(id,source.id,payload)) { pbsSelection.unbind(id,orderKey,serviceId); throw new Error('资料追加失败'); }
        location.href = profileUrl(id) + '&section=' + (payload.counts[0] ? payload.counts[0].section : 'apply') + '&bound=1';
      } catch(e) { button.disabled = false; button.textContent = '绑定并追加'; dialog.querySelector('[role="alert"]').textContent = e.message || '追加失败，请重试'; }
    };
  }
  function showImports(id) {
    var profile = api.find(id);
    modal('已绑定的预档案','选校阶段资料已追加到对应模块。',(profile.preImports || []).map(function(item) { return '<div class="pa-summary">' + esc(item.name) + ' · ' + esc(item.at.slice(0,10)) + '<br>' + esc(item.summary || '') + '</div>' + conflictTable(item.conflicts || []); }).join(''),'<button class="pa-button" data-pa-close>关闭</button>');
  }
  var parsing = false;
  async function openParse(id,serviceId) {
    var profile = api.find(id); if (!profile || !api.canEdit(id) || parsing) return;
    parsing = true;
    var buttons = Array.from(document.querySelectorAll('#studentSelectionBindings [data-append-parse],#studentSelectionBindings [data-parse]'));
    buttons.forEach(function(button) { button.disabled = true; button.textContent = '正在追加…'; });
    try {
      var imports = profile.preImports || [], files;
      var task = serviceId && pbsSelection.find(serviceId), sourceId = task && task.preStudentId;
      files = await assets(function(all) { return all.filter(function(item) { return item.owner === id && (!serviceId || !item.selectionId && !item.preSourceId || item.selectionId === serviceId || item.preSourceId === sourceId || imports.some(function(row) { return row.serviceId === serviceId && (row.files || []).indexOf(item.id) >= 0; })); }); });
      var notes = [];
      imports.filter(function(row) { return !serviceId || row.serviceId === serviceId || row.sourceId === sourceId; }).forEach(function(row) {
        var source = api.find(row.sourceId), text = source && source.supplement || row.supplement || '';
        if (text) notes.push({id:'note-' + row.sourceId,name:'选校补充信息 · ' + row.name,kind:'text',text:text,category:'score',selectionId:row.serviceId});
      });
      if (profile.supplement && !serviceId && !notes.some(function(item) { return item.text === profile.supplement; }) && notes.map(function(item) { return item.text; }).join('\n') !== profile.supplement) notes.push({id:'note-' + id,name:'学生补充信息',kind:'text',text:profile.supplement,category:'score'});
      if (serviceId && !notes.length && task && task.supplement) notes.push({id:'note-' + serviceId,name:'选校补充信息',kind:'text',text:task.supplement,category:'score',selectionId:serviceId});
      files = notes.concat(files);
      if (!files.length) { notify('暂无可解析资料，请先上传文件或完善预档案'); return; }
      var result = parseResults(id,files);
      notify(result.count || result.pending ? '已填入 ' + result.count + ' 项' + (result.pending ? '，' + result.pending + ' 项差异请在对应字段确认' : '，可在对应模块查看') : '解析完成，暂无新增内容');
    } catch(e) { notify('追加解析失败，请重试'); }
    finally {
      parsing = false;
      if (window.pbsRenderSelectionBindings) pbsRenderSelectionBindings();
      buttons.forEach(function(button) { button.disabled = false; button.textContent = '追加解析'; });
    }
  }
  function supplementFields(text) {
    var fields = [], match;
    [[/(?:雅思|IELTS)\s*(?:总分|成绩)?\s*[:：]?\s*(\d(?:\.\d)?)/i,'#sec-lang [data-v="ieltsT"]','雅思总分','lang'],[/(?:托福|TOEFL)\s*(?:总分|成绩)?\s*[:：]?\s*(\d{2,3})/i,'#sec-lang [data-v="toeflT"]','托福总分','lang'],[/GPA\s*[:：]?\s*(\d(?:\.\d+)?(?:\s*\/\s*\d(?:\.\d+)?)?)/i,'#sec-score [data-v="gpa"]','GPA','score']].forEach(function(definition) { match = text.match(definition[0]); if (match) fields.push({sel:definition[1],label:definition[2],value:match[1].replace(/\s+/g,''),section:definition[3]}); });
    return fields;
  }
  function parsedRoute(field,file) {
    var match = String(field.sel || '').match(/data-v=["']([^"']+)/), key = field.key || match && match[1];
    if (!key) return null;
    var sectionMatch = String(field.sel || '').match(/#(?:secbody-|sec-|records-)([a-z]+)/);
    var section = sectionMatch ? sectionMatch[1] : /^ielts|^toefl/.test(key) ? 'lang' : scoreLabels[key] ? 'score' : field.section || file.category;
    return document.getElementById('secbody-' + section) ? {section:section,key:key,label:field.label || scoreLabels[key] || key,value:String(field.value == null ? '' : field.value),record:field.recordId || ''} : null;
  }
  function nativeField(host,key,label,value) {
    var cell = document.createElement('div'); cell.dataset.f = key;
    cell.innerHTML = '<p class="text-xs text-gray-400 mb-1">' + esc(label) + '</p><p class="text-sm font-medium text-gray-900" data-v="' + esc(key) + '">' + esc(value) + '</p>';
    (host.querySelector('.grid') || host).appendChild(cell); return cell.querySelector('[data-v]');
  }
  function parsedRecord(section,fields) {
    var record = document.createElement('div'); record.className = 'border border-gray-200 rounded-xl p-4'; record.dataset.record = '';
    record.innerHTML = '<div class="flex items-center justify-between mb-3"><span class="text-sm text-gray-500"></span><div class="flex items-center gap-3"><button class="pa-text-button" onclick="editRecord(this)">编辑</button><button class="pa-text-button" onclick="delRecord(this)">删除</button></div></div><div class="grid grid-cols-3 gap-x-6 gap-y-4"></div>';
    var definitions = ((window.PBSProfileFieldLabels || {})[section] || []).slice();
    fields.forEach(function(field) { if (!definitions.some(function(item) { return item[0] === field.key; })) definitions.push([field.key,field.label]); });
    definitions.forEach(function(definition) { var field = fields.find(function(item) { return item.key === definition[0]; }); nativeField(record,definition[0],definition[1],field ? field.value : '—'); });
    return record;
  }
  function pendingField(field,value,label) {
    var cell = field.closest('[data-f]') || field.parentElement;
    if (/^ielts|^toefl/.test(field.dataset.v)) cell = cell.closest('.border.rounded-xl') || cell;
    if ((field.dataset.paIgnored || '').split('\n').indexOf(value) >= 0) return false;
    var duplicate = Array.from(cell.querySelectorAll('[data-pa-value]')).some(function(node) { return node.dataset.paValue === value && node.dataset.paKey === field.dataset.v; });
    if (duplicate) return false;
    var choice = document.createElement('div'); choice.className = 'pa-field-choice'; choice.dataset.paValue = value; choice.dataset.paKey = field.dataset.v;
    choice.innerHTML = '<span>' + esc(label) + '解析值：<strong>' + esc(value) + '</strong></span><div><button class="pa-text-button" data-use-parsed>采用</button><button class="pa-text-button" data-keep-current>保留当前</button></div>';
    cell.appendChild(choice); return true;
  }
  function parseResults(id,files) {
    var sections = {}, count = 0, pending = 0;
    files.forEach(function(file) {
      var fields = file.kind === 'text' ? supplementFields(file.text) : file.parseFields || (/雅思/i.test(file.name) ? (window.PARSE_RESULTS || {}).ielts : /成绩单/.test(file.name) ? (window.PARSE_RESULTS || {}).transcript : []) || [];
      var records = {};
      fields.forEach(function(field) {
        var row = parsedRoute(field,file); if (!row || empty(row.value)) return;
        var host = document.getElementById('secbody-' + row.section), container = host.querySelector('#records-' + row.section);
        if (container) { var group = row.section + ':' + row.record; (records[group] || (records[group] = [])).push(row); return; }
        var element = Array.from(host.querySelectorAll('[data-v]')).find(function(node) { return node.dataset.v === row.key; });
        if (!element) { nativeField(host,row.key,row.label,row.value); count++; sections[row.section] = true; }
        else if (empty(element.textContent.trim())) { element.textContent = row.value; count++; sections[row.section] = true; }
        else if (element.textContent.trim() !== row.value && pendingField(element,row.value,row.label)) { pending++; sections[row.section] = true; }
      });
      Object.keys(records).forEach(function(key) {
        var fields = records[key], section = fields[0].section, host = document.getElementById('secbody-' + section), conflicts = [];
        var added = mergeRecord(host.querySelector('#records-' + section),parsedRecord(section,fields),section,conflicts,host);
        count += added;
        conflicts.forEach(function(row) { if (pendingField(host.querySelectorAll('[data-v]')[row.index],row.incoming,row.field)) pending++; });
        if (added || conflicts.length) sections[section] = true;
      });
    });
    Object.keys(sections).forEach(function(section) { pbsCommitStudentSection(section,'追加解析选校资料'); });
    var profile = api.find(id), selectedIds = files.map(function(item) { return item.id; });
    Object.keys(sections).forEach(function(section) { var host = document.getElementById('secbody-' + section); profile.sections[section] = profile.sections[section] || snapshot(host); profile.sections[section].html = host.innerHTML; });
    profile.pendingParseFiles = (profile.pendingParseFiles || []).filter(function(value) { return selectedIds.indexOf(value) < 0; }); profile.preParseStates = profile.preParseStates || {}; selectedIds.forEach(function(key) { profile.preParseStates[key] = new Date().toISOString(); }); saveProfile(profile);
    return {count:count,pending:pending};
  }
  document.addEventListener('click',function(event) {
    var button = event.target.closest('[data-use-parsed],[data-keep-current]'); if (!button || !api.canEdit(window.PBS_STUDENT_ID)) return;
    var choice = button.closest('[data-pa-value]'), cell = choice.parentElement, section = choice.closest('section[data-section]');
    var field = Array.from(cell.querySelectorAll('[data-v]')).find(function(node) { return node.dataset.v === choice.dataset.paKey; });
    if (field) {
      if (button.hasAttribute('data-use-parsed')) field.textContent = choice.dataset.paValue;
      else field.dataset.paIgnored = (field.dataset.paIgnored ? field.dataset.paIgnored + '\n' : '') + choice.dataset.paValue;
    }
    choice.remove();
    if (section) {
      pbsCommitStudentSection(section.dataset.section,'确认选校资料解析结果');
      var profile = api.find(window.PBS_STUDENT_ID); profile.sections[section.dataset.section].html = document.getElementById('secbody-' + section.dataset.section).innerHTML; saveProfile(profile);
    }
  });
  function repairImports(profile) {
    var imports = (profile.preImports || []).filter(function(item) { return !item.moduleMergeVersion; });
    if (!imports.length || !api.canEdit(profile.id)) return;
    var changed = {}, parsed = [];
    document.querySelectorAll('.pa-import-values').forEach(function(extra) {
      var body = extra.closest('[id^="secbody-"]'), section = body && body.id.replace('secbody-','');
      if (section && (recordKeys[section] || section === 'lang' || section === 'score')) {
        var fields = [];
        extra.querySelectorAll('[data-f]').forEach(function(cell) {
          var label = cell.querySelector('span'), value = cell.querySelector('[data-v]'); if (!label || !value) return;
          var name = label.textContent.trim(), definitions = (window.PBSProfileFieldLabels || {})[section] || [];
          var definition = definitions.find(function(item) { return item[1] === name; });
          var key = definition ? definition[0] : Object.keys(scoreLabels).find(function(key) { return scoreLabels[key] === name; });
          if (key) fields.push({section:section,key:key,label:name,value:value.textContent.trim()});
        });
        if (fields.length) parsed.push({id:'import-repair-' + section,category:section,parseFields:fields});
      }
      if (section) changed[section] = true; extra.remove();
    });
    imports.forEach(function(item) {
      var source = {sections:item.sections || {}}, merged = mergeSections(source,[]);
      Object.keys(merged.sections).forEach(function(section) { document.getElementById('secbody-' + section).innerHTML = merged.sections[section].html; changed[section] = true; });
      item.modules = merged.counts; item.moduleMergeVersion = 1;
    });
    Object.keys(changed).forEach(function(section) { pbsCommitStudentSection(section,'追加预档案资料'); });
    var current = api.find(profile.id); current.preImports = profile.preImports;
    Object.keys(changed).forEach(function(section) {
      var host = document.getElementById('secbody-' + section).cloneNode(true), bindings = host.querySelector('#studentSelectionBindings'); if (bindings) bindings.remove();
      current.sections[section] = current.sections[section] || snapshot(host); current.sections[section].html = host.innerHTML;
    });
    saveProfile(current); if (parsed.length) parseResults(profile.id,parsed);
  }
  function afterProjectCreated(project) {
    var profile = api.find(project.studentId); if (!profile) return;
    modal('项目已创建','学生正式档案已自动建立。','<div class="pa-summary">' + esc(profile.name) + ' · ' + esc(project.projectNo) + '<br>进入学生档案的申请记录，绑定选校单后可追加预档案资料并继续解析。</div>','<button class="pa-button" data-pa-close>留在项目池</button><a class="pa-button primary" href="' + profileUrl(profile.id) + '">完善学生档案</a>');
  }
  function linkSelectionProfiles() {
    if (!window.pbsSelection) return;
    pbsSelection.seed();
    if (!localStorage.getItem('pbs_selection_pre_demo_v1') && pbsHasPermission('school_task_create')) {
      var target = api.visible().find(function(item) { return item.name === '张明'; }) || api.visible()[0];
      if (target) {
        var orphan = api.preliminary().find(function(item) { return !item.selectionId && !item.boundTo && item.name === target.name; });
        var task = pbsSelection.create({preStudentId:orphan && orphan.id,student:target.name,level:target.student.level || '硕士申请',phone:target.student.phone || '13800002601',country:'美国',major:'计算机科学',supplement:'本科计算机专业，GPA 3.6 / 4.0。关注人工智能与就业机会，年度预算 45 万元人民币。'});
        var first = task && api.find(task.preStudentId);
        if (first) {
          var fields = [['school','就读学校','南京大学'],['major','专业','计算机科学与技术'],['grade','成绩','3.6 / 4.0'],['start','起始时间','2022-09'],['end','终止时间','2026-06']];
          var html = '<div class="flex justify-end mb-4"><button class="pa-text-button" onclick="addRecord(\'edu\')">新增教育背景</button></div><div id="records-edu" class="space-y-4"><div class="border border-gray-200 rounded-xl p-4" data-record data-record-key="pre-demo-edu"><div class="flex items-center justify-between mb-3"><span>1</span><div class="flex items-center gap-1"><button class="pa-text-button" onclick="editRecord(this)">编辑</button><button class="pa-text-button" onclick="delRecord(this)">删除</button></div></div><div class="grid grid-cols-3 gap-x-6 gap-y-4">' + fields.map(function(field) { return '<div data-f="' + field[0] + '"><p class="text-xs text-gray-400 mb-1">' + field[1] + '</p><p class="text-sm font-medium text-gray-900" data-v="' + field[0] + '">' + field[2] + '</p></div>'; }).join('') + '</div></div></div>';
          first.sections.edu = {html:html,values:{school:'南京大学',major:'计算机科学与技术',grade:'3.6 / 4.0'},labels:{school:'就读学校',major:'专业',grade:'成绩'}}; first.demoSourceFile = true; saveProfile(first);
        }
        var second = api.preliminary().find(function(item) { return !item.selectionId && !item.boundTo && item.name === '林可欣'; });
        pbsSelection.create({preStudentId:second && second.id,student:'林可欣',level:'硕士申请',phone:'13800002602',country:'英国',major:'商业分析',supplement:'希望申请一年制硕士，已有两段数据分析实习经历。'});
        localStorage.setItem('pbs_selection_pre_demo_v1','1');
      }
    }
    pbsSelection.visible().forEach(function(task) { pbsSelection.ensurePre(task.id); });
    if (/选校任务列表/.test(file) && window.pbsRenderSelectionTasks) pbsRenderSelectionTasks();
  }
  async function seedFile() {
    var profile = api.preliminary().find(function(item) { return item.demoSourceFile; }); if (!profile) return;
    var fileId = 'pre-ielts-' + profile.id;
    try {
      var created = await assets(function(all,store) {
        if (all.some(function(item) { return item.id === fileId; })) return false;
        var content = '学生：' + profile.name + '\n雅思总分：7.0\n听力：7.5\n阅读：7.0\n写作：6.5\n口语：7.0';
        store.put({id:fileId,owner:profile.id,name:'雅思成绩单.txt',category:'lang',size:'1 KB',date:'2026-11-05',file:new Blob([content],{type:'text/plain;charset=utf-8'}),parseFields:[{sel:'[data-v="ieltsT"]',label:'雅思总分',value:'7.0'},{sel:'[data-v="ieltsL"]',label:'雅思听力',value:'7.5'},{sel:'[data-v="ieltsR"]',label:'雅思阅读',value:'7.0'},{sel:'[data-v="ieltsW"]',label:'雅思写作',value:'6.5'},{sel:'[data-v="ieltsS"]',label:'雅思口语',value:'7.0'}]}); return true;
      });
      profile.demoSourceFile = false; saveProfile(profile);
      if (created && window.PBS_STUDENT_ID === profile.id && document.getElementById('studentInfoCard')) location.reload();
    } catch(e) { notify('演示文件读取失败，请刷新重试'); }
  }
  window.pbsPreArchive = {taskCreated:taskCreated,taskArchiveLink:taskArchiveLink,afterProjectCreated:afterProjectCreated,bindSelection:bindSelection,openParse:openParse,showImports:showImports};
  function init() {
    linkSelectionProfiles(); createForm(); detailGuide(); seedFile();
    if (document.getElementById('studentInfoCard') && window.parseFile) {
      var parse = window.parseFile;
      window.parseFile = async function(button) {
        var row = button.closest('[data-file]'), fileId = row && row.dataset.file;
        try {
          var stored = await assets(function(all) { return all.find(function(item) { return item.id === fileId && item.owner === window.PBS_STUDENT_ID; }); });
          if (stored && stored.parseFields) window.PARSE_RESULTS[fileId] = stored.parseFields;
          return parse(button);
        } catch(e) { notify('文件读取失败，请重试'); }
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
