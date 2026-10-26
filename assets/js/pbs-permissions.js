(function () {
  'use strict';
  var $ = function(id) { return document.getElementById(id); };
  var clone = function(value) { return JSON.parse(JSON.stringify(value)); };
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch(e) { return fallback; } }
  function escape(value) { return String(value || '').replace(/[&<>"']/g,function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  var scope = window.pbsPermissionScope();
  var platform = scope === 'default';
  var defaults = window.pbsDefaultRolePermissions;
  var tree = window.pbsPermissionTree;
  var roles = [];
  var selected;
  var draft = [];
  var backup = [];
  var expanded = {};
  var dialogMode;
  var pendingConfirm;
  var toastTimer;
  var groups = {};
  tree.forEach(function(group) { groups[group.id] = group; });
  function flat(value) { return Object.keys(value || {}).reduce(function(out,key) { return out.concat(value[key] || []); },[]); }
  function normalize(role,value) { return flat(window.pbsMigrateRolePermissions(role,value)); }
  function changed() { return draft.slice().sort().join('|') !== backup.slice().sort().join('|'); }
  function allowed(id) { return window.pbsHasPermission(id); }
  function required(id,role) { return window.pbsRequiredRolePermissions((role || selected).name).indexOf(id)>=0; }
  function canConfigure(role) {
    var session=window.pbsGetSession(), identities=session.userRoles || session.roles || [session.role];
    return allowed('sys_role_save') && (role.name!=='平台运维人员' || identities.indexOf('超级管理员')>=0);
  }
  function notify(message) { clearTimeout(toastTimer); $('permissionToast').textContent = message; $('permissionToast').hidden = false; toastTimer = setTimeout(function(){ $('permissionToast').hidden=true; },2600); }
  function record(type, content) { if (window.pbsRecordOperation) window.pbsRecordOperation('角色权限管理',type,content,'成功'); }
  function visibleGroups(role) {
    role=role || selected;
    return window.pbsRolePermissionPages(role.name);
  }
  function itemsOf(group,role) {
    if (group.id !== 'wb_home') return group.items;
    role=role || selected;
    var order=['workbench_pmo','workbench_org_admin','workbench_sales_manager','workbench_pm','workbench_sales','workbench_writer','workbench_apply','workbench_audit','workbench_docadmin'];
    if (role.name==='平台运维人员') order=['workbench_platform'];
    return order.map(function(id){return group.items.filter(function(item){return item.id===id;})[0];}).filter(Boolean);
  }
  function groupIds(group,visible) {
    var ids=itemsOf(group).map(function(item){return item.id;});
    visible.filter(function(child){return child.parent===group.id;}).forEach(function(child){ids=ids.concat(groupIds(child,visible));});
    return ids;
  }
  function permittedIds(role) {
    return visibleGroups(role).reduce(function(out,group){return out.concat(itemsOf(group,role).map(function(item){return item.id;}));},[]);
  }
  function checkbox(id,ids,text,cls) {
    var checked=ids.length && ids.every(function(value){return draft.indexOf(value)>=0;});
    var locked=ids.length && ids.every(function(value) { return required(value); });
    return '<label class="'+(cls || 'perm-check')+'"'+(locked?' title="管理角色的角色权限管理为必选"':'')+'><input type="checkbox" data-node="'+escape(id)+'" '+(checked?'checked ':'')+(!canConfigure(selected) || locked?'disabled ':'')+'><span>'+escape(text)+'</span>'+(locked?'<svg class="permission-lock" viewBox="0 0 16 16" fill="none" aria-label="必选权限"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor"/><path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor"/></svg>':'')+'</label>';
  }
  function operation(item) {
    var hint=item.hint ? '<span class="permission-hint" tabindex="0" title="'+escape(item.hint)+'" aria-label="'+escape(item.hint)+'"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor"/><path d="M8 7v4m0-6v.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>' : '';
    return '<div class="permission-operation">'+checkbox('item:'+item.id,[item.id],item.label)+hint+'</div>';
  }
  function buildTree() {
    var visible=visibleGroups(),modules=[];
    visible.forEach(function(group){if(modules.indexOf(group.module)<0)modules.push(group.module);});
    var keyword=$('permissionSearch').value.trim().toLowerCase(),html='';
    var order=['新增','查询','修改','编辑','删除','导出'];
    modules.forEach(function(module,index) {
      var all=visible.filter(function(group){return group.module===module;});
      var children=all.filter(function(group){return !keyword || (module+' '+group.name+' '+itemsOf(group).map(function(item){return item.label+' '+(item.hint || '');}).join(' ')).toLowerCase().indexOf(keyword)>=0;});
      if(!children.length)return;
      var key='module:'+module,open=!!keyword || !!expanded[key];
      var ids=all.reduce(function(out,group){return out.concat(itemsOf(group).map(function(item){return item.id;}));},[]);
      var single=all.length===1 && all[0].id!=='wb_home' && itemsOf(all[0]).length===1;
      html+='<section class="permission-module" aria-label="'+escape(module)+'">';
      if(single) {
        html+='<div class="permission-module-header is-single"><h3>'+escape(module)+'</h3><div class="permission-operations">'+operation(itemsOf(all[0])[0])+'</div></div>';
      } else {
        html+='<div class="permission-module-header"><button type="button" class="permission-module-toggle" data-expand="'+escape(key)+'" aria-expanded="'+open+'" aria-controls="permission-module-'+index+'"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>'+escape(module)+'</span></button>'+checkbox(key,ids,'全选','perm-check permission-module-select')+'</div>';
        if(open) {
          html+='<div id="permission-module-'+index+'" class="permission-module-body">';
          children.forEach(function(group) {
            if(group.id==='wb_home') {
              itemsOf(group).filter(function(item){return !keyword || module.indexOf(keyword)>=0 || item.label.toLowerCase().indexOf(keyword)>=0;}).forEach(function(item){html+='<div class="permission-workbench-row">'+checkbox('item:'+item.id,[item.id],item.label)+'</div>';});
            } else {
              var operations=itemsOf(group).slice().sort(function(a,b){return order.indexOf(a.label)-order.indexOf(b.label);});
              html+='<div class="permission-page-row" data-page="'+escape(group.id)+'"><div class="permission-page-name">'+escape(group.name)+'</div><div class="permission-operations">'+operations.map(operation).join('')+'</div></div>';
            }
          });
          html+='</div>';
        }
      }
      html+='</section>';
    });
    $('permissionTree').innerHTML=html || '<div class="permission-empty">暂无匹配的权限</div>';
    $('permissionTree').querySelectorAll('[data-node]').forEach(function(input){var ids=nodeIds(input.dataset.node),count=ids.filter(function(id){return draft.indexOf(id)>=0;}).length;input.indeterminate=count>0 && count<ids.length;});
    updateSummary();
  }
  function nodeIds(key) {
    var value=key.slice(key.indexOf(':')+1);
    if(key.indexOf('item:')===0)return [value];
    return visibleGroups().filter(function(group){return group.module===value;}).reduce(function(out,group){return out.concat(itemsOf(group).map(function(item){return item.id;}));},[]);
  }
  function enableAncestors(id) {
    var group=groups[window.pbsPermissionGroupOf[id]];
    while(group) {
      if(group.id!=='wb_home' && draft.indexOf(group.items[0].id)<0)draft.push(group.items[0].id);
      group=groups[group.parent];
    }
  }
  function toggle(ids,checked) {
    if(!canConfigure(selected))return;
    ids.forEach(function(id){
      if(checked){if(draft.indexOf(id)<0)draft.push(id);enableAncestors(id);}
      else {var group=groups[window.pbsPermissionGroupOf[id]];var remove=group && group.id!=='wb_home' && group.items[0].id===id ? groupIds(group,visibleGroups()) : [id];draft=draft.filter(function(value){return remove.indexOf(value)<0;});}
    });
    draft=window.pbsConstrainRolePermissions(selected.name,draft);
    buildTree();
  }
  function updateSummary() {
    var ids=permittedIds();
    var count=ids.filter(function(id){return draft.indexOf(id)>=0;}).length;
    $('selectAllPermissions').checked=count===ids.length;
    $('selectAllPermissions').indeterminate=count>0 && count<ids.length;
    $('selectAllPermissions').disabled=!canConfigure(selected);
    $('permissionSummary').textContent='已选 '+count+' / '+ids.length+' 项权限'+(changed()?' · 未保存':'');
    $('permissionSummary').classList.toggle('dirty',changed());
    $('savePermissions').disabled=!changed() || !canConfigure(selected);
    $('resetPermissions').disabled=!changed();
  }
  function renderRoles() {
    var keyword=$('roleSearch').value.trim().toLowerCase();
    var matched=roles.filter(function(role){return role.name.toLowerCase().indexOf(keyword)>=0;});
    var platformRoles=matched.filter(function(role){return role.name==='平台运维人员';});
    var institutionRoles=matched.filter(function(role){return role.name!=='平台运维人员';});
    var icons={'平台运维人员':'平','机构管理员':'机','PMO':'P','销售人员管理员':'销','销售人员':'销','项目经理':'项','文书机构管理员':'文','文书人员':'文','文书审核':'审','网申人员':'网'};
    function item(role) {
      var menus=[];
      visibleGroups(role).forEach(function(group){
        var entries=itemsOf(group,role);
        var accessible=group.id==='wb_home' ? entries.some(function(permission){return role.permissions.indexOf(permission.id)>=0;}) : role.permissions.indexOf(entries[0].id)>=0;
        if(accessible && menus.indexOf(group.module)<0)menus.push(group.module);
      });
      var status=role.status==='停用'?'停用':role.isCustom?'自定义':'系统';
      return '<button type="button" class="role-item '+(role===selected?'active ':'')+(role.status==='停用'?'is-disabled':'')+'" data-role="'+escape(role.id)+'" aria-pressed="'+(role===selected)+'"><span class="role-avatar" aria-hidden="true">'+escape(icons[role.name] || role.name.charAt(0))+'</span><span class="role-copy"><strong class="role-label" title="'+escape(role.name)+'">'+escape(role.name)+'</strong><span class="role-meta">'+menus.length+' 个菜单 · '+(role.name==='平台运维人员'?'平台':'机构')+'</span></span><span class="role-kind">'+status+'</span></button>';
    }
    $('roleCount').textContent=roles.length;
    $('roleList').innerHTML=matched.length ? (platformRoles.length?'<div class="role-group role-group-platform" role="group" aria-label="平台角色">'+platformRoles.map(item).join('')+'</div>':'')+(institutionRoles.length?'<div class="role-group role-group-institution" role="group" aria-label="机构角色">'+institutionRoles.map(item).join('')+'</div>':'') : '<div class="permission-empty">未找到角色</div>';
  }
  function selectRole(role) {
    selected=role; draft=clone(role.permissions); backup=clone(draft);
    visibleGroups(role).forEach(function(group) {var key='module:'+group.module;if(expanded[key]===undefined)expanded[key]=group.module!=='工作台';});
    $('roleName').textContent=role.name;
    $('roleDescription').textContent=role.description || '';
    $('deleteRole').hidden=!role.isCustom;
    $('editRole').disabled=!canConfigure(role);
    $('copyRole').disabled=!canConfigure(role);
    $('permissionSearch').value='';
    renderRoles(); buildTree();
  }
  function confirm(title,message,callback) {
    $('confirmTitle').textContent=title; $('confirmMessage').textContent=message;
    pendingConfirm=callback; $('permissionConfirm').showModal();
  }
  function leaveDraft(callback) { if(changed()) confirm('放弃未保存的修改？','当前权限修改尚未保存。',callback); else callback(); }
  function persisted() {
    var scopes=read('pbs_role_perms_scoped_v1',{});
    var map=Object.assign({},scopes[scope] || {});
    roles.forEach(function(role){role.permissions=normalize(role.name,window.pbsPermissionGroupIds(role.permissions));map[role.name]=window.pbsPermissionGroupIds(role.permissions);});
    scopes[scope]=map;
    localStorage.setItem('pbs_role_perms_scoped_v1',JSON.stringify(scopes));
    if (scope==='default') localStorage.setItem('pbs_role_perms_v1',JSON.stringify(map));
    var custom=read('pbs_custom_roles_v1',{});
    custom[scope]=roles.filter(function(role){return role.isCustom;}).map(function(role){return Object.assign({},role,{permissions:window.pbsPermissionGroupIds(role.permissions)});});
    localStorage.setItem('pbs_custom_roles_v1',JSON.stringify(custom));
    var metadata=read('pbs_role_metadata_v1',{});metadata[scope]={};
    roles.forEach(function(role){metadata[scope][role.name]={description:role.description,status:role.status};});
    localStorage.setItem('pbs_role_metadata_v1',JSON.stringify(metadata));
  }
  function openRoleDialog(mode) {
    if (!allowed(mode==='edit'?'sys_role_edit':'sys_role_create')) return;
    if (mode!=='create' && !canConfigure(selected))return;
    leaveDraft(function(){
      dialogMode=mode;
      $('roleDialogTitle').textContent=mode==='edit'?'编辑角色':mode==='copy'?'复制角色':'新增角色';
      $('roleFormName').value=mode==='edit'?selected.name:mode==='copy'?selected.name+'副本':'';
      $('roleFormName').readOnly=mode==='edit';
      $('roleFormDescription').value=mode==='create'?'':selected.description;
      $('roleForm').querySelector('[name="roleStatus"][value="'+(mode==='edit'?selected.status:'启用')+'"]').checked=true;
      $('roleFormError').textContent='';$('roleDialog').showModal();
      $('roleFormName').focus();
    });
  }
  function load() {
    var scoped=read('pbs_role_perms_scoped_v1',{});
    var saved=Object.assign({},read('pbs_role_perms_v1',{}),scoped.default || {},scoped[scope] || {});
    var allMetadata=read('pbs_role_metadata_v1',{});
    var metadata=Object.assign({},allMetadata.default || {},allMetadata[scope] || {});
    var descriptions={'机构管理员':'机构运营、项目统筹与成员管理','PMO':'项目分配、交付统筹与结项核验','销售人员':'客户跟进与选校服务','销售人员管理员':'销售团队与选校任务管理','项目经理':'项目执行与交付协作','文书机构管理员':'文书团队、模板与审核管理','文书人员':'文书撰写与交付','文书审核':'文书评审与审核','网申人员':'网申填报与申请跟进','平台运维人员':'平台机构、账号与系统配置'};
    var names=['机构管理员','PMO','销售人员管理员','销售人员','项目经理','文书机构管理员','文书人员','文书审核','网申人员'];
    if(platform) names.push('平台运维人员');
    roles=names.map(function(name,index){return {id:'builtin-'+index,name:name,description:(metadata[name] || {}).description || descriptions[name],status:(metadata[name] || {}).status || '启用',isCustom:false,permissions:normalize(name,saved[name] || defaults[name] || {})};});
    (read('pbs_custom_roles_v1',{})[scope] || []).forEach(function(role){ if(!roles.some(function(item){return item.name===role.name;})) roles.push(Object.assign({},role,{id:String(role.id),isCustom:true,permissions:normalize(role.name,saved[role.name] || role.permissions)})); });
    tree.forEach(function(group){expanded['module:'+group.module]=group.module!=='工作台';});
    selectRole(roles[0]);
  }
  $('roleSearch').addEventListener('input',renderRoles);
  $('roleList').addEventListener('click',function(event){var button=event.target.closest('[data-role]');if(button) leaveDraft(function(){selectRole(roles.filter(function(role){return String(role.id)===button.dataset.role;})[0]);});});
  $('permissionSearch').addEventListener('input',function() { $('permissionTree').scrollTop=0; buildTree(); });
  $('permissionTree').addEventListener('click',function(event){var button=event.target.closest('[data-expand]');if(button){expanded[button.dataset.expand]=!expanded[button.dataset.expand];buildTree();}});
  $('permissionTree').addEventListener('change',function(event){if(event.target.dataset.node) toggle(nodeIds(event.target.dataset.node),event.target.checked);});
  $('selectAllPermissions').addEventListener('change',function(){toggle(permittedIds(),this.checked);});
  $('expandPermissions').addEventListener('click',function(){Object.keys(expanded).forEach(function(key){expanded[key]=true;});buildTree();});
  $('collapsePermissions').addEventListener('click',function(){Object.keys(expanded).forEach(function(key){expanded[key]=false;});buildTree();});
  $('resetPermissions').addEventListener('click',function(){draft=clone(backup);buildTree();});
  $('savePermissions').addEventListener('click',function(){
    if(!canConfigure(selected) || !changed()) return;
    var session=window.pbsGetSession();
    if ((session.userRoles || [session.role]).indexOf('超级管理员')<0 && (session.userRoles || [session.role]).indexOf(selected.name)>=0 && draft.indexOf('sys_role_save')<0) {
      confirm('保存权限？','保存后，当前角色将无法继续配置权限。',save);
    } else save();
    function save(){var previous=selected.permissions;draft=window.pbsConstrainRolePermissions(selected.name,draft);selected.permissions=clone(draft);try{persisted();backup=clone(draft);record('修改','配置角色权限：'+selected.name);notify('权限已保存');renderRoles();buildTree();}catch(e){selected.permissions=previous;notify('保存失败，请重试');}}
  });
  $('createRole').addEventListener('click',function(){openRoleDialog('create');});
  $('editRole').addEventListener('click',function(){openRoleDialog('edit');});
  $('copyRole').addEventListener('click',function(){openRoleDialog('copy');});
  $('roleForm').addEventListener('submit',function(event){
    event.preventDefault();
    if(!allowed(dialogMode==='edit'?'sys_role_edit':'sys_role_create')) return;
    var name=$('roleFormName').value.trim();
    if(!name){$('roleFormError').textContent='请输入角色名称';return;}
    if(dialogMode!=='edit' && roles.some(function(role){return role.name===name;})){$('roleFormError').textContent='角色名称已存在';return;}
    var status=$('roleForm').querySelector('[name="roleStatus"]:checked').value;
    if(dialogMode==='edit' && window.pbsRequiredRolePermissions(selected.name).length && status==='停用'){$('roleFormError').textContent='管理角色需保持启用';return;}
    var role=dialogMode==='edit'?selected:{id:'role-'+Date.now(),name:name,isCustom:true,permissions:dialogMode==='copy'?clone(backup):[]};
    role.description=$('roleFormDescription').value.trim();role.status=status;
    if(dialogMode!=='edit')roles.push(role);
    try{persisted();$('roleDialog').close();selectRole(role);record(dialogMode==='edit'?'修改':'新增','角色：'+role.name);notify('角色已保存');}catch(e){notify('保存失败，请重试');}
  });
  $('deleteRole').addEventListener('click',function(){
    if(!selected.isCustom || !allowed('sys_role_delete'))return;
    var accounts=window.pbsAccounts && window.pbsAccounts.all ? window.pbsAccounts.all() : read('pbs_managed_accounts_v2',[]);
    if(accounts.some(function(account){return (account.roles || [account.role]).indexOf(selected.name)>=0 && (!account.org || scope==='default' || scope==='org::'+account.org);})) {notify('该角色已分配给成员，请先调整成员角色');return;}
    confirm('删除角色？','确定删除“'+selected.name+'”？',function(){
      var name=selected.name;roles=roles.filter(function(role){return role!==selected;});
      var scopes=read('pbs_role_perms_scoped_v1',{});if(scopes[scope])delete scopes[scope][name];localStorage.setItem('pbs_role_perms_scoped_v1',JSON.stringify(scopes));
      persisted();selectRole(roles[0]);record('删除','角色：'+name);notify('角色已删除');
    });
  });
  document.querySelectorAll('[data-close-dialog]').forEach(function(button){button.addEventListener('click',function(){$('roleDialog').close();});});
  $('confirmCancel').addEventListener('click',function(){$('permissionConfirm').close();pendingConfirm=null;});
  $('confirmAccept').addEventListener('click',function(){var callback=pendingConfirm;pendingConfirm=null;$('permissionConfirm').close();if(callback)callback();});
  window.addEventListener('beforeunload',function(event){if(changed()){event.preventDefault();event.returnValue='';}});
  load();
})();
