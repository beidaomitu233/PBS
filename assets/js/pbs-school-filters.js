(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('mode') === 'catalog') return;
  var root, records, state, timer, countrySelect, schoolSelect;
  var filterLabels=['地区与学校','专业与课程','申请与预算','就业偏好'];
  var activeTab=0;
  var schoolGroups=[],expandedSchool=null,programPageSize=5;
  var chevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>';
  var spark='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linejoin="round" d="m9 3 2.5 6.5L18 12l-6.5 2.5L9 21l-2.5-6.5L0 12l6.5-2.5L9 3Zm10-2 1.4 3.6L24 6l-3.6 1.4L19 11l-1.4-3.6L14 6l3.6-1.4L19 1Z"/></svg>';
  var scoreTypes=['雅思','新托福','老托福','GPA','IB','A-Level','AP','SAT','高考总分'];
  var categories=['文科','理科','工科','商科','艺术','医科'];
  var schoolAliases={cmu:'CMU Carnegie Mellon University 卡梅 卡内基梅隆',uiuc:'UIUC University of Illinois Urbana Champaign 伊利诺伊 香槟',gatech:'Georgia Tech Georgia Institute of Technology 佐治亚理工',nyu:'NYU New York University 纽大',bu:'BU Boston University 波大',nus:'NUS National University of Singapore 新国立',hku:'HKU University of Hong Kong 港大'};
  var extras={
    "EUDE00016-B00030":{"category": "文科", "discipline": "政治学", "direction": "政治理论", "careers": []},
    "EUFR00008-M00074":{"category": "工科", "discipline": "计算机科学与技术", "direction": "计算机科学", "careers": []},
    cmu:{category:'工科',discipline:'计算机科学与技术',direction:'人工智能',careers:['互联网 / 科技','金融'],softRank:80},
    uiuc:{category:'工科',discipline:'计算机科学与技术',direction:'软件工程',careers:['互联网 / 科技','咨询'],softRank:52},
    gatech:{category:'工科',discipline:'计算机科学与技术',direction:'人工智能',careers:['互联网 / 科技','制造业'],softRank:151},
    nyu:{category:'理科',discipline:'统计学',direction:'数据科学',careers:['金融','互联网 / 科技'],softRank:28},
    bu:{category:'工科',discipline:'计算机科学与技术',direction:'软件工程',careers:['互联网 / 科技','咨询'],softRank:101},
    nus:{category:'工科',discipline:'电子工程',direction:'通信工程',careers:['互联网 / 科技','制造业'],softRank:68},
    hku:{category:'理科',discipline:'统计学',direction:'数据科学',careers:['金融','咨询'],softRank:69}
  };
  function esc(v){return String(v == null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function defaults(){return {keyword:'',prompt:'',continent:'',countries:[],schools:[],stage:'',duration:'',categories:[],disciplines:[],directions:[],board:'',rank:'',languages:[],scores:[{type:'雅思',value:''}],feeType:'firstLife',feeMin:'',feeMax:'',period:null,careers:[],employers:[],salaryMin:0,salaryMax:100,includeUnknown:true,resultQuery:'',resultSort:'relevance',hideJoined:false};}
  function readState(){
    var value;try{value=JSON.parse(new URLSearchParams(location.search).get('filters') || 'null');}catch(e){}
    var next=Object.assign(defaults(),value && typeof value==='object' && !Array.isArray(value)?value:{});
    if(next.duration==='0-1') next.duration='1';
    delete next.cooperation;
    ['countries','schools','categories','disciplines','directions','languages','careers','employers'].forEach(function(key){if(!Array.isArray(next[key])) next[key]=[];});
    if(!Array.isArray(next.scores) || !next.scores.length) next.scores=[{type:'雅思',value:''}];
    next.scores=next.scores.map(function(row){return {type:scoreTypes.indexOf(row.type)>=0?row.type:'雅思',value:String(row.value || '')};});
    return next;
  }
  function selected(value,filter){return !filter.length || (unknown(value)?state.includeUnknown:filter.indexOf(value)>=0);}
  function any(values,filter){return !filter.length || (!values.length?state.includeUnknown:values.some(function(value){return filter.indexOf(value)>=0;}));}
  function unknown(value){return value===null || value===undefined || value==='';}
  function accepts(value,predicate){return unknown(value)?state.includeUnknown:predicate(value);}
  function unique(list){return Array.from(new Set(list));}
  function normalize(value){return String(value || '').toLowerCase().replace(/\bartificial intelligence\b|\bai\b/g,'人工智能').replace(/\bmachine learning\b|\bml\b/g,'机器学习').replace(/\bcs\b/g,'计算机科学').replace(/\s+/g,' ').trim();}
  function resultTerms(){return normalize(state.resultQuery).split(/[\s,，、;；]+/).filter(Boolean);}
  function highlight(value){
    var text=String(value || ''),terms=resultTerms();
    if(!terms.length)return esc(text);
    var expression=new RegExp('('+terms.map(function(term){return term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')','gi');
    return text.split(expression).map(function(part,index){return index%2?'<mark>'+esc(part)+'</mark>':esc(part);}).join('');
  }
  function clearResultSearch(){state.resultQuery='';document.getElementById('scResultQuery').value='';apply(true);document.getElementById('scResultQuery').focus();}
  function sortValue(record){var value=state.resultSort==='fee'?record.tuition:state.resultSort==='deadline'?Date.parse(record.end)||Infinity:record.rank;return unknown(value)?Infinity:value;}
  function addProgramExamples(){
    var examples={
      cmu:[['machine-learning','机器学习（MSML）','人工智能'],['software','软件工程（MSE）','软件工程'],['robotics','机器人学（MSR）','机器人'],['security','信息安全（MSIS）','网络安全'],['hci','人机交互（MHCI）','人机交互'],['language','语言技术（MLT）','自然语言处理']],
      uiuc:[['ai','计算机科学 · 人工智能方向（MSCS）','人工智能'],['systems','计算机科学 · 系统方向（MSCS）','计算机系统']],
      gatech:[['ai','计算机科学 · 机器学习方向（MSCS）','人工智能'],['hci','计算机科学 · 人机交互方向（MSCS）','人机交互']],
      nyu:[['analytics','数据科学 · 商业分析方向（MSDS）','商业分析']],
      bu:[['ai','计算机科学 · 人工智能方向（MSCS）','人工智能']],
      nus:[['ai','电子与计算机工程 · 智能系统方向（MS）','人工智能'],['embedded','电子与计算机工程 · 嵌入式系统方向（MS）','嵌入式系统']],
      hku:[['analytics','数据科学 · 商业分析方向（MDASC）','商业分析'],['ai','数据科学 · 人工智能方向（MDASC）','人工智能']]
    };
    Object.keys(examples).forEach(function(schoolId){
      var source=document.querySelector('#schoolList [data-school="'+schoolId+'"]');
      source.dataset.institution=schoolId;
      window.SCHOOL_INFO[schoolId].institutionId=schoolId;
      var previous=source;
      examples[schoolId].forEach(function(example){
        var id=schoolId+'-'+example[0],card=source.cloneNode(true),base=window.SCHOOL_INFO[schoolId];
        window.SCHOOL_INFO[id]=Object.assign({},base,{major:example[1],intro:example[1]+'，课程覆盖'+example[2]+'相关理论、方法与项目实践。'});
        card.dataset.school=id;card.dataset.listState='ready';card.dataset.direction=example[2];
        card.dataset.kw=base.name+' '+example[1]+' '+example[2];
        card.setAttribute('onclick',"selectSchool('"+id+"')");card.setAttribute('ondragstart',"dragStart(event,'"+id+"')");
        previous.after(card);previous=card;
      });
    });
  }
  function makeRecords(){
    return Array.from(document.querySelectorAll('#schoolList [data-school]')).map(function(card){
      var d=card.dataset,info=window.SCHOOL_INFO[d.school] || {},extra=extras[d.institution || d.school] || {};
      var record=Object.assign({id:d.school,card:card,name:info.name,country:d.country,continent:['美国','加拿大'].indexOf(d.country)>=0?'北美洲':['英国','德国','法国'].indexOf(d.country)>=0?'欧洲':['澳大利亚','新西兰'].indexOf(d.country)>=0?'大洋洲':'亚洲',stage:/BS|学士|本科/.test(d.degree)?'本科':'硕士',years:Math.max.apply(null,(d.duration.match(/[\d.]+/g)||[0]).map(Number)),rank:d.rank?Number(d.rank):null,language:info.language,tuition:Number(d.tuition),start:info.appStart,end:info.appDeadline,keyword:[d.kw,info.name,info.major,info.degree,info.intro].join(' ').toLowerCase(),scores:{},careers:[],employers:[]},extra);
      if(info.classification){record.category=info.classification[0];record.discipline=info.classification[1];record.direction=info.classification[2];}
      var requirements=info.requirements || {};
      record.scores={'雅思':info.ielts,'老托福':info.toefl,'新托福':requirements.toeflIbt,'GPA':info.gpa,'IB':requirements.ib,'A-Level':requirements.aLevel,'AP':requirements.ap,'SAT':requirements.sat,'高考总分':requirements.gaokao};
      record.schoolId=d.institution || d.school;
      if(d.direction) record.direction=d.direction;
      var tuition=window.pbsSelectionMoney.tuition(info),life=window.pbsSelectionMoney.living(info),total=window.pbsSelectionMoney.total(info);
      record.tuition=tuition==null?null:tuition/10000;
      record.life=life==null?null:life/10000;
      record.total=total==null?null:total/10000;
      record.searchText=normalize([info.name,info.major,info.degree,record.category,record.discipline,record.direction,schoolAliases[record.schoolId] || ''].join(' '));
      var aliases={Google:'谷歌',Microsoft:'微软',Amazon:'亚马逊',HSBC:'汇丰'};
      record.employers=(info.employers || '').split(/[、,，]/).map(function(name){name=name.trim();return aliases[name] || name;}).filter(Boolean);
      var salary=String(info.salary || '').match(/([\d,]+)\s*\//),salaryRates={USD:7.2,SGD:5.3,HKD:.92};
      record.salary=salary?Math.round(Number(salary[1].replace(/,/g,''))*(salaryRates[(info.salary.match(/USD|SGD|HKD/) || [])[0]] || 1)/1000)/10:null;
      return record;
    });
  }
  function pills(key,label,options){return '<div class="sc-field"><span>'+label+'</span><div class="sc-pills">'+options.map(function(pair){return '<button type="button" data-pick="'+key+'" data-value="'+pair[0]+'" aria-pressed="false">'+pair[1]+'</button>';}).join('')+'</div></div>';}
  function schoolCards(){
    var list=document.getElementById('schoolList');
    records.forEach(function(record){
      var info=window.SCHOOL_INFO[record.id],group=schoolGroups.find(function(item){return item.id===record.schoolId;});
      if(!group){
        var element=document.createElement('section');element.className='sc-school-group';element.dataset.institutionGroup=record.schoolId;
        element.innerHTML='<button type="button" class="sc-school-toggle" data-toggle-school="'+esc(record.schoolId)+'" aria-expanded="false" aria-controls="sc-programs-'+esc(record.schoolId)+'"><span class="sc-institution-copy"><strong>'+esc(info.name)+'</strong><small>'+esc(info.rank)+' · '+esc(record.country)+'</small></span><span class="sc-institution-count"></span>'+chevron+'</button><div class="sc-school-programs" id="sc-programs-'+esc(record.schoolId)+'" hidden><div class="sc-program-items"></div><div class="sc-program-pagination"></div></div>';
        list.insertBefore(element,document.getElementById('school-empty'));
        group={id:record.schoolId,element:element,records:[],matches:[],page:0,position:schoolGroups.length};schoolGroups.push(group);
      }
      record.card.className='sc-program-card';
      record.card.setAttribute('tabindex','0');record.card.setAttribute('role','button');
      record.card.setAttribute('aria-label',info.major+'，查看专业详情');
      record.card.innerHTML='<p class="sc-program-name">'+esc(info.major)+'</p><p class="sc-program-meta">'+esc(info.duration)+' · '+esc(info.degree)+'</p><p class="sc-program-meta sc-program-fee">'+(info.tuition?esc(info.tuitionCcy)+' '+esc(info.tuition)+'<span class="sc-program-conversion">'+esc(pbsSelectionMoney.format(pbsSelectionMoney.tuition(info)))+'</span>':'学费未收录')+'</p><div class="sc-program-footer"><p class="sc-program-meta">申请截止 '+esc(info.appDeadline)+'</p><div class="school-list-actions"></div></div>';
      window.renderSchoolListActions(record.card,record.id,record.card.dataset.listState || 'ready');
      group.element.querySelector('.sc-program-items').appendChild(record.card);group.records.push(record);
    });
    var heading=document.createElement('div');heading.className='sc-library-heading';heading.innerHTML='<h2>院校详情</h2>';
    document.getElementById('schoolDetailColumn').prepend(heading);
    list.addEventListener('click',function(event){
      var toggle=event.target.closest('[data-toggle-school]'),pager=event.target.closest('[data-program-page]');
      if(toggle){
        expandedSchool=expandedSchool===toggle.dataset.toggleSchool?null:toggle.dataset.toggleSchool;
        var group=schoolGroups.find(function(item){return item.id===expandedSchool;});
        if(group && group.matches.length){
          var current=group.matches.findIndex(function(record){return record.id===window.currentSchool;});
          if(current>=0) group.page=Math.floor(current/programPageSize);
          else window.selectSchool((group.matches[group.page*programPageSize] || group.matches[0]).id);
        }
        paintSchoolGroups();
        if(group){var top=group.element.offsetTop-list.offsetTop;if(top<list.scrollTop || top>list.scrollTop+list.clientHeight-100) list.scrollTop=top;}
      }
      if(pager){var owner=schoolGroups.find(function(item){return item.id===pager.dataset.institution;});owner.page=Number(pager.dataset.programPage);window.selectSchool(owner.matches[owner.page*programPageSize].id);paintSchoolGroups();}
    });
    list.addEventListener('keydown',function(event){if((event.key==='Enter' || event.key===' ') && event.target.matches('.sc-program-card')){event.preventDefault();window.selectSchool(event.target.dataset.school);}});
    document.getElementById('scCollapseSchools').onclick=function(){expandedSchool=null;paintSchoolGroups();list.scrollTop=0;};
    var search=document.createElement('div');search.className='sc-result-tools';
    search.innerHTML='<div class="sc-result-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="scResultQuery" type="search" aria-label="在当前结果中搜索" placeholder="在结果中搜索学校、专业或简称"><button type="button" id="scClearResultQuery" aria-label="清空结果搜索" hidden>×</button></div><div class="sc-result-options"><select id="scResultSort" aria-label="院校结果排序"><option value="relevance">默认排序</option><option value="rank">QS 排名优先</option><option value="fee">学费从低到高</option><option value="deadline">申请截止优先</option></select><label><input type="checkbox" id="scHideJoined">隐藏已加入</label></div>';
    list.before(search);
    document.getElementById('scResultQuery').value=state.resultQuery;
    document.getElementById('scResultSort').value=state.resultSort;
    document.getElementById('scHideJoined').checked=state.hideJoined;
    search.addEventListener('input',function(event){if(event.target.id!=='scResultQuery')return;state.resultQuery=event.target.value;clearTimeout(timer);timer=setTimeout(function(){apply(true);},180);});
    search.addEventListener('change',function(event){if(event.target.id==='scResultSort')state.resultSort=event.target.value;else if(event.target.id==='scHideJoined')state.hideJoined=event.target.checked;else return;apply(true);});
    search.querySelector('button').onclick=clearResultSearch;
    list.addEventListener('pbs-school-selection-change',function(){if(state.hideJoined)apply(false);});
    list.addEventListener('click',function(event){if(event.target.closest('[data-clear-result-search]'))clearResultSearch();if(event.target.closest('[data-relax-filters]'))root.querySelector('[data-clear]').click();if(event.target.closest('[data-show-joined]')){state.hideJoined=false;document.getElementById('scHideJoined').checked=false;apply(true);}});
    var selectProgram=window.selectSchool;
    window.selectSchool=function(id){selectProgram(id);document.getElementById('schoolDetail').scrollTop=0;markCurrentProgram();};
    markCurrentProgram();
  }
  function markCurrentProgram(){
    records.forEach(function(record){var current=record.id===window.currentSchool;record.card.classList.toggle('is-current',current);record.card.setAttribute('aria-pressed',String(current));});
    schoolGroups.forEach(function(group){group.element.querySelector('.sc-school-toggle').classList.toggle('is-current',group.records.some(function(record){return record.id===window.currentSchool;}));});
  }
  function paintSchoolGroups(){
    schoolGroups.forEach(function(group){
      var open=group.id===expandedSchool,pages=Math.ceil(group.matches.length/programPageSize);
      group.page=Math.min(group.page,Math.max(0,pages-1));
      group.element.hidden=!group.matches.length;
      group.element.querySelector('.sc-school-toggle').setAttribute('aria-expanded',String(open));
      group.element.querySelector('.sc-school-programs').hidden=!open;
      group.element.querySelector('.sc-institution-count').textContent=group.matches.length===group.records.length?group.matches.length+' 个专业':group.matches.length+' / '+group.records.length+' 个专业';
      group.element.querySelector('.sc-institution-copy strong').innerHTML=highlight(window.SCHOOL_INFO[group.id].name);
      var visible=group.matches.slice(group.page*programPageSize,(group.page+1)*programPageSize);
      group.records.forEach(function(record){record.card.classList.toggle('hidden',visible.indexOf(record)<0);record.card.querySelector('.sc-program-name').innerHTML=highlight(window.SCHOOL_INFO[record.id].major);});
      var pager=group.element.querySelector('.sc-program-pagination');pager.hidden=pages<=1;
      pager.innerHTML='<button type="button" data-institution="'+esc(group.id)+'" data-program-page="'+(group.page-1)+'" '+(group.page===0?'disabled':'')+'>上一页</button><span>'+(group.page+1)+' / '+pages+'</span><button type="button" data-institution="'+esc(group.id)+'" data-program-page="'+(group.page+1)+'" '+(group.page>=pages-1?'disabled':'')+'>下一页</button>';
    });
    document.getElementById('scCollapseSchools').hidden=!expandedSchool;
    markCurrentProgram();
  }
  function updateSchoolGroups(matches){
    schoolGroups.forEach(function(group){group.matches=matches.filter(function(record){return record.schoolId===group.id;});group.page=0;});
    if(state.resultSort!=='relevance')schoolGroups.forEach(function(group){group.matches.sort(function(a,b){return sortValue(a)-sortValue(b);});});
    var ordered=schoolGroups.slice().sort(function(a,b){return state.resultSort==='relevance'?a.position-b.position:Math.min.apply(null,a.matches.map(sortValue))-Math.min.apply(null,b.matches.map(sortValue));});
    ordered.forEach(function(group){document.getElementById('schoolList').insertBefore(group.element,document.getElementById('school-empty'));group.matches.forEach(function(record){group.element.querySelector('.sc-program-items').appendChild(record.card);});});
    var available=schoolGroups.filter(function(group){return group.matches.length;});
    if(expandedSchool && !available.some(function(group){return group.id===expandedSchool;})) expandedSchool=null;
    if(available.length===1) expandedSchool=available[0].id;
    paintSchoolGroups();
  }
  function multi(key,label){if(key==='schools')return '<div class="sc-field"><label for="scSchools">'+label+'</label><select id="scSchools" multiple aria-label="学校"></select></div>';if(key==='countries')return '<div class="sc-field"><label for="scCountries">'+label+'</label><select id="scCountries" multiple aria-label="国家 / 地区"></select></div>';return '<div class="sc-field"><span id="sc-label-'+key+'">'+label+'</span><details class="sc-multi" data-multi="'+key+'"><summary aria-labelledby="sc-label-'+key+' sc-value-'+key+'"><span id="sc-value-'+key+'" data-summary>不限</span>'+chevron+'</summary><div class="sc-options"><input type="search" aria-label="搜索'+label+'" placeholder="搜索'+label+'" data-option-search="'+key+'"><div data-options="'+key+'"></div></div></details></div>';}
  function textSearch(key,label){return '<label class="sc-field"><span>'+label+'</span><input type="search" data-text-search="'+key+'" aria-label="'+label+'" placeholder="搜索'+label+'"></label>';}
  function select(key,label,options){return '<label class="sc-field"><span>'+label+'</span><select data-field="'+key+'">'+options.map(function(item){return '<option value="'+esc(item[0])+'">'+esc(item[1])+'</option>';}).join('')+'</select></label>';}
  function mount(){
    document.body.classList.add('sc-workbench');
    document.getElementById('schoolFilterPanel').remove();
    root=document.createElement('section');root.id='scFilters';root.setAttribute('aria-label','筛选院校');
    root.innerHTML='<div class="sc-filter-heading"><h2>筛选院校</h2><button type="button" data-clear>全部清除</button></div>'+
      '<div class="sc-start"><div class="sc-step-heading"><span class="sc-step-number">1</span><label for="scQuery">输入选校需求</label></div><div class="sc-query-row"><div class="sc-query-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" id="scQuery" aria-label="学校、专业或选校需求" aria-describedby="scQueryHint" placeholder="例如：美国计算机硕士，QS前100，学费预算30–50万"></div><button type="button" class="sc-btn primary" data-ai>'+spark+'AI 匹配</button></div><div class="sc-query-examples" id="scQueryHint"><span>可输入学校、专业或一段需求。试试：</span><button type="button" data-example="美国计算机硕士，QS前100">美国计算机硕士</button><button type="button" data-example="香港数据科学硕士，1年制">香港一年制硕士</button></div></div>'+
      '<div class="sc-refine-heading"><div class="sc-step-heading"><span class="sc-step-number">2</span><h3>调整筛选条件</h3></div><button type="button" class="sc-btn" data-fold aria-expanded="false" aria-controls="scFilterBody">展开条件'+chevron+'</button></div>'+
      '<div class="sc-tabs" role="tablist" aria-label="筛选条件分组">'+filterLabels.map(function(label,i){return '<button type="button" id="sc-tab-'+i+'" role="tab" data-tab="'+i+'" aria-selected="'+(i===0)+'" aria-controls="sc-panel-'+i+'" tabindex="'+(i===0?'0':'-1')+'">'+label+'</button>';}).join('')+'</div><div id="scFilterBody" hidden>'+
      '<div class="sc-filter-panel" id="sc-panel-0" role="tabpanel" aria-labelledby="sc-tab-0"><div class="sc-region-grid">'+pills('continent','大洲',[['','不限'],['亚洲','亚洲'],['欧洲','欧洲'],['北美洲','北美洲'],['南美洲','南美洲'],['大洋洲','大洋洲'],['非洲','非洲']])+multi('countries','国家 / 地区')+multi('schools','学校')+'</div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-1" role="tabpanel" aria-labelledby="sc-tab-1" hidden><div class="sc-grid two sc-course-level">'+pills('stage','学术阶段',[['','不限'],['本科','本科'],['硕士','硕士']])+pills('duration','学制时长',[['','不限'],['1','1年'],['1-2','1-2年'],['1-3','1-3年'],['2-3','2-3年'],['3+','3年以上']])+'</div><div class="sc-grid">'+multi('categories','学科门类')+multi('disciplines','二级学科')+multi('directions','具体方向')+select('board','排名榜单',[['','不限'],['qs','QS排名'],['sh','软科排名']])+select('rank','名次区间',[['','先选择榜单']])+multi('languages','教学语言')+'</div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-2" role="tabpanel" aria-labelledby="sc-tab-2" hidden><div class="sc-grid">'+select('feeType','费用类型',[['firstLife','首年费用＋单年生活费'],['first','首年费用'],['total','全部学制总费用']])+'<div class="sc-field"><span>费用预算（万元 · 人民币）</span><div class="sc-range"><div class="sc-money-input"><span class="sc-money-prefix">￥</span><input type="number" min="0" step="0.1" data-field="feeMin" aria-label="最低费用预算（人民币万元）" placeholder="最低"><span class="sc-money-suffix">万元</span></div><span>—</span><div class="sc-money-input"><span class="sc-money-prefix">￥</span><input type="number" min="0" step="0.1" data-field="feeMax" aria-label="最高费用预算（人民币万元）" placeholder="最高"><span class="sc-money-suffix">万元</span></div></div><small>查询上限按输入金额上浮 10%</small></div><div class="sc-field"><span>可申请时间</span><button type="button" class="sc-period" data-period><span id="scPeriodLabel">不限</span>'+chevron+'</button></div></div><div class="sc-score-heading"><span>成绩要求</span><button type="button" data-add-score>＋ 添加成绩</button></div><div id="scScores"></div></div>'+
      '<div class="sc-filter-panel" id="sc-panel-3" role="tabpanel" aria-labelledby="sc-tab-3" hidden><div class="sc-grid two">'+textSearch('careers','求职领域')+textSearch('employers','适配雇主')+'<div class="sc-field sc-salary"><span>起薪预期（万元 / 年 · 人民币）</span><div class="sc-range"><div class="sc-money-input"><span class="sc-money-prefix">￥</span><input type="number" min="0" max="100" data-field="salaryMin" aria-label="最低起薪（人民币万元 / 年）" placeholder="最低"><span class="sc-money-suffix">万元</span></div><span>—</span><div class="sc-money-input"><span class="sc-money-prefix">￥</span><input type="number" min="0" max="100" data-field="salaryMax" aria-label="最高起薪（人民币万元 / 年）" placeholder="最高"><span class="sc-money-suffix">万元</span></div></div><div class="sc-salary-sliders"><input type="range" min="0" max="100" data-salary="salaryMin" aria-label="最低起薪滑块"><input type="range" min="0" max="100" data-salary="salaryMax" aria-label="最高起薪滑块"></div></div></div></div></div><p class="sc-error" id="scFilterError" role="alert" hidden></p><p class="sc-match-result" id="scAiResult" role="status" hidden></p>';
    document.getElementById('schoolWorkspace').before(root);
    countrySelect=window.pbsCountrySelect.mount(document.getElementById('scCountries'),{continent:state.continent,values:state.countries,placeholder:'不限，可搜索国家 / 地区',onChange:function(values){state.countries=values;change();}});
    schoolSelect=new TomSelect(document.getElementById('scSchools'),{
      options:choices('schools').map(function(option){return Object.assign({aliases:schoolAliases[option.value] || ''},option);}),items:state.schools,
      valueField:'value',labelField:'label',searchField:['label','aliases'],maxItems:null,create:false,closeAfterSelect:false,
      plugins:{remove_button:{title:'移除'}},placeholder:'不限，可输入学校名称',
      render:{option:function(option,escape){return '<div class="pbs-country-option"><span>'+escape(option.label)+'</span><small>'+option.count+'个专业</small></div>';},no_results:function(){return '<div class="no-results">未找到学校</div>';}},
      onChange:function(){state.schools=this.items.slice();change();}
    });
    schoolSelect.wrapper.classList.add('pbs-country-select');
    document.getElementById('scFilterBody').insertAdjacentHTML('beforeend','<div class="sc-condition-footer"><label class="sc-null"><input type="checkbox" id="scIncludeUnknown">包含筛选项无数据的专业</label><div class="sc-condition-actions"><button type="button" class="sc-btn" data-previous hidden>上一步</button><button type="button" class="sc-btn" data-next>下一步：专业与课程</button><button type="button" class="sc-btn primary" data-results>筛选</button></div></div>');
    document.getElementById('schoolWorkspace').tabIndex=-1;
    root.querySelector('.sc-refine-heading').before(document.getElementById('scAiResult'));
    var title=document.createElement('div');title.className='sc-library-heading';title.innerHTML='<h2>院校列表 <span id="scResultCount"></span></h2><button type="button" id="scCollapseSchools" hidden>收起专业</button>';
    document.getElementById('schoolLibraryColumn').prepend(title);
    document.querySelector('#schoolList > p').remove();
    var empty=document.getElementById('school-empty');empty.textContent='暂无匹配结果，可放宽排名、费用或成绩条件后再试';
  }
  function taskHeader(){
    var bar=document.getElementById('schoolTaskContextBar'),heading=bar.firstElementChild,item=window.pbsSelection && window.pbsSelection.find(window.TASK_PROJECT_NO);
    if(!item || !heading || !heading.querySelector('#selectionStatus')) return;
    var back=heading.querySelector('.pbs-detail-back'),actions=heading.querySelector('.selection-task-actions'),status=heading.querySelector('#selectionStatus');
    back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14 5-7 7 7 7"/></svg><span>选校列表</span>';
    back.className='sc-back';back.setAttribute('aria-label','返回选校任务列表');
    var info=document.createElement('div');info.className='sc-task-meta';
    info.innerHTML='<strong>'+esc(item.id)+'</strong><span>申请人：<b>'+esc(item.student)+'</b></span><span>申请层次：<b>'+esc(item.level)+'</b></span><span>意向国家：<b>'+esc(item.country)+'</b></span>';
    info.appendChild(status);heading.replaceChildren(back,info,actions);heading.className='sc-task-heading';
    var supplement=actions.querySelector('[onclick="openStudentSupplement()"]');
    if(supplement){supplement.className='sc-supplement';supplement.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linejoin="round" d="M9 4H5v17h14V4h-4M9 2h6v5H9zM12 10v7m-3-3h6"/></svg>学生补充信息';}
  }
  function candidateRows(key){
    return records.filter(function(r){
      if(key==='countries') return !state.continent || r.continent===state.continent;
      if(key==='schools') return (!state.continent || r.continent===state.continent) && selected(r.country,state.countries);
      if(key==='disciplines') return selected(r.category,state.categories);
      if(key==='directions') return selected(r.category,state.categories) && selected(r.discipline,state.disciplines);
      return true;
    });
  }
  var keys={countries:'country',schools:'schoolId',categories:'category',disciplines:'discipline',directions:'direction',languages:'language',careers:'careers',employers:'employers'};
  function choices(key){
    if(key==='countries')return window.pbsCountrySelect.options(state.continent).map(function(country){return {value:country.value,label:country.value};});
    if(key==='languages')return window.pbsSchoolCatalog.languages;
    var map={};candidateRows(key).forEach(function(r){var values=Array.isArray(r[keys[key]])?r[keys[key]]:[r[keys[key]]];values.filter(Boolean).forEach(function(value){if(!map[value]) map[value]={value:value,label:key==='schools'?r.name:value,count:0};map[value].count++;});});return key==='categories'?categories.map(function(value){return map[value] || {value:value,label:value,count:0};}):Object.values(map);
  }
  function prune(){['countries','schools','categories','disciplines','directions','languages'].forEach(function(key){var valid=choices(key).map(function(o){return o.value;});state[key]=state[key].filter(function(value){return valid.indexOf(value)>=0;});});}
  function multiFields(){
    var active=document.activeElement,focus=active && active.dataset.multiKey?{key:active.dataset.multiKey,value:active.value}:null;
    Object.keys(keys).forEach(function(key){
      if(key==='careers' || key==='employers'){var search=root.querySelector('[data-text-search="'+key+'"]');if(search!==document.activeElement) search.value=state[key].join('、');return;}
      if(key==='countries'){countrySelect.setRegion(state.continent,state.countries);return;}
      if(key==='schools'){
        schoolSelect.clear(true);schoolSelect.clearOptions();
        schoolSelect.addOptions(choices(key).map(function(option){return Object.assign({aliases:schoolAliases[option.value] || ''},option);}));
        schoolSelect.setValue(state.schools,true);schoolSelect.refreshOptions(false);return;
      }
      var box=root.querySelector('[data-multi="'+key+'"]'),options=choices(key),summary=box.querySelector('[data-summary]');
      var labels=options.filter(function(o){return state[key].indexOf(o.value)>=0;}).map(function(o){return o.label;});summary.textContent=labels.length?labels.join('、'):'不限';summary.title=summary.textContent;
      box.querySelector('[data-options]').innerHTML=options.length?options.map(function(o){return '<label><input type="checkbox" data-multi-key="'+key+'" value="'+esc(o.value)+'" aria-label="'+esc(o.label)+'" '+(state[key].indexOf(o.value)>=0?'checked':'')+'><span>'+esc(o.label)+'</span><small>'+o.count+'</small></label>';}).join(''):'<p class="sc-options-empty">暂无可选项</p>';
      var query=box.querySelector('[data-option-search]').value.trim().toLowerCase();box.querySelectorAll('[data-options] label').forEach(function(label){label.hidden=!!query && label.textContent.toLowerCase().indexOf(query)<0;});
    });
    if(focus){var checkbox=Array.from(root.querySelectorAll('[data-multi-key="'+focus.key+'"]')).find(function(input){return input.value===focus.value;});if(checkbox) checkbox.focus();}
  }
  function rankOptions(){
    var select=root.querySelector('[data-field="rank"]');select.disabled=!state.board;
    var values=[[0,50],[51,100],[101,200],[201,500],[501,9999]];
    select.innerHTML='<option value="">'+(state.board?'不限':'先选择榜单')+'</option>'+values.map(function(pair){return '<option value="'+pair.join('-')+'">'+(pair[0]===0?'前 '+pair[1]+' 名':pair[1]===9999?(pair[0]-1)+' 名以后':pair[0]+'–'+pair[1]+' 名')+'</option>';}).join('');
    if(state.board && /^0-\d{1,3}$/.test(state.rank) && !Array.from(select.options).some(function(option){return option.value===state.rank;})) select.add(new Option('前 '+state.rank.split('-')[1]+' 名',state.rank));
    select.value=state.rank;
  }
  function scoreRows(){
    document.getElementById('scScores').innerHTML=state.scores.map(function(row,i){return '<div class="sc-score-row"><select data-score-type="'+i+'" aria-label="成绩类型 '+(i+1)+'">'+scoreTypes.map(function(type){return '<option '+(row.type===type?'selected':'')+'>'+type+'</option>';}).join('')+'</select><input data-score-value="'+i+'" aria-label="成绩分数 '+(i+1)+'" type="'+(row.type==='A-Level'?'text':'number')+'" '+(row.type==='A-Level'?'placeholder="如 AAA"':'min="0" step="0.1" placeholder="输入学生成绩"')+' value="'+esc(row.value)+'"><button type="button" data-remove-score="'+i+'" aria-label="移除成绩条件 '+(i+1)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" d="m6 6 12 12M18 6 6 18"/></svg></button></div>';}).join('');
  }
  function paint(){
    root.querySelectorAll('[data-field]').forEach(function(el){el.value=state[el.dataset.field];});rankOptions();multiFields();scoreRows();
    document.getElementById('scResultQuery').value=state.resultQuery;document.getElementById('scResultSort').value=state.resultSort;document.getElementById('scHideJoined').checked=state.hideJoined;
    document.getElementById('scQuery').value=state.prompt || state.keyword;document.getElementById('scIncludeUnknown').checked=state.includeUnknown;
    root.querySelectorAll('[data-pick]').forEach(function(button){button.setAttribute('aria-pressed',String(state[button.dataset.pick]===button.dataset.value));});
    root.querySelectorAll('[data-salary]').forEach(function(input){input.value=state[input.dataset.salary];});
    document.getElementById('scPeriodLabel').textContent=state.period?[state.period.start,state.period.end].join(' 至 '):'不限';
  }
  function grade(value){var grades=String(value).toUpperCase().match(/A\*|[ABCDE]/g);return grades?grades.reduce(function(sum,g){return sum+({'A*':6,A:5,B:4,C:3,D:2,E:1}[g] || 0);},0):NaN;}
  function textMatches(values,queries){return !queries.length || accepts(values.length?values.join(' '):null,function(value){return queries.some(function(query){return value.toLowerCase().indexOf(query.toLowerCase())>=0;});});}
  function passes(r){
    if(state.keyword && r.keyword.indexOf(state.keyword.toLowerCase())<0) return false;
    if(state.continent && r.continent!==state.continent || !selected(r.country,state.countries) || !selected(r.schoolId,state.schools)) return false;
    if(state.stage && r.stage!==state.stage) return false;
    if(state.duration){var ends=state.duration.split('-').map(Number);if(state.duration==='1'?r.years!==1:state.duration==='3+'?r.years<3:!(r.years>=ends[0] && r.years<=ends[1])) return false;}
    if(!selected(r.category,state.categories) || !selected(r.discipline,state.disciplines) || !selected(r.direction,state.directions) || !any(String(r.language || '').split(/[、,，;；/]+/).filter(Boolean),state.languages)) return false;
    if(state.board && state.rank){var rank=state.board==='qs'?r.rank:r.softRank,range=state.rank.split('-').map(Number);if(!accepts(rank,function(v){return v>=range[0] && v<=range[1];})) return false;}
    if(!state.scores.every(function(row){if(row.value==='') return true;return accepts(r.scores[row.type],function(value){return row.type==='A-Level'?grade(value)<=grade(row.value):parseFloat(value)<=Number(row.value);});})) return false;
    var fee=state.feeType==='firstLife'?(r.tuition===null || r.life===null?null:r.tuition+r.life):state.feeType==='total'?r.total:r.tuition;
    if((state.feeMin!=='' || state.feeMax!=='') && !accepts(fee,function(v){return (state.feeMin==='' || v>=Number(state.feeMin)) && (state.feeMax==='' || v<=Number(state.feeMax)*1.1);})) return false;
    if(state.period && !accepts(r.start && r.end,function(){return r.start<=periodDate(state.period.end,true) && r.end>=periodDate(state.period.start,false);})) return false;
    if(!textMatches(r.careers,state.careers) || !textMatches(r.employers,state.employers)) return false;
    if((state.salaryMin>0 || state.salaryMax<100) && !accepts(r.salary,function(v){return v>=Number(state.salaryMin) && v<=Number(state.salaryMax);})) return false;
    return true;
  }
  function validate(){
    var error='';
    if(state.feeMin!=='' && state.feeMax!=='' && Number(state.feeMin)>Number(state.feeMax)) error='最低费用不能高于最高费用';
    if(Number(state.feeMin)<0 || Number(state.feeMax)<0) error='费用预算不能为负数';
    if(Number(state.salaryMin)>Number(state.salaryMax)) error='最低起薪不能高于最高起薪';
    if(Number(state.salaryMin)<0 || Number(state.salaryMax)>100) error='起薪预期应在 0–100 万元之间';
    var invalid=state.scores.find(function(row){return row.value!=='' && (row.type==='A-Level'?!/^(?:A\*|[ABCDE]){1,5}$/i.test(row.value):Number(row.value)<0);});
    if(invalid) error=invalid.type==='A-Level'?'A-Level 成绩请输入字母等级，如 AAA 或 A*AA':'成绩不能为负数';
    var el=document.getElementById('scFilterError');el.textContent=error;el.hidden=!error;return !error;
  }
  function apply(write){
    clearTimeout(timer);if(!validate()) return;
    var baseMatches=records.filter(passes),terms=resultTerms();
    var matches=baseMatches.filter(function(record){return (!state.hideJoined || record.card.dataset.listState!=='joined') && terms.every(function(term){return record.searchText.indexOf(term)>=0;});}),schoolCount=unique(matches.map(function(record){return record.schoolId;})).length;
    updateSchoolGroups(matches);
    document.getElementById('scClearResultQuery').hidden=!state.resultQuery;
    var empty=document.getElementById('school-empty');
    empty.innerHTML=baseMatches.length && state.resultQuery?'当前结果中未找到匹配的学校或专业<button type="button" data-clear-result-search>清空结果搜索</button>':baseMatches.length && state.hideJoined?'当前结果已全部加入清单<button type="button" data-show-joined>显示已加入</button>':'当前筛选条件下暂无匹配院校<button type="button" data-relax-filters>重置筛选条件</button>';
    document.getElementById('scResultCount').textContent=schoolCount+' 所 · '+matches.length+' 个专业';document.getElementById('school-empty').classList.toggle('hidden',matches.length>0);
    var detail=document.getElementById('schoolDetail');
    if(!matches.length){detail.innerHTML='<div class="sc-detail-empty">暂无匹配院校</div>';detail.dataset.empty='true';}
    else if(detail.dataset.empty==='true' || !matches.some(function(r){return r.id===window.currentSchool;})){window.selectSchool(matches.some(function(r){return r.id===window.currentSchool;})?window.currentSchool:matches[0].id);delete detail.dataset.empty;}
    document.querySelectorAll('#schoolDetailColumn button').forEach(function(button){button.disabled=!matches.length;});
    var counts=[Number(!!state.continent)+state.countries.length+state.schools.length,Number(!!state.stage)+Number(!!state.duration)+state.categories.length+state.disciplines.length+state.directions.length+state.languages.length+Number(!!(state.board && state.rank)),state.scores.filter(function(row){return row.value!=='';}).length+Number(state.feeMin!=='' || state.feeMax!=='')+Number(!!state.period),state.careers.length+state.employers.length+Number(state.salaryMin>0 || state.salaryMax<100)];
    filterLabels.forEach(function(label,index){var tab=document.getElementById('sc-tab-'+index);tab.setAttribute('aria-label',label+(counts[index]?'，已选 '+counts[index]+' 项':''));tab.innerHTML=label+(counts[index]?'<span class="sc-tab-count" aria-hidden="true">'+counts[index]+'</span>':'');});
    var total=counts.reduce(function(sum,count){return sum+count;},0);
    root.dataset.activeFilters=String(total);
    root.querySelector('[data-clear]').disabled=!total && !state.prompt && !state.keyword && !state.resultQuery && !state.hideJoined && state.resultSort==='relevance';
    if(write){var url=new URL(location.href);if(JSON.stringify(state)===JSON.stringify(defaults())) url.searchParams.delete('filters');else url.searchParams.set('filters',JSON.stringify(state));if(url.href!==location.href) history.pushState(null,'',url);}
  }
  function change(){prune();multiFields();apply(true);}
  function periodDate(value,end){if(value.length===4) return value+(end?'-12-31':'-01-01');if(value.length===7){var p=value.split('-');return value+'-'+(end?new Date(Number(p[0]),Number(p[1]),0).getDate():'01');}return value;}
  function openPeriod(){
    var trigger=document.activeElement,dialog=document.createElement('dialog'),draft=Object.assign({precision:'month',start:'',end:''},state.period || {});dialog.className='sc-period-dialog';dialog.setAttribute('aria-label','可申请时间');
    dialog.innerHTML='<header><h2>可申请时间</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="sc-period-body"><div class="sc-pills">'+[['year','按年'],['month','按月'],['day','按日']].map(function(pair){return '<button type="button" data-precision="'+pair[0]+'">'+pair[1]+'</button>';}).join('')+'</div><div class="sc-grid two"><label class="sc-field"><span>开始时间</span><input id="scPeriodStart" aria-label="开始时间"></label><label class="sc-field"><span>结束时间</span><input id="scPeriodEnd" aria-label="结束时间"></label></div><p class="sc-error" role="alert" hidden></p></div><footer><button type="button" class="sc-btn" data-period-clear>清空</button><div><button type="button" class="sc-btn" data-close>取消</button><button type="button" class="sc-btn primary" data-confirm>确定</button></div></footer>';
    function precision(){dialog.querySelectorAll('[data-precision]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.precision===draft.precision));});['Start','End'].forEach(function(name){var input=dialog.querySelector('#scPeriod'+name),key=name.toLowerCase();input.type=draft.precision==='year'?'number':draft.precision==='month'?'month':'date';if(draft.precision==='year'){input.min=2000;input.max=2100;input.placeholder='如 2026';}else{input.removeAttribute('min');input.removeAttribute('max');input.placeholder='';}input.value=draft[key];});}
    dialog.onclick=function(e){var b=e.target.closest('button');if(e.target===dialog || b && b.hasAttribute('data-close')) dialog.close();if(!b) return;
      if(b.dataset.precision){draft.start=dialog.querySelector('#scPeriodStart').value;draft.end=dialog.querySelector('#scPeriodEnd').value;draft.precision=b.dataset.precision;['start','end'].forEach(function(key){if(draft[key]) draft[key]=draft.precision==='year'?draft[key].slice(0,4):draft.precision==='month'?(draft[key]+'-01').slice(0,7):periodDate(draft[key],key==='end');});precision();}
      if(b.hasAttribute('data-period-clear')){state.period=null;paint();apply(true);dialog.close();}
      if(b.hasAttribute('data-confirm')){var start=dialog.querySelector('#scPeriodStart').value,end=dialog.querySelector('#scPeriodEnd').value,error=dialog.querySelector('.sc-error');if(!start || !end || draft.precision==='year' && (Number(start)<2000 || Number(end)>2100) || periodDate(start,false)>periodDate(end,true)){error.hidden=false;error.textContent='请填写有效的开始和结束时间，结束时间不能早于开始时间';return;}state.period={precision:draft.precision,start:start,end:end};paint();apply(true);dialog.close();}
    };
    dialog.onclose=function(){dialog.remove();trigger.focus();};document.body.appendChild(dialog);precision();dialog.showModal();
  }
  function smartMatch(){
    var input=document.getElementById('scQuery'),text=input.value.trim();if(!text){var error=document.getElementById('scFilterError');error.hidden=false;error.textContent='请输入学校、专业或选校需求';input.setAttribute('aria-invalid','true');input.focus();return;}input.removeAttribute('aria-invalid');
    var t=text.replace(/两/g,'2'),matched=[],next=defaults();next.prompt=text;
    var countries=window.pbsCountries.filter(function(country){return t.indexOf(country.value)>=0 || t.toLowerCase().indexOf(country.en.toLowerCase())>=0;}).map(function(country){return country.value;});if(countries.length){next.countries=countries;matched.push(countries.join('、'));}
    next.schools=schoolGroups.filter(function(group){return t.indexOf(window.SCHOOL_INFO[group.id].name)>=0 || new RegExp('\\b'+group.id+'\\b','i').test(t) || schoolAliases[group.id].split(' ').some(function(alias){return /[\u4e00-\u9fff]/.test(alias) && t.indexOf(alias)>=0;});}).map(function(group){return group.id;});if(next.schools.length)matched.push('学校');
    var continent=['亚洲','欧洲','北美洲','南美洲','大洋洲','非洲'].find(function(name){return t.indexOf(name)>=0;});if(continent){next.continent=continent;matched.push(continent);}
    var schools=records.filter(function(r){return t.indexOf(r.name)>=0 || new RegExp('\\b'+r.id+'\\b','i').test(t);});if(schools.length){next.schools=schools.map(function(r){return r.id;});matched.push(schools.map(function(r){return r.name;}).join('、'));}
    if(/硕士/.test(t)){next.stage='硕士';matched.push('硕士');}else if(/本科|学士/.test(t)){next.stage='本科';matched.push('本科');}
    next.categories=categories.filter(function(name){return t.indexOf(name)>=0;});if(next.categories.length) matched.push(next.categories.join('、'));
    if(/计算机|\bCS\b/i.test(t)){next.disciplines=['计算机科学与技术'];matched.push('计算机');}else if(/数据科学/.test(t)){next.directions=['数据科学'];matched.push('数据科学');}else if(/电子工程/.test(t)){next.disciplines=['电子工程'];matched.push('电子工程');}
    var ranking=t.match(/(?:QS|软科)[^\d]{0,5}(\d{1,3})/i);if(ranking){next.board=/软科/.test(ranking[0])?'sh':'qs';var n=Number(ranking[1]);next.rank='0-'+n;matched.push((next.board==='qs'?'QS':'软科')+'前'+n);}
    var durationRange=t.match(/([1-3])\s*[-–—~到至]\s*([1-3])\s*年/),years=t.match(/(?:^|[^\d])(\d(?:\.\d)?)\s*年(?:制|的)?(?:本科|硕士|学制)?/);
    if(durationRange && ['1-2','1-3','2-3'].indexOf(durationRange[1]+'-'+durationRange[2])>=0){next.duration=durationRange[1]+'-'+durationRange[2];matched.push(next.duration+'年制');}
    else if(/3\s*年(?:及?以上|起)/.test(t)){next.duration='3+';matched.push('3年以上');}
    else if(years){var y=Number(years[1]);next.duration=y<=1?'1':y<=2?'1-2':y<=3?'2-3':'3+';matched.push(years[1]+'年制');}
    var scoreMatches=[['雅思',/雅思[^\d]{0,4}(\d(?:\.\d)?)/i],['新托福',/托福[^\d]{0,4}(\d{2,3})/i],['GPA',/GPA[^\d]{0,4}(\d(?:\.\d)?)/i],['A-Level',/A[- ]?Level[^A-E]{0,4}((?:A\*|[ABCDE]){2,5})/i]];
    var scores=[];scoreMatches.forEach(function(pair){var m=t.match(pair[1]);if(m){scores.push({type:pair[0],value:m[1]});matched.push(pair[0]+' '+m[1]);}});if(scores.length) next.scores=scores;
    var fee=t.match(/(?:预算|学费|费用)[^\d]{0,6}(\d+)\s*[-–~到至]\s*(\d+)\s*万/);if(fee){next.feeMin=fee[1];next.feeMax=fee[2];next.feeType=/生活/.test(t)?'firstLife':'first';matched.push('预算'+fee[1]+'–'+fee[2]+'万');}else{var upper=t.match(/(?:预算|学费|费用)[^\d]{0,6}(\d+)\s*万(?:以内|以下)?/);if(upper){next.feeMax=upper[1];next.feeType='first';matched.push('预算≤'+upper[1]+'万');}}
    if(/英语/.test(t)){next.languages=['英语'];matched.push('英语');}
    next.careers=choices('careers').map(function(option){return option.value;}).filter(function(name){return t.indexOf(name)>=0 || name==='互联网 / 科技' && /互联网|科技/.test(t);});if(next.careers.length) matched.push(next.careers.join('、'));
    next.employers=choices('employers').map(function(option){return option.value;}).filter(function(name){return t.toLowerCase().indexOf(name.toLowerCase())>=0;});if(next.employers.length) matched.push(next.employers.join('、'));
    if(!matched.length){next.keyword=text;matched.push('关键词“'+text+'”');}
    state=next;prune();paint();
    apply(true);setConditionsOpen(true);switchTab(0);var result=document.getElementById('scAiResult');result.hidden=false;result.textContent='已将需求填入下方条件，可按顺序核对，也可直接查看院校结果。';
  }
  function setConditionsOpen(open){var button=root.querySelector('[data-fold]');button.setAttribute('aria-expanded',String(open));document.getElementById('scFilterBody').hidden=!open;button.innerHTML=(open?'收起条件':'展开条件')+chevron;}
  function switchTab(index){activeTab=index;root.querySelectorAll('[data-tab]').forEach(function(tab){var on=Number(tab.dataset.tab)===index;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!on;});root.querySelector('[data-previous]').hidden=index===0;var next=root.querySelector('[data-next]');next.hidden=index===filterLabels.length-1;next.textContent='下一步：'+(filterLabels[index+1] || '');}
  function bind(){
    root.onclick=function(e){var b=e.target.closest('button');if(!b) return;
      if(b.hasAttribute('data-tab')){setConditionsOpen(true);switchTab(Number(b.dataset.tab));root.querySelectorAll('details[open]').forEach(function(el){el.open=false;});}
      if(b.hasAttribute('data-fold'))setConditionsOpen(b.getAttribute('aria-expanded')!=='true');
      if(b.hasAttribute('data-clear')){state=defaults();root.querySelectorAll('[data-option-search]').forEach(function(input){input.value='';});paint();apply(true);document.getElementById('scAiResult').hidden=true;setConditionsOpen(false);switchTab(0);}
      if(b.dataset.example){document.getElementById('scQuery').value=b.dataset.example;document.getElementById('scQuery').focus();root.querySelector('[data-clear]').disabled=false;}
      if(b.hasAttribute('data-previous') || b.hasAttribute('data-next')){root.querySelectorAll('details[open]').forEach(function(el){el.open=false;});switchTab(activeTab+(b.hasAttribute('data-next')?1:-1));document.getElementById('sc-tab-'+activeTab).focus();}
      if(b.hasAttribute('data-results') && validate()){apply(true);setConditionsOpen(false);var workspace=document.getElementById('schoolWorkspace');workspace.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});workspace.focus({preventScroll:true});}
      if(b.dataset.pick){var key=b.dataset.pick;state[key]=state[key]===b.dataset.value?'':b.dataset.value;prune();paint();apply(true);}
      if(b.hasAttribute('data-ai')) smartMatch();
      if(b.hasAttribute('data-period')) openPeriod();
      if(b.hasAttribute('data-add-score')){state.scores.push({type:'雅思',value:''});scoreRows();root.querySelector('[data-score-value="'+(state.scores.length-1)+'"]').focus();}
      if(b.hasAttribute('data-remove-score')){var i=Number(b.dataset.removeScore);if(state.scores.length>1) state.scores.splice(i,1);else state.scores[0]={type:'雅思',value:''};scoreRows();apply(true);}
    };
    root.onchange=function(e){var el=e.target;
      if(el.dataset.multiKey){var key=el.dataset.multiKey;state[key]=el.checked?unique(state[key].concat(el.value)):state[key].filter(function(value){return value!==el.value;});change();}
      if(el.tagName==='SELECT' && el.dataset.field){state[el.dataset.field]=el.value;if(el.dataset.field==='board'){state.rank='';rankOptions();}if(el.dataset.field==='continent'){prune();multiFields();}apply(true);}
      if(el.hasAttribute('data-score-type')){state.scores[Number(el.dataset.scoreType)]={type:el.value,value:''};scoreRows();apply(true);}
      if(el.id==='scIncludeUnknown'){state.includeUnknown=el.checked;apply(true);}
    };
    root.oninput=function(e){var el=e.target;if(el.id==='scSchools-ts-control') return;
      if(el.dataset.textSearch){state[el.dataset.textSearch]=el.value.trim()?[el.value.trim()]:[];}
      if(el.dataset.optionSearch){var q=el.value.toLowerCase();el.parentElement.querySelectorAll('label').forEach(function(label){label.hidden=label.textContent.toLowerCase().indexOf(q)<0;});return;}
      if(el.id==='scQuery'){el.removeAttribute('aria-invalid');root.querySelector('[data-clear]').disabled=!el.value.trim() && !state.prompt && !state.keyword && !Number(root.dataset.activeFilters);return;}
      if(el.dataset.field && el.tagName==='INPUT'){state[el.dataset.field]=el.value;if(el.dataset.field==='salaryMin' || el.dataset.field==='salaryMax') root.querySelector('[data-salary="'+el.dataset.field+'"]').value=el.value;}
      if(el.hasAttribute('data-score-value')) state.scores[Number(el.dataset.scoreValue)].value=el.value;
      if(el.dataset.salary){var key=el.dataset.salary,value=Number(el.value);state[key]=key==='salaryMin'?Math.min(value,Number(state.salaryMax)):Math.max(value,Number(state.salaryMin));el.value=state[key];root.querySelector('[data-field="'+key+'"]').value=state[key];}
      clearTimeout(timer);timer=setTimeout(function(){apply(true);},300);
    };
    root.onkeydown=function(e){if(e.key==='Enter' && !e.shiftKey && e.target.id==='scQuery'){e.preventDefault();smartMatch();}if(e.target.dataset.tab && ['ArrowLeft','ArrowRight'].indexOf(e.key)>=0){e.preventDefault();var index=(Number(e.target.dataset.tab)+(e.key==='ArrowRight'?1:3))%4;setConditionsOpen(true);switchTab(index);document.getElementById('sc-tab-'+index).focus();}};
    document.addEventListener('click',function(e){root.querySelectorAll('details[open]').forEach(function(el){if(!el.contains(e.target)) el.open=false;});});
    document.addEventListener('keydown',function(e){if(e.key==='Escape') root.querySelectorAll('details[open]').forEach(function(el){el.open=false;el.querySelector('summary').focus();});});
    window.addEventListener('popstate',function(){state=readState();prune();paint();apply(false);});
  }
  addProgramExamples();
  document.addEventListener('DOMContentLoaded',function(){records=makeRecords();state=readState();mount();schoolCards();taskHeader();prune();paint();bind();apply(false);});
})();
