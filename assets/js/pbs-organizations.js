(function () {
  'use strict';
  var organizations=(window.PBS_ORGANIZATIONS || []).slice(), page=1, pageSize=20, keyword='';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function render() {
    var rows=organizations.filter(function(org){return !keyword || org.name.toLowerCase().indexOf(keyword)>=0;});
    var pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
    var staffed=organizations.filter(function(org){return org.members>0;}).length;
    document.getElementById('organizationTotal').textContent=organizations.length;
    document.getElementById('organizationStaffed').textContent=staffed;
    document.getElementById('organizationEmpty').textContent=organizations.length-staffed;
    document.getElementById('organizationTableBody').innerHTML=rows.slice((page-1)*pageSize,page*pageSize).map(function(org){
      var enabled=org.status!=='停用', count=org.members || 0;
      return '<tr><td>'+(org.avatar?'<img class="org-avatar" src="'+esc(org.avatar)+'" alt="'+esc(org.name)+' LOGO">':'')+'</td><td'+(org.id==='ORG-100001'?' style="font-weight:600"':'')+'>'+esc(org.name)+'</td><td>'+esc(org.createdAt)+'</td><td><span class="org-pill '+(count?'members':'empty')+'">'+count+' 人</span></td><td><span class="org-pill '+(enabled?'enabled':'disabled')+'">'+(enabled?'启用':'停用')+'</span></td><td><button class="org-action" data-manage-org="'+esc(org.id)+'"'+(!enabled?' disabled title="机构已停用"':'')+'>管理</button></td></tr>';
    }).join('');
    document.getElementById('organizationEmptyState').classList.toggle('hidden',rows.length>0);
    document.getElementById('organizationResultCount').textContent='共 '+rows.length+' 条';
    document.getElementById('organizationPagination').innerHTML='<button type="button" data-org-page="'+(page-1)+'" aria-label="上一页"'+(page===1?' disabled':'')+'>‹</button>'+Array.from({length:pages},function(_,i){return '<button type="button" data-org-page="'+(i+1)+'"'+(page===i+1?' aria-current="page"':'')+'>'+(i+1)+'</button>';}).join('')+'<button type="button" data-org-page="'+(page+1)+'" aria-label="下一页"'+(page===pages?' disabled':'')+'>›</button>';
  }
  window.searchOrganizations=function(event){if(event) event.preventDefault();keyword=document.getElementById('organizationSearch').value.trim().toLowerCase();page=1;render();};
  window.resetOrganizationSearch=function(){document.getElementById('organizationSearch').value='';keyword='';page=1;render();};
  document.getElementById('organizationPagination').onclick=function(event){var button=event.target.closest('[data-org-page]');if(button && !button.disabled){page=Number(button.dataset.orgPage);render();}};
  document.getElementById('organizationTableBody').onclick=function(event){var button=event.target.closest('[data-manage-org]');if(button && !button.disabled) location.href='人员管理 - PBS留学CRM系统.html?org='+encodeURIComponent(button.dataset.manageOrg);};
  document.getElementById('organizationSearch').addEventListener('input',function(){if(!this.value) window.resetOrganizationSearch();});
  render();
})();
