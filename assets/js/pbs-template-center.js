(function () {
  'use strict';
  var api=window.pbsTemplatePublishing, tab='draft';
  function esc(value){return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function time(value){return value ? new Date(value).toLocaleString('sv-SE').slice(0,16) : '—';}
  function organizations(){return (window.PBS_ORGANIZATIONS || [{name:'PBS留学总部'},{name:'上海启明留学'},{name:'北京知行教育'}]).map(function(item){return item.name;});}
  function modal(title,content,footer){var dialog=document.createElement('dialog');dialog.className='template-publishing-dialog';dialog.innerHTML='<header><h3>'+esc(title)+'</h3><button data-close aria-label="关闭">×</button></header>'+content+(footer?'<footer>'+footer+'</footer>':'');dialog.onclick=function(event){if(event.target===dialog || event.target.closest('[data-close]'))dialog.close();};dialog.onclose=function(){dialog.remove();};document.body.appendChild(dialog);dialog.showModal();return dialog;}
  function openSnapshot(item){
    var version=item.snapshot.versions[0], fields=version.fieldDetails || [], materials=version.materialDetails || [];
    modal(item.snapshot.name+' · '+item.version,'<div class="p-5 text-sm text-gray-500">'+esc(item.snapshot.school+' · '+item.snapshot.college)+'</div><div class="publishing-scroll"><table><thead><tr><th>字段名称</th><th>类型</th><th>必填</th><th>填写要求</th></tr></thead><tbody>'+fields.map(function(field){return '<tr><td>'+esc(field.name)+'</td><td>'+esc(field.type)+'</td><td>'+(field.required?'是':'否')+'</td><td>'+esc(field.note)+'</td></tr>';}).join('')+'</tbody></table><h4 class="px-5 pt-5 font-medium">申请材料</h4><div class="p-5 text-sm space-y-3">'+materials.map(function(material){return '<p>'+esc(material.name)+' · '+esc(material.note)+'</p>';}).join('')+'</div></div>','<button class="btn" data-close>关闭</button>');
  }
  window.openPublishTemplate=function(id){
    if(!api.isPublisher())return;
    var draft=api.drafts().find(function(item){return Number(item.id)===Number(id);});if(!draft)return;
    var dialog=modal('发布网申模板','<div class="p-6"><p class="font-medium mb-5">'+esc(draft.name)+' · '+esc(draft.versions[0].version)+'</p><label class="block mb-4"><input type="radio" name="publishScope" value="all" checked> 全部机构</label><label class="block"><input type="radio" name="publishScope" value="selected"> 指定机构</label><div id="publishOrganizations" class="mt-4 grid grid-cols-2 gap-3">'+organizations().map(function(org){return '<label class="text-sm"><input type="checkbox" value="'+esc(org)+'" disabled> '+esc(org)+'</label>';}).join('')+'</div><p data-error class="text-sm text-red-500 mt-4"></p></div>','<button class="btn" data-close>取消</button><button class="btn primary" data-publish>发布</button>');
    dialog.addEventListener('change',function(){var all=dialog.querySelector('[name="publishScope"]:checked').value==='all';dialog.querySelectorAll('[type="checkbox"]').forEach(function(input){input.disabled=all;});});
    dialog.querySelector('[data-publish]').onclick=function(){var scope=dialog.querySelector('[name="publishScope"]:checked').value==='all'?['*']:Array.from(dialog.querySelectorAll('[type="checkbox"]:checked')).map(function(input){return input.value;});var result=api.publish(id,scope);if(result.error){dialog.querySelector('[data-error]').textContent=result.error;return;}dialog.close();renderCenter();};
  };
  window.openExtractTemplate=function(){
    if(!api.isPublisher())return;
    var dialog=modal('提取机构模板','<div class="p-5 flex gap-3"><input data-search class="input flex-1" placeholder="搜索模板、院校或专业"><select data-org class="input"><option value="">全部机构</option>'+organizations().map(function(org){return '<option>'+esc(org)+'</option>';}).join('')+'</select></div><div class="publishing-scroll"><table><thead><tr><th>模板名称</th><th>所属机构</th><th>院校 / 学院</th><th>版本</th><th>操作</th></tr></thead><tbody></tbody></table></div>');
    function render(){var kw=dialog.querySelector('[data-search]').value.trim().toLowerCase(),org=dialog.querySelector('[data-org]').value;var list=api.institutions().filter(function(item){return(!org||item.org===org)&&(!kw||(item.name+item.school+(item.boundPrograms||[]).join('')).toLowerCase().includes(kw));});dialog.querySelector('tbody').innerHTML=list.map(function(item){return '<tr><td>'+esc(item.name)+'</td><td>'+esc(item.org)+'</td><td>'+esc(item.school+' · '+item.college)+'</td><td>'+esc(item.versions[0].version)+'</td><td><button data-extract="'+item.id+'" class="text-blue-600">提取</button></td></tr>';}).join('')||'<tr><td colspan="5" class="text-center text-gray-400">暂无模板</td></tr>';}
    dialog.addEventListener('input',render);dialog.addEventListener('change',render);dialog.addEventListener('click',function(event){var button=event.target.closest('[data-extract]');if(!button)return;var result=api.extract(button.dataset.extract);if(result)location.href='网申模板编辑 - 留学申请管理系统.html?center=1&id='+result.id;});render();
  };
  window.openPublishedTemplateCatalog=function(){
    var list=api.available().slice().reverse(), dialog=modal('已发布网申模板','<div class="p-5"><input data-search class="input w-full" placeholder="搜索模板、院校或版本"></div><div class="publishing-scroll"><table><thead><tr><th>模板名称</th><th>院校 / 学院</th><th>版本</th><th>发布时间</th><th>操作</th></tr></thead><tbody></tbody></table></div><p data-error class="px-5 py-3 text-sm text-red-500"></p>');
    function render(){var kw=dialog.querySelector('[data-search]').value.trim().toLowerCase();dialog.querySelector('tbody').innerHTML=list.filter(function(item){return!kw||(item.snapshot.name+item.snapshot.school+item.version).toLowerCase().includes(kw);}).map(function(item){return '<tr><td>'+esc(item.snapshot.name)+'</td><td>'+esc(item.snapshot.school+' · '+item.snapshot.college)+'</td><td>'+esc(item.version)+'</td><td>'+time(item.at)+'</td><td class="whitespace-nowrap"><button class="text-blue-600 mr-4" data-view="'+item.id+'">查看</button><button class="text-blue-600" data-adopt="'+item.id+'">引用到本机构</button></td></tr>';}).join('')||'<tr><td colspan="5" class="text-center text-gray-400">暂无已发布模板</td></tr>';}
    dialog.addEventListener('input',render);dialog.addEventListener('click',function(event){var view=event.target.closest('[data-view]'),adopt=event.target.closest('[data-adopt]');if(view)openSnapshot(list.find(function(item){return item.id===view.dataset.view;}));if(adopt){var result=api.adopt(adopt.dataset.adopt);if(result.error){dialog.querySelector('[data-error]').textContent=result.error;return;}location.reload();}});render();
  };
  window.setPublishingTab=function(value){tab=value;renderCenter();};
  function renderCenter(){
    var body=document.getElementById('publishingRows');if(!body)return;
    var kw=document.getElementById('publishingSearch').value.trim().toLowerCase();
    document.querySelectorAll('[data-publishing-tab]').forEach(function(button){button.classList.toggle('active',button.dataset.publishingTab===tab);});
    var publications=api.publications();
    if(tab==='draft'){
      document.getElementById('publishingHead').innerHTML='<tr>'+['模板名称','院校 / 学院','来源机构','版本','扫描状态','发布状态','操作'].map(function(label){return '<th>'+label+'</th>';}).join('')+'</tr>';
      body.innerHTML=api.drafts().filter(function(item){return !kw||(item.name+item.school+item.college+(item.sourceOrg||'')).toLowerCase().includes(kw);}).map(function(item){var published=publications.some(function(pub){return pub.templateId===item.id&&pub.version===item.versions[0].version;});return '<tr><td>'+esc(item.name)+'</td><td>'+esc(item.school)+'<small>'+esc(item.college)+'</small></td><td>'+esc(item.sourceOrg||'平台')+'</td><td>'+esc(item.versions[0].version)+'</td><td>'+esc(pbsTemplateScan.status(item.id))+'</td><td>'+(published?'已发布':'未发布')+'</td><td class="whitespace-nowrap"><a class="text-blue-600 mr-4" href="网申模板编辑 - 留学申请管理系统.html?center=1&id='+item.id+'">编辑</a><button class="text-blue-600" onclick="openPublishTemplate('+item.id+')">发布</button></td></tr>';}).join('');
    }else{
      document.getElementById('publishingHead').innerHTML='<tr>'+['模板名称','院校 / 学院','版本','发布范围','发布时间','操作'].map(function(label){return '<th>'+label+'</th>';}).join('')+'</tr>';
      body.innerHTML=publications.slice().reverse().filter(function(item){return!kw||(item.snapshot.name+item.snapshot.school+item.version).toLowerCase().includes(kw);}).map(function(item){return '<tr><td>'+esc(item.snapshot.name)+'</td><td>'+esc(item.snapshot.school)+'<small>'+esc(item.snapshot.college)+'</small></td><td>'+esc(item.version)+'</td><td>'+esc(item.scope.includes('*')?'全部机构':item.scope.join('、'))+'</td><td>'+time(item.at)+'</td><td><button class="text-blue-600" data-publication="'+item.id+'">查看</button></td></tr>';}).join('');
    }
    if(!body.innerHTML)body.innerHTML='<tr><td colspan="'+(tab==='draft'?7:6)+'" class="text-center text-gray-400 py-12">暂无模板</td></tr>';
  }
  window.addEventListener('storage', function(event) { if (event.key === api.platformKey || window.pbsTemplateScan && event.key === pbsTemplateScan.key) renderCenter(); });
  document.addEventListener('DOMContentLoaded',function(){
    if(document.getElementById('publishingRows')){
      if(!api.isPublisher()){document.querySelector('main').innerHTML='<p class="p-8 text-gray-500">无权访问网申模板发布中心</p>';return;}
      document.getElementById('publishingSearch').oninput=renderCenter;document.getElementById('publishingRows').onclick=function(event){var button=event.target.closest('[data-publication]');if(button)openSnapshot(api.publications().find(function(item){return item.id===button.dataset.publication;}));};renderCenter();
      var id=new URLSearchParams(location.search).get('publish');if(id)openPublishTemplate(id);
    }else{
      var actions=document.querySelector('main h1').parentElement;
      actions.insertAdjacentHTML('beforeend','<div class="flex gap-3">'+(api.isPublisher()?'<a class="btn" href="网申模板发布中心 - 留学申请管理系统.html">发布中心</a>':'')+'<button class="btn" onclick="openPublishedTemplateCatalog()">引用已发布模板</button></div>');
    }
  });
})();
